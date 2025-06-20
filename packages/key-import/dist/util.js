"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBigEndian = toBigEndian;
exports.concatArrays = concatArrays;
exports.nowEpochMillis = nowEpochMillis;
/**
 * Converts a bigint to a big-endian Uint8Array of a specified length
 *
 * @param n The value to convert
 * @param l The length in bytes
 * @returns The big-endian bytes
 */
function toBigEndian(n, l) {
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
 * @param parts The parts to be concatenated
 * @returns The concatenated array
 */
function concatArrays(parts) {
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
 * @returns Seconds since UNIX epoch
 */
function nowEpochMillis() {
    return BigInt(Date.now());
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBT0Esa0NBV0M7QUFRRCxvQ0FXQztBQU9ELHdDQUVDO0FBOUNEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFdBQVcsQ0FBQyxDQUFTLEVBQUUsQ0FBUztJQUM5QyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUNoQyxNQUFNLElBQUksS0FBSyxDQUFDLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0lBQzdFLENBQUM7SUFDRCxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDWCxNQUFNLEdBQUcsR0FBRyxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2hDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQzNCLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO0lBQ2hCLENBQUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQWdCLFlBQVksQ0FBQyxLQUFtQjtJQUM5QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFFbkUsSUFBSSxRQUFRLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLE1BQU0sR0FBRyxHQUFHLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3JDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRTtRQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztRQUN4QixRQUFRLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUMxQixDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQixjQUFjO0lBQzVCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIENvbnZlcnRzIGEgYmlnaW50IHRvIGEgYmlnLWVuZGlhbiBVaW50OEFycmF5IG9mIGEgc3BlY2lmaWVkIGxlbmd0aFxuICpcbiAqIEBwYXJhbSBuIFRoZSB2YWx1ZSB0byBjb252ZXJ0XG4gKiBAcGFyYW0gbCBUaGUgbGVuZ3RoIGluIGJ5dGVzXG4gKiBAcmV0dXJucyBUaGUgYmlnLWVuZGlhbiBieXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gdG9CaWdFbmRpYW4objogYmlnaW50LCBsOiBudW1iZXIpOiBVaW50OEFycmF5IHtcbiAgaWYgKG4gPj0gMW4gPDwgKDhuICogQmlnSW50KGwpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihgQ2Fubm90IGNvbnZlcnQgJHtufSB0byAke2x9IGJpZy1lbmRpYW4gYnl0ZXMgKG92ZXJmbG93KWApO1xuICB9XG4gIGxldCBubiA9IG47XG4gIGNvbnN0IHJldCA9IG5ldyBVaW50OEFycmF5KGwpO1xuICBmb3IgKGxldCBpID0gbCAtIDE7IGkgPj0gMDsgLS1pKSB7XG4gICAgcmV0W2ldID0gTnVtYmVyKG5uICUgMjU2bik7XG4gICAgbm4gPSBubiA+PiA4bjtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIENvbmNhdGVuYXRlcyBhbiBhcnJheSBvZiBVaW50OEFycmF5cyBpbnRvIGEgc2luZ2xlIGFycmF5XG4gKlxuICogQHBhcmFtIHBhcnRzIFRoZSBwYXJ0cyB0byBiZSBjb25jYXRlbmF0ZWRcbiAqIEByZXR1cm5zIFRoZSBjb25jYXRlbmF0ZWQgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdEFycmF5cyhwYXJ0czogVWludDhBcnJheVtdKTogVWludDhBcnJheSB7XG4gIGNvbnN0IHRvdGFsTGVuID0gcGFydHMucmVkdWNlKChsZW4sIHBhcnQpID0+IGxlbiArIHBhcnQubGVuZ3RoLCAwKTtcblxuICBsZXQgbGVuU29GYXIgPSAwO1xuICBjb25zdCByZXQgPSBuZXcgVWludDhBcnJheSh0b3RhbExlbik7XG4gIHBhcnRzLmZvckVhY2goKHBhcnQpID0+IHtcbiAgICByZXQuc2V0KHBhcnQsIGxlblNvRmFyKTtcbiAgICBsZW5Tb0ZhciArPSBwYXJ0Lmxlbmd0aDtcbiAgfSk7XG5cbiAgcmV0dXJuIHJldDtcbn1cblxuLyoqXG4gKiBHZXQgdGhlIGN1cnJlbnQgdGltZSBpbiBzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2hcbiAqXG4gKiBAcmV0dXJucyBTZWNvbmRzIHNpbmNlIFVOSVggZXBvY2hcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vd0Vwb2NoTWlsbGlzKCk6IGJpZ2ludCB7XG4gIHJldHVybiBCaWdJbnQoRGF0ZS5ub3coKSk7XG59XG4iXX0=