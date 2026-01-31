const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '..', 'public', 'timetable.csv');
const DATA_DIR = path.join(__dirname, '..', 'data');
const JSON_FILE = path.join(DATA_DIR, 'timetable.json');

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += line[i];
        }
    }
    result.push(current.trim());
    return result;
}

if (!fs.existsSync(CSV_FILE)) {
    console.error(`Error: CSV file not found at ${CSV_FILE}`);
    process.exit(1);
}

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

try {
    const fileContents = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = fileContents.trim().split('\n');

    if (lines.length < 2) {
        console.warn('Warning: CSV file is empty or only has header');
        fs.writeFileSync(JSON_FILE, JSON.stringify([]));
        process.exit(0);
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const entry = {};
        headers.forEach((header, index) => {
            // Clean header key and value
            const key = header.replace(/^"|"$/g, '');
            const val = (values[index] || '').replace(/^"|"$/g, '');
            entry[key] = val;
        });
        data.push(entry);
    }

    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
    console.log(`Successfully converted ${lines.length - 1} records to ${JSON_FILE}`);

} catch (error) {
    console.error('Failed to convert CSV to JSON:', error);
    process.exit(1);
}
