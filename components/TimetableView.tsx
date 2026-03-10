"use client"

import { Clock, Calendar, User, MapPin, BookOpen } from 'lucide-react'
import { TIME_SLOTS, getSlotIndices, is2HourSlot, isCurrentlyInSlot } from '@/lib/timetable'
import type { TimetableEntry } from '@/lib/timetable'

interface TimetableViewProps {
  entries: TimetableEntry[]
  title: string
  subtitle?: string
  type?: 'room' | 'faculty'
  highlightSlot?: string
}

export default function TimetableView({
  entries,
  title,
  subtitle,
  type = 'faculty',
  highlightSlot
}: TimetableViewProps) {
  // Build a map: standard slot index -> entry (handling 2-hour blocks)
  const slotEntryMap = new Map<number, TimetableEntry>()
  const slotSpanMap = new Map<number, number>()  // slot index -> rowspan
  const skipSlots = new Set<number>()  // slots to skip (covered by a 2-hr block above)

  entries.forEach(entry => {
    const indices = getSlotIndices(entry.Time_Slot)
    if (indices.length === 2) {
      // 2-hour block: first index gets the entry with rowspan=2, second is skipped
      slotEntryMap.set(indices[0], entry)
      slotSpanMap.set(indices[0], 2)
      skipSlots.add(indices[1])
    } else if (indices.length === 1) {
      slotEntryMap.set(indices[0], entry)
      slotSpanMap.set(indices[0], 1)
    }
  })

  const day = entries.length > 0 ? entries[0].Day : ''

  // Count actual teaching hours (2-hr blocks count as 2)
  let totalHours = 0
  entries.forEach(e => totalHours += is2HourSlot(e.Time_Slot) ? 2 : 1)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-4 mb-2">
          {type === 'room' ? (
            <MapPin className="w-8 h-8" />
          ) : (
            <User className="w-8 h-8" />
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{title}</h2>
            {subtitle && <p className="text-blue-100 text-sm mt-1">{subtitle}</p>}
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">Schedule for</div>
            <div className="text-xl font-bold">{day}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-blue-100 text-sm mt-3">
          <BookOpen className="w-4 h-4" />
          <span>{entries.length} {entries.length === 1 ? 'class' : 'classes'} ({totalHours} hours)</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                <th className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2 text-gray-700 font-semibold">
                    <Clock className="w-5 h-5" />
                    Time Slot
                  </div>
                </th>
                {type === 'room' ? (
                  <>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Course</th>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Faculty</th>
                    <th className="px-6 py-4 text-center text-gray-700 font-semibold">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Course</th>
                    <th className="px-6 py-4 text-left text-gray-700 font-semibold">Room</th>
                    <th className="px-6 py-4 text-center text-gray-700 font-semibold">Status</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody>
              {TIME_SLOTS.map((slot, index) => {
                // Skip slots covered by a 2-hour block above
                if (skipSlots.has(index)) return null

                const entry = slotEntryMap.get(index)
                const rowSpan = slotSpanMap.get(index) || 1
                const isHighlighted = highlightSlot === slot ||
                  (entry && isCurrentlyInSlot(entry.Time_Slot))
                const isEmpty = !entry
                const is2Hr = rowSpan === 2

                return (
                  <tr
                    key={slot}
                    className={`border-b border-gray-100 transition-all duration-200 ${isHighlighted
                        ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-l-blue-500'
                        : isEmpty
                          ? 'bg-gray-50 hover:bg-gray-100'
                          : 'hover:bg-blue-50'
                      }`}
                  >
                    <td className="px-6 py-5" rowSpan={rowSpan}>
                      <div className="flex items-center gap-3">
                        <div className={`w-12 ${is2Hr ? 'h-16' : 'h-12'} rounded-lg flex items-center justify-center font-bold text-sm ${isHighlighted
                            ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                            : isEmpty
                              ? 'bg-gray-200 text-gray-500'
                              : is2Hr
                                ? 'bg-gradient-to-br from-orange-200 to-pink-200 text-orange-800'
                                : 'bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700'
                          }`}>
                          {entry ? entry.Time_Slot.split('-')[0].replace(':00', '') : slot.split('-')[0].replace(':00', '')}
                        </div>
                        <div>
                          <div className={`font-semibold ${isHighlighted ? 'text-blue-700' : 'text-gray-800'
                            }`}>
                            {entry ? entry.Time_Slot : slot}
                          </div>
                          <div className="text-xs text-gray-500">
                            {is2Hr ? '2-Hour Lab/Practical' : (
                              <>
                                {index === 0 && 'Morning Session'}
                                {index >= 1 && index <= 3 && 'Mid-Day'}
                                {index === 4 && 'Lunch Break'}
                                {index >= 5 && 'Afternoon Session'}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {isEmpty ? (
                      <>
                        <td colSpan={3} className="px-6 py-5">
                          <div className="flex items-center justify-center gap-2 text-gray-400">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                            <span className="font-medium">Free Slot</span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-5" rowSpan={rowSpan}>
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${is2Hr ? 'bg-gradient-to-br from-purple-400 to-indigo-500' : 'bg-gradient-to-br from-orange-400 to-pink-400'} flex items-center justify-center flex-shrink-0`}>
                              <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-800 line-clamp-2">
                                {entry.Course}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {is2Hr ? 'Lab / Practical' : 'Course'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-5" rowSpan={rowSpan}>
                          {type === 'room' ? (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold">
                                {entry.Faculty_Code.charAt(0)}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-800">{entry.Faculty_Code}</div>
                                <div className="text-xs text-gray-500">{entry.Faculty_Name}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <div className="font-bold text-gray-800 text-lg">{entry.Room || 'TBD'}</div>
                                <div className="text-xs text-gray-500">Room Number</div>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5" rowSpan={rowSpan}>
                          <div className="flex justify-center">
                            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${isHighlighted
                                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                                : is2Hr
                                  ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700'
                                  : 'bg-gradient-to-r from-orange-100 to-pink-100 text-orange-700'
                              }`}>
                              {isHighlighted ? 'Current' : is2Hr ? '2-Hr Block' : 'Scheduled'}
                            </div>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">
            {TIME_SLOTS.length - totalHours}
          </div>
          <div className="text-sm text-green-700 mt-1">Free Hours</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-600">
            {totalHours}
          </div>
          <div className="text-sm text-orange-700 mt-1">Teaching Hours</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">
            {((totalHours / TIME_SLOTS.length) * 100).toFixed(0)}%
          </div>
          <div className="text-sm text-blue-700 mt-1">Utilization</div>
        </div>
      </div>
    </div>
  )
}
