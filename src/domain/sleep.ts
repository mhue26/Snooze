export type SleepRecord = { date: string; bedtimeMinutes: number; wakeMinutes: number };
export type TimeFormat = '12h' | '24h';

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Shift a local calendar date without assuming every day has 24 hours. */
export function shiftDate(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return localDateKey(new Date(year, month - 1, day + days));
}

/** Calendar-day distance, independent of the local daylight-saving offset. */
export function daysBetween(earlier: string, later: string): number {
  const utc = (key: string) => { const [year, month, day] = key.split('-').map(Number); return Date.UTC(year, month - 1, day); };
  return Math.round((utc(later) - utc(earlier)) / 86400000);
}

export function formatSleepTime(minutes: number, timeFormat: TimeFormat = '12h'): string {
  const hour = Math.floor(minutes / 60);
  const minute = String(minutes % 60).padStart(2, '0');
  if (timeFormat === '24h') return `${String(hour).padStart(2, '0')}:${minute}`;
  return `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
}

/** Hours and minutes since midnight as H:MM (e.g. rest duration 8:00). */
export function formatDurationClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  return `${hours}:${String(totalMinutes % 60).padStart(2, '0')}`;
}

export function parseSleepTime(hour: string, minute: string, period: 'AM' | 'PM'): number | null {
  if (!/^\d{1,2}$/.test(hour) || !/^\d{1,2}$/.test(minute)) return null;
  const h = Number(hour), m = Number(minute);
  if (h < 1 || h > 12 || m > 59) return null;
  return (h % 12 + (period === 'PM' ? 12 : 0)) * 60 + m;
}

/** Parse a four-digit HHMM entry using the selected clock format. */
export function parseClockDigits(digits: string, timeFormat: TimeFormat, period: 'AM' | 'PM'): number | null {
  if (!/^\d{4}$/.test(digits)) return null;
  const hour = Number(digits.slice(0, 2)), minute = Number(digits.slice(2));
  if (minute > 59) return null;
  if (timeFormat === '12h') return parseSleepTime(digits.slice(0, 2), digits.slice(2), period);
  return hour < 24 ? hour * 60 + minute : null;
}

/** Elapsed minutes between local date-times, accounting for daylight-saving changes. */
export function sleepDuration(record: SleepRecord): number | null {
  const [year, month, day] = record.date.split('-').map(Number);
  if (!year || !month || !day || record.bedtimeMinutes === record.wakeMinutes) return null;
  const wake = new Date(year, month - 1, day, Math.floor(record.wakeMinutes / 60), record.wakeMinutes % 60);
  const bed = new Date(year, month - 1, day - (record.bedtimeMinutes > record.wakeMinutes ? 1 : 0), Math.floor(record.bedtimeMinutes / 60), record.bedtimeMinutes % 60);
  // Reject nonexistent wall times during a daylight-saving transition.
  if (wake.getHours() !== Math.floor(record.wakeMinutes / 60) || wake.getMinutes() !== record.wakeMinutes % 60 || bed.getHours() !== Math.floor(record.bedtimeMinutes / 60) || bed.getMinutes() !== record.bedtimeMinutes % 60) return null;
  const minutes = (wake.getTime() - bed.getTime()) / 60000;
  return minutes > 0 ? minutes : null;
}
