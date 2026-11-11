import type { Nap } from '../data/naps';
import { sleepDuration, type SleepRecord } from './sleep';

export const DEBT_WINDOW_DAYS = 14;
export const DEBT_BASELINE_MINUTES = 8 * 60;

type Day = { date: string; record: SleepRecord | null; naps: Nap[] };
type Interval = { start: number; end: number };

function instant(date: string, minutes: number, previousDay = false): number {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day - (previousDay ? 1 : 0), Math.floor(minutes / 60), minutes % 60).getTime();
}

/** Sum daily shortfalls, ignoring unrecorded nights and counting overlapping sleep only once. */
export function calculateSleepDebt(
  days: Day[],
  baselineMinutes: number = DEBT_BASELINE_MINUTES,
): { minutes: number; recordedDays: number } {
  const sleeps: Interval[] = days.flatMap(({ record }) => {
    if (!record || sleepDuration(record) === null) return [];
    return [{ start: instant(record.date, record.bedtimeMinutes, record.bedtimeMinutes > record.wakeMinutes), end: instant(record.date, record.wakeMinutes) }];
  });
  let minutes = 0;
  let recordedDays = 0;
  for (const { date, record, naps } of days) {
    const duration = record && sleepDuration(record);
    if (duration == null) continue;
    recordedDays++;
    let total = duration;
    const intervals: Interval[] = [...sleeps];
    for (const nap of naps) {
      const start = instant(date, nap.startMinutes), end = instant(date, nap.endMinutes);
      if (nap.endMinutes <= nap.startMinutes || sleepDuration({ date, bedtimeMinutes: nap.startMinutes, wakeMinutes: nap.endMinutes }) === null) continue;
      // Union overlapping sleep and prior naps before subtracting their overlap.
      const overlaps = intervals.map(interval => ({ start: Math.max(start, interval.start), end: Math.min(end, interval.end) })).filter(interval => interval.end > interval.start).sort((a, b) => a.start - b.start);
      let overlap = 0, coveredUntil = start;
      for (const interval of overlaps) { overlap += Math.max(0, interval.end - Math.max(interval.start, coveredUntil)); coveredUntil = Math.max(coveredUntil, interval.end); }
      total += (end - start - overlap) / 60000;
      intervals.push({ start, end });
    }
    minutes += Math.max(0, baselineMinutes - total);
  }
  return { minutes: Math.round(minutes), recordedDays };
}
