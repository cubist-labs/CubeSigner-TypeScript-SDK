import { type CreateKeyImportKeyResponse, type CreatePolicyImportKeyResponse, type KeyImportKey as ImportKey } from "@cubist-labs/cubesigner-sdk";
export declare const IMPORT_KEY_SIGNING_DST: Uint8Array<ArrayBufferLike>;
export declare const WIK_REFRESH_EARLY_MILLIS = 60000n;
/**
 * An import-key response with enclave attestation, compatible with both
 * `CreateKeyImportKeyResponse` and `CreatePolicyImportKeyResponse`.
 */
export type ImportKeyResponse = CreateKeyImportKeyResponse & CreatePolicyImportKeyResponse;
/**
 * A verified import key, usable for HPKE encryption.
 */
export declare class WrappedImportKey {
    #private;
    /**
     * Private constructor.
     *
     * @param resp The import key response from CubeSigner.
     * @param suite The HPKE ciphersuite to use for encryption.
     */
    private constructor();
    /**
     * Create and verify a `WrappedImportKey` from an import-key response.
     *
     * @param resp The response from CubeSigner (key import or policy import).
     * @param subtle A SubtleCrypto instance used for verification.
     * @param pcr8Expect The expected PCR8 value (bare hex). If `null`, the PCR8 check is skipped.
     *   Defaults to the Cubist enclave signing key, which is correct for key imports.
     * @returns A newly constructed, verified instance.
     */
    static createAndVerify(resp: ImportKeyResponse, subtle: SubtleCrypto, pcr8Expect?: string | null): Promise<WrappedImportKey>;
    /**
     * Returns `true` if this WrappedImportKey needs to be refreshed.
     *
     * @returns True just if this key needs to be refreshed.
     */
    needsRefresh(): boolean;
    /**
     * Encrypt `data` using HPKE to this import key.
     *
     * @param data The plaintext to encrypt.
     * @returns The base64-encoded HPKE encapsulated key (`enc`) and ciphertext.
     */
    encrypt(data: Uint8Array): Promise<{
        enc: string;
        ciphertext: string;
    }>;
    /**
     * Return the import key fields, for use in import requests.
     *
     * @returns The import key fields.
     */
    toImportKey(): ImportKey;
}
/**
 * Verifies the attestation key against the AWS Nitro Enclaves signing
 * key and returns the attested signing key.
 *
 * @param attBytes An attestation from an AWS nitro enclave.
 * @param pcr8Expect If non-null, the expected value of PCR8 in the attestation.
 * @returns The signing key that was attested.
 */
export declare function verifyAttestationKey(attBytes: Uint8Array, pcr8Expect: string | null): Promise<Uint8Array>;
//# sourceMappingURL=wrapped_import_key.d.ts.map