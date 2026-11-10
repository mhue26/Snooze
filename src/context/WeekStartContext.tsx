import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { WeekStartsOn } from '../domain/dates';
import { loadWeekStartsOn, saveWeekStartsOn } from '../data/settingsPrefs';

type WeekStartContextValue = {
  weekStartsOn: WeekStartsOn;
  setWeekStartsOn: (value: WeekStartsOn) => void;
};

const WeekStartContext = createContext<WeekStartContextValue>({
  weekStartsOn: 'monday',
  setWeekStartsOn: () => {},
});

export function WeekStartProvider({ children }: { children: ReactNode }) {
  const [weekStartsOn, setWeekStartsOnState] = useState<WeekStartsOn>('monday');

  useEffect(() => {
    let active = true;
    loadWeekStartsOn()
      .then(value => {
        if (active) setWeekStartsOnState(value);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setWeekStartsOn = (value: WeekStartsOn) => {
    setWeekStartsOnState(value);
    saveWeekStartsOn(value).catch(() => {});
  };

  return (
    <WeekStartContext.Provider value={{ weekStartsOn, setWeekStartsOn }}>
      {children}
    </WeekStartContext.Provider>
  );
}

export function useWeekStart(): WeekStartContextValue {
  return useContext(WeekStartContext);
}
