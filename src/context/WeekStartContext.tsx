import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';
import type { WeekStartsOn } from '../domain/dates';
import type { TimeFormat } from '../domain/sleep';
import { DEFAULT_TARGET_SLEEP, type TargetSleepTimes } from '../domain/targetSleep';
import {
  loadCachedSunLocation,
  loadSunriseSunsetEnabled,
  loadTargetSleepTimes,
  loadTimeFormat,
  loadWeekStartsOn,
  saveCachedSunLocation,
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
  setSunriseSunsetEnabled: (value: boolean) => Promise<'success' | 'denied' | 'unavailable'>;
  sunLocation: StoredCoordinates | null;
  targetSleepTimes: TargetSleepTimes;
  setTargetSleepTimes: (value: TargetSleepTimes) => Promise<void>;
};

const WeekStartContext = createContext<WeekStartContextValue>({
  weekStartsOn: 'monday',
  setWeekStartsOn: async () => {},
  timeFormat: '12h',
  setTimeFormat: async () => {},
  sunriseSunsetEnabled: false,
  setSunriseSunsetEnabled: async () => 'unavailable',
  sunLocation: null,
  targetSleepTimes: DEFAULT_TARGET_SLEEP,
  setTargetSleepTimes: async () => {},
});

export function WeekStartProvider({ children }: { children: ReactNode }) {
  const [weekStartsOn, setWeekStartsOnState] = useState<WeekStartsOn>('monday');
  const [timeFormat, setTimeFormatState] = useState<TimeFormat>('12h');
  const [sunriseSunsetEnabled, setSunriseSunsetEnabledState] = useState<boolean>(false);
  const [sunLocation, setSunLocationState] = useState<StoredCoordinates | null>(null);
  const [targetSleepTimes, setTargetSleepTimesState] = useState<TargetSleepTimes>(DEFAULT_TARGET_SLEEP);

  useEffect(() => {
    let active = true;
    Promise.all([
      loadWeekStartsOn(),
      loadTimeFormat(),
      loadSunriseSunsetEnabled(),
      loadCachedSunLocation(),
      loadTargetSleepTimes(),
    ])
      .then(([week, time, sunriseEnabled, cachedLocation, targetSleep]) => {
        if (active) {
          setWeekStartsOnState(week);
          setTimeFormatState(time);
          setSunriseSunsetEnabledState(sunriseEnabled);
          setSunLocationState(sunriseEnabled ? cachedLocation : null);
          setTargetSleepTimesState(targetSleep);
          if (sunriseEnabled && !cachedLocation) {
            readForegroundLocation(false).then(result => {
              if (active && typeof result === 'object') {
                setSunLocationState(result);
                void saveCachedSunLocation(result);
              }
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setWeekStartsOn = async (value: WeekStartsOn) => {
    await saveWeekStartsOn(value);
    setWeekStartsOnState(value);
  };

  const setTimeFormat = async (value: TimeFormat) => {
    await saveTimeFormat(value);
    setTimeFormatState(value);
  };

  const setSunriseSunsetEnabled = async (value: boolean): Promise<'success' | 'denied' | 'unavailable'> => {
    if (!value) {
      await saveSunriseSunsetEnabled(false);
      await saveCachedSunLocation(null);
      setSunriseSunsetEnabledState(false);
      setSunLocationState(null);
      return 'success';
    }

    const locationResult = await readForegroundLocation(true);
    if (typeof locationResult === 'object') {
      await saveSunriseSunsetEnabled(true);
      await saveCachedSunLocation(locationResult);
      setSunriseSunsetEnabledState(true);
      setSunLocationState(locationResult);
      return 'success';
    }

    await saveSunriseSunsetEnabled(false);
    await saveCachedSunLocation(null);
    setSunriseSunsetEnabledState(false);
    setSunLocationState(null);

    if (locationResult === 'denied') {
      Alert.alert(
        'Location access is off',
        'Enable location access in device settings to use sunrise and sunset times.'
      );
    } else {
      Alert.alert(
        'Location unavailable',
        'Location is not available in this build. Rebuild with npm run android (or ios) to enable location.'
      );
    }
    return locationResult;
  };

  const setTargetSleepTimes = async (value: TargetSleepTimes) => {
    await saveTargetSleepTimes(value);
    setTargetSleepTimesState(value);
  };

  return (
    <WeekStartContext.Provider
      value={{
        weekStartsOn,
        setWeekStartsOn,
        timeFormat,
        setTimeFormat,
        sunriseSunsetEnabled,
        setSunriseSunsetEnabled,
        sunLocation,
        targetSleepTimes,
        setTargetSleepTimes,
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

export function useSunriseSunset(): {
  sunriseSunsetEnabled: boolean;
  setSunriseSunsetEnabled: (value: boolean) => Promise<'success' | 'denied' | 'unavailable'>;
  sunLocation: StoredCoordinates | null;
} {
  const { sunriseSunsetEnabled, setSunriseSunsetEnabled, sunLocation } = useContext(WeekStartContext);
  return { sunriseSunsetEnabled, setSunriseSunsetEnabled, sunLocation };
}
