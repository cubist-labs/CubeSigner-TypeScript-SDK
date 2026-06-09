import {
  decodeBase64,
  encodeToBase64,
  encodeToHex,
  loadCrypto,
  type CreateKeyImportKeyResponse,
  type CreatePolicyImportKeyResponse,
  type KeyImportKey as ImportKey,
} from "@cubist-labs/cubesigner-sdk";
import { CipherSuite, Aes256Gcm, HkdfSha384, DhkemP384HkdfSha384 } from "@hpke/core";
import { ECParameters } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import {
  AlgorithmProvider,
  X509Certificate,
  cryptoProvider as x509CryptoProvider,
} from "@peculiar/x509";
import { toBigEndian, concatArrays, nowEpochMillis } from "./util";

// domain-separation tag used when generating signing hash for import key
export const IMPORT_KEY_SIGNING_DST = new TextEncoder().encode("CUBESIGNER_EPHEMERAL_IMPORT_P384");

// how early to refresh a wrapped import key before it expires
export const WIK_REFRESH_EARLY_MILLIS = 60_000n;

// attestation document slack times
const MAX_ATTESTATION_AGE_MINUTES = 15n;
const MAX_ATTESTATION_FUTURE_MINUTES = 5n;

// OIDs for elliptic curve X509 certs
const EC_PUBLIC_KEY = "1.2.840.10045.2.1";
const NIST_P384 = "1.3.132.0.34";

// AWS Nitro Enclaves root CA certificate
// https://aws-nitro-enclaves.amazonaws.com/AWS_NitroEnclaves_Root-G1.zip
//
// See the documentation about AWS Nitro Enclaves verification:
// https://docs.aws.amazon.com/enclaves/latest/user/verify-root.html
const AWS_CA_CERT =
  "MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTELMAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYDVQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQLDANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEGBSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZEh8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkFR+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPWrfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6NIwLz3/Y=";

// Cubist enclave-signing key. All valid attestations will have this
// public key in PCR8.
const CUBIST_EIF_SIGNING_PK =
  "2e6d0430c8b0b78316236d03cda2996449e24096b3f5b524031f12eeb5fc19a19db522a846e6240a5f36f26591890ac4";

/**
 * An import-key response with enclave attestation, compatible with both
 * `CreateKeyImportKeyResponse` and `CreatePolicyImportKeyResponse`.
 */
export type ImportKeyResponse = CreateKeyImportKeyResponse & CreatePolicyImportKeyResponse;

/**
 * A verified import key, usable for HPKE encryption.
 */
export class WrappedImportKey {
  readonly #publicKey: Uint8Array;
  readonly #skEnc: Uint8Array;
  readonly #dkEnc: Uint8Array;
  readonly #expEpochSeconds: bigint;
  readonly #enclaveAttestation: Uint8Array;
  readonly #enclaveSignature: Uint8Array;
  readonly #suite: CipherSuite;
  #senderContextParams?: { recipientPublicKey: CryptoKey; info: ArrayBuffer };

  /**
   * Private constructor.
   *
   * @param resp The import key response from CubeSigner.
   * @param suite The HPKE ciphersuite to use for encryption.
   */
  private constructor(resp: ImportKeyResponse, suite: CipherSuite) {
    this.#publicKey = decodeBase64(resp.public_key);
    this.#skEnc = decodeBase64(resp.sk_enc);
    this.#dkEnc = decodeBase64(resp.dk_enc);
    this.#expEpochSeconds = BigInt(resp.expires);
    this.#enclaveAttestation = decodeBase64(resp.enclave_attestation);
    this.#enclaveSignature = decodeBase64(resp.enclave_signature);
    this.#suite = suite;
  }

  /**
   * Create and verify a `WrappedImportKey` from an import-key response.
   *
   * @param resp The response from CubeSigner (key import or policy import).
   * @param subtle A SubtleCrypto instance used for verification.
   * @param pcr8Expect The expected PCR8 value (bare hex). If `null`, the PCR8 check is skipped.
   *   Defaults to the Cubist enclave signing key, which is correct for key imports.
   * @returns A newly constructed, verified instance.
   */
  public static async createAndVerify(
    resp: ImportKeyResponse,
    subtle: SubtleCrypto,
    pcr8Expect: string | null = CUBIST_EIF_SIGNING_PK,
  ): Promise<WrappedImportKey> {
    const suite = new CipherSuite({
      kem: new DhkemP384HkdfSha384(),
      kdf: new HkdfSha384(),
      aead: new Aes256Gcm(),
    });
    const wik = new WrappedImportKey(resp, suite);
    const info = await wik.#verifyImportKey(subtle, pcr8Expect);
    const recipientPublicKey = await suite.kem.importKey("raw", wik.#publicKey, true);
    wik.#senderContextParams = { recipientPublicKey, info };
    return wik;
  }

  /**
   * Verify this wrapped import key.
   *
   * @param subtle An instance of SubtleCrypto used for verification.
   * @param pcr8Expect The expected PCR8 value, or `null` to skip the check.
   * @returns The SHA-256 hash of the signed data, for use as the HPKE `info` parameter.
   */
  async #verifyImportKey(subtle: SubtleCrypto, pcr8Expect: string | null): Promise<ArrayBuffer> {
    // check expiration date
    if (nowEpochMillis() >= this.#expEpochSeconds * 1000n) {
      throw new Error("Import key is expired");
    }

    const signingKey = await verifyAttestationKey(this.#enclaveAttestation, pcr8Expect);

    // we use subtlecrypto's impl of RSA-PSS verification
    const rsaPssKeyParams = { name: "RSA-PSS", hash: "SHA-256" };
    const pubkey = await subtle.importKey("spki", signingKey, rsaPssKeyParams, true, ["verify"]);
    const pubkeyAlg = pubkey.algorithm as unknown as { modulusLength: number };

    // compute the signing hash and verify the signature
    const message = this.#signedData();
    const mlen = Number(BigInt(pubkeyAlg.modulusLength) / 8n);
    const rsaPssParams = { name: "RSA-PSS", saltLength: mlen - 2 - 32 };

    if (!(await subtle.verify(rsaPssParams, pubkey, this.#enclaveSignature, message))) {
      throw new Error("Import key signature verification failed");
    }

    return subtle.digest("SHA-256", message);
  }

  /**
   * Returns `true` if this WrappedImportKey needs to be refreshed.
   *
   * @returns True just if this key needs to be refreshed.
   */
  public needsRefresh(): boolean {
    // force refresh if we're within WIK_REFRESH_EARLY_MILLIS of the expiration
    return nowEpochMillis() + WIK_REFRESH_EARLY_MILLIS > this.#expEpochSeconds * 1000n;
  }

  /**
   * Computes the signing hash for this import key.
   *
   * @returns The bytes over which the enclave signature was computed.
   */
  #signedData(): Uint8Array {
    const parts = [
      // domain separation tag
      toBigEndian(BigInt(IMPORT_KEY_SIGNING_DST.length), 2),
      IMPORT_KEY_SIGNING_DST,

      // public key
      toBigEndian(BigInt(this.#publicKey.length), 2),
      this.#publicKey,

      // sk_enc
      toBigEndian(BigInt(this.#skEnc.length), 2),
      this.#skEnc,

      // dk_enc
      toBigEndian(BigInt(this.#dkEnc.length), 2),
      this.#dkEnc,

      // 8-byte big-endian expiration time in seconds since UNIX epoch
      toBigEndian(this.#expEpochSeconds, 8),
    ];

    return concatArrays(parts);
  }

  /**
   * Encrypt `data` using HPKE to this import key.
   *
   * @param data The plaintext to encrypt.
   * @returns The base64-encoded HPKE encapsulated key (`enc`) and ciphertext.
   */
  public async encrypt(data: Uint8Array): Promise<{ enc: string; ciphertext: string }> {
    // Safe: `WrappedImportKey` can only be constructed through `createAndVerify`, which always
    // sets `#senderContextParams`
    const params = this.#senderContextParams!;
    const sender = await this.#suite.createSenderContext(params);
    return {
      enc: encodeToBase64(sender.enc),
      ciphertext: encodeToBase64(await sender.seal(data)),
    };
  }

  /**
   * Return the import key fields, for use in import requests.
   *
   * @returns The import key fields.
   */
  public toImportKey(): ImportKey {
    return {
      public_key: encodeToBase64(this.#publicKey),
      sk_enc: encodeToBase64(this.#skEnc),
      dk_enc: encodeToBase64(this.#dkEnc),
      expires: Number(this.#expEpochSeconds),
    };
  }
}

/*
 * An AWS Nitro attestation document
 *
 * https://github.com/aws/aws-nitro-enclaves-nsm-api/blob/4b851f3006c6fa98f23dcffb2cba03b39de9b8af/src/api/mod.rs#L208
 */
type AttestationDoc = {
  module_id: string;
  digest: "SHA256" | "SHA384" | "SHA512";
  timestamp: bigint;
  pcrs: { [pcr: string]: Uint8Array };
  certificate: Uint8Array;
  cabundle: Uint8Array[];
  public_key?: Uint8Array;
  user_data?: Uint8Array;
  nonce?: Uint8Array;
};

/**
 * Verifies the attestation key against the AWS Nitro Enclaves signing
 * key and returns the attested signing key.
 *
 * @param attBytes An attestation from an AWS nitro enclave.
 * @param pcr8Expect If non-null, the expected value of PCR8 in the attestation.
 * @returns The signing key that was attested.
 */
export async function verifyAttestationKey(
  attBytes: Uint8Array,
  pcr8Expect: string | null,
): Promise<Uint8Array> {
  // cbor-x is being imported as ESM, so we must asynchronously import it here.
  // Because we only use that and auth0/cose here, we import both this way.
  const { Sign1 } = await import("@auth0/cose");
  const { decode: cborDecode } = await import("cbor-x");

  x509CryptoProvider.set(await loadCrypto());

  const att = Sign1.decode(attBytes);
  const attDoc = cborDecode(att.payload) as AttestationDoc;

  // if there's no public key in this attestation, reject
  if (!attDoc.public_key) {
    throw new Error("Attestation did not include a signing public key");
  }

  // if a PCR8 value is expected, verify it matches
  if (pcr8Expect !== null) {
    const pcr8Data = attDoc.pcrs["8"];
    // slice(2) strips "0x" prefix; pcr8Expect is bare hex
    if (!pcr8Data || pcr8Expect !== encodeToHex(pcr8Data).slice(2)) {
      throw new Error("Attestation was not from an authorized enclave");
    }
  }

  // check expiration date of attestation
  const nowMs = nowEpochMillis();
  const latest = nowMs + MAX_ATTESTATION_FUTURE_MINUTES * 60n * 1000n;
  const earliest =
    latest - (MAX_ATTESTATION_FUTURE_MINUTES + MAX_ATTESTATION_AGE_MINUTES) * 60n * 1000n;
  if (attDoc.timestamp < earliest || attDoc.timestamp > latest) {
    throw new Error("Attestation is expired");
  }

  // Verify certificate chain starting with AWS Nitro CA cert
  let parent = new X509Certificate(AWS_CA_CERT);
  for (let i = 0; i < attDoc.cabundle.length; ++i) {
    const cert = new X509Certificate(attDoc.cabundle[i]);
    if (!(await cert.verify(parent))) {
      throw new Error(`Attestation certificate chain failed at index ${i}`);
    }
    parent = cert;
  }
  const cert = new X509Certificate(attDoc.certificate);
  if (!(await cert.verify(parent))) {
    throw new Error("Attestation certificate chain failed at leaf");
  }
  const pubkey = cert.publicKey;

  // make sure that we got the expected public key type
  const alg = new AlgorithmProvider().toAsnAlgorithm(pubkey.algorithm);
  if (alg.algorithm != EC_PUBLIC_KEY) {
    // not the expected algorithm, i.e., elliptic curve signing
    throw new Error("Attestation contained unexpected signature algorithm");
  }
  const params = AsnParser.parse(alg.parameters!, ECParameters);
  if (!params.namedCurve || params.namedCurve !== NIST_P384) {
    // not the expected params, i.e., NIST P384
    throw new Error("Attestation contained unexpected signature algorithm");
  }

  // verify the cose signature with the key, which we verified against
  // the AWS Nitro CA certificate above
  await att.verify(await pubkey.export());

  return attDoc.public_key;
}
