import { beforeEach, expect, jest, test } from '@jest/globals';
import * as LocalAuthentication from 'expo-local-authentication';
import { authenticateDeletion } from '../src/data/authenticateDeletion';

jest.mock('expo-local-authentication', () => ({ authenticateAsync: jest.fn() }));
const authenticate = jest.mocked(LocalAuthentication.authenticateAsync);

beforeEach(() => { authenticate.mockReset(); });

test('requires successful device authentication and permits passcode fallback', async () => {
  authenticate.mockResolvedValue({ success: true });
  await expect(authenticateDeletion()).resolves.toBe('authenticated');
  expect(authenticate).toHaveBeenCalledWith(expect.objectContaining({ disableDeviceFallback: false, biometricsSecurityLevel: 'strong' }));
});

test.each([
  ['user_cancel', 'cancelled'],
  ['passcode_not_set', 'unavailable'],
  ['not_enrolled', 'unavailable'],
  ['lockout', 'failed'],
] as const)('does not authenticate on %s', async (error, expected) => {
  authenticate.mockResolvedValue({ success: false, error });
  await expect(authenticateDeletion()).resolves.toBe(expected);
});

test('treats a native authentication error as unavailable', async () => {
  authenticate.mockRejectedValue(new Error('Native module unavailable'));
  await expect(authenticateDeletion()).resolves.toBe('unavailable');
});
