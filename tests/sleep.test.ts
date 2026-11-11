import { expect, jest, test } from '@jest/globals';
import type { SQLiteDatabase } from 'expo-sqlite';
import { loadSleepRecord, saveSleepRecord } from '../src/data/sleepRecords';
import { daysBetween, formatSleepTime, localDateKey, parseClockDigits, parseSleepTime, shiftDate, sleepDuration } from '../src/domain/sleep';

test('parses and formats 12-hour time including noon and midnight', () => {
  expect(parseSleepTime('12', '00', 'AM')).toBe(0);
  expect(parseSleepTime('12', '00', 'PM')).toBe(720);
  expect(parseSleepTime('11', '15', 'PM')).toBe(1395);
  expect(formatSleepTime(0)).toBe('12:00 AM');
  expect(formatSleepTime(775)).toBe('12:55 PM');
  expect(formatSleepTime(0, '24h')).toBe('00:00');
  expect(formatSleepTime(775, '24h')).toBe('12:55');
  for (const [h, m] of [['', '0'], ['0', '00'], ['13', '00'], ['1', '60'], ['1', '-1']]) expect(parseSleepTime(h, m, 'AM')).toBeNull();
});

test('assigns dates locally and calculates overnight and same-day sleep', () => {
  expect(localDateKey(new Date(2026, 10, 9, 23, 59))).toBe('2026-11-09');
  expect(localDateKey(new Date(2026, 10, 10, 0, 0))).toBe('2026-11-10');
  expect(sleepDuration({ date: '2026-11-10', bedtimeMinutes: 1395, wakeMinutes: 415 })).toBe(460);
  expect(sleepDuration({ date: '2026-11-10', bedtimeMinutes: 60, wakeMinutes: 480 })).toBe(420);
  expect(sleepDuration({ date: '2026-11-10', bedtimeMinutes: 60, wakeMinutes: 60 })).toBeNull();
});

test('loads a date-keyed record and saves updates with bound values', async () => {
  const getFirstAsync = jest.fn<() => Promise<unknown>>().mockResolvedValueOnce(null).mockResolvedValueOnce({ sleep_date: '2026-11-10', bedtime_minutes: 1395, wake_minutes: 415 });
  const runAsync = jest.fn<(sql: string, date: string, bed: number, wake: number) => Promise<unknown>>().mockResolvedValue(undefined);
  const db = { getFirstAsync, runAsync } as unknown as SQLiteDatabase;
  expect(await loadSleepRecord(db, '2026-11-09')).toBeNull();
  const record = await loadSleepRecord(db, '2026-11-10');
  expect(record).toEqual({ date: '2026-11-10', bedtimeMinutes: 1395, wakeMinutes: 415 });
  await saveSleepRecord(db, record!);
  expect(runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(sleep_date) DO UPDATE'), '2026-11-10', 1395, 415);
});

test('propagates database errors so the UI can show a retry', async () => {
  const db = { getFirstAsync: jest.fn<() => Promise<unknown>>().mockRejectedValue(new Error('read failed')), runAsync: jest.fn<() => Promise<unknown>>().mockRejectedValue(new Error('write failed')) } as unknown as SQLiteDatabase;
  await expect(loadSleepRecord(db, '2026-11-10')).rejects.toThrow('read failed');
  await expect(saveSleepRecord(db, { date: '2026-11-10', bedtimeMinutes: 1395, wakeMinutes: 415 })).rejects.toThrow('write failed');
});

test('accounts for daylight saving when the local timezone observes it', () => {
  // 8 March 2026 is the New York spring-forward transition.
  const before = new Date(2026, 2, 8, 1).getTimezoneOffset();
  const after = new Date(2026, 2, 8, 4).getTimezoneOffset();
  if (before - after !== 60) return;
  expect(sleepDuration({ date: '2026-03-08', bedtimeMinutes: 1380, wakeMinutes: 420 })).toBe(420);
  expect(sleepDuration({ date: '2026-03-08', bedtimeMinutes: 1380, wakeMinutes: 150 })).toBeNull();
});


test('navigates local calendar days across months, years and daylight saving', () => {
  expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
  expect(shiftDate('2026-03-08', 1)).toBe('2026-03-09');
  expect(shiftDate('2024-03-01', -1)).toBe('2024-02-29');
  expect(daysBetween('2026-03-07', '2026-03-09')).toBe(2);
  expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
});


test('parses complete time entries in the chosen clock format', () => {
  expect(parseClockDigits('0000', '24h', 'AM')).toBe(0);
  expect(parseClockDigits('2359', '24h', 'PM')).toBe(1439);
  expect(parseClockDigits('2400', '24h', 'AM')).toBeNull();
  expect(parseClockDigits('1260', '24h', 'AM')).toBeNull();
  expect(parseClockDigits('1200', '12h', 'AM')).toBe(0);
  expect(parseClockDigits('1200', '12h', 'PM')).toBe(720);
  expect(parseClockDigits('0130', '12h', 'PM')).toBe(810);
  expect(parseClockDigits('0030', '12h', 'AM')).toBeNull();
  expect(parseClockDigits('930', '12h', 'AM')).toBeNull();
});
