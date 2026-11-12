/** A gesture beginning beyond Yesterday must stop there before it can reach Today. */
export function startsInOlderHistory(offset: number, yesterdayOffset: number): boolean {
  return yesterdayOffset > 0 && offset > yesterdayOffset + 24;
}

/** A fresh, intentional swipe from Yesterday should be enough to return to Today. */
export function wantsToday(start: number, end: number, velocity: number, yesterdayOffset: number): boolean {
  if (yesterdayOffset <= 0 || Math.abs(start - yesterdayOffset) > 24) return false;
  return start - end >= 24 || (end < start - 2 && velocity <= -0.25);
}

/** Decide whether a deliberate gesture may switch between Today and the history surface. */
export function historySurfaceRelease(historyMode: boolean, beganAtHistoryBoundary: boolean, displacement: number): 'today' | 'yesterday' | null {
  if (historyMode && beganAtHistoryBoundary && displacement <= -24) return 'today';
  if (!historyMode && displacement >= 35) return 'yesterday';
  return null;
}

/** Allow small native scroll-offset rounding at the Yesterday boundary. */
export function atHistoryBoundary(offset: number): boolean {
  return Number.isFinite(offset) && offset <= 8;
}

/** Treat a visible Yesterday as the return point even when its card extends beyond the viewport. */
export function canBeginTodaySwipe(offset: number, selected: string, yesterday: string): boolean {
  return selected === yesterday || atHistoryBoundary(offset);
}
