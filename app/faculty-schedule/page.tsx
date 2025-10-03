"use client"

import { useState, useEffect } from 'react'
import { Calendar, Search, User, Clock, Loader2, CalendarDays, CalendarRange } from 'lucide-react'
import ScheduleCard from '@/components/ScheduleCard'
import TimetableView from '@/components/TimetableView'
import WeeklyTimetableView from '@/components/WeeklyTimetableView'
import { getCurrentDay, getCurrentTimeSlot, type TimetableEntry, TIME_SLOTS, DAYS } from '@/lib/timetable'
import { getDayName } from '@/lib/utils'

export default function FacultySchedule() {
  const [facultyCode, setFacultyCode] = useState('')
  const [schedule, setSchedule] = useState<TimetableEntry[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [allFaculties, setAllFaculties] = useState<{ code: string; name: string }[]>([])
  const [viewMode, setViewMode] = useState<'timeline' | 'timetable' | 'weekly'>('timeline')
  
  const [useCurrentDay, setUseCurrentDay] = useState(true)
  const [currentDay, setCurrentDay] = useState('')
  const [currentSlot, setCurrentSlot] = useState('')
  const [selectedDay, setSelectedDay] = useState('')

  useEffect(() => {
    setCurrentDay(getCurrentDay())
    setCurrentSlot(getCurrentTimeSlot() || '')
    
    fetch('/api/timetable')
      .then(res => res.json())
      .then((data: TimetableEntry[]) => {
        const faculties = Array.from(
          new Set(data.map(e => e.Faculty_Code))
        ).map(code => {
          const entry = data.find(e => e.Faculty_Code === code)
          return {
            code: code,
            name: entry?.Faculty_Name || code
          }
        }).sort((a, b) => a.code.localeCompare(b.code))
        
        setAllFaculties(faculties)
      })
  }, [])

  useEffect(() => {
    if (currentDay) {
      setSelectedDay(currentDay)
    }
  }, [currentDay])

  const handleSearch = async () => {
    if (!facultyCode) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/timetable')
      const data: TimetableEntry[] = await response.json()
      
      const day = useCurrentDay ? currentDay : selectedDay
      
      // Get day schedule
      const daySchedule = data.filter(
        entry => 
          entry.Faculty_Code.toUpperCase() === facultyCode.toUpperCase() &&
          entry.Day === day
      ).sort((a, b) => TIME_SLOTS.indexOf(a.Time_Slot) - TIME_SLOTS.indexOf(b.Time_Slot))
      
      setSchedule(daySchedule)

      // Get weekly schedule
      const weekly = data.filter(
        entry => entry.Faculty_Code.toUpperCase() === facultyCode.toUpperCase()
      )
      setWeeklySchedule(weekly)
      
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const activeDay = useCurrentDay ? currentDay : selectedDay

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-lg">
          <Calendar className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Faculty Schedule</h1>
        <p className="text-gray-600">View complete schedule for any faculty</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-800">Day Selection</h3>
              <p className="text-sm text-gray-500">
                {useCurrentDay ? 'Using current day' : 'Manual selection'}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setUseCurrentDay(!useCurrentDay)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              useCurrentDay ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                useCurrentDay ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {useCurrentDay && currentDay && (
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-center gap-4">
              <Clock className="w-6 h-6 text-orange-500" />
              <div className="text-center">
                <div className="text-sm text-gray-600">Current Day</div>
                <div className="text-2xl font-bold text-orange-600">
                  {getDayName(currentDay)}
                </div>
                <div className="text-xs text-gray-500">{currentDay}</div>
              </div>
            </div>
          </div>
        )}

        {!useCurrentDay && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Day
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedDay === day
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDay && (
              <div className="mt-3 text-center">
                <div className="inline-block bg-green-50 border border-green-200 rounded-lg px-4 py-2">
                  <div className="text-xs text-gray-600">Selected Day</div>
                  <div className="text-lg font-bold text-green-600">
                    {getDayName(selectedDay)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-8 shadow-md">
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700 font-semibold mb-2 block">Faculty Code or Name</span>
            <div className="relative">
              <input
                type="text"
                value={facultyCode}
                onChange={(e) => setFacultyCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter faculty code (e.g., AVV) or name"
                list="faculty-list"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-lg"
              />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <datalist id="faculty-list">
                {allFaculties.map(f => (
                  <option key={f.code} value={f.code}>
                    {f.name}
                  </option>
                ))}
              </datalist>
            </div>
          </label>

          <button
            onClick={handleSearch}
            disabled={loading || !facultyCode || !activeDay}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading Schedule...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                View Schedule
              </>
            )}
          </button>
        </div>
      </div>

      {schedule.length > 0 && (
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
              viewMode === 'timeline'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('timetable')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              viewMode === 'timetable'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Day Timetable
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
              viewMode === 'weekly'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <CalendarRange className="w-5 h-5" />
            Weekly Timetable
          </button>
        </div>
      )}

      {viewMode === 'timeline' && schedule.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800">
              Schedule for {getDayName(activeDay)} - {schedule[0].Faculty_Name}
            </h2>
            <div className="text-sm text-gray-500">
              {schedule.length} {schedule.length === 1 ? 'class' : 'classes'}
            </div>
          </div>

          <div className="space-y-4">
            {schedule.map((entry, index) => (
              <div key={index} className="relative pl-8">
                <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500 to-red-500" />
                <div className="absolute left-0 top-6 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100" />
                <ScheduleCard 
                  entry={entry} 
                  highlight={entry.Time_Slot === currentSlot && useCurrentDay}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'timetable' && schedule.length > 0 && (
        <TimetableView
          entries={schedule}
          title={`${schedule[0].Faculty_Name} (${schedule[0].Faculty_Code})`}
          subtitle={`Complete schedule for ${getDayName(activeDay)}`}
          type="faculty"
          highlightSlot={useCurrentDay ? currentSlot : undefined}
        />
      )}

      {viewMode === 'weekly' && weeklySchedule.length > 0 && (
        <WeeklyTimetableView
          entries={weeklySchedule}
          title={`${weeklySchedule[0].Faculty_Name} (${weeklySchedule[0].Faculty_Code})`}
          subtitle="Complete weekly schedule (Monday - Friday)"
          highlightDay={useCurrentDay ? currentDay : undefined}
          highlightSlot={useCurrentDay ? currentSlot : undefined}
        />
      )}

      {facultyCode && schedule.length === 0 && !loading && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <User className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-800 mb-1">No Classes on {getDayName(activeDay)}</h3>
          <p className="text-blue-700">
            {facultyCode} has no classes scheduled for {getDayName(activeDay)}
          </p>
        </div>
      )}
    </div>
  )
}
