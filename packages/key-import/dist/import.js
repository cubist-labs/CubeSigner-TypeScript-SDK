"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _WrappedImportKey_instances, _WrappedImportKey_enclaveAttestation, _WrappedImportKey_enclaveSignature, _WrappedImportKey_verifyImportKey, _WrappedImportKey_signedData, _KeyImporter_instances, _KeyImporter_wrappedImportKey, _KeyImporter_subtleCrypto, _KeyImporter_publicKeyHandle, _KeyImporter_hpkeSuite, _KeyImporter_cs, _KeyImporter_getWrappedImportAndPubKey, _KeyImporter_getSubtleCrypto, _KeyImporter_importPackages, _KeyImporter_encrypt;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyImporter = void 0;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const core_1 = require("@hpke/core");
const asn1_ecc_1 = require("@peculiar/asn1-ecc");
const asn1_schema_1 = require("@peculiar/asn1-schema");
const x509_1 = require("@peculiar/x509");
const mnemonic_1 = require("./mnemonic");
const raw_1 = require("./raw");
const util_1 = require("./util");
// domain-separation tag used when generating signing hash for import key
const IMPORT_KEY_SIGNING_DST = new TextEncoder().encode("CUBESIGNER_EPHEMERAL_IMPORT_P384");
// attestation document slack times
const MAX_ATTESTATION_AGE_MINUTES = 15n;
const MAX_ATTESTATION_FUTURE_MINUTES = 5n;
const WIK_REFRESH_EARLY_MILLIS = 60000n;
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
const AWS_CA_CERT = "MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTELMAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYDVQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQLDANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEGBSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZEh8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkFR+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPWrfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6NIwLz3/Y=";
// Cubist enclave-signing key. All valid attestations will have this
// public key in PCR8.
const CUBIST_EIF_SIGNING_PK = "2e6d0430c8b0b78316236d03cda2996449e24096b3f5b524031f12eeb5fc19a19db522a846e6240a5f36f26591890ac4";
/**
 * The result of deserializing a CreateKeyImportKeyResponse
 */
class WrappedImportKey {
    /**
     * Constructor. This is only called from `WrappedImportKey.createAndVerify()`.
     *
     * @param resp The response from CubeSigner
     */
    constructor(resp) {
        _WrappedImportKey_instances.add(this);
        _WrappedImportKey_enclaveAttestation.set(this, void 0);
        _WrappedImportKey_enclaveSignature.set(this, void 0);
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
        __classPrivateFieldSet(this, _WrappedImportKey_enclaveAttestation, new Uint8Array(Buffer.from(resp.enclave_attestation, "base64")), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_enclaveSignature, new Uint8Array(Buffer.from(resp.enclave_signature, "base64")), "f");
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
    static async createAndVerify(resp, subtle) {
        const ret = new WrappedImportKey(resp);
        const hash = await __classPrivateFieldGet(ret, _WrappedImportKey_instances, "m", _WrappedImportKey_verifyImportKey).call(ret, subtle);
        ret.verifiedHash.set(hash);
        return ret;
    }
    /**
     * Returns `true` if this WrappedImportKey needs to be refreshed.
     *
     * @returns True just if this key needs to be refreshed.
     */
    needsRefresh() {
        // force refresh if we're within WIK_REFRESH_EARLY_MILLIS of the expiration
        return (0, util_1.nowEpochMillis)() + WIK_REFRESH_EARLY_MILLIS > this.expEpochSeconds * 1000n;
    }
}
_WrappedImportKey_enclaveAttestation = new WeakMap(), _WrappedImportKey_enclaveSignature = new WeakMap(), _WrappedImportKey_instances = new WeakSet(), _WrappedImportKey_verifyImportKey = 
/**
 * Verify this wrapped import key.
 *
 * @param subtle An instance of SubtleCrypto used for verification
 * @returns The hash of the successfully verified wrapped import key
 */
async function _WrappedImportKey_verifyImportKey(subtle) {
    // check expiration date
    if ((0, util_1.nowEpochMillis)() > this.expEpochSeconds * 1000n) {
        throw new Error("Import key is expired");
    }
    // make sure that there is an attestation
    if (!__classPrivateFieldGet(this, _WrappedImportKey_enclaveSignature, "f") || !__classPrivateFieldGet(this, _WrappedImportKey_enclaveAttestation, "f")) {
        throw new Error("No attestation found");
    }
    const signing_key = await verifyAttestationKey(__classPrivateFieldGet(this, _WrappedImportKey_enclaveAttestation, "f"));
    // we use subtlecrypto's impl of RSA-PSS verification
    const rsaPssKeyParams = {
        name: "RSA-PSS",
        hash: "SHA-256",
    };
    const pubkey = await subtle.importKey("spki", signing_key, rsaPssKeyParams, true, ["verify"]);
    const pubkeyAlg = pubkey.algorithm;
    // compute the signing hash and verify the signature
    const message = __classPrivateFieldGet(this, _WrappedImportKey_instances, "m", _WrappedImportKey_signedData).call(this);
    const mlen = Number(BigInt(pubkeyAlg.modulusLength) / 8n);
    const rsaPssParams = {
        name: "RSA-PSS",
        saltLength: mlen - 2 - 32,
    };
    if (await subtle.verify(rsaPssParams, pubkey, __classPrivateFieldGet(this, _WrappedImportKey_enclaveSignature, "f"), message)) {
        return new Uint8Array(await subtle.digest("SHA-256", message));
    }
    throw new Error("Import key signature verification failed");
}, _WrappedImportKey_signedData = function _WrappedImportKey_signedData() {
    const parts = [
        // domain separation tag
        (0, util_1.toBigEndian)(BigInt(IMPORT_KEY_SIGNING_DST.length), 2),
        IMPORT_KEY_SIGNING_DST,
        // public key
        (0, util_1.toBigEndian)(BigInt(this.publicKey.length), 2),
        this.publicKey,
        // sk_enc
        (0, util_1.toBigEndian)(BigInt(this.skEnc.length), 2),
        this.skEnc,
        // dk_enc
        (0, util_1.toBigEndian)(BigInt(this.dkEnc.length), 2),
        this.dkEnc,
        // 8-byte big-endian expiration time in seconds since UNIX epoch
        (0, util_1.toBigEndian)(this.expEpochSeconds, 8),
    ];
    return (0, util_1.concatArrays)(parts);
};
/**
 * An import encryption key and the corresponding attestation document
 */
class KeyImporter {
    /**
     * Construct from a CubeSigner `Org` instance
     *
     * @param cs A CubeSigner `Org` instance
     */
    constructor(cs) {
        _KeyImporter_instances.add(this);
        _KeyImporter_wrappedImportKey.set(this, null);
        _KeyImporter_subtleCrypto.set(this, null);
        _KeyImporter_publicKeyHandle.set(this, null);
        _KeyImporter_hpkeSuite.set(this, void 0);
        _KeyImporter_cs.set(this, void 0);
        __classPrivateFieldSet(this, _KeyImporter_cs, cs, "f");
        __classPrivateFieldSet(this, _KeyImporter_hpkeSuite, new core_1.CipherSuite({
            kem: new core_1.DhkemP384HkdfSha384(),
            kdf: new core_1.HkdfSha384(),
            aead: new core_1.Aes256Gcm(),
        }), "f");
    }
    /**
     * Encrypts a set of mnemonics and imports them.
     *
     * @param keyType The type of key to import
     * @param mnes The mnemonics to import, with optional derivation paths and passwords
     * @param props Additional options for import
     * @returns `Key` objects for each imported key.
     */
    async importMnemonics(keyType, mnes, props) {
        return await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_importPackages).call(this, keyType, mnes.map((mne) => (0, mnemonic_1.newMnemonicKeyPackage)(mne)), props);
    }
    /**
     * Encrypts a set of raw keys and imports them.
     *
     * @param keyType The type of key to import
     * @param secrets The secret keys to import.
     * @param props Additional options for import
     * @returns `Key` objects for each imported key.
     */
    async importRawSecretKeys(keyType, secrets, props) {
        return await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_importPackages).call(this, keyType, secrets.map((sec) => (0, raw_1.newRawKeyPackage)(sec)), props);
    }
}
exports.KeyImporter = KeyImporter;
_KeyImporter_wrappedImportKey = new WeakMap(), _KeyImporter_subtleCrypto = new WeakMap(), _KeyImporter_publicKeyHandle = new WeakMap(), _KeyImporter_hpkeSuite = new WeakMap(), _KeyImporter_cs = new WeakMap(), _KeyImporter_instances = new WeakSet(), _KeyImporter_getWrappedImportAndPubKey = 
/**
 * Check that the wrapped import key is unexpired and verified. Otherwise,
 * request a new one, verify it, and update the verified signing hash.
 *
 * @returns The verified signing hash.
 */
async function _KeyImporter_getWrappedImportAndPubKey() {
    if (!__classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f")) {
        // first time we load a WrappedImportKey, make sure the x509 crypto
        // provider is set correctly.
        x509_1.cryptoProvider.set(await (0, cubesigner_sdk_1.loadCrypto)());
    }
    if (!__classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f") || __classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f").needsRefresh()) {
        const kikResp = await __classPrivateFieldGet(this, _KeyImporter_cs, "f").createKeyImportKey();
        const subtle = await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_getSubtleCrypto).call(this);
        const wik = await WrappedImportKey.createAndVerify(kikResp, subtle);
        // import the public key from the WrappedImportKey
        const p384Params = {
            name: "ECDH",
            namedCurve: "P-384",
        };
        __classPrivateFieldSet(this, _KeyImporter_publicKeyHandle, await subtle.importKey("raw", wik.publicKey, p384Params, true, []), "f");
        __classPrivateFieldSet(this, _KeyImporter_wrappedImportKey, wik, "f");
    }
    return {
        wik: __classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f"),
        ipk: __classPrivateFieldGet(this, _KeyImporter_publicKeyHandle, "f"),
    };
}, _KeyImporter_getSubtleCrypto = 
/**
 * Get or create an instance of SubtleCrypto.
 *
 * @returns The instance of SubtleCrypto.
 */
async function _KeyImporter_getSubtleCrypto() {
    if (!__classPrivateFieldGet(this, _KeyImporter_subtleCrypto, "f")) {
        __classPrivateFieldSet(this, _KeyImporter_subtleCrypto, await (0, cubesigner_sdk_1.loadSubtleCrypto)(), "f");
    }
    return __classPrivateFieldGet(this, _KeyImporter_subtleCrypto, "f");
}, _KeyImporter_importPackages = 
/**
 * Encrypts a set of prepared key packages, and imports them.
 *
 * @param keyType The type of key to import
 * @param packages The key packages to import.
 * @param props Additional options for import
 * @returns `Key` objects for each imported key.
 */
async function _KeyImporter_importPackages(keyType, packages, props) {
    const nChunks = Number((BigInt(packages.length) + MAX_IMPORTS_PER_API_CALL - 1n) / MAX_IMPORTS_PER_API_CALL);
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
        const { wik, ipk } = await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_getWrappedImportAndPubKey).call(this);
        // next, encrypt this chunk of mnemonics
        const start = Number(MAX_IMPORTS_PER_API_CALL) * i;
        const end = Number(MAX_IMPORTS_PER_API_CALL) + start;
        const pkgsSlice = packages.slice(start, end);
        const key_material = [];
        for (const keyPkg of pkgsSlice) {
            const material = await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_encrypt).call(this, keyPkg, wik.verifiedHash, ipk);
            key_material.push(material);
        }
        // construct the request
        const policy = (props?.policy ?? null);
        const req = {
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
        const resp = await __classPrivateFieldGet(this, _KeyImporter_cs, "f").importKeys(req);
        keys.push(...resp);
    }
    return keys;
}, _KeyImporter_encrypt = 
/**
 * Encrypt to this wrapped import key. Stores the result in `this.encrypted_keys`
 *
 * @param data The data to encrypt
 * @param verifiedHash The verified signing hash of the wrapped import key to which to encrypt
 * @param pubkey The public key to encrypt to
 * @returns The encrypted key material
 */
async function _KeyImporter_encrypt(data, verifiedHash, pubkey) {
    // set up the HPKE sender
    const sender = await __classPrivateFieldGet(this, _KeyImporter_hpkeSuite, "f").createSenderContext({
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
};
/**
 * Verifies the attestation key against the AWS Nitro Enclaves signing
 * key and returns the attested signing key.
 *
 * @param attBytes An attestation from an AWS nitro enclave
 * @returns The signing key that was attested, or null if verification failed
 */
async function verifyAttestationKey(attBytes) {
    // cbor-x is being imported as ESM, so we must asynchronously import it here.
    // Because we only use that and auth0/cose here, we import both this way.
    const { Sign1 } = await import("@auth0/cose");
    const { decode: cborDecode } = await import("cbor-x");
    const att = Sign1.decode(attBytes);
    const attDoc = cborDecode(att.payload);
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
    const latest = (0, util_1.nowEpochMillis)() + MAX_ATTESTATION_FUTURE_MINUTES * 60n * 1000n;
    const earliest = latest - (MAX_ATTESTATION_FUTURE_MINUTES + MAX_ATTESTATION_AGE_MINUTES) * 60n * 1000n;
    if (attDoc.timestamp < earliest || attDoc.timestamp > latest) {
        throw new Error("Attestation is expired");
    }
    // Verify certificate chain starting with AWS Nitro CA cert
    let parent = new x509_1.X509Certificate(AWS_CA_CERT);
    for (let i = 0; i < attDoc.cabundle.length; ++i) {
        const cert = new x509_1.X509Certificate(attDoc.cabundle[i]);
        if (!(await cert.verify(parent))) {
            throw new Error(`Attestation certificate chain failed at index ${i}`);
        }
        parent = cert;
    }
    const cert = new x509_1.X509Certificate(attDoc.certificate);
    if (!(await cert.verify(parent))) {
        throw new Error("Attestation certificate chain failed at leaf");
    }
    const pubkey = cert.publicKey;
    // make sure that we got the expected public key type
    const alg = new x509_1.AlgorithmProvider().toAsnAlgorithm(pubkey.algorithm);
    if (alg.algorithm != EC_PUBLIC_KEY) {
        // not the expected algorithm, i.e., elliptic curve signing
        throw new Error("Attestation contained unexpected signature algorithm");
    }
    const params = asn1_schema_1.AsnParser.parse(alg.parameters, asn1_ecc_1.ECParameters);
    if (!params.namedCurve || params.namedCurve !== NIST_P384) {
        // not the expected params, i.e., NIST P384
        throw new Error("Attestation contained unexpected signature algorithm");
    }
    // verify the cose signature with the key, which we verified against
    // the AWS Nitro CA certificate above
    await att.verify(await pubkey.export());
    return attDoc.public_key;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ltcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFTQSwrREFBMEU7QUFDMUUscUNBQXFGO0FBQ3JGLGlEQUFrRDtBQUNsRCx1REFBa0Q7QUFDbEQseUNBSXdCO0FBR3hCLHlDQUFtRDtBQUNuRCwrQkFBeUM7QUFDekMsaUNBQW1FO0FBRW5FLHlFQUF5RTtBQUN6RSxNQUFNLHNCQUFzQixHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7QUFFNUYsbUNBQW1DO0FBQ25DLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDO0FBQ3hDLE1BQU0sOEJBQThCLEdBQUcsRUFBRSxDQUFDO0FBQzFDLE1BQU0sd0JBQXdCLEdBQUcsTUFBTyxDQUFDO0FBRXpDLHFDQUFxQztBQUNyQyxNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUM7QUFFakMsd0RBQXdEO0FBQ3hELE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0FBRXJDLHlDQUF5QztBQUN6Qyx5RUFBeUU7QUFDekUsRUFBRTtBQUNGLCtEQUErRDtBQUMvRCxvRUFBb0U7QUFDcEUsTUFBTSxXQUFXLEdBQ2YsMHNCQUEwc0IsQ0FBQztBQUU3c0Isb0VBQW9FO0FBQ3BFLHNCQUFzQjtBQUN0QixNQUFNLHFCQUFxQixHQUN6QixrR0FBa0csQ0FBQztBQUVyRzs7R0FFRztBQUNILE1BQU0sZ0JBQWdCO0lBZ0JwQjs7OztPQUlHO0lBQ0gsWUFBb0IsSUFBZ0M7O1FBUjNDLHVEQUFnQztRQUNoQyxxREFBOEI7UUFRckMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztR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QztJQUNsRSxDQUFDO0lBQ0QsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUU5QixxREFBcUQ7SUFDckQsTUFBTSxHQUFHLEdBQUcsSUFBSSx3QkFBaUIsRUFBRSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDckUsSUFBSSxHQUFHLENBQUMsU0FBUyxJQUFJLGFBQWEsRUFBRSxDQUFDO1FBQ25DLDJEQUEyRDtRQUMzRCxNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUNELE1BQU0sTUFBTSxHQUFHLHVCQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFXLEVBQUUsdUJBQVksQ0FBQyxDQUFDO0lBQzlELElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxJQUFJLE1BQU0sQ0FBQyxVQUFVLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDMUQsMkNBQTJDO1FBQzNDLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsb0VBQW9FO0lBQ3BFLHFDQUFxQztJQUNyQyxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsTUFBTSxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUV4QyxPQUFPLE1BQU0sQ0FBQyxVQUFVLENBQUM7QUFDM0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ3JlYXRlS2V5SW1wb3J0S2V5UmVzcG9uc2UsXG4gIEltcG9ydEtleVJlcXVlc3QsXG4gIEltcG9ydEtleVJlcXVlc3RNYXRlcmlhbCxcbiAgS2V5LFxuICBLZXlUeXBlLFxuICBPcmcsXG4gIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG59IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgbG9hZENyeXB0bywgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgQ2lwaGVyU3VpdGUsIEFlczI1NkdjbSwgSGtkZlNoYTM4NCwgRGhrZW1QMzg0SGtkZlNoYTM4NCB9IGZyb20gXCJAaHBrZS9jb3JlXCI7XG5pbXBvcnQgeyBFQ1BhcmFtZXRlcnMgfSBmcm9tIFwiQHBlY3VsaWFyL2FzbjEtZWNjXCI7XG5pbXBvcnQgeyBBc25QYXJzZXIgfSBmcm9tIFwiQHBlY3VsaWFyL2FzbjEtc2NoZW1hXCI7XG5pbXBvcnQge1xuICBBbGdvcml0aG1Qcm92aWRlcixcbiAgWDUwOUNlcnRpZmljYXRlLFxuICBjcnlwdG9Qcm92aWRlciBhcyB4NTA5Q3J5cHRvUHJvdmlkZXIsXG59IGZyb20gXCJAcGVjdWxpYXIveDUwOVwiO1xuXG5pbXBvcnQgdHlwZSB7IE1uZW1vbmljVG9JbXBvcnQgfSBmcm9tIFwiLi9tbmVtb25pY1wiO1xuaW1wb3J0IHsgbmV3TW5lbW9uaWNLZXlQYWNrYWdlIH0gZnJvbSBcIi4vbW5lbW9uaWNcIjtcbmltcG9ydCB7IG5ld1Jhd0tleVBhY2thZ2UgfSBmcm9tIFwiLi9yYXdcIjtcbmltcG9ydCB7IHRvQmlnRW5kaWFuLCBjb25jYXRBcnJheXMsIG5vd0Vwb2NoTWlsbGlzIH0gZnJvbSBcIi4vdXRpbFwiO1xuXG4vLyBkb21haW4tc2VwYXJhdGlvbiB0YWcgdXNlZCB3aGVuIGdlbmVyYXRpbmcgc2lnbmluZyBoYXNoIGZvciBpbXBvcnQga2V5XG5jb25zdCBJTVBPUlRfS0VZX1NJR05JTkdfRFNUID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiQ1VCRVNJR05FUl9FUEhFTUVSQUxfSU1QT1JUX1AzODRcIik7XG5cbi8vIGF0dGVzdGF0aW9uIGRvY3VtZW50IHNsYWNrIHRpbWVzXG5jb25zdCBNQVhfQVRURVNUQVRJT05fQUdFX01JTlVURVMgPSAxNW47XG5jb25zdCBNQVhfQVRURVNUQVRJT05fRlVUVVJFX01JTlVURVMgPSA1bjtcbmNvbnN0IFdJS19SRUZSRVNIX0VBUkxZX01JTExJUyA9IDYwXzAwMG47XG5cbi8vIE9JRHMgZm9yIGVsbGlwdGljIGN1cnZlIFg1MDkgY2VydHNcbmNvbnN0IEVDX1BVQkxJQ19LRVkgPSBcIjEuMi44NDAuMTAwNDUuMi4xXCI7XG5jb25zdCBOSVNUX1AzODQgPSBcIjEuMy4xMzIuMC4zNFwiO1xuXG4vLyBNYXhpbXVtIG51bWJlciBvZiBrZXlzIHRvIGltcG9ydCBpbiBhIHNpbmdsZSBBUEkgY2FsbFxuY29uc3QgTUFYX0lNUE9SVFNfUEVSX0FQSV9DQUxMID0gMzJuO1xuXG4vLyBBV1MgTml0cm8gRW5jbGF2ZXMgcm9vdCBDQSBjZXJ0aWZpY2F0ZVxuLy8gaHR0cHM6Ly9hd3Mtbml0cm8tZW5jbGF2ZXMuYW1hem9uYXdzLmNvbS9BV1NfTml0cm9FbmNsYXZlc19Sb290LUcxLnppcFxuLy9cbi8vIFNlZSB0aGUgZG9jdW1lbnRhdGlvbiBhYm91dCBBV1MgTml0cm8gRW5jbGF2ZXMgdmVyaWZpY2F0aW9uOlxuLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2VuY2xhdmVzL2xhdGVzdC91c2VyL3ZlcmlmeS1yb290Lmh0bWxcbmNvbnN0IEFXU19DQV9DRVJUID1cbiAgXCJNSUlDRVRDQ0FaYWdBd0lCQWdJUkFQa3hkV2dia0svaEhVYk10T1RuK0ZZd0NnWUlLb1pJemowRUF3TXdTVEVMTUFrR0ExVUVCaE1DVlZNeER6QU5CZ05WQkFvTUJrRnRZWHB2YmpFTU1Bb0dBMVVFQ3d3RFFWZFRNUnN3R1FZRFZRUUREQkpoZDNNdWJtbDBjbTh0Wlc1amJHRjJaWE13SGhjTk1Ua3hNREk0TVRNeU9EQTFXaGNOTkRreE1ESTRNVFF5T0RBMVdqQkpNUXN3Q1FZRFZRUUdFd0pWVXpFUE1BMEdBMVVFQ2d3R1FXMWhlbTl1TVF3d0NnWURWUVFMREFOQlYxTXhHekFaQmdOVkJBTU1FbUYzY3k1dWFYUnlieTFsYm1Oc1lYWmxjekIyTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFpQTJJQUJQd0NWT3VtQ01IemFIRGltdHFRdmtZNE1wSnpib2xMLy9aeTJZbEVTMUJSNVRTa3NmYmI0OEM4V0JveXQ3RjJCdzdlRXRhYVArb2hHMmJuVXM5OTBkMEpYMjhUY1BRWENFUFozQkFCSWVUUFl3RW9DV1pFaDhsNVlvUXdUY1UvOUtOQ01FQXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVrQ1cxRGRrRlIrZVd3NWI2Y3AzUG1hbmZTNVl3RGdZRFZSMFBBUUgvQkFRREFnR0dNQW9HQ0NxR1NNNDlCQU1EQTJrQU1HWUNNUUNqZnkrUm9jbTlYdWU0WW53V21OSlZBNDRmQTBQNVcyT3BZb3c5T1lDVlJhRWV2TDh1TzFYWXJ1NXh0TVBXcmZNQ01RQ2k4NXNXQmJKd0tLWGRTNkJwdFFGdVpiVDczby9nQmgxcVV4bC9uTnIxMlVPOFlmd3I2d1BMYis2Tkl3THozL1k9XCI7XG5cbi8vIEN1YmlzdCBlbmNsYXZlLXNpZ25pbmcga2V5LiBBbGwgdmFsaWQgYXR0ZXN0YXRpb25zIHdpbGwgaGF2ZSB0aGlzXG4vLyBwdWJsaWMga2V5IGluIFBDUjguXG5jb25zdCBDVUJJU1RfRUlGX1NJR05JTkdfUEsgPVxuICBcIjJlNmQwNDMwYzhiMGI3ODMxNjIzNmQwM2NkYTI5OTY0NDllMjQwOTZiM2Y1YjUyNDAzMWYxMmVlYjVmYzE5YTE5ZGI1MjJhODQ2ZTYyNDBhNWYzNmYyNjU5MTg5MGFjNFwiO1xuXG4vKipcbiAqIFRoZSByZXN1bHQgb2YgZGVzZXJpYWxpemluZyBhIENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlXG4gKi9cbmNsYXNzIFdyYXBwZWRJbXBvcnRLZXkge1xuICByZWFkb25seSB2ZXJpZmllZEhhc2g6IFVpbnQ4QXJyYXk7XG5cbiAgcmVhZG9ubHkgcHVibGljS2V5OiBVaW50OEFycmF5O1xuICByZWFkb25seSBwdWJsaWNLZXlCYXNlNjQ6IHN0cmluZztcblxuICByZWFkb25seSBza0VuYzogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgc2tFbmNCYXNlNjQ6IHN0cmluZztcblxuICByZWFkb25seSBka0VuYzogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgZGtFbmNCYXNlNjQ6IHN0cmluZztcblxuICByZWFkb25seSBleHBFcG9jaFNlY29uZHM6IGJpZ2ludDtcbiAgcmVhZG9ubHkgI2VuY2xhdmVBdHRlc3RhdGlvbjogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgI2VuY2xhdmVTaWduYXR1cmU6IFVpbnQ4QXJyYXk7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLiBUaGlzIGlzIG9ubHkgY2FsbGVkIGZyb20gYFdyYXBwZWRJbXBvcnRLZXkuY3JlYXRlQW5kVmVyaWZ5KClgLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzcCBUaGUgcmVzcG9uc2UgZnJvbSBDdWJlU2lnbmVyXG4gICAqL1xuICBwcml2YXRlIGNvbnN0cnVjdG9yKHJlc3A6IENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlKSB7XG4gICAgaWYgKCFyZXNwLmVuY2xhdmVfYXR0ZXN0YXRpb24gfHwgIXJlc3AuZW5jbGF2ZV9zaWduYXR1cmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGF0dGVzdGF0aW9uIGZvdW5kIGluIENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlXCIpO1xuICAgIH1cblxuICAgIC8vIHBhcnNlIHRoZSByZXNwb25zZVxuICAgIHRoaXMucHVibGljS2V5ID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmZyb20ocmVzcC5wdWJsaWNfa2V5LCBcImJhc2U2NFwiKSk7XG4gICAgdGhpcy5wdWJsaWNLZXlCYXNlNjQgPSByZXNwLnB1YmxpY19rZXk7XG5cbiAgICB0aGlzLnNrRW5jID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmZyb20ocmVzcC5za19lbmMsIFwiYmFzZTY0XCIpKTtcbiAgICB0aGlzLnNrRW5jQmFzZTY0ID0gcmVzcC5za19lbmM7XG5cbiAgICB0aGlzLmRrRW5jID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmZyb20ocmVzcC5ka19lbmMsIFwiYmFzZTY0XCIpKTtcbiAgICB0aGlzLmRrRW5jQmFzZTY0ID0gcmVzcC5ka19lbmM7XG5cbiAgICB0aGlzLiNlbmNsYXZlQXR0ZXN0YXRpb24gPSBuZXcgVWludDhBcnJheShCdWZmZXIuZnJvbShyZXNwLmVuY2xhdmVfYXR0ZXN0YXRpb24sIFwiYmFzZTY0XCIpKTtcbiAgICB0aGlzLiNlbmNsYXZlU2lnbmF0dXJlID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmZyb20ocmVzcC5lbmNsYXZlX3NpZ25hdHVyZSwgXCJiYXNlNjRcIikpO1xuICAgIHRoaXMuZXhwRXBvY2hTZWNvbmRzID0gQmlnSW50KHJlc3AuZXhwaXJlcyk7XG5cbiAgICAvLyB0aGlzIGFycmF5IGlzIHVwZGF0ZWQgaW4gY3JlYXRlQW5kVmVyaWZ5IG9uY2UgdmVyaWZpY2F0aW9uIHN1Y2NlZWRzXG4gICAgdGhpcy52ZXJpZmllZEhhc2ggPSBuZXcgVWludDhBcnJheSgzMik7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuZCB2ZXJpZnkgYW4gaW5zdGFuY2Ugb2YgdGhpcyB0eXBlXG4gICAqXG4gICAqIEBwYXJhbSByZXNwIFRoZSByZXNwb25zZSBmcm9tIEN1YmVTaWduZXJcbiAgICogQHBhcmFtIHN1YnRsZSBBbiBpbnN0YW5jZSBvZiBTdWJ0bGVDcnlwdG8gdXNlZCBmb3IgdmVyaWZpY2F0aW9uXG4gICAqIEByZXR1cm5zIEEgbmV3bHkgY29uc3RydWN0ZWQgaW5zdGFuY2VcbiAgICovXG4gIHB1YmxpYyBzdGF0aWMgYXN5bmMgY3JlYXRlQW5kVmVyaWZ5KFxuICAgIHJlc3A6IENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlLFxuICAgIHN1YnRsZTogU3VidGxlQ3J5cHRvLFxuICApOiBQcm9taXNlPFdyYXBwZWRJbXBvcnRLZXk+IHtcbiAgICBjb25zdCByZXQgPSBuZXcgV3JhcHBlZEltcG9ydEtleShyZXNwKTtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgcmV0LiN2ZXJpZnlJbXBvcnRLZXkoc3VidGxlKTtcbiAgICByZXQudmVyaWZpZWRIYXNoLnNldChoYXNoKTtcbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmeSB0aGlzIHdyYXBwZWQgaW1wb3J0IGtleS5cbiAgICpcbiAgICogQHBhcmFtIHN1YnRsZSBBbiBpbnN0YW5jZSBvZiBTdWJ0bGVDcnlwdG8gdXNlZCBmb3IgdmVyaWZpY2F0aW9uXG4gICAqIEByZXR1cm5zIFRoZSBoYXNoIG9mIHRoZSBzdWNjZXNzZnVsbHkgdmVyaWZpZWQgd3JhcHBlZCBpbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyAjdmVyaWZ5SW1wb3J0S2V5KHN1YnRsZTogU3VidGxlQ3J5cHRvKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gICAgLy8gY2hlY2sgZXhwaXJhdGlvbiBkYXRlXG4gICAgaWYgKG5vd0Vwb2NoTWlsbGlzKCkgPiB0aGlzLmV4cEVwb2NoU2Vjb25kcyAqIDEwMDBuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBvcnQga2V5IGlzIGV4cGlyZWRcIik7XG4gICAgfVxuXG4gICAgLy8gbWFrZSBzdXJlIHRoYXQgdGhlcmUgaXMgYW4gYXR0ZXN0YXRpb25cbiAgICBpZiAoIXRoaXMuI2VuY2xhdmVTaWduYXR1cmUgfHwgIXRoaXMuI2VuY2xhdmVBdHRlc3RhdGlvbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gYXR0ZXN0YXRpb24gZm91bmRcIik7XG4gICAgfVxuICAgIGNvbnN0IHNpZ25pbmdfa2V5ID0gYXdhaXQgdmVyaWZ5QXR0ZXN0YXRpb25LZXkodGhpcy4jZW5jbGF2ZUF0dGVzdGF0aW9uKTtcblxuICAgIC8vIHdlIHVzZSBzdWJ0bGVjcnlwdG8ncyBpbXBsIG9mIFJTQS1QU1MgdmVyaWZpY2F0aW9uXG4gICAgY29uc3QgcnNhUHNzS2V5UGFyYW1zID0ge1xuICAgICAgbmFtZTogXCJSU0EtUFNTXCIsXG4gICAgICBoYXNoOiBcIlNIQS0yNTZcIixcbiAgICB9O1xuICAgIGNvbnN0IHB1YmtleSA9IGF3YWl0IHN1YnRsZS5pbXBvcnRLZXkoXCJzcGtpXCIsIHNpZ25pbmdfa2V5LCByc2FQc3NLZXlQYXJhbXMsIHRydWUsIFtcInZlcmlmeVwiXSk7XG4gICAgY29uc3QgcHVia2V5QWxnID0gcHVia2V5LmFsZ29yaXRobSBhcyB1bmtub3duIGFzIHsgbW9kdWx1c0xlbmd0aDogbnVtYmVyIH07XG5cbiAgICAvLyBjb21wdXRlIHRoZSBzaWduaW5nIGhhc2ggYW5kIHZlcmlmeSB0aGUgc2lnbmF0dXJlXG4gICAgY29uc3QgbWVzc2FnZSA9IHRoaXMuI3NpZ25lZERhdGEoKTtcbiAgICBjb25zdCBtbGVuID0gTnVtYmVyKEJpZ0ludChwdWJrZXlBbGcubW9kdWx1c0xlbmd0aCkgLyA4bik7XG4gICAgY29uc3QgcnNhUHNzUGFyYW1zID0ge1xuICAgICAgbmFtZTogXCJSU0EtUFNTXCIsXG4gICAgICBzYWx0TGVuZ3RoOiBtbGVuIC0gMiAtIDMyLFxuICAgIH07XG5cbiAgICBpZiAoYXdhaXQgc3VidGxlLnZlcmlmeShyc2FQc3NQYXJhbXMsIHB1YmtleSwgdGhpcy4jZW5jbGF2ZVNpZ25hdHVyZSwgbWVzc2FnZSkpIHtcbiAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShhd2FpdCBzdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiLCBtZXNzYWdlKSk7XG4gICAgfVxuICAgIHRocm93IG5ldyBFcnJvcihcIkltcG9ydCBrZXkgc2lnbmF0dXJlIHZlcmlmaWNhdGlvbiBmYWlsZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBXcmFwcGVkSW1wb3J0S2V5IG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBqdXN0IGlmIHRoaXMga2V5IG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cbiAgICovXG4gIHB1YmxpYyBuZWVkc1JlZnJlc2goKTogYm9vbGVhbiB7XG4gICAgLy8gZm9yY2UgcmVmcmVzaCBpZiB3ZSdyZSB3aXRoaW4gV0lLX1JFRlJFU0hfRUFSTFlfTUlMTElTIG9mIHRoZSBleHBpcmF0aW9uXG4gICAgcmV0dXJuIG5vd0Vwb2NoTWlsbGlzKCkgKyBXSUtfUkVGUkVTSF9FQVJMWV9NSUxMSVMgPiB0aGlzLmV4cEVwb2NoU2Vjb25kcyAqIDEwMDBuO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIHRoZSBzaWduaW5nIGhhc2ggZm9yIGEgd3JhcHBlZCBpbXBvcnQga2V5XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzaWduaW5nIGhhc2hcbiAgICovXG4gICNzaWduZWREYXRhKCk6IFVpbnQ4QXJyYXkge1xuICAgIGNvbnN0IHBhcnRzOiBVaW50OEFycmF5W10gPSBbXG4gICAgICAvLyBkb21haW4gc2VwYXJhdGlvbiB0YWdcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludChJTVBPUlRfS0VZX1NJR05JTkdfRFNULmxlbmd0aCksIDIpLFxuICAgICAgSU1QT1JUX0tFWV9TSUdOSU5HX0RTVCxcblxuICAgICAgLy8gcHVibGljIGtleVxuICAgICAgdG9CaWdFbmRpYW4oQmlnSW50KHRoaXMucHVibGljS2V5Lmxlbmd0aCksIDIpLFxuICAgICAgdGhpcy5wdWJsaWNLZXksXG5cbiAgICAgIC8vIHNrX2VuY1xuICAgICAgdG9CaWdFbmRpYW4oQmlnSW50KHRoaXMuc2tFbmMubGVuZ3RoKSwgMiksXG4gICAgICB0aGlzLnNrRW5jLFxuXG4gICAgICAvLyBka19lbmNcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludCh0aGlzLmRrRW5jLmxlbmd0aCksIDIpLFxuICAgICAgdGhpcy5ka0VuYyxcblxuICAgICAgLy8gOC1ieXRlIGJpZy1lbmRpYW4gZXhwaXJhdGlvbiB0aW1lIGluIHNlY29uZHMgc2luY2UgVU5JWCBlcG9jaFxuICAgICAgdG9CaWdFbmRpYW4odGhpcy5leHBFcG9jaFNlY29uZHMsIDgpLFxuICAgIF07XG5cbiAgICByZXR1cm4gY29uY2F0QXJyYXlzKHBhcnRzKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSByZXR1cm4gdmFsdWUgZnJvbSBLZXlJbXBvcnRlci4jZ2V0V3JhcHBlZEltcG9ydEFuZFB1YktleSgpXG4gKi9cbnR5cGUgV3JhcHBlZEltcG9ydEFuZFB1YktleSA9IHtcbiAgd2lrOiBXcmFwcGVkSW1wb3J0S2V5O1xuICBpcGs6IENyeXB0b0tleTtcbn07XG5cbi8qKlxuICogQW4gaW1wb3J0IGVuY3J5cHRpb24ga2V5IGFuZCB0aGUgY29ycmVzcG9uZGluZyBhdHRlc3RhdGlvbiBkb2N1bWVudFxuICovXG5leHBvcnQgY2xhc3MgS2V5SW1wb3J0ZXIge1xuICAjd3JhcHBlZEltcG9ydEtleTogbnVsbCB8IFdyYXBwZWRJbXBvcnRLZXkgPSBudWxsO1xuICAjc3VidGxlQ3J5cHRvOiBudWxsIHwgU3VidGxlQ3J5cHRvID0gbnVsbDtcbiAgI3B1YmxpY0tleUhhbmRsZTogbnVsbCB8IENyeXB0b0tleSA9IG51bGw7XG4gIHJlYWRvbmx5ICNocGtlU3VpdGU6IENpcGhlclN1aXRlO1xuICByZWFkb25seSAjY3M6IE9yZztcblxuICAvKipcbiAgICogQ29uc3RydWN0IGZyb20gYSBDdWJlU2lnbmVyIGBPcmdgIGluc3RhbmNlXG4gICAqXG4gICAqIEBwYXJhbSBjcyBBIEN1YmVTaWduZXIgYE9yZ2AgaW5zdGFuY2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKGNzOiBPcmcpIHtcbiAgICB0aGlzLiNjcyA9IGNzO1xuICAgIHRoaXMuI2hwa2VTdWl0ZSA9IG5ldyBDaXBoZXJTdWl0ZSh7XG4gICAgICBrZW06IG5ldyBEaGtlbVAzODRIa2RmU2hhMzg0KCksXG4gICAgICBrZGY6IG5ldyBIa2RmU2hhMzg0KCksXG4gICAgICBhZWFkOiBuZXcgQWVzMjU2R2NtKCksXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdGhhdCB0aGUgd3JhcHBlZCBpbXBvcnQga2V5IGlzIHVuZXhwaXJlZCBhbmQgdmVyaWZpZWQuIE90aGVyd2lzZSxcbiAgICogcmVxdWVzdCBhIG5ldyBvbmUsIHZlcmlmeSBpdCwgYW5kIHVwZGF0ZSB0aGUgdmVyaWZpZWQgc2lnbmluZyBoYXNoLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdmVyaWZpZWQgc2lnbmluZyBoYXNoLlxuICAgKi9cbiAgYXN5bmMgI2dldFdyYXBwZWRJbXBvcnRBbmRQdWJLZXkoKTogUHJvbWlzZTxXcmFwcGVkSW1wb3J0QW5kUHViS2V5PiB7XG4gICAgaWYgKCF0aGlzLiN3cmFwcGVkSW1wb3J0S2V5KSB7XG4gICAgICAvLyBmaXJzdCB0aW1lIHdlIGxvYWQgYSBXcmFwcGVkSW1wb3J0S2V5LCBtYWtlIHN1cmUgdGhlIHg1MDkgY3J5cHRvXG4gICAgICAvLyBwcm92aWRlciBpcyBzZXQgY29ycmVjdGx5LlxuICAgICAgeDUwOUNyeXB0b1Byb3ZpZGVyLnNldChhd2FpdCBsb2FkQ3J5cHRvKCkpO1xuICAgIH1cbiAgICBpZiAoIXRoaXMuI3dyYXBwZWRJbXBvcnRLZXkgfHwgdGhpcy4jd3JhcHBlZEltcG9ydEtleS5uZWVkc1JlZnJlc2goKSkge1xuICAgICAgY29uc3Qga2lrUmVzcCA9IGF3YWl0IHRoaXMuI2NzLmNyZWF0ZUtleUltcG9ydEtleSgpO1xuICAgICAgY29uc3Qgc3VidGxlID0gYXdhaXQgdGhpcy4jZ2V0U3VidGxlQ3J5cHRvKCk7XG4gICAgICBjb25zdCB3aWsgPSBhd2FpdCBXcmFwcGVkSW1wb3J0S2V5LmNyZWF0ZUFuZFZlcmlmeShraWtSZXNwLCBzdWJ0bGUpO1xuXG4gICAgICAvLyBpbXBvcnQgdGhlIHB1YmxpYyBrZXkgZnJvbSB0aGUgV3JhcHBlZEltcG9ydEtleVxuICAgICAgY29uc3QgcDM4NFBhcmFtcyA9IHtcbiAgICAgICAgbmFtZTogXCJFQ0RIXCIsXG4gICAgICAgIG5hbWVkQ3VydmU6IFwiUC0zODRcIixcbiAgICAgIH07XG4gICAgICB0aGlzLiNwdWJsaWNLZXlIYW5kbGUgPSBhd2FpdCBzdWJ0bGUuaW1wb3J0S2V5KFwicmF3XCIsIHdpay5wdWJsaWNLZXksIHAzODRQYXJhbXMsIHRydWUsIFtdKTtcbiAgICAgIHRoaXMuI3dyYXBwZWRJbXBvcnRLZXkgPSB3aWs7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICB3aWs6IHRoaXMuI3dyYXBwZWRJbXBvcnRLZXksXG4gICAgICBpcGs6IHRoaXMuI3B1YmxpY0tleUhhbmRsZSEsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgb3IgY3JlYXRlIGFuIGluc3RhbmNlIG9mIFN1YnRsZUNyeXB0by5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGluc3RhbmNlIG9mIFN1YnRsZUNyeXB0by5cbiAgICovXG4gIGFzeW5jICNnZXRTdWJ0bGVDcnlwdG8oKTogUHJvbWlzZTxTdWJ0bGVDcnlwdG8+IHtcbiAgICBpZiAoIXRoaXMuI3N1YnRsZUNyeXB0bykge1xuICAgICAgdGhpcy4jc3VidGxlQ3J5cHRvID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jc3VidGxlQ3J5cHRvO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIG1uZW1vbmljcyBhbmQgaW1wb3J0cyB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBtbmVzIFRoZSBtbmVtb25pY3MgdG8gaW1wb3J0LCB3aXRoIG9wdGlvbmFsIGRlcml2YXRpb24gcGF0aHMgYW5kIHBhc3N3b3Jkc1xuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBpbXBvcnRcbiAgICogQHJldHVybnMgYEtleWAgb2JqZWN0cyBmb3IgZWFjaCBpbXBvcnRlZCBrZXkuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgaW1wb3J0TW5lbW9uaWNzKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgbW5lczogTW5lbW9uaWNUb0ltcG9ydFtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNpbXBvcnRQYWNrYWdlcyhcbiAgICAgIGtleVR5cGUsXG4gICAgICBtbmVzLm1hcCgobW5lKSA9PiBuZXdNbmVtb25pY0tleVBhY2thZ2UobW5lKSksXG4gICAgICBwcm9wcyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIHJhdyBrZXlzIGFuZCBpbXBvcnRzIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBpbXBvcnRcbiAgICogQHBhcmFtIHNlY3JldHMgVGhlIHNlY3JldCBrZXlzIHRvIGltcG9ydC5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgaW1wb3J0XG4gICAqIEByZXR1cm5zIGBLZXlgIG9iamVjdHMgZm9yIGVhY2ggaW1wb3J0ZWQga2V5LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGltcG9ydFJhd1NlY3JldEtleXMoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBzZWNyZXRzOiBVaW50OEFycmF5W10sXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2ltcG9ydFBhY2thZ2VzKFxuICAgICAga2V5VHlwZSxcbiAgICAgIHNlY3JldHMubWFwKChzZWMpID0+IG5ld1Jhd0tleVBhY2thZ2Uoc2VjKSksXG4gICAgICBwcm9wcyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIHByZXBhcmVkIGtleSBwYWNrYWdlcywgYW5kIGltcG9ydHMgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGltcG9ydFxuICAgKiBAcGFyYW0gcGFja2FnZXMgVGhlIGtleSBwYWNrYWdlcyB0byBpbXBvcnQuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGltcG9ydFxuICAgKiBAcmV0dXJucyBgS2V5YCBvYmplY3RzIGZvciBlYWNoIGltcG9ydGVkIGtleS5cbiAgICovXG4gIGFzeW5jICNpbXBvcnRQYWNrYWdlcyhcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIHBhY2thZ2VzOiBVaW50OEFycmF5W10sXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgbkNodW5rcyA9IE51bWJlcihcbiAgICAgIChCaWdJbnQocGFja2FnZXMubGVuZ3RoKSArIE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCAtIDFuKSAvIE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkNodW5rczsgKytpKSB7XG4gICAgICAvLyBmaXJzdCwgbWFrZSBzdXJlIHRoYXQgdGhlIHdyYXBwZWQgaW1wb3J0IGtleSBpcyB2YWxpZCwgaS5lLiwgdGhhdFxuICAgICAgLy8gd2UgaGF2ZSByZXRyaWV2ZWQgaXQgYW5kIHRoYXQgaXQgaGFzbid0IGV4cGlyZWQuIFdlIGRvIHRoaXMgaGVyZVxuICAgICAgLy8gZm9yIGEgY291cGxlIHJlYXNvbnM6XG4gICAgICAvL1xuICAgICAgLy8gLSBhbGwgZW5jcnlwdGlvbnMgaW4gYSBnaXZlIHJlcXVlc3QgbXVzdCB1c2UgdGhlIHNhbWUgaW1wb3J0IGtleSwgYW5kXG4gICAgICAvL1xuICAgICAgLy8gLSB3aGVuIGltcG9ydGluZyBhIGh1Z2UgbnVtYmVyIG9mIGtleXMgdGhlIGltcG9ydCBwdWJrZXkgbWlnaHQgZXhwaXJlXG4gICAgICAvLyAgIGR1cmluZyB0aGUgaW1wb3J0LCBzbyB3ZSBjaGVjayBmb3IgZXhwaXJhdGlvbiBiZWZvcmUgZWFjaCByZXF1ZXN0XG4gICAgICBjb25zdCB7IHdpaywgaXBrIH0gPSBhd2FpdCB0aGlzLiNnZXRXcmFwcGVkSW1wb3J0QW5kUHViS2V5KCk7XG5cbiAgICAgIC8vIG5leHQsIGVuY3J5cHQgdGhpcyBjaHVuayBvZiBtbmVtb25pY3NcbiAgICAgIGNvbnN0IHN0YXJ0ID0gTnVtYmVyKE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCkgKiBpO1xuICAgICAgY29uc3QgZW5kID0gTnVtYmVyKE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCkgKyBzdGFydDtcbiAgICAgIGNvbnN0IHBrZ3NTbGljZSA9IHBhY2thZ2VzLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgICAgY29uc3Qga2V5X21hdGVyaWFsID0gW107XG4gICAgICBmb3IgKGNvbnN0IGtleVBrZyBvZiBwa2dzU2xpY2UpIHtcbiAgICAgICAgY29uc3QgbWF0ZXJpYWwgPSBhd2FpdCB0aGlzLiNlbmNyeXB0KGtleVBrZywgd2lrLnZlcmlmaWVkSGFzaCwgaXBrKTtcbiAgICAgICAga2V5X21hdGVyaWFsLnB1c2gobWF0ZXJpYWwpO1xuICAgICAgfVxuXG4gICAgICAvLyBjb25zdHJ1Y3QgdGhlIHJlcXVlc3RcbiAgICAgIGNvbnN0IHBvbGljeSA9IChwcm9wcz8ucG9saWN5ID8/IG51bGwpIGFzIFJlY29yZDxzdHJpbmcsIG5ldmVyPltdIHwgbnVsbDtcbiAgICAgIGNvbnN0IHJlcTogSW1wb3J0S2V5UmVxdWVzdCA9IHtcbiAgICAgICAgcHVibGljX2tleTogd2lrLnB1YmxpY0tleUJhc2U2NCxcbiAgICAgICAgc2tfZW5jOiB3aWsuc2tFbmNCYXNlNjQsXG4gICAgICAgIGRrX2VuYzogd2lrLmRrRW5jQmFzZTY0LFxuICAgICAgICBleHBpcmVzOiBOdW1iZXIod2lrLmV4cEVwb2NoU2Vjb25kcyksXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICBrZXlfbWF0ZXJpYWwsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBwb2xpY3ksXG4gICAgICB9O1xuXG4gICAgICAvLyBzZW5kIGl0IGFuZCBhcHBlbmQgdGhlIHJlc3VsdCB0byB0aGUgcmV0dXJuIHZhbHVlXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY3MuaW1wb3J0S2V5cyhyZXEpO1xuICAgICAga2V5cy5wdXNoKC4uLnJlc3ApO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHQgdG8gdGhpcyB3cmFwcGVkIGltcG9ydCBrZXkuIFN0b3JlcyB0aGUgcmVzdWx0IGluIGB0aGlzLmVuY3J5cHRlZF9rZXlzYFxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgZGF0YSB0byBlbmNyeXB0XG4gICAqIEBwYXJhbSB2ZXJpZmllZEhhc2ggVGhlIHZlcmlmaWVkIHNpZ25pbmcgaGFzaCBvZiB0aGUgd3JhcHBlZCBpbXBvcnQga2V5IHRvIHdoaWNoIHRvIGVuY3J5cHRcbiAgICogQHBhcmFtIHB1YmtleSBUaGUgcHVibGljIGtleSB0byBlbmNyeXB0IHRvXG4gICAqIEByZXR1cm5zIFRoZSBlbmNyeXB0ZWQga2V5IG1hdGVyaWFsXG4gICAqL1xuICBhc3luYyAjZW5jcnlwdChcbiAgICBkYXRhOiBVaW50OEFycmF5LFxuICAgIHZlcmlmaWVkSGFzaDogVWludDhBcnJheSxcbiAgICBwdWJrZXk6IENyeXB0b0tleSxcbiAgKTogUHJvbWlzZTxJbXBvcnRLZXlSZXF1ZXN0TWF0ZXJpYWw+IHtcbiAgICAvLyBzZXQgdXAgdGhlIEhQS0Ugc2VuZGVyXG4gICAgY29uc3Qgc2VuZGVyID0gYXdhaXQgdGhpcy4jaHBrZVN1aXRlLmNyZWF0ZVNlbmRlckNvbnRleHQoe1xuICAgICAgcmVjaXBpZW50UHVibGljS2V5OiBwdWJrZXksXG4gICAgICBpbmZvOiB2ZXJpZmllZEhhc2gsXG4gICAgfSk7XG5cbiAgICAvLyBlbmNyeXB0IGFuZCBjb25zdHJ1Y3QgdGhlIHJldHVybiB2YWx1ZVxuICAgIGNvbnN0IHNlbmRlckN0ZXh0ID0gYXdhaXQgc2VuZGVyLnNlYWwoZGF0YSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHNhbHQ6IFwiXCIsXG4gICAgICBjbGllbnRfcHVibGljX2tleTogQnVmZmVyLmZyb20oc2VuZGVyLmVuYykudG9TdHJpbmcoXCJiYXNlNjRcIiksXG4gICAgICBpa21fZW5jOiBCdWZmZXIuZnJvbShzZW5kZXJDdGV4dCkudG9TdHJpbmcoXCJiYXNlNjRcIiksXG4gICAgfTtcbiAgfVxufVxuXG4vKlxuICogQW4gQVdTIE5pdHJvIGF0dGVzdGF0aW9uIGRvY3VtZW50XG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3Mtbml0cm8tZW5jbGF2ZXMtbnNtLWFwaS9ibG9iLzRiODUxZjMwMDZjNmZhOThmMjNkY2ZmYjJjYmEwM2IzOWRlOWI4YWYvc3JjL2FwaS9tb2QucnMjTDIwOFxuICovXG50eXBlIEF0dGVzdGF0aW9uRG9jID0ge1xuICBtb2R1bGVfaWQ6IHN0cmluZztcbiAgZGlnZXN0OiBcIlNIQTI1NlwiIHwgXCJTSEEzODRcIiB8IFwiU0hBNTEyXCI7XG4gIHRpbWVzdGFtcDogYmlnaW50O1xuICBwY3JzOiB7IFtwY3I6IHN0cmluZ106IFVpbnQ4QXJyYXkgfTtcbiAgY2VydGlmaWNhdGU6IFVpbnQ4QXJyYXk7XG4gIGNhYnVuZGxlOiBVaW50OEFycmF5W107XG4gIHB1YmxpY19rZXk/OiBVaW50OEFycmF5O1xuICB1c2VyX2RhdGE/OiBVaW50OEFycmF5O1xuICBub25jZT86IFVpbnQ4QXJyYXk7XG59O1xuXG4vKipcbiAqIFZlcmlmaWVzIHRoZSBhdHRlc3RhdGlvbiBrZXkgYWdhaW5zdCB0aGUgQVdTIE5pdHJvIEVuY2xhdmVzIHNpZ25pbmdcbiAqIGtleSBhbmQgcmV0dXJucyB0aGUgYXR0ZXN0ZWQgc2lnbmluZyBrZXkuXG4gKlxuICogQHBhcmFtIGF0dEJ5dGVzIEFuIGF0dGVzdGF0aW9uIGZyb20gYW4gQVdTIG5pdHJvIGVuY2xhdmVcbiAqIEByZXR1cm5zIFRoZSBzaWduaW5nIGtleSB0aGF0IHdhcyBhdHRlc3RlZCwgb3IgbnVsbCBpZiB2ZXJpZmljYXRpb24gZmFpbGVkXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHZlcmlmeUF0dGVzdGF0aW9uS2V5KGF0dEJ5dGVzOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIC8vIGNib3IteCBpcyBiZWluZyBpbXBvcnRlZCBhcyBFU00sIHNvIHdlIG11c3QgYXN5bmNocm9ub3VzbHkgaW1wb3J0IGl0IGhlcmUuXG4gIC8vIEJlY2F1c2Ugd2Ugb25seSB1c2UgdGhhdCBhbmQgYXV0aDAvY29zZSBoZXJlLCB3ZSBpbXBvcnQgYm90aCB0aGlzIHdheS5cbiAgY29uc3QgeyBTaWduMSB9ID0gYXdhaXQgaW1wb3J0KFwiQGF1dGgwL2Nvc2VcIik7XG4gIGNvbnN0IHsgZGVjb2RlOiBjYm9yRGVjb2RlIH0gPSBhd2FpdCBpbXBvcnQoXCJjYm9yLXhcIik7XG5cbiAgY29uc3QgYXR0ID0gU2lnbjEuZGVjb2RlKGF0dEJ5dGVzKTtcbiAgY29uc3QgYXR0RG9jID0gY2JvckRlY29kZShhdHQucGF5bG9hZCkgYXMgQXR0ZXN0YXRpb25Eb2M7XG5cbiAgLy8gaWYgdGhlcmUncyBubyBwdWJsaWMga2V5IGluIHRoaXMgYXR0ZXN0YXRpb24sIHJlamVjdFxuICBpZiAoIWF0dERvYy5wdWJsaWNfa2V5KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZXN0YXRpb24gZGlkIG5vdCBpbmNsdWRlIGEgc2lnbmluZyBwdWJsaWMga2V5XCIpO1xuICB9XG5cbiAgLy8gaWYgUENSOCBkb2VzIG5vdCBtYXRjaCB0aGUgQ3ViZVNpZ25lciBwdWJsaWMga2V5LCByZWplY3RcbiAgY29uc3QgcGNyOERhdGEgPSBhdHREb2MucGNyc1tcIjhcIl07XG4gIGlmICghcGNyOERhdGEgfHwgQ1VCSVNUX0VJRl9TSUdOSU5HX1BLICE9PSBCdWZmZXIuZnJvbShwY3I4RGF0YSkudG9TdHJpbmcoXCJoZXhcIikpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiB3YXMgbm90IGZyb20gYW4gYXV0aG9yaXplZCBlbmNsYXZlXCIpO1xuICB9XG5cbiAgLy8gY2hlY2sgZXhwaXJhdGlvbiBkYXRlIG9mIGF0dGVzdGF0aW9uXG4gIGNvbnN0IGxhdGVzdCA9IG5vd0Vwb2NoTWlsbGlzKCkgKyBNQVhfQVRURVNUQVRJT05fRlVUVVJFX01JTlVURVMgKiA2MG4gKiAxMDAwbjtcbiAgY29uc3QgZWFybGllc3QgPVxuICAgIGxhdGVzdCAtIChNQVhfQVRURVNUQVRJT05fRlVUVVJFX01JTlVURVMgKyBNQVhfQVRURVNUQVRJT05fQUdFX01JTlVURVMpICogNjBuICogMTAwMG47XG4gIGlmIChhdHREb2MudGltZXN0YW1wIDwgZWFybGllc3QgfHwgYXR0RG9jLnRpbWVzdGFtcCA+IGxhdGVzdCkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGlzIGV4cGlyZWRcIik7XG4gIH1cblxuICAvLyBWZXJpZnkgY2VydGlmaWNhdGUgY2hhaW4gc3RhcnRpbmcgd2l0aCBBV1MgTml0cm8gQ0EgY2VydFxuICBsZXQgcGFyZW50ID0gbmV3IFg1MDlDZXJ0aWZpY2F0ZShBV1NfQ0FfQ0VSVCk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0RG9jLmNhYnVuZGxlLmxlbmd0aDsgKytpKSB7XG4gICAgY29uc3QgY2VydCA9IG5ldyBYNTA5Q2VydGlmaWNhdGUoYXR0RG9jLmNhYnVuZGxlW2ldKTtcbiAgICBpZiAoIShhd2FpdCBjZXJ0LnZlcmlmeShwYXJlbnQpKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBBdHRlc3RhdGlvbiBjZXJ0aWZpY2F0ZSBjaGFpbiBmYWlsZWQgYXQgaW5kZXggJHtpfWApO1xuICAgIH1cbiAgICBwYXJlbnQgPSBjZXJ0O1xuICB9XG4gIGNvbnN0IGNlcnQgPSBuZXcgWDUwOUNlcnRpZmljYXRlKGF0dERvYy5jZXJ0aWZpY2F0ZSk7XG4gIGlmICghKGF3YWl0IGNlcnQudmVyaWZ5KHBhcmVudCkpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZXN0YXRpb24gY2VydGlmaWNhdGUgY2hhaW4gZmFpbGVkIGF0IGxlYWZcIik7XG4gIH1cbiAgY29uc3QgcHVia2V5ID0gY2VydC5wdWJsaWNLZXk7XG5cbiAgLy8gbWFrZSBzdXJlIHRoYXQgd2UgZ290IHRoZSBleHBlY3RlZCBwdWJsaWMga2V5IHR5cGVcbiAgY29uc3QgYWxnID0gbmV3IEFsZ29yaXRobVByb3ZpZGVyKCkudG9Bc25BbGdvcml0aG0ocHVia2V5LmFsZ29yaXRobSk7XG4gIGlmIChhbGcuYWxnb3JpdGhtICE9IEVDX1BVQkxJQ19LRVkpIHtcbiAgICAvLyBub3QgdGhlIGV4cGVjdGVkIGFsZ29yaXRobSwgaS5lLiwgZWxsaXB0aWMgY3VydmUgc2lnbmluZ1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGNvbnRhaW5lZCB1bmV4cGVjdGVkIHNpZ25hdHVyZSBhbGdvcml0aG1cIik7XG4gIH1cbiAgY29uc3QgcGFyYW1zID0gQXNuUGFyc2VyLnBhcnNlKGFsZy5wYXJhbWV0ZXJzISwgRUNQYXJhbWV0ZXJzKTtcbiAgaWYgKCFwYXJhbXMubmFtZWRDdXJ2ZSB8fCBwYXJhbXMubmFtZWRDdXJ2ZSAhPT0gTklTVF9QMzg0KSB7XG4gICAgLy8gbm90IHRoZSBleHBlY3RlZCBwYXJhbXMsIGkuZS4sIE5JU1QgUDM4NFxuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGNvbnRhaW5lZCB1bmV4cGVjdGVkIHNpZ25hdHVyZSBhbGdvcml0aG1cIik7XG4gIH1cblxuICAvLyB2ZXJpZnkgdGhlIGNvc2Ugc2lnbmF0dXJlIHdpdGggdGhlIGtleSwgd2hpY2ggd2UgdmVyaWZpZWQgYWdhaW5zdFxuICAvLyB0aGUgQVdTIE5pdHJvIENBIGNlcnRpZmljYXRlIGFib3ZlXG4gIGF3YWl0IGF0dC52ZXJpZnkoYXdhaXQgcHVia2V5LmV4cG9ydCgpKTtcblxuICByZXR1cm4gYXR0RG9jLnB1YmxpY19rZXk7XG59XG4iXX0=