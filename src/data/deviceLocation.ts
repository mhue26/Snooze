import { getExpoLocation } from '../integrations/expoLocation';

export type LocationCoords = { latitude: number; longitude: number };
export type LocationReadResult = LocationCoords | 'denied' | 'unavailable' | 'unsupported';

export async function readForegroundLocation(
  requestPermission: boolean
): Promise<LocationReadResult> {
  const Location = await getExpoLocation();
  if (!Location) {
    return 'unsupported';
  }
  try {
    const permission = requestPermission
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      return 'denied';
    }
    // A recent device fix avoids waiting for a fresh GPS lock on every toggle.
    const cached = await Location.getLastKnownPositionAsync({ maxAge: 60 * 60 * 1000, requiredAccuracy: 20000 }).catch(() => null);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result = cached ?? await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location timed out')), 12000); }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  } catch {
    return 'unavailable';
  }
}
