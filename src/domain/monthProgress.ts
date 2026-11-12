import { parseLocalDate } from './dates';

/** Progress from the newest day (0) to the oldest day (1) of the displayed month. */
export function monthProgress(date: string, today: string, fraction = 0): { label: string; progress: number } {
  const selected = parseLocalDate(date);
  const now = parseLocalDate(today);
  const year = selected.getFullYear(), month = selected.getMonth();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const newest = isCurrentMonth ? now.getDate() : new Date(year, month + 1, 0).getDate();
  const day = Math.min(newest, Math.max(1, selected.getDate() - Math.max(0, Math.min(1, fraction))));
  const label = selected.toLocaleDateString(undefined, { month: 'long', ...(year !== now.getFullYear() ? { year: 'numeric' } : {}) });
  return { label, progress: newest > 1 ? (newest - day) / (newest - 1) : 0 };
}
