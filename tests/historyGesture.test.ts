import { expect, test } from '@jest/globals';
import { atHistoryBoundary, canBeginTodaySwipe, historySurfaceRelease, startsInOlderHistory, wantsToday } from '../src/domain/historyGesture';

test('only gestures starting beyond yesterday are held at its boundary', () => {
  expect(startsInOlderHistory(1600, 800)).toBe(true);
  expect(startsInOlderHistory(825, 800)).toBe(true);
  expect(startsInOlderHistory(800, 800)).toBe(false);
  expect(startsInOlderHistory(0, 800)).toBe(false);
  expect(startsInOlderHistory(100, 0)).toBe(false);
});

test('a fresh short swipe or light fling from yesterday can reach today', () => {
  expect(wantsToday(800, 775, 0, 800)).toBe(true);
  expect(wantsToday(800, 790, -0.25, 800)).toBe(true);
  expect(wantsToday(800, 790, -0.1, 800)).toBe(false);
  expect(wantsToday(1200, 0, -3, 800)).toBe(false);
  expect(wantsToday(800, 805, -1, 800)).toBe(false);
});

test('history must reach yesterday before a fresh swipe can open today', () => {
  expect(historySurfaceRelease(true, false, -500)).toBeNull();
  expect(historySurfaceRelease(true, true, -36)).toBe('today');
  expect(historySurfaceRelease(true, true, -20)).toBeNull();
  expect(historySurfaceRelease(false, false, 36)).toBe('yesterday');
  expect(historySurfaceRelease(false, false, -100)).toBeNull();
});


test('recognizes the history boundary with small native offset rounding', () => {
  expect(atHistoryBoundary(0)).toBe(true);
  expect(atHistoryBoundary(7)).toBe(true);
  expect(atHistoryBoundary(9)).toBe(false);
  expect(atHistoryBoundary(Number.NaN)).toBe(false);
});


test('allows a fresh return swipe while yesterday is visible even away from exact offset zero', () => {
  expect(canBeginTodaySwipe(240, '2026-11-11', '2026-11-11')).toBe(true);
  expect(canBeginTodaySwipe(240, '2026-11-10', '2026-11-11')).toBe(false);
  expect(canBeginTodaySwipe(0, '2026-11-10', '2026-11-11')).toBe(true);
  expect(historySurfaceRelease(true, true, -24)).toBe('today');
  expect(historySurfaceRelease(true, false, -500)).toBeNull();
});
