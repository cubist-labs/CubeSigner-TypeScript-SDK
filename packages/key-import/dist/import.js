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
import { loadSubtleCrypto } from "@cubist-labs/cubesigner-sdk";
import { newMnemonicKeyPackage } from "./mnemonic.js";
import { newRawKeyPackage } from "./raw.js";
import { WrappedImportKey } from "./wrapped_import_key.js";
// Maximum number of keys to import in a single API call
const MAX_IMPORTS_PER_API_CALL = 32n;
/**
 * An import encryption key and the corresponding attestation document
 */
export class KeyImporter {
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
        return await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_importPackages).call(this, keyType, mnes.map((mne) => newMnemonicKeyPackage(mne)), props);
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
        return await __classPrivateFieldGet(this, _KeyImporter_instances, "m", _KeyImporter_importPackages).call(this, keyType, secrets.map((sec) => newRawKeyPackage(sec)), props);
    }
}
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
        const subtle = await loadSubtleCrypto();
        __classPrivateFieldSet(this, _KeyImporter_wrappedImportKey, await WrappedImportKey.createAndVerify(resp, subtle), "f");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW1wb3J0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL2ltcG9ydC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsTUFBTSw0QkFBNEIsQ0FBQztBQUc5RCxPQUFPLEVBQUUscUJBQXFCLEVBQUUsTUFBTSxlQUFlLENBQUM7QUFDdEQsT0FBTyxFQUFFLGdCQUFnQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQzVDLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTNELHdEQUF3RDtBQUN4RCxNQUFNLHdCQUF3QixHQUFHLEdBQUcsQ0FBQztBQUVyQzs7R0FFRztBQUNILE1BQU0sT0FBTyxXQUFXO0lBSXRCOzs7O09BSUc7SUFDSCxZQUFZLEVBQU87O1FBUm5CLHdDQUE2QyxJQUFJLEVBQUM7UUFDekMsa0NBQVM7UUFRaEIsdUJBQUEsSUFBSSxtQkFBTyxFQUFFLE1BQUEsQ0FBQztJQUNoQixDQUFDO0lBaUJEOzs7Ozs7O09BT0c7SUFDSSxLQUFLLENBQUMsZUFBZSxDQUMxQixPQUFnQixFQUNoQixJQUF3QixFQUN4QixLQUFpQztRQUVqQyxPQUFPLE1BQU0sdUJBQUEsSUFBSSwyREFBZ0IsTUFBcEIsSUFBSSxFQUNmLE9BQU8sRUFDUCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUM3QyxLQUFLLENBQ04sQ0FBQztJQUNKLENBQUM7SUFFRDs7Ozs7OztPQU9HO0lBQ0ksS0FBSyxDQUFDLG1CQUFtQixDQUM5QixPQUFnQixFQUNoQixPQUFxQixFQUNyQixLQUFpQztRQUVqQyxPQUFPLE1BQU0sdUJBQUEsSUFBSSwyREFBZ0IsTUFBcEIsSUFBSSxFQUNmLE9BQU8sRUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUMzQyxLQUFLLENBQ04sQ0FBQztJQUNKLENBQUM7Q0EwREY7O0FBL0dDOzs7OztHQUtHO0FBQ0gsS0FBSztJQUNILElBQUksQ0FBQyx1QkFBQSxJQUFJLHFDQUFrQixJQUFJLHVCQUFBLElBQUkscUNBQWtCLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQztRQUNyRSxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUksdUJBQUksQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO1FBQ2pELE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLEVBQUUsQ0FBQztRQUN4Qyx1QkFBQSxJQUFJLGlDQUFxQixNQUFNLGdCQUFnQixDQUFDLGVBQWUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLE1BQUEsQ0FBQztJQUNoRixDQUFDO0lBQ0QsT0FBTyx1QkFBQSxJQUFJLHFDQUFrQixDQUFDO0FBQ2hDLENBQUM7QUEwQ0Q7Ozs7Ozs7R0FPRztBQUNILEtBQUssc0NBQ0gsT0FBZ0IsRUFDaEIsUUFBc0IsRUFDdEIsS0FBaUM7SUFFakMsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUNwQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLEdBQUcsd0JBQXdCLEdBQUcsRUFBRSxDQUFDLEdBQUcsd0JBQXdCLENBQ3JGLENBQUM7SUFDRixNQUFNLElBQUksR0FBRyxFQUFFLENBQUM7SUFFaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO1FBQ2pDLG9FQUFvRTtRQUNwRSxtRUFBbUU7UUFDbkUsd0JBQXdCO1FBQ3hCLEVBQUU7UUFDRix5RUFBeUU7UUFDekUsRUFBRTtRQUNGLHdFQUF3RTtRQUN4RSxzRUFBc0U7UUFDdEUsTUFBTSxHQUFHLEdBQUcsTUFBTSx1QkFBQSxJQUFJLGdFQUFxQixNQUF6QixJQUFJLENBQXVCLENBQUM7UUFFOUMsdUNBQXVDO1FBQ3ZDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuRCxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsd0JBQXdCLENBQUMsR0FBRyxLQUFLLENBQUM7UUFDckQsTUFBTSxZQUFZLEdBQStCLEVBQUUsQ0FBQztRQUNwRCxLQUFLLE1BQU0sTUFBTSxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDaEQsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDdEQsd0ZBQXdGO1lBQ3hGLG9EQUFvRDtZQUNwRCxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDL0UsQ0FBQztRQUVELG9DQUFvQztRQUNwQyxNQUFNLE1BQU0sR0FBRyxLQUFLLEVBQUUsTUFBTSxJQUFJLElBQUksQ0FBQztRQUNyQyxNQUFNLEdBQUcsR0FBcUI7WUFDNUIsR0FBRyxHQUFHLENBQUMsV0FBVyxFQUFFO1lBQ3BCLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFlBQVk7WUFDWixHQUFHLEtBQUs7WUFDUixNQUFNO1NBQ1AsQ0FBQztRQUVGLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSx1QkFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7SUFDckIsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgSW1wb3J0S2V5UmVxdWVzdCxcbiAgSW1wb3J0S2V5UmVxdWVzdE1hdGVyaWFsLFxuICBLZXksXG4gIEtleVR5cGUsXG4gIE9yZyxcbiAgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbn0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyBsb2FkU3VidGxlQ3J5cHRvIH0gZnJvbSBcIkBjdWJpc3QtZGV2L2N1YmVzaWduZXItc2RrXCI7XG5cbmltcG9ydCB0eXBlIHsgTW5lbW9uaWNUb0ltcG9ydCB9IGZyb20gXCIuL21uZW1vbmljLnRzXCI7XG5pbXBvcnQgeyBuZXdNbmVtb25pY0tleVBhY2thZ2UgfSBmcm9tIFwiLi9tbmVtb25pYy50c1wiO1xuaW1wb3J0IHsgbmV3UmF3S2V5UGFja2FnZSB9IGZyb20gXCIuL3Jhdy50c1wiO1xuaW1wb3J0IHsgV3JhcHBlZEltcG9ydEtleSB9IGZyb20gXCIuL3dyYXBwZWRfaW1wb3J0X2tleS50c1wiO1xuXG4vLyBNYXhpbXVtIG51bWJlciBvZiBrZXlzIHRvIGltcG9ydCBpbiBhIHNpbmdsZSBBUEkgY2FsbFxuY29uc3QgTUFYX0lNUE9SVFNfUEVSX0FQSV9DQUxMID0gMzJuO1xuXG4vKipcbiAqIEFuIGltcG9ydCBlbmNyeXB0aW9uIGtleSBhbmQgdGhlIGNvcnJlc3BvbmRpbmcgYXR0ZXN0YXRpb24gZG9jdW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIEtleUltcG9ydGVyIHtcbiAgI3dyYXBwZWRJbXBvcnRLZXk6IG51bGwgfCBXcmFwcGVkSW1wb3J0S2V5ID0gbnVsbDtcbiAgcmVhZG9ubHkgI2NzOiBPcmc7XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdCBmcm9tIGEgQ3ViZVNpZ25lciBgT3JnYCBpbnN0YW5jZVxuICAgKlxuICAgKiBAcGFyYW0gY3MgQSBDdWJlU2lnbmVyIGBPcmdgIGluc3RhbmNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogT3JnKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVjayB0aGF0IHRoZSB3cmFwcGVkIGltcG9ydCBrZXkgaXMgdW5leHBpcmVkIGFuZCB2ZXJpZmllZC4gT3RoZXJ3aXNlLFxuICAgKiByZXF1ZXN0IGEgbmV3IG9uZSBhbmQgdmVyaWZ5IGl0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCB2ZXJpZmllZCB3cmFwcGVkIGltcG9ydCBrZXkuXG4gICAqL1xuICBhc3luYyAjZ2V0V3JhcHBlZEltcG9ydEtleSgpOiBQcm9taXNlPFdyYXBwZWRJbXBvcnRLZXk+IHtcbiAgICBpZiAoIXRoaXMuI3dyYXBwZWRJbXBvcnRLZXkgfHwgdGhpcy4jd3JhcHBlZEltcG9ydEtleS5uZWVkc1JlZnJlc2goKSkge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuI2NzLmNyZWF0ZUtleUltcG9ydEtleSgpO1xuICAgICAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICAgICAgdGhpcy4jd3JhcHBlZEltcG9ydEtleSA9IGF3YWl0IFdyYXBwZWRJbXBvcnRLZXkuY3JlYXRlQW5kVmVyaWZ5KHJlc3AsIHN1YnRsZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiN3cmFwcGVkSW1wb3J0S2V5O1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIG1uZW1vbmljcyBhbmQgaW1wb3J0cyB0aGVtLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZSBUaGUgdHlwZSBvZiBrZXkgdG8gaW1wb3J0XG4gICAqIEBwYXJhbSBtbmVzIFRoZSBtbmVtb25pY3MgdG8gaW1wb3J0LCB3aXRoIG9wdGlvbmFsIGRlcml2YXRpb24gcGF0aHMgYW5kIHBhc3N3b3Jkc1xuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBpbXBvcnRcbiAgICogQHJldHVybnMgYEtleWAgb2JqZWN0cyBmb3IgZWFjaCBpbXBvcnRlZCBrZXkuXG4gICAqL1xuICBwdWJsaWMgYXN5bmMgaW1wb3J0TW5lbW9uaWNzKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgbW5lczogTW5lbW9uaWNUb0ltcG9ydFtdLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlbXT4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNpbXBvcnRQYWNrYWdlcyhcbiAgICAgIGtleVR5cGUsXG4gICAgICBtbmVzLm1hcCgobW5lKSA9PiBuZXdNbmVtb25pY0tleVBhY2thZ2UobW5lKSksXG4gICAgICBwcm9wcyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIHJhdyBrZXlzIGFuZCBpbXBvcnRzIHRoZW0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBpbXBvcnRcbiAgICogQHBhcmFtIHNlY3JldHMgVGhlIHNlY3JldCBrZXlzIHRvIGltcG9ydC5cbiAgICogQHBhcmFtIHByb3BzIEFkZGl0aW9uYWwgb3B0aW9ucyBmb3IgaW1wb3J0XG4gICAqIEByZXR1cm5zIGBLZXlgIG9iamVjdHMgZm9yIGVhY2ggaW1wb3J0ZWQga2V5LlxuICAgKi9cbiAgcHVibGljIGFzeW5jIGltcG9ydFJhd1NlY3JldEtleXMoXG4gICAga2V5VHlwZTogS2V5VHlwZSxcbiAgICBzZWNyZXRzOiBVaW50OEFycmF5W10sXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2ltcG9ydFBhY2thZ2VzKFxuICAgICAga2V5VHlwZSxcbiAgICAgIHNlY3JldHMubWFwKChzZWMpID0+IG5ld1Jhd0tleVBhY2thZ2Uoc2VjKSksXG4gICAgICBwcm9wcyxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuY3J5cHRzIGEgc2V0IG9mIHByZXBhcmVkIGtleSBwYWNrYWdlcywgYW5kIGltcG9ydHMgdGhlbS5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGltcG9ydFxuICAgKiBAcGFyYW0gcGFja2FnZXMgVGhlIGtleSBwYWNrYWdlcyB0byBpbXBvcnQuXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGltcG9ydFxuICAgKiBAcmV0dXJucyBgS2V5YCBvYmplY3RzIGZvciBlYWNoIGltcG9ydGVkIGtleS5cbiAgICovXG4gIGFzeW5jICNpbXBvcnRQYWNrYWdlcyhcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIHBhY2thZ2VzOiBVaW50OEFycmF5W10sXG4gICAgcHJvcHM/OiBJbXBvcnREZXJpdmVLZXlQcm9wZXJ0aWVzLFxuICApOiBQcm9taXNlPEtleVtdPiB7XG4gICAgY29uc3QgbkNodW5rcyA9IE51bWJlcihcbiAgICAgIChCaWdJbnQocGFja2FnZXMubGVuZ3RoKSArIE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCAtIDFuKSAvIE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCxcbiAgICApO1xuICAgIGNvbnN0IGtleXMgPSBbXTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbkNodW5rczsgKytpKSB7XG4gICAgICAvLyBmaXJzdCwgbWFrZSBzdXJlIHRoYXQgdGhlIHdyYXBwZWQgaW1wb3J0IGtleSBpcyB2YWxpZCwgaS5lLiwgdGhhdFxuICAgICAgLy8gd2UgaGF2ZSByZXRyaWV2ZWQgaXQgYW5kIHRoYXQgaXQgaGFzbid0IGV4cGlyZWQuIFdlIGRvIHRoaXMgaGVyZVxuICAgICAgLy8gZm9yIGEgY291cGxlIHJlYXNvbnM6XG4gICAgICAvL1xuICAgICAgLy8gLSBhbGwgZW5jcnlwdGlvbnMgaW4gYSBnaXZlbiByZXF1ZXN0IG11c3QgdXNlIHRoZSBzYW1lIGltcG9ydCBrZXksIGFuZFxuICAgICAgLy9cbiAgICAgIC8vIC0gd2hlbiBpbXBvcnRpbmcgYSBodWdlIG51bWJlciBvZiBrZXlzIHRoZSBpbXBvcnQgcHVia2V5IG1pZ2h0IGV4cGlyZVxuICAgICAgLy8gICBkdXJpbmcgdGhlIGltcG9ydCwgc28gd2UgY2hlY2sgZm9yIGV4cGlyYXRpb24gYmVmb3JlIGVhY2ggcmVxdWVzdFxuICAgICAgY29uc3Qgd2lrID0gYXdhaXQgdGhpcy4jZ2V0V3JhcHBlZEltcG9ydEtleSgpO1xuXG4gICAgICAvLyBuZXh0LCBlbmNyeXB0IHRoaXMgY2h1bmsgb2YgcGFja2FnZXNcbiAgICAgIGNvbnN0IHN0YXJ0ID0gTnVtYmVyKE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCkgKiBpO1xuICAgICAgY29uc3QgZW5kID0gTnVtYmVyKE1BWF9JTVBPUlRTX1BFUl9BUElfQ0FMTCkgKyBzdGFydDtcbiAgICAgIGNvbnN0IGtleV9tYXRlcmlhbDogSW1wb3J0S2V5UmVxdWVzdE1hdGVyaWFsW10gPSBbXTtcbiAgICAgIGZvciAoY29uc3Qga2V5UGtnIG9mIHBhY2thZ2VzLnNsaWNlKHN0YXJ0LCBlbmQpKSB7XG4gICAgICAgIGNvbnN0IHsgZW5jLCBjaXBoZXJ0ZXh0IH0gPSBhd2FpdCB3aWsuZW5jcnlwdChrZXlQa2cpO1xuICAgICAgICAvLyBXZSB1c2UgYW4gZXh0ZW5zaW9uIG9mIEhQS0UgdGhhdCBhbGxvd3MgYSBzYWx0IHZhbHVlIHRvIGJlIHNwZWNpZmllZCwgYnV0IGl0IGlzIG9rIHRvXG4gICAgICAgIC8vIHVzZSBhbiBlbXB0eSBzYWx0IGlmIHRoZSBpbXBvcnQga2V5IGlzIG5vdCByZXVzZWRcbiAgICAgICAga2V5X21hdGVyaWFsLnB1c2goeyBzYWx0OiBcIlwiLCBjbGllbnRfcHVibGljX2tleTogZW5jLCBpa21fZW5jOiBjaXBoZXJ0ZXh0IH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBjb25zdHJ1Y3QgdGhlIHJlcXVlc3QgYW5kIHNlbmQgaXRcbiAgICAgIGNvbnN0IHBvbGljeSA9IHByb3BzPy5wb2xpY3kgPz8gbnVsbDtcbiAgICAgIGNvbnN0IHJlcTogSW1wb3J0S2V5UmVxdWVzdCA9IHtcbiAgICAgICAgLi4ud2lrLnRvSW1wb3J0S2V5KCksXG4gICAgICAgIGtleV90eXBlOiBrZXlUeXBlLFxuICAgICAgICBrZXlfbWF0ZXJpYWwsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBwb2xpY3ksXG4gICAgICB9O1xuXG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jY3MuaW1wb3J0S2V5cyhyZXEpO1xuICAgICAga2V5cy5wdXNoKC4uLnJlc3ApO1xuICAgIH1cblxuICAgIHJldHVybiBrZXlzO1xuICB9XG59XG4iXX0=