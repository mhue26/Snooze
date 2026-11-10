import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { isValidDatabaseKey } from '../domain/crypto';

export const DATABASE_KEY_NAME = 'snooze.db.v1';
const options = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const pendingKeys = new Map<string, Promise<string>>();

/** The caller must verify that creating a key cannot strand an existing database. */
export function getOrCreateDatabaseKey(canCreate: () => Promise<void>, keyName = DATABASE_KEY_NAME): Promise<string> {
  const pending = pendingKeys.get(keyName);
  if (pending) return pending;
  const operation = (async () => {
    const existing = await SecureStore.getItemAsync(keyName, options);
    if (existing !== null) {
      if (!isValidDatabaseKey(existing)) throw new Error('The stored database key is invalid.');
      return existing;
    }
    await canCreate();
    const bytes = await Crypto.getRandomBytesAsync(32);
    const key = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    await SecureStore.setItemAsync(keyName, key, options);
    return key;
  })();
  pendingKeys.set(keyName, operation);
  void operation.finally(() => { if (pendingKeys.get(keyName) === operation) pendingKeys.delete(keyName); }).catch(() => {});
  return operation;
}
