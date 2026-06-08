import type { ApiClient, KeyImportKey, SecretValue } from "@cubist-labs/cubesigner-sdk";
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
export declare function encryptPolicySecret(client: ApiClient, plaintext: string): Promise<EncryptedPolicySecret>;
//# sourceMappingURL=policy_secret.d.ts.map