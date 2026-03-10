/**
 * Parse CE Dept faculty timetable CSVs into a single combined timetable.csv
 * 
 * Each CSV has the format:
 * - Row 7 (index 6): Faculty code in col 8, Faculty name in col 9
 * - Row 8 (index 7): Header row with time slots
 * - Rows 9-13 (index 8-12): MON, TUE, WED, THR, FRI with 8 time slot columns
 * 
 * Cell formats:
 * 1. Simple inline: "COURSE-ROOM" e.g. "TE-CSBS-A3-CMA-520" or "SE-B1-CN-112C"
 * 2. Multi-line (quoted): "SUBJECT\nBATCH\nROOM"
 * 3. Empty cell = no class
 */

const fs = require('fs');
const path = require('path');

const CE_DIR = path.join(__dirname, '..', 'public', 'CE Dept FACULTY TIMETABLE-2025-26 EVEN SEM');
const OUTPUT_CSV = path.join(__dirname, '..', 'public', 'timetable.csv');

const TIME_SLOTS = [
    '9:00-10:00',
    '10:00-11:00',
    '11:00-12:00',
    '12:00-1:00',
    '1:00-2:00',
    '2:00-3:00',
    '3:00-4:00',
    '4:00-5:00',
];

const DAYS = ['MON', 'TUE', 'WED', 'THR', 'FRI'];

/**
 * Parse a CSV file properly handling quoted fields with newlines
 * Returns an array of rows, each row is an array of cell values
 */
function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const ch = content[i];

        if (inQuotes) {
            if (ch === '"') {
                // Check for escaped quote ""
                if (i + 1 < content.length && content[i + 1] === '"') {
                    currentCell += '"';
                    i++; // skip next quote
                } else {
                    inQuotes = false;
                }
            } else {
                currentCell += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                currentRow.push(currentCell);
                currentCell = '';
            } else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && i + 1 < content.length && content[i + 1] === '\n') {
                    i++; // skip \n after \r
                }
                currentRow.push(currentCell);
                currentCell = '';
                rows.push(currentRow);
                currentRow = [];
            } else {
                currentCell += ch;
            }
        }
    }

    // Push last cell and row
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }

    return rows;
}

/**
 * Parse a cell value into course and room.
 * 
 * Formats:
 * 1. Multi-line: "SUBJECT\nBATCH\nROOM" -> course = "SUBJECT BATCH", room = "ROOM"
 * 2. Inline with room: "COURSE-ROOM" where ROOM is the last dash-separated token
 *    e.g. "TE-CSBS-A3-CMA-520" -> course = "TE-CSBS-A3-CMA", room = "520"
 *    e.g. "SE-B1-CN-112C" -> course = "SE-B1-CN", room = "112C"
 * 3. Complex inline with spaces (already has room embedded)
 */
function parseCellValue(cellValue) {
    if (!cellValue || cellValue.trim() === '' || cellValue.trim() === ' ') {
        return null;
    }

    const trimmed = cellValue.trim();

    // Check if it's a multi-line value (has newlines)
    if (trimmed.includes('\n')) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length >= 3) {
            // Format: SUBJECT, BATCH, ROOM
            const room = lines[lines.length - 1].trim();
            const courseParts = lines.slice(0, lines.length - 1).map(l => l.trim());
            const course = courseParts.join(' ');
            return { course, room };
        } else if (lines.length === 2) {
            // Two-line format: could be:
            // 1. "SUBJECT\nROOM" (simple)
            // 2. "SUBJECT\nBATCH+ROOM" where room is at end of line with spaces
            //    e.g. "OE-DT\nSE-CSBS- (A+B)             625"
            const lastLine = lines[1].trim();

            // Check if last line ends with a room number (digits, optionally followed by a letter)
            const roomAtEndMatch = lastLine.match(/\s+(\d{1,5}[A-Za-z]?)\s*$/);
            if (roomAtEndMatch) {
                // Room is embedded at end of second line
                const room = roomAtEndMatch[1];
                const batch = lastLine.replace(/\s+\d{1,5}[A-Za-z]?\s*$/, '').trim();
                const course = (lines[0].trim() + (batch ? ' ' + batch : '')).trim();
                return { course, room };
            }

            // Check if the last line itself looks like just a room number
            if (/^\d{1,5}[A-Za-z]?$/.test(lastLine)) {
                return { course: lines[0].trim(), room: lastLine };
            }

            // Otherwise, last line is probably batch info with no room
            const course = lines.join(' ').trim();
            return { course, room: '' };
        } else if (lines.length === 1) {
            // Single line in quotes, treat as inline
            return parseInlineCell(lines[0]);
        }
        return null;
    }

    // Single line - inline format
    return parseInlineCell(trimmed);
}

/**
 * Parse a single-line (inline) cell value.
 * Format: "COURSE-ROOM" where ROOM is the last dash-separated token
 * Room numbers are typically numeric or alphanumeric like 520, 112C, 513A, 612-B, etc.
 */
function parseInlineCell(value) {
    if (!value || value.trim() === '' || value.trim() === ' ') {
        return null;
    }

    const trimmed = value.trim();

    // Find the last '-' and check if what follows looks like a room number
    const lastDashIdx = trimmed.lastIndexOf('-');

    if (lastDashIdx === -1) {
        // No dash at all - might be just a course name without room
        return { course: trimmed, room: '' };
    }

    const possibleRoom = trimmed.substring(lastDashIdx + 1).trim();
    const possibleCourse = trimmed.substring(0, lastDashIdx).trim();

    // Room numbers are typically: digits, or digits+letter, or digits+letter combo
    // e.g., 520, 112C, 513A, 612B, 005, 012, 213A, etc.
    if (/^\d{1,4}[A-Za-z]?$/.test(possibleRoom) || /^\d{1,4}-?[A-Za-z]?$/.test(possibleRoom)) {
        return { course: possibleCourse, room: possibleRoom };
    }

    // If the last token doesn't look like a room number, the whole thing is the course
    // This handles cases like "TE-(A3+C3)-PEC-II-DWM" where last part isn't a room
    return { course: trimmed, room: '' };
}

/**
 * Parse a single faculty CSV file
 */
function parseFacultyCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = parseCSV(content);

    const entries = [];

    // Find the faculty info row (row 7, index 6)
    // Format: ,,,,,,,16,/SSA,SHWETA ASHTEKAR,... or ,,,,,,,15,VPK,DR. VIVEK KHALANE,...
    let facultyCode = '';
    let facultyName = '';

    // Look for the row that contains the faculty code/name (usually row index 6)
    for (let i = 4; i <= 8; i++) {
        if (i >= rows.length) continue;
        const row = rows[i];

        // Faculty code is typically in column 8 (index 8), name in column 9
        // But can also be in column 7 and 8 depending on the file
        for (let j = 7; j < Math.min(row.length, 12); j++) {
            const cell = (row[j] || '').trim();
            // Faculty code starts with / or is 2-3 uppercase letters
            if (cell && (cell.startsWith('/') || /^[A-Z]{2,4}$/.test(cell))) {
                facultyCode = cell.replace(/^\//, '').trim();
                // Name should be in the next column
                if (j + 1 < row.length && row[j + 1] && row[j + 1].trim().length > 2) {
                    facultyName = row[j + 1].trim();
                }
                break;
            }
        }
        if (facultyCode) break;
    }

    if (!facultyCode) {
        // Fallback: try to extract from filename (e.g., "PDD-Table 1.csv" -> "PDD")
        const filename = path.basename(filePath, '.csv');
        const codeMatch = filename.match(/^-?([A-Z]{2,4})-/);
        if (codeMatch) {
            facultyCode = codeMatch[1];
        } else {
            console.warn(`  WARNING: Could not find faculty code in ${path.basename(filePath)}`);
            return [];
        }
    }

    // If no name found, use faculty code as placeholder
    if (!facultyName) {
        facultyName = facultyCode;
    }

    // Find the header row (Day/Time row)
    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] && rows[i][0] && rows[i][0].trim() === 'Day/Time') {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) {
        console.warn(`  WARNING: Could not find header row in ${path.basename(filePath)}`);
        return [];
    }

    // Parse each day row (5 rows after header)
    for (let d = 0; d < DAYS.length; d++) {
        const dayRowIdx = headerRowIdx + 1 + d;
        if (dayRowIdx >= rows.length) continue;

        const row = rows[dayRowIdx];
        if (!row || !row[0]) continue;

        const day = row[0].trim();
        if (!DAYS.includes(day)) {
            // Sometimes extra rows appear, skip
            continue;
        }

        // Parse each time slot (columns 1-8)
        // Key pattern: Inline entries (no newlines, like "SE-B3-SBLPython-513B") are 
        // 2-hour lab sessions from merged Excel cells. They span into the next empty slot.
        // Multi-line entries (with newlines, like "CNS\nTE-A\n626") are 1-hour lectures.
        let t = 0;
        while (t < TIME_SLOTS.length) {
            const colIdx = t + 1; // column 1 = 9:00-10:00, etc.
            if (colIdx >= row.length) { t++; continue; }

            const cellValue = (row[colIdx] || '').trim();
            if (!cellValue) { t++; continue; }

            const isInline = !cellValue.includes('\n');
            const parsed = parseCellValue(cellValue);

            if (parsed && parsed.course) {
                // Check if this is a 2-hour lab (inline entry followed by empty cell)
                const nextColIdx = colIdx + 1;
                const nextCellEmpty = nextColIdx < row.length ? !(row[nextColIdx] || '').trim() : false;
                const is2HourLab = isInline && nextCellEmpty && (t + 1) < TIME_SLOTS.length;

                if (is2HourLab) {
                    // Create a SINGLE entry with combined time slot (e.g. "11:00-1:00")
                    const startTime = TIME_SLOTS[t].split('-')[0];     // e.g. "11:00"
                    const endTime = TIME_SLOTS[t + 1].split('-')[1];   // e.g. "1:00"
                    const combinedSlot = `${startTime}-${endTime}`;

                    entries.push({
                        Faculty_Name: facultyName,
                        Faculty_Code: facultyCode,
                        Day: day,
                        Time_Slot: combinedSlot,
                        Course: parsed.course,
                        Room: parsed.room,
                    });
                    t += 2; // Skip the next (empty) slot
                } else {
                    // Single 1-hour lecture
                    entries.push({
                        Faculty_Name: facultyName,
                        Faculty_Code: facultyCode,
                        Day: day,
                        Time_Slot: TIME_SLOTS[t],
                        Course: parsed.course,
                        Room: parsed.room,
                    });
                    t++;
                }
            } else {
                t++;
            }
        }
    }

    return entries;
}

// ============ MAIN ============

console.log('=== CE Dept Faculty Timetable Parser ===\n');

// Get all CSV files (excluding Sample)
const files = fs.readdirSync(CE_DIR)
    .filter(f => f.endsWith('.csv') && !f.includes('Sample'))
    .sort();

console.log(`Found ${files.length} faculty CSV files\n`);

let allEntries = [];
let errorFiles = [];

for (const file of files) {
    const filePath = path.join(CE_DIR, file);
    try {
        const entries = parseFacultyCSV(filePath);
        if (entries.length > 0) {
            console.log(`✓ ${file}: ${entries[0].Faculty_Code} (${entries[0].Faculty_Name}) - ${entries.length} entries`);
            allEntries = allEntries.concat(entries);
        } else {
            console.log(`⚠ ${file}: No entries found`);
            errorFiles.push(file);
        }
    } catch (err) {
        console.error(`✗ ${file}: Error - ${err.message}`);
        errorFiles.push(file);
    }
}

// Generate output CSV
const header = 'Faculty_Name,Faculty_Code,Day,Time_Slot,Course,Room';
const csvLines = allEntries.map(e => {
    // Escape fields that might contain commas
    const escapeCsv = (val) => {
        if (val && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
            return `"${val.replace(/"/g, '""')}"`;
        }
        return val || '';
    };

    return [
        escapeCsv(e.Faculty_Name),
        escapeCsv(e.Faculty_Code),
        escapeCsv(e.Day),
        escapeCsv(e.Time_Slot),
        escapeCsv(e.Course),
        escapeCsv(e.Room),
    ].join(',');
});

const outputContent = [header, ...csvLines].join('\n') + '\n';
fs.writeFileSync(OUTPUT_CSV, outputContent);

console.log(`\n=== Summary ===`);
console.log(`Total faculty files processed: ${files.length}`);
console.log(`Total entries generated: ${allEntries.length}`);
console.log(`Output written to: ${OUTPUT_CSV}`);

if (errorFiles.length > 0) {
    console.log(`\nFiles with issues: ${errorFiles.join(', ')}`);
}

// Print a few sample entries to verify
console.log('\n=== Sample Entries ===');
const samples = allEntries.slice(0, 5);
samples.forEach(e => {
    console.log(`  ${e.Faculty_Code} | ${e.Faculty_Name} | ${e.Day} | ${e.Time_Slot} | ${e.Course} | Room: ${e.Room}`);
});

// Print per-faculty summary
console.log('\n=== Per-Faculty Summary ===');
const facultySummary = {};
allEntries.forEach(e => {
    const key = `${e.Faculty_Code} (${e.Faculty_Name})`;
    facultySummary[key] = (facultySummary[key] || 0) + 1;
});
Object.keys(facultySummary).sort().forEach(key => {
    console.log(`  ${key}: ${facultySummary[key]} classes/week`);
});
