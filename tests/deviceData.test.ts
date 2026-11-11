import { expect, jest, test } from '@jest/globals';
import type { SQLiteDatabase } from 'expo-sqlite';
import { clearSleepData, exportDeviceData } from '../src/data/deviceData';
import { DEFAULT_TARGET_SLEEP } from '../src/domain/targetSleep';

test('exports sleep, naps, and settings in a versioned JSON document', async () => {
  const db = {
    withTransactionAsync: jest.fn(async (work: () => Promise<void>) => work()),
    getAllAsync: jest.fn<() => Promise<unknown>>().mockResolvedValueOnce([{ date: '2026-11-10', bedtimeMinutes: 1320, wakeMinutes: 420 }]).mockResolvedValueOnce([{ date: '2026-11-10', startMinutes: 780, endMinutes: 810 }]),
  };
  const result = JSON.parse(await exportDeviceData(db as unknown as SQLiteDatabase, { weekStartsOn: 'sunday', timeFormat: '12h', sunriseSunsetEnabled: true, targetSleepTimes: DEFAULT_TARGET_SLEEP }));
  expect(result).toMatchObject({ format: 'snooze-export', version: 1, settings: { weekStartsOn: 'sunday', timeFormat: '12h', sunriseSunsetEnabled: true, targetSleepTimes: DEFAULT_TARGET_SLEEP }, sleepRecords: [{ date: '2026-11-10', bedtimeMinutes: 1320, wakeMinutes: 420 }], naps: [{ date: '2026-11-10', startMinutes: 780, endMinutes: 810 }] });
  expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
});

test('exports sleep and naps as CSV with metadata and record rows', async () => {
  const db = {
    withTransactionAsync: jest.fn(async (work: () => Promise<void>) => work()),
    getAllAsync: jest.fn<() => Promise<unknown>>().mockResolvedValueOnce([{ date: '2026-11-10', bedtimeMinutes: 1320, wakeMinutes: 420 }]).mockResolvedValueOnce([{ date: '2026-11-10', startMinutes: 780, endMinutes: 810 }]),
  };
  const csv = await exportDeviceData(db as unknown as SQLiteDatabase, { weekStartsOn: 'monday', timeFormat: '24h', sunriseSunsetEnabled: false, targetSleepTimes: DEFAULT_TARGET_SLEEP }, 'csv');
  expect(csv).toContain('weekStartsOn,monday');
  expect(csv).toContain('timeFormat,24h');
  expect(csv).toContain('sunriseSunsetEnabled,0');
  expect(csv).toContain('type,date,start_minutes,end_minutes');
  expect(csv).toContain('sleep,2026-11-10,1320,420');
  expect(csv).toContain('nap,2026-11-10,780,810');
});

test('clears both record types in a transaction', async () => {
  const db = { withTransactionAsync: jest.fn(async (work: () => Promise<void>) => work()), runAsync: jest.fn<(sql: string) => Promise<void>>().mockResolvedValue(undefined) };
  await clearSleepData(db as unknown as SQLiteDatabase);
  expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
  expect(db.runAsync.mock.calls).toEqual([['DELETE FROM naps'], ['DELETE FROM sleep_records']]);
});
