import { expect, test } from '@jest/globals';
import { sleepSunColors, sunTimesAsMinutes, sunTimesForDate } from '../src/domain/sunlight';

test('returns daily sunrise and sunset for a given date and location', () => {
  const times = sunTimesForDate('2026-06-21', { id: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 });
  expect(times.sunrise).toBeInstanceOf(Date);
  expect(times.sunset).toBeInstanceOf(Date);
  expect(times.sunrise!.getTime()).toBeLessThan(times.sunset!.getTime());

  const minutes = sunTimesAsMinutes('2026-06-21', { id: 'Australia/Sydney', latitude: -33.8688, longitude: 151.2093 });
  expect(minutes.sunriseMinutes).not.toBeNull();
  expect(minutes.sunsetMinutes).not.toBeNull();
  expect(minutes.sunriseMinutes!).toBeLessThan(minutes.sunsetMinutes!);
});

test('handles polar locations with null sunrise or sunset', () => {
  const times = sunTimesForDate('2026-06-21', { latitude: 89, longitude: 0 });
  // Midnight sun at 89 deg N on summer solstice: either sunrise or sunset is not a standard daily event
  expect(times.sunrise === null || times.sunset === null).toBe(true);
});

test('colors a sleep period before sunrise dark and after sunrise light', () => {
  const colors = sleepSunColors({ date: '2026-06-01', bedtimeMinutes: 0, wakeMinutes: 12 * 60 }, { latitude: 0, longitude: 0 });
  expect(colors[0]).toBe('rgb(24,39,65)');
  expect(colors[colors.length - 1]).toBe('rgb(128,152,212)');
  expect(new Set(colors).size).toBeGreaterThan(2);
});

test('handles polar days without sunrise or sunset events', () => {
  const colors = sleepSunColors({ date: '2026-06-21', bedtimeMinutes: 0, wakeMinutes: 8 * 60 }, { latitude: 89, longitude: 0 });
  expect(colors.every(color => color === 'rgb(128,152,212)')).toBe(true);
});

 test('uses the selected timezone for the sleep interval', () => {
  const colors = sleepSunColors({ date: '2026-06-01', bedtimeMinutes: 0, wakeMinutes: 12 * 60 }, { id: 'Asia/Tokyo', latitude: 35.68, longitude: 139.69 });
  expect(colors[0]).toBe('rgb(24,39,65)');
  expect(colors[colors.length - 1]).toBe('rgb(128,152,212)');
});
