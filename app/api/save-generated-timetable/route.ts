// app/api/save-generated-timetable/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { timetable, filename } = data

    // Convert to CSV format
    let csvContent = 'Day,Time_Slot,Subject,Faculty_Code,Faculty_Name,Room,Student_Group,Type\n'

    timetable.schedules.forEach((slot: any) => {
      const studentGroup = slot.studentGroup.batch 
        ? `${slot.studentGroup.branch}-${slot.studentGroup.division}-${slot.studentGroup.batch}`
        : `${slot.studentGroup.branch}-${slot.studentGroup.division}`

      csvContent += `${slot.day},${slot.timeSlot},${slot.subject.name},${slot.faculty.code},${slot.faculty.name},${slot.room.number},${studentGroup},${slot.isLab ? 'Lab' : 'Theory'}\n`
    })

    // Ensure generated folder exists
    const generatedPath = path.join(process.cwd(), 'public', 'generated')
    try {
      await mkdir(generatedPath, { recursive: true })
    } catch (err) {
      // Folder already exists
    }

    // Save to public folder
    const filePath = path.join(generatedPath, filename)
    await writeFile(filePath, csvContent)

    return NextResponse.json({ 
      success: true, 
      message: 'Timetable saved successfully',
      path: `/generated/${filename}`
    })
  } catch (error: any) {
    console.error('Error saving timetable:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}
