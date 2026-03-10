"use client"

import { useState, useEffect } from 'react'
import { Search, DoorOpen, AlertCircle, Loader2, Calendar, CalendarRange } from 'lucide-react'
import ScheduleCard from '@/components/ScheduleCard'
import TimeSelector from '@/components/TimeSelector'
import TimetableView from '@/components/TimetableView'
import WeeklyTimetableView from '@/components/WeeklyTimetableView'
import { getCurrentDay, getCurrentTimeSlot, timeToHour, type TimetableEntry } from '@/lib/timetable'
import { getDayName } from '@/lib/utils'

export default function RoomQuery() {
  const [room, setRoom] = useState('')
  const [results, setResults] = useState<TimetableEntry[]>([])
  const [fullDaySchedule, setFullDaySchedule] = useState<TimetableEntry[]>([])
  const [weeklySchedule, setWeeklySchedule] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [allRooms, setAllRooms] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'current' | 'fullday' | 'weekly'>('current')

  const [useCurrentTime, setUseCurrentTime] = useState(true)
  const [currentDay, setCurrentDay] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  useEffect(() => {
    const updateCurrent = () => {
      setCurrentDay(getCurrentDay())
      setCurrentTime(getCurrentTimeSlot() || 'Outside class hours')
    }
    updateCurrent()
    const interval = setInterval(updateCurrent, 60000)

    fetch('/api/timetable')
      .then(res => res.json())
      .then(data => {
        const rooms = Array.from(new Set(
          data.map((e: TimetableEntry) => e.Room).filter((r: string) => r)
        )).sort()
        setAllRooms(rooms as string[])
      })

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (currentDay && currentTime && currentTime !== 'Outside class hours') {
      setSelectedDay(currentDay)
      setSelectedTime(currentTime)
    }
  }, [currentDay, currentTime])

  const handleSearch = async () => {
    if (!room) return

    setLoading(true)
    try {
      const response = await fetch('/api/timetable')
      const data: TimetableEntry[] = await response.json()

      const day = useCurrentTime ? currentDay : selectedDay
      const timeSlot = useCurrentTime ? currentTime : selectedTime

      // Get day schedule
      const daySchedule = data.filter(
        entry =>
          entry.Room.toUpperCase() === room.toUpperCase() &&
          entry.Day === day
      )
      setFullDaySchedule(daySchedule)

      // Get current time results
      if (timeSlot && timeSlot !== 'Outside class hours') {
        const filtered = daySchedule.filter(entry => {
          // Overlap check to handle combined 2-hour slots
          const [qStart, qEnd] = timeSlot.split('-')
          const [eStart, eEnd] = entry.Time_Slot.split('-')
          const qStartH = timeToHour(qStart)
          const qEndH = timeToHour(qEnd)
          const eStartH = timeToHour(eStart)
          const eEndH = timeToHour(eEnd)
          return eStartH < qEndH && eEndH > qStartH
        })
        setResults(filtered)
      } else {
        setResults([])
      }

      // Get weekly schedule
      const weekly = data.filter(
        entry => entry.Room.toUpperCase() === room.toUpperCase()
      )
      setWeeklySchedule(weekly)

    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  const activeDay = useCurrentTime ? currentDay : selectedDay
  const activeTime = useCurrentTime ? currentTime : selectedTime

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-lg">
          <DoorOpen className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Room Query</h1>
        <p className="text-gray-600">Find room occupancy and complete schedules</p>
      </div>

      <TimeSelector
        selectedDay={selectedDay}
        selectedTime={selectedTime}
        onDayChange={setSelectedDay}
        onTimeChange={setSelectedTime}
        useCurrentTime={useCurrentTime}
        onToggleCurrentTime={setUseCurrentTime}
        currentDay={currentDay}
        currentTime={currentTime}
      />

      <div className="bg-white rounded-xl p-8 shadow-md">
        <div className="space-y-4">
          <label className="block">
            <span className="text-gray-700 font-semibold mb-2 block">Room Number</span>
            <div className="relative">
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter room number (e.g., 518A, 213-A)"
                list="rooms-list"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-lg"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <datalist id="rooms-list">
                {allRooms.map(r => (
                  <option key={r} value={r} />
                ))}
              </datalist>
            </div>
          </label>

          <button
            onClick={handleSearch}
            disabled={loading || !room || !activeDay}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search Room Schedule
              </>
            )}
          </button>
        </div>
      </div>

      {fullDaySchedule.length > 0 && (
        <div className="flex justify-center gap-3 flex-wrap">
          <button
            onClick={() => setViewMode('current')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${viewMode === 'current'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Current Time Slot
          </button>
          <button
            onClick={() => setViewMode('fullday')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'fullday'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <Calendar className="w-5 h-5" />
            Full Day Timetable
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${viewMode === 'weekly'
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg scale-105'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <CalendarRange className="w-5 h-5" />
            Weekly Timetable
          </button>
        </div>
      )}

      {viewMode === 'current' && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Room {room} at {activeDay} {activeTime}:
          </h2>
          <div className="grid gap-4">
            {results.map((entry, index) => (
              <ScheduleCard key={index} entry={entry} highlight={true} />
            ))}
          </div>
        </div>
      )}

      {viewMode === 'fullday' && fullDaySchedule.length > 0 && (
        <TimetableView
          entries={fullDaySchedule}
          title={`Room ${room} - Full Day Schedule`}
          subtitle={`Complete schedule for ${getDayName(activeDay)}`}
          type="room"
          highlightSlot={activeTime !== 'Outside class hours' ? activeTime : undefined}
        />
      )}

      {viewMode === 'weekly' && weeklySchedule.length > 0 && (
        <WeeklyTimetableView
          entries={weeklySchedule}
          title={`Room ${room} - Weekly Schedule`}
          subtitle="Complete weekly occupancy (Monday - Friday)"
          type="room"
          highlightDay={useCurrentTime ? currentDay : undefined}
          highlightSlot={useCurrentTime ? currentTime : undefined}
        />
      )}

      {room && !loading && fullDaySchedule.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">No Classes Found</h3>
            <p className="text-yellow-700">
              Room {room} has no classes scheduled for {getDayName(activeDay)}
            </p>
          </div>
        </div>
      )}

      {room && !loading && viewMode === 'current' && results.length === 0 && fullDaySchedule.length > 0 && activeTime !== 'Outside class hours' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-green-800 mb-1">Room Available</h3>
            <p className="text-green-700">
              Room {room} is free at {activeDay} {activeTime}. Switch to view other schedules.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
