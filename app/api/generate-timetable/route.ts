import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
 * Re-using core parsing logic from scripts/parse-ce-timetables.js
 */
function parseCellValue(cellValue: string) {
    if (!cellValue || cellValue.toString().trim() === '') {
        return null;
    }

    const trimmed = cellValue.toString().trim();

    // Check if it's a multi-line value (has newlines)
    if (trimmed.includes('\n')) {
        const lines = trimmed.split('\n').map(l => l.trim()).filter(l => l.length > 0);

        if (lines.length >= 3) {
            const room = lines[lines.length - 1].trim();
            const courseParts = lines.slice(0, lines.length - 1).map(l => l.trim());
            const course = courseParts.join(' ');
            return { course, room };
        } else if (lines.length === 2) {
            const lastLine = lines[1].trim();
            const roomAtEndMatch = lastLine.match(/\s+(\d{1,5}[A-Za-z]?)\s*$/);
            if (roomAtEndMatch) {
                const room = roomAtEndMatch[1];
                const batch = lastLine.replace(/\s+\d{1,5}[A-Za-z]?\s*$/, '').trim();
                const course = (lines[0].trim() + (batch ? ' ' + batch : '')).trim();
                return { course, room };
            }
            if (/^\d{1,5}[A-Za-z]?$/.test(lastLine)) {
                return { course: lines[0].trim(), room: lastLine };
            }
            return { course: lines.join(' ').trim(), room: '' };
        } else if (lines.length === 1) {
            return parseInlineCell(lines[0]);
        }
        return null;
    }

    return parseInlineCell(trimmed);
}

function parseInlineCell(value: string) {
    if (!value || value.trim() === '') return null;
    const trimmed = value.trim();
    const lastDashIdx = trimmed.lastIndexOf('-');

    if (lastDashIdx === -1) {
        return { course: trimmed, room: '' };
    }

    const possibleRoom = trimmed.substring(lastDashIdx + 1).trim();
    const possibleCourse = trimmed.substring(0, lastDashIdx).trim();

    if (/^\d{1,4}[A-Za-z]?$/.test(possibleRoom) || /^\d{1,4}-?[A-Za-z]?$/.test(possibleRoom)) {
        return { course: possibleCourse, room: possibleRoom };
    }
    return { course: trimmed, room: '' };
}

function parseSheetGrid(rows: any[][], sheetName: string) {
    const entries: any[] = [];
    let facultyCode = '';
    let facultyName = '';

    // Extract faculty info (looking near row 7, index 6)
    for (let i = 4; i <= 8; i++) {
        if (i >= rows.length) continue;
        const row = rows[i];
        if (!row) continue;
        for (let j = 7; j < Math.min(row.length, 12); j++) {
            const cell = (row[j] || '').toString().trim();
            if (cell && (cell.startsWith('/') || /^[A-Z]{2,4}$/.test(cell))) {
                facultyCode = cell.replace(/^\//, '').trim();
                if (j + 1 < row.length && row[j + 1] && row[j + 1].toString().trim().length > 2) {
                    facultyName = row[j + 1].toString().trim();
                }
                break;
            }
        }
        if (facultyCode) break;
    }

    if (!facultyCode) {
        // Fallback to sheet name if code not found in content
        const codeMatch = sheetName.match(/([A-Z]{2,4})/);
        facultyCode = codeMatch ? codeMatch[1] : sheetName.toUpperCase();
        facultyName = facultyCode;
    } else if (!facultyName) {
        facultyName = facultyCode;
    }

    // Find header row "Day/Time"
    let headerRowIdx = -1;
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] && rows[i][0] && rows[i][0].toString().trim() === 'Day/Time') {
            headerRowIdx = i;
            break;
        }
    }

    if (headerRowIdx === -1) return [];

    // Parse Day Rows
    for (let d = 0; d < DAYS.length; d++) {
        const dayRowIdx = headerRowIdx + 1 + d;
        if (dayRowIdx >= rows.length) continue;
        const row = rows[dayRowIdx];
        if (!row || !row[0]) continue;

        const day = row[0].toString().trim();
        if (!DAYS.includes(day)) continue;

        let t = 0;
        while (t < TIME_SLOTS.length) {
            const colIdx = t + 1;
            if (colIdx >= row.length) { t++; continue; }

            const cellValue = (row[colIdx] || '').toString().trim();
            if (!cellValue) { t++; continue; }

            const isInline = !cellValue.includes('\n');
            const parsed = parseCellValue(cellValue);

            if (parsed && parsed.course) {
                // Check for 2-hour lab
                const nextColIdx = colIdx + 1;
                const nextCellEmpty = nextColIdx < row.length ? !(row[nextColIdx] || '').toString().trim() : false;
                const is2HourLab = isInline && nextCellEmpty && (t + 1) < TIME_SLOTS.length;

                if (is2HourLab) {
                    const startTime = TIME_SLOTS[t].split('-')[0];
                    const endTime = TIME_SLOTS[t + 1].split('-')[1];
                    entries.push({
                        Faculty_Name: facultyName,
                        Faculty_Code: facultyCode,
                        Day: day,
                        Time_Slot: `${startTime}-${endTime}`,
                        Course: parsed.course,
                        Room: parsed.room,
                    });
                    t += 2;
                } else {
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

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        let allEntries: any[] = [];
        let facultyCount = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            // Convert to 2D array representing the grid
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            const sheetEntries = parseSheetGrid(rows, sheetName);
            if (sheetEntries.length > 0) {
                allEntries = [...allEntries, ...sheetEntries];
                facultyCount++;
            }
        });

        if (allEntries.length === 0) {
            return NextResponse.json({ error: 'No valid timetable entries found in the file' }, { status: 400 });
        }

        // === DATABASE MERGE LOGIC (FIRESTORE) ===
        let existingEntries: any[] = [];
        const timetableDocRef = doc(db, 'timetable_data', 'master');

        try {
            const docSnap = await getDoc(timetableDocRef);
            if (docSnap.exists()) {
                existingEntries = docSnap.data().entries || [];
            } else {
                // Fallback to local file if Firestore is empty (for migration)
                const dataDir = path.join(process.cwd(), 'data');
                const jsonPath = path.join(dataDir, 'timetable.json');
                if (fs.existsSync(jsonPath)) {
                    const content = fs.readFileSync(jsonPath, 'utf8');
                    existingEntries = JSON.parse(content);
                }
            }
        } catch (e) {
            console.error('Error fetching from Firestore:', e);
        }

        // Get list of faculty codes being uploaded
        const uploadedFacultyCodes = new Set(allEntries.map(e => e.Faculty_Code));

        // Merge: keep standard entries from other faculties, replace ones being uploaded
        const mergedEntries = [
            ...existingEntries.filter(e => !uploadedFacultyCodes.has(e.Faculty_Code)),
            ...allEntries
        ];

        // Recalculate unique faculty count in merged set
        const totalFaculties = new Set(mergedEntries.map(e => e.Faculty_Code)).size;

        // Save to Firestore
        try {
            await setDoc(timetableDocRef, {
                entries: mergedEntries,
                updatedAt: new Date().toISOString(),
                facultyCount: totalFaculties
            });
        } catch (e) {
            console.error('Error saving to Firestore:', e);
            throw new Error('Failed to save to database');
        }

        // === OPTIONAL: LOCAL FILESYSTEM SYNC (Will only work in local dev) ===
        try {
            const dataDir = path.join(process.cwd(), 'data');
            const publicDir = path.join(process.cwd(), 'public');
            const jsonPath = path.join(dataDir, 'timetable.json');
            const csvPath = path.join(publicDir, 'timetable.csv');

            if (fs.existsSync(dataDir)) {
                // Generate CSV
                const header = 'Faculty_Name,Faculty_Code,Day,Time_Slot,Course,Room';
                const escapeCsv = (val: string) => {
                    if (val && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
                        return `"${val.toString().replace(/"/g, '""')}"`;
                    }
                    return val || '';
                };
                const csvLines = mergedEntries.map(e => [
                    escapeCsv(e.Faculty_Name),
                    escapeCsv(e.Faculty_Code),
                    escapeCsv(e.Day),
                    escapeCsv(e.Time_Slot),
                    escapeCsv(e.Course),
                    escapeCsv(e.Room),
                ].join(','));
                const csvContent = [header, ...csvLines].join('\n') + '\n';

                fs.writeFileSync(csvPath, csvContent);
                fs.writeFileSync(jsonPath, JSON.stringify(mergedEntries, null, 2));
            }
        } catch (e) {
            console.warn('Local FS sync skipped (expected in production)');
        }

        return NextResponse.json({
            success: true,
            facultyCount: totalFaculties,
            newFacultyCount: facultyCount,
            entryCount: mergedEntries.length,
            message: `Timetable merged successfully! Total faculties: ${totalFaculties}`
        });

    } catch (error: any) {
        console.error('Generator Error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
