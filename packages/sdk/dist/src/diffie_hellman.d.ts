import type { DiffieHellmanResponse } from "./schema_types";
/**
 * Decrypt a set of Diffie-Hellman exchange responses.
 *
 * @param recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the Diffie-Hellman exchange that returned `response`.
 * @param response The response from a successful Diffie-Hellmanm exchange request.
 * @returns The decrypted public keys as serialized byte strings in a key-type--specific format.
 */
export declare function diffieHellmanDecrypt(recipientKey: CryptoKey, response: DiffieHellmanResponse): Promise<Uint8Array[]>;
//# sourceMappingURL=diffie_hellman.d.ts.map