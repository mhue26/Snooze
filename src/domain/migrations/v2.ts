export const MIGRATION_V2_VERSION = 2;
export const MIGRATION_V2_SQL = `
  CREATE TABLE IF NOT EXISTS sleep_records (
    sleep_date TEXT PRIMARY KEY NOT NULL,
    bedtime_minutes INTEGER NOT NULL CHECK (bedtime_minutes BETWEEN 0 AND 1439),
    wake_minutes INTEGER NOT NULL CHECK (wake_minutes BETWEEN 0 AND 1439),
    CHECK (bedtime_minutes != wake_minutes)
  );
  INSERT INTO schema_migrations (version) VALUES (2);
`;

export function applyMigrationV2(db: { execSync(sql: string): void }): void {
  db.execSync(MIGRATION_V2_SQL);
}
