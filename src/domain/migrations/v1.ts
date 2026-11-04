export const MIGRATION_V1_VERSION = 1;
export const MIGRATION_V1_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
  INSERT INTO schema_migrations (version) VALUES (1);
`;

export function applyMigrationV1(db: { execSync(sql: string): void }): void {
  db.execSync(MIGRATION_V1_SQL);
}
