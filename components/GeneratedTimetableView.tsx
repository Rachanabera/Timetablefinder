"use client"

import { Calendar, Clock, BookOpen, MapPin, User } from 'lucide-react'
import { ScheduleSlot } from '@/lib/generator-types'

interface GeneratedTimetableViewProps {
  slots: ScheduleSlot[]
  title: string
  type: 'faculty' | 'room' | 'student'
}

function getDayName(day: string): string {
  const names: Record<string, string> = {
    'MON': 'Monday',
    'TUE': 'Tuesday',
    'WED': 'Wednesday',
    'THR': 'Thursday',
    'FRI': 'Friday'
  }
  return names[day] || day
}

export default function GeneratedTimetableView({ slots, title, type }: GeneratedTimetableViewProps) {
  const days = ['MON', 'TUE', 'WED', 'THR', 'FRI']
  const timeSlots = [
    '9:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ]

  // Create schedule map
  const scheduleMap = new Map<string, ScheduleSlot>()
  slots.forEach(slot => {
    const key = `${slot.day}-${slot.timeSlot}`
    scheduleMap.set(key, slot)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {type === 'faculty' ? <User className="w-8 h-8" /> :
             type === 'room' ? <MapPin className="w-8 h-8" /> :
             <BookOpen className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-indigo-100 text-sm mt-1">Weekly Schedule</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-indigo-100">Total Classes</div>
            <div className="text-3xl font-bold">{slots.length}</div>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 border-r-2 border-gray-300">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Calendar className="w-5 h-5" />
                    Day
                  </div>
                </th>
                {timeSlots.map((slot) => (
                  <th key={slot} className="px-3 py-4 text-center border-l border-gray-200 min-w-[180px]">
                    <div className="font-bold text-sm text-gray-800">{slot}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {parseInt(slot.split(':')[0]) >= 13 ? 'Afternoon' : 'Morning'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {days.map((day) => (
                <tr key={day} className="border-t border-gray-200">
                  <td className="sticky left-0 z-10 bg-white px-4 py-4 border-r-2 border-gray-300 font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                        {day}
                      </div>
                      <div>
                        <div className="text-base font-bold text-gray-800">{getDayName(day)}</div>
                        <div className="text-xs text-gray-500">
                          {slots.filter(s => s.day === day).length} classes
                        </div>
                      </div>
                    </div>
                  </td>

                  {timeSlots.map((timeSlot) => {
                    const key = `${day}-${timeSlot}`
                    const slot = scheduleMap.get(key)
                    const isEmpty = !slot

                    return (
                      <td
                        key={timeSlot}
                        className={`px-3 py-3 border-l border-gray-200 align-top ${
                          isEmpty ? 'bg-gray-50' : slot.isLab ? 'bg-purple-50' : 'bg-blue-50'
                        } hover:bg-gray-100 transition-colors`}
                      >
                        {isEmpty ? (
                          <div className="flex items-center justify-center h-full min-h-[80px]">
                            <div className="flex flex-col items-center gap-1 text-gray-400 text-xs">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span>Free</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {/* Subject */}
                            <div className="flex items-start gap-2">
                              <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                                slot.isLab ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-gradient-to-br from-blue-400 to-cyan-400'
                              }`}>
                                <BookOpen className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
                                  {slot.subject.name}
                                </div>
                              </div>
                            </div>

                            {/* Details based on type */}
                            {type === 'faculty' && (
                              <>
                                <div className="flex items-center gap-2 pl-10">
                                  <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-green-700">
                                    {slot.room.number}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 pl-10">
                                  {slot.studentGroup.branch}-{slot.studentGroup.division}
                                  {slot.studentGroup.batch && `-${slot.studentGroup.batch}`}
                                </div>
                              </>
                            )}

                            {type === 'room' && (
                              <>
                                <div className="flex items-center gap-2 pl-10">
                                  <User className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-blue-700 truncate">
                                    {slot.faculty.name}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600 pl-10 truncate">
                                  {slot.faculty.code}
                                </div>
                              </>
                            )}

                            {type === 'student' && (
                              <>
                                <div className="flex items-center gap-2 pl-10">
                                  <User className="w-3 h-3 text-blue-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-blue-700 truncate">
                                    {slot.faculty.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 pl-10">
                                  <MapPin className="w-3 h-3 text-green-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-green-700">
                                    {slot.room.number}
                                  </span>
                                </div>
                              </>
                            )}

                            {/* Type badge */}
                            <div className="pl-10">
                              <div className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                slot.isLab 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-blue-600 text-white'
                              }`}>
                                {slot.isLab ? 'Lab' : 'Theory'}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {slots.filter(s => !s.isLab).length}
          </div>
          <div className="text-sm text-blue-700 mt-1">Theory Classes</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">
            {slots.filter(s => s.isLab).length}
          </div>
          <div className="text-sm text-purple-700 mt-1">Lab Sessions</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {40 - slots.length}
          </div>
          <div className="text-sm text-green-700 mt-1">Free Slots</div>
        </div>
      </div>
    </div>
  )
}
