import { beforeEach, expect, jest, test } from '@jest/globals';
import * as SecureStore from 'expo-secure-store';
import {
  loadCachedSunLocationFetchedAt,
  loadSleepNeedMinutes,
  saveCachedSunLocation,
  saveCachedSunLocationFetchedAt,
  saveSleepNeedMinutes,
  SLEEP_NEED_KEY,
  SUN_LOCATION_FETCHED_AT_KEY,
  SUN_LOCATION_KEY,
} from '../src/data/settingsPrefs';
import { DEFAULT_SLEEP_NEED_MINUTES } from '../src/domain/sleepNeed';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const mockGetItem = jest.mocked(SecureStore.getItemAsync);
const mockSetItem = jest.mocked(SecureStore.setItemAsync);
const mockDeleteItem = jest.mocked(SecureStore.deleteItemAsync);

beforeEach(() => {
  jest.clearAllMocks();
});

test('loads default 480 minutes when no sleep need is stored', async () => {
  mockGetItem.mockResolvedValueOnce(null);
  const result = await loadSleepNeedMinutes();
  expect(result).toBe(DEFAULT_SLEEP_NEED_MINUTES);
  expect(mockGetItem).toHaveBeenCalledWith(SLEEP_NEED_KEY);
});

test('loads default 480 minutes when stored sleep need is invalid or out of range', async () => {
  mockGetItem.mockResolvedValueOnce('300'); // < 360
  expect(await loadSleepNeedMinutes()).toBe(480);

  mockGetItem.mockResolvedValueOnce('720'); // > 600
  expect(await loadSleepNeedMinutes()).toBe(480);

  mockGetItem.mockResolvedValueOnce('invalid');
  expect(await loadSleepNeedMinutes()).toBe(480);
});

test('loads valid stored sleep need minutes', async () => {
  mockGetItem.mockResolvedValueOnce('450');
  expect(await loadSleepNeedMinutes()).toBe(450);
});

test('saves valid sleep need minutes and rejects invalid values', async () => {
  mockSetItem.mockResolvedValue(undefined);

  await saveSleepNeedMinutes(540);
  expect(mockSetItem).toHaveBeenCalledWith(SLEEP_NEED_KEY, '540');

  await expect(saveSleepNeedMinutes(200)).rejects.toThrow();
  await expect(saveSleepNeedMinutes(800)).rejects.toThrow();
});

test('loads and saves cached sun location fetched at timestamp', async () => {
  mockGetItem.mockResolvedValueOnce('2026-11-13T08:00:00.000Z');
  const fetchedAt = await loadCachedSunLocationFetchedAt();
  expect(fetchedAt).toBe('2026-11-13T08:00:00.000Z');

  mockSetItem.mockResolvedValue(undefined);
  await saveCachedSunLocationFetchedAt('2026-11-13T10:00:00.000Z');
  expect(mockSetItem).toHaveBeenCalledWith(SUN_LOCATION_FETCHED_AT_KEY, '2026-11-13T10:00:00.000Z');

  mockDeleteItem.mockResolvedValue(undefined);
  await saveCachedSunLocationFetchedAt(null);
  expect(mockDeleteItem).toHaveBeenCalledWith(SUN_LOCATION_FETCHED_AT_KEY);
});

test('clearing cached sun location also deletes fetched at timestamp', async () => {
  mockDeleteItem.mockResolvedValue(undefined);
  await saveCachedSunLocation(null);
  expect(mockDeleteItem).toHaveBeenCalledWith(SUN_LOCATION_KEY);
  expect(mockDeleteItem).toHaveBeenCalledWith(SUN_LOCATION_FETCHED_AT_KEY);
});
