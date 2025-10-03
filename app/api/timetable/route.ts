import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'timetable.csv')
    const fileContents = await fs.readFile(filePath, 'utf8')

    const lines = fileContents.trim().split('\n')
    const headers = lines[0].split(',')
    const data = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const entry: any = {}
      headers.forEach((header, index) => {
        entry[header] = values[index] || ''
      })
      data.push(entry)
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error reading timetable:', error)
    return NextResponse.json({ error: 'Failed to load timetable data' }, { status: 500 })
  }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += line[i]
    }
  }
  result.push(current.trim())
  return result
}