// lib/csv-parser.ts
// UPDATED CSV Parser with Faculty Subject Assignment

import { Faculty, Room, Subject, StudentGroup } from './generator-types'

export class CSVParser {
  // Parse Faculty CSV with Subject Assignment
  static parseFaculties(csvText: string): Faculty[] {
    const lines = csvText.trim().split('\n').slice(1) // Skip header
    return lines.map(line => {
      const [code, name, loadHours, subject1, subject2, subject3, subject4, isTA] = 
        line.split(',').map(s => s.trim())

      return {
        code,
        name,
        loadHours: parseInt(loadHours),
        subject1: subject1 || undefined,
        subject2: subject2 || undefined,
        subject3: subject3 || undefined,
        subject4: subject4 || undefined,
        isTA: isTA.toLowerCase() === 'yes',
        assignedHours: 0
      }
    })
  }

  // Parse Rooms CSV (no capacity)
  static parseRooms(csvText: string): Room[] {
    const lines = csvText.trim().split('\n').slice(1)
    return lines.map(line => {
      const [number, type] = line.split(',').map(s => s.trim())
      return {
        number,
        type: type.toLowerCase() as 'classroom' | 'lab'
      }
    })
  }

  // Parse Subjects CSV
  static parseSubjects(csvText: string): Subject[] {
    const lines = csvText.trim().split('\n').slice(1)
    return lines.map(line => {
      const [code, name, theoryHours, practicalHours, branch, isMinor] = 
        line.split(',').map(s => s.trim())
      return {
        code,
        name,
        theoryHours: parseInt(theoryHours),
        practicalHours: parseInt(practicalHours),
        branch,
        isMinor: isMinor.toLowerCase() === 'yes'
      }
    })
  }

  // Parse Student Groups CSV
  static parseStudentGroups(csvText: string): StudentGroup[] {
    const lines = csvText.trim().split('\n').slice(1)
    return lines.map(line => {
      const [branch, division, batch, studentCount] = line.split(',').map(s => s.trim())
      return {
        branch,
        division,
        batch: batch || undefined,
        studentCount: parseInt(studentCount)
      }
    })
  }

  // Generate CSV templates with NEW format
  static generateFacultyTemplate(): string {
    return 'Code,Name,Load Hours,Subject1,Subject2,Subject3,Subject4,IsTA\n' +
           'APG,Archana P. Ghate,18,COOS,SC,DS,CI,no\n' +
           'VAH-TA,Vaishnavi Hingmire,20,AWT,CAL,PEC,SBL,yes\n'
  }

  static generateRoomTemplate(): string {
    return 'Room Number,Type\n518A,lab\n414,classroom\n'
  }

  static generateSubjectTemplate(): string {
    return 'Subject Code,Subject Name,Theory Hours,Practical Hours,Branch,Is Minor\n' +
           'DBMS,Database Management System,3,2,CE,no\n' +
           'BDA,Big Data Analytics,3,2,CSBS,no\n'
  }

  static generateStudentGroupTemplate(): string {
    return 'Branch,Division,Batch,Student Count\n' +
           'CE,A,A1,25\nCE,A,A2,25\nCSBS,A,A1,25\n'
  }
}
