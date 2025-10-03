export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function getDayName(day: string): string {
  const dayMap: Record<string, string> = {
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THR: 'Thursday',
    FRI: 'Friday',
  };
  return dayMap[day] || day;
}