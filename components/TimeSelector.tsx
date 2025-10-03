"use client"

import { Clock, Calendar as CalendarIcon } from 'lucide-react'
import { getDayName } from '@/lib/utils'
import { DAYS, TIME_SLOTS } from '@/lib/timetable'

interface TimeSelectorProps {
  selectedDay: string
  selectedTime: string
  onDayChange: (day: string) => void
  onTimeChange: (time: string) => void
  useCurrentTime: boolean
  onToggleCurrentTime: (useCurrent: boolean) => void
  currentDay?: string
  currentTime?: string
}

export default function TimeSelector({
  selectedDay,
  selectedTime,
  onDayChange,
  onTimeChange,
  useCurrentTime,
  onToggleCurrentTime,
  currentDay = '',
  currentTime = ''
}: TimeSelectorProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md space-y-6">
      {/* Toggle Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="font-semibold text-gray-800">Time Selection</h3>
            <p className="text-sm text-gray-500">
              {useCurrentTime ? 'Using system time' : 'Manual selection'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onToggleCurrentTime(!useCurrentTime)}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            useCurrentTime ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              useCurrentTime ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Current Time Display (when using system time) */}
      {useCurrentTime && currentDay && currentTime && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Current Day</div>
              <div className="text-lg font-bold text-blue-600">{getDayName(currentDay)}</div>
              <div className="text-xs text-gray-500">{currentDay}</div>
            </div>
            <div className="w-px h-12 bg-blue-200" />
            <div className="text-center">
              <div className="text-xs text-gray-600 mb-1">Current Time</div>
              <div className="text-lg font-bold text-purple-600">{currentTime}</div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Selection (when not using system time) */}
      {!useCurrentTime && (
        <div className="space-y-4">
          {/* Day Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Day
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => onDayChange(day)}
                  className={`py-3 px-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    selectedDay === day
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDay && (
              <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Selected: <span className="font-semibold text-blue-600">{getDayName(selectedDay)}</span>
              </div>
            )}
          </div>

          {/* Time Slot Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select Time Slot
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot}
                  onClick={() => onTimeChange(slot)}
                  className={`py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 ${
                    selectedTime === slot
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-4 h-4" />
                    {slot}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selection Summary */}
          {selectedDay && selectedTime && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
              <div className="text-center">
                <div className="text-xs text-gray-600 mb-1">Viewing Schedule For</div>
                <div className="text-lg font-bold text-gray-800">
                  {getDayName(selectedDay)} at {selectedTime}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}