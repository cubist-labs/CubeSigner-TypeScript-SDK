"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Mfa_sign, _Mfa_role;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mfa = void 0;
const assert_1 = __importDefault(require("assert"));
/**
 * Wrapper around @type {Sign} and @type {Role} that adds a **single-approval**
 * multi-factor authorization on top of all sign operations.
 */
class Mfa {
    /* eslint-disable valid-jsdoc */
    /**
     * Auto approve a sign operation that requires MFA.
     *
     * @param signFn The sign operation to call
     * @param {T} args Arguments to the sign operation
     * @return {Promise<U>} The result of the sign operation.
     */
    async autoApprove(// eslint-disable-line @typescript-eslint/no-explicit-any
    /* eslint-enable valid-jsdoc */
    signFn, ...args) {
        const data = await signFn.bind(__classPrivateFieldGet(this, _Mfa_sign, "f"))(...args);
        if (data.requiresMfa()) {
            const mfaId = data.mfaId();
            const approval = await __classPrivateFieldGet(this, _Mfa_role, "f").mfaApprove(mfaId);
            (0, assert_1.default)(approval.id === mfaId);
            (0, assert_1.default)(approval.receipt);
            const mfa = new Mfa(__classPrivateFieldGet(this, _Mfa_sign, "f").withMfaApproval(approval), __classPrivateFieldGet(this, _Mfa_role, "f"));
            return await mfa.autoApprove(signFn, ...args);
        }
        else {
            return data;
        }
    }
    /**
     * Constructor.
     * @param {Sign} sign Sign instance to use for signing
     * @param {Role} role Role instance to use for MFA approval
     */
    constructor(sign, role) {
        _Mfa_sign.set(this, void 0);
        _Mfa_role.set(this, void 0);
        __classPrivateFieldSet(this, _Mfa_sign, sign, "f");
        __classPrivateFieldSet(this, _Mfa_role, role, "f");
    }
}
exports.Mfa = Mfa;
_Mfa_sign = new WeakMap(), _Mfa_role = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWZhLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21mYS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxvREFBNEI7QUFHNUI7OztHQUdHO0FBQ0gsTUFBYSxHQUFHO0lBSWQsZ0NBQWdDO0lBQ2hDOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQTJCLHlEQUF5RDtJQUNuRywrQkFBK0I7SUFDL0IsTUFBZ0QsRUFDaEQsR0FBRyxJQUFPO1FBRVYsTUFBTSxJQUFJLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLHVCQUFBLElBQUksaUJBQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7UUFDcEQsSUFBSSxJQUFJLENBQUMsV0FBVyxFQUFFLEVBQUU7WUFDdEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQzNCLE1BQU0sUUFBUSxHQUFHLE1BQU0sdUJBQUEsSUFBSSxpQkFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRCxJQUFBLGdCQUFNLEVBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxLQUFLLENBQUMsQ0FBQztZQUM5QixJQUFBLGdCQUFNLEVBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLHVCQUFBLElBQUksaUJBQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUUsdUJBQUEsSUFBSSxpQkFBTSxDQUFDLENBQUM7WUFDdEUsT0FBTyxNQUFNLEdBQUcsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUM7U0FDL0M7YUFBTTtZQUNMLE9BQU8sSUFBUyxDQUFDO1NBQ2xCO0lBQ0gsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxZQUFZLElBQVUsRUFBRSxJQUFVO1FBbEN6Qiw0QkFBWTtRQUNaLDRCQUFZO1FBa0NuQix1QkFBQSxJQUFJLGFBQVMsSUFBSSxNQUFBLENBQUM7UUFDbEIsdUJBQUEsSUFBSSxhQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXZDRCxrQkF1Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCB7IFNpZ24sIFNpZ25SZXNwb25zZSwgUm9sZSB9IGZyb20gXCIuXCI7XG5cbi8qKlxuICogV3JhcHBlciBhcm91bmQgQHR5cGUge1NpZ259IGFuZCBAdHlwZSB7Um9sZX0gdGhhdCBhZGRzIGEgKipzaW5nbGUtYXBwcm92YWwqKlxuICogbXVsdGktZmFjdG9yIGF1dGhvcml6YXRpb24gb24gdG9wIG9mIGFsbCBzaWduIG9wZXJhdGlvbnMuXG4gKi9cbmV4cG9ydCBjbGFzcyBNZmEge1xuICByZWFkb25seSAjc2lnbjogU2lnbjtcbiAgcmVhZG9ubHkgI3JvbGU6IFJvbGU7XG5cbiAgLyogZXNsaW50LWRpc2FibGUgdmFsaWQtanNkb2MgKi9cbiAgLyoqXG4gICAqIEF1dG8gYXBwcm92ZSBhIHNpZ24gb3BlcmF0aW9uIHRoYXQgcmVxdWlyZXMgTUZBLlxuICAgKlxuICAgKiBAcGFyYW0gc2lnbkZuIFRoZSBzaWduIG9wZXJhdGlvbiB0byBjYWxsXG4gICAqIEBwYXJhbSB7VH0gYXJncyBBcmd1bWVudHMgdG8gdGhlIHNpZ24gb3BlcmF0aW9uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VT59IFRoZSByZXN1bHQgb2YgdGhlIHNpZ24gb3BlcmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgYXV0b0FwcHJvdmU8VCBleHRlbmRzIEFycmF5PGFueT4sIFU+KCAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAvKiBlc2xpbnQtZW5hYmxlIHZhbGlkLWpzZG9jICovXG4gICAgc2lnbkZuOiAoLi4uYXJnczogVCkgPT4gUHJvbWlzZTxTaWduUmVzcG9uc2U8VT4+LFxuICAgIC4uLmFyZ3M6IFRcbiAgKTogUHJvbWlzZTxVPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHNpZ25Gbi5iaW5kKHRoaXMuI3NpZ24pKC4uLmFyZ3MpO1xuICAgIGlmIChkYXRhLnJlcXVpcmVzTWZhKCkpIHtcbiAgICAgIGNvbnN0IG1mYUlkID0gZGF0YS5tZmFJZCgpO1xuICAgICAgY29uc3QgYXBwcm92YWwgPSBhd2FpdCB0aGlzLiNyb2xlLm1mYUFwcHJvdmUobWZhSWQpO1xuICAgICAgYXNzZXJ0KGFwcHJvdmFsLmlkID09PSBtZmFJZCk7XG4gICAgICBhc3NlcnQoYXBwcm92YWwucmVjZWlwdCk7XG4gICAgICBjb25zdCBtZmEgPSBuZXcgTWZhKHRoaXMuI3NpZ24ud2l0aE1mYUFwcHJvdmFsKGFwcHJvdmFsKSwgdGhpcy4jcm9sZSk7XG4gICAgICByZXR1cm4gYXdhaXQgbWZhLmF1dG9BcHByb3ZlKHNpZ25GbiwgLi4uYXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBkYXRhIGFzIFU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKiBAcGFyYW0ge1NpZ259IHNpZ24gU2lnbiBpbnN0YW5jZSB0byB1c2UgZm9yIHNpZ25pbmdcbiAgICogQHBhcmFtIHtSb2xlfSByb2xlIFJvbGUgaW5zdGFuY2UgdG8gdXNlIGZvciBNRkEgYXBwcm92YWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKHNpZ246IFNpZ24sIHJvbGU6IFJvbGUpIHtcbiAgICB0aGlzLiNzaWduID0gc2lnbjtcbiAgICB0aGlzLiNyb2xlID0gcm9sZTtcbiAgfVxufVxuIl19