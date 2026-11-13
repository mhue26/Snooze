export const DEFAULT_SLEEP_NEED_MINUTES = 480; // 8h00
export const MIN_SLEEP_NEED_MINUTES = 360; // 6h00
export const MAX_SLEEP_NEED_MINUTES = 600; // 10h00

export function isValidSleepNeed(minutes: unknown): minutes is number {
  return (
    typeof minutes === 'number' &&
    Number.isInteger(minutes) &&
    minutes >= MIN_SLEEP_NEED_MINUTES &&
    minutes <= MAX_SLEEP_NEED_MINUTES
  );
}

export function clampSleepNeed(minutes: number): number {
  return Math.min(MAX_SLEEP_NEED_MINUTES, Math.max(MIN_SLEEP_NEED_MINUTES, Math.round(minutes)));
}

/** Suggested sleep need based on target sleep window, clamped to 6h00 - 10h00. */
export function suggestedSleepNeedMinutes(
  targetWindowMinutes: number | null,
  fallback = DEFAULT_SLEEP_NEED_MINUTES,
): number {
  if (targetWindowMinutes === null || !Number.isFinite(targetWindowMinutes)) {
    return clampSleepNeed(fallback);
  }
  return clampSleepNeed(targetWindowMinutes);
}

/** Suggested bedtime = target wake time minus sleep need. */
export function suggestedBedtimeMinutes(wakeMinutes: number, sleepNeedMinutes: number): number {
  return ((wakeMinutes - sleepNeedMinutes) % 1440 + 1440) % 1440;
}

export function formatDurationDigits(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}${String(minutes).padStart(2, '0')}`;
}

export type ParseSleepNeedResult =
  | { success: true; minutes: number }
  | { success: false; error: string };

export function parseSleepNeedDigits(digits: string): ParseSleepNeedResult {
  if (!/^\d{4}$/.test(digits)) {
    return { success: false, error: 'Enter hours and minutes as HH:MM.' };
  }
  const hours = Number(digits.slice(0, 2));
  const minutes = Number(digits.slice(2));
  if (minutes > 59) {
    return { success: false, error: 'Enter valid minutes from 00 to 59.' };
  }
  const total = hours * 60 + minutes;
  if (total < MIN_SLEEP_NEED_MINUTES || total > MAX_SLEEP_NEED_MINUTES) {
    return { success: false, error: 'Enter a sleep need between 6:00 and 10:00.' };
  }
  return { success: true, minutes: total };
}
