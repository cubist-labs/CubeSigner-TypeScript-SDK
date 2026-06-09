import type { ApiClient, KeyImportKey, SecretValue } from "@cubist-labs/cubesigner-sdk";
import { loadSubtleCrypto } from "@cubist-labs/cubesigner-sdk";
import { WrappedImportKey } from "./wrapped_import_key";

/**
 * The result of encrypting a policy secret value.
 */
export type EncryptedPolicySecret = {
  /** The encrypted secret value, for use in `SetPolicySecretRequest.value`. */
  value: SecretValue;
  /** The import key, for use in `SetPolicySecretRequest.import_key`. */
  importKey: KeyImportKey;
};

/**
 * Encrypt a policy secret value using a fresh policy import key.
 *
 * @param client The API client.
 * @param plaintext The plaintext secret value to encrypt.
 * @returns The encrypted secret value and the import key to include in the request.
 */
export async function encryptPolicySecret(
  client: ApiClient,
  plaintext: string,
): Promise<EncryptedPolicySecret> {
  const resp = await client.policyImportKeyCreate();

  const subtle = await loadSubtleCrypto();
  const wik = await WrappedImportKey.createAndVerify(resp, subtle, null);

  const { enc, ciphertext } = await wik.encrypt(new TextEncoder().encode(plaintext));
  return {
    // We use an extension of HPKE that allows a salt value to be specified, but it is ok to
    // use an empty salt if the import key is not reused
    value: { client_public_key: enc, encrypted_value: ciphertext, salt: "" },
    importKey: wik.toImportKey(),
  };
}
