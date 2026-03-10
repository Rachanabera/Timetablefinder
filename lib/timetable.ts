export interface TimetableEntry {
  Faculty_Name: string;
  Faculty_Code: string;
  Day: string;
  Time_Slot: string;
  Course: string;
  Room: string;
}

export const TIME_SLOTS = [
  '9:00-10:00',
  '10:00-11:00',
  '11:00-12:00',
  '12:00-1:00',
  '1:00-2:00',
  '2:00-3:00',
  '3:00-4:00',
  '4:00-5:00',
];

export const DAYS = ['MON', 'TUE', 'WED', 'THR', 'FRI'];

export function getCurrentDay(): string {
  const days = ['SUN', 'MON', 'TUE', 'WED', 'THR', 'FRI', 'SAT'];
  return days[new Date().getDay()];
}

export function getCurrentTimeSlot(): string | null {
  const hour = new Date().getHours();

  if (hour >= 9 && hour < 10) return '9:00-10:00';
  if (hour >= 10 && hour < 11) return '10:00-11:00';
  if (hour >= 11 && hour < 12) return '11:00-12:00';
  if (hour >= 12 && hour < 13) return '12:00-1:00';
  if (hour >= 13 && hour < 14) return '1:00-2:00';
  if (hour >= 14 && hour < 15) return '2:00-3:00';
  if (hour >= 15 && hour < 16) return '3:00-4:00';
  if (hour >= 16 && hour < 17) return '4:00-5:00';

  return null;
}

/**
 * Convert a time string like "9:00", "11:00", "1:00", "12:00" to a 24hr number for sorting.
 * Times 1:00-5:00 are treated as PM (13:00-17:00).
 */
export function timeToHour(time: string): number {
  const [hourStr] = time.split(':');
  let hour = parseInt(hourStr);
  // Times from 1-8 are PM (after noon)
  if (hour >= 1 && hour <= 8) hour += 12;
  return hour;
}

/**
 * Get the start hour of a time slot (works with both "9:00-10:00" and "11:00-1:00")
 */
export function getSlotStartHour(slot: string): number {
  const startTime = slot.split('-')[0];
  return timeToHour(startTime);
}

/**
 * Check if a time slot is a 2-hour combined slot (e.g., "11:00-1:00", "3:00-5:00")
 */
export function is2HourSlot(slot: string): boolean {
  const [start, end] = slot.split('-');
  const startHour = timeToHour(start);
  const endHour = timeToHour(end);
  return (endHour - startHour) === 2;
}

/**
 * Get the standard TIME_SLOTS indices that a time slot covers.
 * A 1-hour slot covers 1 index, a 2-hour slot covers 2 indices.
 */
export function getSlotIndices(slot: string): number[] {
  const startHour = getSlotStartHour(slot);
  const firstIdx = TIME_SLOTS.findIndex(s => getSlotStartHour(s) === startHour);

  if (firstIdx === -1) return [];

  if (is2HourSlot(slot)) {
    return [firstIdx, firstIdx + 1].filter(i => i < TIME_SLOTS.length);
  }

  return [firstIdx];
}

/**
 * Check if the current time falls within a given time slot (including combined 2-hour slots)
 */
export function isCurrentlyInSlot(slot: string): boolean {
  const hour = new Date().getHours();
  const [start, end] = slot.split('-');
  const startHour = timeToHour(start);
  const endHour = timeToHour(end);
  return hour >= startHour && hour < endHour;
}