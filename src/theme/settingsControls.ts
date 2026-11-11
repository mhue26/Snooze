import { StyleSheet } from 'react-native';
import { theme } from './tokens';

/** Outer height of segmented tracks and matching setting controls (34px segment + 2px inset each side). */
export const SETTINGS_OUTER_HEIGHT = 38;
export const SETTINGS_INNER_HEIGHT = 34;
export const SETTINGS_INSET = 2;
export const SETTINGS_OUTER_RADIUS = 20;
export const SETTINGS_INNER_RADIUS = 17;

export const settingsControlStyles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: SETTINGS_OUTER_HEIGHT,
    padding: SETTINGS_INSET,
    borderRadius: SETTINGS_OUTER_RADIUS,
    backgroundColor: theme.screen,
    alignItems: 'center',
  },
  innerPill: {
    height: SETTINGS_INNER_HEIGHT,
    borderRadius: SETTINGS_INNER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
