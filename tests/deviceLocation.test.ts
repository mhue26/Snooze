import { beforeEach, expect, jest, test } from '@jest/globals';
import { readForegroundLocation } from '../src/data/deviceLocation';
import { getExpoLocation } from '../src/integrations/expoLocation';

jest.mock('../src/integrations/expoLocation', () => ({ getExpoLocation: jest.fn() }));
const getModule = jest.mocked(getExpoLocation);
const permission = jest.fn<() => Promise<{ granted: boolean }>>();
const lastKnown = jest.fn<() => Promise<{ coords: { latitude: number; longitude: number } } | null>>();
const current = jest.fn<() => Promise<{ coords: { latitude: number; longitude: number } }>>();

beforeEach(() => {
  jest.clearAllMocks();
  permission.mockResolvedValue({ granted: true });
  lastKnown.mockResolvedValue(null);
  current.mockResolvedValue({ coords: { latitude: -33.87, longitude: 151.21 } });
  getModule.mockResolvedValue({ requestForegroundPermissionsAsync: permission, getForegroundPermissionsAsync: permission, getLastKnownPositionAsync: lastKnown, getCurrentPositionAsync: current, Accuracy: { Balanced: 3 } } as unknown as Awaited<ReturnType<typeof getExpoLocation>>);
});

test('uses a recent location without waiting for a new fix', async () => {
  lastKnown.mockResolvedValue({ coords: { latitude: 1, longitude: 2 } });
  await expect(readForegroundLocation(true)).resolves.toEqual({ latitude: 1, longitude: 2 });
  expect(current).not.toHaveBeenCalled();
});

test('obtains a fresh fix when no recent location exists', async () => {
  await expect(readForegroundLocation(true)).resolves.toEqual({ latitude: -33.87, longitude: 151.21 });
  expect(current).toHaveBeenCalledTimes(1);
});

test('distinguishes permission denial, missing native support and unavailable location', async () => {
  permission.mockResolvedValue({ granted: false });
  await expect(readForegroundLocation(true)).resolves.toBe('denied');
  getModule.mockResolvedValueOnce(null);
  await expect(readForegroundLocation(true)).resolves.toBe('unsupported');
  permission.mockResolvedValue({ granted: true });
  current.mockRejectedValue(new Error('Location services disabled'));
  await expect(readForegroundLocation(true)).resolves.toBe('unavailable');
});
