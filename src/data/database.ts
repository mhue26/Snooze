import * as SQLite from 'expo-sqlite';
import { applyMigrationV1, MIGRATION_V1_VERSION } from '../domain/migrations/v1';
import { getOrCreateDatabaseKey } from './encryptionKey';

export type OpenDatabase = { db: SQLite.SQLiteDatabase; cipherVersion: string };

export async function openDatabase(): Promise<OpenDatabase> {
  const key = await getOrCreateDatabaseKey();
  const db = await SQLite.openDatabaseAsync('snooze.db');
  try {
    // The key is validated hex; SQLCipher requires the key before any database reads.
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    const cipher = await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version');
    if (!cipher?.cipher_version) throw new Error('SQLCipher is unavailable in this build. Rebuild the development client.');
    // Force a read so a wrong key or unencrypted database fails before reporting success.
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
    await db.withTransactionAsync(async () => {
      await db.execAsync('CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY)');
      const row = await db.getFirstAsync<{ version: number | null }>('SELECT MAX(version) AS version FROM schema_migrations');
      if ((row?.version ?? 0) < MIGRATION_V1_VERSION) applyMigrationV1(db);
    });
    return { db, cipherVersion: cipher.cipher_version };
  } catch (error) {
    await db.closeAsync();
    throw error;
  }
}
