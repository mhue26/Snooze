import { shiftDate } from './sleep';

export type WeekStartsOn = 'monday' | 'sunday';

export function parseLocalDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatMonthDay(date: string, locale?: string): string {
  return parseLocalDate(date).toLocaleDateString(locale, { month: 'long', day: 'numeric' });
}

export function weekdayIndex(date: string, weekStartsOn: WeekStartsOn): number {
  const day = parseLocalDate(date).getDay();
  return weekStartsOn === 'sunday' ? day : (day + 6) % 7;
}

export function dayHeaderTitle(selected: string, today: string, locale?: string): string {
  if (selected === today) return 'Today';
  if (selected === shiftDate(today, -1)) return 'Yesterday';
  return formatMonthDay(selected, locale);
}

export const WEEKDAY_LABELS_MONDAY: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const WEEKDAY_LABELS_SUNDAY: readonly string[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function weekdayLabel(index: number, weekStartsOn: WeekStartsOn): string {
  const list = weekStartsOn === 'sunday' ? WEEKDAY_LABELS_SUNDAY : WEEKDAY_LABELS_MONDAY;
  return list[index] ?? '';
}

export function weekdayInitial(index: number, weekStartsOn: WeekStartsOn): string {
  const label = weekdayLabel(index, weekStartsOn);
  return label.charAt(0).toUpperCase();
}

/** Calendar date for weekday slot `index` in the same week as `anchorDate`. */
export function dateForWeekdaySlot(anchorDate: string, slotIndex: number, weekStartsOn: WeekStartsOn): string {
  const active = weekdayIndex(anchorDate, weekStartsOn);
  return shiftDate(anchorDate, slotIndex - active);
}

/** Slot for today only when it belongs to the displayed week. */
export function todayWeekdaySlot(anchorDate: string, today: string, weekStartsOn: WeekStartsOn): number | null {
  const index = weekdayIndex(today, weekStartsOn);
  return dateForWeekdaySlot(anchorDate, index, weekStartsOn) === today ? index : null;
}
