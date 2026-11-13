import { localDateKey } from './sleep';

/**
 * Determines whether device location should be refreshed for sunrise/sunset times.
 * Refreshes at most once per calendar day (in local time), or if no location is stored yet.
 */
export function shouldRefreshLocation(
  lastFetchedAt: Date | string | number | null | undefined,
  now: Date = new Date(),
  hasStoredLocation: boolean = true,
): boolean {
  if (!hasStoredLocation || lastFetchedAt === null || lastFetchedAt === undefined) {
    return true;
  }
  const lastDate = typeof lastFetchedAt === 'object' ? lastFetchedAt : new Date(lastFetchedAt);
  if (Number.isNaN(lastDate.getTime())) {
    return true;
  }
  return localDateKey(lastDate) < localDateKey(now);
}
