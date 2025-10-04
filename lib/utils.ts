// lib/utils.ts
// Complete utility functions

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDayName(dayCode: string): string {
  const dayMap: Record<string, string> = {
    'MON': 'Monday',
    'TUE': 'Tuesday', 
    'WED': 'Wednesday',
    'THR': 'Thursday',
    'FRI': 'Friday',
    'SAT': 'Saturday',
    'SUN': 'Sunday'
  }
  return dayMap[dayCode] || dayCode
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

export function timeSlotToRange(slot: string): { start: string; end: string } {
  const [start, end] = slot.split('-')
  return { start, end }
}

export function downloadCSV(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function generateUID(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours} hr`
  return `${hours} hr ${mins} min`
}

export function getTimeSlotIndex(slot: string, allSlots: string[]): number {
  return allSlots.indexOf(slot)
}

export function isTimeSlotBetween(slot: string, start: string, end: string): boolean {
  const slotStart = slot.split('-')[0]
  return slotStart >= start && slotStart < end
}
