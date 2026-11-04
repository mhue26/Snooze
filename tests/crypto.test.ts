import { expect, test } from '@jest/globals';
import { isValidDatabaseKey } from '../src/domain/crypto';

test('accepts exactly 32 bytes of lowercase hex', () => {
  expect(isValidDatabaseKey('ab'.repeat(32))).toBe(true);
  for (const invalid of ['', 'ab'.repeat(31), 'AB'.repeat(32), 'zz'.repeat(32)]) expect(isValidDatabaseKey(invalid)).toBe(false);
});
