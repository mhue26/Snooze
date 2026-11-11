import type { SQLiteDatabase } from 'expo-sqlite';
import type { WeekStartsOn } from '../domain/dates';
import type { TimeFormat } from '../domain/sleep';
import type { TargetSleepTimes } from '../domain/targetSleep';

export type DeviceSettings = {
  weekStartsOn: WeekStartsOn;
  timeFormat: TimeFormat;
  sunriseSunsetEnabled: boolean;
  targetSleepTimes: TargetSleepTimes;
};

export type ExportFormat = 'json' | 'csv';

type SleepExportRow = { date: string; bedtimeMinutes: number; wakeMinutes: number };
type NapExportRow = { date: string; startMinutes: number; endMinutes: number };

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function readExportRows(db: SQLiteDatabase): Promise<{ sleepRecords: SleepExportRow[]; naps: NapExportRow[] }> {
  let sleepRecords: SleepExportRow[] = [];
  let naps: NapExportRow[] = [];
  await db.withTransactionAsync(async () => {
    sleepRecords = await db.getAllAsync('SELECT sleep_date AS date, bedtime_minutes AS bedtimeMinutes, wake_minutes AS wakeMinutes FROM sleep_records ORDER BY sleep_date');
    naps = await db.getAllAsync('SELECT sleep_date AS date, start_minutes AS startMinutes, end_minutes AS endMinutes FROM naps ORDER BY sleep_date, start_minutes, id');
  });
  return { sleepRecords, naps };
}

function exportAsJson(settings: DeviceSettings, sleepRecords: SleepExportRow[], naps: NapExportRow[]): string {
  return JSON.stringify(
    { format: 'snooze-export', version: 1, exportedAt: new Date().toISOString(), settings, sleepRecords, naps },
    null,
    2,
  );
}

function exportAsCsv(settings: DeviceSettings, sleepRecords: SleepExportRow[], naps: NapExportRow[]): string {
  const exportedAt = new Date().toISOString();
  const lines = [
    'key,value',
    'format,snooze-export',
    'version,1',
    `exportedAt,${csvCell(exportedAt)}`,
    `weekStartsOn,${csvCell(settings.weekStartsOn)}`,
    `timeFormat,${csvCell(settings.timeFormat)}`,
    `sunriseSunsetEnabled,${csvCell(settings.sunriseSunsetEnabled ? '1' : '0')}`,
    `targetBedtimeMinutes,${csvCell(settings.targetSleepTimes.bedtimeMinutes)}`,
    `targetWakeMinutes,${csvCell(settings.targetSleepTimes.wakeMinutes)}`,
    '',
    'type,date,start_minutes,end_minutes',
    ...sleepRecords.map(record => ['sleep', record.date, record.bedtimeMinutes, record.wakeMinutes].map(csvCell).join(',')),
    ...naps.map(nap => ['nap', nap.date, nap.startMinutes, nap.endMinutes].map(csvCell).join(',')),
  ];
  return lines.join('\n');
}

export async function exportDeviceData(db: SQLiteDatabase, settings: DeviceSettings, format: ExportFormat = 'json'): Promise<string> {
  const { sleepRecords, naps } = await readExportRows(db);
  return format === 'csv' ? exportAsCsv(settings, sleepRecords, naps) : exportAsJson(settings, sleepRecords, naps);
}

export async function clearSleepData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM naps');
    await db.runAsync('DELETE FROM sleep_records');
  });
}
