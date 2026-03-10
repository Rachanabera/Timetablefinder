"use client"

import { useState, useEffect } from 'react'
import { Users, Clock, RefreshCw, Grid3x3, Table2 } from 'lucide-react'
import TimeSelector from '@/components/TimeSelector'
import CustomTimeSlotInput from '@/components/CustomTimeSlotInput'
import FacultyListView from '@/components/FacultyListView'
import { getCurrentDay, getCurrentTimeSlot, timeToHour, type TimetableEntry } from '@/lib/timetable'
import { getDayName } from '@/lib/utils'

export default function FreeFaculties() {
  const [freeFaculties, setFreeFaculties] = useState<{ code: string; name: string }[]>([])
  const [busyFaculties, setBusyFaculties] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)

  const [useCurrentTime, setUseCurrentTime] = useState(true)
  const [currentDay, setCurrentDay] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [selectedDay, setSelectedDay] = useState('')
  const [selectedTime, setSelectedTime] = useState('')

  const [useCustomTime, setUseCustomTime] = useState(false)
  const [customTimeSlot, setCustomTimeSlot] = useState('')
  const [isCustomTimeValid, setIsCustomTimeValid] = useState(false)

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const fetchFreeFaculties = async (day: string, timeSlot: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/timetable')
      const data: TimetableEntry[] = await response.json()

      if (!timeSlot || timeSlot === 'Outside class hours') {
        setLoading(false)
        return
      }

      const busy = data.filter(entry => {
        if (entry.Day !== day) return false

        if (useCustomTime && customTimeSlot) {
          const [customStart, customEnd] = customTimeSlot.split('-')
          const [entryStart, entryEnd] = entry.Time_Slot.split('-')

          const parseTime = (t: string) => {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + (m || 0)
          }

          const customStartMin = parseTime(customStart)
          const customEndMin = parseTime(customEnd)
          const entryStartMin = parseTime(entryStart)
          const entryEndMin = parseTime(entryEnd)

          return (
            (entryStartMin >= customStartMin && entryStartMin < customEndMin) ||
            (entryEndMin > customStartMin && entryEndMin <= customEndMin) ||
            (entryStartMin <= customStartMin && entryEndMin >= customEndMin)
          )
        } else {
          // Check if the entry's time slot overlaps with the queried time slot
          // This handles combined 2-hour slots like "11:00-1:00" matching "11:00-12:00"
          const [qStart, qEnd] = timeSlot.split('-')
          const [eStart, eEnd] = entry.Time_Slot.split('-')
          const qStartH = timeToHour(qStart)
          const qEndH = timeToHour(qEnd)
          const eStartH = timeToHour(eStart)
          const eEndH = timeToHour(eEnd)
          return eStartH < qEndH && eEndH > qStartH
        }
      })

      setBusyFaculties(busy)

      const allFaculties = Array.from(
        new Set(data.map(entry => entry.Faculty_Code))
      ).map(code => {
        const entry = data.find(e => e.Faculty_Code === code)
        return {
          code: code,
          name: entry?.Faculty_Name || code
        }
      })

      const busySet = new Set(busy.map(e => e.Faculty_Code))
      const free = allFaculties.filter(f => !busySet.has(f.code))

      setFreeFaculties(free.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    const updateCurrent = () => {
      const day = getCurrentDay()
      const time = getCurrentTimeSlot() || 'Outside class hours'
      setCurrentDay(day)
      setCurrentTime(time)

      if (useCurrentTime && !useCustomTime && time !== 'Outside class hours') {
        fetchFreeFaculties(day, time)
      }
    }

    updateCurrent()
    const interval = setInterval(updateCurrent, 60000)
    return () => clearInterval(interval)
  }, [useCurrentTime, useCustomTime])

  useEffect(() => {
    if (currentDay && currentTime && currentTime !== 'Outside class hours') {
      setSelectedDay(currentDay)
      setSelectedTime(currentTime)
    }
  }, [currentDay, currentTime])

  useEffect(() => {
    if (!useCurrentTime && !useCustomTime && selectedDay && selectedTime && selectedTime !== 'Outside class hours') {
      fetchFreeFaculties(selectedDay, selectedTime)
    }
  }, [useCurrentTime, useCustomTime, selectedDay, selectedTime])

  useEffect(() => {
    if (useCustomTime && isCustomTimeValid && customTimeSlot) {
      const day = useCurrentTime ? currentDay : selectedDay
      fetchFreeFaculties(day, customTimeSlot)
    }
  }, [useCustomTime, isCustomTimeValid, customTimeSlot])

  const handleRefresh = () => {
    const day = useCurrentTime ? currentDay : selectedDay
    const time = useCustomTime ? customTimeSlot : (useCurrentTime ? currentTime : selectedTime)
    if (day && time && time !== 'Outside class hours') {
      fetchFreeFaculties(day, time)
    }
  }

  const activeDay = useCurrentTime ? currentDay : selectedDay
  const activeTime = useCustomTime ? customTimeSlot : (useCurrentTime ? currentTime : selectedTime)

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
          <Users className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-800">Free Faculties</h1>
        <p className="text-gray-600">Faculties available at the selected time</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-md space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold text-gray-800">Time Input Mode</h3>
              <p className="text-sm text-gray-500">
                {useCustomTime ? 'Custom time range' : 'Preset time slots'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUseCustomTime(!useCustomTime)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${useCustomTime ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
              }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${useCustomTime ? 'translate-x-7' : 'translate-x-1'
                }`}
            />
          </button>
        </div>

        {!useCustomTime ? (
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
        ) : (
          <CustomTimeSlotInput
            onTimeSlotChange={(start, end, formatted) => {
              setCustomTimeSlot(formatted)
            }}
            onValidationChange={setIsCustomTimeValid}
          />
        )}
      </div>

      {activeDay && activeTime && activeTime !== 'Outside class hours' && (
        <div className="bg-white rounded-xl p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <div className="text-sm text-gray-500">Showing availability for</div>
              <div className="font-bold text-gray-800">
                {getDayName(activeDay)} at {activeTime}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
            >
              {viewMode === 'cards' ? (
                <>
                  <Table2 className="w-4 h-4" />
                  Table View
                </>
              ) : (
                <>
                  <Grid3x3 className="w-4 h-4" />
                  Card View
                </>
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      )}

      {viewMode === 'table' && activeTime !== 'Outside class hours' && (
        <FacultyListView
          freeFaculties={freeFaculties}
          busyFaculties={busyFaculties}
          timeSlot={activeTime}
          day={activeDay}
        />
      )}

      {viewMode === 'cards' && activeTime !== 'Outside class hours' && (
        <>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-emerald-100 mb-1">Free Faculties</div>
                  <div className="text-5xl font-bold">{freeFaculties.length}</div>
                </div>
                <Users className="w-16 h-16 opacity-20" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-red-100 mb-1">Busy Faculties</div>
                  <div className="text-5xl font-bold">{busyFaculties.length}</div>
                </div>
                <Clock className="w-16 h-16 opacity-20" />
              </div>
            </div>
          </div>

          {freeFaculties.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">
                Available at {getDayName(activeDay)} {activeTime}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {freeFaculties.map((faculty) => (
                  <div
                    key={faculty.code}
                    className="bg-white rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                        {faculty.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-800 truncate">{faculty.name}</div>
                        <div className="text-sm text-gray-600">{faculty.code}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTime === 'Outside class hours' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
          <Clock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="font-semibold text-blue-800 mb-2">Outside Class Hours</h3>
          <p className="text-blue-700">
            {useCurrentTime
              ? 'Classes are not currently in session. Please check during class hours (9:00 AM - 5:00 PM).'
              : 'Please select a valid time slot to view faculty availability.'}
          </p>
        </div>
      )}
    </div>
  )
}
