// lib/timetable-generator.ts
// COMPLETE ENHANCED Timetable Generator with Subject-Faculty Matching
// Version 2.0 - Real World College Data

import {
  Faculty,
  Room,
  Subject,
  StudentGroup,
  ScheduleSlot,
  GeneratedTimetable,
  GeneratorConfig,
  Conflict,
  GenerationStatistics
} from './generator-types'

export class TimetableGenerator {
  private config: GeneratorConfig
  private schedules: ScheduleSlot[] = []
  private conflicts: Conflict[] = []
  private facultySchedule: Map<string, ScheduleSlot[]> = new Map()
  private roomSchedule: Map<string, ScheduleSlot[]> = new Map()
  private studentSchedule: Map<string, ScheduleSlot[]> = new Map()

  constructor(config: GeneratorConfig) {
    this.config = config
  }

  generate(): GeneratedTimetable {
    const startTime = Date.now()

    console.log('🚀 Starting ENHANCED timetable generation...')
    console.log('📊 Configuration:', {
      faculties: this.config.faculties.length,
      rooms: this.config.rooms.length,
      subjects: this.config.subjects.length,
      studentGroups: this.config.studentGroups.length,
      labs: this.config.rooms.filter(r => r.type === 'lab').length,
      classrooms: this.config.rooms.filter(r => r.type === 'classroom').length
    })

    // Step 1: Initialize data structures
    this.initializeSchedules()

    // Step 2: Assign labs first (stricter constraints)
    this.assignLabs()

    // Step 3: Assign theory lectures
    this.assignTheoryLectures()

    // Step 4: Validate and detect conflicts
    this.validateSchedule()

    // Step 5: Calculate statistics
    const statistics = this.calculateStatistics(Date.now() - startTime)

    console.log('✅ Generation complete!')
    console.log('📈 Results:', {
      totalScheduled: statistics.assignedSlots,
      conflicts: this.conflicts.length,
      criticalConflicts: this.conflicts.filter(c => c.severity === 'critical').length,
      timeMs: statistics.generationTime
    })

    return {
      schedules: this.schedules,
      facultyTimetables: this.facultySchedule,
      roomTimetables: this.roomSchedule,
      studentTimetables: this.studentSchedule,
      conflicts: this.conflicts,
      statistics
    }
  }

  private initializeSchedules() {
    this.config.faculties.forEach(f => this.facultySchedule.set(f.code, []))
    this.config.rooms.forEach(r => this.roomSchedule.set(r.number, []))

    // Group students by division for theory classes
    const divisions = new Set<string>()
    this.config.studentGroups.forEach(g => {
      const key = `${g.branch}-${g.division}`
      divisions.add(key)
      this.studentSchedule.set(key, [])
    })

    // Individual batches for labs
    this.config.studentGroups.forEach(g => {
      if (g.batch) {
        const key = `${g.branch}-${g.division}-${g.batch}`
        this.studentSchedule.set(key, [])
      }
    })
  }

  // ==================== SUBJECT-FACULTY MATCHING ====================

  private canFacultyTeachSubject(faculty: Faculty, subjectCode: string): boolean {
    const subjects = [
      faculty.subject1,
      faculty.subject2,
      faculty.subject3,
      faculty.subject4
    ].filter(s => s && s.length > 0)

    if (subjects.length === 0) {
      // If no subjects assigned, faculty can teach anything (fallback)
      return true
    }

    // Check if any of faculty's subjects match the subject code
    return subjects.some(s => {
      // Extract base code (e.g., "PEC" from "PEC-I-CS")
      const baseSubjectCode = subjectCode.split('-')[0]
      const baseFacultySubject = s.split('-')[0]

      return (
        subjectCode.includes(s) || 
        s.includes(subjectCode) ||
        baseSubjectCode === baseFacultySubject ||
        subjectCode === s
      )
    })
  }

  // ==================== LAB ASSIGNMENT ====================

  private assignLabs() {
    console.log('📚 Assigning labs with subject-faculty matching...')

    const labSubjects = this.config.subjects.filter(s => s.practicalHours > 0)
    console.log(`   Found ${labSubjects.length} subjects with lab hours`)

    for (const subject of labSubjects) {
      const groups = this.config.studentGroups.filter(g => 
        g.branch === subject.branch && g.batch
      )

      console.log(`   ${subject.code}: ${groups.length} batches × ${subject.practicalHours} hours`)

      for (const group of groups) {
        const hoursNeeded = subject.practicalHours
        let hoursAssigned = 0

        while (hoursAssigned < hoursNeeded) {
          const slot = this.findBestLabSlot(subject, group)

          if (slot) {
            this.addScheduleSlot(slot)
            hoursAssigned++
          } else {
            this.conflicts.push({
              type: 'constraint',
              description: `Cannot assign lab for ${subject.name} (${subject.code}) to ${group.branch}-${group.division}-${group.batch}. No qualified TA or lab room available.`,
              slots: [],
              severity: 'critical'
            })
            break
          }
        }
      }
    }
  }

  private findBestLabSlot(subject: Subject, group: StudentGroup): ScheduleSlot | null {
    // Prefer afternoon slots for labs
    const preferredSlots = ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00']

    for (const day of this.config.days) {
      // Constraint: Only one lab per day
      if (this.hasLabOnDay(group, day)) continue

      for (const timeSlot of preferredSlots) {
        // Find available lab room
        const room = this.findAvailableRoom('lab', day, timeSlot)
        if (!room) continue

        // Find qualified TA
        const faculty = this.findQualifiedFaculty(subject, day, timeSlot, true)
        if (!faculty) continue

        // Check student group availability
        const studentKey = `${group.branch}-${group.division}-${group.batch}`
        if (this.isStudentGroupBusy(studentKey, day, timeSlot)) continue

        return {
          day,
          timeSlot,
          subject,
          faculty,
          room,
          studentGroup: group,
          isLab: true
        }
      }
    }

    return null
  }

  // ==================== THEORY ASSIGNMENT ====================

  private assignTheoryLectures() {
    console.log('📖 Assigning theory lectures with subject-faculty matching...')

    const theorySubjects = this.config.subjects.filter(s => s.theoryHours > 0)
    console.log(`   Found ${theorySubjects.length} subjects with theory hours`)

    for (const subject of theorySubjects) {
      // Get divisions for this branch (not batches)
      const divisions = [...new Set(
        this.config.studentGroups
          .filter(g => g.branch === subject.branch)
          .map(g => `${g.branch}-${g.division}`)
      )]

      console.log(`   ${subject.code}: ${divisions.length} divisions × ${subject.theoryHours} hours`)

      for (const divisionKey of divisions) {
        const [branch, division] = divisionKey.split('-')
        const totalStudents = this.config.studentGroups
          .filter(g => g.branch === branch && g.division === division)
          .reduce((sum, g) => sum + g.studentCount, 0)

        const hoursNeeded = subject.theoryHours
        let hoursAssigned = 0

        while (hoursAssigned < hoursNeeded) {
          const slot = this.findBestTheorySlot(subject, divisionKey, totalStudents)

          if (slot) {
            this.addScheduleSlot(slot)
            hoursAssigned++
          } else {
            this.conflicts.push({
              type: 'constraint',
              description: `Cannot assign theory for ${subject.name} (${subject.code}) to ${divisionKey}. No qualified faculty or classroom available.`,
              slots: [],
              severity: 'warning'
            })
            break
          }
        }
      }
    }
  }

  private findBestTheorySlot(subject: Subject, divisionKey: string, studentCount: number): ScheduleSlot | null {
    for (const day of this.config.days) {
      for (const timeSlot of this.config.timeSlots) {
        // Skip afternoon slots (prefer morning for theory)
        const hour = parseInt(timeSlot.split(':')[0])
        if (hour >= 13) continue

        // Find available classroom
        const room = this.findAvailableRoom('classroom', day, timeSlot)
        if (!room) continue

        // Find qualified non-TA faculty
        const faculty = this.findQualifiedFaculty(subject, day, timeSlot, false)
        if (!faculty) continue

        // Constraint: No more than 2 consecutive lectures
        if (this.hasConsecutiveLectures(faculty, day, timeSlot)) continue

        // Check student availability
        if (this.isStudentGroupBusy(divisionKey, day, timeSlot)) continue

        // Create student group for division
        const [branch, division] = divisionKey.split('-')
        const studentGroup: StudentGroup = {
          branch,
          division,
          studentCount
        }

        return {
          day,
          timeSlot,
          subject,
          faculty,
          room,
          studentGroup,
          isLab: false
        }
      }
    }

    return null
  }

  // ==================== FACULTY & ROOM FINDING ====================

  private findQualifiedFaculty(subject: Subject, day: string, timeSlot: string, labOnly: boolean): Faculty | null {
    const suitableFaculties = this.config.faculties.filter(f => {
      // Check TA requirement
      if (labOnly && !f.isTA) return false
      if (!labOnly && f.isTA) return false

      // Check if faculty can teach this subject
      if (!this.canFacultyTeachSubject(f, subject.code)) return false

      // Check load availability
      return f.assignedHours < f.loadHours
    })

    // Sort by least assigned hours (balance workload)
    suitableFaculties.sort((a, b) => a.assignedHours - b.assignedHours)

    for (const faculty of suitableFaculties) {
      const facultySlots = this.facultySchedule.get(faculty.code) || []
      const isOccupied = facultySlots.some(s => s.day === day && s.timeSlot === timeSlot)

      if (!isOccupied) {
        // Check daily hours limit
        const dailyHours = facultySlots.filter(s => s.day === day).length
        if (dailyHours >= this.config.constraints.maxDailyHoursPerFaculty) continue

        return faculty
      }
    }

    return null
  }

  private findAvailableRoom(type: 'classroom' | 'lab', day: string, timeSlot: string): Room | null {
    const suitableRooms = this.config.rooms.filter(r => r.type === type)

    for (const room of suitableRooms) {
      const roomSlots = this.roomSchedule.get(room.number) || []
      const isOccupied = roomSlots.some(s => s.day === day && s.timeSlot === timeSlot)

      if (!isOccupied) return room
    }

    return null
  }

  // ==================== CONSTRAINT CHECKS ====================

  private hasLabOnDay(group: StudentGroup, day: string): boolean {
    const key = `${group.branch}-${group.division}-${group.batch}`
    const slots = this.studentSchedule.get(key) || []
    return slots.some(s => s.day === day && s.isLab)
  }

  private hasConsecutiveLectures(faculty: Faculty, day: string, timeSlot: string): boolean {
    const slots = this.facultySchedule.get(faculty.code) || []
    const daySlots = slots.filter(s => s.day === day).map(s => s.timeSlot)

    const timeSlots = this.config.timeSlots
    const currentIndex = timeSlots.indexOf(timeSlot)

    if (currentIndex === -1) return false

    // Check for consecutive lectures before this slot
    let consecutiveCount = 0
    for (let i = currentIndex - 1; i >= 0 && i >= currentIndex - 2; i--) {
      if (daySlots.includes(timeSlots[i])) consecutiveCount++
      else break
    }

    return consecutiveCount >= this.config.constraints.maxConsecutiveLectures
  }

  private isStudentGroupBusy(groupKey: string, day: string, timeSlot: string): boolean {
    const slots = this.studentSchedule.get(groupKey) || []
    return slots.some(s => s.day === day && s.timeSlot === timeSlot)
  }

  // ==================== SCHEDULE MANAGEMENT ====================

  private addScheduleSlot(slot: ScheduleSlot) {
    this.schedules.push(slot)

    // Update faculty schedule
    const facultySlots = this.facultySchedule.get(slot.faculty.code) || []
    facultySlots.push(slot)
    this.facultySchedule.set(slot.faculty.code, facultySlots)
    slot.faculty.assignedHours++

    // Update room schedule
    const roomSlots = this.roomSchedule.get(slot.room.number) || []
    roomSlots.push(slot)
    this.roomSchedule.set(slot.room.number, roomSlots)

    // Update student schedule
    const studentKey = slot.studentGroup.batch 
      ? `${slot.studentGroup.branch}-${slot.studentGroup.division}-${slot.studentGroup.batch}`
      : `${slot.studentGroup.branch}-${slot.studentGroup.division}`

    const studentSlots = this.studentSchedule.get(studentKey) || []
    studentSlots.push(slot)
    this.studentSchedule.set(studentKey, studentSlots)
  }

  // ==================== VALIDATION ====================

  private validateSchedule() {
    console.log('✔️  Validating schedule...')

    // Check for room conflicts
    this.roomSchedule.forEach((slots, room) => {
      const conflicts = this.findTimeConflicts(slots)
      if (conflicts.length > 0) {
        this.conflicts.push({
          type: 'room',
          description: `Room ${room} has ${conflicts.length / 2} overlapping bookings`,
          slots: conflicts,
          severity: 'critical'
        })
      }
    })

    // Check for faculty conflicts
    this.facultySchedule.forEach((slots, faculty) => {
      const conflicts = this.findTimeConflicts(slots)
      if (conflicts.length > 0) {
        this.conflicts.push({
          type: 'faculty',
          description: `Faculty ${faculty} has ${conflicts.length / 2} overlapping classes`,
          slots: conflicts,
          severity: 'critical'
        })
      }
    })

    // Check if faculties are teaching their subjects
    this.schedules.forEach(slot => {
      if (!this.canFacultyTeachSubject(slot.faculty, slot.subject.code)) {
        this.conflicts.push({
          type: 'constraint',
          description: `${slot.faculty.name} (${slot.faculty.code}) is assigned ${slot.subject.name} (${slot.subject.code}) which is not in their expertise`,
          slots: [slot],
          severity: 'warning'
        })
      }
    })

    console.log(`   Found ${this.conflicts.length} potential issues`)
  }

  private findTimeConflicts(slots: ScheduleSlot[]): ScheduleSlot[] {
    const conflicts: ScheduleSlot[] = []
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (slots[i].day === slots[j].day && slots[i].timeSlot === slots[j].timeSlot) {
          conflicts.push(slots[i], slots[j])
        }
      }
    }
    return conflicts
  }

  // ==================== STATISTICS ====================

  private calculateStatistics(generationTime: number): GenerationStatistics {
    const totalSlots = this.config.days.length * this.config.timeSlots.length

    const facultyUtil = new Map<string, number>()
    this.config.faculties.forEach(f => {
      const utilization = f.loadHours > 0 ? (f.assignedHours / f.loadHours) * 100 : 0
      facultyUtil.set(f.code, utilization)
    })

    const roomUtil = new Map<string, number>()
    this.config.rooms.forEach(r => {
      const slots = this.roomSchedule.get(r.number) || []
      const utilization = totalSlots > 0 ? (slots.length / totalSlots) * 100 : 0
      roomUtil.set(r.number, utilization)
    })

    return {
      totalSlots: totalSlots * this.config.rooms.length,
      assignedSlots: this.schedules.length,
      unassignedSlots: totalSlots * this.config.rooms.length - this.schedules.length,
      facultyUtilization: facultyUtil,
      roomUtilization: roomUtil,
      constraintViolations: this.conflicts.filter(c => c.severity === 'critical').length,
      generationTime
    }
  }
}
