import { requireOptionalNativeModule } from 'expo-modules-core';

type LocationModule = typeof import('expo-location');

let cached: LocationModule | null | undefined;

/** True when the installed development build includes Expo Location. */
export function hasLocationNativeModule(): boolean {
  return requireOptionalNativeModule('ExpoLocation') != null;
}

export async function getExpoLocation(): Promise<LocationModule | null> {
  if (cached !== undefined) return cached;
  if (!hasLocationNativeModule()) {
    cached = null;
    return null;
  }
  try {
    cached = await import('expo-location');
    return cached;
  } catch {
    cached = null;
    return null;
  }
}
