import * as SecureStore from 'expo-secure-store';
import type { WeekStartsOn } from '../domain/dates';
import type { TimeFormat } from '../domain/sleep';
import { DEFAULT_TARGET_SLEEP, isValidTargetSleepTimes, type TargetSleepTimes } from '../domain/targetSleep';

export const WEEK_STARTS_ON_KEY = 'snooze.settings.weekStartsOn';
export const TIME_FORMAT_KEY = 'snooze.settings.timeFormat';
export const SUNRISE_SUNSET_KEY = 'snooze.settings.sunriseSunset';
export const SUN_LOCATION_KEY = 'snooze.settings.sunLocation';
export const TARGET_BEDTIME_KEY = 'snooze.settings.targetBedtimeMinutes';
export const TARGET_WAKE_KEY = 'snooze.settings.targetWakeMinutes';

export type StoredCoordinates = { latitude: number; longitude: number };

export async function loadWeekStartsOn(): Promise<WeekStartsOn> {
  const value = await SecureStore.getItemAsync(WEEK_STARTS_ON_KEY);
  return value === 'sunday' ? 'sunday' : 'monday';
}

export async function saveWeekStartsOn(value: WeekStartsOn): Promise<void> {
  await SecureStore.setItemAsync(WEEK_STARTS_ON_KEY, value);
}

export async function loadTimeFormat(): Promise<TimeFormat> {
  const value = await SecureStore.getItemAsync(TIME_FORMAT_KEY);
  return value === '24h' ? '24h' : '12h';
}

export async function saveTimeFormat(value: TimeFormat): Promise<void> {
  await SecureStore.setItemAsync(TIME_FORMAT_KEY, value);
}

export async function loadSunriseSunsetEnabled(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(SUNRISE_SUNSET_KEY);
  return value === '1';
}

export async function saveSunriseSunsetEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(SUNRISE_SUNSET_KEY, '1');
  } else {
    await SecureStore.deleteItemAsync(SUNRISE_SUNSET_KEY);
  }
}

export async function loadCachedSunLocation(): Promise<StoredCoordinates | null> {
  const value = await SecureStore.getItemAsync(SUN_LOCATION_KEY);
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed?.latitude === 'number' && typeof parsed?.longitude === 'number') {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveCachedSunLocation(coords: StoredCoordinates | null): Promise<void> {
  if (coords) {
    await SecureStore.setItemAsync(SUN_LOCATION_KEY, JSON.stringify(coords));
  } else {
    await SecureStore.deleteItemAsync(SUN_LOCATION_KEY);
  }
}

function parseMinutesKey(value: string | null): number | null {
  if (value === null) return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed >= 24 * 60) return null;
  return parsed;
}

export async function loadTargetSleepTimes(): Promise<TargetSleepTimes> {
  const [bedRaw, wakeRaw] = await Promise.all([
    SecureStore.getItemAsync(TARGET_BEDTIME_KEY),
    SecureStore.getItemAsync(TARGET_WAKE_KEY),
  ]);
  const bedtimeMinutes = parseMinutesKey(bedRaw);
  const wakeMinutes = parseMinutesKey(wakeRaw);
  if (bedtimeMinutes === null || wakeMinutes === null) return DEFAULT_TARGET_SLEEP;
  const candidate = { bedtimeMinutes, wakeMinutes };
  return isValidTargetSleepTimes(candidate) ? candidate : DEFAULT_TARGET_SLEEP;
}

export async function saveTargetSleepTimes(value: TargetSleepTimes): Promise<void> {
  if (!isValidTargetSleepTimes(value)) throw new Error('Invalid target sleep times');
  await SecureStore.setItemAsync(TARGET_BEDTIME_KEY, String(value.bedtimeMinutes));
  await SecureStore.setItemAsync(TARGET_WAKE_KEY, String(value.wakeMinutes));
}


