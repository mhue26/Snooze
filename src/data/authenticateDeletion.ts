import * as LocalAuthentication from 'expo-local-authentication';

export type DeletionAuthentication = 'authenticated' | 'cancelled' | 'unavailable' | 'failed';

export async function authenticateDeletion(): Promise<DeletionAuthentication> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm deletion of device data',
      promptDescription: 'Authenticate to permanently delete your Snooze data.',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      biometricsSecurityLevel: 'strong',
    });
    if (result.success) return 'authenticated';
    if (['user_cancel', 'app_cancel', 'system_cancel'].includes(result.error)) return 'cancelled';
    if (['not_available', 'not_enrolled', 'passcode_not_set'].includes(result.error)) return 'unavailable';
    return 'failed';
  } catch {
    return 'unavailable';
  }
}
