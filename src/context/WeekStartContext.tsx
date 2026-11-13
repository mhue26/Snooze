import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { WeekStartsOn } from '../domain/dates';
import type { TimeFormat } from '../domain/sleep';
import { DEFAULT_SLEEP_NEED_MINUTES } from '../domain/sleepNeed';
import { shouldRefreshLocation } from '../domain/sunLocation';
import { DEFAULT_TARGET_SLEEP, type TargetSleepTimes } from '../domain/targetSleep';
import {
  loadCachedSunLocation,
  loadCachedSunLocationFetchedAt,
  loadSleepNeedMinutes,
  loadSunriseSunsetEnabled,
  loadTargetSleepTimes,
  loadTimeFormat,
  loadWeekStartsOn,
  saveCachedSunLocation,
  saveCachedSunLocationFetchedAt,
  saveSleepNeedMinutes,
  saveSunriseSunsetEnabled,
  saveTargetSleepTimes,
  saveTimeFormat,
  saveWeekStartsOn,
  type StoredCoordinates,
} from '../data/settingsPrefs';
import { readForegroundLocation } from '../data/deviceLocation';

type WeekStartContextValue = {
  weekStartsOn: WeekStartsOn;
  setWeekStartsOn: (value: WeekStartsOn) => Promise<void>;
  timeFormat: TimeFormat;
  setTimeFormat: (value: TimeFormat) => Promise<void>;
  sunriseSunsetEnabled: boolean;
  setSunriseSunsetEnabled: (value: boolean) => Promise<'success' | 'denied' | 'unavailable' | 'unsupported'>;
  sunriseSunsetBusy: boolean;
  sunLocation: StoredCoordinates | null;
  targetSleepTimes: TargetSleepTimes;
  setTargetSleepTimes: (value: TargetSleepTimes) => Promise<void>;
  sleepNeedMinutes: number;
  setSleepNeedMinutes: (value: number) => Promise<void>;
};

const WeekStartContext = createContext<WeekStartContextValue>({
  weekStartsOn: 'monday',
  setWeekStartsOn: async () => {},
  timeFormat: '12h',
  setTimeFormat: async () => {},
  sunriseSunsetEnabled: false,
  sunriseSunsetBusy: false,
  setSunriseSunsetEnabled: async () => 'unavailable',
  sunLocation: null,
  targetSleepTimes: DEFAULT_TARGET_SLEEP,
  setTargetSleepTimes: async () => {},
  sleepNeedMinutes: DEFAULT_SLEEP_NEED_MINUTES,
  setSleepNeedMinutes: async () => {},
});

export function WeekStartProvider({ children }: { children: ReactNode }) {
  const [weekStartsOn, setWeekStartsOnState] = useState<WeekStartsOn>('monday');
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('12h');
  const [sunriseSunsetEnabled, setSunriseSunsetEnabledState] = useState<boolean>(false);
  const [sunriseSunsetBusy, setSunriseSunsetBusy] = useState(false);
  const sunriseOperation = useRef(false);
  const sunriseRevision = useRef(0);
  const pendingSunCacheWrite = useRef<Promise<void> | null>(null);
  const [sunLocation, setSunLocationState] = useState<StoredCoordinates | null>(null);
  const [targetSleepTimes, setTargetSleepTimesState] = useState<TargetSleepTimes>(DEFAULT_TARGET_SLEEP);
  const [sleepNeedMinutes, setSleepNeedMinutesState] = useState<number>(DEFAULT_SLEEP_NEED_MINUTES);

  const sunLocationRef = useRef<StoredCoordinates | null>(null);
  const lastFetchedAtRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const revision = sunriseRevision.current;
    Promise.all([
      loadWeekStartsOn(),
      loadTimeFormat(),
      loadSunriseSunsetEnabled(),
      loadCachedSunLocation(),
      loadCachedSunLocationFetchedAt(),
      loadTargetSleepTimes(),
      loadSleepNeedMinutes(),
    ])
      .then(([week, time, sunriseEnabled, cachedLocation, cachedFetchedAt, targetSleep, sleepNeed]) => {
        if (active) {
          setWeekStartsOnState(week);
          setTimeFormatState(time);
          if (sunriseRevision.current === revision) {
            setSunriseSunsetEnabledState(sunriseEnabled);
            setSunLocationState(sunriseEnabled ? cachedLocation : null);
            sunLocationRef.current = sunriseEnabled ? cachedLocation : null;
            lastFetchedAtRef.current = sunriseEnabled ? cachedFetchedAt : null;
          }
          setTargetSleepTimesState(targetSleep);
          setSleepNeedMinutesState(sleepNeed);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sunriseSunsetEnabled) return;
    let active = true;
    let running = false;
    const refresh = async () => {
      if (running) return;
      if (!shouldRefreshLocation(lastFetchedAtRef.current, new Date(), sunLocationRef.current !== null)) {
        return;
      }
      running = true;
      const revision = sunriseRevision.current;
      try {
        const result = await readForegroundLocation(false);
        if (active && revision === sunriseRevision.current && typeof result === 'object') {
          const nowIso = new Date().toISOString();
          lastFetchedAtRef.current = nowIso;
          sunLocationRef.current = result;
          setSunLocationState(result);
          const write = Promise.all([
            saveCachedSunLocation(result),
            saveCachedSunLocationFetchedAt(nowIso),
          ]).then(() => {});
          pendingSunCacheWrite.current = write;
          try { await write; }
          finally { if (pendingSunCacheWrite.current === write) pendingSunCacheWrite.current = null; }
        }
      } catch { /* Keep the last usable location until a refresh succeeds. */ }
      finally { running = false; }
    };
    void refresh();
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { active = false; listener.remove(); };
  }, [sunriseSunsetEnabled]);

  const setWeekStartsOn = async (value: WeekStartsOn) => {
    await saveWeekStartsOn(value);
    setWeekStartsOnState(value);
  };

  const setTimeFormat = async (value: TimeFormat) => {
    await saveTimeFormat(value);
    setTimeFormatState(value);
  };

  const setSunriseSunsetEnabled = async (value: boolean): Promise<'success' | 'denied' | 'unavailable' | 'unsupported'> => {
    if (sunriseOperation.current) return 'unavailable';
    sunriseOperation.current = true;
    sunriseRevision.current += 1;
    setSunriseSunsetBusy(true);
    try {
      if (!value) {
        await saveSunriseSunsetEnabled(false);
        setSunriseSunsetEnabledState(false);
        setSunLocationState(null);
        sunLocationRef.current = null;
        lastFetchedAtRef.current = null;
        // Finish a refresh write before deleting cached coordinates.
        await pendingSunCacheWrite.current?.catch(() => {});
        await saveCachedSunLocation(null);
        await saveCachedSunLocationFetchedAt(null);
        return 'success';
      }
      const result = await readForegroundLocation(true);
      if (typeof result !== 'object') return result;
      // Save coordinates first, so an interrupted enable cannot persist an unusable on state.
      const nowIso = new Date().toISOString();
      lastFetchedAtRef.current = nowIso;
      sunLocationRef.current = result;
      await saveCachedSunLocation(result);
      await saveCachedSunLocationFetchedAt(nowIso);
      await saveSunriseSunsetEnabled(true);
      setSunLocationState(result);
      setSunriseSunsetEnabledState(true);
      return 'success';
    } finally {
      sunriseOperation.current = false;
      setSunriseSunsetBusy(false);
    }
  };

  const setTargetSleepTimes = async (value: TargetSleepTimes) => {
    await saveTargetSleepTimes(value);
    setTargetSleepTimesState(value);
  };

  const setSleepNeedMinutes = async (value: number) => {
    await saveSleepNeedMinutes(value);
    setSleepNeedMinutesState(value);
  };

  return (
    <WeekStartContext.Provider
      value={{
        weekStartsOn,
        setWeekStartsOn,
        timeFormat,
        setTimeFormat,
        sunriseSunsetEnabled,
        sunriseSunsetBusy,
        setSunriseSunsetEnabled,
        sunLocation,
        targetSleepTimes,
        setTargetSleepTimes,
        sleepNeedMinutes,
        setSleepNeedMinutes,
      }}
    >
      {children}
    </WeekStartContext.Provider>
  );
}

export function useWeekStart(): WeekStartContextValue {
  return useContext(WeekStartContext);
}

export function useTimeFormat(): Pick<WeekStartContextValue, 'timeFormat' | 'setTimeFormat'> {
  const { timeFormat, setTimeFormat } = useContext(WeekStartContext);
  return { timeFormat, setTimeFormat };
}

export function useSleepNeed(): Pick<WeekStartContextValue, 'sleepNeedMinutes' | 'setSleepNeedMinutes'> {
  const { sleepNeedMinutes, setSleepNeedMinutes } = useContext(WeekStartContext);
  return { sleepNeedMinutes, setSleepNeedMinutes };
}

export function useSunriseSunset(): {
  sunriseSunsetEnabled: boolean;
  setSunriseSunsetEnabled: (value: boolean) => Promise<'success' | 'denied' | 'unavailable' | 'unsupported'>;
  sunriseSunsetBusy: boolean;
  sunLocation: StoredCoordinates | null;
} {
  const { sunriseSunsetEnabled, sunriseSunsetBusy, setSunriseSunsetEnabled, sunLocation } = useContext(WeekStartContext);
  return { sunriseSunsetEnabled, sunriseSunsetBusy, setSunriseSunsetEnabled, sunLocation };
}
