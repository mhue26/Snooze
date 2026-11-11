import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import type { SQLiteDatabase } from 'expo-sqlite';
import { exportDeviceData, type DeviceSettings, type ExportFormat } from './deviceData';

const MIME_TYPES: Record<ExportFormat, string> = {
  json: 'application/json',
  csv: 'text/csv',
};

const IOS_UTI: Record<ExportFormat, string> = {
  json: 'public.json',
  csv: 'public.comma-separated-values-text',
};

function exportFilename(format: ExportFormat): string {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
  return `snooze-export-${stamp}.${format}`;
}

export async function shareDeviceDataExport(
  db: SQLiteDatabase,
  settings: DeviceSettings,
  format: ExportFormat,
): Promise<void> {
  const body = await exportDeviceData(db, settings, format);
  if (!FileSystem.cacheDirectory) throw new Error('cache-unavailable');

  const fileUri = `${FileSystem.cacheDirectory}${exportFilename(format)}`;
  await FileSystem.writeAsStringAsync(fileUri, body, { encoding: FileSystem.EncodingType.UTF8 });

  if (!(await Sharing.isAvailableAsync())) throw new Error('sharing-unavailable');

  const shareUri = Platform.OS === 'android' ? await FileSystem.getContentUriAsync(fileUri) : fileUri;
  await Sharing.shareAsync(shareUri, {
    mimeType: MIME_TYPES[format],
    dialogTitle: `Snooze export (${format.toUpperCase()})`,
    UTI: IOS_UTI[format],
  });
}
