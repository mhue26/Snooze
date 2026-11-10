import { beforeEach, expect, jest, test } from '@jest/globals';
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { assertDatabaseCanBeCreated, openEncryptedDatabase } from '../src/data/database';
import { getOrCreateDatabaseKey } from '../src/data/encryptionKey';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
jest.mock('expo-secure-store', () => ({ WHEN_UNLOCKED_THIS_DEVICE_ONLY: 1, getItemAsync: jest.fn(), setItemAsync: jest.fn() }));
jest.mock('expo-crypto', () => ({ getRandomBytesAsync: jest.fn() }));

const open = jest.mocked(SQLite.openDatabaseAsync);
const getKey = jest.mocked(SecureStore.getItemAsync);
const setKey = jest.mocked(SecureStore.setItemAsync);
const random = jest.mocked(Crypto.getRandomBytesAsync);
const key = 'ab'.repeat(32);

function fakeDb() {
  const db = {
    getFirstAsync: jest.fn<(sql: string) => Promise<unknown>>(),
    execAsync: jest.fn<(sql: string) => Promise<void>>().mockResolvedValue(undefined),
    execSync: jest.fn<(sql: string) => void>(),
    closeAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn<(fn: () => Promise<void>) => Promise<void>>().mockImplementation(fn => fn()),
  };
  open.mockResolvedValue(db as unknown as SQLite.SQLiteDatabase);
  return db;
}

beforeEach(() => { jest.clearAllMocks(); });

test('concurrent first use generates and stores one key; later calls reuse it', async () => {
  getKey.mockResolvedValueOnce(null).mockResolvedValue(key);
  setKey.mockResolvedValue(undefined);
  random.mockResolvedValue(new Uint8Array(32).fill(0xab));
  const canCreate = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  expect(await Promise.all([getOrCreateDatabaseKey(canCreate, 'race'), getOrCreateDatabaseKey(canCreate, 'race')])).toEqual([key, key]);
  expect(random).toHaveBeenCalledTimes(1);
  expect(setKey).toHaveBeenCalledTimes(1);
  expect(await getOrCreateDatabaseKey(canCreate, 'race')).toBe(key);
  expect(canCreate).toHaveBeenCalledTimes(1);
});

test('never generates a replacement key if existing data cannot be opened', async () => {
  getKey.mockResolvedValue(null);
  const canCreate = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('existing data'));
  await expect(getOrCreateDatabaseKey(canCreate, 'missing')).rejects.toThrow('existing data');
  expect(random).not.toHaveBeenCalled();
  expect(setKey).not.toHaveBeenCalled();
});

test('preflight rejects unreadable or nonempty databases and closes handles', async () => {
  const db = fakeDb();
  db.getFirstAsync.mockRejectedValueOnce(new Error('not a database'));
  await expect(assertDatabaseCanBeCreated('fixture')).rejects.toThrow('key is missing');
  expect(db.closeAsync).toHaveBeenCalledTimes(1);
  db.getFirstAsync.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ user_version: 0 });
  await expect(assertDatabaseCanBeCreated('fixture')).rejects.toThrow('key is missing');
  expect(db.closeAsync).toHaveBeenCalledTimes(2);
});

test('fails closed if SQLCipher is absent and does not write the database', async () => {
  const db = fakeDb();
  db.getFirstAsync.mockResolvedValueOnce(null);
  await expect(openEncryptedDatabase('fixture', key)).rejects.toThrow('SQLCipher is unavailable');
  expect(db.execAsync).not.toHaveBeenCalled();
  expect(db.closeAsync).toHaveBeenCalledTimes(1);
});

test('applies v1 and v2 on a fresh database, only v2 on v1, and neither on v2', async () => {
  const db = fakeDb();
  db.getFirstAsync.mockResolvedValueOnce({ cipher_version: 'test' }).mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ version: null });
  await openEncryptedDatabase('fixture', key);
  expect(db.execAsync).toHaveBeenCalledWith(`PRAGMA key = "x'${key}'";`);
  expect(db.execSync).toHaveBeenCalledTimes(2);
  db.getFirstAsync.mockResolvedValueOnce({ cipher_version: 'test' }).mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ version: 1 });
  await openEncryptedDatabase('fixture', key);
  expect(db.execSync).toHaveBeenCalledTimes(3);
  expect(db.execSync.mock.calls[2][0]).toContain('CREATE TABLE IF NOT EXISTS sleep_records');
  db.getFirstAsync.mockResolvedValueOnce({ cipher_version: 'test' }).mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ version: 2 });
  await openEncryptedDatabase('fixture', key);
  expect(db.execSync).toHaveBeenCalledTimes(3);
});

test('rejects an invalid stored key without replacing it', async () => {
  getKey.mockResolvedValueOnce('invalid');
  const canCreate = jest.fn<() => Promise<void>>().mockResolvedValue(undefined);
  await expect(getOrCreateDatabaseKey(canCreate, 'invalid')).rejects.toThrow('stored database key is invalid');
  expect(canCreate).not.toHaveBeenCalled();
  expect(setKey).not.toHaveBeenCalled();
});

test('closes the database if the keyed schema read or migration fails', async () => {
  const db = fakeDb();
  db.getFirstAsync.mockResolvedValueOnce({ cipher_version: 'test' }).mockRejectedValueOnce(new Error('wrong key'));
  await expect(openEncryptedDatabase('fixture', key)).rejects.toThrow('wrong key');
  expect(db.closeAsync).toHaveBeenCalledTimes(1);
  expect(db.withTransactionAsync).not.toHaveBeenCalled();
  db.getFirstAsync.mockResolvedValueOnce({ cipher_version: 'test' }).mockResolvedValueOnce({ count: 0 });
  db.execAsync.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('migration failed'));
  await expect(openEncryptedDatabase('fixture', key)).rejects.toThrow('migration failed');
  expect(db.closeAsync).toHaveBeenCalledTimes(2);
});
