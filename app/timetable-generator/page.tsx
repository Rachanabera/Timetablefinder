"use client"

import { useState, useEffect } from 'react'
import { Upload, Download, FileText, Users, Home, BookOpen, Sparkles, Loader2, CheckCircle, AlertTriangle, XCircle, Settings, Calendar, MapPin } from 'lucide-react'
import { CSVParser } from '@/lib/csv-parser'
import { TimetableGenerator } from '@/lib/timetable-generator'
import { GeneratorConfig, GeneratedTimetable } from '@/lib/generator-types'

export default function TimetableGeneratorPage() {
  // File upload states
  const [facultyFile, setFacultyFile] = useState<File | null>(null)
  const [roomFile, setRoomFile] = useState<File | null>(null)
  const [subjectFile, setSubjectFile] = useState<File | null>(null)
  const [studentFile, setStudentFile] = useState<File | null>(null)

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedTimetable, setGeneratedTimetable] = useState<GeneratedTimetable | null>(null)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'upload' | 'configure' | 'generate' | 'results'>('upload')

  // Configuration
  const [config, setConfig] = useState({
    maxConsecutiveLectures: 2,
    maxLabsPerDay: 1,
    maxDailyHoursPerFaculty: 6
  })

  // Preview faculty selection - FULLY IMPLEMENTED
  const [selectedPreviewFaculty, setSelectedPreviewFaculty] = useState<string>('')

  const handleFileUpload = (type: 'faculty' | 'room' | 'subject' | 'student', file: File) => {
    switch (type) {
      case 'faculty': setFacultyFile(file); break
      case 'room': setRoomFile(file); break
      case 'subject': setSubjectFile(file); break
      case 'student': setStudentFile(file); break
    }
    setError('')
  }

  const downloadTemplate = (type: 'faculty' | 'room' | 'subject' | 'student') => {
    let content = ''
    let filename = ''

    switch (type) {
      case 'faculty':
        content = CSVParser.generateFacultyTemplate()
        filename = 'faculty_template.csv'
        break
      case 'room':
        content = CSVParser.generateRoomTemplate()
        filename = 'room_template.csv'
        break
      case 'subject':
        content = CSVParser.generateSubjectTemplate()
        filename = 'subject_template.csv'
        break
      case 'student':
        content = CSVParser.generateStudentGroupTemplate()
        filename = 'student_groups_template.csv'
        break
    }

    const blob = new Blob([content], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const validateFiles = (): boolean => {
    if (!facultyFile || !roomFile || !subjectFile || !studentFile) {
      setError('Please upload all required files')
      return false
    }
    return true
  }

  const proceedToConfiguration = () => {
    if (validateFiles()) {
      setStep('configure')
    }
  }

  const handleGenerate = async () => {
    if (!validateFiles()) return

    setIsGenerating(true)
    setError('')
    setStep('generate')

    try {
      // Read files
      const facultyText = await facultyFile!.text()
      const roomText = await roomFile!.text()
      const subjectText = await subjectFile!.text()
      const studentText = await studentFile!.text()

      // Parse CSVs
      const faculties = CSVParser.parseFaculties(facultyText)
      const rooms = CSVParser.parseRooms(roomText)
      const subjects = CSVParser.parseSubjects(subjectText)
      const studentGroups = CSVParser.parseStudentGroups(studentText)

      console.log('📊 Parsed data:', { faculties, rooms, subjects, studentGroups })

      // Create generator config
      const generatorConfig: GeneratorConfig = {
        faculties,
        rooms,
        subjects,
        studentGroups,
        constraints: {
          maxConsecutiveLectures: config.maxConsecutiveLectures,
          maxLabsPerDay: config.maxLabsPerDay,
          minBreakBetweenLabs: 1,
          preferredLabSlots: ['13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'],
          maxDailyHoursPerFaculty: config.maxDailyHoursPerFaculty
        },
        timeSlots: [
          '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
          '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
        ],
        days: ['MON', 'TUE', 'WED', 'THR', 'FRI']
      }

      // Generate timetable
      const generator = new TimetableGenerator(generatorConfig)
      const result = generator.generate()

      setGeneratedTimetable(result)

      // Set first faculty as default preview
      const firstFacultyCode = Array.from(result.facultyTimetables.keys())[0]
      if (firstFacultyCode) {
        setSelectedPreviewFaculty(firstFacultyCode)
      }

      setStep('results')
      console.log('✅ Generated timetable:', result)
    } catch (err: any) {
      console.error('❌ Generation error:', err)
      setError(err.message || 'Failed to generate timetable')
      setStep('upload')
    } finally {
      setIsGenerating(false)
    }
  }

  const exportToCSV = (type: 'faculty' | 'room' | 'student') => {
    if (!generatedTimetable) return

    let csvContent = ''
    let filename = ''

    if (type === 'faculty') {
      csvContent = 'Faculty Code,Faculty Name,Day,Time Slot,Subject,Room,Student Group,Type\n'
      generatedTimetable.facultyTimetables.forEach((slots, facultyCode) => {
        slots.forEach(slot => {
          const studentGroup = slot.studentGroup.batch 
            ? `${slot.studentGroup.branch}-${slot.studentGroup.division}-${slot.studentGroup.batch}`
            : `${slot.studentGroup.branch}-${slot.studentGroup.division}`

          csvContent += `${slot.faculty.code},${slot.faculty.name},${slot.day},${slot.timeSlot},${slot.subject.name},${slot.room.number},${studentGroup},${slot.isLab ? 'Lab' : 'Theory'}\n`
        })
      })
      filename = 'faculty_timetables.csv'
    } else if (type === 'room') {
      csvContent = 'Room Number,Day,Time Slot,Subject,Faculty,Student Group,Type\n'
      generatedTimetable.roomTimetables.forEach((slots, roomNumber) => {
        slots.forEach(slot => {
          const studentGroup = slot.studentGroup.batch 
            ? `${slot.studentGroup.branch}-${slot.studentGroup.division}-${slot.studentGroup.batch}`
            : `${slot.studentGroup.branch}-${slot.studentGroup.division}`

          csvContent += `${slot.room.number},${slot.day},${slot.timeSlot},${slot.subject.name},${slot.faculty.name},${studentGroup},${slot.isLab ? 'Lab' : 'Theory'}\n`
        })
      })
      filename = 'room_timetables.csv'
    } else {
      csvContent = 'Student Group,Day,Time Slot,Subject,Faculty,Room,Type\n'
      generatedTimetable.studentTimetables.forEach((slots, groupKey) => {
        slots.forEach(slot => {
          csvContent += `${groupKey},${slot.day},${slot.timeSlot},${slot.subject.name},${slot.faculty.name},${slot.room.number},${slot.isLab ? 'Lab' : 'Theory'}\n`
        })
      })
      filename = 'student_timetables.csv'
    }

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUseGeneratedTimetable = async () => {
    if (!generatedTimetable) return

    try {
      const response = await fetch('/api/use-generated-timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedTimetable })
      })

      const result = await response.json()
      if (result.success) {
        alert('✅ Generated timetable is now active! Refresh the app to see changes.')
      } else {
        alert('❌ Failed to apply timetable: ' + result.error)
      }
    } catch (error) {
      alert('❌ Failed to apply timetable')
    }
  }

  // Get selected faculty's timetable for preview - FULLY IMPLEMENTED
  const getPreviewFacultyTimetable = () => {
    if (!generatedTimetable || !selectedPreviewFaculty) return null

    const slots = generatedTimetable.facultyTimetables.get(selectedPreviewFaculty)
    if (!slots || slots.length === 0) return null

    const scheduleByDay = new Map<string, typeof slots>()
    slots.forEach(slot => {
      const daySlots = scheduleByDay.get(slot.day) || []
      daySlots.push(slot)
      scheduleByDay.set(slot.day, daySlots)
    })

    return {
      facultyCode: selectedPreviewFaculty,
      facultyName: slots[0].faculty.name,
      slots: slots,
      scheduleByDay: scheduleByDay
    }
  }

  const previewData = getPreviewFacultyTimetable()

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
          <Sparkles className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">AI Timetable Generator</h1>
        <p className="text-gray-600">Upload your data and let AI create the perfect schedule</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="flex items-center justify-between">
          {[
            { id: 'upload', label: 'Upload Files', icon: Upload },
            { id: 'configure', label: 'Configure', icon: Settings },
            { id: 'generate', label: 'Generate', icon: Sparkles },
            { id: 'results', label: 'Results', icon: CheckCircle }
          ].map((s, index) => (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  step === s.id ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg' :
                  ['upload', 'configure', 'generate'].indexOf(step) > ['upload', 'configure', 'generate'].indexOf(s.id as any) ? 'bg-green-500 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div className="text-sm font-medium mt-2 text-gray-700">{s.label}</div>
              </div>
              {index < 3 && (
                <div className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                  ['upload', 'configure', 'generate'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: File Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-8 shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload Input Files</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Faculty File */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-gray-800">Faculty Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV with faculty names, codes, and load hours
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('faculty', e.target.files[0])}
                  className="hidden"
                  id="faculty-upload"
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="faculty-upload"
                    className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer text-center"
                  >
                    {facultyFile ? facultyFile.name : 'Choose File'}
                  </label>
                  <button
                    onClick={() => downloadTemplate('faculty')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {facultyFile && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded
                  </div>
                )}
              </div>

              {/* Room File */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Home className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-gray-800">Room Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV with room numbers, capacity, and type
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('room', e.target.files[0])}
                  className="hidden"
                  id="room-upload"
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="room-upload"
                    className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer text-center"
                  >
                    {roomFile ? roomFile.name : 'Choose File'}
                  </label>
                  <button
                    onClick={() => downloadTemplate('room')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {roomFile && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded
                  </div>
                )}
              </div>

              {/* Subject File */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-gray-800">Subject Data</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV with subject details and hours
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('subject', e.target.files[0])}
                  className="hidden"
                  id="subject-upload"
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="subject-upload"
                    className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer text-center"
                  >
                    {subjectFile ? subjectFile.name : 'Choose File'}
                  </label>
                  <button
                    onClick={() => downloadTemplate('subject')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {subjectFile && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded
                  </div>
                )}
              </div>

              {/* Student File */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-indigo-500 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-6 h-6 text-indigo-600" />
                  <h3 className="font-semibold text-gray-800">Student Groups</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Upload CSV with branch, division, and batch info
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload('student', e.target.files[0])}
                  className="hidden"
                  id="student-upload"
                />
                <div className="flex gap-2">
                  <label
                    htmlFor="student-upload"
                    className="flex-1 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors cursor-pointer text-center"
                  >
                    {studentFile ? studentFile.name : 'Choose File'}
                  </label>
                  <button
                    onClick={() => downloadTemplate('student')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
                {studentFile && (
                  <div className="mt-2 flex items-center gap-2 text-green-600 text-sm">
                    <CheckCircle className="w-4 h-4" />
                    File uploaded
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-red-800 text-sm">Error</div>
                  <div className="text-red-700 text-sm mt-1">{error}</div>
                </div>
              </div>
            )}

            <button
              onClick={proceedToConfiguration}
              disabled={!facultyFile || !roomFile || !subjectFile || !studentFile}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Configuration
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 'configure' && (
        <div className="bg-white rounded-xl p-8 shadow-md space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Configure Constraints</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Consecutive Lectures
              </label>
              <input
                type="number"
                value={config.maxConsecutiveLectures}
                onChange={(e) => setConfig({...config, maxConsecutiveLectures: parseInt(e.target.value)})}
                min="1"
                max="4"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Faculty won't have more than this many classes in a row
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Labs Per Day
              </label>
              <input
                type="number"
                value={config.maxLabsPerDay}
                onChange={(e) => setConfig({...config, maxLabsPerDay: parseInt(e.target.value)})}
                min="1"
                max="2"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Students won't have more than this many labs per day
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maximum Daily Hours Per Faculty
              </label>
              <input
                type="number"
                value={config.maxDailyHoursPerFaculty}
                onChange={(e) => setConfig({...config, maxDailyHoursPerFaculty: parseInt(e.target.value)})}
                min="4"
                max="8"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Maximum hours a faculty can teach in one day
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep('upload')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            >
              Generate Timetable
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Generating */}
      {step === 'generate' && isGenerating && (
        <div className="bg-white rounded-xl p-12 shadow-md text-center">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Generating Your Timetable...</h2>
          <p className="text-gray-600">This may take a few moments. Please wait.</p>
          <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-700">Assigning lab sessions...</span>
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm text-gray-700">Scheduling theory lectures...</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {step === 'results' && generatedTimetable && (
        <div className="space-y-6">
          {/* Statistics Overview */}
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-10 h-10 opacity-80" />
                <div className="text-4xl font-bold">{generatedTimetable.statistics.assignedSlots}</div>
              </div>
              <div className="text-emerald-100 font-medium">Classes Scheduled</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-10 h-10 opacity-80" />
                <div className="text-4xl font-bold">{generatedTimetable.facultyTimetables.size}</div>
              </div>
              <div className="text-blue-100 font-medium">Faculties Assigned</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <Home className="w-10 h-10 opacity-80" />
                <div className="text-4xl font-bold">{generatedTimetable.roomTimetables.size}</div>
              </div>
              <div className="text-purple-100 font-medium">Rooms Utilized</div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                {generatedTimetable.conflicts.length === 0 ? (
                  <CheckCircle className="w-10 h-10 opacity-80" />
                ) : (
                  <AlertTriangle className="w-10 h-10 opacity-80" />
                )}
                <div className="text-4xl font-bold">{generatedTimetable.conflicts.length}</div>
              </div>
              <div className="text-orange-100 font-medium">Conflicts</div>
            </div>
          </div>

          {/* Generation Time */}
          <div className="bg-white rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                <div>
                  <div className="font-semibold text-gray-800">Generation Complete!</div>
                  <div className="text-sm text-gray-600">
                    Timetable generated in {(generatedTimetable.statistics.generationTime / 1000).toFixed(2)} seconds
                  </div>
                </div>
              </div>
              <button
                onClick={() => setStep('upload')}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Generate New
              </button>
            </div>
          </div>

          {/* Conflicts Warning */}
          {generatedTimetable.conflicts.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-3">
                    {generatedTimetable.conflicts.length} Conflict{generatedTimetable.conflicts.length !== 1 ? 's' : ''} Detected
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {generatedTimetable.conflicts.map((conflict, index) => (
                      <div key={index} className="bg-white rounded-lg p-3 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className={`w-4 h-4 ${
                            conflict.severity === 'critical' ? 'text-red-600' : 
                            conflict.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                          }`} />
                          <span className={`text-sm font-semibold ${
                            conflict.severity === 'critical' ? 'text-red-800' : 
                            conflict.severity === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                          }`}>
                            {conflict.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{conflict.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="bg-white rounded-xl p-6 shadow-md space-y-4">
            <h3 className="font-bold text-gray-800 mb-4">Actions</h3>

            <button
              onClick={handleUseGeneratedTimetable}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              Use This Timetable (Make Active)
            </button>

            <div className="grid md:grid-cols-3 gap-4">
              <button
                onClick={() => exportToCSV('faculty')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5" />
                Faculty Timetables
              </button>
              <button
                onClick={() => exportToCSV('room')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5" />
                Room Timetables
              </button>
              <button
                onClick={() => exportToCSV('student')}
                className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                <Download className="w-5 h-5" />
                Student Timetables
              </button>
            </div>
          </div>

          {/* Faculty Utilization */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white">Faculty Utilization</h3>
            </div>
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from(generatedTimetable.statistics.facultyUtilization.entries())
                  .sort((a, b) => b[1] - a[1])
                  .map(([facultyCode, utilization]) => {
                    const faculty = generatedTimetable.facultyTimetables.get(facultyCode)
                    const facultyName = faculty?.[0]?.faculty.name || facultyCode

                    return (
                      <div key={facultyCode} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="font-bold text-gray-800">{facultyName}</div>
                            <div className="text-sm text-gray-600">{facultyCode}</div>
                          </div>
                          <div className="text-2xl font-bold text-indigo-600">
                            {utilization.toFixed(0)}%
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              utilization >= 90 ? 'bg-red-500' :
                              utilization >= 70 ? 'bg-green-500' :
                              utilization >= 50 ? 'bg-yellow-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${utilization}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {faculty?.length || 0} classes assigned
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Preview: Faculty Timetable with FULL SWITCHING IMPLEMENTATION */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Preview: Faculty Timetable</h3>
              <select
                value={selectedPreviewFaculty}
                onChange={(e) => setSelectedPreviewFaculty(e.target.value)}
                className="px-4 py-2 rounded-lg bg-white text-gray-800 font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {Array.from(generatedTimetable.facultyTimetables.keys()).map(code => {
                  const slots = generatedTimetable.facultyTimetables.get(code)
                  const name = slots?.[0]?.faculty.name || code
                  return (
                    <option key={code} value={code}>
                      {name} ({code})
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="p-6">
              {previewData && (
                <div className="space-y-4">
                  <div className="font-bold text-lg text-gray-800 mb-4">
                    {previewData.facultyName} ({previewData.facultyCode})
                  </div>
                  {['MON', 'TUE', 'WED', 'THR', 'FRI'].map(day => {
                    const daySlots = previewData.scheduleByDay.get(day) || []
                    return (
                      <div key={day} className="border border-gray-200 rounded-lg p-4">
                        <div className="font-semibold text-gray-700 mb-3">{day}</div>
                        {daySlots.length === 0 ? (
                          <p className="text-gray-400 text-sm">No classes</p>
                        ) : (
                          <div className="grid gap-2">
                            {daySlots
                              .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot))
                              .map((slot, idx) => (
                                <div
                                  key={idx}
                                  className={`flex items-center justify-between p-3 rounded-lg ${
                                    slot.isLab ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'
                                  }`}
                                >
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-800">{slot.subject.name}</div>
                                    <div className="text-sm text-gray-600">
                                      Room {slot.room.number} • {slot.studentGroup.branch}-{slot.studentGroup.division}
                                      {slot.studentGroup.batch && `-${slot.studentGroup.batch}`}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-gray-700">{slot.timeSlot}</div>
                                    <div className={`text-xs font-medium ${
                                      slot.isLab ? 'text-purple-600' : 'text-blue-600'
                                    }`}>
                                      {slot.isLab ? 'Lab' : 'Theory'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
