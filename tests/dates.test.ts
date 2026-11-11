import { expect, test } from '@jest/globals';
import { todayWeekdaySlot, dateForWeekdaySlot, dayHeaderTitle, formatMonthDay, weekdayIndex, weekdayInitial, weekdayLabel } from '../src/domain/dates';

test('formats month and day without weekday or year', () => {
  expect(formatMonthDay('2026-11-08', 'en-US')).toBe('November 8');
  expect(formatMonthDay('2026-01-01', 'en-US')).toBe('January 1');
});

test('calculates weekday index starting on Monday (default)', () => {
  // 2026-11-08 is a Sunday
  expect(weekdayIndex('2026-11-08', 'monday')).toBe(6);
  expect(weekdayLabel(6, 'monday')).toBe('Sunday');
  expect(weekdayInitial(6, 'monday')).toBe('S');

  // 2026-11-09 is a Monday
  expect(weekdayIndex('2026-11-09', 'monday')).toBe(0);
  expect(weekdayLabel(0, 'monday')).toBe('Monday');
  expect(weekdayInitial(0, 'monday')).toBe('M');

  // 2026-11-10 is a Tuesday
  expect(weekdayIndex('2026-11-10', 'monday')).toBe(1);
  expect(weekdayLabel(1, 'monday')).toBe('Tuesday');
  expect(weekdayInitial(1, 'monday')).toBe('T');

  // 2026-11-14 is a Saturday
  expect(weekdayIndex('2026-11-14', 'monday')).toBe(5);
  expect(weekdayLabel(5, 'monday')).toBe('Saturday');
  expect(weekdayInitial(5, 'monday')).toBe('S');

  // Verify all 7 initials for Monday-first: m, t, w, t, f, s, s
  const mondayInitials = Array.from({ length: 7 }, (_, i) => weekdayInitial(i, 'monday'));
  expect(mondayInitials).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S']);
});

test('calculates weekday index starting on Sunday', () => {
  // 2026-11-08 is a Sunday -> index 0
  expect(weekdayIndex('2026-11-08', 'sunday')).toBe(0);
  expect(weekdayLabel(0, 'sunday')).toBe('Sunday');
  expect(weekdayInitial(0, 'sunday')).toBe('S');

  // 2026-11-09 is a Monday -> index 1
  expect(weekdayIndex('2026-11-09', 'sunday')).toBe(1);
  expect(weekdayLabel(1, 'sunday')).toBe('Monday');
  expect(weekdayInitial(1, 'sunday')).toBe('M');

  // 2026-11-14 is a Saturday -> index 6
  expect(weekdayIndex('2026-11-14', 'sunday')).toBe(6);
  expect(weekdayLabel(6, 'sunday')).toBe('Saturday');
  expect(weekdayInitial(6, 'sunday')).toBe('S');

  // Verify all 7 initials for Sunday-first: s, m, t, w, t, f, s
  const sundayInitials = Array.from({ length: 7 }, (_, i) => weekdayInitial(i, 'sunday'));
  expect(sundayInitials).toEqual(['S', 'M', 'T', 'W', 'T', 'F', 'S']);
});

test('maps weekday slots to dates in the anchor week', () => {
  // 2026-11-10 Tuesday, Monday-first week Mon 9 … Sun 15
  expect(dateForWeekdaySlot('2026-11-10', 0, 'monday')).toBe('2026-11-09');
  expect(dateForWeekdaySlot('2026-11-10', 1, 'monday')).toBe('2026-11-10');
  expect(dateForWeekdaySlot('2026-11-10', 6, 'monday')).toBe('2026-11-15');
});

test('computes dayHeaderTitle for Today, Yesterday and past dates', () => {
  const today = '2026-11-10';
  expect(dayHeaderTitle('2026-11-10', today, 'en-US')).toBe('Today');
  expect(dayHeaderTitle('2026-11-09', today, 'en-US')).toBe('Yesterday');
  expect(dayHeaderTitle('2026-11-08', today, 'en-US')).toBe('November 8');
  expect(dayHeaderTitle('2026-10-24', today, 'en-US')).toBe('October 24');
});

test('marks today only inside the displayed week for either week start', () => {
  expect(todayWeekdaySlot('2026-12-31', '2027-01-01', 'monday')).toBe(4);
  expect(todayWeekdaySlot('2026-11-08', '2026-11-09', 'sunday')).toBe(1);
  expect(todayWeekdaySlot('2026-11-08', '2026-11-09', 'monday')).toBeNull();
  expect(todayWeekdaySlot('2026-11-01', '2026-11-09', 'sunday')).toBeNull();
});
