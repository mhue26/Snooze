import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import { assertDatabaseCanBeCreated, openEncryptedDatabase } from '../data/database';
import { getOrCreateDatabaseKey } from '../data/encryptionKey';

// Dedicated fixture names are intentionally separate from all production data.
const name = 'snooze-encryption-verification.db';
const keyName = 'snooze.encryption.verification.key';
const markerName = 'snooze.encryption.verification.phase';
const secondKeyName = 'snooze.encryption.verification.second-key';
const marker = 'snooze encrypted fixture';

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectUnreadable(key?: string) {
  const db = await SQLite.openDatabaseAsync(name, { useNewConnection: true });
  let rejected = false;
  try {
    if (key) await db.execAsync(`PRAGMA key = "x'${key}'";`);
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
  } catch { rejected = true; }
  finally { await db.closeAsync(); }
  check(rejected, key ? 'Wrong-key read unexpectedly succeeded' : 'Unkeyed read unexpectedly succeeded');
}

/** Run twice in separate app processes; no production database or key is touched. */
export async function runAndroidDatabaseCheck(): Promise<string> {
  const phase = await SecureStore.getItemAsync(markerName);
  const key = await getOrCreateDatabaseKey(() => assertDatabaseCanBeCreated(name), keyName);
  if (!phase) {
    const secondKey = await getOrCreateDatabaseKey(async () => {}, secondKeyName);
    try { check(secondKey !== key, 'Independent generated keys unexpectedly match'); }
    finally { await SecureStore.deleteItemAsync(secondKeyName); }
    const { db, cipherVersion } = await openEncryptedDatabase(name, key);
    try {
      const version = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM schema_migrations');
      check(version?.version === 2, 'Migration v2 was not recorded');
      await db.execAsync('CREATE TABLE verification_fixture (value TEXT NOT NULL)');
      await db.runAsync('INSERT INTO verification_fixture (value) VALUES (?)', marker);
    } finally { await db.closeAsync(); }
    await SecureStore.setItemAsync(markerName, 'written');
    return `PHASE 1 PASS: SQLCipher ${cipherVersion}; independent keys and encrypted fixture verified. Restart the app to verify persisted key and database.`;
  }
  check(phase === 'written', 'Unexpected verification state');
  const { db, cipherVersion } = await openEncryptedDatabase(name, key);
  try {
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM verification_fixture');
    const version = await db.getFirstAsync<{ count: number; version: number }>('SELECT COUNT(*) AS count, MAX(version) AS version FROM schema_migrations');
    check(row?.value === marker, 'Persisted fixture could not be read');
    check(version?.count === 2 && version.version === 2, 'Migration was not idempotent');
  } finally { await db.closeAsync(); }
  await expectUnreadable();
  await SecureStore.deleteItemAsync(keyName);
  try {
    let rejected = false;
    try { await getOrCreateDatabaseKey(() => assertDatabaseCanBeCreated(name), keyName); }
    catch { rejected = true; }
    check(rejected, 'Missing-key protection did not reject the existing database');
    check(await SecureStore.getItemAsync(keyName) === null, 'Missing key was unexpectedly replaced');
  } finally { await SecureStore.setItemAsync(keyName, key); }
  const wrongKey = (key.startsWith('00') ? '01' : '00') + key.slice(2);
  await expectUnreadable(wrongKey);
  await SQLite.deleteDatabaseAsync(name);
  await SecureStore.deleteItemAsync(keyName);
  await SecureStore.deleteItemAsync(markerName);
  return `PHASE 2 PASS: SQLCipher ${cipherVersion}; restart, stored key, data, migration, missing-key, no-key and wrong-key checks passed. Fixture removed.`;
}
