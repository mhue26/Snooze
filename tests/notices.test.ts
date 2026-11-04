import { expect, test } from '@jest/globals';
import { notices } from '../src/domain/notices';

test('includes the project licence and SQLCipher attribution', () => {
  expect(notices).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Snooze', license: 'MIT License' }), expect.objectContaining({ name: 'SQLCipher', license: expect.any(String) })]));
});
