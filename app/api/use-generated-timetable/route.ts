// app/api/use-generated-timetable/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { generatedTimetable } = data

    // Convert generated timetable to standard format
    const standardFormat = generatedTimetable.schedules.map((slot: any) => {
      const studentGroup = slot.studentGroup.batch 
        ? `${slot.studentGroup.branch}-${slot.studentGroup.division}-${slot.studentGroup.batch}`
        : `${slot.studentGroup.branch}-${slot.studentGroup.division}`

      return {
        Day: slot.day,
        Time_Slot: slot.timeSlot,
        Course: slot.subject.name,
        Faculty_Code: slot.faculty.code,
        Faculty_Name: slot.faculty.name,
        Room: slot.room.number,
        Student_Group: studentGroup,
        Type: slot.isLab ? 'Lab' : 'Theory'
      }
    })

    // Save as new timetable.csv
    const filePath = path.join(process.cwd(), 'public', 'timetable1.csv')
    interface TimetableEntry {
    Day: string
    Time_Slot: string
    Course: string
    Faculty_Code: string
    Faculty_Name: string
    Room: string
    Student_Group: string
    Type: string
    }
    let csvContent = 'Day,Time_Slot,Course,Faculty_Code,Faculty_Name,Room,Student_Group,Type\n'
    // Then use it
    standardFormat.forEach((entry: TimetableEntry) => {
    csvContent += `${entry.Day},${entry.Time_Slot},${entry.Course},${entry.Faculty_Code},${entry.Faculty_Name},${entry.Room},${entry.Student_Group},${entry.Type}\n`
    })
    await writeFile(filePath, csvContent)

    return NextResponse.json({ 
      success: true, 
      message: 'Generated timetable is now active',
      entriesCount: standardFormat.length
    })
  } catch (error: any) {
    console.error('Error activating timetable:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
