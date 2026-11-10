import type { SQLiteDatabase } from 'expo-sqlite';

export type Nap = { id: number; date: string; startMinutes: number; endMinutes: number };
export type NapInput = Omit<Nap, 'id'>;

export async function loadNaps(db: SQLiteDatabase, date: string): Promise<Nap[]> {
  const rows = await db.getAllAsync<{ id: number; sleep_date: string; start_minutes: number; end_minutes: number }>(
    'SELECT id, sleep_date, start_minutes, end_minutes FROM naps WHERE sleep_date = ? ORDER BY start_minutes, id', date,
  );
  return rows.map(row => ({ id: row.id, date: row.sleep_date, startMinutes: row.start_minutes, endMinutes: row.end_minutes }));
}
export async function saveNap(db: SQLiteDatabase, nap: NapInput, id?: number): Promise<void> {
  if (id === undefined) await db.runAsync('INSERT INTO naps (sleep_date, start_minutes, end_minutes) VALUES (?, ?, ?)', nap.date, nap.startMinutes, nap.endMinutes);
  else await db.runAsync('UPDATE naps SET start_minutes = ?, end_minutes = ? WHERE id = ? AND sleep_date = ?', nap.startMinutes, nap.endMinutes, id, nap.date);
}
export async function deleteNap(db: SQLiteDatabase, nap: Nap): Promise<void> {
  await db.runAsync('DELETE FROM naps WHERE id = ? AND sleep_date = ?', nap.id, nap.date);
}
