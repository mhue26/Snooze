import { getExpoLocation } from '../integrations/expoLocation';

export type LocationCoords = { latitude: number; longitude: number };
export type LocationReadResult = LocationCoords | 'denied' | 'unavailable';

export async function readForegroundLocation(
  requestPermission: boolean
): Promise<LocationReadResult> {
  const Location = await getExpoLocation();
  if (!Location) {
    return 'unavailable';
  }
  try {
    const permission = requestPermission
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    if (!permission.granted) {
      return 'denied';
    }
    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: result.coords.latitude,
      longitude: result.coords.longitude,
    };
  } catch {
    return 'unavailable';
  }
}
