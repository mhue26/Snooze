import * as SecureStore from 'expo-secure-store';
import type { WeekStartsOn } from '../domain/dates';

export const WEEK_STARTS_ON_KEY = 'snooze.settings.weekStartsOn';

export async function loadWeekStartsOn(): Promise<WeekStartsOn> {
  const value = await SecureStore.getItemAsync(WEEK_STARTS_ON_KEY);
  return value === 'sunday' ? 'sunday' : 'monday';
}

export async function saveWeekStartsOn(value: WeekStartsOn): Promise<void> {
  await SecureStore.setItemAsync(WEEK_STARTS_ON_KEY, value);
}
