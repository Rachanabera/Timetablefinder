// app/api/use-generated-timetable/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, writeBatch, doc } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { generatedTimetable } = data

    // Convert generated timetable to standard format
    const newEntries = generatedTimetable.schedules.map((slot: any) => {
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

    // Save to Firestore
    const batch = writeBatch(db)
    const collectionRef = collection(db, 'timetables')

    // Simple batch strategy
    const CHUNK_SIZE = 450
    for (let i = 0; i < newEntries.length; i += CHUNK_SIZE) {
      const chunk = newEntries.slice(i, i + CHUNK_SIZE)
      const chunkBatch = writeBatch(db)
      chunk.forEach((entry: any) => {
        const docRef = doc(collectionRef)
        chunkBatch.set(docRef, entry)
      })
      await chunkBatch.commit()
    }

    return NextResponse.json({
      success: true,
      message: 'Generated timetable is now active in database',
      entriesCount: newEntries.length
    })
  } catch (error: any) {
    console.error('Error activating timetable:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
