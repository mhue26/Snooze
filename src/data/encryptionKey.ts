import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { isValidDatabaseKey } from '../domain/crypto';

export const DATABASE_KEY_NAME = 'snooze.db.v1';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export async function getOrCreateDatabaseKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DATABASE_KEY_NAME, options);
  if (existing !== null) {
    if (!isValidDatabaseKey(existing)) throw new Error('The stored database key is invalid.');
    return existing;
  }
  const bytes = await Crypto.getRandomBytesAsync(32);
  const key = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  await SecureStore.setItemAsync(DATABASE_KEY_NAME, key, options);
  return key;
}
