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