import type {
  CreateKeyImportKeyResponse,
  ImportKeyRequest,
  ImportKeyRequestMaterial,
  Key,
  KeyType,
  Org,
  ImportDeriveKeyProperties,
} from "@cubist-labs/cubesigner-sdk";
import { loadCrypto, loadSubtleCrypto } from "@cubist-labs/cubesigner-sdk";
import { CipherSuite, Aes256Gcm, HkdfSha384, DhkemP384HkdfSha384 } from "@hpke/core";
import { ECParameters } from "@peculiar/asn1-ecc";
import { AsnParser } from "@peculiar/asn1-schema";
import {
  AlgorithmProvider,
  X509Certificate,
  cryptoProvider as x509CryptoProvider,
} from "@peculiar/x509";

import type { MnemonicToImport } from "./mnemonic";
import { newMnemonicKeyPackage } from "./mnemonic";
import { newRawKeyPackage } from "./raw";
import { toBigEndian, concatArrays, nowEpochMillis } from "./util";

// domain-separation tag used when generating signing hash for import key
const IMPORT_KEY_SIGNING_DST = new TextEncoder().encode("CUBESIGNER_EPHEMERAL_IMPORT_P384");

// attestation document slack times
const MAX_ATTESTATION_AGE_MINUTES = 15n;
const MAX_ATTESTATION_FUTURE_MINUTES = 5n;
const WIK_REFRESH_EARLY_MILLIS = 60_000n;

// OIDs for elliptic curve X509 certs
const EC_PUBLIC_KEY = "1.2.840.10045.2.1";
const NIST_P384 = "1.3.132.0.34";

// Maximum number of keys to import in a single API call
const MAX_IMPORTS_PER_API_CALL = 32n;

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
 * The result of deserializing a CreateKeyImportKeyResponse
 */
class WrappedImportKey {
  readonly verifiedHash: Uint8Array;

  readonly publicKey: Uint8Array;
  readonly publicKeyBase64: string;

  readonly skEnc: Uint8Array;
  readonly skEncBase64: string;

  readonly dkEnc: Uint8Array;
  readonly dkEncBase64: string;

  readonly expEpochSeconds: bigint;
  readonly #enclaveAttestation: Uint8Array;
  readonly #enclaveSignature: Uint8Array;

  /**
   * Constructor. This is only called from `WrappedImportKey.createAndVerify()`.
   *
   * @param resp The response from CubeSigner
   */
  private constructor(resp: CreateKeyImportKeyResponse) {
    if (!resp.enclave_attestation || !resp.enclave_signature) {
      throw new Error("No attestation found in CreateKeyImportKeyResponse");
    }

    // parse the response
    this.publicKey = new Uint8Array(Buffer.from(resp.public_key, "base64"));
    this.publicKeyBase64 = resp.public_key;

    this.skEnc = new Uint8Array(Buffer.from(resp.sk_enc, "base64"));
    this.skEncBase64 = resp.sk_enc;

    this.dkEnc = new Uint8Array(Buffer.from(resp.dk_enc, "base64"));
    this.dkEncBase64 = resp.dk_enc;

    this.#enclaveAttestation = new Uint8Array(Buffer.from(resp.enclave_attestation, "base64"));
    this.#enclaveSignature = new Uint8Array(Buffer.from(resp.enclave_signature, "base64"));
    this.expEpochSeconds = BigInt(resp.expires);

    // this array is updated in createAndVerify once verification succeeds
    this.verifiedHash = new Uint8Array(32);
  }

  /**
   * Create and verify an instance of this type
   *
   * @param resp The response from CubeSigner
   * @param subtle An instance of SubtleCrypto used for verification
   * @returns A newly constructed instance
   */
  public static async createAndVerify(
    resp: CreateKeyImportKeyResponse,
    subtle: SubtleCrypto,
  ): Promise<WrappedImportKey> {
    const ret = new WrappedImportKey(resp);
    const hash = await ret.#verifyImportKey(subtle);
    ret.verifiedHash.set(hash);
    return ret;
  }

  /**
   * Verify this wrapped import key.
   *
   * @param subtle An instance of SubtleCrypto used for verification
   * @returns The hash of the successfully verified wrapped import key
   */
  async #verifyImportKey(subtle: SubtleCrypto): Promise<Uint8Array> {
    // check expiration date
    if (nowEpochMillis() > this.expEpochSeconds * 1000n) {
      throw new Error("Import key is expired");
    }

    // make sure that there is an attestation
    if (!this.#enclaveSignature || !this.#enclaveAttestation) {
      throw new Error("No attestation found");
    }
    const signing_key = await verifyAttestationKey(this.#enclaveAttestation);

    // we use subtlecrypto's impl of RSA-PSS verification
    const rsaPssKeyParams = {
      name: "RSA-PSS",
      hash: "SHA-256",
    };
    const pubkey = await subtle.importKey("spki", signing_key, rsaPssKeyParams, true, ["verify"]);
    const pubkeyAlg = pubkey.algorithm as unknown as { modulusLength: number };

    // compute the signing hash and verify the signature
    const message = this.#signedData();
    const mlen = Number(BigInt(pubkeyAlg.modulusLength) / 8n);
    const rsaPssParams = {
      name: "RSA-PSS",
      saltLength: mlen - 2 - 32,
    };

    if (await subtle.verify(rsaPssParams, pubkey, this.#enclaveSignature, message)) {
      return new Uint8Array(await subtle.digest("SHA-256", message));
    }
    throw new Error("Import key signature verification failed");
  }

  /**
   * Returns `true` if this WrappedImportKey needs to be refreshed.
   *
   * @returns True just if this key needs to be refreshed.
   */
  public needsRefresh(): boolean {
    // force refresh if we're within WIK_REFRESH_EARLY_MILLIS of the expiration
    return nowEpochMillis() + WIK_REFRESH_EARLY_MILLIS > this.expEpochSeconds * 1000n;
  }

  /**
   * Computes the signing hash for a wrapped import key
   *
   * @returns The signing hash
   */
  #signedData(): Uint8Array {
    const parts: Uint8Array[] = [
      // domain separation tag
      toBigEndian(BigInt(IMPORT_KEY_SIGNING_DST.length), 2),
      IMPORT_KEY_SIGNING_DST,

      // public key
      toBigEndian(BigInt(this.publicKey.length), 2),
      this.publicKey,

      // sk_enc
      toBigEndian(BigInt(this.skEnc.length), 2),
      this.skEnc,

      // dk_enc
      toBigEndian(BigInt(this.dkEnc.length), 2),
      this.dkEnc,

      // 8-byte big-endian expiration time in seconds since UNIX epoch
      toBigEndian(this.expEpochSeconds, 8),
    ];

    return concatArrays(parts);
  }
}

/**
 * The return value from KeyImporter.#getWrappedImportAndPubKey()
 */
type WrappedImportAndPubKey = {
  wik: WrappedImportKey;
  ipk: CryptoKey;
};

/**
 * An import encryption key and the corresponding attestation document
 */
export class KeyImporter {
  #wrappedImportKey: null | WrappedImportKey = null;
  #subtleCrypto: null | SubtleCrypto = null;
  #publicKeyHandle: null | CryptoKey = null;
  readonly #hpkeSuite: CipherSuite;
  readonly #cs: Org;

  /**
   * Construct from a CubeSigner `Org` instance
   *
   * @param cs A CubeSigner `Org` instance
   */
  constructor(cs: Org) {
    this.#cs = cs;
    this.#hpkeSuite = new CipherSuite({
      kem: new DhkemP384HkdfSha384(),
      kdf: new HkdfSha384(),
      aead: new Aes256Gcm(),
    });
  }

  /**
   * Check that the wrapped import key is unexpired and verified. Otherwise,
   * request a new one, verify it, and update the verified signing hash.
   *
   * @returns The verified signing hash.
   */
  async #getWrappedImportAndPubKey(): Promise<WrappedImportAndPubKey> {
    if (!this.#wrappedImportKey) {
      // first time we load a WrappedImportKey, make sure the x509 crypto
      // provider is set correctly.
      x509CryptoProvider.set(await loadCrypto());
    }
    if (!this.#wrappedImportKey || this.#wrappedImportKey.needsRefresh()) {
      const kikResp = await this.#cs.createKeyImportKey();
      const subtle = await this.#getSubtleCrypto();
      const wik = await WrappedImportKey.createAndVerify(kikResp, subtle);

      // import the public key from the WrappedImportKey
      const p384Params = {
        name: "ECDH",
        namedCurve: "P-384",
      };
      this.#publicKeyHandle = await subtle.importKey("raw", wik.publicKey, p384Params, true, []);
      this.#wrappedImportKey = wik;
    }
    return {
      wik: this.#wrappedImportKey,
      ipk: this.#publicKeyHandle!,
    };
  }

  /**
   * Get or create an instance of SubtleCrypto.
   *
   * @returns The instance of SubtleCrypto.
   */
  async #getSubtleCrypto(): Promise<SubtleCrypto> {
    if (!this.#subtleCrypto) {
      this.#subtleCrypto = await loadSubtleCrypto();
    }
    return this.#subtleCrypto;
  }

  /**
   * Encrypts a set of mnemonics and imports them.
   *
   * @param keyType The type of key to import
   * @param mnes The mnemonics to import, with optional derivation paths and passwords
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  public async importMnemonics(
    keyType: KeyType,
    mnes: MnemonicToImport[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    return await this.#importPackages(
      keyType,
      mnes.map((mne) => newMnemonicKeyPackage(mne)),
      props,
    );
  }

  /**
   * Encrypts a set of raw keys and imports them.
   *
   * @param keyType The type of key to import
   * @param secrets The secret keys to import.
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  public async importRawSecretKeys(
    keyType: KeyType,
    secrets: Uint8Array[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    return await this.#importPackages(
      keyType,
      secrets.map((sec) => newRawKeyPackage(sec)),
      props,
    );
  }

  /**
   * Encrypts a set of prepared key packages, and imports them.
   *
   * @param keyType The type of key to import
   * @param packages The key packages to import.
   * @param props Additional options for import
   * @returns `Key` objects for each imported key.
   */
  async #importPackages(
    keyType: KeyType,
    packages: Uint8Array[],
    props?: ImportDeriveKeyProperties,
  ): Promise<Key[]> {
    const nChunks = Number(
      (BigInt(packages.length) + MAX_IMPORTS_PER_API_CALL - 1n) / MAX_IMPORTS_PER_API_CALL,
    );
    const keys = [];

    for (let i = 0; i < nChunks; ++i) {
      // first, make sure that the wrapped import key is valid, i.e., that
      // we have retrieved it and that it hasn't expired. We do this here
      // for a couple reasons:
      //
      // - all encryptions in a give request must use the same import key, and
      //
      // - when importing a huge number of keys the import pubkey might expire
      //   during the import, so we check for expiration before each request
      const { wik, ipk } = await this.#getWrappedImportAndPubKey();

      // next, encrypt this chunk of mnemonics
      const start = Number(MAX_IMPORTS_PER_API_CALL) * i;
      const end = Number(MAX_IMPORTS_PER_API_CALL) + start;
      const pkgsSlice = packages.slice(start, end);
      const key_material = [];
      for (const keyPkg of pkgsSlice) {
        const material = await this.#encrypt(keyPkg, wik.verifiedHash, ipk);
        key_material.push(material);
      }

      // construct the request
      const policy = (props?.policy ?? null) as Record<string, never>[] | null;
      const req: ImportKeyRequest = {
        public_key: wik.publicKeyBase64,
        sk_enc: wik.skEncBase64,
        dk_enc: wik.dkEncBase64,
        expires: Number(wik.expEpochSeconds),
        key_type: keyType,
        key_material,
        ...props,
        policy,
      };

      // send it and append the result to the return value
      const resp = await this.#cs.importKeys(req);
      keys.push(...resp);
    }

    return keys;
  }

  /**
   * Encrypt to this wrapped import key. Stores the result in `this.encrypted_keys`
   *
   * @param data The data to encrypt
   * @param verifiedHash The verified signing hash of the wrapped import key to which to encrypt
   * @param pubkey The public key to encrypt to
   * @returns The encrypted key material
   */
  async #encrypt(
    data: Uint8Array,
    verifiedHash: Uint8Array,
    pubkey: CryptoKey,
  ): Promise<ImportKeyRequestMaterial> {
    // set up the HPKE sender
    const sender = await this.#hpkeSuite.createSenderContext({
      recipientPublicKey: pubkey,
      info: verifiedHash,
    });

    // encrypt and construct the return value
    const senderCtext = await sender.seal(data);
    return {
      salt: "",
      client_public_key: Buffer.from(sender.enc).toString("base64"),
      ikm_enc: Buffer.from(senderCtext).toString("base64"),
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
 * @param attBytes An attestation from an AWS nitro enclave
 * @returns The signing key that was attested, or null if verification failed
 */
async function verifyAttestationKey(attBytes: Uint8Array): Promise<Uint8Array> {
  // cbor-x is being imported as ESM, so we must asynchronously import it here.
  // Because we only use that and auth0/cose here, we import both this way.
  const { Sign1 } = await import("@auth0/cose");
  const { decode: cborDecode } = await import("cbor-x");

  const att = Sign1.decode(attBytes);
  const attDoc = cborDecode(att.payload) as AttestationDoc;

  // if there's no public key in this attestation, reject
  if (!attDoc.public_key) {
    throw new Error("Attestation did not include a signing public key");
  }

  // if PCR8 does not match the CubeSigner public key, reject
  const pcr8Data = attDoc.pcrs["8"];
  if (!pcr8Data || CUBIST_EIF_SIGNING_PK !== Buffer.from(pcr8Data).toString("hex")) {
    throw new Error("Attestation was not from an authorized enclave");
  }

  // check expiration date of attestation
  const latest = nowEpochMillis() + MAX_ATTESTATION_FUTURE_MINUTES * 60n * 1000n;
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
