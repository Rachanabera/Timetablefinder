"use client"

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, Search, MapPin, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'
import type { TimetableEntry } from '@/lib/timetable'
import { DAYS } from '@/lib/timetable'

export default function RoomAvailability() {
  const [selectedDate, setSelectedDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [availableRooms, setAvailableRooms] = useState<string[]>([])
  const [occupiedRooms, setOccupiedRooms] = useState<{ room: string; details: TimetableEntry[] }[]>([])
  const [allRooms, setAllRooms] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  useEffect(() => {
    // Fetch all rooms
    fetch('/api/timetable')
      .then(res => res.json())
      .then((data: TimetableEntry[]) => {
        const rooms = Array.from(new Set(
          data.map(e => e.Room).filter(r => r)
        )).sort()
        setAllRooms(rooms)
      })
  }, [])

  const getDayFromDate = (dateString: string): string => {
    const date = new Date(dateString)
    const dayIndex = date.getDay()
    const dayMap = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT']
    return dayMap[dayIndex]
  }

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + (minutes || 0)
  }

  const validateInputs = (): boolean => {
    setError('')

    if (!selectedDate) {
      setError('Please select a date')
      return false
    }

    if (!startTime || !endTime) {
      setError('Please select both start and end times')
      return false
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const classStart = 9 * 60
    const classEnd = 17 * 60

    if (startMinutes < classStart || startMinutes >= classEnd) {
      setError('Start time must be between 9:00 AM and 5:00 PM')
      return false
    }

    if (endMinutes <= classStart || endMinutes > classEnd) {
      setError('End time must be between 9:00 AM and 5:00 PM')
      return false
    }

    if (startMinutes >= endMinutes) {
      setError('End time must be after start time')
      return false
    }

    const duration = endMinutes - startMinutes
    if (duration < 30) {
      setError('Duration must be at least 30 minutes')
      return false
    }

    // Check if it's a weekend
    const day = getDayFromDate(selectedDate)
    if (day === 'SUN' || day === 'SAT') {
      setError('Selected date falls on a weekend. Classes are only scheduled Monday-Friday.')
      return false
    }

    return true
  }

  const handleSearch = async () => {
    if (!validateInputs()) return

    setLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch('/api/timetable')
      const data: TimetableEntry[] = await response.json()

      const day = getDayFromDate(selectedDate)
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)

      // Find occupied rooms in the time range
      const occupied = new Map<string, TimetableEntry[]>()

      data.forEach(entry => {
        if (entry.Day !== day) return

        const [entryStart, entryEnd] = entry.Time_Slot.split('-')
        const entryStartMin = timeToMinutes(entryStart)
        const entryEndMin = timeToMinutes(entryEnd)

        // Check if time ranges overlap
        const hasOverlap = (
          (entryStartMin >= startMinutes && entryStartMin < endMinutes) ||
          (entryEndMin > startMinutes && entryEndMin <= endMinutes) ||
          (entryStartMin <= startMinutes && entryEndMin >= endMinutes)
        )

        if (hasOverlap && entry.Room) {
          const existing = occupied.get(entry.Room) || []
          existing.push(entry)
          occupied.set(entry.Room, existing)
        }
      })

      // Calculate available rooms
      const occupiedRoomsList = Array.from(occupied.keys())
      const available = allRooms.filter(room => !occupiedRoomsList.includes(room))

      setAvailableRooms(available.sort())
      setOccupiedRooms(
        Array.from(occupied.entries())
          .map(([room, details]) => ({ room, details }))
          .sort((a, b) => a.room.localeCompare(b.room))
      )
    } catch (error) {
      console.error('Error fetching data:', error)
      setError('Failed to fetch room data. Please try again.')
    }

    setLoading(false)
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTimeRange = (): string => {
    if (!startTime || !endTime) return ''
    return `${startTime} - ${endTime}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg">
          <MapPin className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Room Availability Checker</h1>
        <p className="text-gray-600">Find empty classrooms for any date and time</p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-xl p-8 shadow-md space-y-6">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Date Picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Select Date
              </div>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg font-semibold"
            />
            {selectedDate && (
              <p className="text-xs text-gray-500 mt-2">
                {formatDate(selectedDate)} ({getDayFromDate(selectedDate)})
              </p>
            )}
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </div>
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              min="09:00"
              max="17:00"
              step="300"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg font-semibold"
            />
            <p className="text-xs text-gray-500 mt-2">From 9:00 AM</p>
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </div>
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              min="09:00"
              max="17:00"
              step="300"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:outline-none transition-colors text-lg font-semibold"
            />
            <p className="text-xs text-gray-500 mt-2">Until 5:00 PM</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <div className="text-sm font-semibold text-gray-700 mb-3">Quick Presets:</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Morning (9-12)', start: '09:00', end: '12:00' },
              { label: 'Afternoon (1-5)', start: '13:00', end: '17:00' },
              { label: 'Full Day (9-5)', start: '09:00', end: '17:00' },
              { label: '2 Hours', start: '10:00', end: '12:00' },
              { label: '3 Hours', start: '14:00', end: '17:00' },
            ].map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  setStartTime(preset.start)
                  setEndTime(preset.end)
                }}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-800 text-sm">Invalid Input</div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={loading || !selectedDate || !startTime || !endTime}
          className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-lg font-semibold text-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="w-6 h-6" />
              Find Available Rooms
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {hasSearched && !loading && (
        <>
          {/* Search Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <CalendarIcon className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Showing results for</div>
                <div className="font-bold text-gray-800 text-xl">
                  {formatDate(selectedDate)} • {formatTimeRange()}
                </div>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-10 h-10 opacity-80" />
                <div className="text-5xl font-bold">{availableRooms.length}</div>
              </div>
              <div className="text-emerald-100 font-medium">Available Rooms</div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <XCircle className="w-10 h-10 opacity-80" />
                <div className="text-5xl font-bold">{occupiedRooms.length}</div>
              </div>
              <div className="text-red-100 font-medium">Occupied Rooms</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="w-10 h-10 opacity-80" />
                <div className="text-5xl font-bold">
                  {((availableRooms.length / allRooms.length) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-blue-100 font-medium">Availability</div>
            </div>
          </div>

          {/* Available Rooms */}
          {availableRooms.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Available Rooms ({availableRooms.length})</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {availableRooms.map((room) => (
                    <div
                      key={room}
                      className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-center hover:bg-green-100 transition-colors"
                    >
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div className="font-bold text-gray-800 text-lg">{room}</div>
                      <div className="text-xs text-green-600 mt-1 flex items-center justify-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Free
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Occupied Rooms */}
          {occupiedRooms.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4">
                <div className="flex items-center gap-3 text-white">
                  <XCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Occupied Rooms ({occupiedRooms.length})</h3>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-red-50 border-b-2 border-red-200">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Room</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Time Slot</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Course</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Faculty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupiedRooms.map(({ room, details }, index) => (
                      <tr key={room} className="border-b border-gray-100 hover:bg-red-50 transition-colors">
                        <td className="px-6 py-4 text-gray-600 font-medium">{index + 1}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{room}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700 font-semibold">
                          {details[0].Time_Slot}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {details[0].Course}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-semibold text-gray-800">{details[0].Faculty_Name}</div>
                            <div className="text-xs text-gray-500">{details[0].Faculty_Code}</div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {availableRooms.length === 0 && occupiedRooms.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="font-semibold text-yellow-800 mb-2">No Data Available</h3>
              <p className="text-yellow-700">
                No room bookings found for the selected date and time.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
