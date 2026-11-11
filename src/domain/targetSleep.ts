import { sleepDuration } from './sleep';

export type TargetSleepTimes = {
  bedtimeMinutes: number;
  wakeMinutes: number;
};

/** Default 11:00 PM – 7:00 AM (8 hours). */
export const DEFAULT_TARGET_SLEEP: TargetSleepTimes = {
  bedtimeMinutes: 23 * 60,
  wakeMinutes: 7 * 60,
};

/** Reference calendar day for duration math (no DST transition on this date in common zones). */
const REFERENCE_DATE = '2026-06-15';

export function targetSleepDurationMinutes(target: TargetSleepTimes): number | null {
  return sleepDuration({ date: REFERENCE_DATE, ...target });
}

export function isValidTargetSleepTimes(target: TargetSleepTimes): boolean {
  if (target.bedtimeMinutes === target.wakeMinutes) return false;
  const duration = targetSleepDurationMinutes(target);
  return duration !== null && duration > 0;
}

export function formatTargetSleepRange(
  target: TargetSleepTimes,
  formatTime: (minutes: number) => string,
): string {
  return `${formatTime(target.bedtimeMinutes)} – ${formatTime(target.wakeMinutes)}`;
}
