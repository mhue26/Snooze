import { expect, jest, test } from '@jest/globals';
import type { SQLiteDatabase } from 'expo-sqlite';
import { deleteNap, loadNaps, saveNap } from '../src/data/naps';

test('loads naps for the selected date and saves and deletes individual entries', async () => {
  const getAllAsync = jest.fn<(sql: string, date: string) => Promise<unknown>>().mockResolvedValue([{ id: 4, sleep_date: '2026-11-10', start_minutes: 780, end_minutes: 810 }]);
  const runAsync = jest.fn<(...args: (string | number)[]) => Promise<unknown>>().mockResolvedValue(undefined);
  const db = { getAllAsync, runAsync } as unknown as SQLiteDatabase;
  const [nap] = await loadNaps(db, '2026-11-10');
  expect(nap).toEqual({ id: 4, date: '2026-11-10', startMinutes: 780, endMinutes: 810 });
  expect(getAllAsync).toHaveBeenCalledWith(expect.stringContaining('WHERE sleep_date = ?'), '2026-11-10');
  await saveNap(db, nap);
  await saveNap(db, nap, nap.id);
  await deleteNap(db, nap);
  expect(runAsync).toHaveBeenNthCalledWith(1, expect.stringContaining('INSERT INTO naps'), '2026-11-10', 780, 810);
  expect(runAsync).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE naps'), 780, 810, 4, '2026-11-10');
  expect(runAsync).toHaveBeenNthCalledWith(3, expect.stringContaining('DELETE FROM naps'), 4, '2026-11-10');
});
