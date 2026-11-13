import { expect, test } from '@jest/globals';
import { shouldRefreshLocation } from '../src/domain/sunLocation';

test('refetches when no location is stored yet', () => {
  const now = new Date('2026-11-13T10:00:00');
  expect(shouldRefreshLocation(new Date('2026-11-13T09:00:00'), now, false)).toBe(true);
  expect(shouldRefreshLocation(null, now, false)).toBe(true);
});

test('refetches when lastFetchedAt is null or undefined', () => {
  const now = new Date('2026-11-13T10:00:00');
  expect(shouldRefreshLocation(null, now, true)).toBe(true);
  expect(shouldRefreshLocation(undefined, now, true)).toBe(true);
});

test('refetches when lastFetchedAt is invalid date string', () => {
  const now = new Date('2026-11-13T10:00:00');
  expect(shouldRefreshLocation('not-a-valid-date', now, true)).toBe(true);
});

test('does not refetch when last fetch was on the same calendar day', () => {
  const now = new Date('2026-11-13T18:30:00');
  const earlierToday = new Date('2026-11-13T08:00:00');
  expect(shouldRefreshLocation(earlierToday, now, true)).toBe(false);
  expect(shouldRefreshLocation(earlierToday.toISOString(), now, true)).toBe(false);
  expect(shouldRefreshLocation(earlierToday.getTime(), now, true)).toBe(false);
});

test('refetches when last fetch was on a previous calendar day', () => {
  const now = new Date('2026-11-13T08:00:00');
  const yesterday = new Date('2026-11-12T20:00:00');
  expect(shouldRefreshLocation(yesterday, now, true)).toBe(true);
  expect(shouldRefreshLocation(yesterday.toISOString(), now, true)).toBe(true);
  expect(shouldRefreshLocation(yesterday.getTime(), now, true)).toBe(true);
});

test('refetches when last fetch was several days ago', () => {
  const now = new Date('2026-11-13T08:00:00');
  const past = new Date('2026-11-01T12:00:00');
  expect(shouldRefreshLocation(past, now, true)).toBe(true);
});

test('handles midnight boundary between consecutive calendar days', () => {
  const yesterdayLate = new Date('2026-11-12T23:59:59');
  const todayEarly = new Date('2026-11-13T00:00:01');
  expect(shouldRefreshLocation(yesterdayLate, todayEarly, true)).toBe(true);

  const todayLate = new Date('2026-11-13T23:59:59');
  expect(shouldRefreshLocation(todayEarly, todayLate, true)).toBe(false);
});
