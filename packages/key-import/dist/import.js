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
var _KeyImporter_instances, _KeyImporter_wrappedImportKey, _KeyImporter_cs, _KeyImporter_getWrappedImportKey, _KeyImporter_importPackages;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyImporter = void 0;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const mnemonic_1 = require("./mnemonic");
const raw_1 = require("./raw");
const wrapped_import_key_1 = require("./wrapped_import_key");
// Maximum number of keys to import in a single API call
const MAX_IMPORTS_PER_API_CALL = 32n;
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
        _KeyImporter_cs.set(this, void 0);
        __classPrivateFieldSet(this, _KeyImporter_cs, cs, "f");
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
_KeyImporter_wrappedImportKey = new WeakMap(), _KeyImporter_cs = new WeakMap(), _KeyImporter_instances = new WeakSet(), _KeyImporter_getWrappedImportKey = 
/**
 * Check that the wrapped import key is unexpired and verified. Otherwise,
 * request a new one and verify it.
 *
 * @returns The current verified wrapped import key.
 */
async function _KeyImporter_getWrappedImportKey() {
    if (!__classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f") || __classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f").needsRefresh()) {
        const resp = await __classPrivateFieldGet(this, _KeyImporter_cs, "f").createKeyImportKey();
        const subtle = await (0, cubesigner_sdk_1.loadSubtleCrypto)();
        __classPrivateFieldSet(this, _KeyImporter_wrappedImportKey, await wrapped_import_key_1.WrappedImportKey.createAndVerify(resp, subtle), "f");
    }
    return __classPrivateFieldGet(this, _KeyImporter_wrappedImportKey, "f");
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
        // - all encryptions in a given request must use the same import key, and
        //
        // - when importing a huge number of keys the import pubkey might expire
        //   during the import, so we check for expiration before each request
        const wik = await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_getWrappedImportKey).call(this);
        // next, encrypt this chunk of packages
        const start = Number(MAX_IMPORTS_PER_API_CALL) * i;
        const end = Number(MAX_IMPORTS_PER_API_CALL) + start;
        const key_material = [];
        for (const keyPkg of packages.slice(start, end)) {
            const { enc, ciphertext } = await wik.encrypt(keyPkg);
            // We use an extension of HPKE that allows a salt value to be specified, but it is ok to
            // use an empty salt if the import key is not reused
            key_material.push({ salt: "", client_public_key: enc, ikm_enc: ciphertext });
        }
        // construct the request and send it
        const policy = props?.policy ?? null;
        const req = {
            ...wik.toImportKey(),
            key_type: keyType,
            key_material,
            ...props,
            policy,
        };
        const resp = await __classPrivateFieldGet(this, _KeyImporter_cs, "f").importKeys(req);
        keys.push(...resp);
    }
    return keys;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ltcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFRQSwrREFBOEQ7QUFHOUQseUNBQW1EO0FBQ25ELCtCQUF5QztBQUN6Qyw2REFBd0Q7QUFFeEQsd0RBQXdEO0FBQ3hELE1BQU0sd0JBQXdCLEdBQUcsR0FBRyxDQUFDO0FBRXJDOztHQUVHO0FBQ0gsTUFBYSxXQUFXO0lBSXRCOzs7O09BSUc7SUFDSCxZQUFZLEVBQU87O1FBUm5CLHdDQUE2QyxJQUFJLEVBQUM7UUFDekMsa0NBQVM7UUFRaEIsdUJBQUEsSUFBSSxtQkFBTyxFQUFFLE1BQUEsQ0FBQztJQUNoQixDQUFDO0lBaUJEOzs7Ozs7O09BT0c7SUFDSSxLQUFLLENBQUMsZUFBZSxDQUMxQixPQUFnQixFQUNoQixJQUF3QixFQUN4QixLQUFpQztRQUVqQyxPQUFPLE1BQU0sdUJBQUEsSUFBSSwyREFBZ0IsTUFBcEIsSUFBSSxFQUNmLE9BQU8sRUFDUCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFBLGdDQUFxQixFQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQzdDLEtBQUssQ0FDTixDQUFDO0lBQ0osQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSSxLQUFLLENBQUMsbUJBQW1CLENBQzlCLE9BQWdCLEVBQ2hCLE9BQXFCLEVBQ3JCLEtBQWlDO1FBRWpDLE9BQU8sTUFBTSx1QkFBQSxJQUFJLDJEQUFnQixNQUFwQixJQUFJLEVBQ2YsT0FBTyxFQUNQLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLElBQUEsc0JBQWdCLEVBQUMsR0FBRyxDQUFDLENBQUMsRUFDM0MsS0FBSyxDQUNOLENBQUM7SUFDSixDQUFDO0NBMERGO0FBNUhELGtDQTRIQzs7QUEvR0M7Ozs7O0dBS0c7QUFDSCxLQUFLO0lBQ0gsSUFBSSxDQUFDLHVCQUFBLElBQUkscUNBQWtCLElBQUksdUJBQUEsSUFBSSxxQ0FBa0IsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDO1FBQ3JFLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSx1QkFBSSxDQUFDLGtCQUFrQixFQUFFLENBQUM7UUFDakQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLGlDQUFnQixHQUFFLENBQUM7UUFDeEMsdUJBQUEsSUFBSSxpQ0FBcUIsTUFBTSxxQ0FBZ0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxNQUFBLENBQUM7SUFDaEYsQ0FBQztJQUNELE9BQU8sdUJBQUEsSUFBSSxxQ0FBa0IsQ0FBQztBQUNoQyxDQUFDO0FBMENEOzs7Ozs7O0dBT0c7QUFDSCxLQUFLLHNDQUNILE9BQWdCLEVBQ2hCLFFBQXNCLEVBQ3RCLEtBQWlDO0lBRWpDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FDcEIsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxHQUFHLHdCQUF3QixHQUFHLEVBQUUsQ0FBQyxHQUFHLHdCQUF3QixDQUNyRixDQUFDO0lBQ0YsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWhCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxvRUFBb0U7UUFDcEUsbUVBQW1FO1FBQ25FLHdCQUF3QjtRQUN4QixFQUFFO1FBQ0YseUVBQXlFO1FBQ3pFLEVBQUU7UUFDRix3RUFBd0U7UUFDeEUsc0VBQXNFO1FBQ3RFLE1BQU0sR0FBRyxHQUFHLE1BQU0sdUJBQUEsSUFBSSxnRUFBcUIsTUFBekIsSUFBSSxDQUF1QixDQUFDO1FBRTlDLHVDQUF1QztRQUN2QyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDbkQsTUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLHdCQUF3QixDQUFDLEdBQUcsS0FBSyxDQUFDO1FBQ3JELE1BQU0sWUFBWSxHQUErQixFQUFFLENBQUM7UUFDcEQsS0FBSyxNQUFNLE1BQU0sSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ2hELE1BQU0sRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3RELHdGQUF3RjtZQUN4RixvREFBb0Q7WUFDcEQsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQy9FLENBQUM7UUFFRCxvQ0FBb0M7UUFDcEMsTUFBTSxNQUFNLEdBQUcsS0FBSyxFQUFFLE1BQU0sSUFBSSxJQUFJLENBQUM7UUFDckMsTUFBTSxHQUFHLEdBQXFCO1lBQzVCLEdBQUcsR0FBRyxDQUFDLFdBQVcsRUFBRTtZQUNwQixRQUFRLEVBQUUsT0FBTztZQUNqQixZQUFZO1lBQ1osR0FBRyxLQUFLO1lBQ1IsTUFBTTtTQUNQLENBQUM7UUFFRixNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksdUJBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEltcG9ydEtleVJlcXVlc3QsXG4gIEltcG9ydEtleVJlcXVlc3RNYXRlcmlhbCxcbiAgS2V5LFxuICBLZXlUeXBlLFxuICBPcmcsXG4gIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG59IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuXG5pbXBvcnQgdHlwZSB7IE1uZW1vbmljVG9JbXBvcnQgfSBmcm9tIFwiLi9tbmVtb25pY1wiO1xuaW1wb3J0IHsgbmV3TW5lbW9uaWNLZXlQYWNrYWdlIH0gZnJvbSBcIi4vbW5lbW9uaWNcIjtcbmltcG9ydCB7IG5ld1Jhd0tleVBhY2thZ2UgfSBmcm9tIFwiLi9yYXdcIjtcbmltcG9ydCB7IFdyYXBwZWRJbXBvcnRLZXkgfSBmcm9tIFwiLi93cmFwcGVkX2ltcG9ydF9rZXlcIjtcblxuLy8gTWF4aW11bSBudW1iZXIgb2Yga2V5cyB0byBpbXBvcnQgaW4gYSBzaW5nbGUgQVBJIGNhbGxcbmNvbnN0IE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCA9IDMybjtcblxuLyoqXG4gKiBBbiBpbXBvcnQgZW5jcnlwdGlvbiBrZXkgYW5kIHRoZSBjb3JyZXNwb25kaW5nIGF0dGVzdGF0aW9uIGRvY3VtZW50XG4gKi9cbmV4cG9ydCBjbGFzcyBLZXlJbXBvcnRlciB7XG4gICN3cmFwcGVkSW1wb3J0S2V5OiBudWxsIHwgV3JhcHBlZEltcG9ydEtleSA9IG51bGw7XG4gIHJlYWRvbmx5ICNjczogT3JnO1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgZnJvbSBhIEN1YmVTaWduZXIgYE9yZ2AgaW5zdGFuY2VcbiAgICpcbiAgICogQHBhcmFtIGNzIEEgQ3ViZVNpZ25lciBgT3JnYCBpbnN0YW5jZVxuICAgKi9cbiAgY29uc3RydWN0b3IoY3M6IE9yZykge1xuICAgIHRoaXMuI2NzID0gY3M7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgdGhhdCB0aGUgd3JhcHBlZCBpbXBvcnQga2V5IGlzIHVuZXhwaXJlZCBhbmQgdmVyaWZpZWQuIE90aGVyd2lzZSxcbiAgICogcmVxdWVzdCBhIG5ldyBvbmUgYW5kIHZlcmlmeSBpdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgdmVyaWZpZWQgd3JhcHBlZCBpbXBvcnQga2V5LlxuICAgKi9cbiAgYXN5bmMgI2dldFdyYXBwZWRJbXBvcnRLZXkoKTogUHJvbWlzZTxXcmFwcGVkSW1wb3J0S2V5PiB7XG4gICAgaWYgKCF0aGlzLiN3cmFwcGVkSW1wb3J0S2V5IHx8IHRoaXMuI3dyYXBwZWRJbXBvcnRLZXkubmVlZHNSZWZyZXNoKCkpIHtcbiAgICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNjcy5jcmVhdGVLZXlJbXBvcnRLZXkoKTtcbiAgICAgIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgICAgIHRoaXMuI3dyYXBwZWRJbXBvcnRLZXkgPSBhd2FpdCBXcmFwcGVkSW1wb3J0S2V5LmNyZWF0ZUFuZFZlcmlmeShyZXNwLCBzdWJ0bGUpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4jd3JhcHBlZEltcG9ydEtleTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiBtbmVtb25pY3MgYW5kIGltcG9ydHMgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGltcG9ydFxuICAgKiBAcGFyYW0gbW5lcyBUaGUgbW5lbW9uaWNzIHRvIGltcG9ydCwgd2l0aCBvcHRpb25hbCBkZXJpdmF0aW9uIHBhdGhzIGFuZCBwYXNzd29yZHNcbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgaW1wb3J0XG4gICAqIEByZXR1cm5zIGBLZXlgIG9iamVjdHMgZm9yIGVhY2ggaW1wb3J0ZWQga2V5LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGltcG9ydE1uZW1vbmljcyhcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIG1uZXM6IE1uZW1vbmljVG9JbXBvcnRbXSxcbiAgICBwcm9wcz86IEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5W10+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jaW1wb3J0UGFja2FnZXMoXG4gICAgICBrZXlUeXBlLFxuICAgICAgbW5lcy5tYXAoKG1uZSkgPT4gbmV3TW5lbW9uaWNLZXlQYWNrYWdlKG1uZSkpLFxuICAgICAgcHJvcHMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiByYXcga2V5cyBhbmQgaW1wb3J0cyB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBzZWNyZXRzIFRoZSBzZWNyZXQga2V5cyB0byBpbXBvcnQuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGltcG9ydFxuICAgKiBAcmV0dXJucyBgS2V5YCBvYmplY3RzIGZvciBlYWNoIGltcG9ydGVkIGtleS5cbiAgICovXG4gIHB1YmxpYyBhc3luYyBpbXBvcnRSYXdTZWNyZXRLZXlzKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgc2VjcmV0czogVWludDhBcnJheVtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNpbXBvcnRQYWNrYWdlcyhcbiAgICAgIGtleVR5cGUsXG4gICAgICBzZWNyZXRzLm1hcCgoc2VjKSA9PiBuZXdSYXdLZXlQYWNrYWdlKHNlYykpLFxuICAgICAgcHJvcHMsXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyBhIHNldCBvZiBwcmVwYXJlZCBrZXkgcGFja2FnZXMsIGFuZCBpbXBvcnRzIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBpbXBvcnRcbiAgICogQHBhcmFtIHBhY2thZ2VzIFRoZSBrZXkgcGFja2FnZXMgdG8gaW1wb3J0LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBpbXBvcnRcbiAgICogQHJldHVybnMgYEtleWAgb2JqZWN0cyBmb3IgZWFjaCBpbXBvcnRlZCBrZXkuXG4gICAqL1xuICBhc3luYyAjaW1wb3J0UGFja2FnZXMoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBwYWNrYWdlczogVWludDhBcnJheVtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIGNvbnN0IG5DaHVua3MgPSBOdW1iZXIoXG4gICAgICAoQmlnSW50KHBhY2thZ2VzLmxlbmd0aCkgKyBNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwgLSAxbikgLyBNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwsXG4gICAgKTtcbiAgICBjb25zdCBrZXlzID0gW107XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG5DaHVua3M7ICsraSkge1xuICAgICAgLy8gZmlyc3QsIG1ha2Ugc3VyZSB0aGF0IHRoZSB3cmFwcGVkIGltcG9ydCBrZXkgaXMgdmFsaWQsIGkuZS4sIHRoYXRcbiAgICAgIC8vIHdlIGhhdmUgcmV0cmlldmVkIGl0IGFuZCB0aGF0IGl0IGhhc24ndCBleHBpcmVkLiBXZSBkbyB0aGlzIGhlcmVcbiAgICAgIC8vIGZvciBhIGNvdXBsZSByZWFzb25zOlxuICAgICAgLy9cbiAgICAgIC8vIC0gYWxsIGVuY3J5cHRpb25zIGluIGEgZ2l2ZW4gcmVxdWVzdCBtdXN0IHVzZSB0aGUgc2FtZSBpbXBvcnQga2V5LCBhbmRcbiAgICAgIC8vXG4gICAgICAvLyAtIHdoZW4gaW1wb3J0aW5nIGEgaHVnZSBudW1iZXIgb2Yga2V5cyB0aGUgaW1wb3J0IHB1YmtleSBtaWdodCBleHBpcmVcbiAgICAgIC8vICAgZHVyaW5nIHRoZSBpbXBvcnQsIHNvIHdlIGNoZWNrIGZvciBleHBpcmF0aW9uIGJlZm9yZSBlYWNoIHJlcXVlc3RcbiAgICAgIGNvbnN0IHdpayA9IGF3YWl0IHRoaXMuI2dldFdyYXBwZWRJbXBvcnRLZXkoKTtcblxuICAgICAgLy8gbmV4dCwgZW5jcnlwdCB0aGlzIGNodW5rIG9mIHBhY2thZ2VzXG4gICAgICBjb25zdCBzdGFydCA9IE51bWJlcihNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwpICogaTtcbiAgICAgIGNvbnN0IGVuZCA9IE51bWJlcihNQVhfSU1QT1JUU19QRVJfQVBJX0NBTEwpICsgc3RhcnQ7XG4gICAgICBjb25zdCBrZXlfbWF0ZXJpYWw6IEltcG9ydEtleVJlcXVlc3RNYXRlcmlhbFtdID0gW107XG4gICAgICBmb3IgKGNvbnN0IGtleVBrZyBvZiBwYWNrYWdlcy5zbGljZShzdGFydCwgZW5kKSkge1xuICAgICAgICBjb25zdCB7IGVuYywgY2lwaGVydGV4dCB9ID0gYXdhaXQgd2lrLmVuY3J5cHQoa2V5UGtnKTtcbiAgICAgICAgLy8gV2UgdXNlIGFuIGV4dGVuc2lvbiBvZiBIUEtFIHRoYXQgYWxsb3dzIGEgc2FsdCB2YWx1ZSB0byBiZSBzcGVjaWZpZWQsIGJ1dCBpdCBpcyBvayB0b1xuICAgICAgICAvLyB1c2UgYW4gZW1wdHkgc2FsdCBpZiB0aGUgaW1wb3J0IGtleSBpcyBub3QgcmV1c2VkXG4gICAgICAgIGtleV9tYXRlcmlhbC5wdXNoKHsgc2FsdDogXCJcIiwgY2xpZW50X3B1YmxpY19rZXk6IGVuYywgaWttX2VuYzogY2lwaGVydGV4dCB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gY29uc3RydWN0IHRoZSByZXF1ZXN0IGFuZCBzZW5kIGl0XG4gICAgICBjb25zdCBwb2xpY3kgPSBwcm9wcz8ucG9saWN5ID8/IG51bGw7XG4gICAgICBjb25zdCByZXE6IEltcG9ydEtleVJlcXVlc3QgPSB7XG4gICAgICAgIC4uLndpay50b0ltcG9ydEtleSgpLFxuICAgICAgICBrZXlfdHlwZToga2V5VHlwZSxcbiAgICAgICAga2V5X21hdGVyaWFsLFxuICAgICAgICAuLi5wcm9wcyxcbiAgICAgICAgcG9saWN5LFxuICAgICAgfTtcblxuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NzLmltcG9ydEtleXMocmVxKTtcbiAgICAgIGtleXMucHVzaCguLi5yZXNwKTtcbiAgICB9XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxufVxuIl19