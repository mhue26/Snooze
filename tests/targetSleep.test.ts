import { expect, test } from '@jest/globals';
import { DEFAULT_TARGET_SLEEP, isValidTargetSleepTimes, targetSleepDurationMinutes } from '../src/domain/targetSleep';

test('default target is eight hours from 11 PM to 7 AM', () => {
  expect(targetSleepDurationMinutes(DEFAULT_TARGET_SLEEP)).toBe(8 * 60);
  expect(isValidTargetSleepTimes(DEFAULT_TARGET_SLEEP)).toBe(true);
});

test('rejects identical bedtime and wake time', () => {
  expect(isValidTargetSleepTimes({ bedtimeMinutes: 420, wakeMinutes: 420 })).toBe(false);
});
