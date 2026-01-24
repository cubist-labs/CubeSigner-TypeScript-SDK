import type { DiffieHellmanResponse } from "./schema_types";
import { toArrayBuffer, userExportCipherSuite } from "./user_export";
import { decodeBase64 } from "./util";

/**
 * Decrypt a set of Diffie-Hellman exchange responses.
 *
 * @param recipientKey The NIST P-256 secret key corresponding to the `publicKey` argument to the Diffie-Hellman exchange that returned `response`.
 * @param response The response from a successful Diffie-Hellmanm exchange request.
 * @returns The decrypted public keys as serialized byte strings in a key-type--specific format.
 */
export async function diffieHellmanDecrypt(
  recipientKey: CryptoKey,
  response: DiffieHellmanResponse,
): Promise<Uint8Array[]> {
  if (response.response_type == "masked") {
    throw new Error("cannot decrypt response: not encrypted");
  }
  // The ciphersuite we use for decryption; same as for user export
  const suite = await userExportCipherSuite();

  // Decrypt the ciphertext using the HPKE one-shot API
  const tdec = new TextDecoder();
  // this is the info string used by the back-end when encrypting
  const tenc = new TextEncoder();
  const info = toArrayBuffer(tenc.encode("cubist-signer::DiffieHellmanResult"));

  // decrypt
  const public_key = toArrayBuffer(decodeBase64(response.ephemeral_public_key));
  const ctxt = toArrayBuffer(decodeBase64(response.encrypted_shared_secrets));
  const decrypted_strs: string[] = JSON.parse(
    tdec.decode(
      await suite.open(
        {
          recipientKey,
          enc: public_key,
          info,
        },
        ctxt,
      ),
    ),
  );

  // decode base64 values
  return decrypted_strs.map((val) => decodeBase64(val));
}
