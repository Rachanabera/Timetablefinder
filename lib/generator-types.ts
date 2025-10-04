// lib/generator-types.ts
// UPDATED Type Definitions with Faculty Subject Assignment

// Input Data Types
export interface Faculty {
  name: string
  code: string
  loadHours: number
  subject1?: string
  subject2?: string
  subject3?: string
  subject4?: string
  isTA: boolean
  assignedHours: number
}

export interface Room {
  number: string
  type: 'classroom' | 'lab'
  // Removed capacity - no longer needed
}

export interface Subject {
  code: string
  name: string
  theoryHours: number
  practicalHours: number
  branch: string
  isMinor?: boolean
}

export interface StudentGroup {
  branch: string // e.g., "CE", "CSBS"
  division: string // e.g., "A", "B", "C"
  batch?: string // e.g., "A1", "A2", "A3" (for labs)
  studentCount: number
}

// Generated Schedule Types
export interface ScheduleSlot {
  day: string // MON, TUE, WED, THR, FRI
  timeSlot: string // 9:00-10:00, 10:00-11:00, etc.
  subject: Subject
  faculty: Faculty
  room: Room
  studentGroup: StudentGroup
  isLab: boolean
}

// Constraints
export interface GeneratorConstraints {
  maxConsecutiveLectures: number // Default: 2
  maxLabsPerDay: number // Default: 1
  minBreakBetweenLabs: number // slots
  preferredLabSlots: string[] // Afternoon preferred
  maxDailyHoursPerFaculty: number // Default: 6
}

// Generation Configuration
export interface GeneratorConfig {
  faculties: Faculty[]
  rooms: Room[]
  subjects: Subject[]
  studentGroups: StudentGroup[]
  constraints: GeneratorConstraints
  timeSlots: string[]
  days: string[]
}

// Output
export interface GeneratedTimetable {
  schedules: ScheduleSlot[]
  facultyTimetables: Map<string, ScheduleSlot[]>
  roomTimetables: Map<string, ScheduleSlot[]>
  studentTimetables: Map<string, ScheduleSlot[]> // Key: branch-division
  conflicts: Conflict[]
  statistics: GenerationStatistics
}

export interface Conflict {
  type: 'room' | 'faculty' | 'student' | 'constraint'
  description: string
  slots: ScheduleSlot[]
  severity: 'critical' | 'warning' | 'info'
}

export interface GenerationStatistics {
  totalSlots: number
  assignedSlots: number
  unassignedSlots: number
  facultyUtilization: Map<string, number>
  roomUtilization: Map<string, number>
  constraintViolations: number
  generationTime: number
}
