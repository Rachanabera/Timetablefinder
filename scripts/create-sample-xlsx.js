const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create a sample faculty timetable grid
function createSampleSheet() {
    const data = [];

    // Rows 1-4: Empty
    for (let i = 0; i < 4; i++) data.push([]);

    // Row 5: Dept Name
    data.push(['Department of Sample Engineering']);

    // Row 6: Semester
    data.push(['Time Table 2025-26']);

    // Row 7: Faculty Info (Code in col 8, Name in col 9)
    const infoRow = new Array(10).fill('');
    infoRow[7] = '/SMP'; // Faculty Code
    infoRow[8] = 'SAMPLE FACULTY'; // Faculty Name
    data.push(infoRow);

    // Row 8: Header
    data.push(['Day/Time', '9:00 to 10:00', '10:00 to 11:00', '11:00 to 12:00', '12:00 to 1:00', '1:00 to 2:00', '2:00 to 3:00', '3:00 to 4:00', '4:00 to 5:00']);

    // Rows 9-13: Days
    const slots = [
        ['MON', '', 'CNS\nTE-A\n626', 'SE-B3-SBLPython-513B', '', '', '', '', ''],
        ['TUE', '', 'SBLPython\nSE-B\n505', '', '', '', 'CNS\nTE-A\n626', '', ''],
        ['WED', '', 'SBLPython\nSE-B\n505', 'SE-B2-SBLPython-513B', '', '', 'TE-A3-CNS-520', '', ''],
        ['THR', '', '', 'SE-B1-SBLPython-513B', '', 'TE-A1-CNS-520', '', '', ''],
        ['FRI', 'CNS\nTE-A\n626', '', 'TE-A2-CNS-518A', '', '', '', '', '']
    ];

    slots.forEach(row => data.push(row));

    return XLSX.utils.aoa_to_sheet(data);
}

const wb = XLSX.utils.book_new();
const ws = createSampleSheet();
XLSX.utils.book_append_sheet(wb, ws, 'SMP-Table 1');

const outPath = path.join(__dirname, 'sample-timetable.xlsx');
XLSX.writeFile(wb, outPath);

console.log(`Sample Excel file created at: ${outPath}`);
