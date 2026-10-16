/** A uniformly random integer in [0, count), from the browser's secure generator without modulo bias. */
export function randomIndex(count: number): number {
  if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be a positive integer');
  const cryptoObject = globalThis.crypto;
  if (!cryptoObject?.getRandomValues) throw new Error('Secure randomness is unavailable');
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / count) * count;
  const value = new Uint32Array(1);
  do cryptoObject.getRandomValues(value); while (value[0]! >= limit);
  return value[0]! % count;
}
