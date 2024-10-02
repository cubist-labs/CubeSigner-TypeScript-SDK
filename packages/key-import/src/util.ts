/**
 * Converts a bigint to a big-endian Uint8Array of a specified length
 *
 * @param { bigint } n The value to convert
 * @param { number } l The length in bytes
 * @return { Uint8Array } The big-endian bytes
 */
export function toBigEndian(n: bigint, l: number): Uint8Array {
  if (n >= 1n << (8n * BigInt(l))) {
    throw new Error(`Cannot convert ${n} to ${l} big-endian bytes (overflow)`);
  }
  let nn = n;
  const ret = new Uint8Array(l);
  for (let i = l - 1; i >= 0; --i) {
    ret[i] = Number(nn % 256n);
    nn = nn >> 8n;
  }
  return ret;
}

/**
 * Concatenates an array of Uint8Arrays into a single array
 *
 * @param { Uint8Array[] } parts The parts to be concatenated
 * @return { Uint8Array } The concatenated array
 */
export function concatArrays(parts: Uint8Array[]): Uint8Array {
  const totalLen = parts.reduce((len, part) => len + part.length, 0);

  let lenSoFar = 0;
  const ret = new Uint8Array(totalLen);
  parts.forEach((part) => {
    ret.set(part, lenSoFar);
    lenSoFar += part.length;
  });

  return ret;
}

/**
 * Get the current time in seconds since UNIX epoch
 *
 * @return { BigInt } Seconds since UNIX epoch
 */
export function nowEpochMillis(): bigint {
  return BigInt(Date.now());
}
