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
            ...structuredClone(challenge.options),
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
            ...structuredClone(challenge.options),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlkby5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9maWRvLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSx1REFBdUQ7Ozs7Ozs7Ozs7Ozs7OztBQUl2RCxpQ0FBNEQ7QUFtQjVEOzs7R0FHRztBQUNILE1BQWEsZ0JBQWdCO0lBSzNCOzs7O09BSUc7SUFDSCxZQUFZLEVBQWMsRUFBRSxTQUE4QjtRQVRqRCx1Q0FBZ0I7UUFVdkIsdUJBQUEsSUFBSSx3QkFBTyxFQUFFLE1BQUEsQ0FBQztRQUNkLElBQUksQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLFlBQVksQ0FBQztRQUUxQywwRkFBMEY7UUFDMUYsSUFBSSxDQUFDLE9BQU8sR0FBRztZQUNiLEdBQUcsZUFBZSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUM7WUFDckMsU0FBUyxFQUFFLElBQUEsc0JBQWUsRUFBQyxTQUFTLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztTQUN4RCxDQUFDO1FBQ0YsSUFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQ3hFLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEtBQUssU0FBUyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztRQUMxRSxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixLQUFLLFNBQVMsQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7UUFDbEYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDO1FBQ3hDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQztRQUN4QyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQXVCLENBQUM7UUFFNUMsSUFBSSxTQUFTLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRTtZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBQSxzQkFBZSxFQUFD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Q0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBQzFFLE9BQU8sTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2pDLENBQUM7SUFFRDs7Ozs7Ozs7OztPQVVHO0lBQ0gsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFTO1FBQ3BCLE1BQU0sTUFBTSxHQUF3QjtZQUNsQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUU7WUFDWCxRQUFRLEVBQUU7Z0JBQ1IsY0FBYyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUM7Z0JBQy9ELGlCQUFpQixFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDckUsU0FBUyxFQUFFLElBQUEsd0JBQWlCLEVBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7YUFDdEQ7U0FDRixDQUFDO1FBQ0YsT0FBTyxNQUFNLHVCQUFBLElBQUksNEJBQUksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDbEYsQ0FBQztDQUNGO0FBbkVELDRDQW1FQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnkgKi9cblxuaW1wb3J0IHsgQ3ViZVNpZ25lciwgTWZhUmVxdWVzdEluZm8sIFNpZ25lclNlc3Npb24gfSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgY29tcG9uZW50cyB9IGZyb20gXCIuL3NjaGVtYVwiO1xuaW1wb3J0IHsgZGVjb2RlQmFzZTY0VXJsLCBlbmNvZGVUb0Jhc2U2NFVybCB9IGZyb20gXCIuL3V0aWxcIjtcblxuZXhwb3J0IHR5cGUgQXBpQWRkRmlkb0NoYWxsZW5nZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJGaWRvQ3JlYXRlQ2hhbGxlbmdlUmVzcG9uc2VcIl1bXCJjb250ZW50XCJdW1wiYXBwbGljYXRpb24vanNvblwiXTtcblxuZXhwb3J0IHR5cGUgQXBpTWZhRmlkb0NoYWxsZW5nZSA9XG4gIGNvbXBvbmVudHNbXCJyZXNwb25zZXNcIl1bXCJGaWRvQXNzZXJ0Q2hhbGxlbmdlXCJdW1wiY29udGVudFwiXVtcImFwcGxpY2F0aW9uL2pzb25cIl07XG5cbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnMgPVxuICBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxDcmVhdGlvbk9wdGlvbnNcIl07XG5leHBvcnQgdHlwZSBQdWJsaWNLZXlDcmVkZW50aWFsUmVxdWVzdE9wdGlvbnMgPVxuICBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxSZXF1ZXN0T3B0aW9uc1wiXTtcbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxQYXJhbWV0ZXJzID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJQdWJsaWNLZXlDcmVkZW50aWFsUGFyYW1ldGVyc1wiXTtcbmV4cG9ydCB0eXBlIFB1YmxpY0tleUNyZWRlbnRpYWxEZXNjcmlwdG9yID0gY29tcG9uZW50c1tcInNjaGVtYXNcIl1bXCJQdWJsaWNLZXlDcmVkZW50aWFsRGVzY3JpcHRvclwiXTtcbmV4cG9ydCB0eXBlIEF1dGhlbnRpY2F0b3JTZWxlY3Rpb25Dcml0ZXJpYSA9XG4gIGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiQXV0aGVudGljYXRvclNlbGVjdGlvbkNyaXRlcmlhXCJdO1xuZXhwb3J0IHR5cGUgUHVibGljS2V5Q3JlZGVudGlhbFVzZXJFbnRpdHkgPSBjb21wb25lbnRzW1wic2NoZW1hc1wiXVtcIlB1YmxpY0tleUNyZWRlbnRpYWxVc2VyRW50aXR5XCJdO1xuZXhwb3J0IHR5cGUgUHVibGljS2V5Q3JlZGVudGlhbCA9IGNvbXBvbmVudHNbXCJzY2hlbWFzXCJdW1wiUHVibGljS2V5Q3JlZGVudGlhbFwiXTtcblxuLyoqXG4gKiBSZXR1cm5lZCBhZnRlciBjcmVhdGluZyBhIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICogUHJvdmlkZXMgc29tZSBoZWxwZXIgbWV0aG9kcyBmb3IgYW5zd2VyaW5nIHRoaXMgY2hhbGxlbmdlLlxuICovXG5leHBvcnQgY2xhc3MgQWRkRmlkb0NoYWxsZW5nZSB7XG4gIHJlYWRvbmx5ICNjczogQ3ViZVNpZ25lcjtcbiAgcmVhZG9ubHkgY2hhbGxlbmdlSWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgb3B0aW9uczogYW55O1xuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3RvclxuICAgKiBAcGFyYW0ge0N1YmVTaWduZXJ9IGNzIEN1YmVTaWduZXIgaW5zdGFuY2UgdXNlZCB0byByZXF1ZXN0IHRvIGFkZCBhIEZJRE8gZGV2aWNlXG4gICAqIEBwYXJhbSB7QXBpQWRkRmlkb0NoYWxsZW5nZX0gY2hhbGxlbmdlIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihjczogQ3ViZVNpZ25lciwgY2hhbGxlbmdlOiBBcGlBZGRGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jY3MgPSBjcztcbiAgICB0aGlzLmNoYWxsZW5nZUlkID0gY2hhbGxlbmdlLmNoYWxsZW5nZV9pZDtcblxuICAgIC8vIGZpeCBvcHRpb25zIHJldHVybmVkIGZyb20gdGhlIHNlcnZlcjogcmVuYW1lIGZpZWxkcyBhbmQgZGVjb2RlIGJhc2U2NCBmaWVsZHMgdG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLnN0cnVjdHVyZWRDbG9uZShjaGFsbGVuZ2Uub3B0aW9ucyksXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG4gICAgdGhpcy5vcHRpb25zLnB1YktleUNyZWRQYXJhbXMgPz89IGNoYWxsZW5nZS5vcHRpb25zLnB1Yl9rZXlfY3JlZF9wYXJhbXM7XG4gICAgdGhpcy5vcHRpb25zLmV4Y2x1ZGVDcmVkZW50aWFscyA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMuZXhjbHVkZV9jcmVkZW50aWFscztcbiAgICB0aGlzLm9wdGlvbnMuYXV0aGVudGljYXRvclNlbGVjdGlvbiA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMuYXV0aGVudGljYXRvcl9zZWxlY3Rpb247XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5wdWJfa2V5X2NyZWRfcGFyYW1zO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMuZXhjbHVkZV9jcmVkZW50aWFscztcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLmF1dGhlbnRpY2F0b3Jfc2VsZWN0aW9uO1xuXG4gICAgaWYgKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIpIHtcbiAgICAgIHRoaXMub3B0aW9ucy51c2VyLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNoYWxsZW5nZS5vcHRpb25zLnVzZXIuaWQpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3QgY3JlZGVudGlhbCBvZiB0aGlzLm9wdGlvbnMuZXhjbHVkZUNyZWRlbnRpYWxzID8/IFtdKSB7XG4gICAgICBjcmVkZW50aWFsLmlkID0gZGVjb2RlQmFzZTY0VXJsKGNyZWRlbnRpYWwuaWQpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIGJ5IHVzaW5nIHRoZSBgQ3JlZGVudGlhbHNDb250YWluZXJgIEFQSSB0byBjcmVhdGUgYSBjcmVkZW50aWFsXG4gICAqIGJhc2VkIG9uIHRoZSB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIGNyZWF0aW9uIG9wdGlvbnMgZnJvbSB0aGlzIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIGNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXIoKSB7XG4gICAgY29uc3QgY3JlZCA9IGF3YWl0IG5hdmlnYXRvci5jcmVkZW50aWFscy5jcmVhdGUoeyBwdWJsaWNLZXk6IHRoaXMub3B0aW9ucyB9KTtcbiAgICBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGA7XG4gICAqIHRoZSBjcmVkZW50aWFsIHNob3VsZCBiZSBvYnRhaW5lZCBieSBjYWxsaW5nXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmNyZWF0ZSh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBjcmVhdGVgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVhdGlvbiBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBhbnN3ZXIoY3JlZDogYW55KSB7XG4gICAgY29uc3QgYW5zd2VyID0gPFB1YmxpY0tleUNyZWRlbnRpYWw+e1xuICAgICAgaWQ6IGNyZWQuaWQsXG4gICAgICByZXNwb25zZToge1xuICAgICAgICBjbGllbnREYXRhSlNPTjogZW5jb2RlVG9CYXNlNjRVcmwoY3JlZC5yZXNwb25zZS5jbGllbnREYXRhSlNPTiksXG4gICAgICAgIGF0dGVzdGF0aW9uT2JqZWN0OiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmF0dGVzdGF0aW9uT2JqZWN0KSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICBhd2FpdCB0aGlzLiNjcy5hZGRGaWRvQ29tcGxldGUodGhpcy5jaGFsbGVuZ2VJZCwgYW5zd2VyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybmVkIGFmdGVyIGluaXRpYXRpbmcgTUZBIGFwcHJvdmFsIHVzaW5nIEZJRE8uXG4gKiBQcm92aWRlcyBzb21lIGhlbHBlciBtZXRob2RzIGZvciBhbnN3ZXJpbmcgdGhpcyBjaGFsbGVuZ2UuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmFGaWRvQ2hhbGxlbmdlIHtcbiAgcmVhZG9ubHkgI3NzOiBTaWduZXJTZXNzaW9uO1xuICByZWFkb25seSBtZmFJZDogc3RyaW5nO1xuICByZWFkb25seSBjaGFsbGVuZ2VJZDogc3RyaW5nO1xuICByZWFkb25seSBvcHRpb25zOiBhbnk7XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7U2lnbmVyU2Vzc2lvbn0gc3MgVGhlIHNlc3Npb24gdXNlZCB0byBpbml0aWF0ZSBNRkEgYXBwcm92YWwgdXNpbmcgRklET1xuICAgKiBAcGFyYW0ge3N0cmluZ30gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IGlkLlxuICAgKiBAcGFyYW0ge0FwaU1mYUZpZG9DaGFsbGVuZ2V9IGNoYWxsZW5nZSBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kXG4gICAqL1xuICBjb25zdHJ1Y3RvcihzczogU2lnbmVyU2Vzc2lvbiwgbWZhSWQ6IHN0cmluZywgY2hhbGxlbmdlOiBBcGlNZmFGaWRvQ2hhbGxlbmdlKSB7XG4gICAgdGhpcy4jc3MgPSBzcztcbiAgICB0aGlzLm1mYUlkID0gbWZhSWQ7XG4gICAgdGhpcy5jaGFsbGVuZ2VJZCA9IGNoYWxsZW5nZS5jaGFsbGVuZ2VfaWQ7XG5cbiAgICAvLyBmaXggb3B0aW9ucyByZXR1cm5lZCBmcm9tIHRoZSBzZXJ2ZXI6IHJlbmFtZSBmaWVsZHMgYW5kIGRlY29kZSBiYXNlNjQgZmllbGRzIGludG8gdWludDhbXVxuICAgIHRoaXMub3B0aW9ucyA9IHtcbiAgICAgIC4uLnN0cnVjdHVyZWRDbG9uZShjaGFsbGVuZ2Uub3B0aW9ucyksXG4gICAgICBjaGFsbGVuZ2U6IGRlY29kZUJhc2U2NFVybChjaGFsbGVuZ2Uub3B0aW9ucy5jaGFsbGVuZ2UpLFxuICAgIH07XG4gICAgdGhpcy5vcHRpb25zLnJwSWQgPz89IGNoYWxsZW5nZS5vcHRpb25zLnJwX2lkO1xuICAgIHRoaXMub3B0aW9ucy5hbGxvd0NyZWRlbnRpYWxzID8/PSBjaGFsbGVuZ2Uub3B0aW9ucy5hbGxvd19jcmVkZW50aWFscztcbiAgICB0aGlzLm9wdGlvbnMudXNlclZlcmlmaWNhdGlvbiA/Pz0gY2hhbGxlbmdlLm9wdGlvbnMudXNlcl92ZXJpZmljYXRpb247XG4gICAgZGVsZXRlIHRoaXMub3B0aW9ucy5ycF9pZDtcbiAgICBkZWxldGUgdGhpcy5vcHRpb25zLmFsbG93X2NyZWRlbnRpYWxzO1xuICAgIGRlbGV0ZSB0aGlzLm9wdGlvbnMudXNlcl92ZXJpZmljYXRpb247XG5cbiAgICBmb3IgKGNvbnN0IGNyZWRlbnRpYWwgb2YgdGhpcy5vcHRpb25zLmFsbG93Q3JlZGVudGlhbHMgPz8gW10pIHtcbiAgICAgIGNyZWRlbnRpYWwuaWQgPSBkZWNvZGVCYXNlNjRVcmwoY3JlZGVudGlhbC5pZCk7XG4gICAgICBpZiAoY3JlZGVudGlhbC50cmFuc3BvcnRzID09PSBudWxsKSB7XG4gICAgICAgIGRlbGV0ZSBjcmVkZW50aWFsLnRyYW5zcG9ydHM7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlcnMgdGhpcyBjaGFsbGVuZ2UgYnkgdXNpbmcgdGhlIGBDcmVkZW50aWFsc0NvbnRhaW5lcmAgQVBJIHRvIGdldCBhIGNyZWRlbnRpYWxcbiAgICogYmFzZWQgb24gdGhlIHRoZSBwdWJsaWMga2V5IGNyZWRlbnRpYWwgcmVxdWVzdCBvcHRpb25zIGZyb20gdGhpcyBjaGFsbGVuZ2UuXG4gICAqL1xuICBhc3luYyBjcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyKCk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFuc3dlcihjcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXJzIHRoaXMgY2hhbGxlbmdlIHVzaW5nIGEgZ2l2ZW4gY3JlZGVudGlhbCBgY3JlZGAuXG4gICAqIFRvIG9idGFpbiB0aGlzIGNyZWRlbnRpYWwsIGZvciBleGFtcGxlLCBjYWxsXG4gICAqXG4gICAqIGBgYFxuICAgKiBjb25zdCBjcmVkID0gYXdhaXQgbmF2aWdhdG9yLmNyZWRlbnRpYWxzLmdldCh7IHB1YmxpY0tleTogdGhpcy5vcHRpb25zIH0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIHthbnl9IGNyZWQgQ3JlZGVudGlhbCBjcmVhdGVkIGJ5IGNhbGxpbmcgdGhlIGBDcmVkZW50aWFsQ29udGFpbmVyYCdzIGBnZXRgIG1ldGhvZFxuICAgKiAgICAgICAgICAgICAgICAgICBiYXNlZCBvbiB0aGUgcHVibGljIGtleSBjcmVkZW50aWFsIHJlcXVlc3Qgb3B0aW9ucyBmcm9tIHRoaXMgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgYW5zd2VyKGNyZWQ6IGFueSk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBhbnN3ZXIgPSA8UHVibGljS2V5Q3JlZGVudGlhbD57XG4gICAgICBpZDogY3JlZC5pZCxcbiAgICAgIHJlc3BvbnNlOiB7XG4gICAgICAgIGNsaWVudERhdGFKU09OOiBlbmNvZGVUb0Jhc2U2NFVybChjcmVkLnJlc3BvbnNlLmNsaWVudERhdGFKU09OKSxcbiAgICAgICAgYXV0aGVudGljYXRvckRhdGE6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2UuYXV0aGVudGljYXRvckRhdGEpLFxuICAgICAgICBzaWduYXR1cmU6IGVuY29kZVRvQmFzZTY0VXJsKGNyZWQucmVzcG9uc2Uuc2lnbmF0dXJlKSxcbiAgICAgIH0sXG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jc3MuZmlkb0FwcHJvdmVDb21wbGV0ZSh0aGlzLm1mYUlkLCB0aGlzLmNoYWxsZW5nZUlkLCBhbnN3ZXIpO1xuICB9XG59XG4iXX0=