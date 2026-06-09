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
var _WrappedImportKey_instances, _WrappedImportKey_publicKey, _WrappedImportKey_skEnc, _WrappedImportKey_dkEnc, _WrappedImportKey_expEpochSeconds, _WrappedImportKey_enclaveAttestation, _WrappedImportKey_enclaveSignature, _WrappedImportKey_suite, _WrappedImportKey_senderContextParams, _WrappedImportKey_verifyImportKey, _WrappedImportKey_signedData;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrappedImportKey = exports.WIK_REFRESH_EARLY_MILLIS = exports.IMPORT_KEY_SIGNING_DST = void 0;
exports.verifyAttestationKey = verifyAttestationKey;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const core_1 = require("@hpke/core");
const asn1_ecc_1 = require("@peculiar/asn1-ecc");
const asn1_schema_1 = require("@peculiar/asn1-schema");
const x509_1 = require("@peculiar/x509");
const util_1 = require("./util");
// domain-separation tag used when generating signing hash for import key
exports.IMPORT_KEY_SIGNING_DST = new TextEncoder().encode("CUBESIGNER_EPHEMERAL_IMPORT_P384");
// how early to refresh a wrapped import key before it expires
exports.WIK_REFRESH_EARLY_MILLIS = 60000n;
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
const AWS_CA_CERT = "MIICETCCAZagAwIBAgIRAPkxdWgbkK/hHUbMtOTn+FYwCgYIKoZIzj0EAwMwSTELMAkGA1UEBhMCVVMxDzANBgNVBAoMBkFtYXpvbjEMMAoGA1UECwwDQVdTMRswGQYDVQQDDBJhd3Mubml0cm8tZW5jbGF2ZXMwHhcNMTkxMDI4MTMyODA1WhcNNDkxMDI4MTQyODA1WjBJMQswCQYDVQQGEwJVUzEPMA0GA1UECgwGQW1hem9uMQwwCgYDVQQLDANBV1MxGzAZBgNVBAMMEmF3cy5uaXRyby1lbmNsYXZlczB2MBAGByqGSM49AgEGBSuBBAAiA2IABPwCVOumCMHzaHDimtqQvkY4MpJzbolL//Zy2YlES1BR5TSksfbb48C8WBoyt7F2Bw7eEtaaP+ohG2bnUs990d0JX28TcPQXCEPZ3BABIeTPYwEoCWZEh8l5YoQwTcU/9KNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUkCW1DdkFR+eWw5b6cp3PmanfS5YwDgYDVR0PAQH/BAQDAgGGMAoGCCqGSM49BAMDA2kAMGYCMQCjfy+Rocm9Xue4YnwWmNJVA44fA0P5W2OpYow9OYCVRaEevL8uO1XYru5xtMPWrfMCMQCi85sWBbJwKKXdS6BptQFuZbT73o/gBh1qUxl/nNr12UO8Yfwr6wPLb+6NIwLz3/Y=";
// Cubist enclave-signing key. All valid attestations will have this
// public key in PCR8.
const CUBIST_EIF_SIGNING_PK = "2e6d0430c8b0b78316236d03cda2996449e24096b3f5b524031f12eeb5fc19a19db522a846e6240a5f36f26591890ac4";
/**
 * A verified import key, usable for HPKE encryption.
 */
class WrappedImportKey {
    /**
     * Private constructor.
     *
     * @param resp The import key response from CubeSigner.
     * @param suite The HPKE ciphersuite to use for encryption.
     */
    constructor(resp, suite) {
        _WrappedImportKey_instances.add(this);
        _WrappedImportKey_publicKey.set(this, void 0);
        _WrappedImportKey_skEnc.set(this, void 0);
        _WrappedImportKey_dkEnc.set(this, void 0);
        _WrappedImportKey_expEpochSeconds.set(this, void 0);
        _WrappedImportKey_enclaveAttestation.set(this, void 0);
        _WrappedImportKey_enclaveSignature.set(this, void 0);
        _WrappedImportKey_suite.set(this, void 0);
        _WrappedImportKey_senderContextParams.set(this, void 0);
        __classPrivateFieldSet(this, _WrappedImportKey_publicKey, (0, cubesigner_sdk_1.decodeBase64)(resp.public_key), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_skEnc, (0, cubesigner_sdk_1.decodeBase64)(resp.sk_enc), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_dkEnc, (0, cubesigner_sdk_1.decodeBase64)(resp.dk_enc), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_expEpochSeconds, BigInt(resp.expires), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_enclaveAttestation, (0, cubesigner_sdk_1.decodeBase64)(resp.enclave_attestation), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_enclaveSignature, (0, cubesigner_sdk_1.decodeBase64)(resp.enclave_signature), "f");
        __classPrivateFieldSet(this, _WrappedImportKey_suite, suite, "f");
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
    static async createAndVerify(resp, subtle, pcr8Expect = CUBIST_EIF_SIGNING_PK) {
        const suite = new core_1.CipherSuite({
            kem: new core_1.DhkemP384HkdfSha384(),
            kdf: new core_1.HkdfSha384(),
            aead: new core_1.Aes256Gcm(),
        });
        const wik = new WrappedImportKey(resp, suite);
        const info = await __classPrivateFieldGet(wik, _WrappedImportKey_instances, "m", _WrappedImportKey_verifyImportKey).call(wik, subtle, pcr8Expect);
        const recipientPublicKey = await suite.kem.importKey("raw", __classPrivateFieldGet(wik, _WrappedImportKey_publicKey, "f"), true);
        __classPrivateFieldSet(wik, _WrappedImportKey_senderContextParams, { recipientPublicKey, info }, "f");
        return wik;
    }
    /**
     * Returns `true` if this WrappedImportKey needs to be refreshed.
     *
     * @returns True just if this key needs to be refreshed.
     */
    needsRefresh() {
        // force refresh if we're within WIK_REFRESH_EARLY_MILLIS of the expiration
        return (0, util_1.nowEpochMillis)() + exports.WIK_REFRESH_EARLY_MILLIS > __classPrivateFieldGet(this, _WrappedImportKey_expEpochSeconds, "f") * 1000n;
    }
    /**
     * Encrypt `data` using HPKE to this import key.
     *
     * @param data The plaintext to encrypt.
     * @returns The base64-encoded HPKE encapsulated key (`enc`) and ciphertext.
     */
    async encrypt(data) {
        // Safe: `WrappedImportKey` can only be constructed through `createAndVerify`, which always
        // sets `#senderContextParams`
        const params = __classPrivateFieldGet(this, _WrappedImportKey_senderContextParams, "f");
        const sender = await __classPrivateFieldGet(this, _WrappedImportKey_suite, "f").createSenderContext(params);
        return {
            enc: (0, cubesigner_sdk_1.encodeToBase64)(sender.enc),
            ciphertext: (0, cubesigner_sdk_1.encodeToBase64)(await sender.seal(data)),
        };
    }
    /**
     * Return the import key fields, for use in import requests.
     *
     * @returns The import key fields.
     */
    toImportKey() {
        return {
            public_key: (0, cubesigner_sdk_1.encodeToBase64)(__classPrivateFieldGet(this, _WrappedImportKey_publicKey, "f")),
            sk_enc: (0, cubesigner_sdk_1.encodeToBase64)(__classPrivateFieldGet(this, _WrappedImportKey_skEnc, "f")),
            dk_enc: (0, cubesigner_sdk_1.encodeToBase64)(__classPrivateFieldGet(this, _WrappedImportKey_dkEnc, "f")),
            expires: Number(__classPrivateFieldGet(this, _WrappedImportKey_expEpochSeconds, "f")),
        };
    }
}
exports.WrappedImportKey = WrappedImportKey;
_WrappedImportKey_publicKey = new WeakMap(), _WrappedImportKey_skEnc = new WeakMap(), _WrappedImportKey_dkEnc = new WeakMap(), _WrappedImportKey_expEpochSeconds = new WeakMap(), _WrappedImportKey_enclaveAttestation = new WeakMap(), _WrappedImportKey_enclaveSignature = new WeakMap(), _WrappedImportKey_suite = new WeakMap(), _WrappedImportKey_senderContextParams = new WeakMap(), _WrappedImportKey_instances = new WeakSet(), _WrappedImportKey_verifyImportKey = 
/**
 * Verify this wrapped import key.
 *
 * @param subtle An instance of SubtleCrypto used for verification.
 * @param pcr8Expect The expected PCR8 value, or `null` to skip the check.
 * @returns The SHA-256 hash of the signed data, for use as the HPKE `info` parameter.
 */
async function _WrappedImportKey_verifyImportKey(subtle, pcr8Expect) {
    // check expiration date
    if ((0, util_1.nowEpochMillis)() >= __classPrivateFieldGet(this, _WrappedImportKey_expEpochSeconds, "f") * 1000n) {
        throw new Error("Import key is expired");
    }
    const signingKey = await verifyAttestationKey(__classPrivateFieldGet(this, _WrappedImportKey_enclaveAttestation, "f"), pcr8Expect);
    // we use subtlecrypto's impl of RSA-PSS verification
    const rsaPssKeyParams = { name: "RSA-PSS", hash: "SHA-256" };
    const pubkey = await subtle.importKey("spki", signingKey, rsaPssKeyParams, true, ["verify"]);
    const pubkeyAlg = pubkey.algorithm;
    // compute the signing hash and verify the signature
    const message = __classPrivateFieldGet(this, _WrappedImportKey_instances, "m", _WrappedImportKey_signedData).call(this);
    const mlen = Number(BigInt(pubkeyAlg.modulusLength) / 8n);
    const rsaPssParams = { name: "RSA-PSS", saltLength: mlen - 2 - 32 };
    if (!(await subtle.verify(rsaPssParams, pubkey, __classPrivateFieldGet(this, _WrappedImportKey_enclaveSignature, "f"), message))) {
        throw new Error("Import key signature verification failed");
    }
    return subtle.digest("SHA-256", message);
}, _WrappedImportKey_signedData = function _WrappedImportKey_signedData() {
    const parts = [
        // domain separation tag
        (0, util_1.toBigEndian)(BigInt(exports.IMPORT_KEY_SIGNING_DST.length), 2),
        exports.IMPORT_KEY_SIGNING_DST,
        // public key
        (0, util_1.toBigEndian)(BigInt(__classPrivateFieldGet(this, _WrappedImportKey_publicKey, "f").length), 2),
        __classPrivateFieldGet(this, _WrappedImportKey_publicKey, "f"),
        // sk_enc
        (0, util_1.toBigEndian)(BigInt(__classPrivateFieldGet(this, _WrappedImportKey_skEnc, "f").length), 2),
        __classPrivateFieldGet(this, _WrappedImportKey_skEnc, "f"),
        // dk_enc
        (0, util_1.toBigEndian)(BigInt(__classPrivateFieldGet(this, _WrappedImportKey_dkEnc, "f").length), 2),
        __classPrivateFieldGet(this, _WrappedImportKey_dkEnc, "f"),
        // 8-byte big-endian expiration time in seconds since UNIX epoch
        (0, util_1.toBigEndian)(__classPrivateFieldGet(this, _WrappedImportKey_expEpochSeconds, "f"), 8),
    ];
    return (0, util_1.concatArrays)(parts);
};
/**
 * Verifies the attestation key against the AWS Nitro Enclaves signing
 * key and returns the attested signing key.
 *
 * @param attBytes An attestation from an AWS nitro enclave.
 * @param pcr8Expect If non-null, the expected value of PCR8 in the attestation.
 * @returns The signing key that was attested.
 */
async function verifyAttestationKey(attBytes, pcr8Expect) {
    // cbor-x is being imported as ESM, so we must asynchronously import it here.
    // Because we only use that and auth0/cose here, we import both this way.
    const { Sign1 } = await import("@auth0/cose");
    const { decode: cborDecode } = await import("cbor-x");
    x509_1.cryptoProvider.set(await (0, cubesigner_sdk_1.loadCrypto)());
    const att = Sign1.decode(attBytes);
    const attDoc = cborDecode(att.payload);
    // if there's no public key in this attestation, reject
    if (!attDoc.public_key) {
        throw new Error("Attestation did not include a signing public key");
    }
    // if a PCR8 value is expected, verify it matches
    if (pcr8Expect !== null) {
        const pcr8Data = attDoc.pcrs["8"];
        // slice(2) strips "0x" prefix; pcr8Expect is bare hex
        if (!pcr8Data || pcr8Expect !== (0, cubesigner_sdk_1.encodeToHex)(pcr8Data).slice(2)) {
            throw new Error("Attestation was not from an authorized enclave");
        }
    }
    // check expiration date of attestation
    const nowMs = (0, util_1.nowEpochMillis)();
    const latest = nowMs + MAX_ATTESTATION_FUTURE_MINUTES * 60n * 1000n;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid3JhcHBlZF9pbXBvcnRfa2V5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3dyYXBwZWRfaW1wb3J0X2tleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUE0T0Esb0RBcUVDO0FBalRELCtEQVFvQztBQUNwQyxxQ0FBcUY7QUFDckYsaURBQWtEO0FBQ2xELHVEQUFrRDtBQUNsRCx5Q0FJd0I7QUFDeEIsaUNBQW1FO0FBRW5FLHlFQUF5RTtBQUM1RCxRQUFBLHNCQUFzQixHQUFHLElBQUksV0FBVyxFQUFFLENBQUMsTUFBTSxDQUFDLGtDQUFrQyxDQUFDLENBQUM7QUFFbkcsOERBQThEO0FBQ2pELFFBQUEsd0JBQXdCLEdBQUcsTUFBTyxDQUFDO0FBRWhELG1DQUFtQztBQUNuQyxNQUFNLDJCQUEyQixHQUFHLEdBQUcsQ0FBQztBQUN4QyxNQUFNLDhCQUE4QixHQUFHLEVBQUUsQ0FBQztBQUUxQyxxQ0FBcUM7QUFDckMsTUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDO0FBRWpDLHlDQUF5QztBQUN6Qyx5RUFBeUU7QUFDekUsRUFBRTtBQUNGLCtEQUErRDtBQUMvRCxvRUFBb0U7QUFDcEUsTUFBTSxXQUFXLEdBQ2YsMHNCQUEwc0IsQ0FBQztBQUU3c0Isb0VBQW9FO0FBQ3BFLHNCQUFzQjtBQUN0QixNQUFNLHFCQUFxQixHQUN6QixrR0FBa0csQ0FBQztBQVFyRzs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBVTNCOzs7OztPQUtHO0lBQ0gsWUFBb0IsSUFBdUIsRUFBRSxLQUFrQjs7UUFmdEQsOENBQXVCO1FBQ3ZCLDBDQUFtQjtRQUNuQiwwQ0FBbUI7UUFDbkIsb0RBQXlCO1FBQ3pCLHVEQUFnQztRQUNoQyxxREFBOEI7UUFDOUIsMENBQW9CO1FBQzdCLHdEQUE0RTtRQVMxRSx1QkFBQSxJQUFJLCtCQUFjLElBQUEsNkJBQVksRUFBQyxJQUFJLENB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LEVBQUUsQ0FBQztRQUMxRCwyQ0FBMkM7UUFDM0MsTUFBTSxJQUFJLEtBQUssQ0FBQyxzREFBc0QsQ0FBQyxDQUFDO0lBQzFFLENBQUM7SUFFRCxvRUFBb0U7SUFDcEUscUNBQXFDO0lBQ3JDLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxNQUFNLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO0lBRXhDLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQztBQUMzQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgZGVjb2RlQmFzZTY0LFxuICBlbmNvZGVUb0Jhc2U2NCxcbiAgZW5jb2RlVG9IZXgsXG4gIGxvYWRDcnlwdG8sXG4gIHR5cGUgQ3JlYXRlS2V5SW1wb3J0S2V5UmVzcG9uc2UsXG4gIHR5cGUgQ3JlYXRlUG9saWN5SW1wb3J0S2V5UmVzcG9uc2UsXG4gIHR5cGUgS2V5SW1wb3J0S2V5IGFzIEltcG9ydEtleSxcbn0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBDaXBoZXJTdWl0ZSwgQWVzMjU2R2NtLCBIa2RmU2hhMzg0LCBEaGtlbVAzODRIa2RmU2hhMzg0IH0gZnJvbSBcIkBocGtlL2NvcmVcIjtcbmltcG9ydCB7IEVDUGFyYW1ldGVycyB9IGZyb20gXCJAcGVjdWxpYXIvYXNuMS1lY2NcIjtcbmltcG9ydCB7IEFzblBhcnNlciB9IGZyb20gXCJAcGVjdWxpYXIvYXNuMS1zY2hlbWFcIjtcbmltcG9ydCB7XG4gIEFsZ29yaXRobVByb3ZpZGVyLFxuICBYNTA5Q2VydGlmaWNhdGUsXG4gIGNyeXB0b1Byb3ZpZGVyIGFzIHg1MDlDcnlwdG9Qcm92aWRlcixcbn0gZnJvbSBcIkBwZWN1bGlhci94NTA5XCI7XG5pbXBvcnQgeyB0b0JpZ0VuZGlhbiwgY29uY2F0QXJyYXlzLCBub3dFcG9jaE1pbGxpcyB9IGZyb20gXCIuL3V0aWxcIjtcblxuLy8gZG9tYWluLXNlcGFyYXRpb24gdGFnIHVzZWQgd2hlbiBnZW5lcmF0aW5nIHNpZ25pbmcgaGFzaCBmb3IgaW1wb3J0IGtleVxuZXhwb3J0IGNvbnN0IElNUE9SVF9LRVlfU0lHTklOR19EU1QgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJDVUJFU0lHTkVSX0VQSEVNRVJBTF9JTVBPUlRfUDM4NFwiKTtcblxuLy8gaG93IGVhcmx5IHRvIHJlZnJlc2ggYSB3cmFwcGVkIGltcG9ydCBrZXkgYmVmb3JlIGl0IGV4cGlyZXNcbmV4cG9ydCBjb25zdCBXSUtfUkVGUkVTSF9FQVJMWV9NSUxMSVMgPSA2MF8wMDBuO1xuXG4vLyBhdHRlc3RhdGlvbiBkb2N1bWVudCBzbGFjayB0aW1lc1xuY29uc3QgTUFYX0FUVEVTVEFUSU9OX0FHRV9NSU5VVEVTID0gMTVuO1xuY29uc3QgTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTID0gNW47XG5cbi8vIE9JRHMgZm9yIGVsbGlwdGljIGN1cnZlIFg1MDkgY2VydHNcbmNvbnN0IEVDX1BVQkxJQ19LRVkgPSBcIjEuMi44NDAuMTAwNDUuMi4xXCI7XG5jb25zdCBOSVNUX1AzODQgPSBcIjEuMy4xMzIuMC4zNFwiO1xuXG4vLyBBV1MgTml0cm8gRW5jbGF2ZXMgcm9vdCBDQSBjZXJ0aWZpY2F0ZVxuLy8gaHR0cHM6Ly9hd3Mtbml0cm8tZW5jbGF2ZXMuYW1hem9uYXdzLmNvbS9BV1NfTml0cm9FbmNsYXZlc19Sb290LUcxLnppcFxuLy9cbi8vIFNlZSB0aGUgZG9jdW1lbnRhdGlvbiBhYm91dCBBV1MgTml0cm8gRW5jbGF2ZXMgdmVyaWZpY2F0aW9uOlxuLy8gaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2VuY2xhdmVzL2xhdGVzdC91c2VyL3ZlcmlmeS1yb290Lmh0bWxcbmNvbnN0IEFXU19DQV9DRVJUID1cbiAgXCJNSUlDRVRDQ0FaYWdBd0lCQWdJUkFQa3hkV2dia0svaEhVYk10T1RuK0ZZd0NnWUlLb1pJemowRUF3TXdTVEVMTUFrR0ExVUVCaE1DVlZNeER6QU5CZ05WQkFvTUJrRnRZWHB2YmpFTU1Bb0dBMVVFQ3d3RFFWZFRNUnN3R1FZRFZRUUREQkpoZDNNdWJtbDBjbTh0Wlc1amJHRjJaWE13SGhjTk1Ua3hNREk0TVRNeU9EQTFXaGNOTkRreE1ESTRNVFF5T0RBMVdqQkpNUXN3Q1FZRFZRUUdFd0pWVXpFUE1BMEdBMVVFQ2d3R1FXMWhlbTl1TVF3d0NnWURWUVFMREFOQlYxTXhHekFaQmdOVkJBTU1FbUYzY3k1dWFYUnlieTFsYm1Oc1lYWmxjekIyTUJBR0J5cUdTTTQ5QWdFR0JTdUJCQUFpQTJJQUJQd0NWT3VtQ01IemFIRGltdHFRdmtZNE1wSnpib2xMLy9aeTJZbEVTMUJSNVRTa3NmYmI0OEM4V0JveXQ3RjJCdzdlRXRhYVArb2hHMmJuVXM5OTBkMEpYMjhUY1BRWENFUFozQkFCSWVUUFl3RW9DV1pFaDhsNVlvUXdUY1UvOUtOQ01FQXdEd1lEVlIwVEFRSC9CQVV3QXdFQi96QWRCZ05WSFE0RUZnUVVrQ1cxRGRrRlIrZVd3NWI2Y3AzUG1hbmZTNVl3RGdZRFZSMFBBUUgvQkFRREFnR0dNQW9HQ0NxR1NNNDlCQU1EQTJrQU1HWUNNUUNqZnkrUm9jbTlYdWU0WW53V21OSlZBNDRmQTBQNVcyT3BZb3c5T1lDVlJhRWV2TDh1TzFYWXJ1NXh0TVBXcmZNQ01RQ2k4NXNXQmJKd0tLWGRTNkJwdFFGdVpiVDczby9nQmgxcVV4bC9uTnIxMlVPOFlmd3I2d1BMYis2Tkl3THozL1k9XCI7XG5cbi8vIEN1YmlzdCBlbmNsYXZlLXNpZ25pbmcga2V5LiBBbGwgdmFsaWQgYXR0ZXN0YXRpb25zIHdpbGwgaGF2ZSB0aGlzXG4vLyBwdWJsaWMga2V5IGluIFBDUjguXG5jb25zdCBDVUJJU1RfRUlGX1NJR05JTkdfUEsgPVxuICBcIjJlNmQwNDMwYzhiMGI3ODMxNjIzNmQwM2NkYTI5OTY0NDllMjQwOTZiM2Y1YjUyNDAzMWYxMmVlYjVmYzE5YTE5ZGI1MjJhODQ2ZTYyNDBhNWYzNmYyNjU5MTg5MGFjNFwiO1xuXG4vKipcbiAqIEFuIGltcG9ydC1rZXkgcmVzcG9uc2Ugd2l0aCBlbmNsYXZlIGF0dGVzdGF0aW9uLCBjb21wYXRpYmxlIHdpdGggYm90aFxuICogYENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlYCBhbmQgYENyZWF0ZVBvbGljeUltcG9ydEtleVJlc3BvbnNlYC5cbiAqL1xuZXhwb3J0IHR5cGUgSW1wb3J0S2V5UmVzcG9uc2UgPSBDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZSAmIENyZWF0ZVBvbGljeUltcG9ydEtleVJlc3BvbnNlO1xuXG4vKipcbiAqIEEgdmVyaWZpZWQgaW1wb3J0IGtleSwgdXNhYmxlIGZvciBIUEtFIGVuY3J5cHRpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBXcmFwcGVkSW1wb3J0S2V5IHtcbiAgcmVhZG9ubHkgI3B1YmxpY0tleTogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgI3NrRW5jOiBVaW50OEFycmF5O1xuICByZWFkb25seSAjZGtFbmM6IFVpbnQ4QXJyYXk7XG4gIHJlYWRvbmx5ICNleHBFcG9jaFNlY29uZHM6IGJpZ2ludDtcbiAgcmVhZG9ubHkgI2VuY2xhdmVBdHRlc3RhdGlvbjogVWludDhBcnJheTtcbiAgcmVhZG9ubHkgI2VuY2xhdmVTaWduYXR1cmU6IFVpbnQ4QXJyYXk7XG4gIHJlYWRvbmx5ICNzdWl0ZTogQ2lwaGVyU3VpdGU7XG4gICNzZW5kZXJDb250ZXh0UGFyYW1zPzogeyByZWNpcGllbnRQdWJsaWNLZXk6IENyeXB0b0tleTsgaW5mbzogQXJyYXlCdWZmZXIgfTtcblxuICAvKipcbiAgICogUHJpdmF0ZSBjb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIHJlc3AgVGhlIGltcG9ydCBrZXkgcmVzcG9uc2UgZnJvbSBDdWJlU2lnbmVyLlxuICAgKiBAcGFyYW0gc3VpdGUgVGhlIEhQS0UgY2lwaGVyc3VpdGUgdG8gdXNlIGZvciBlbmNyeXB0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBjb25zdHJ1Y3RvcihyZXNwOiBJbXBvcnRLZXlSZXNwb25zZSwgc3VpdGU6IENpcGhlclN1aXRlKSB7XG4gICAgdGhpcy4jcHVibGljS2V5ID0gZGVjb2RlQmFzZTY0KHJlc3AucHVibGljX2tleSk7XG4gICAgdGhpcy4jc2tFbmMgPSBkZWNvZGVCYXNlNjQocmVzcC5za19lbmMpO1xuICAgIHRoaXMuI2RrRW5jID0gZGVjb2RlQmFzZTY0KHJlc3AuZGtfZW5jKTtcbiAgICB0aGlzLiNleHBFcG9jaFNlY29uZHMgPSBCaWdJbnQocmVzcC5leHBpcmVzKTtcbiAgICB0aGlzLiNlbmNsYXZlQXR0ZXN0YXRpb24gPSBkZWNvZGVCYXNlNjQocmVzcC5lbmNsYXZlX2F0dGVzdGF0aW9uKTtcbiAgICB0aGlzLiNlbmNsYXZlU2lnbmF0dXJlID0gZGVjb2RlQmFzZTY0KHJlc3AuZW5jbGF2ZV9zaWduYXR1cmUpO1xuICAgIHRoaXMuI3N1aXRlID0gc3VpdGU7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIGFuZCB2ZXJpZnkgYSBgV3JhcHBlZEltcG9ydEtleWAgZnJvbSBhbiBpbXBvcnQta2V5IHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVzcCBUaGUgcmVzcG9uc2UgZnJvbSBDdWJlU2lnbmVyIChrZXkgaW1wb3J0IG9yIHBvbGljeSBpbXBvcnQpLlxuICAgKiBAcGFyYW0gc3VidGxlIEEgU3VidGxlQ3J5cHRvIGluc3RhbmNlIHVzZWQgZm9yIHZlcmlmaWNhdGlvbi5cbiAgICogQHBhcmFtIHBjcjhFeHBlY3QgVGhlIGV4cGVjdGVkIFBDUjggdmFsdWUgKGJhcmUgaGV4KS4gSWYgYG51bGxgLCB0aGUgUENSOCBjaGVjayBpcyBza2lwcGVkLlxuICAgKiAgIERlZmF1bHRzIHRvIHRoZSBDdWJpc3QgZW5jbGF2ZSBzaWduaW5nIGtleSwgd2hpY2ggaXMgY29ycmVjdCBmb3Iga2V5IGltcG9ydHMuXG4gICAqIEByZXR1cm5zIEEgbmV3bHkgY29uc3RydWN0ZWQsIHZlcmlmaWVkIGluc3RhbmNlLlxuICAgKi9cbiAgcHVibGljIHN0YXRpYyBhc3luYyBjcmVhdGVBbmRWZXJpZnkoXG4gICAgcmVzcDogSW1wb3J0S2V5UmVzcG9uc2UsXG4gICAgc3VidGxlOiBTdWJ0bGVDcnlwdG8sXG4gICAgcGNyOEV4cGVjdDogc3RyaW5nIHwgbnVsbCA9IENVQklTVF9FSUZfU0lHTklOR19QSyxcbiAgKTogUHJvbWlzZTxXcmFwcGVkSW1wb3J0S2V5PiB7XG4gICAgY29uc3Qgc3VpdGUgPSBuZXcgQ2lwaGVyU3VpdGUoe1xuICAgICAga2VtOiBuZXcgRGhrZW1QMzg0SGtkZlNoYTM4NCgpLFxuICAgICAga2RmOiBuZXcgSGtkZlNoYTM4NCgpLFxuICAgICAgYWVhZDogbmV3IEFlczI1NkdjbSgpLFxuICAgIH0pO1xuICAgIGNvbnN0IHdpayA9IG5ldyBXcmFwcGVkSW1wb3J0S2V5KHJlc3AsIHN1aXRlKTtcbiAgICBjb25zdCBpbmZvID0gYXdhaXQgd2lrLiN2ZXJpZnlJbXBvcnRLZXkoc3VidGxlLCBwY3I4RXhwZWN0KTtcbiAgICBjb25zdCByZWNpcGllbnRQdWJsaWNLZXkgPSBhd2FpdCBzdWl0ZS5rZW0uaW1wb3J0S2V5KFwicmF3XCIsIHdpay4jcHVibGljS2V5LCB0cnVlKTtcbiAgICB3aWsuI3NlbmRlckNvbnRleHRQYXJhbXMgPSB7IHJlY2lwaWVudFB1YmxpY0tleSwgaW5mbyB9O1xuICAgIHJldHVybiB3aWs7XG4gIH1cblxuICAvKipcbiAgICogVmVyaWZ5IHRoaXMgd3JhcHBlZCBpbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gc3VidGxlIEFuIGluc3RhbmNlIG9mIFN1YnRsZUNyeXB0byB1c2VkIGZvciB2ZXJpZmljYXRpb24uXG4gICAqIEBwYXJhbSBwY3I4RXhwZWN0IFRoZSBleHBlY3RlZCBQQ1I4IHZhbHVlLCBvciBgbnVsbGAgdG8gc2tpcCB0aGUgY2hlY2suXG4gICAqIEByZXR1cm5zIFRoZSBTSEEtMjU2IGhhc2ggb2YgdGhlIHNpZ25lZCBkYXRhLCBmb3IgdXNlIGFzIHRoZSBIUEtFIGBpbmZvYCBwYXJhbWV0ZXIuXG4gICAqL1xuICBhc3luYyAjdmVyaWZ5SW1wb3J0S2V5KHN1YnRsZTogU3VidGxlQ3J5cHRvLCBwY3I4RXhwZWN0OiBzdHJpbmcgfCBudWxsKTogUHJvbWlzZTxBcnJheUJ1ZmZlcj4ge1xuICAgIC8vIGNoZWNrIGV4cGlyYXRpb24gZGF0ZVxuICAgIGlmIChub3dFcG9jaE1pbGxpcygpID49IHRoaXMuI2V4cEVwb2NoU2Vjb25kcyAqIDEwMDBuKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbXBvcnQga2V5IGlzIGV4cGlyZWRcIik7XG4gICAgfVxuXG4gICAgY29uc3Qgc2lnbmluZ0tleSA9IGF3YWl0IHZlcmlmeUF0dGVzdGF0aW9uS2V5KHRoaXMuI2VuY2xhdmVBdHRlc3RhdGlvbiwgcGNyOEV4cGVjdCk7XG5cbiAgICAvLyB3ZSB1c2Ugc3VidGxlY3J5cHRvJ3MgaW1wbCBvZiBSU0EtUFNTIHZlcmlmaWNhdGlvblxuICAgIGNvbnN0IHJzYVBzc0tleVBhcmFtcyA9IHsgbmFtZTogXCJSU0EtUFNTXCIsIGhhc2g6IFwiU0hBLTI1NlwiIH07XG4gICAgY29uc3QgcHVia2V5ID0gYXdhaXQgc3VidGxlLmltcG9ydEtleShcInNwa2lcIiwgc2lnbmluZ0tleSwgcnNhUHNzS2V5UGFyYW1zLCB0cnVlLCBbXCJ2ZXJpZnlcIl0pO1xuICAgIGNvbnN0IHB1YmtleUFsZyA9IHB1YmtleS5hbGdvcml0aG0gYXMgdW5rbm93biBhcyB7IG1vZHVsdXNMZW5ndGg6IG51bWJlciB9O1xuXG4gICAgLy8gY29tcHV0ZSB0aGUgc2lnbmluZyBoYXNoIGFuZCB2ZXJpZnkgdGhlIHNpZ25hdHVyZVxuICAgIGNvbnN0IG1lc3NhZ2UgPSB0aGlzLiNzaWduZWREYXRhKCk7XG4gICAgY29uc3QgbWxlbiA9IE51bWJlcihCaWdJbnQocHVia2V5QWxnLm1vZHVsdXNMZW5ndGgpIC8gOG4pO1xuICAgIGNvbnN0IHJzYVBzc1BhcmFtcyA9IHsgbmFtZTogXCJSU0EtUFNTXCIsIHNhbHRMZW5ndGg6IG1sZW4gLSAyIC0gMzIgfTtcblxuICAgIGlmICghKGF3YWl0IHN1YnRsZS52ZXJpZnkocnNhUHNzUGFyYW1zLCBwdWJrZXksIHRoaXMuI2VuY2xhdmVTaWduYXR1cmUsIG1lc3NhZ2UpKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW1wb3J0IGtleSBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIGZhaWxlZFwiKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgbWVzc2FnZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBgdHJ1ZWAgaWYgdGhpcyBXcmFwcGVkSW1wb3J0S2V5IG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cbiAgICpcbiAgICogQHJldHVybnMgVHJ1ZSBqdXN0IGlmIHRoaXMga2V5IG5lZWRzIHRvIGJlIHJlZnJlc2hlZC5cbiAgICovXG4gIHB1YmxpYyBuZWVkc1JlZnJlc2goKTogYm9vbGVhbiB7XG4gICAgLy8gZm9yY2UgcmVmcmVzaCBpZiB3ZSdyZSB3aXRoaW4gV0lLX1JFRlJFU0hfRUFSTFlfTUlMTElTIG9mIHRoZSBleHBpcmF0aW9uXG4gICAgcmV0dXJuIG5vd0Vwb2NoTWlsbGlzKCkgKyBXSUtfUkVGUkVTSF9FQVJMWV9NSUxMSVMgPiB0aGlzLiNleHBFcG9jaFNlY29uZHMgKiAxMDAwbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgc2lnbmluZyBoYXNoIGZvciB0aGlzIGltcG9ydCBrZXkuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBieXRlcyBvdmVyIHdoaWNoIHRoZSBlbmNsYXZlIHNpZ25hdHVyZSB3YXMgY29tcHV0ZWQuXG4gICAqL1xuICAjc2lnbmVkRGF0YSgpOiBVaW50OEFycmF5IHtcbiAgICBjb25zdCBwYXJ0cyA9IFtcbiAgICAgIC8vIGRvbWFpbiBzZXBhcmF0aW9uIHRhZ1xuICAgICAgdG9CaWdFbmRpYW4oQmlnSW50KElNUE9SVF9LRVlfU0lHTklOR19EU1QubGVuZ3RoKSwgMiksXG4gICAgICBJTVBPUlRfS0VZX1NJR05JTkdfRFNULFxuXG4gICAgICAvLyBwdWJsaWMga2V5XG4gICAgICB0b0JpZ0VuZGlhbihCaWdJbnQodGhpcy4jcHVibGljS2V5Lmxlbmd0aCksIDIpLFxuICAgICAgdGhpcy4jcHVibGljS2V5LFxuXG4gICAgICAvLyBza19lbmNcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludCh0aGlzLiNza0VuYy5sZW5ndGgpLCAyKSxcbiAgICAgIHRoaXMuI3NrRW5jLFxuXG4gICAgICAvLyBka19lbmNcbiAgICAgIHRvQmlnRW5kaWFuKEJpZ0ludCh0aGlzLiNka0VuYy5sZW5ndGgpLCAyKSxcbiAgICAgIHRoaXMuI2RrRW5jLFxuXG4gICAgICAvLyA4LWJ5dGUgYmlnLWVuZGlhbiBleHBpcmF0aW9uIHRpbWUgaW4gc2Vjb25kcyBzaW5jZSBVTklYIGVwb2NoXG4gICAgICB0b0JpZ0VuZGlhbih0aGlzLiNleHBFcG9jaFNlY29uZHMsIDgpLFxuICAgIF07XG5cbiAgICByZXR1cm4gY29uY2F0QXJyYXlzKHBhcnRzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0IGBkYXRhYCB1c2luZyBIUEtFIHRvIHRoaXMgaW1wb3J0IGtleS5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIHBsYWludGV4dCB0byBlbmNyeXB0LlxuICAgKiBAcmV0dXJucyBUaGUgYmFzZTY0LWVuY29kZWQgSFBLRSBlbmNhcHN1bGF0ZWQga2V5IChgZW5jYCkgYW5kIGNpcGhlcnRleHQuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgZW5jcnlwdChkYXRhOiBVaW50OEFycmF5KTogUHJvbWlzZTx7IGVuYzogc3RyaW5nOyBjaXBoZXJ0ZXh0OiBzdHJpbmcgfT4ge1xuICAgIC8vIFNhZmU6IGBXcmFwcGVkSW1wb3J0S2V5YCBjYW4gb25seSBiZSBjb25zdHJ1Y3RlZCB0aHJvdWdoIGBjcmVhdGVBbmRWZXJpZnlgLCB3aGljaCBhbHdheXNcbiAgICAvLyBzZXRzIGAjc2VuZGVyQ29udGV4dFBhcmFtc2BcbiAgICBjb25zdCBwYXJhbXMgPSB0aGlzLiNzZW5kZXJDb250ZXh0UGFyYW1zITtcbiAgICBjb25zdCBzZW5kZXIgPSBhd2FpdCB0aGlzLiNzdWl0ZS5jcmVhdGVTZW5kZXJDb250ZXh0KHBhcmFtcyk7XG4gICAgcmV0dXJuIHtcbiAgICAgIGVuYzogZW5jb2RlVG9CYXNlNjQoc2VuZGVyLmVuYyksXG4gICAgICBjaXBoZXJ0ZXh0OiBlbmNvZGVUb0Jhc2U2NChhd2FpdCBzZW5kZXIuc2VhbChkYXRhKSksXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm4gdGhlIGltcG9ydCBrZXkgZmllbGRzLCBmb3IgdXNlIGluIGltcG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGltcG9ydCBrZXkgZmllbGRzLlxuICAgKi9cbiAgcHVibGljIHRvSW1wb3J0S2V5KCk6IEltcG9ydEtleSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHB1YmxpY19rZXk6IGVuY29kZVRvQmFzZTY0KHRoaXMuI3B1YmxpY0tleSksXG4gICAgICBza19lbmM6IGVuY29kZVRvQmFzZTY0KHRoaXMuI3NrRW5jKSxcbiAgICAgIGRrX2VuYzogZW5jb2RlVG9CYXNlNjQodGhpcy4jZGtFbmMpLFxuICAgICAgZXhwaXJlczogTnVtYmVyKHRoaXMuI2V4cEVwb2NoU2Vjb25kcyksXG4gICAgfTtcbiAgfVxufVxuXG4vKlxuICogQW4gQVdTIE5pdHJvIGF0dGVzdGF0aW9uIGRvY3VtZW50XG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3Mtbml0cm8tZW5jbGF2ZXMtbnNtLWFwaS9ibG9iLzRiODUxZjMwMDZjNmZhOThmMjNkY2ZmYjJjYmEwM2IzOWRlOWI4YWYvc3JjL2FwaS9tb2QucnMjTDIwOFxuICovXG50eXBlIEF0dGVzdGF0aW9uRG9jID0ge1xuICBtb2R1bGVfaWQ6IHN0cmluZztcbiAgZGlnZXN0OiBcIlNIQTI1NlwiIHwgXCJTSEEzODRcIiB8IFwiU0hBNTEyXCI7XG4gIHRpbWVzdGFtcDogYmlnaW50O1xuICBwY3JzOiB7IFtwY3I6IHN0cmluZ106IFVpbnQ4QXJyYXkgfTtcbiAgY2VydGlmaWNhdGU6IFVpbnQ4QXJyYXk7XG4gIGNhYnVuZGxlOiBVaW50OEFycmF5W107XG4gIHB1YmxpY19rZXk/OiBVaW50OEFycmF5O1xuICB1c2VyX2RhdGE/OiBVaW50OEFycmF5O1xuICBub25jZT86IFVpbnQ4QXJyYXk7XG59O1xuXG4vKipcbiAqIFZlcmlmaWVzIHRoZSBhdHRlc3RhdGlvbiBrZXkgYWdhaW5zdCB0aGUgQVdTIE5pdHJvIEVuY2xhdmVzIHNpZ25pbmdcbiAqIGtleSBhbmQgcmV0dXJucyB0aGUgYXR0ZXN0ZWQgc2lnbmluZyBrZXkuXG4gKlxuICogQHBhcmFtIGF0dEJ5dGVzIEFuIGF0dGVzdGF0aW9uIGZyb20gYW4gQVdTIG5pdHJvIGVuY2xhdmUuXG4gKiBAcGFyYW0gcGNyOEV4cGVjdCBJZiBub24tbnVsbCwgdGhlIGV4cGVjdGVkIHZhbHVlIG9mIFBDUjggaW4gdGhlIGF0dGVzdGF0aW9uLlxuICogQHJldHVybnMgVGhlIHNpZ25pbmcga2V5IHRoYXQgd2FzIGF0dGVzdGVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdmVyaWZ5QXR0ZXN0YXRpb25LZXkoXG4gIGF0dEJ5dGVzOiBVaW50OEFycmF5LFxuICBwY3I4RXhwZWN0OiBzdHJpbmcgfCBudWxsLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIC8vIGNib3IteCBpcyBiZWluZyBpbXBvcnRlZCBhcyBFU00sIHNvIHdlIG11c3QgYXN5bmNocm9ub3VzbHkgaW1wb3J0IGl0IGhlcmUuXG4gIC8vIEJlY2F1c2Ugd2Ugb25seSB1c2UgdGhhdCBhbmQgYXV0aDAvY29zZSBoZXJlLCB3ZSBpbXBvcnQgYm90aCB0aGlzIHdheS5cbiAgY29uc3QgeyBTaWduMSB9ID0gYXdhaXQgaW1wb3J0KFwiQGF1dGgwL2Nvc2VcIik7XG4gIGNvbnN0IHsgZGVjb2RlOiBjYm9yRGVjb2RlIH0gPSBhd2FpdCBpbXBvcnQoXCJjYm9yLXhcIik7XG5cbiAgeDUwOUNyeXB0b1Byb3ZpZGVyLnNldChhd2FpdCBsb2FkQ3J5cHRvKCkpO1xuXG4gIGNvbnN0IGF0dCA9IFNpZ24xLmRlY29kZShhdHRCeXRlcyk7XG4gIGNvbnN0IGF0dERvYyA9IGNib3JEZWNvZGUoYXR0LnBheWxvYWQpIGFzIEF0dGVzdGF0aW9uRG9jO1xuXG4gIC8vIGlmIHRoZXJlJ3Mgbm8gcHVibGljIGtleSBpbiB0aGlzIGF0dGVzdGF0aW9uLCByZWplY3RcbiAgaWYgKCFhdHREb2MucHVibGljX2tleSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGRpZCBub3QgaW5jbHVkZSBhIHNpZ25pbmcgcHVibGljIGtleVwiKTtcbiAgfVxuXG4gIC8vIGlmIGEgUENSOCB2YWx1ZSBpcyBleHBlY3RlZCwgdmVyaWZ5IGl0IG1hdGNoZXNcbiAgaWYgKHBjcjhFeHBlY3QgIT09IG51bGwpIHtcbiAgICBjb25zdCBwY3I4RGF0YSA9IGF0dERvYy5wY3JzW1wiOFwiXTtcbiAgICAvLyBzbGljZSgyKSBzdHJpcHMgXCIweFwiIHByZWZpeDsgcGNyOEV4cGVjdCBpcyBiYXJlIGhleFxuICAgIGlmICghcGNyOERhdGEgfHwgcGNyOEV4cGVjdCAhPT0gZW5jb2RlVG9IZXgocGNyOERhdGEpLnNsaWNlKDIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiB3YXMgbm90IGZyb20gYW4gYXV0aG9yaXplZCBlbmNsYXZlXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNoZWNrIGV4cGlyYXRpb24gZGF0ZSBvZiBhdHRlc3RhdGlvblxuICBjb25zdCBub3dNcyA9IG5vd0Vwb2NoTWlsbGlzKCk7XG4gIGNvbnN0IGxhdGVzdCA9IG5vd01zICsgTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTICogNjBuICogMTAwMG47XG4gIGNvbnN0IGVhcmxpZXN0ID1cbiAgICBsYXRlc3QgLSAoTUFYX0FUVEVTVEFUSU9OX0ZVVFVSRV9NSU5VVEVTICsgTUFYX0FUVEVTVEFUSU9OX0FHRV9NSU5VVEVTKSAqIDYwbiAqIDEwMDBuO1xuICBpZiAoYXR0RG9jLnRpbWVzdGFtcCA8IGVhcmxpZXN0IHx8IGF0dERvYy50aW1lc3RhbXAgPiBsYXRlc3QpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBpcyBleHBpcmVkXCIpO1xuICB9XG5cbiAgLy8gVmVyaWZ5IGNlcnRpZmljYXRlIGNoYWluIHN0YXJ0aW5nIHdpdGggQVdTIE5pdHJvIENBIGNlcnRcbiAgbGV0IHBhcmVudCA9IG5ldyBYNTA5Q2VydGlmaWNhdGUoQVdTX0NBX0NFUlQpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dERvYy5jYWJ1bmRsZS5sZW5ndGg7ICsraSkge1xuICAgIGNvbnN0IGNlcnQgPSBuZXcgWDUwOUNlcnRpZmljYXRlKGF0dERvYy5jYWJ1bmRsZVtpXSk7XG4gICAgaWYgKCEoYXdhaXQgY2VydC52ZXJpZnkocGFyZW50KSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXR0ZXN0YXRpb24gY2VydGlmaWNhdGUgY2hhaW4gZmFpbGVkIGF0IGluZGV4ICR7aX1gKTtcbiAgICB9XG4gICAgcGFyZW50ID0gY2VydDtcbiAgfVxuICBjb25zdCBjZXJ0ID0gbmV3IFg1MDlDZXJ0aWZpY2F0ZShhdHREb2MuY2VydGlmaWNhdGUpO1xuICBpZiAoIShhd2FpdCBjZXJ0LnZlcmlmeShwYXJlbnQpKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihcIkF0dGVzdGF0aW9uIGNlcnRpZmljYXRlIGNoYWluIGZhaWxlZCBhdCBsZWFmXCIpO1xuICB9XG4gIGNvbnN0IHB1YmtleSA9IGNlcnQucHVibGljS2V5O1xuXG4gIC8vIG1ha2Ugc3VyZSB0aGF0IHdlIGdvdCB0aGUgZXhwZWN0ZWQgcHVibGljIGtleSB0eXBlXG4gIGNvbnN0IGFsZyA9IG5ldyBBbGdvcml0aG1Qcm92aWRlcigpLnRvQXNuQWxnb3JpdGhtKHB1YmtleS5hbGdvcml0aG0pO1xuICBpZiAoYWxnLmFsZ29yaXRobSAhPSBFQ19QVUJMSUNfS0VZKSB7XG4gICAgLy8gbm90IHRoZSBleHBlY3RlZCBhbGdvcml0aG0sIGkuZS4sIGVsbGlwdGljIGN1cnZlIHNpZ25pbmdcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBjb250YWluZWQgdW5leHBlY3RlZCBzaWduYXR1cmUgYWxnb3JpdGhtXCIpO1xuICB9XG4gIGNvbnN0IHBhcmFtcyA9IEFzblBhcnNlci5wYXJzZShhbGcucGFyYW1ldGVycyEsIEVDUGFyYW1ldGVycyk7XG4gIGlmICghcGFyYW1zLm5hbWVkQ3VydmUgfHwgcGFyYW1zLm5hbWVkQ3VydmUgIT09IE5JU1RfUDM4NCkge1xuICAgIC8vIG5vdCB0aGUgZXhwZWN0ZWQgcGFyYW1zLCBpLmUuLCBOSVNUIFAzODRcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJBdHRlc3RhdGlvbiBjb250YWluZWQgdW5leHBlY3RlZCBzaWduYXR1cmUgYWxnb3JpdGhtXCIpO1xuICB9XG5cbiAgLy8gdmVyaWZ5IHRoZSBjb3NlIHNpZ25hdHVyZSB3aXRoIHRoZSBrZXksIHdoaWNoIHdlIHZlcmlmaWVkIGFnYWluc3RcbiAgLy8gdGhlIEFXUyBOaXRybyBDQSBjZXJ0aWZpY2F0ZSBhYm92ZVxuICBhd2FpdCBhdHQudmVyaWZ5KGF3YWl0IHB1YmtleS5leHBvcnQoKSk7XG5cbiAgcmV0dXJuIGF0dERvYy5wdWJsaWNfa2V5O1xufVxuIl19