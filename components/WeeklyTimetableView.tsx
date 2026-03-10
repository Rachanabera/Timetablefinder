"use client"

import { Clock, User, BookOpen, MapPin, Calendar } from 'lucide-react'
import { TIME_SLOTS, DAYS, getSlotIndices, is2HourSlot, isCurrentlyInSlot } from '@/lib/timetable'
import { getDayName } from '@/lib/utils'
import type { TimetableEntry } from '@/lib/timetable'

interface WeeklyTimetableViewProps {
  entries: TimetableEntry[]
  title: string
  subtitle?: string
  type?: 'room' | 'faculty'
  highlightDay?: string
  highlightSlot?: string
}

export default function WeeklyTimetableView({
  entries,
  title,
  subtitle,
  type = 'faculty',
  highlightDay,
  highlightSlot
}: WeeklyTimetableViewProps) {
  // Build schedule map: day -> slot index -> { entry, colSpan }
  type CellInfo = { entry: TimetableEntry; colSpan: number }
  const scheduleMap = new Map<string, Map<number, CellInfo>>()
  const skipCells = new Map<string, Set<number>>() // day -> set of slot indices to skip

  DAYS.forEach(day => {
    scheduleMap.set(day, new Map())
    skipCells.set(day, new Set())
  })

  entries.forEach(entry => {
    const dayMap = scheduleMap.get(entry.Day)
    const daySkip = skipCells.get(entry.Day)
    if (!dayMap || !daySkip) return

    const indices = getSlotIndices(entry.Time_Slot)
    if (indices.length === 2) {
      // 2-hour block: first index gets entry with colSpan=2, second is skipped
      dayMap.set(indices[0], { entry, colSpan: 2 })
      daySkip.add(indices[1])
    } else if (indices.length === 1) {
      dayMap.set(indices[0], { entry, colSpan: 1 })
    }
  })

  // Calculate statistics - count actual hours
  let totalHours = 0
  entries.forEach(e => totalHours += is2HourSlot(e.Time_Slot) ? 2 : 1)
  const totalSlots = DAYS.length * TIME_SLOTS.length
  const freeSlots = totalSlots - totalHours
  const utilization = ((totalHours / totalSlots) * 100).toFixed(1)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className={`bg-gradient-to-r ${type === 'room' ? 'from-blue-600 to-cyan-600' : 'from-orange-600 to-red-600'
        } rounded-xl p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {type === 'room' ? <MapPin className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className={`${type === 'room' ? 'text-blue-100' : 'text-orange-100'} text-sm mt-1`}>{subtitle}</p>}
          </div>
          <div className="text-right">
            <div className={`text-sm ${type === 'room' ? 'text-blue-100' : 'text-orange-100'}`}>Complete Week</div>
            <div className="text-xl font-bold">MON - FRI</div>
          </div>
        </div>
        <div className={`flex items-center gap-6 ${type === 'room' ? 'text-blue-100' : 'text-orange-100'} text-sm`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>{entries.length} {type === 'room' ? 'bookings' : 'classes'} ({totalHours} hours)</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{utilization}% utilization</span>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Grid */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Table Header - Time Slots */}
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                <th className="sticky left-0 z-10 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 border-r-2 border-gray-300">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Calendar className="w-5 h-5" />
                    Day
                  </div>
                </th>
                {TIME_SLOTS.map((slot, index) => (
                  <th
                    key={slot}
                    className={`px-3 py-4 text-center border-l border-gray-200 min-w-[140px] ${highlightSlot === slot ? 'bg-orange-100' : ''
                      }`}
                  >
                    <div className={`font-bold text-sm ${highlightSlot === slot ? 'text-orange-600' : 'text-gray-800'
                      }`}>
                      {slot}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {index === 0 && 'Morning'}
                      {index >= 1 && index <= 3 && 'Mid-Day'}
                      {index === 4 && 'Lunch'}
                      {index >= 5 && 'Afternoon'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body - Days as Rows */}
            <tbody>
              {DAYS.map((day) => {
                const isHighlightedDay = highlightDay === day
                const dayMap = scheduleMap.get(day)
                const daySkip = skipCells.get(day)

                // Count classes for this day
                const dayEntries = entries.filter(e => e.Day === day)
                let dayHours = 0
                dayEntries.forEach(e => dayHours += is2HourSlot(e.Time_Slot) ? 2 : 1)

                return (
                  <tr
                    key={day}
                    className={`border-t border-gray-200 ${isHighlightedDay ? 'bg-orange-50' : ''
                      }`}
                  >
                    {/* Day Column */}
                    <td className={`sticky left-0 z-10 px-4 py-4 border-r-2 border-gray-300 font-semibold ${isHighlightedDay ? 'bg-orange-100' : 'bg-white'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${isHighlightedDay
                            ? 'bg-gradient-to-br from-orange-500 to-red-500 text-white shadow-md'
                            : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'
                          }`}>
                          {day}
                        </div>
                        <div>
                          <div className="text-base font-bold text-gray-800">{getDayName(day)}</div>
                          <div className="text-xs text-gray-500">
                            {dayEntries.length} {type === 'room' ? 'bookings' : 'classes'} ({dayHours}h)
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Time Slot Columns */}
                    {TIME_SLOTS.map((slot, slotIndex) => {
                      // Skip cells covered by a 2-hour block in the previous column
                      if (daySkip?.has(slotIndex)) return null

                      const cellInfo = dayMap?.get(slotIndex)
                      const entry = cellInfo?.entry
                      const colSpan = cellInfo?.colSpan || 1
                      const isHighlighted = isHighlightedDay && highlightSlot === slot
                      const isEmpty = !entry
                      const is2Hr = colSpan === 2

                      return (
                        <td
                          key={`${day}-${slot}`}
                          colSpan={colSpan}
                          className={`px-3 py-3 border-l border-gray-200 align-top ${isHighlighted
                              ? 'bg-gradient-to-br from-orange-100 to-red-100 border-l-4 border-l-orange-500'
                              : isEmpty
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : is2Hr
                                  ? 'bg-purple-50 hover:bg-purple-100'
                                  : 'hover:bg-blue-50 bg-white'
                            } transition-colors duration-200`}
                        >
                          {isEmpty ? (
                            <div className="flex items-center justify-center h-full min-h-[70px]">
                              <div className="flex flex-col items-center gap-1 text-gray-400 text-xs">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="font-medium">Free</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Course */}
                              <div className="flex items-start gap-2">
                                <div className={`w-8 h-8 rounded-md ${is2Hr ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 'bg-gradient-to-br from-orange-400 to-pink-400'} flex items-center justify-center flex-shrink-0`}>
                                  <BookOpen className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight">
                                    {entry.Course}
                                  </div>
                                  {is2Hr && (
                                    <div className="text-xs text-purple-600 font-medium mt-0.5">
                                      {entry.Time_Slot} (2hr)
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Faculty or Room */}
                              {type === 'room' ? (
                                <div className="flex items-center gap-2 pl-10">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
                                    {entry.Faculty_Code.charAt(0)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-blue-700">{entry.Faculty_Code}</div>
                                    <div className="text-xs text-gray-500 truncate">{entry.Faculty_Name}</div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 pl-10">
                                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  <span className="text-xs font-bold text-green-700">
                                    {entry.Room || 'TBD'}
                                  </span>
                                </div>
                              )}

                              {/* Status Badge */}
                              {isHighlighted && (
                                <div className="pl-10">
                                  <div className="inline-block px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded text-xs font-semibold shadow-md">
                                    Current
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">{freeSlots}</div>
          <div className="text-sm text-green-700 mt-1">Free Hours</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">{totalHours}</div>
          <div className="text-sm text-orange-700 mt-1">{type === 'room' ? 'Booked Hours' : 'Teaching Hours'}</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">{utilization}%</div>
          <div className="text-sm text-blue-700 mt-1">Utilization</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-600">{totalSlots}</div>
          <div className="text-sm text-purple-700 mt-1">Total Slots</div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center justify-center gap-8 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
            <span className="text-gray-700">1-Hr Lecture</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-50 border border-purple-300 rounded"></div>
            <span className="text-gray-700">2-Hr Lab/Practical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
            <span className="text-gray-700">Free Slot</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-br from-orange-100 to-red-100 border-l-4 border-l-orange-500 rounded"></div>
            <span className="text-gray-700">Current Time</span>
          </div>
        </div>
      </div>
    </div>
  )
}
