import type { SQLiteDatabase } from 'expo-sqlite';
import type { SleepRecord } from '../domain/sleep';

export async function loadSleepRecord(db: SQLiteDatabase, date: string): Promise<SleepRecord | null> {
  const row = await db.getFirstAsync<{ sleep_date: string; bedtime_minutes: number; wake_minutes: number }>('SELECT sleep_date, bedtime_minutes, wake_minutes FROM sleep_records WHERE sleep_date = ?', date);
  return row ? { date: row.sleep_date, bedtimeMinutes: row.bedtime_minutes, wakeMinutes: row.wake_minutes } : null;
}

export async function saveSleepRecord(db: SQLiteDatabase, record: SleepRecord): Promise<void> {
  await db.runAsync('INSERT INTO sleep_records (sleep_date, bedtime_minutes, wake_minutes) VALUES (?, ?, ?) ON CONFLICT(sleep_date) DO UPDATE SET bedtime_minutes = excluded.bedtime_minutes, wake_minutes = excluded.wake_minutes', record.date, record.bedtimeMinutes, record.wakeMinutes);
}
