import { expect, test } from '@jest/globals';

import { intendedUse } from '../src/domain/project';

test('communicates the wellness and medical boundaries', () => {
  expect(intendedUse).toMatch(/wellness/i);
  expect(intendedUse).toMatch(/not intended to diagnose/i);
});
