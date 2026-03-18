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
        const policy = props?.policy ?? null;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ltcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFTQSwrREFBMEU7QUFDMUUscUNBQXFGO0FBQ3JGLGlEQUFrRDtBQUNsRCx1REFBa0Q7QUFDbEQseUNBSXdCO0FBR3hCLHlDQUFtRDtBQUNuRCwrQkFBeUM7QUFDekMsaUNBQW1FO0FBRW5FLHlFQUF5RTtBQUN6RSxNQUFNLHNCQUFzQixHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7QUFFNUYsbUNBQW1DO0FBQ25DLE1BQU0sMkJBQTJCLEdBQUcsR0FBRyxDQUFDO0FBQ3hDLE1BQU0sOEJBQThCLEdBQUcsRUFBRSxDQUFDO0FBQzFDLE1BQU0sd0JBQXdCLEdBQUcsTUFBTyxDQUFDO0FBRXpDLHFDQUFxQztBQUNyQyxNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUMxQyxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUM7QUFFakMsd0RBQXdEO0FBQ3hELE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0FBRXJDLHlDQUF5QztBQUN6Qyx5RUFBeUU7QUFDekUsRUFBRTtBQUNGLCtEQUErRDtBQUMvRCxvRUFBb0U7QUFDcEUsTUFBTSxXQUFXLEdBQ2YsMHNCQUEwc0IsQ0FBQztBQUU3c0Isb0VBQW9FO0FBQ3BFLHNCQUFzQjtBQUN0QixNQUFNLHFCQUFxQixHQUN6QixrR0FBa0csQ0FBQztBQUVyRzs7R0FFRztBQUNILE1BQU0sZ0JBQWdCO0lBZ0JwQjs7OztPQUlHO0lBQ0gsWUFBb0IsSUFBZ0M7O1FBUjNDLHVEQUFnQztRQUNoQyxxREFBOEI7UUFRckMsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ3pELE1BQU0sSUFBSSxLQUFLLENBQUMsb0RBQW9ELENBQUMsQ0FBQztR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QztJQUNELE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7SUFFOUIscURBQXFEO0lBQ3JELE1BQU0sR0FBRyxHQUFHLElBQUksd0JBQWlCLEVBQUUsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3JFLElBQUksR0FBRyxDQUFDLFNBQVMsSUFBSSxhQUFhLEVBQUUsQ0FBQztRQUNuQywyREFBMkQ7UUFDM0QsTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFDRCxNQUFNLE1BQU0sR0FBRyx1QkFBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsVUFBVyxFQUFFLHVCQUFZLENBQUMsQ0FBQztJQUM5RCxJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsSUFBSSxNQUFNLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQzFELDJDQUEyQztRQUMzQyxNQUFNLElBQUksS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7SUFDMUUsQ0FBQztJQUVELG9FQUFvRTtJQUNwRSxxQ0FBcUM7SUFDckMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLE1BQU0sTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFFeEMsT0FBTyxNQUFNLENBQUMsVUFBVSxDQUFDO0FBQzNCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlLFxuICBJbXBvcnRLZXlSZXF1ZXN0LFxuICBJbXBvcnRLZXlSZXF1ZXN0TWF0ZXJpYWwsXG4gIEtleSxcbiAgS2V5VHlwZSxcbiAgT3JnLFxuICBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxufSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IGxvYWRDcnlwdG8sIGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiQGN1YmlzdC1kZXYvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IENpcGhlclN1aXRlLCBBZXMyNTZHY20sIEhrZGZTaGEzODQsIERoa2VtUDM4NEhrZGZTaGEzODQgfSBmcm9tIFwiQGhwa2UvY29yZVwiO1xuaW1wb3J0IHsgRUNQYXJhbWV0ZXJzIH0gZnJvbSBcIkBwZWN1bGlhci9hc24xLWVjY1wiO1xuaW1wb3J0IHsgQXNuUGFyc2VyIH0gZnJvbSBcIkBwZWN1bGlhci9hc24xLXNjaGVtYVwiO1xuaW1wb3J0IHtcbiAgQWxnb3JpdGhtUHJvdmlkZXIsXG4gIFg1MDlDZXJ0aWZpY2F0ZSxcbiAgY3J5cHRvUHJvdmlkZXIgYXMgeDUwOUNyeXB0b1Byb3ZpZGVyLFxufSBmcm9tIFwiQHBlY3VsaWFyL3g1MDlcIjtcblxuaW1wb3J0IHR5cGUgeyBNbmVtb25pY1RvSW1wb3J0IH0gZnJvbSBcIi4vbW5lbW9uaWNcIjtcbmltcG9ydCB7IG5ld01uZW1vbmljS2V5UGFja2FnZSB9IGZyb20gXCIuL21uZW1vbmljXCI7XG5pbXBvcnQgeyBuZXdSYXdLZXlQYWNrYWdlIH0gZnJvbSBcIi4vcmF3XCI7XG5pbXBvcnQgeyB0b0JpZ0VuZGlhbiwgY29uY2F0QXJyYXlzLCBub3dFcG9jaE1pbGxpcyB9IGZyb20gXCIuL3V0aWxcIjtcblxuLy8gZG9tYWluLXNlcGFyYXRpb24gdGFnIHVzZWQgd2hlbiBnZW5lcmF0aW5nIHNpZ25pbmcgaGFzaCBmb3IgaW1wb3J0IGtleVxuY29uc3QgSU1QT1JUX0tFWV9TSUdOSU5HX0RTVCA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkNVQkVTSUdORVJfRVBIRU1FUkFMX0lNUE9SVF9QMzg0XCIpO1xuXG4vLyBhdHRlc3RhdGlvbiBkb2N1bWVudCBzbGFjayB0aW1lc1xuY29uc3QgTUFYX0FUVEVTVEFUSU9OX0FHRV9NSU5VVEVTID0gMTVuO1xuY29uc3QgTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTID0gNW47XG5jb25zdCBXSUtfUkVGUkVTSF9FQVJMWV9NSUxMSVMgPSA2MF8wMDBuO1xuXG4vLyBPSURzIGZvciBlbGxpcHRpYyBjdXJ2ZSBYNTA5IGNlcnRzXG5jb25zdCBFQ19QVUJMSUNfS0VZID0gXCIxLjIuODQwLjEwMDQ1LjIuMVwiO1xuY29uc3QgTklTVF9QMzg0ID0gXCIxLjMuMTMyLjAuMzRcIjtcblxuLy8gTWF4aW11bSBudW1iZXIgb2Yga2V5cyB0byBpbXBvcnQgaW4gYSBzaW5nbGUgQVBJIGNhbGxcbmNvbnN0IE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCA9IDMybjtcblxuLy8gQVdTIE5pdHJvIEVuY2xhdmVzIHJvb3QgQ0EgY2VydGlmaWNhdGVcbi8vIGh0dHBzOi8vYXdzLW5pdHJvLWVuY2xhdmVzLmFtYXpvbmF3cy5jb20vQVdTX05pdHJvRW5jbGF2ZXNfUm9vdC1HMS56aXBcbi8vXG4vLyBTZWUgdGhlIGRvY3VtZW50YXRpb24gYWJvdXQgQVdTIE5pdHJvIEVuY2xhdmVzIHZlcmlmaWNhdGlvbjpcbi8vIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9lbmNsYXZlcy9sYXRlc3QvdXNlci92ZXJpZnktcm9vdC5odG1sXG5jb25zdCBBV1NfQ0FfQ0VSVCA9XG4gIFwiTUlJQ0VUQ0NBWmFnQXdJQkFnSVJBUGt4ZFdnYmtLL2hIVWJNdE9UbitGWXdDZ1lJS29aSXpqMEVBd013U1RFTE1Ba0dBMVVFQmhNQ1ZWTXhEekFOQmdOVkJBb01Ca0Z0WVhwdmJqRU1NQW9HQTFVRUN3d0RRVmRUTVJzd0dRWURWUVFEREJKaGQzTXVibWwwY204dFpXNWpiR0YyWlhNd0hoY05NVGt4TURJNE1UTXlPREExV2hjTk5Ea3hNREk0TVRReU9EQTFXakJKTVFzd0NRWURWUVFHRXdKVlV6RVBNQTBHQTFVRUNnd0dRVzFoZW05dU1Rd3dDZ1lEVlFRTERBTkJWMU14R3pBWkJnTlZCQU1NRW1GM2N5NXVhWFJ5YnkxbGJtTnNZWFpsY3pCMk1CQUdCeXFHU000OUFnRUdCU3VCQkFBaUEySUFCUHdDVk91bUNNSHphSERpbXRxUXZrWTRNcEp6Ym9sTC8vWnkyWWxFUzFCUjVUU2tzZmJiNDhDOFdCb3l0N0YyQnc3ZUV0YWFQK29oRzJiblVzOTkwZDBKWDI4VGNQUVhDRVBaM0JBQkllVFBZd0VvQ1daRWg4bDVZb1F3VGNVLzlLTkNNRUF3RHdZRFZSMFRBUUgvQkFVd0F3RUIvekFkQmdOVkhRNEVGZ1FVa0NXMURka0ZSK2VXdzViNmNwM1BtYW5mUzVZd0RnWURWUjBQQVFIL0JBUURBZ0dHTUFvR0NDcUdTTTQ5QkFNREEya0FNR1lDTVFDamZ5K1JvY205WHVlNFlud1dtTkpWQTQ0ZkEwUDVXMk9wWW93OU9ZQ1ZSYUVldkw4dU8xWFlydTV4dE1QV3JmTUNNUUNpODVzV0JiSndLS1hkUzZCcHRRRnVaYlQ3M28vZ0JoMXFVeGwvbk5yMTJVTzhZZndyNndQTGIrNk5Jd0x6My9ZPVwiO1xuXG4vLyBDdWJpc3QgZW5jbGF2ZS1zaWduaW5nIGtleS4gQWxsIHZhbGlkIGF0dGVzdGF0aW9ucyB3aWxsIGhhdmUgdGhpc1xuLy8gcHVibGljIGtleSBpbiBQQ1I4LlxuY29uc3QgQ1VCSVNUX0VJRl9TSUdOSU5HX1BLID1cbiAgXCIyZTZkMDQzMGM4YjBiNzgzMTYyMzZkMDNjZGEyOTk2NDQ5ZTI0MDk2YjNmNWI1MjQwMzFmMTJlZWI1ZmMxOWExOWRiNTIyYTg0NmU2MjQwYTVmMzZmMjY1OTE4OTBhYzRcIjtcblxuLyoqXG4gKiBUaGUgcmVzdWx0IG9mIGRlc2VyaWFsaXppbmcgYSBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZVxuICovXG5jbGFzcyBXcmFwcGVkSW1wb3J0S2V5IHtcbiAgcmVhZG9ubHkgdmVyaWZpZWRIYXNoOiBVaW50OEFycmF5O1xuXG4gIHJlYWRvbmx5IHB1YmxpY0tleTogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgcHVibGljS2V5QmFzZTY0OiBzdHJpbmc7XG5cbiAgcmVhZG9ubHkgc2tFbmM6IFVpbnQ4QXJyYXk7XG4gIHJlYWRvbmx5IHNrRW5jQmFzZTY0OiBzdHJpbmc7XG5cbiAgcmVhZG9ubHkgZGtFbmM6IFVpbnQ4QXJyYXk7XG4gIHJlYWRvbmx5IGRrRW5jQmFzZTY0OiBzdHJpbmc7XG5cbiAgcmVhZG9ubHkgZXhwRXBvY2hTZWNvbmRzOiBiaWdpbnQ7XG4gIHJlYWRvbmx5ICNlbmNsYXZlQXR0ZXN0YXRpb246IFVpbnQ4QXJyYXk7XG4gIHJlYWRvbmx5ICNlbmNsYXZlU2lnbmF0dXJlOiBVaW50OEFycmF5O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci4gVGhpcyBpcyBvbmx5IGNhbGxlZCBmcm9tIGBXcmFwcGVkSW1wb3J0S2V5LmNyZWF0ZUFuZFZlcmlmeSgpYC5cbiAgICpcbiAgICogQHBhcmFtIHJlc3AgVGhlIHJlc3BvbnNlIGZyb20gQ3ViZVNpZ25lclxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihyZXNwOiBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZSkge1xuICAgIGlmICghcmVzcC5lbmNsYXZlX2F0dGVzdGF0aW9uIHx8ICFyZXNwLmVuY2xhdmVfc2lnbmF0dXJlKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJObyBhdHRlc3RhdGlvbiBmb3VuZCBpbiBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZVwiKTtcbiAgICB9XG5cbiAgICAvLyBwYXJzZSB0aGUgcmVzcG9uc2VcbiAgICB0aGlzLnB1YmxpY0tleSA9IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5mcm9tKHJlc3AucHVibGljX2tleSwgXCJiYXNlNjRcIikpO1xuICAgIHRoaXMucHVibGljS2V5QmFzZTY0ID0gcmVzcC5wdWJsaWNfa2V5O1xuXG4gICAgdGhpcy5za0VuYyA9IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5mcm9tKHJlc3Auc2tfZW5jLCBcImJhc2U2NFwiKSk7XG4gICAgdGhpcy5za0VuY0Jhc2U2NCA9IHJlc3Auc2tfZW5jO1xuXG4gICAgdGhpcy5ka0VuYyA9IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5mcm9tKHJlc3AuZGtfZW5jLCBcImJhc2U2NFwiKSk7XG4gICAgdGhpcy5ka0VuY0Jhc2U2NCA9IHJlc3AuZGtfZW5jO1xuXG4gICAgdGhpcy4jZW5jbGF2ZUF0dGVzdGF0aW9uID0gbmV3IFVpbnQ4QXJyYXkoQnVmZmVyLmZyb20ocmVzcC5lbmNsYXZlX2F0dGVzdGF0aW9uLCBcImJhc2U2NFwiKSk7XG4gICAgdGhpcy4jZW5jbGF2ZVNpZ25hdHVyZSA9IG5ldyBVaW50OEFycmF5KEJ1ZmZlci5mcm9tKHJlc3AuZW5jbGF2ZV9zaWduYXR1cmUsIFwiYmFzZTY0XCIpKTtcbiAgICB0aGlzLmV4cEVwb2NoU2Vjb25kcyA9IEJpZ0ludChyZXNwLmV4cGlyZXMpO1xuXG4gICAgLy8gdGhpcyBhcnJheSBpcyB1cGRhdGVkIGluIGNyZWF0ZUFuZFZlcmlmeSBvbmNlIHZlcmlmaWNhdGlvbiBzdWNjZWVkc1xuICAgIHRoaXMudmVyaWZpZWRIYXNoID0gbmV3IFVpbnQ4QXJyYXkoMzIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbmQgdmVyaWZ5IGFuIGluc3RhbmNlIG9mIHRoaXMgdHlwZVxuICAgKlxuICAgKiBAcGFyYW0gcmVzcCBUaGUgcmVzcG9uc2UgZnJvbSBDdWJlU2lnbmVyXG4gICAqIEBwYXJhbSBzdWJ0bGUgQW4gaW5zdGFuY2Ugb2YgU3VidGxlQ3J5cHRvIHVzZWQgZm9yIHZlcmlmaWNhdGlvblxuICAgKiBAcmV0dXJucyBBIG5ld2x5IGNvbnN0cnVjdGVkIGluc3RhbmNlXG4gICAqL1xuICBwdWJsaWMgc3RhdGljIGFzeW5jIGNyZWF0ZUFuZFZlcmlmeShcbiAgICByZXNwOiBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZSxcbiAgICBzdWJ0bGU6IFN1YnRsZUNyeXB0byxcbiAgKTogUHJvbWlzZTxXcmFwcGVkSW1wb3J0S2V5PiB7XG4gICAgY29uc3QgcmV0ID0gbmV3IFdyYXBwZWRJbXBvcnRLZXkocmVzcCk7XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IHJldC4jdmVyaWZ5SW1wb3J0S2V5KHN1YnRsZSk7XG4gICAgcmV0LnZlcmlmaWVkSGFzaC5zZXQoaGFzaCk7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZnkgdGhpcyB3cmFwcGVkIGltcG9ydCBrZXkuXG4gICAqXG4gICAqIEBwYXJhbSBzdWJ0bGUgQW4gaW5zdGFuY2Ugb2YgU3VidGxlQ3J5cHRvIHVzZWQgZm9yIHZlcmlmaWNhdGlvblxuICAgKiBAcmV0dXJucyBUaGUgaGFzaCBvZiB0aGUgc3VjY2Vzc2Z1bGx5IHZlcmlmaWVkIHdyYXBwZWQgaW1wb3J0IGtleVxuICAgKi9cbiAgYXN5bmMgI3ZlcmlmeUltcG9ydEtleShzdWJ0bGU6IFN1YnRsZUNyeXB0byk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAgIC8vIGNoZWNrIGV4cGlyYXRpb24gZGF0ZVxuICAgIGlmIChub3dFcG9jaE1pbGxpcygpID4gdGhpcy5leHBFcG9jaFNlY29uZHMgKiAxMDAwbikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW1wb3J0IGtleSBpcyBleHBpcmVkXCIpO1xuICAgIH1cblxuICAgIC8vIG1ha2Ugc3VyZSB0aGF0IHRoZXJlIGlzIGFuIGF0dGVzdGF0aW9uXG4gICAgaWYgKCF0aGlzLiNlbmNsYXZlU2lnbmF0dXJlIHx8ICF0aGlzLiNlbmNsYXZlQXR0ZXN0YXRpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGF0dGVzdGF0aW9uIGZvdW5kXCIpO1xuICAgIH1cbiAgICBjb25zdCBzaWduaW5nX2tleSA9IGF3YWl0IHZlcmlmeUF0dGVzdGF0aW9uS2V5KHRoaXMuI2VuY2xhdmVBdHRlc3RhdGlvbik7XG5cbiAgICAvLyB3ZSB1c2Ugc3VidGxlY3J5cHRvJ3MgaW1wbCBvZiBSU0EtUFNTIHZlcmlmaWNhdGlvblxuICAgIGNvbnN0IHJzYVBzc0tleVBhcmFtcyA9IHtcbiAgICAgIG5hbWU6IFwiUlNBLVBTU1wiLFxuICAgICAgaGFzaDogXCJTSEEtMjU2XCIsXG4gICAgfTtcbiAgICBjb25zdCBwdWJrZXkgPSBhd2FpdCBzdWJ0bGUuaW1wb3J0S2V5KFwic3BraVwiLCBzaWduaW5nX2tleSwgcnNhUHNzS2V5UGFyYW1zLCB0cnVlLCBbXCJ2ZXJpZnlcIl0pO1xuICAgIGNvbnN0IHB1YmtleUFsZyA9IHB1YmtleS5hbGdvcml0aG0gYXMgdW5rbm93biBhcyB7IG1vZHVsdXNMZW5ndGg6IG51bWJlciB9O1xuXG4gICAgLy8gY29tcHV0ZSB0aGUgc2lnbmluZyBoYXNoIGFuZCB2ZXJpZnkgdGhlIHNpZ25hdHVyZVxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLiNzaWduZWREYXRhKCk7XG4gICAgY29uc3QgbWxlbiA9IE51bWJlcihCaWdJbnQocHVia2V5QWxnLm1vZHVsdXNMZW5ndGgpIC8gOG4pO1xuICAgIGNvbnN0IHJzYVBzc1BhcmFtcyA9IHtcbiAgICAgIG5hbWU6IFwiUlNBLVBTU1wiLFxuICAgICAgc2FsdExlbmd0aDogbWxlbiAtIDIgLSAzMixcbiAgICB9O1xuXG4gICAgaWYgKGF3YWl0IHN1YnRsZS52ZXJpZnkocnNhUHNzUGFyYW1zLCBwdWJrZXksIHRoaXMuI2VuY2xhdmVTaWduYXR1cmUsIG1lc3NhZ2UpKSB7XG4gICAgICByZXR1cm4gbmV3IFVpbnQ4QXJyYXkoYXdhaXQgc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgbWVzc2FnZSkpO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBvcnQga2V5IHNpZ25hdHVyZSB2ZXJpZmljYXRpb24gZmFpbGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgYHRydWVgIGlmIHRoaXMgV3JhcHBlZEltcG9ydEtleSBuZWVkcyB0byBiZSByZWZyZXNoZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRydWUganVzdCBpZiB0aGlzIGtleSBuZWVkcyB0byBiZSByZWZyZXNoZWQuXG4gICAqL1xuICBwdWJsaWMgbmVlZHNSZWZyZXNoKCk6IGJvb2xlYW4ge1xuICAgIC8vIGZvcmNlIHJlZnJlc2ggaWYgd2UncmUgd2l0aGluIFdJS19SRUZSRVNIX0VBUkxZX01JTExJUyBvZiB0aGUgZXhwaXJhdGlvblxuICAgIHJldHVybiBub3dFcG9jaE1pbGxpcygpICsgV0lLX1JFRlJFU0hfRUFSTFlfTUlMTElTID4gdGhpcy5leHBFcG9jaFNlY29uZHMgKiAxMDAwbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgc2lnbmluZyBoYXNoIGZvciBhIHdyYXBwZWQgaW1wb3J0IGtleVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2lnbmluZyBoYXNoXG4gICAqL1xuICAjc2lnbmVkRGF0YSgpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBwYXJ0czogVWludDhBcnJheVtdID0gW1xuICAgICAgLy8gZG9tYWluIHNlcGFyYXRpb24gdGFnXG4gICAgICB0b0JpZ0VuZGlhbihCaWdJbnQoSU1QT1JUX0tFWV9TSUdOSU5HX0RTVC5sZW5ndGgpLCAyKSxcbiAgICAgIElNUE9SVF9LRVlfU0lHTklOR19EU1QsXG5cbiAgICAgIC8vIHB1YmxpYyBrZXlcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludCh0aGlzLnB1YmxpY0tleS5sZW5ndGgpLCAyKSxcbiAgICAgIHRoaXMucHVibGljS2V5LFxuXG4gICAgICAvLyBza19lbmNcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludCh0aGlzLnNrRW5jLmxlbmd0aCksIDIpLFxuICAgICAgdGhpcy5za0VuYyxcblxuICAgICAgLy8gZGtfZW5jXG4gICAgICB0b0JpZ0VuZGlhbihCaWdJbnQodGhpcy5ka0VuYy5sZW5ndGgpLCAyKSxcbiAgICAgIHRoaXMuZGtFbmMsXG5cbiAgICAgIC8vIDgtYnl0ZSBiaWctZW5kaWFuIGV4cGlyYXRpb24gdGltZSBpbiBzZWNvbmRzIHNpbmNlIFVOSVggZXBvY2hcbiAgICAgIHRvQmlnRW5kaWFuKHRoaXMuZXhwRXBvY2hTZWNvbmRzLCA4KSxcbiAgICBdO1xuXG4gICAgcmV0dXJuIGNvbmNhdEFycmF5cyhwYXJ0cyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgcmV0dXJuIHZhbHVlIGZyb20gS2V5SW1wb3J0ZXIuI2dldFdyYXBwZWRJbXBvcnRBbmRQdWJLZXkoKVxuICovXG50eXBlIFdyYXBwZWRJbXBvcnRBbmRQdWJLZXkgPSB7XG4gIHdpazogV3JhcHBlZEltcG9ydEtleTtcbiAgaXBrOiBDcnlwdG9LZXk7XG59O1xuXG4vKipcbiAqIEFuIGltcG9ydCBlbmNyeXB0aW9uIGtleSBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgYXR0ZXN0YXRpb24gZG9jdW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIEtleUltcG9ydGVyIHtcbiAgI3dyYXBwZWRJbXBvcnRLZXk6IG51bGwgfCBXcmFwcGVkSW1wb3J0S2V5ID0gbnVsbDtcbiAgI3N1YnRsZUNyeXB0bzogbnVsbCB8IFN1YnRsZUNyeXB0byA9IG51bGw7XG4gICNwdWJsaWNLZXlIYW5kbGU6IG51bGwgfCBDcnlwdG9LZXkgPSBudWxsO1xuICByZWFkb25seSAjaHBrZVN1aXRlOiBDaXBoZXJTdWl0ZTtcbiAgcmVhZG9ubHkgI2NzOiBPcmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBmcm9tIGEgQ3ViZVNpZ25lciBgT3JnYCBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gY3MgQSBDdWJlU2lnbmVyIGBPcmdgIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogT3JnKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLiNocGtlU3VpdGUgPSBuZXcgQ2lwaGVyU3VpdGUoe1xuICAgICAga2VtOiBuZXcgRGhrZW1QMzg0SGtkZlNoYTM4NCgpLFxuICAgICAga2RmOiBuZXcgSGtkZlNoYTM4NCgpLFxuICAgICAgYWVhZDogbmV3IEFlczI1NkdjbSgpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrIHRoYXQgdGhlIHdyYXBwZWQgaW1wb3J0IGtleSBpcyB1bmV4cGlyZWQgYW5kIHZlcmlmaWVkLiBPdGhlcndpc2UsXG4gICAqIHJlcXVlc3QgYSBuZXcgb25lLCB2ZXJpZnkgaXQsIGFuZCB1cGRhdGUgdGhlIHZlcmlmaWVkIHNpZ25pbmcgaGFzaC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHZlcmlmaWVkIHNpZ25pbmcgaGFzaC5cbiAgICovXG4gIGFzeW5jICNnZXRXcmFwcGVkSW1wb3J0QW5kUHViS2V5KCk6IFByb21pc2U8V3JhcHBlZEltcG9ydEFuZFB1YktleT4ge1xuICAgIGlmICghdGhpcy4jd3JhcHBlZEltcG9ydEtleSkge1xuICAgICAgLy8gZmlyc3QgdGltZSB3ZSBsb2FkIGEgV3JhcHBlZEltcG9ydEtleSwgbWFrZSBzdXJlIHRoZSB4NTA5IGNyeXB0b1xuICAgICAgLy8gcHJvdmlkZXIgaXMgc2V0IGNvcnJlY3RseS5cbiAgICAgIHg1MDlDcnlwdG9Qcm92aWRlci5zZXQoYXdhaXQgbG9hZENyeXB0bygpKTtcbiAgICB9XG4gICAgaWYgKCF0aGlzLiN3cmFwcGVkSW1wb3J0S2V5IHx8IHRoaXMuI3dyYXBwZWRJbXBvcnRLZXkubmVlZHNSZWZyZXNoKCkpIHtcbiAgICAgIGNvbnN0IGtpa1Jlc3AgPSBhd2FpdCB0aGlzLiNjcy5jcmVhdGVLZXlJbXBvcnRLZXkoKTtcbiAgICAgIGNvbnN0IHN1YnRsZSA9IGF3YWl0IHRoaXMuI2dldFN1YnRsZUNyeXB0bygpO1xuICAgICAgY29uc3Qgd2lrID0gYXdhaXQgV3JhcHBlZEltcG9ydEtleS5jcmVhdGVBbmRWZXJpZnkoa2lrUmVzcCwgc3VidGxlKTtcblxuICAgICAgLy8gaW1wb3J0IHRoZSBwdWJsaWMga2V5IGZyb20gdGhlIFdyYXBwZWRJbXBvcnRLZXlcbiAgICAgIGNvbnN0IHAzODRQYXJhbXMgPSB7XG4gICAgICAgIG5hbWU6IFwiRUNESFwiLFxuICAgICAgICBuYW1lZEN1cnZlOiBcIlAtMzg0XCIsXG4gICAgICB9O1xuICAgICAgdGhpcy4jcHVibGljS2V5SGFuZGxlID0gYXdhaXQgc3VidGxlLmltcG9ydEtleShcInJhd1wiLCB3aWsucHVibGljS2V5LCBwMzg0UGFyYW1zLCB0cnVlLCBbXSk7XG4gICAgICB0aGlzLiN3cmFwcGVkSW1wb3J0S2V5ID0gd2lrO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgd2lrOiB0aGlzLiN3cmFwcGVkSW1wb3J0S2V5LFxuICAgICAgaXBrOiB0aGlzLiNwdWJsaWNLZXlIYW5kbGUhLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogR2V0IG9yIGNyZWF0ZSBhbiBpbnN0YW5jZSBvZiBTdWJ0bGVDcnlwdG8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBvZiBTdWJ0bGVDcnlwdG8uXG4gICAqL1xuICBhc3luYyAjZ2V0U3VidGxlQ3J5cHRvKCk6IFByb21pc2U8U3VidGxlQ3J5cHRvPiB7XG4gICAgaWYgKCF0aGlzLiNzdWJ0bGVDcnlwdG8pIHtcbiAgICAgIHRoaXMuI3N1YnRsZUNyeXB0byA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuI3N1YnRsZUNyeXB0bztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiBtbmVtb25pY3MgYW5kIGltcG9ydHMgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGltcG9ydFxuICAgKiBAcGFyYW0gbW5lcyBUaGUgbW5lbW9uaWNzIHRvIGltcG9ydCwgd2l0aCBvcHRpb25hbCBkZXJpdmF0aW9uIHBhdGhzIGFuZCBwYXNzd29yZHNcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgaW1wb3J0XG4gICAqIEByZXR1cm5zIGBLZXlgIG9iamVjdHMgZm9yIGVhY2ggaW1wb3J0ZWQga2V5LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGltcG9ydE1uZW1vbmljcyhcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIG1uZXM6IE1uZW1vbmljVG9JbXBvcnRbXSxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jaW1wb3J0UGFja2FnZXMoXG4gICAgICBrZXlUeXBlLFxuICAgICAgbW5lcy5tYXAoKG1uZSkgPT4gbmV3TW5lbW9uaWNLZXlQYWNrYWdlKG1uZSkpLFxuICAgICAgcHJvcHMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiByYXcga2V5cyBhbmQgaW1wb3J0cyB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzZWNyZXRzIFRoZSBzZWNyZXQga2V5cyB0byBpbXBvcnQuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGltcG9ydFxuICAgKiBAcmV0dXJucyBgS2V5YCBvYmplY3RzIGZvciBlYWNoIGltcG9ydGVkIGtleS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBpbXBvcnRSYXdTZWNyZXRLZXlzKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgc2VjcmV0czogVWludDhBcnJheVtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNpbXBvcnRQYWNrYWdlcyhcbiAgICAgIGtleVR5cGUsXG4gICAgICBzZWNyZXRzLm1hcCgoc2VjKSA9PiBuZXdSYXdLZXlQYWNrYWdlKHNlYykpLFxuICAgICAgcHJvcHMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiBwcmVwYXJlZCBrZXkgcGFja2FnZXMsIGFuZCBpbXBvcnRzIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBpbXBvcnRcbiAgICogQHBhcmFtIHBhY2thZ2VzIFRoZSBrZXkgcGFja2FnZXMgdG8gaW1wb3J0LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBpbXBvcnRcbiAgICogQHJldHVybnMgYEtleWAgb2JqZWN0cyBmb3IgZWFjaCBpbXBvcnRlZCBrZXkuXG4gICAqL1xuICBhc3luYyAjaW1wb3J0UGFja2FnZXMoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBwYWNrYWdlczogVWludDhBcnJheVtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IG5DaHVua3MgPSBOdW1iZXIoXG4gICAgICAoQmlnSW50KHBhY2thZ2VzLmxlbmd0aCkgKyBNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwgLSAxbikgLyBNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwsXG4gICAgKTtcbiAgICBjb25zdCBrZXlzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5DaHVua3M7ICsraSkge1xuICAgICAgLy8gZmlyc3QsIG1ha2Ugc3VyZSB0aGF0IHRoZSB3cmFwcGVkIGltcG9ydCBrZXkgaXMgdmFsaWQsIGkuZS4sIHRoYXRcbiAgICAgIC8vIHdlIGhhdmUgcmV0cmlldmVkIGl0IGFuZCB0aGF0IGl0IGhhc24ndCBleHBpcmVkLiBXZSBkbyB0aGlzIGhlcmVcbiAgICAgIC8vIGZvciBhIGNvdXBsZSByZWFzb25zOlxuICAgICAgLy9cbiAgICAgIC8vIC0gYWxsIGVuY3J5cHRpb25zIGluIGEgZ2l2ZSByZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGltcG9ydCBrZXksIGFuZFxuICAgICAgLy9cbiAgICAgIC8vIC0gd2hlbiBpbXBvcnRpbmcgYSBodWdlIG51bWJlciBvZiBrZXlzIHRoZSBpbXBvcnQgcHVia2V5IG1pZ2h0IGV4cGlyZVxuICAgICAgLy8gICBkdXJpbmcgdGhlIGltcG9ydCwgc28gd2UgY2hlY2sgZm9yIGV4cGlyYXRpb24gYmVmb3JlIGVhY2ggcmVxdWVzdFxuICAgICAgY29uc3QgeyB3aWssIGlwayB9ID0gYXdhaXQgdGhpcy4jZ2V0V3JhcHBlZEltcG9ydEFuZFB1YktleSgpO1xuXG4gICAgICAvLyBuZXh0LCBlbmNyeXB0IHRoaXMgY2h1bmsgb2YgbW5lbW9uaWNzXG4gICAgICBjb25zdCBzdGFydCA9IE51bWJlcihNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwpICogaTtcbiAgICAgIGNvbnN0IGVuZCA9IE51bWJlcihNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwpICsgc3RhcnQ7XG4gICAgICBjb25zdCBwa2dzU2xpY2UgPSBwYWNrYWdlcy5zbGljZShzdGFydCwgZW5kKTtcbiAgICAgIGNvbnN0IGtleV9tYXRlcmlhbCA9IFtdO1xuICAgICAgZm9yIChjb25zdCBrZXlQa2cgb2YgcGtnc1NsaWNlKSB7XG4gICAgICAgIGNvbnN0IG1hdGVyaWFsID0gYXdhaXQgdGhpcy4jZW5jcnlwdChrZXlQa2csIHdpay52ZXJpZmllZEhhc2gsIGlwayk7XG4gICAgICAgIGtleV9tYXRlcmlhbC5wdXNoKG1hdGVyaWFsKTtcbiAgICAgIH1cblxuICAgICAgLy8gY29uc3RydWN0IHRoZSByZXF1ZXN0XG4gICAgICBjb25zdCBwb2xpY3kgPSBwcm9wcz8ucG9saWN5ID8/IG51bGw7XG4gICAgICBjb25zdCByZXE6IEltcG9ydEtleVJlcXVlc3QgPSB7XG4gICAgICAgIHB1YmxpY19rZXk6IHdpay5wdWJsaWNLZXlCYXNlNjQsXG4gICAgICAgIHNrX2VuYzogd2lrLnNrRW5jQmFzZTY0LFxuICAgICAgICBka19lbmM6IHdpay5ka0VuY0Jhc2U2NCxcbiAgICAgICAgZXhwaXJlczogTnVtYmVyKHdpay5leHBFcG9jaFNlY29uZHMpLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAga2V5X21hdGVyaWFsLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgcG9saWN5LFxuICAgICAgfTtcblxuICAgICAgLy8gc2VuZCBpdCBhbmQgYXBwZW5kIHRoZSByZXN1bHQgdG8gdGhlIHJldHVybiB2YWx1ZVxuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NzLmltcG9ydEtleXMocmVxKTtcbiAgICAgIGtleXMucHVzaCguLi5yZXNwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0IHRvIHRoaXMgd3JhcHBlZCBpbXBvcnQga2V5LiBTdG9yZXMgdGhlIHJlc3VsdCBpbiBgdGhpcy5lbmNyeXB0ZWRfa2V5c2BcbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIGRhdGEgdG8gZW5jcnlwdFxuICAgKiBAcGFyYW0gdmVyaWZpZWRIYXNoIFRoZSB2ZXJpZmllZCBzaWduaW5nIGhhc2ggb2YgdGhlIHdyYXBwZWQgaW1wb3J0IGtleSB0byB3aGljaCB0byBlbmNyeXB0XG4gICAqIEBwYXJhbSBwdWJrZXkgVGhlIHB1YmxpYyBrZXkgdG8gZW5jcnlwdCB0b1xuICAgKiBAcmV0dXJucyBUaGUgZW5jcnlwdGVkIGtleSBtYXRlcmlhbFxuICAgKi9cbiAgYXN5bmMgI2VuY3J5cHQoXG4gICAgZGF0YTogVWludDhBcnJheSxcbiAgICB2ZXJpZmllZEhhc2g6IFVpbnQ4QXJyYXksXG4gICAgcHVia2V5OiBDcnlwdG9LZXksXG4gICk6IFByb21pc2U8SW1wb3J0S2V5UmVxdWVzdE1hdGVyaWFsPiB7XG4gICAgLy8gc2V0IHVwIHRoZSBIUEtFIHNlbmRlclxuICAgIGNvbnN0IHNlbmRlciA9IGF3YWl0IHRoaXMuI2hwa2VTdWl0ZS5jcmVhdGVTZW5kZXJDb250ZXh0KHtcbiAgICAgIHJlY2lwaWVudFB1YmxpY0tleTogcHVia2V5LFxuICAgICAgaW5mbzogdmVyaWZpZWRIYXNoLFxuICAgIH0pO1xuXG4gICAgLy8gZW5jcnlwdCBhbmQgY29uc3RydWN0IHRoZSByZXR1cm4gdmFsdWVcbiAgICBjb25zdCBzZW5kZXJDdGV4dCA9IGF3YWl0IHNlbmRlci5zZWFsKGRhdGEpO1xuICAgIHJldHVybiB7XG4gICAgICBzYWx0OiBcIlwiLFxuICAgICAgY2xpZW50X3B1YmxpY19rZXk6IEJ1ZmZlci5mcm9tKHNlbmRlci5lbmMpLnRvU3RyaW5nKFwiYmFzZTY0XCIpLFxuICAgICAgaWttX2VuYzogQnVmZmVyLmZyb20oc2VuZGVyQ3RleHQpLnRvU3RyaW5nKFwiYmFzZTY0XCIpLFxuICAgIH07XG4gIH1cbn1cblxuLypcbiAqIEFuIEFXUyBOaXRybyBhdHRlc3RhdGlvbiBkb2N1bWVudFxuICpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvYXdzLW5pdHJvLWVuY2xhdmVzLW5zbS1hcGkvYmxvYi80Yjg1MWYzMDA2YzZmYTk4ZjIzZGNmZmIyY2JhMDNiMzlkZTliOGFmL3NyYy9hcGkvbW9kLnJzI0wyMDhcbiAqL1xudHlwZSBBdHRlc3RhdGlvbkRvYyA9IHtcbiAgbW9kdWxlX2lkOiBzdHJpbmc7XG4gIGRpZ2VzdDogXCJTSEEyNTZcIiB8IFwiU0hBMzg0XCIgfCBcIlNIQTUxMlwiO1xuICB0aW1lc3RhbXA6IGJpZ2ludDtcbiAgcGNyczogeyBbcGNyOiBzdHJpbmddOiBVaW50OEFycmF5IH07XG4gIGNlcnRpZmljYXRlOiBVaW50OEFycmF5O1xuICBjYWJ1bmRsZTogVWludDhBcnJheVtdO1xuICBwdWJsaWNfa2V5PzogVWludDhBcnJheTtcbiAgdXNlcl9kYXRhPzogVWludDhBcnJheTtcbiAgbm9uY2U/OiBVaW50OEFycmF5O1xufTtcblxuLyoqXG4gKiBWZXJpZmllcyB0aGUgYXR0ZXN0YXRpb24ga2V5IGFnYWluc3QgdGhlIEFXUyBOaXRybyBFbmNsYXZlcyBzaWduaW5nXG4gKiBrZXkgYW5kIHJldHVybnMgdGhlIGF0dGVzdGVkIHNpZ25pbmcga2V5LlxuICpcbiAqIEBwYXJhbSBhdHRCeXRlcyBBbiBhdHRlc3RhdGlvbiBmcm9tIGFuIEFXUyBuaXRybyBlbmNsYXZlXG4gKiBAcmV0dXJucyBUaGUgc2lnbmluZyBrZXkgdGhhdCB3YXMgYXR0ZXN0ZWQsIG9yIG51bGwgaWYgdmVyaWZpY2F0aW9uIGZhaWxlZFxuICovXG5hc3luYyBmdW5jdGlvbiB2ZXJpZnlBdHRlc3RhdGlvbktleShhdHRCeXRlczogVWludDhBcnJheSk6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAvLyBjYm9yLXggaXMgYmVpbmcgaW1wb3J0ZWQgYXMgRVNNLCBzbyB3ZSBtdXN0IGFzeW5jaHJvbm91c2x5IGltcG9ydCBpdCBoZXJlLlxuICAvLyBCZWNhdXNlIHdlIG9ubHkgdXNlIHRoYXQgYW5kIGF1dGgwL2Nvc2UgaGVyZSwgd2UgaW1wb3J0IGJvdGggdGhpcyB3YXkuXG4gIGNvbnN0IHsgU2lnbjEgfSA9IGF3YWl0IGltcG9ydChcIkBhdXRoMC9jb3NlXCIpO1xuICBjb25zdCB7IGRlY29kZTogY2JvckRlY29kZSB9ID0gYXdhaXQgaW1wb3J0KFwiY2Jvci14XCIpO1xuXG4gIGNvbnN0IGF0dCA9IFNpZ24xLmRlY29kZShhdHRCeXRlcyk7XG4gIGNvbnN0IGF0dERvYyA9IGNib3JEZWNvZGUoYXR0LnBheWxvYWQpIGFzIEF0dGVzdGF0aW9uRG9jO1xuXG4gIC8vIGlmIHRoZXJlJ3Mgbm8gcHVibGljIGtleSBpbiB0aGlzIGF0dGVzdGF0aW9uLCByZWplY3RcbiAgaWYgKCFhdHREb2MucHVibGljX2tleSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGRpZCBub3QgaW5jbHVkZSBhIHNpZ25pbmcgcHVibGljIGtleVwiKTtcbiAgfVxuXG4gIC8vIGlmIFBDUjggZG9lcyBub3QgbWF0Y2ggdGhlIEN1YmVTaWduZXIgcHVibGljIGtleSwgcmVqZWN0XG4gIGNvbnN0IHBjcjhEYXRhID0gYXR0RG9jLnBjcnNbXCI4XCJdO1xuICBpZiAoIXBjcjhEYXRhIHx8IENVQklTVF9FSUZfU0lHTklOR19QSyAhPT0gQnVmZmVyLmZyb20ocGNyOERhdGEpLnRvU3RyaW5nKFwiaGV4XCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQXR0ZXN0YXRpb24gd2FzIG5vdCBmcm9tIGFuIGF1dGhvcml6ZWQgZW5jbGF2ZVwiKTtcbiAgfVxuXG4gIC8vIGNoZWNrIGV4cGlyYXRpb24gZGF0ZSBvZiBhdHRlc3RhdGlvblxuICBjb25zdCBsYXRlc3QgPSBub3dFcG9jaE1pbGxpcygpICsgTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTICogNjBuICogMTAwMG47XG4gIGNvbnN0IGVhcmxpZXN0ID1cbiAgICBsYXRlc3QgLSAoTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTICsgTUFYX0FUVEVTVEFUSU9OX0FHRV9NSU5VVEVTKSAqIDYwbiAqIDEwMDBuO1xuICBpZiAoYXR0RG9jLnRpbWVzdGFtcCA8IGVhcmxpZXN0IHx8IGF0dERvYy50aW1lc3RhbXAgPiBsYXRlc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBpcyBleHBpcmVkXCIpO1xuICB9XG5cbiAgLy8gVmVyaWZ5IGNlcnRpZmljYXRlIGNoYWluIHN0YXJ0aW5nIHdpdGggQVdTIE5pdHJvIENBIGNlcnRcbiAgbGV0IHBhcmVudCA9IG5ldyBYNTA5Q2VydGlmaWNhdGUoQVdTX0NBX0NFUlQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dERvYy5jYWJ1bmRsZS5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IGNlcnQgPSBuZXcgWDUwOUNlcnRpZmljYXRlKGF0dERvYy5jYWJ1bmRsZVtpXSk7XG4gICAgaWYgKCEoYXdhaXQgY2VydC52ZXJpZnkocGFyZW50KSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZXN0YXRpb24gY2VydGlmaWNhdGUgY2hhaW4gZmFpbGVkIGF0IGluZGV4ICR7aX1gKTtcbiAgICB9XG4gICAgcGFyZW50ID0gY2VydDtcbiAgfVxuICBjb25zdCBjZXJ0ID0gbmV3IFg1MDlDZXJ0aWZpY2F0ZShhdHREb2MuY2VydGlmaWNhdGUpO1xuICBpZiAoIShhd2FpdCBjZXJ0LnZlcmlmeShwYXJlbnQpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGNlcnRpZmljYXRlIGNoYWluIGZhaWxlZCBhdCBsZWFmXCIpO1xuICB9XG4gIGNvbnN0IHB1YmtleSA9IGNlcnQucHVibGljS2V5O1xuXG4gIC8vIG1ha2Ugc3VyZSB0aGF0IHdlIGdvdCB0aGUgZXhwZWN0ZWQgcHVibGljIGtleSB0eXBlXG4gIGNvbnN0IGFsZyA9IG5ldyBBbGdvcml0aG1Qcm92aWRlcigpLnRvQXNuQWxnb3JpdGhtKHB1YmtleS5hbGdvcml0aG0pO1xuICBpZiAoYWxnLmFsZ29yaXRobSAhPSBFQ19QVUJMSUNfS0VZKSB7XG4gICAgLy8gbm90IHRoZSBleHBlY3RlZCBhbGdvcml0aG0sIGkuZS4sIGVsbGlwdGljIGN1cnZlIHNpZ25pbmdcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBjb250YWluZWQgdW5leHBlY3RlZCBzaWduYXR1cmUgYWxnb3JpdGhtXCIpO1xuICB9XG4gIGNvbnN0IHBhcmFtcyA9IEFzblBhcnNlci5wYXJzZShhbGcucGFyYW1ldGVycyEsIEVDUGFyYW1ldGVycyk7XG4gIGlmICghcGFyYW1zLm5hbWVkQ3VydmUgfHwgcGFyYW1zLm5hbWVkQ3VydmUgIT09IE5JU1RfUDM4NCkge1xuICAgIC8vIG5vdCB0aGUgZXhwZWN0ZWQgcGFyYW1zLCBpLmUuLCBOSVNUIFAzODRcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBjb250YWluZWQgdW5leHBlY3RlZCBzaWduYXR1cmUgYWxnb3JpdGhtXCIpO1xuICB9XG5cbiAgLy8gdmVyaWZ5IHRoZSBjb3NlIHNpZ25hdHVyZSB3aXRoIHRoZSBrZXksIHdoaWNoIHdlIHZlcmlmaWVkIGFnYWluc3RcbiAgLy8gdGhlIEFXUyBOaXRybyBDQSBjZXJ0aWZpY2F0ZSBhYm92ZVxuICBhd2FpdCBhdHQudmVyaWZ5KGF3YWl0IHB1YmtleS5leHBvcnQoKSk7XG5cbiAgcmV0dXJuIGF0dERvYy5wdWJsaWNfa2V5O1xufVxuIl19