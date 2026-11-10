import * as SQLite from 'expo-sqlite';
import { applyMigrationV1, MIGRATION_V1_VERSION } from '../domain/migrations/v1';
import { applyMigrationV2, MIGRATION_V2_VERSION } from '../domain/migrations/v2';
import { applyMigrationV3, MIGRATION_V3_VERSION } from '../domain/migrations/v3';
import { isValidDatabaseKey } from '../domain/crypto';
import { getOrCreateDatabaseKey } from './encryptionKey';

export type OpenDatabase = { db: SQLite.SQLiteDatabase; cipherVersion: string };
export const DATABASE_NAME = 'snooze.db';

/** A missing key must never be replaced if the database already contains data. */
export async function assertDatabaseCanBeCreated(name: string): Promise<void> {
  const db = await SQLite.openDatabaseAsync(name, { useNewConnection: true });
  try {
    const row = await db.getFirstAsync<{ count: number }>('SELECT count(*) AS count FROM sqlite_master');
    const version = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    if (!row || row.count !== 0 || !version || version.user_version !== 0) throw new Error('Database is not empty');
  } catch {
    throw new Error('The database key is missing and the existing database cannot be safely opened. No data was deleted.');
  } finally {
    await db.closeAsync();
  }
}

/** Opens an independent keyed handle and applies migrations before returning it. */
export async function openEncryptedDatabase(name: string, key: string): Promise<OpenDatabase> {
  if (!isValidDatabaseKey(key)) throw new Error('The database key is invalid.');
  const db = await SQLite.openDatabaseAsync(name, { useNewConnection: true });
  try {
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('SQLCipher is unavailable in this build. Rebuild the development client.');
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
    await db.withTransactionAsync(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)');
      const row = await db.getFirstAsync<{ version: number | null }>('SELECT MAX(version) AS version FROM schema_migrations');
      if ((row?.version ?? 0) < MIGRATION_V1_VERSION) applyMigrationV1(db);
      if ((row?.version ?? 0) < MIGRATION_V2_VERSION) applyMigrationV2(db);
      if ((row?.version ?? 0) < MIGRATION_V3_VERSION) applyMigrationV3(db);
    });
    return { db, cipherVersion: cipher.cipher_version };
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}

// Serialize startup, including overlapping React effect lifecycles, to avoid migration races.
let startupQueue: Promise<void> = Promise.resolve();
export function openDatabase(): Promise<OpenDatabase> {
  const operation = startupQueue.then(async () => {
    const key = await getOrCreateDatabaseKey(() => assertDatabaseCanBeCreated(DATABASE_NAME));
    return openEncryptedDatabase(DATABASE_NAME, key);
  });
  startupQueue = operation.then(() => {}, () => {});
  return operation;
}
