"use client"

import { useState, useEffect } from 'react'
import { Clock, AlertCircle, CheckCircle } from 'lucide-react'

interface CustomTimeSlotInputProps {
  onTimeSlotChange: (startTime: string, endTime: string, formattedSlot: string) => void
  onValidationChange?: (isValid: boolean) => void
}

export default function CustomTimeSlotInput({ 
  onTimeSlotChange,
  onValidationChange 
}: CustomTimeSlotInputProps) {
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    validateTimeSlot()
  }, [startTime, endTime])

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  const validateTimeSlot = () => {
    setError('')
    setIsValid(false)

    if (!startTime || !endTime) {
      onValidationChange?.(false)
      return
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const classStart = 9 * 60
    const classEnd = 17 * 60

    if (startMinutes < classStart || startMinutes >= classEnd) {
      setError('Start time must be between 9:00 AM and 5:00 PM')
      onValidationChange?.(false)
      return
    }

    if (endMinutes < classStart || endMinutes > classEnd) {
      setError('End time must be between 9:00 AM and 5:00 PM')
      onValidationChange?.(false)
      return
    }

    if (startMinutes >= endMinutes) {
      setError('End time must be after start time')
      onValidationChange?.(false)
      return
    }

    const duration = endMinutes - startMinutes
    if (duration < 30) {
      setError('Time slot must be at least 30 minutes')
      onValidationChange?.(false)
      return
    }

    if (duration > 240) {
      setError('Time slot cannot exceed 4 hours')
      onValidationChange?.(false)
      return
    }

    const formatTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}:${mins.toString().padStart(2, '0')}`
    }

    const formattedSlot = `${formatTime(startMinutes)}-${formatTime(endMinutes)}`
    setIsValid(true)
    onValidationChange?.(true)
    onTimeSlotChange(startTime, endTime, formattedSlot)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-purple-600" />
        <h3 className="font-semibold text-gray-800">Custom Time Slot</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Start Time
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            min="09:00"
            max="17:00"
            step="300"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg font-semibold"
          />
          <p className="text-xs text-gray-500 mt-1">From 9:00 AM</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            End Time
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            min="09:00"
            max="17:00"
            step="300"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors text-lg font-semibold"
          />
          <p className="text-xs text-gray-500 mt-1">Until 5:00 PM</p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800 text-sm">Invalid Time Slot</div>
            <div className="text-red-700 text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {isValid && !error && startTime && endTime && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-green-800 text-sm">Valid Time Slot</div>
            <div className="text-green-700 text-sm mt-1">
              Duration: {Math.floor((timeToMinutes(endTime) - timeToMinutes(startTime)) / 60)} hours {((timeToMinutes(endTime) - timeToMinutes(startTime)) % 60)} minutes
            </div>
          </div>
          <div className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm">
            {startTime} - {endTime}
          </div>
        </div>
      )}

      <div>
        <div className="text-xs font-medium text-gray-600 mb-2">Quick Presets:</div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Morning (9-12)', start: '09:00', end: '12:00' },
            { label: 'Afternoon (1-5)', start: '13:00', end: '17:00' },
            { label: 'Full Day (9-5)', start: '09:00', end: '17:00' },
            { label: '2 Hours', start: '10:00', end: '12:00' },
          ].map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setStartTime(preset.start)
                setEndTime(preset.end)
              }}
              className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-medium hover:bg-purple-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
