"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newMnemonicKeyPackage = newMnemonicKeyPackage;
exports.parseDerivationPath = parseDerivationPath;
const msgpackr_1 = require("msgpackr");
const english_1 = require("@scure/bip39/wordlists/english");
const bip39 = __importStar(require("@scure/bip39"));
/**
 * Create a new MnemonicKeyPackage value
 *
 * @param mne A BIP39 mnemonic and optional BIP39 password and BIP32 derivation path
 * @returns A serialized key package for import to CubeSigner
 */
function newMnemonicKeyPackage(mne) {
    const entropy = bip39.mnemonicToEntropy(mne.mnemonic, english_1.wordlist);
    const path = !mne.derivationPath ? [] : parseDerivationPath(mne.derivationPath);
    const password = mne.password ?? "";
    const mnePkg = {
        EnglishMnemonic: {
            mnemonic: {
                entropy,
            },
            der_path: {
                path,
            },
            password,
        },
    };
    return (0, msgpackr_1.encode)(mnePkg);
}
// constants for derivation path parsing
const DER_HARDENED = 1n << 31n;
const DER_MAX = 1n << 32n;
/**
 * Parse a derivation path into a sequence of 32-bit integers
 *
 * @param derp The derivation path to parse; must start with 'm/'
 * @returns The parsed path
 */
function parseDerivationPath(derp) {
    derp = derp.toLowerCase();
    if (derp === "m") {
        return [];
    }
    if (!derp.startsWith("m/")) {
        throw new Error('Derivation path must start with "m/"');
    }
    const parts = derp.slice(2).split("/");
    const ret = [];
    for (let part of parts) {
        let hardened = false;
        if (part.endsWith("'") || part.endsWith("h")) {
            hardened = true;
            part = part.slice(0, part.length - 1);
        }
        if (part === "") {
            throw new Error("Invalid derivation path: empty element");
        }
        let value = BigInt(part);
        if (value >= DER_MAX) {
            throw new Error("Derivation path element greater than 2^32 is invalid");
        }
        if (hardened) {
            value = value | DER_HARDENED;
        }
        ret.push(Number(value));
    }
    return ret;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW5lbW9uaWMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvbW5lbW9uaWMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWlDQSxzREFnQkM7QUFZRCxrREE2QkM7QUExRkQsdUNBQThDO0FBQzlDLDREQUEwRDtBQUMxRCxvREFBc0M7QUF5QnRDOzs7OztHQUtHO0FBQ0gsU0FBZ0IscUJBQXFCLENBQUMsR0FBcUI7SUFDekQsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsa0JBQVEsQ0FBQyxDQUFDO0lBQ2hFLE1BQU0sSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDaEYsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7SUFDcEMsTUFBTSxNQUFNLEdBQXVCO1FBQ2pDLGVBQWUsRUFBRTtZQUNmLFFBQVEsRUFBRTtnQkFDUixPQUFPO2FBQ1I7WUFDRCxRQUFRLEVBQUU7Z0JBQ1IsSUFBSTthQUNMO1lBQ0QsUUFBUTtTQUNUO0tBQ0YsQ0FBQztJQUNGLE9BQU8sSUFBQSxpQkFBUSxFQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRCx3Q0FBd0M7QUFDeEMsTUFBTSxZQUFZLEdBQUcsRUFBRSxJQUFJLEdBQUcsQ0FBQztBQUMvQixNQUFNLE9BQU8sR0FBRyxFQUFFLElBQUksR0FBRyxDQUFDO0FBRTFCOzs7OztHQUtHO0FBQ0gsU0FBZ0IsbUJBQW1CLENBQUMsSUFBWTtJQUM5QyxJQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO0lBQzFCLElBQUksSUFBSSxLQUFLLEdBQUcsRUFBRSxDQUFDO1FBQ2pCLE9BQU8sRUFBRSxDQUFDO0lBQ1osQ0FBQztJQUNELElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDM0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQyxDQUFDO0lBQzFELENBQUM7SUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUN2QyxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUM7SUFDZixLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRSxDQUFDO1FBQ3ZCLElBQUksUUFBUSxHQUFHLEtBQUssQ0FBQztRQUNyQixJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzdDLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDaEIsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUFDO1lBQ2hCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBQ0QsSUFBSSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3pCLElBQUksS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ3JCLE1BQU0sSUFBSSxLQUFLLENBQUMsc0RBQXNELENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQ0QsSUFBSSxRQUFRLEVBQUUsQ0FBQztZQUNiLEtBQUssR0FBRyxLQUFLLEdBQUcsWUFBWSxDQUFDO1FBQy9CLENBQUM7UUFDRCxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzFCLENBQUM7SUFDRCxPQUFPLEdBQUcsQ0FBQztBQUNiLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBlbmNvZGUgYXMgbXBFbmNvZGUgfSBmcm9tIFwibXNncGFja3JcIjtcbmltcG9ydCB7IHdvcmRsaXN0IH0gZnJvbSBcIkBzY3VyZS9iaXAzOS93b3JkbGlzdHMvZW5nbGlzaFwiO1xuaW1wb3J0ICogYXMgYmlwMzkgZnJvbSBcIkBzY3VyZS9iaXAzOVwiO1xuXG4vLyBUaGUgS2V5UGFja2FnZSB0eXBlIGZyb20gQ3ViZVNpZ25lciAobW5lbW9uaWMgdmFyaWFudClcbmV4cG9ydCB0eXBlIE1uZW1vbmljS2V5UGFja2FnZSA9IHtcbiAgRW5nbGlzaE1uZW1vbmljOiB7XG4gICAgbW5lbW9uaWM6IHtcbiAgICAgIGVudHJvcHk6IFVpbnQ4QXJyYXk7XG4gICAgfTtcbiAgICBkZXJfcGF0aDoge1xuICAgICAgcGF0aDogbnVtYmVyW107XG4gICAgfTtcbiAgICBwYXNzd29yZDogc3RyaW5nO1xuICB9O1xufTtcblxuLyoqXG4gKiBBIEJJUDM5IG1uZW1vbmljIHRvIGJlIGltcG9ydGVkLCBwbHVzIG9wdGlvbmFsIEJJUDM5IHBhc3N3b3JkXG4gKiBhbmQgQklQMzIgZGVyaXZhdGlvbiBwYXRoLlxuICovXG5leHBvcnQgdHlwZSBNbmVtb25pY1RvSW1wb3J0ID0ge1xuICBtbmVtb25pYzogc3RyaW5nO1xuICBkZXJpdmF0aW9uUGF0aD86IHN0cmluZztcbiAgcGFzc3dvcmQ/OiBzdHJpbmc7XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBNbmVtb25pY0tleVBhY2thZ2UgdmFsdWVcbiAqXG4gKiBAcGFyYW0gbW5lIEEgQklQMzkgbW5lbW9uaWMgYW5kIG9wdGlvbmFsIEJJUDM5IHBhc3N3b3JkIGFuZCBCSVAzMiBkZXJpdmF0aW9uIHBhdGhcbiAqIEByZXR1cm5zIEEgc2VyaWFsaXplZCBrZXkgcGFja2FnZSBmb3IgaW1wb3J0IHRvIEN1YmVTaWduZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5ld01uZW1vbmljS2V5UGFja2FnZShtbmU6IE1uZW1vbmljVG9JbXBvcnQpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgZW50cm9weSA9IGJpcDM5Lm1uZW1vbmljVG9FbnRyb3B5KG1uZS5tbmVtb25pYywgd29yZGxpc3QpO1xuICBjb25zdCBwYXRoID0gIW1uZS5kZXJpdmF0aW9uUGF0aCA/IFtdIDogcGFyc2VEZXJpdmF0aW9uUGF0aChtbmUuZGVyaXZhdGlvblBhdGgpO1xuICBjb25zdCBwYXNzd29yZCA9IG1uZS5wYXNzd29yZCA/PyBcIlwiO1xuICBjb25zdCBtbmVQa2c6IE1uZW1vbmljS2V5UGFja2FnZSA9IHtcbiAgICBFbmdsaXNoTW5lbW9uaWM6IHtcbiAgICAgIG1uZW1vbmljOiB7XG4gICAgICAgIGVudHJvcHksXG4gICAgICB9LFxuICAgICAgZGVyX3BhdGg6IHtcbiAgICAgICAgcGF0aCxcbiAgICAgIH0sXG4gICAgICBwYXNzd29yZCxcbiAgICB9LFxuICB9O1xuICByZXR1cm4gbXBFbmNvZGUobW5lUGtnKTtcbn1cblxuLy8gY29uc3RhbnRzIGZvciBkZXJpdmF0aW9uIHBhdGggcGFyc2luZ1xuY29uc3QgREVSX0hBUkRFTkVEID0gMW4gPDwgMzFuO1xuY29uc3QgREVSX01BWCA9IDFuIDw8IDMybjtcblxuLyoqXG4gKiBQYXJzZSBhIGRlcml2YXRpb24gcGF0aCBpbnRvIGEgc2VxdWVuY2Ugb2YgMzItYml0IGludGVnZXJzXG4gKlxuICogQHBhcmFtIGRlcnAgVGhlIGRlcml2YXRpb24gcGF0aCB0byBwYXJzZTsgbXVzdCBzdGFydCB3aXRoICdtLydcbiAqIEByZXR1cm5zIFRoZSBwYXJzZWQgcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEZXJpdmF0aW9uUGF0aChkZXJwOiBzdHJpbmcpOiBudW1iZXJbXSB7XG4gIGRlcnAgPSBkZXJwLnRvTG93ZXJDYXNlKCk7XG4gIGlmIChkZXJwID09PSBcIm1cIikge1xuICAgIHJldHVybiBbXTtcbiAgfVxuICBpZiAoIWRlcnAuc3RhcnRzV2l0aChcIm0vXCIpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdEZXJpdmF0aW9uIHBhdGggbXVzdCBzdGFydCB3aXRoIFwibS9cIicpO1xuICB9XG4gIGNvbnN0IHBhcnRzID0gZGVycC5zbGljZSgyKS5zcGxpdChcIi9cIik7XG4gIGNvbnN0IHJldCA9IFtdO1xuICBmb3IgKGxldCBwYXJ0IG9mIHBhcnRzKSB7XG4gICAgbGV0IGhhcmRlbmVkID0gZmFsc2U7XG4gICAgaWYgKHBhcnQuZW5kc1dpdGgoXCInXCIpIHx8IHBhcnQuZW5kc1dpdGgoXCJoXCIpKSB7XG4gICAgICBoYXJkZW5lZCA9IHRydWU7XG4gICAgICBwYXJ0ID0gcGFydC5zbGljZSgwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgICBpZiAocGFydCA9PT0gXCJcIikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBkZXJpdmF0aW9uIHBhdGg6IGVtcHR5IGVsZW1lbnRcIik7XG4gICAgfVxuICAgIGxldCB2YWx1ZSA9IEJpZ0ludChwYXJ0KTtcbiAgICBpZiAodmFsdWUgPj0gREVSX01BWCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGVyaXZhdGlvbiBwYXRoIGVsZW1lbnQgZ3JlYXRlciB0aGFuIDJeMzIgaXMgaW52YWxpZFwiKTtcbiAgICB9XG4gICAgaWYgKGhhcmRlbmVkKSB7XG4gICAgICB2YWx1ZSA9IHZhbHVlIHwgREVSX0hBUkRFTkVEO1xuICAgIH1cbiAgICByZXQucHVzaChOdW1iZXIodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gcmV0O1xufVxuIl19