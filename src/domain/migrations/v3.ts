export const MIGRATION_V3_VERSION = 3;
export const MIGRATION_V3_SQL = `
  CREATE TABLE IF NOT EXISTS naps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sleep_date TEXT NOT NULL,
    start_minutes INTEGER NOT NULL CHECK (start_minutes BETWEEN 0 AND 1439),
    end_minutes INTEGER NOT NULL CHECK (end_minutes BETWEEN 0 AND 1439),
    CHECK (end_minutes > start_minutes)
  );
  CREATE INDEX IF NOT EXISTS naps_sleep_date ON naps (sleep_date);
  INSERT INTO schema_migrations (version) VALUES (3);
`;
export function applyMigrationV3(db: { execSync(sql: string): void }): void { db.execSync(MIGRATION_V3_SQL); }
