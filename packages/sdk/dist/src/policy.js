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
var _NamedPolicyRules_apiClient, _NamedPolicyRules_data, _C2FInvocation_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyInvocation = exports.NamedWasmPolicy = exports.C2FInvocation = exports.NamedPolicyRules = exports.C2FFunction = exports.NamedRolePolicy = exports.NamedKeyPolicy = exports.NamedPolicy = exports.uploadWasmPolicy = void 0;
exports.uploadWasmFunction = uploadWasmFunction;
const _1 = require(".");
/**
 * Upload the given Wasm Confidential Cloud Function.
 *
 * @param apiClient The API client to use.
 * @param policy The Wasm function.
 * @returns The Wasm function object hash to use for creating/updating C2F policies.
 * @throws if uploading the policy fails.
 * @internal
 */
async function uploadWasmFunction(apiClient, policy) {
    // get the SHA-256 hash of the function to get the upload url.
    const subtle = await (0, _1.loadSubtleCrypto)();
    const hashBytes = await subtle.digest("SHA-256", policy);
    const hash = (0, _1.encodeToHex)(new Uint8Array(hashBytes));
    // get the upload URL
    const { signed_url } = await apiClient.wasmPolicyUpload({ hash });
    // upload the wasm object
    const resp = await fetch(signed_url, {
        method: "PUT",
        body: policy,
    });
    if (!resp.ok) {
        throw new Error(`Failed to upload function with status: ${resp.status}: ${resp.statusText}`);
    }
    return hash;
}
/**
 * Upload the given Wasm policy.
 *
 * @param apiClient The API client to use.
 * @param policy The Wasm function.
 * @returns The Wasm function object hash to use for creating/updating C2F policies.
 * @throws if uploading the policy fails.
 * @internal
 */
exports.uploadWasmPolicy = uploadWasmFunction;
/**
 * Abstract class for shared methods between key, role and Wasm policies.
 */
class NamedPolicy {
    /**
     * Helper method for creating a named policy from a policy info.
     *
     * @param apiClient The api client to use.
     * @param info The policy info.
     * @returns The named policy object for the given info.
     */
    static fromInfo(apiClient, info) {
        switch (info.policy_type) {
            case "Key":
                return new NamedKeyPolicy(apiClient, info);
            case "Role":
                return new NamedRolePolicy(apiClient, info);
            case "Wasm":
                return new C2FFunction(apiClient, info);
        }
    }
    /** @returns The policy id */
    get id() {
        return this.data.policy_id;
    }
    /** @returns The policy type */
    get policyType() {
        return this.data.policy_type;
    }
    /**
     * Get a specific version of the policy.
     *
     * @param version The policy version to get.
     * @returns The specific version of the policy.
     */
    async version(version) {
        let versionInfo;
        if (version == `v${this.data.version}`) {
            versionInfo = this.data;
        }
        else {
            versionInfo = (await this.apiClient.policyGet(this.id, version));
        }
        return new NamedPolicyRules(this.apiClient, versionInfo);
    }
    /**
     * Get the latest version of the policy.
     *
     * @returns The latest version of the policy.
     */
    async latest() {
        const data = await this.fetch("latest");
        return new NamedPolicyRules(this.apiClient, data);
    }
    /**
     * Fetch and return the current name of the policy.
     *
     * @returns The policy name.
     */
    async name() {
        const data = await this.fetch();
        return data.name;
    }
    /**
     * Set a new name for the policy.
     *
     * @param name The new policy name.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setName(name, mfaReceipt) {
        await this.update({ name }, mfaReceipt);
    }
    /**
     * Fetch and return the current owner of the policy.
     *
     * @returns The user id of the policy owner.
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    async owner() {
        const data = await this.fetch();
        return data.owner;
    }
    /**
     * Set a new owner for the policy.
     *
     * @param owner The new owner of the policy.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setOwner(owner, mfaReceipt) {
        await this.update({ owner }, mfaReceipt);
    }
    /**
     * Fetch and return the metadata value for the policy.
     *
     * @returns The policy metadata.
     */
    async metadata() {
        const data = await this.fetch();
        return data.metadata;
    }
    /**
     * Sets a new metadata value for the named policy (overwriting the existing value).
     *
     * @param metadata The new metadata for the named policy.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setMetadata(metadata, mfaReceipt) {
        await this.update({ metadata }, mfaReceipt);
    }
    /**
     * Fetch and return the edit policy for the named policy.
     *
     * @returns The edit policy for this named policy.
     */
    async editPolicy() {
        const data = await this.fetch();
        return data.edit_policy;
    }
    /**
     * Set a new edit policy for the named policy.
     *
     * @param editPolicy The new edit policy.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setEditPolicy(editPolicy, mfaReceipt) {
        await this.update({ edit_policy: editPolicy }, mfaReceipt);
    }
    /**
     * Fetch and return the access control entries for the named policy.
     *
     * @returns The access control entries for this named policy.
     */
    async acl() {
        const data = await this.fetch();
        return data.acl;
    }
    /**
     * Sets new access control entries for the named policy (overwriting the existing entries).
     *
     * @param acl The access control entries to set.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setAcl(acl, mfaReceipt) {
        await this.update({ acl }, mfaReceipt);
    }
    /**
     * @returns a list of all keys, roles, and key-in-roles that all versions of this policy
     * are attached to.
     */
    async allAttached() {
        // there is no single-call way to achieve this. So instead, we
        // 1. Get the latest version of the policy
        // 2. For all versions `v0` to `latest`, fetch the policy info
        // 3. Join all policy `attached_to` arrays
        const data = await this.fetch("latest");
        const latest = data.version;
        const versions = Array.from(Array(latest + 1).keys());
        const batchSize = 10;
        let allAttached = [];
        for (let batch = 0; batch < versions.length; batch += batchSize) {
            const rs = await Promise.all(versions.slice(batch, batch + batchSize).map((version) => {
                return this.apiClient.policyGet(this.id, `v${version}`);
            }));
            allAttached = allAttached.concat(rs.flatMap((policy) => policy.attached_to));
        }
        return allAttached.concat(data.attached_to);
    }
    /**
     * Delete this policy.
     *
     * This can fail if the policy is still attached to any key, role, or key in role.
     *
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns A response which can be used to approve MFA if needed
     * @throws if MFA is required and no receipts are provided
     */
    async delete(mfaReceipt) {
        return await this.apiClient.policyDelete(this.id, mfaReceipt);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        this.apiClient = apiClient;
        this.data = data;
    }
    /**
     * Update the policy.
     *
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The updated policy information.
     * @throws if MFA is required and no receipts are provided
     * @internal
     */
    async update(request, mfaReceipt) {
        const resp = await this.apiClient.policyUpdate(this.id, request, mfaReceipt);
        this.data = resp.data();
        return this.data;
    }
    /**
     * Fetch the policy information.
     *
     * @param version The version of the policy to fetch. Defaults to "latest".
     * @returns The policy information.
     * @internal
     */
    async fetch(version = "latest") {
        this.data = (await this.apiClient.policyGet(this.id, version));
        return this.data;
    }
}
exports.NamedPolicy = NamedPolicy;
/**
 * A representation of a named key policy.
 */
class NamedKeyPolicy extends NamedPolicy {
    /**
     * Update the policy with new rules.
     *
     * @param rules The new rules to update the policy with.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setRules(rules, mfaReceipt) {
        await this.update({ rules }, mfaReceipt);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        super(apiClient, data);
        this.data = data;
    }
}
exports.NamedKeyPolicy = NamedKeyPolicy;
/**
 * A representation of a named role policy.
 */
class NamedRolePolicy extends NamedPolicy {
    /**
     * Update the policy with new rules.
     *
     * @param rules The new rules to update the policy with.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setRules(rules, mfaReceipt) {
        await this.update({ rules }, mfaReceipt);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        super(apiClient, data);
        this.data = data;
    }
}
exports.NamedRolePolicy = NamedRolePolicy;
/**
 * A representation of a Confidential Cloud Function (C2F).
 *
 * This class extends NamedPolicy because C2F functions can be attached
 * to keys and roles like a named policy.
 */
class C2FFunction extends NamedPolicy {
    /**
     * Update this C2F function with a new Wasm function.
     *
     * @param policy The new Wasm function.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if uploading the function fails.
     * @throws if MFA is required and no receipts are provided.
     */
    async setWasmFunction(policy, mfaReceipt) {
        // upload the policy object
        const hash = await uploadWasmFunction(this.apiClient, policy);
        // update this policy with the new policy version.
        const body = { rules: [{ hash }] };
        this.data = (await this.update(body, mfaReceipt));
    }
    /**
     * Invoke this Confidential Cloud Function.
     *
     * @param keyId The optional key id that the function will be invoked with.
     * @param version The version of the function to invoke. Defaults to "latest".
     * @param request The optional sign request body that will be sent to the function.
     * @param roleId The optional role id that the function will be invoked by.
     * If `undefined`, the policy will be invoked by the user session.
     * @returns The result of invoking the function.
     */
    async invoke(keyId, version = "latest", request, roleId) {
        // TODO Ideally, `version` should be the first parameter. But for backwards
        // compatibility, we keep `keyId` as the first parameter for now.
        const resp = await this.apiClient.policyInvoke(this.id, version, {
            key_id: keyId,
            request,
            role_id: roleId,
        });
        return new exports.PolicyInvocation(resp);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        super(apiClient, data);
        // Backwards compability with Named Wasm Policy names
        /**
         * Update the policy with the new Wasm policy.
         *
         * @param policy The new Wasm policy object.
         * @param mfaReceipt Optional MFA receipt(s).
         * @throws if uploading the policy object fails.
         * @throws if MFA is required and no receipts are provided.
         */
        this.setWasmPolicy = this.setWasmFunction;
        this.data = data;
    }
}
exports.C2FFunction = C2FFunction;
/**
 * A specific version of a named policy.
 */
class NamedPolicyRules {
    /**
     * @returns The ID of the policy.
     *
     * @example NamedPolicy#a4a45cc2-0642-4c98-b6bd-0da347d608a4
     */
    get id() {
        return __classPrivateFieldGet(this, _NamedPolicyRules_data, "f").policy_id;
    }
    /**
     * @returns The version of the policy this object contains.
     */
    get version() {
        return `v${__classPrivateFieldGet(this, _NamedPolicyRules_data, "f").version}`;
    }
    /**
     * @returns The policy rules.
     *
     * @example [ "AssertErc20Tx" ]
     */
    get rules() {
        return __classPrivateFieldGet(this, _NamedPolicyRules_data, "f").rules;
    }
    /**
     * @returns a list of all keys, roles, and key-in-roles this version of the policy
     *          is attached to.
     */
    async allAttached() {
        const data = await this.fetch();
        return data.attached_to;
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient, data) {
        /** The CubeSigner instance that this policy is associated with */
        _NamedPolicyRules_apiClient.set(this, void 0);
        _NamedPolicyRules_data.set(this, void 0);
        __classPrivateFieldSet(this, _NamedPolicyRules_apiClient, apiClient, "f");
        __classPrivateFieldSet(this, _NamedPolicyRules_data, data, "f");
    }
    /**
     * Fetch the policy information.
     *
     * @returns The policy information.
     * @internal
     */
    async fetch() {
        __classPrivateFieldSet(this, _NamedPolicyRules_data, (await __classPrivateFieldGet(this, _NamedPolicyRules_apiClient, "f").policyGet(this.id, this.version)), "f");
        return __classPrivateFieldGet(this, _NamedPolicyRules_data, "f");
    }
}
exports.NamedPolicyRules = NamedPolicyRules;
_NamedPolicyRules_apiClient = new WeakMap(), _NamedPolicyRules_data = new WeakMap();
/**
 * The result of invoking a Confidential Cloud Function.
 */
class C2FInvocation {
    /** @returns The policy response itself. */
    get response() {
        return __classPrivateFieldGet(this, _C2FInvocation_data, "f").response;
    }
    /**
     * The standard output stream as raw bytes. Usually a UTF-8 encoded string,
     * use {@link TextDecoder} to decode.
     *
     * @returns The standard output stream.
     */
    get stdoutBytes() {
        return (0, _1.decodeFromHex)(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stdout);
    }
    /**
     * The standard error stream as raw bytes. Usually a UTF-8 encoded string, use
     * {@link TextDecoder} to decode.
     *
     * @returns The standard error stream.
     */
    get stderrBytes() {
        return (0, _1.decodeFromHex)(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stderr);
    }
    /**
     * The standard output stream as a Buffer. Usually a UTF-8 encoded string.
     *
     * @returns The standard output stream.
     * @deprecated Use {@link stdoutBytes} instead for browser compatibility.
     */
    get stdout() {
        // eslint-disable-next-line no-restricted-globals -- Buffer return type preserved for backwards compatibility
        return Buffer.from(this.stdoutBytes);
    }
    /**
     * The standard error stream as a Buffer. Usually a UTF-8 encoded string.
     *
     * @returns The standard error stream.
     * @deprecated Use {@link stderrBytes} instead for browser compatibility.
     */
    get stderr() {
        // eslint-disable-next-line no-restricted-globals -- Buffer return type preserved for backwards compatibility
        return Buffer.from(this.stderrBytes);
    }
    /**
     * Constructor.
     *
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(data) {
        _C2FInvocation_data.set(this, void 0);
        __classPrivateFieldSet(this, _C2FInvocation_data, data, "f");
    }
}
exports.C2FInvocation = C2FInvocation;
_C2FInvocation_data = new WeakMap();
/** A representation of a Wasm policy. */
exports.NamedWasmPolicy = C2FFunction;
/** The result of invoking a named WASM policy. */
exports.PolicyInvocation = C2FInvocation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFtR0EsZ0RBdUJDO0FBbkdELHdCQUFpRTtBQW1FakU7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLFNBQW9CLEVBQ3BCLE1BQWtCO0lBRWxCLDhEQUE4RDtJQUM5RCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWdCLEdBQUUsQ0FBQztJQUN4QyxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELE1BQU0sSUFBSSxHQUFHLElBQUEsY0FBVyxFQUFDLElBQUksVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFcEQscUJBQXFCO0lBQ3JCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEUseUJBQXlCO0lBQ3pCLE1BQU0sSUFBSSxHQUFHLE1BQU0sS0FBSyxDQUFDLFVBQVUsRUFBRTtRQUNuQyxNQUFNLEVBQUUsS0FBSztRQUNiLElBQUksRUFBRSxNQUFNO0tBQ2IsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsMENBQTBDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ1UsUUFBQSxnQkFBZ0IsR0FBRyxrQkFBa0IsQ0FBQztBQUVuRDs7R0FFRztBQUNILE1BQXNCLFdBQVc7SUFJL0I7Ozs7OztPQU1HO0lBQ0gsTUFBTSxDQUFDLFFB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RlJlc3BvbnNlLFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVkaXRQb2xpY3ksXG4gIEVtcHR5LFxuICBJbnZva2VDMkZSZXNwb25zZSxcbiAgSnNvblZhbHVlLFxuICBLZXlQb2xpY3ksXG4gIEtleVBvbGljeVJ1bGUsXG4gIE1mYVJlY2VpcHRzLFxuICBQb2xpY3lBdHRhY2hlZFRvSWQsXG4gIFBvbGljeVR5cGUsXG4gIFJvbGVQb2xpY3ksXG4gIFJvbGVQb2xpY3lSdWxlLFxuICBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICBXYXNtUnVsZSxcbiAgQWNlQXR0cmlidXRlLFxuICBQb2xpY3lBY3Rpb24sXG4gIEFjZSxcbiAgUG9saWN5SW5mbyxcbn0gZnJvbSBcIi5cIjtcblxuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0bywgZW5jb2RlVG9IZXgsIGRlY29kZUZyb21IZXggfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIE5hbWVkIHBvbGljeSBydWxlIHR5cGUuXG4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJ1bGUgPSBLZXlQb2xpY3lSdWxlIHwgUm9sZVBvbGljeVJ1bGUgfCBXYXNtUnVsZTtcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB7QGxpbmsgUG9saWN5SW5mb30gd2l0aCBhIG1vcmUgZGV0YWlsZWQgYGFjbGAgdHlwZS5cbiAqL1xudHlwZSBOYW1lZFBvbGljeUluZm8gPSBQb2xpY3lJbmZvICYge1xuICBhY2w/OiBQb2xpY3lBY2w7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCBrZXkgcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lJbmZvID0gTmFtZWRQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJLZXlcIjtcbn07XG5cbi8qKlxuICogVGhlIHBvbGljeSBpbmZvIGZvciBhIG5hbWVkIHJvbGUgcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiUm9sZVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQgd2FzbSBwb2xpY3kuXG4gKi9cbmV4cG9ydCB0eXBlIFdhc21Qb2xpY3lJbmZvID0gTmFtZWRQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJXYXNtXCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEMyRkluZm8gPSBXYXNtUG9saWN5SW5mbztcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB2YWxpZCBuYW1lZCBwb2xpY3kgdmVyc2lvbiBzdHJpbmdzLlxuICovXG5leHBvcnQgdHlwZSBWZXJzaW9uID0gYHYke251bWJlcn1gIHwgYGxhdGVzdGA7XG5cbi8qKiBBIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyeS4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeUFjZSA9IEFjZTxQb2xpY3lBY3Rpb24sIFBvbGljeUN0eD47XG5cbi8qKiBBIHBvbGljeSBhY2Nlc3MgY29udHJvbCBsaXN0LiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5QWNsID0gUG9saWN5QWNlW107XG5cbi8qKiBBZGRpdGlvbmFsIGNvbnRleHRzIHdoZW4gdXNpbmcgcG9saWNpZXMuICovXG5leHBvcnQgdHlwZSBQb2xpY3lDdHggPSB7XG4gIC8qKlxuICAgKiBUaGUgcmVzb3VyY2VzIChrZXlzLCByb2xlcywgYW5kIGtleS1pbi1yb2xlcykgdGhhdCB0aGUgYWNjZXNzIGNvbnRyb2wgZW50cnlcbiAgICogYXBwbGllcyB0by5cbiAgICovXG4gIHJlc291cmNlczogQWNlQXR0cmlidXRlPFBvbGljeVJlc291cmNlPjtcbn07XG5cbi8qKiBBIHJlc291cmNlIGEgcG9saWN5IGlzIGludm9rZWQgd2l0aCBvciBhdHRhY2hlZCB0by4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJlc291cmNlID1cbiAgLyoqIEEga2V5IG9yIHJvbGUgaWQuICovXG4gIHwgc3RyaW5nXG4gIC8qKiBLZXlzIGF0dGFjaGVkIHRvIHJvbGVzLiAqL1xuICB8IHsga2V5X2lkczogXCIqXCIgfCBzdHJpbmdbXTsgcm9sZV9pZHM6IFwiKlwiIHwgc3RyaW5nW10gfTtcblxuLyoqXG4gKiBVcGxvYWQgdGhlIGdpdmVuIFdhc20gQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIFRoZSBXYXNtIGZ1bmN0aW9uIG9iamVjdCBoYXNoIHRvIHVzZSBmb3IgY3JlYXRpbmcvdXBkYXRpbmcgQzJGIHBvbGljaWVzLlxuICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIHBvbGljeSBmYWlscy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkV2FzbUZ1bmN0aW9uKFxuICBhcGlDbGllbnQ6IEFwaUNsaWVudCxcbiAgcG9saWN5OiBVaW50OEFycmF5LFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgLy8gZ2V0IHRoZSBTSEEtMjU2IGhhc2ggb2YgdGhlIGZ1bmN0aW9uIHRvIGdldCB0aGUgdXBsb2FkIHVybC5cbiAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICBjb25zdCBoYXNoQnl0ZXMgPSBhd2FpdCBzdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiLCBwb2xpY3kpO1xuICBjb25zdCBoYXNoID0gZW5jb2RlVG9IZXgobmV3IFVpbnQ4QXJyYXkoaGFzaEJ5dGVzKSk7XG5cbiAgLy8gZ2V0IHRoZSB1cGxvYWQgVVJMXG4gIGNvbnN0IHsgc2lnbmVkX3VybCB9ID0gYXdhaXQgYXBpQ2xpZW50Lndhc21Qb2xpY3lVcGxvYWQoeyBoYXNoIH0pO1xuXG4gIC8vIHVwbG9hZCB0aGUgd2FzbSBvYmplY3RcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKHNpZ25lZF91cmwsIHtcbiAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgYm9keTogcG9saWN5LFxuICB9KTtcblxuICBpZiAoIXJlc3Aub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB1cGxvYWQgZnVuY3Rpb24gd2l0aCBzdGF0dXM6ICR7cmVzcC5zdGF0dXN9OiAke3Jlc3Auc3RhdHVzVGV4dH1gKTtcbiAgfVxuXG4gIHJldHVybiBoYXNoO1xufVxuXG4vKipcbiAqIFVwbG9hZCB0aGUgZ2l2ZW4gV2FzbSBwb2xpY3kuXG4gKlxuICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIGZ1bmN0aW9uLlxuICogQHJldHVybnMgVGhlIFdhc20gZnVuY3Rpb24gb2JqZWN0IGhhc2ggdG8gdXNlIGZvciBjcmVhdGluZy91cGRhdGluZyBDMkYgcG9saWNpZXMuXG4gKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgcG9saWN5IGZhaWxzLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjb25zdCB1cGxvYWRXYXNtUG9saWN5ID0gdXBsb2FkV2FzbUZ1bmN0aW9uO1xuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIGZvciBzaGFyZWQgbWV0aG9kcyBiZXR3ZWVuIGtleSwgcm9sZSBhbmQgV2FzbSBwb2xpY2llcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5hbWVkUG9saWN5IHtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGFwaUNsaWVudDogQXBpQ2xpZW50O1xuICBwcm90ZWN0ZWQgZGF0YTogTmFtZWRQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgbWV0aG9kIGZvciBjcmVhdGluZyBhIG5hbWVkIHBvbGljeSBmcm9tIGEgcG9saWN5IGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIGFwaSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgcG9saWN5IGluZm8uXG4gICAqIEByZXR1cm5zIFRoZSBuYW1lZCBwb2xpY3kgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gaW5mby5cbiAgICovXG4gIHN0YXRpYyBmcm9tSW5mbyhhcGlDbGllbnQ6IEFwaUNsaWVudCwgaW5mbzogUG9saWN5SW5mbyk6IE5hbWVkUG9saWN5IHtcbiAgICBzd2l0Y2ggKGluZm8ucG9saWN5X3R5cGUpIHtcbiAgICAgIGNhc2UgXCJLZXlcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBOYW1lZEtleVBvbGljeShhcGlDbGllbnQsIGluZm8gYXMgS2V5UG9saWN5SW5mbyk7XG4gICAgICBjYXNlIFwiUm9sZVwiOlxuICAgICAgICByZXR1cm4gbmV3IE5hbWVkUm9sZVBvbGljeShhcGlDbGllbnQsIGluZm8gYXMgUm9sZVBvbGljeUluZm8pO1xuICAgICAgY2FzZSBcIldhc21cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBDMkZGdW5jdGlvbihhcGlDbGllbnQsIGluZm8gYXMgQzJGSW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgaWQgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wb2xpY3lfaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSB0eXBlICovXG4gIGdldCBwb2xpY3lUeXBlKCk6IFBvbGljeVR5cGUge1xuICAgIHJldHVybiB0aGlzLmRhdGEucG9saWN5X3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgcG9saWN5IHZlcnNpb24gdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgdmVyc2lvbih2ZXJzaW9uOiBWZXJzaW9uKTogUHJvbWlzZTxOYW1lZFBvbGljeVJ1bGVzPiB7XG4gICAgbGV0IHZlcnNpb25JbmZvO1xuXG4gICAgaWYgKHZlcnNpb24gPT0gYHYke3RoaXMuZGF0YS52ZXJzaW9ufWApIHtcbiAgICAgIHZlcnNpb25JbmZvID0gdGhpcy5kYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZXJzaW9uSW5mbyA9IChhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdmVyc2lvbikpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE5hbWVkUG9saWN5UnVsZXModGhpcy5hcGlDbGllbnQsIHZlcnNpb25JbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgbGF0ZXN0KCk6IFByb21pc2U8TmFtZWRQb2xpY3lSdWxlcz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKFwibGF0ZXN0XCIpO1xuICAgIHJldHVybiBuZXcgTmFtZWRQb2xpY3lSdWxlcyh0aGlzLmFwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgY3VycmVudCBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgbmFtZS5cbiAgICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IG5hbWUgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuZXcgcG9saWN5IG5hbWUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBuYW1lIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgb3duZXIgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgb2YgdGhlIHBvbGljeSBvd25lci5cbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgb3duZXIgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBvd25lciBUaGUgbmV3IG93bmVyIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRPd25lcihvd25lcjogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IG1ldGFkYXRhLlxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxKc29uVmFsdWU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm1ldGFkYXRhIGFzIEpzb25WYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbmFtZWQgcG9saWN5IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgdmFsdWUpLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgVGhlIG5ldyBtZXRhZGF0YSBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBKc29uVmFsdWUsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlZGl0IHBvbGljeSBmb3IgdGhpcyBuYW1lZCBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGFjY2VzcyBjb250cm9sIGVudHJpZXMgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzIGZvciB0aGlzIG5hbWVkIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGFjbCgpOiBQcm9taXNlPFBvbGljeUFjbCB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuYWNsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbmV3IGFjY2VzcyBjb250cm9sIGVudHJpZXMgZm9yIHRoZSBuYW1lZCBwb2xpY3kgKG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBlbnRyaWVzKS5cbiAgICpcbiAgICogQHBhcmFtIGFjbCBUaGUgYWNjZXNzIGNvbnRyb2wgZW50cmllcyB0byBzZXQuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRBY2woYWNsOiBQb2xpY3lBY2wsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgYWNsIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhhdCBhbGwgdmVyc2lvbnMgb2YgdGhpcyBwb2xpY3lcbiAgICogYXJlIGF0dGFjaGVkIHRvLlxuICAgKi9cbiAgYXN5bmMgYWxsQXR0YWNoZWQoKTogUHJvbWlzZTxQb2xpY3lBdHRhY2hlZFRvSWRbXT4ge1xuICAgIC8vIHRoZXJlIGlzIG5vIHNpbmdsZS1jYWxsIHdheSB0byBhY2hpZXZlIHRoaXMuIFNvIGluc3RlYWQsIHdlXG4gICAgLy8gMS4gR2V0IHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5XG4gICAgLy8gMi4gRm9yIGFsbCB2ZXJzaW9ucyBgdjBgIHRvIGBsYXRlc3RgLCBmZXRjaCB0aGUgcG9saWN5IGluZm9cbiAgICAvLyAzLiBKb2luIGFsbCBwb2xpY3kgYGF0dGFjaGVkX3RvYCBhcnJheXNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaChcImxhdGVzdFwiKTtcblxuICAgIGNvbnN0IGxhdGVzdCA9IGRhdGEudmVyc2lvbjtcbiAgICBjb25zdCB2ZXJzaW9ucyA9IEFycmF5LmZyb20oQXJyYXkobGF0ZXN0ICsgMSkua2V5cygpKTtcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDtcbiAgICBsZXQgYWxsQXR0YWNoZWQ6IFBvbGljeUF0dGFjaGVkVG9JZFtdID0gW107XG5cbiAgICBmb3IgKGxldCBiYXRjaCA9IDA7IGJhdGNoIDwgdmVyc2lvbnMubGVuZ3RoOyBiYXRjaCArPSBiYXRjaFNpemUpIHtcbiAgICAgIGNvbnN0IHJzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHZlcnNpb25zLnNsaWNlKGJhdGNoLCBiYXRjaCArIGJhdGNoU2l6ZSkubWFwKCh2ZXJzaW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCBgdiR7dmVyc2lvbn1gKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgYWxsQXR0YWNoZWQgPSBhbGxBdHRhY2hlZC5jb25jYXQocnMuZmxhdE1hcCgocG9saWN5KSA9PiBwb2xpY3kuYXR0YWNoZWRfdG8pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsQXR0YWNoZWQuY29uY2F0KGRhdGEuYXR0YWNoZWRfdG8pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIHBvbGljeS5cbiAgICpcbiAgICogVGhpcyBjYW4gZmFpbCBpZiB0aGUgcG9saWN5IGlzIHN0aWxsIGF0dGFjaGVkIHRvIGFueSBrZXksIHJvbGUsIG9yIGtleSBpbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBOYW1lZFBvbGljeUluZm8pIHtcbiAgICB0aGlzLmFwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlKFxuICAgIHJlcXVlc3Q6IFVwZGF0ZVBvbGljeVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy5kYXRhID0gcmVzcC5kYXRhKCkgYXMgTmFtZWRQb2xpY3lJbmZvO1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHZlcnNpb24gb2YgdGhlIHBvbGljeSB0byBmZXRjaC4gRGVmYXVsdHMgdG8gXCJsYXRlc3RcIi5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZmV0Y2godmVyc2lvbjogVmVyc2lvbiA9IFwibGF0ZXN0XCIpOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIHRoaXMuZGF0YSA9IChhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdmVyc2lvbikpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIGtleSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZEtleVBvbGljeSBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogS2V5UG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHJ1bGVzIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBLZXlQb2xpY3lJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIHJvbGUgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRSb2xlUG9saWN5IGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBSb2xlUG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBydWxlcyB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZVBvbGljeUluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uIChDMkYpLlxuICpcbiAqIFRoaXMgY2xhc3MgZXh0ZW5kcyBOYW1lZFBvbGljeSBiZWNhdXNlIEMyRiBmdW5jdGlvbnMgY2FuIGJlIGF0dGFjaGVkXG4gKiB0byBrZXlzIGFuZCByb2xlcyBsaWtlIGEgbmFtZWQgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgQzJGRnVuY3Rpb24gZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IEMyRkluZm87XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGlzIEMyRiBmdW5jdGlvbiB3aXRoIGEgbmV3IFdhc20gZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBXYXNtIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIGZ1bmN0aW9uIGZhaWxzLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkLlxuICAgKi9cbiAgYXN5bmMgc2V0V2FzbUZ1bmN0aW9uKHBvbGljeTogVWludDhBcnJheSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgLy8gdXBsb2FkIHRoZSBwb2xpY3kgb2JqZWN0XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IHVwbG9hZFdhc21GdW5jdGlvbih0aGlzLmFwaUNsaWVudCwgcG9saWN5KTtcblxuICAgIC8vIHVwZGF0ZSB0aGlzIHBvbGljeSB3aXRoIHRoZSBuZXcgcG9saWN5IHZlcnNpb24uXG4gICAgY29uc3QgYm9keTogVXBkYXRlUG9saWN5UmVxdWVzdCA9IHsgcnVsZXM6IFt7IGhhc2ggfV0gfTtcbiAgICB0aGlzLmRhdGEgPSAoYXdhaXQgdGhpcy51cGRhdGUoYm9keSwgbWZhUmVjZWlwdCkpIGFzIEMyRkluZm87XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIG9wdGlvbmFsIGtleSBpZCB0aGF0IHRoZSBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgd2l0aC5cbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIHRvIGludm9rZS4gRGVmYXVsdHMgdG8gXCJsYXRlc3RcIi5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIG9wdGlvbmFsIHNpZ24gcmVxdWVzdCBib2R5IHRoYXQgd2lsbCBiZSBzZW50IHRvIHRoZSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgb3B0aW9uYWwgcm9sZSBpZCB0aGF0IHRoZSBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgYnkuXG4gICAqIElmIGB1bmRlZmluZWRgLCB0aGUgcG9saWN5IHdpbGwgYmUgaW52b2tlZCBieSB0aGUgdXNlciBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIGludm9raW5nIHRoZSBmdW5jdGlvbi5cbiAgICovXG4gIGFzeW5jIGludm9rZShcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB2ZXJzaW9uOiBWZXJzaW9uID0gXCJsYXRlc3RcIixcbiAgICByZXF1ZXN0PzogSnNvblZhbHVlLFxuICAgIHJvbGVJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDMkZJbnZvY2F0aW9uPiB7XG4gICAgLy8gVE9ETyBJZGVhbGx5LCBgdmVyc2lvbmAgc2hvdWxkIGJlIHRoZSBmaXJzdCBwYXJhbWV0ZXIuIEJ1dCBmb3IgYmFja3dhcmRzXG4gICAgLy8gY29tcGF0aWJpbGl0eSwgd2Uga2VlcCBga2V5SWRgIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIgZm9yIG5vdy5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5SW52b2tlKHRoaXMuaWQsIHZlcnNpb24sIHtcbiAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICByZXF1ZXN0LFxuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgUG9saWN5SW52b2NhdGlvbihyZXNwKTtcbiAgfVxuXG4gIC8vIEJhY2t3YXJkcyBjb21wYWJpbGl0eSB3aXRoIE5hbWVkIFdhc20gUG9saWN5IG5hbWVzXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIHRoZSBuZXcgV2FzbSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgcG9saWN5IG9iamVjdCBmYWlscy5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZC5cbiAgICovXG4gIHNldFdhc21Qb2xpY3kgPSB0aGlzLnNldFdhc21GdW5jdGlvbjtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IEMyRkluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHNwZWNpZmljIHZlcnNpb24gb2YgYSBuYW1lZCBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZFBvbGljeVJ1bGVzIHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBwb2xpY3kgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2RhdGE6IE5hbWVkUG9saWN5SW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBleGFtcGxlIE5hbWVkUG9saWN5I2E0YTQ1Y2MyLTA2NDItNGM5OC1iNmJkLTBkYTM0N2Q2MDhhNFxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucG9saWN5X2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdGhpcyBvYmplY3QgY29udGFpbnMuXG4gICAqL1xuICBnZXQgdmVyc2lvbigpOiBWZXJzaW9uIHtcbiAgICByZXR1cm4gYHYke3RoaXMuI2RhdGEudmVyc2lvbn1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgcnVsZXMuXG4gICAqXG4gICAqIEBleGFtcGxlIFsgXCJBc3NlcnRFcmMyMFR4XCIgXVxuICAgKi9cbiAgZ2V0IHJ1bGVzKCk6IFBvbGljeVJ1bGVbXSB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucnVsZXMgYXMgUG9saWN5UnVsZVtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhpcyB2ZXJzaW9uIG9mIHRoZSBwb2xpY3lcbiAgICogICAgICAgICAgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBhc3luYyBhbGxBdHRhY2hlZCgpOiBQcm9taXNlPFBvbGljeUF0dGFjaGVkVG9JZFtdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hdHRhY2hlZF90bztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTmFtZWRQb2xpY3lJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSAoYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB0aGlzLnZlcnNpb24pKSBhcyBOYW1lZFBvbGljeUluZm87XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgcmVzdWx0IG9mIGludm9raW5nIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQzJGSW52b2NhdGlvbiB7XG4gIHJlYWRvbmx5ICNkYXRhOiBJbnZva2VDMkZSZXNwb25zZTtcblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSByZXNwb25zZSBpdHNlbGYuICovXG4gIGdldCByZXNwb25zZSgpOiBDMkZSZXNwb25zZSB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucmVzcG9uc2U7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHN0YW5kYXJkIG91dHB1dCBzdHJlYW0gYXMgcmF3IGJ5dGVzLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcsXG4gICAqIHVzZSB7QGxpbmsgVGV4dERlY29kZXJ9IHRvIGRlY29kZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0YW5kYXJkIG91dHB1dCBzdHJlYW0uXG4gICAqL1xuICBnZXQgc3Rkb3V0Qnl0ZXMoKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIGRlY29kZUZyb21IZXgodGhpcy4jZGF0YS5zdGRvdXQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFuZGFyZCBlcnJvciBzdHJlYW0gYXMgcmF3IGJ5dGVzLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcsIHVzZVxuICAgKiB7QGxpbmsgVGV4dERlY29kZXJ9IHRvIGRlY29kZS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0YW5kYXJkIGVycm9yIHN0cmVhbS5cbiAgICovXG4gIGdldCBzdGRlcnJCeXRlcygpOiBVaW50OEFycmF5IHtcbiAgICByZXR1cm4gZGVjb2RlRnJvbUhleCh0aGlzLiNkYXRhLnN0ZGVycik7XG4gIH1cblxuICAvKipcbiAgICogVGhlIHN0YW5kYXJkIG91dHB1dCBzdHJlYW0gYXMgYSBCdWZmZXIuIFVzdWFsbHkgYSBVVEYtOCBlbmNvZGVkIHN0cmluZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0YW5kYXJkIG91dHB1dCBzdHJlYW0uXG4gICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgc3Rkb3V0Qnl0ZXN9IGluc3RlYWQgZm9yIGJyb3dzZXIgY29tcGF0aWJpbGl0eS5cbiAgICovXG4gIGdldCBzdGRvdXQoKTogQnVmZmVyIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1nbG9iYWxzIC0tIEJ1ZmZlciByZXR1cm4gdHlwZSBwcmVzZXJ2ZWQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMuc3Rkb3V0Qnl0ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFuZGFyZCBlcnJvciBzdHJlYW0gYXMgYSBCdWZmZXIuIFVzdWFsbHkgYSBVVEYtOCBlbmNvZGVkIHN0cmluZy5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0YW5kYXJkIGVycm9yIHN0cmVhbS5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIHtAbGluayBzdGRlcnJCeXRlc30gaW5zdGVhZCBmb3IgYnJvd3NlciBjb21wYXRpYmlsaXR5LlxuICAgKi9cbiAgZ2V0IHN0ZGVycigpOiBCdWZmZXIge1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1yZXN0cmljdGVkLWdsb2JhbHMgLS0gQnVmZmVyIHJldHVybiB0eXBlIHByZXNlcnZlZCBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICByZXR1cm4gQnVmZmVyLmZyb20odGhpcy5zdGRlcnJCeXRlcyk7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YTogSW52b2tlQzJGUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vLyBCYWNrd2FyZHMgY29tcGFiaWxpdHkgd2l0aCBOYW1lZCBXYXNtIFBvbGljeSBuYW1lc1xuXG4vKiogQSByZXByZXNlbnRhdGlvbiBvZiBhIFdhc20gcG9saWN5LiAqL1xuZXhwb3J0IHR5cGUgTmFtZWRXYXNtUG9saWN5ID0gQzJGRnVuY3Rpb247XG4vKiogQSByZXByZXNlbnRhdGlvbiBvZiBhIFdhc20gcG9saWN5LiAqL1xuZXhwb3J0IGNvbnN0IE5hbWVkV2FzbVBvbGljeSA9IEMyRkZ1bmN0aW9uO1xuXG4vKiogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIG5hbWVkIFdBU00gcG9saWN5LiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5SW52b2NhdGlvbiA9IEMyRkludm9jYXRpb247XG4vKiogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIG5hbWVkIFdBU00gcG9saWN5LiAqL1xuZXhwb3J0IGNvbnN0IFBvbGljeUludm9jYXRpb24gPSBDMkZJbnZvY2F0aW9uO1xuIl19