const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const EXCEL_FILES = [
    'CE Dept FACULTY TIMETABLE-2025-26 EVEN SEM.xlsx',
    'Other Dept FACULTY TIMETABLE-2025-26 EVEN SEM.xlsx'
];
const OUTPUT_FILE = path.join(__dirname, 'public', 'timetable.csv');

// Regex to identify time slots (e.g., "9:00 to 10:00")
const TIME_SLOT_REGEX = /\d{1,2}:\d{2}\s*to\s*\d{1,2}:\d{2}/i;

// Header for the CSV
const CSV_HEADER = 'Faculty_Name,Faculty_Code,Day,Time_Slot,Course,Room';

const allEntries = [];

function cleanText(text) {
    return text ? text.toString().trim() : '';
}

function normalizeTimeSlot(slot) {
    // Convert "9:00 to 10:00" -> "9:00-10:00"
    return slot.replace(/\s+to\s+/i, '-');
}

EXCEL_FILES.forEach(file => {
    if (!fs.existsSync(file)) {
        console.warn(`File not found: ${file}`);
        return;
    }

    console.log(`Processing file: ${file}`);
    const workbook = XLSX.readFile(file);

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        // Parse sheet to JSON array (array of arrays)
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        if (data.length < 10) {
            // Skip empty or too short sheets
            return;
        }

        // 1. Locate Metadata (Faculty Name/Code)
        // Usually around Row 6 (index 6).
        // Check row 6 columns I (8) and J (9) first.
        let facultyCode = '';
        let facultyName = '';

        const row6 = data[6] || [];
        const possibleCode = cleanText(row6[8]); // Cell I7
        const possibleName = cleanText(row6[9]); // Cell J7

        // Heuristic: Code usually starts with "/" (e.g. "/SK") or is just initials
        if (possibleCode.startsWith('/') || possibleCode.length > 0) {
            facultyCode = possibleCode.replace('/', '').trim();
        }
        if (possibleName.length > 0) {
            facultyName = possibleName;
        }

        // Fallback: Sometimes it might be in different columns or row.
        // If name is empty, try to use sheet name as fallback Name?
        if (!facultyName) {
            // Try to find "Name" label?
            // For now, let's assume the standard format.
            // If we missed it, warn.
            // console.warn(`Could not find faculty name in sheet ${sheetName}`);
            // Fallback to sheetname if absolutely necessary?
            // facultyName = sheetName;
        }

        if (!facultyName || !facultyCode) {
            // Try searching row 6 for non-empty cells
            if (row6.length > 0) {
                // Try to find the name/code by looking at the last few columns
                for (let k = row6.length - 1; k >= 0; k--) {
                    let cell = cleanText(row6[k]);
                    if (cell && !facultyName) {
                        facultyName = cell;
                    } else if (cell && facultyName && !facultyCode) {
                        facultyCode = cell.replace('/', '').trim();
                        break;
                    }
                }
            }
        }

        if (!facultyName) facultyName = sheetName; // Last resort
        if (!facultyCode) facultyCode = facultyName.substring(0, 3).toUpperCase();

        // Filter out dummy/template data
        if (facultyName === 'ABCD' || facultyCode === 'XXX' || facultyName.includes('Faculty Name')) {
            return;
        }

        // 2. Locate Header Row for Time Slots
        // Typically Row 7 (index 7).
        const row7 = data[7] || [];
        const timeSlotIndices = {}; // map index -> time string

        row7.forEach((cell, index) => {
            const txt = cleanText(cell);
            if (TIME_SLOT_REGEX.test(txt)) {
                timeSlotIndices[index] = normalizeTimeSlot(txt);
            }
        });

        if (Object.keys(timeSlotIndices).length === 0) {
            // console.warn(`No time slots found in sheet ${sheetName}`);
            return;
        }

        // 3. Iterate Days (MON-FRI)
        // Typically Rows 8 to 12.
        // We look for "MON", "TUE", etc. in the first column (index 0).
        for (let r = 8; r < data.length; r++) {
            const row = data[r] || [];
            const dayCell = cleanText(row[0]).toUpperCase();

            const VALID_DAYS = ['MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT']; // 'THR' is often used instead of 'THU' in strict timetable formats
            let currentDay = '';

            // Fuzzy match day
            if (VALID_DAYS.some(d => dayCell.includes(d))) {
                currentDay = dayCell.substring(0, 3);
            }

            if (!currentDay) continue; // Not a day row

            // Check each time slot column
            Object.keys(timeSlotIndices).forEach(colIndex => {
                const cellContent = cleanText(row[colIndex]);
                if (cellContent) {
                    // Parse Content: Subject\nClass\nRoom
                    // E.g. "BCVS\nTE-CSBS\n415"
                    // Sometimes lines are split by \r\n or just \n
                    const parts = cellContent.split(/\r?\n/).map(p => p.trim()).filter(p => p);

                    if (parts.length > 0) {
                        let course = '';
                        let room = '';

                        // Heuristic: Last part is typically Room if it looks like a number or short alphanum
                        // But sometimes it is Subject Class Room.
                        // Common patterns:
                        // 3 parts: [Subject, Class, Room]
                        // 2 parts: [Subject+Class, Room] or [Subject, Class+Room] ?

                        // We will try to preserve as much as possible.
                        // Existing CSV: Course = "MTECH-ANS", Room = "213-A"

                        if (parts.length >= 2) {
                            room = parts[parts.length - 1]; // Assume last line is room
                            course = parts.slice(0, parts.length - 1).join(' '); // Join rest as course
                        } else {
                            course = parts[0];
                            room = ''; // Unknown?
                        }

                        // Sanitize to avoid CSV breakage
                        course = course.replace(/,/g, ' ');
                        room = room.replace(/,/g, ' ');

                        // Fix: Check if room is empty and course ends with a room-like pattern (e.g. -520)
                        if (!room) {
                            // Pattern: Ends with hyphen followed by 3-4 alphanumeric chars (mostly digits)
                            const roomMatch = course.match(/^(.*)[-\s](\d{3}[A-Za-z]?)$/);
                            if (roomMatch) {
                                course = roomMatch[1];
                                room = roomMatch[2];
                            }
                        }

                        // Sanitize to avoid CSV breakage
                        course = course.replace(/,/g, ' ');
                        room = room.replace(/,/g, ' ');

                        allEntries.push({
                            Faculty_Name: facultyName,
                            Faculty_Code: facultyCode,
                            Day: currentDay,
                            Time_Slot: timeSlotIndices[colIndex],
                            Course: course,
                            Room: room
                        });
                    }
                }
            });
        }
    });
});

// Write to CSV
const csvLines = [CSV_HEADER];
allEntries.forEach(e => {
    csvLines.push(`${e.Faculty_Name},${e.Faculty_Code},${e.Day},${e.Time_Slot},${e.Course},${e.Room}`);
});

fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'));
console.log(`Successfully generated ${OUTPUT_FILE} with ${allEntries.length} entries.`);
