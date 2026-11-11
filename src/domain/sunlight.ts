import { getPosition, getTimes } from 'suncalc';
import type { SleepRecord } from './sleep';

export type SunCoordinates = { latitude: number; longitude: number; id?: string };
export type Coordinates = SunCoordinates;

export type SunTimes = { sunrise: Date | null; sunset: Date | null };

export function sunTimesForDate(date: string, location: SunCoordinates): SunTimes {
  const [year, month, day] = date.split('-').map(Number);
  const anchor = new Date(wallTime(year, month, day, 720, location.id));
  const times = getTimes(anchor, location.latitude, location.longitude);
  const sunrise = times.sunrise && Number.isFinite(times.sunrise.getTime()) ? times.sunrise : null;
  const sunset = times.sunset && Number.isFinite(times.sunset.getTime()) ? times.sunset : null;
  return { sunrise, sunset };
}

export function sunTimesAsMinutes(date: string, location: SunCoordinates): { sunriseMinutes: number | null; sunsetMinutes: number | null } {
  const { sunrise, sunset } = sunTimesForDate(date, location);
  const toMinutes = (d: Date | null): number | null => {
    if (!d) return null;
    if (location.id) {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: location.id,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      });
      const parts = Object.fromEntries(formatter.formatToParts(d).map(part => [part.type, Number(part.value)]));
      return parts.hour * 60 + parts.minute;
    }
    return d.getHours() * 60 + d.getMinutes();
  };
  return {
    sunriseMinutes: toMinutes(sunrise),
    sunsetMinutes: toMinutes(sunset),
  };
}

function wallTime(year: number, month: number, day: number, minutes: number, zone?: string): number {
  if (!zone) return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60).getTime();
  const target = Date.UTC(year, month - 1, day, Math.floor(minutes / 60), minutes % 60);
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part => [part.type, Number(part.value)]));
    instant += target - Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  }
  return instant;
}
const NIGHT = [24, 39, 65];
const DAY = [128, 152, 212];

/** Sample a continuous day/night color across the actual elapsed sleep interval. */
export function sleepSunColors(record: SleepRecord, location: Coordinates): string[] {
  const [year, month, day] = record.date.split('-').map(Number);
  const start = wallTime(year, month, day - (record.bedtimeMinutes > record.wakeMinutes ? 1 : 0), record.bedtimeMinutes, location.id);
  const end = wallTime(year, month, day, record.wakeMinutes, location.id);
  const events: { time: number; sunrise: boolean }[] = [];
  for (let offset = -2; offset <= 1; offset++) {
    const date = new Date(wallTime(year, month, day + offset, 720, location.id));
    const times = getTimes(date, location.latitude, location.longitude);
    if (times.sunrise && Number.isFinite(times.sunrise.getTime())) events.push({ time: times.sunrise.getTime(), sunrise: true });
    if (times.sunset && Number.isFinite(times.sunset.getTime())) events.push({ time: times.sunset.getTime(), sunrise: false });
  }
  return Array.from({ length: 49 }, (_, i) => {
    const time = start + (end - start) * i / 48;
    // Blend across one hour centred on sunrise or sunset; outside it the color is solid.
    const nearby = events.find(event => Math.abs(time - event.time) <= 30 * 60000);
    let light: number;
    if (nearby) {
      const progress = (time - nearby.time) / (60 * 60000) + 0.5;
      light = nearby.sunrise ? progress : 1 - progress;
    } else {
      light = getPosition(new Date(time), location.latitude, location.longitude).altitude > -0.0145 ? 1 : 0;
    }
    return `rgb(${NIGHT.map((value, index) => Math.round(value + (DAY[index] - value) * light)).join(',')})`;
  });
}
