import { expect, jest, test } from '@jest/globals';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { SQLiteDatabase } from 'expo-sqlite';
import { shareDeviceDataExport } from '../src/data/shareDeviceDataExport';
import { DEFAULT_TARGET_SLEEP } from '../src/domain/targetSleep';

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///cache/',
  EncodingType: { UTF8: 'utf8' },
  writeAsStringAsync: jest.fn(async () => {}),
  getContentUriAsync: jest.fn(async (uri: string) => `content://${uri}`),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

const db = {
  withTransactionAsync: async (fn: () => Promise<void>) => fn(),
  getAllAsync: jest.fn(async () => []),
} as unknown as SQLiteDatabase;

test('writes export file and shares with mime type', async () => {
  await shareDeviceDataExport(db, { weekStartsOn: 'monday', timeFormat: '12h', sunriseSunsetEnabled: false, targetSleepTimes: DEFAULT_TARGET_SLEEP }, 'json');

  const writeMock = FileSystem.writeAsStringAsync as jest.Mock;
  expect(writeMock).toHaveBeenCalledTimes(1);
  const [uri, body] = writeMock.mock.calls[0] as [string, string];
  expect(uri).toMatch(/^file:\/\/\/cache\/snooze-export-.*\.json$/);
  expect(body).toContain('"format": "snooze-export"');

  expect(FileSystem.getContentUriAsync).toHaveBeenCalledWith(uri);
  expect(Sharing.shareAsync).toHaveBeenCalledWith(
    `content://${uri}`,
    expect.objectContaining({ mimeType: 'application/json' }),
  );
});
