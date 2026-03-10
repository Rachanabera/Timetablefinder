import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { db } = await import('@/lib/firebase')
    const { doc, getDoc } = await import('firebase/firestore')

    // 1. Try Firestore first (Master Source)
    try {
      const docRef = doc(db, 'timetable_data', 'master');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().entries || [];
        return NextResponse.json(data);
      }
    } catch (e) {
      console.error('Firestore Read Error:', e);
    }

    // 2. Fallback to local JSON file 
    const jsonPath = path.join(process.cwd(), 'data', 'timetable.json')
    if (fs.existsSync(jsonPath)) {
      const fileContents = fs.readFileSync(jsonPath, 'utf8')
      const data = JSON.parse(fileContents)
      return NextResponse.json(data)
    }

    return NextResponse.json([], { status: 404 });
  } catch (error) {
    console.error('Error reading timetable:', error)
    return NextResponse.json({ error: 'Failed to load timetable data' }, { status: 500 })
  }
}