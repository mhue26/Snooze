import { expect, test } from '@jest/globals';
import { calculateSleepDebt } from '../src/domain/sleepDebt';

test('counts shortfalls from recorded nights and excludes missing days', () => {
  const result = calculateSleepDebt([
    { date: '2026-11-10', record: { date: '2026-11-10', bedtimeMinutes: 60, wakeMinutes: 420 }, naps: [] },
    { date: '2026-11-09', record: null, naps: [] },
    { date: '2026-11-08', record: { date: '2026-11-08', bedtimeMinutes: 0, wakeMinutes: 540 }, naps: [] },
  ]);
  expect(result).toEqual({ minutes: 120, recordedDays: 2 });
});

test('counts nap time once when it overlaps sleep or another nap', () => {
  const date = '2026-11-10';
  const result = calculateSleepDebt([{ date, record: { date, bedtimeMinutes: 0, wakeMinutes: 360 }, naps: [
    { id: 1, date, startMinutes: 330, endMinutes: 390 },
    { id: 2, date, startMinutes: 375, endMinutes: 420 },
  ] }]);
  expect(result).toEqual({ minutes: 60, recordedDays: 1 });
});
