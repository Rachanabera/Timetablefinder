const XLSX = require('xlsx');
const workbook = XLSX.readFile('Other Dept FACULTY TIMETABLE-2025-26 EVEN SEM.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Sheet Name:', workbook.SheetNames[0]);
console.log('Row 7 (index 6):', rows[6]);
console.log('Row 8 (index 7):', rows[7]);
console.log('Row 9 (index 8):', rows[8]);
