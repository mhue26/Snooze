import { expect, test, jest } from '@jest/globals';
import { applyMigrationV1, MIGRATION_V1_SQL, MIGRATION_V1_VERSION } from '../src/domain/migrations/v1';

test('migration v1 creates and records its schema version', () => {
  expect(MIGRATION_V1_VERSION).toBe(1);
  expect(MIGRATION_V1_SQL).toMatch(/CREATE TABLE IF NOT EXISTS schema_migrations/i);
  expect(MIGRATION_V1_SQL).toMatch(/INSERT INTO schema_migrations.*VALUES \(1\)/i);
  const execSync = jest.fn();
  applyMigrationV1({ execSync });
  expect(execSync).toHaveBeenCalledWith(MIGRATION_V1_SQL);
});
