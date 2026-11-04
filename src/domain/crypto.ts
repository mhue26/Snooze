/** SQLCipher key material is 32 random bytes, encoded as lowercase hex. */
export function isValidDatabaseKey(value: string): boolean {
  return /^[0-9a-f]{64}$/.test(value);
}
