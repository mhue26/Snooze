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

test('uses custom sleep need as baseline instead of fixed 8h default', () => {
  const day = { date: '2026-11-10', record: { date: '2026-11-10', bedtimeMinutes: 0, wakeMinutes: 360 }, naps: [] }; // 6h sleep (360m)

  // With 7h sleep need (420m), shortfall is 60m
  expect(calculateSleepDebt([day], 420)).toEqual({ minutes: 60, recordedDays: 1 });

  // With 8h sleep need (480m), shortfall is 120m
  expect(calculateSleepDebt([day], 480)).toEqual({ minutes: 120, recordedDays: 1 });

  // With 9h sleep need (540m), shortfall is 180m
  expect(calculateSleepDebt([day], 540)).toEqual({ minutes: 180, recordedDays: 1 });

  // With 6h sleep need (360m), shortfall is 0m
  expect(calculateSleepDebt([day], 360)).toEqual({ minutes: 0, recordedDays: 1 });

  // When sleep exceeds sleep need (e.g. 6h sleep with 5h baseline), debt is 0
  expect(calculateSleepDebt([day], 300)).toEqual({ minutes: 0, recordedDays: 1 });
});

