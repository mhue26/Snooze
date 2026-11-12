import { expect, test } from '@jest/globals';
import { monthProgress } from '../src/domain/monthProgress';

test('uses calendar month rather than loaded records for position', () => {
  expect(monthProgress('2026-10-31', '2026-11-12').progress).toBe(0);
  expect(monthProgress('2026-10-01', '2026-11-12').progress).toBe(1);
  expect(monthProgress('2026-10-16', '2026-11-12').progress).toBe(0.5);
});

test('handles current month, leap years and year boundaries', () => {
  expect(monthProgress('2026-11-12', '2026-11-12').progress).toBe(0);
  expect(monthProgress('2026-11-01', '2026-11-12').progress).toBe(1);
  expect(monthProgress('2024-02-29', '2024-03-02').progress).toBe(0);
  expect(monthProgress('2024-02-01', '2024-03-02').progress).toBe(1);
  expect(monthProgress('2025-12-31', '2026-01-01').label).toContain('2025');
  expect(monthProgress('2026-01-01', '2026-01-01').progress).toBe(0);
});
