import { expect, test } from '@jest/globals';
import {
  clampSleepNeed,
  DEFAULT_SLEEP_NEED_MINUTES,
  formatDurationDigits,
  isValidSleepNeed,
  MAX_SLEEP_NEED_MINUTES,
  MIN_SLEEP_NEED_MINUTES,
  parseSleepNeedDigits,
  suggestedBedtimeMinutes,
  suggestedSleepNeedMinutes,
} from '../src/domain/sleepNeed';

test('validates sleep need range between 6h00 (360m) and 10h00 (600m)', () => {
  expect(DEFAULT_SLEEP_NEED_MINUTES).toBe(480);
  expect(MIN_SLEEP_NEED_MINUTES).toBe(360);
  expect(MAX_SLEEP_NEED_MINUTES).toBe(600);

  expect(isValidSleepNeed(480)).toBe(true);
  expect(isValidSleepNeed(360)).toBe(true);
  expect(isValidSleepNeed(600)).toBe(true);

  expect(isValidSleepNeed(359)).toBe(false);
  expect(isValidSleepNeed(601)).toBe(false);
  expect(isValidSleepNeed(0)).toBe(false);
  expect(isValidSleepNeed(-1)).toBe(false);
  expect(isValidSleepNeed(480.5)).toBe(false);
  expect(isValidSleepNeed(null)).toBe(false);
  expect(isValidSleepNeed(undefined)).toBe(false);
});

test('clamps sleep need to valid range', () => {
  expect(clampSleepNeed(300)).toBe(360);
  expect(clampSleepNeed(450)).toBe(450);
  expect(clampSleepNeed(720)).toBe(600);
});

test('calculates suggested sleep need from target window', () => {
  // 8h target window
  expect(suggestedSleepNeedMinutes(480)).toBe(480);
  // 7h30 target window
  expect(suggestedSleepNeedMinutes(450)).toBe(450);
  // Short target window (e.g. 5h) clamped to 6h
  expect(suggestedSleepNeedMinutes(300)).toBe(360);
  // Long target window (e.g. 11h) clamped to 10h
  expect(suggestedSleepNeedMinutes(660)).toBe(600);
  // Null target window falls back to default 480
  expect(suggestedSleepNeedMinutes(null)).toBe(480);
});

test('calculates suggested bedtime from target wake time and sleep need', () => {
  // Wake at 7:00 AM (420 min), sleep need 8h (480 min) -> bedtime 11:00 PM (1380 min)
  expect(suggestedBedtimeMinutes(7 * 60, 8 * 60)).toBe(23 * 60);

  // Wake at 6:30 AM (390 min), sleep need 7h30 (450 min) -> bedtime 11:00 PM (1380 min)
  expect(suggestedBedtimeMinutes(390, 450)).toBe(1380);

  // Wake at 8:00 AM (480 min), sleep need 9h (540 min) -> bedtime 11:00 PM (1380 min)
  expect(suggestedBedtimeMinutes(480, 540)).toBe(1380);

  // Wake at 1:00 AM (60 min), sleep need 8h (480 min) -> bedtime 5:00 PM (1020 min)
  expect(suggestedBedtimeMinutes(60, 480)).toBe(1020);
});

test('formats duration as four digits', () => {
  expect(formatDurationDigits(480)).toBe('0800');
  expect(formatDurationDigits(450)).toBe('0730');
  expect(formatDurationDigits(360)).toBe('0600');
  expect(formatDurationDigits(600)).toBe('1000');
});

test('parses four digits into sleep need minutes and validates range', () => {
  expect(parseSleepNeedDigits('0800')).toEqual({ success: true, minutes: 480 });
  expect(parseSleepNeedDigits('0730')).toEqual({ success: true, minutes: 450 });
  expect(parseSleepNeedDigits('0600')).toEqual({ success: true, minutes: 360 });
  expect(parseSleepNeedDigits('1000')).toEqual({ success: true, minutes: 600 });

  // Out of range: < 6h00
  expect(parseSleepNeedDigits('0559')).toEqual({
    success: false,
    error: 'Enter a sleep need between 6:00 and 10:00.',
  });

  // Out of range: > 10h00
  expect(parseSleepNeedDigits('1001')).toEqual({
    success: false,
    error: 'Enter a sleep need between 6:00 and 10:00.',
  });

  // Invalid minutes
  expect(parseSleepNeedDigits('0860')).toEqual({
    success: false,
    error: 'Enter valid minutes from 00 to 59.',
  });

  // Incomplete
  expect(parseSleepNeedDigits('080')).toEqual({
    success: false,
    error: 'Enter hours and minutes as HH:MM.',
  });
});
