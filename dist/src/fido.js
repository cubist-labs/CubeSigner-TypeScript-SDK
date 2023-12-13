"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
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
var _AddFidoChallenge_cs, _MfaFidoChallenge_ss;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaFidoChallenge = exports.AddFidoChallenge = void 0;
const util_1 = require("./util");
/**
 * Returned after creating a request to add a new FIDO device.
 * Provides some helper methods for answering this challenge.
 */
class AddFidoChallenge {
    /**
     * Constructor
     * @param {CubeSigner} cs CubeSigner instance used to request to add a FIDO device
     * @param {ApiAddFidoChallenge} challenge The challenge returned by the remote end.
     */
    constructor(cs, challenge) {
        _AddFidoChallenge_cs.set(this, void 0);
        __classPrivateFieldSet(this, _AddFidoChallenge_cs, cs, "f");
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields to uint8[]
        this.options = {
            ...challenge.options,
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
        this.options.pubKeyCredParams ??= challenge.options.pub_key_cred_params;
        this.options.excludeCredentials ??= challenge.options.exclude_credentials;
        this.options.authenticatorSelection ??= challenge.options.authenticator_selection;
        delete this.options.pub_key_cred_params;
        delete this.options.exclude_credentials;
        delete this.options.authenticator_selection;
        if (challenge.options.user) {
            this.options.user.id = (0, util_1.decodeBase64Url)(challenge.options.user.id);
        }
        for (const credential of this.options.excludeCredentials ?? []) {
            credential.id = (0, util_1.decodeBase64Url)(credential.id);
        }
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to create a credential
     * based on the the public key credential creation options from this challenge.
     */
    async createCredentialAndAnswer() {
        const cred = await navigator.credentials.create({ publicKey: this.options });
        await this.answer(cred);
    }
    /**
     * Answers this challenge using a given credential `cred`;
     * the credential should be obtained by calling
     *
     * ```
     * const cred = await navigator.credentials.create({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `create` method
     *                   based on the public key creation options from this challenge.
     */
    async answer(cred) {
        const answer = {
            id: cred.id,
            response: {
                clientDataJSON: (0, util_1.encodeToBase64Url)(cred.response.clientDataJSON),
                attestationObject: (0, util_1.encodeToBase64Url)(cred.response.attestationObject),
            },
        };
        await __classPrivateFieldGet(this, _AddFidoChallenge_cs, "f").addFidoComplete(this.challengeId, answer);
    }
}
exports.AddFidoChallenge = AddFidoChallenge;
_AddFidoChallenge_cs = new WeakMap();
/**
 * Returned after initiating MFA approval using FIDO.
 * Provides some helper methods for answering this challenge.
 */
class MfaFidoChallenge {
    /**
     * @param {SignerSession} ss The session used to initiate MFA approval using FIDO
     * @param {string} mfaId The MFA request id.
     * @param {ApiMfaFidoChallenge} challenge The challenge returned by the remote end
     */
    constructor(ss, mfaId, challenge) {
        _MfaFidoChallenge_ss.set(this, void 0);
        __classPrivateFieldSet(this, _MfaFidoChallenge_ss, ss, "f");
        this.mfaId = mfaId;
        this.challengeId = challenge.challenge_id;
        // fix options returned from the server: rename fields and decode base64 fields into uint8[]
        this.options = {
            ...challenge.options,
            challenge: (0, util_1.decodeBase64Url)(challenge.options.challenge),
        };
        this.options.rpId ??= challenge.options.rp_id;
        this.options.allowCredentials ??= challenge.options.allow_credentials;
        this.options.userVerification ??= challenge.options.user_verification;
        delete this.options.rp_id;
        delete this.options.allow_credentials;
        delete this.options.user_verification;
        for (const credential of this.options.allowCredentials ?? []) {
            credential.id = (0, util_1.decodeBase64Url)(credential.id);
            if (credential.transports === null) {
                delete credential.transports;
            }
        }
    }
    /**
     * Answers this challenge by using the `CredentialsContainer` API to get a credential
     * based on the the public key credential request options from this challenge.
     */
    async createCredentialAndAnswer() {
        const cred = await navigator.credentials.get({ publicKey: this.options });
        return await this.answer(cred);
    }
    /**
     * Answers this challenge using a given credential `cred`.
     * To obtain this credential, for example, call
     *
     * ```
     * const cred = await navigator.credentials.get({ publicKey: this.options });
     * ```
     *
     * @param {any} cred Credential created by calling the `CredentialContainer`'s `get` method
     *                   based on the public key credential request options from this challenge.
     */
    async answer(cred) {
        const answer = {
            id: cred.id,
            response: {
                clientDataJSON: (0, util_1.encodeToBase64Url)(cred.response.clientDataJSON),
                authenticatorData: (0, util_1.encodeToBase64Url)(cred.response.authenticatorData),
                signature: (0, util_1.encodeToBase64Url)(cred.response.signature),
            },
        };
        return await __classPrivateFieldGet(this, _MfaFidoChallenge_ss, "f").fidoApproveComplete(this.mfaId, this.challengeId, answer);
    }
}
exports.MfaFidoChallenge = MfaFidoChallenge;
_MfaFidoChallenge_ss = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlkby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9maWRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBdUQ7Ozs7Ozs7Ozs7Ozs7OztBQUl2RCxpQ0FBNEQ7QUFtQjVEOzs7R0FHRztBQUNILE1BQWEsZ0JBQWdCO0lBSzNCOzs7O09BSUc7SUFDSCxZQUFZLEVBQWMsRUFBRSxTQUE4QjtRQVRqRCx1Q0FBZ0I7UUFVdkIsdUJBQUEsSUFBSSx3QkFBTyxFQUFFLE1BQUEsQ0FBQztRQUNkLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUUxQywwRkFBMEY7UUFDMUYsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNiLEdBQUcsU0FBUyxDQUFDLE9BQU87WUFDcEIsU0FBUyxFQUFFLElBQUEsc0JBQWUsRUFBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUN4RCxDQUFDO1FBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQ3hFLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztRQUMxRSxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixLQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7UUFDbEYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztRQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7UUFFNUMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBQSxzQkFBZSxFQUFDLFNBQVMsQ0FBQyxPQUFP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LE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTO1FBQ3BCLE1BQU0sTUFBTSxHQUF3QjtZQUNsQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7Z0JBQy9ELGlCQUFpQixFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckUsU0FBUyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7YUFDdEQ7U0FDRixDQUFDO1FBQ0YsT0FBTyxNQUFNLHVCQUFBLElBQUksNEJBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEYsQ0FBQztDQUNGO0FBbkVELDRDQW1FQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cblxuaW1wb3J0IHsgQ3ViZVNpZ25lciwgTWZhUmVxdWVzdEluZm8sIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuaW1wb3J0IHsgZGVjb2RlQmFzZTY0VXJsLCBlbmNvZGVUb0Jhc2U2NFVybCB9IGZyb20gXCIuL3V0aWxcIjtcblxuZXhwb3J0IHR5cGUgQXBpQWRkRmlkb0NoYWxsZW5nZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJGaWRvQ3JlYXRlQ2hhbGxlbmdlUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuZXhwb3J0IHR5cGUgQXBpTWZhRmlkb0NoYWxsZW5nZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJGaWRvQXNzZXJ0Q2hhbGxlbmdlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnMgPVxuICBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnNcIl07XG5leHBvcnQgdHlwZSBQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnMgPVxuICBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxSZXF1ZXN0T3B0aW9uc1wiXTtcbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxQYXJhbWV0ZXJzID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJQdWJsaWNLZXlDcmVkZW50aWFsUGFyYW1ldGVyc1wiXTtcbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvclwiXTtcbmV4cG9ydCB0eXBlIEF1dGhlbnRpY2F0b3JTZWxlY3Rpb25Dcml0ZXJpYSA9XG4gIGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQXV0aGVudGljYXRvclNlbGVjdGlvbkNyaXRlcmlhXCJdO1xuZXhwb3J0IHR5cGUgUHVibGljS2V5Q3JlZGVudGlhbFVzZXJFbnRpdHkgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxVc2VyRW50aXR5XCJdO1xuZXhwb3J0IHR5cGUgUHVibGljS2V5Q3JlZGVudGlhbCA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiUHVibGljS2V5Q3JlZGVudGlhbFwiXTtcblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBjcmVhdGluZyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgQWRkRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIEN1YmVTaWduZXIgaW5zdGFuY2UgdXNlZCB0byByZXF1ZXN0IHRvIGFkZCBhIEZJRE8gZGV2aWNlXG4gICAqIEBwYXJhbSB7QXBpQWRkRmlkb0NoYWxsZW5nZX0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgdG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLmNoYWxsZW5nZS5vcHRpb25zLFxuICAgICAgY2hhbGxlbmdlOiBkZWNvZGVCYXNlNjRVcmwoY2hhbGxlbmdlLm9wdGlvbnMuY2hhbGxlbmdlKSxcbiAgICB9O1xuICAgIHRoaXMub3B0aW9ucy5wdWJLZXlDcmVkUGFyYW1zID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy5wdWJfa2V5X2NyZWRfcGFyYW1zO1xuICAgIHRoaXMub3B0aW9ucy5leGNsdWRlQ3JlZGVudGlhbHMgPz89IGNoYWxsZW5nZS5vcHRpb25zLmV4Y2x1ZGVfY3JlZGVudGlhbHM7XG4gICAgdGhpcy5vcHRpb25zLmF1dGhlbnRpY2F0b3JTZWxlY3Rpb24gPz89IGNoYWxsZW5nZS5vcHRpb25zLmF1dGhlbnRpY2F0b3Jfc2VsZWN0aW9uO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMucHViX2tleV9jcmVkX3BhcmFtcztcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLmV4Y2x1ZGVfY3JlZGVudGlhbHM7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5hdXRoZW50aWNhdG9yX3NlbGVjdGlvbjtcblxuICAgIGlmIChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyKSB7XG4gICAgICB0aGlzLm9wdGlvbnMudXNlci5pZCA9IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy51c2VyLmlkKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDcmVkZW50aWFscyA/PyBbXSkge1xuICAgICAgY3JlZGVudGlhbC5pZCA9IGRlY29kZUJhc2U2NFVybChjcmVkZW50aWFsLmlkKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gY3JlYXRlIGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCkge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuY3JlYXRlKHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgYXdhaXQgdGhpcy5hbnN3ZXIoY3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSB1c2luZyBhIGdpdmVuIGNyZWRlbnRpYWwgYGNyZWRgO1xuICAgKiB0aGUgY3JlZGVudGlhbCBzaG91bGQgYmUgb2J0YWluZWQgYnkgY2FsbGluZ1xuICAgKlxuICAgKiBgYGBcbiAgICogY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7YW55fSBjcmVkIENyZWRlbnRpYWwgY3JlYXRlZCBieSBjYWxsaW5nIHRoZSBgQ3JlZGVudGlhbENvbnRhaW5lcmAncyBgY3JlYXRlYCBtZXRob2RcbiAgICogICAgICAgICAgICAgICAgICAgYmFzZWQgb24gdGhlIHB1YmxpYyBrZXkgY3JlYXRpb24gb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSkge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdHRlc3RhdGlvbk9iamVjdDogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdHRlc3RhdGlvbk9iamVjdCksXG4gICAgICB9LFxuICAgIH07XG4gICAgYXdhaXQgdGhpcy4jY3MuYWRkRmlkb0NvbXBsZXRlKHRoaXMuY2hhbGxlbmdlSWQsIGFuc3dlcik7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBpbml0aWF0aW5nIE1GQSBhcHByb3ZhbCB1c2luZyBGSURPLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgTWZhRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNzczogU2lnbmVyU2Vzc2lvbjtcbiAgcmVhZG9ubHkgbWZhSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge1NpZ25lclNlc3Npb259IHNzIFRoZSBzZXNzaW9uIHVzZWQgdG8gaW5pdGlhdGUgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE9cbiAgICogQHBhcmFtIHtzdHJpbmd9IG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBpZC5cbiAgICogQHBhcmFtIHtBcGlNZmFGaWRvQ2hhbGxlbmdlfSBjaGFsbGVuZ2UgVGhlIGNoYWxsZW5nZSByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZFxuICAgKi9cbiAgY29uc3RydWN0b3Ioc3M6IFNpZ25lclNlc3Npb24sIG1mYUlkOiBzdHJpbmcsIGNoYWxsZW5nZTogQXBpTWZhRmlkb0NoYWxsZW5nZSkge1xuICAgIHRoaXMuI3NzID0gc3M7XG4gICAgdGhpcy5tZmFJZCA9IG1mYUlkO1xuICAgIHRoaXMuY2hhbGxlbmdlSWQgPSBjaGFsbGVuZ2UuY2hhbGxlbmdlX2lkO1xuXG4gICAgLy8gZml4IG9wdGlvbnMgcmV0dXJuZWQgZnJvbSB0aGUgc2VydmVyOiByZW5hbWUgZmllbGRzIGFuZCBkZWNvZGUgYmFzZTY0IGZpZWxkcyBpbnRvIHVpbnQ4W11cbiAgICB0aGlzLm9wdGlvbnMgPSB7XG4gICAgICAuLi5jaGFsbGVuZ2Uub3B0aW9ucyxcbiAgICAgIGNoYWxsZW5nZTogZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLmNoYWxsZW5nZSksXG4gICAgfTtcbiAgICB0aGlzLm9wdGlvbnMucnBJZCA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMucnBfaWQ7XG4gICAgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz89IGNoYWxsZW5nZS5vcHRpb25zLmFsbG93X2NyZWRlbnRpYWxzO1xuICAgIHRoaXMub3B0aW9ucy51c2VyVmVyaWZpY2F0aW9uID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy51c2VyX3ZlcmlmaWNhdGlvbjtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLnJwX2lkO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuYWxsb3dfY3JlZGVudGlhbHM7XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy51c2VyX3ZlcmlmaWNhdGlvbjtcblxuICAgIGZvciAoY29uc3QgY3JlZGVudGlhbCBvZiB0aGlzLm9wdGlvbnMuYWxsb3dDcmVkZW50aWFscyA/PyBbXSkge1xuICAgICAgY3JlZGVudGlhbC5pZCA9IGRlY29kZUJhc2U2NFVybChjcmVkZW50aWFsLmlkKTtcbiAgICAgIGlmIChjcmVkZW50aWFsLnRyYW5zcG9ydHMgPT09IG51bGwpIHtcbiAgICAgICAgZGVsZXRlIGNyZWRlbnRpYWwudHJhbnNwb3J0cztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VycyB0aGlzIGNoYWxsZW5nZSBieSB1c2luZyB0aGUgYENyZWRlbnRpYWxzQ29udGFpbmVyYCBBUEkgdG8gZ2V0IGEgY3JlZGVudGlhbFxuICAgKiBiYXNlZCBvbiB0aGUgdGhlIHB1YmxpYyBrZXkgY3JlZGVudGlhbCByZXF1ZXN0IG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYW5zd2VyKGNyZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgdXNpbmcgYSBnaXZlbiBjcmVkZW50aWFsIGBjcmVkYC5cbiAgICogVG8gb2J0YWluIHRoaXMgY3JlZGVudGlhbCwgZm9yIGV4YW1wbGUsIGNhbGxcbiAgICpcbiAgICogYGBgXG4gICAqIGNvbnN0IGNyZWQgPSBhd2FpdCBuYXZpZ2F0b3IuY3JlZGVudGlhbHMuZ2V0KHsgcHVibGljS2V5OiB0aGlzLm9wdGlvbnMgfSk7XG4gICAqIGBgYFxuICAgKlxuICAgKiBAcGFyYW0ge2FueX0gY3JlZCBDcmVkZW50aWFsIGNyZWF0ZWQgYnkgY2FsbGluZyB0aGUgYENyZWRlbnRpYWxDb250YWluZXJgJ3MgYGdldGAgbWV0aG9kXG4gICAqICAgICAgICAgICAgICAgICAgIGJhc2VkIG9uIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IGFuc3dlciA9IDxQdWJsaWNLZXlDcmVkZW50aWFsPntcbiAgICAgIGlkOiBjcmVkLmlkLFxuICAgICAgcmVzcG9uc2U6IHtcbiAgICAgICAgY2xpZW50RGF0YUpTT046IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuY2xpZW50RGF0YUpTT04pLFxuICAgICAgICBhdXRoZW50aWNhdG9yRGF0YTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5hdXRoZW50aWNhdG9yRGF0YSksXG4gICAgICAgIHNpZ25hdHVyZTogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5zaWduYXR1cmUpLFxuICAgICAgfSxcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCB0aGlzLiNzcy5maWRvQXBwcm92ZUNvbXBsZXRlKHRoaXMubWZhSWQsIHRoaXMuY2hhbGxlbmdlSWQsIGFuc3dlcik7XG4gIH1cbn1cbiJdfQ==