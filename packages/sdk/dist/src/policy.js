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
    const hash = "0x" + Buffer.from(hashBytes).toString("hex");
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
    /** @returns The standard output stream. Usually a UTF-8 encoded string. */
    get stdout() {
        return this.fromHex(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stdout);
    }
    /** @returns The standard error stream. Usually a UTF-8 encoded string. */
    get stderr() {
        return this.fromHex(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stderr);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Helper method for converting hex-encoded data to a `Buffer`.
     *
     * @param hex The hex-encoded data.
     * @returns The data.
     */
    fromHex(hex) {
        return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFtR0EsZ0RBdUJDO0FBbkdELHdCQUFxQztBQW1FckM7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLFNBQW9CLEVBQ3BCLE1BQWtCO0lBRWxCLDhEQUE4RDtJQUM5RCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWdCLEdBQUUsQ0FBQztJQUN4QyxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUUzRCxxQkFBcUI7SUFDckIsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU0sU0FBUyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVsRSx5QkFBeUI7SUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsVUFBVSxFQUFFO1FBQ25DLE1BQU0sRUFBRSxLQUFLO1FBQ2IsSUFBSSxFQUFFLE1BQU07S0FDYixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUMvRixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDVSxRQUFBLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO0FBRW5EOztHQUVHO0FBQ0gsTUFBc0IsV0FBVztJQUkvQjs7Ozs7O09B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ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBDMkZSZXNwb25zZSxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFZGl0UG9saWN5LFxuICBFbXB0eSxcbiAgSW52b2tlQzJGUmVzcG9uc2UsXG4gIEpzb25WYWx1ZSxcbiAgS2V5UG9saWN5LFxuICBLZXlQb2xpY3lSdWxlLFxuICBNZmFSZWNlaXB0cyxcbiAgUG9saWN5QXR0YWNoZWRUb0lkLFxuICBQb2xpY3lUeXBlLFxuICBSb2xlUG9saWN5LFxuICBSb2xlUG9saWN5UnVsZSxcbiAgVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgV2FzbVJ1bGUsXG4gIEFjZUF0dHJpYnV0ZSxcbiAgUG9saWN5QWN0aW9uLFxuICBBY2UsXG4gIFBvbGljeUluZm8sXG59IGZyb20gXCIuXCI7XG5cbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIE5hbWVkIHBvbGljeSBydWxlIHR5cGUuXG4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJ1bGUgPSBLZXlQb2xpY3lSdWxlIHwgUm9sZVBvbGljeVJ1bGUgfCBXYXNtUnVsZTtcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB7QGxpbmsgUG9saWN5SW5mb30gd2l0aCBhIG1vcmUgZGV0YWlsZWQgYGFjbGAgdHlwZS5cbiAqL1xudHlwZSBOYW1lZFBvbGljeUluZm8gPSBQb2xpY3lJbmZvICYge1xuICBhY2w/OiBQb2xpY3lBY2w7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCBrZXkgcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lJbmZvID0gTmFtZWRQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJLZXlcIjtcbn07XG5cbi8qKlxuICogVGhlIHBvbGljeSBpbmZvIGZvciBhIG5hbWVkIHJvbGUgcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBSb2xlUG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiUm9sZVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQgd2FzbSBwb2xpY3kuXG4gKi9cbmV4cG9ydCB0eXBlIFdhc21Qb2xpY3lJbmZvID0gTmFtZWRQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJXYXNtXCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gKi9cbmV4cG9ydCB0eXBlIEMyRkluZm8gPSBXYXNtUG9saWN5SW5mbztcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB2YWxpZCBuYW1lZCBwb2xpY3kgdmVyc2lvbiBzdHJpbmdzLlxuICovXG5leHBvcnQgdHlwZSBWZXJzaW9uID0gYHYke251bWJlcn1gIHwgYGxhdGVzdGA7XG5cbi8qKiBBIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyeS4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeUFjZSA9IEFjZTxQb2xpY3lBY3Rpb24sIFBvbGljeUN0eD47XG5cbi8qKiBBIHBvbGljeSBhY2Nlc3MgY29udHJvbCBsaXN0LiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5QWNsID0gUG9saWN5QWNlW107XG5cbi8qKiBBZGRpdGlvbmFsIGNvbnRleHRzIHdoZW4gdXNpbmcgcG9saWNpZXMuICovXG5leHBvcnQgdHlwZSBQb2xpY3lDdHggPSB7XG4gIC8qKlxuICAgKiBUaGUgcmVzb3VyY2VzIChrZXlzLCByb2xlcywgYW5kIGtleS1pbi1yb2xlcykgdGhhdCB0aGUgYWNjZXNzIGNvbnRyb2wgZW50cnlcbiAgICogYXBwbGllcyB0by5cbiAgICovXG4gIHJlc291cmNlczogQWNlQXR0cmlidXRlPFBvbGljeVJlc291cmNlPjtcbn07XG5cbi8qKiBBIHJlc291cmNlIGEgcG9saWN5IGlzIGludm9rZWQgd2l0aCBvciBhdHRhY2hlZCB0by4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJlc291cmNlID1cbiAgLyoqIEEga2V5IG9yIHJvbGUgaWQuICovXG4gIHwgc3RyaW5nXG4gIC8qKiBLZXlzIGF0dGFjaGVkIHRvIHJvbGVzLiAqL1xuICB8IHsga2V5X2lkczogXCIqXCIgfCBzdHJpbmdbXTsgcm9sZV9pZHM6IFwiKlwiIHwgc3RyaW5nW10gfTtcblxuLyoqXG4gKiBVcGxvYWQgdGhlIGdpdmVuIFdhc20gQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICpcbiAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIFRoZSBXYXNtIGZ1bmN0aW9uIG9iamVjdCBoYXNoIHRvIHVzZSBmb3IgY3JlYXRpbmcvdXBkYXRpbmcgQzJGIHBvbGljaWVzLlxuICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIHBvbGljeSBmYWlscy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkV2FzbUZ1bmN0aW9uKFxuICBhcGlDbGllbnQ6IEFwaUNsaWVudCxcbiAgcG9saWN5OiBVaW50OEFycmF5LFxuKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgLy8gZ2V0IHRoZSBTSEEtMjU2IGhhc2ggb2YgdGhlIGZ1bmN0aW9uIHRvIGdldCB0aGUgdXBsb2FkIHVybC5cbiAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICBjb25zdCBoYXNoQnl0ZXMgPSBhd2FpdCBzdWJ0bGUuZGlnZXN0KFwiU0hBLTI1NlwiLCBwb2xpY3kpO1xuICBjb25zdCBoYXNoID0gXCIweFwiICsgQnVmZmVyLmZyb20oaGFzaEJ5dGVzKS50b1N0cmluZyhcImhleFwiKTtcblxuICAvLyBnZXQgdGhlIHVwbG9hZCBVUkxcbiAgY29uc3QgeyBzaWduZWRfdXJsIH0gPSBhd2FpdCBhcGlDbGllbnQud2FzbVBvbGljeVVwbG9hZCh7IGhhc2ggfSk7XG5cbiAgLy8gdXBsb2FkIHRoZSB3YXNtIG9iamVjdFxuICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goc2lnbmVkX3VybCwge1xuICAgIG1ldGhvZDogXCJQVVRcIixcbiAgICBib2R5OiBwb2xpY3ksXG4gIH0pO1xuXG4gIGlmICghcmVzcC5vaykge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHVwbG9hZCBmdW5jdGlvbiB3aXRoIHN0YXR1czogJHtyZXNwLnN0YXR1c306ICR7cmVzcC5zdGF0dXNUZXh0fWApO1xuICB9XG5cbiAgcmV0dXJuIGhhc2g7XG59XG5cbi8qKlxuICogVXBsb2FkIHRoZSBnaXZlbiBXYXNtIHBvbGljeS5cbiAqXG4gKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgV2FzbSBmdW5jdGlvbiBvYmplY3QgaGFzaCB0byB1c2UgZm9yIGNyZWF0aW5nL3VwZGF0aW5nIEMyRiBwb2xpY2llcy5cbiAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgZmFpbHMuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGNvbnN0IHVwbG9hZFdhc21Qb2xpY3kgPSB1cGxvYWRXYXNtRnVuY3Rpb247XG5cbi8qKlxuICogQWJzdHJhY3QgY2xhc3MgZm9yIHNoYXJlZCBtZXRob2RzIGJldHdlZW4ga2V5LCByb2xlIGFuZCBXYXNtIHBvbGljaWVzLlxuICovXG5leHBvcnQgYWJzdHJhY3QgY2xhc3MgTmFtZWRQb2xpY3kge1xuICBwcm90ZWN0ZWQgcmVhZG9ubHkgYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gIHByb3RlY3RlZCBkYXRhOiBOYW1lZFBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgZm9yIGNyZWF0aW5nIGEgbmFtZWQgcG9saWN5IGZyb20gYSBwb2xpY3kgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgYXBpIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBpbmZvIFRoZSBwb2xpY3kgaW5mby5cbiAgICogQHJldHVybnMgVGhlIG5hbWVkIHBvbGljeSBvYmplY3QgZm9yIHRoZSBnaXZlbiBpbmZvLlxuICAgKi9cbiAgc3RhdGljIGZyb21JbmZvKGFwaUNsaWVudDogQXBpQ2xpZW50LCBpbmZvOiBQb2xpY3lJbmZvKTogTmFtZWRQb2xpY3kge1xuICAgIHN3aXRjaCAoaW5mby5wb2xpY3lfdHlwZSkge1xuICAgICAgY2FzZSBcIktleVwiOlxuICAgICAgICByZXR1cm4gbmV3IE5hbWVkS2V5UG9saWN5KGFwaUNsaWVudCwgaW5mbyBhcyBLZXlQb2xpY3lJbmZvKTtcbiAgICAgIGNhc2UgXCJSb2xlXCI6XG4gICAgICAgIHJldHVybiBuZXcgTmFtZWRSb2xlUG9saWN5KGFwaUNsaWVudCwgaW5mbyBhcyBSb2xlUG9saWN5SW5mbyk7XG4gICAgICBjYXNlIFwiV2FzbVwiOlxuICAgICAgICByZXR1cm4gbmV3IEMyRkZ1bmN0aW9uKGFwaUNsaWVudCwgaW5mbyBhcyBDMkZJbmZvKTtcbiAgICB9XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSBpZCAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnBvbGljeV9pZDtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgcG9saWN5IHR5cGUgKi9cbiAgZ2V0IHBvbGljeVR5cGUoKTogUG9saWN5VHlwZSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wb2xpY3lfdHlwZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSBwb2xpY3kgdmVyc2lvbiB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyB2ZXJzaW9uKHZlcnNpb246IFZlcnNpb24pOiBQcm9taXNlPE5hbWVkUG9saWN5UnVsZXM+IHtcbiAgICBsZXQgdmVyc2lvbkluZm87XG5cbiAgICBpZiAodmVyc2lvbiA9PSBgdiR7dGhpcy5kYXRhLnZlcnNpb259YCkge1xuICAgICAgdmVyc2lvbkluZm8gPSB0aGlzLmRhdGE7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZlcnNpb25JbmZvID0gKGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB2ZXJzaW9uKSkgYXMgTmFtZWRQb2xpY3lJbmZvO1xuICAgIH1cblxuICAgIHJldHVybiBuZXcgTmFtZWRQb2xpY3lSdWxlcyh0aGlzLmFwaUNsaWVudCwgdmVyc2lvbkluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBsYXRlc3QoKTogUHJvbWlzZTxOYW1lZFBvbGljeVJ1bGVzPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goXCJsYXRlc3RcIik7XG4gICAgcmV0dXJuIG5ldyBOYW1lZFBvbGljeVJ1bGVzKHRoaXMuYXBpQ2xpZW50LCBkYXRhKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBjdXJyZW50IG5hbWUgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBuYW1lLlxuICAgKi9cbiAgYXN5bmMgbmFtZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubmFtZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgbmFtZSBmb3IgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5ldyBwb2xpY3kgbmFtZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE5hbWUobmFtZTogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5hbWUgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgY3VycmVudCBvd25lciBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgdXNlciBpZCBvZiB0aGUgcG9saWN5IG93bmVyLlxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyBvd25lciBmb3IgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIG93bmVyIFRoZSBuZXcgb3duZXIgb2YgdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgbWV0YWRhdGEuXG4gICAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPEpzb25WYWx1ZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubWV0YWRhdGEgYXMgSnNvblZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBuYW1lZCBwb2xpY3kgKG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyB2YWx1ZSkuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBUaGUgbmV3IG1ldGFkYXRhIGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGEobWV0YWRhdGE6IEpzb25WYWx1ZSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVkaXQgcG9saWN5IGZvciB0aGlzIG5hbWVkIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGVkaXRQb2xpY3koKTogUHJvbWlzZTxFZGl0UG9saWN5IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lZGl0X3BvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgZWRpdCBwb2xpY3kgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRFZGl0UG9saWN5KGVkaXRQb2xpY3k6IEVkaXRQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3kgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgYWNjZXNzIGNvbnRyb2wgZW50cmllcyBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjY2VzcyBjb250cm9sIGVudHJpZXMgZm9yIHRoaXMgbmFtZWQgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgYWNsKCk6IFByb21pc2U8UG9saWN5QWNsIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hY2w7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBuZXcgYWNjZXNzIGNvbnRyb2wgZW50cmllcyBmb3IgdGhlIG5hbWVkIHBvbGljeSAob3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGVudHJpZXMpLlxuICAgKlxuICAgKiBAcGFyYW0gYWNsIFRoZSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzIHRvIHNldC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEFjbChhY2w6IFBvbGljeUFjbCwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBhY2wgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgYSBsaXN0IG9mIGFsbCBrZXlzLCByb2xlcywgYW5kIGtleS1pbi1yb2xlcyB0aGF0IGFsbCB2ZXJzaW9ucyBvZiB0aGlzIHBvbGljeVxuICAgKiBhcmUgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBhc3luYyBhbGxBdHRhY2hlZCgpOiBQcm9taXNlPFBvbGljeUF0dGFjaGVkVG9JZFtdPiB7XG4gICAgLy8gdGhlcmUgaXMgbm8gc2luZ2xlLWNhbGwgd2F5IHRvIGFjaGlldmUgdGhpcy4gU28gaW5zdGVhZCwgd2VcbiAgICAvLyAxLiBHZXQgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBwb2xpY3lcbiAgICAvLyAyLiBGb3IgYWxsIHZlcnNpb25zIGB2MGAgdG8gYGxhdGVzdGAsIGZldGNoIHRoZSBwb2xpY3kgaW5mb1xuICAgIC8vIDMuIEpvaW4gYWxsIHBvbGljeSBgYXR0YWNoZWRfdG9gIGFycmF5c1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKFwibGF0ZXN0XCIpO1xuXG4gICAgY29uc3QgbGF0ZXN0ID0gZGF0YS52ZXJzaW9uO1xuICAgIGNvbnN0IHZlcnNpb25zID0gQXJyYXkuZnJvbShBcnJheShsYXRlc3QgKyAxKS5rZXlzKCkpO1xuICAgIGNvbnN0IGJhdGNoU2l6ZSA9IDEwO1xuICAgIGxldCBhbGxBdHRhY2hlZDogUG9saWN5QXR0YWNoZWRUb0lkW10gPSBbXTtcblxuICAgIGZvciAobGV0IGJhdGNoID0gMDsgYmF0Y2ggPCB2ZXJzaW9ucy5sZW5ndGg7IGJhdGNoICs9IGJhdGNoU2l6ZSkge1xuICAgICAgY29uc3QgcnMgPSBhd2FpdCBQcm9taXNlLmFsbChcbiAgICAgICAgdmVyc2lvbnMuc2xpY2UoYmF0Y2gsIGJhdGNoICsgYmF0Y2hTaXplKS5tYXAoKHZlcnNpb24pID0+IHtcbiAgICAgICAgICByZXR1cm4gdGhpcy5hcGlDbGllbnQucG9saWN5R2V0KHRoaXMuaWQsIGB2JHt2ZXJzaW9ufWApO1xuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgICBhbGxBdHRhY2hlZCA9IGFsbEF0dGFjaGVkLmNvbmNhdChycy5mbGF0TWFwKChwb2xpY3kpID0+IHBvbGljeS5hdHRhY2hlZF90bykpO1xuICAgIH1cblxuICAgIHJldHVybiBhbGxBdHRhY2hlZC5jb25jYXQoZGF0YS5hdHRhY2hlZF90byk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoaXMgcG9saWN5LlxuICAgKlxuICAgKiBUaGlzIGNhbiBmYWlsIGlmIHRoZSBwb2xpY3kgaXMgc3RpbGwgYXR0YWNoZWQgdG8gYW55IGtleSwgcm9sZSwgb3Iga2V5IGluIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeURlbGV0ZSh0aGlzLmlkLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IE5hbWVkUG9saWN5SW5mbykge1xuICAgIHRoaXMuYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyB1cGRhdGUoXG4gICAgcmVxdWVzdDogVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8TmFtZWRQb2xpY3lJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0LCBtZmFSZWNlaXB0KTtcbiAgICB0aGlzLmRhdGEgPSByZXNwLmRhdGEoKSBhcyBOYW1lZFBvbGljeUluZm87XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgdmVyc2lvbiBvZiB0aGUgcG9saWN5IHRvIGZldGNoLiBEZWZhdWx0cyB0byBcImxhdGVzdFwiLlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBmZXRjaCh2ZXJzaW9uOiBWZXJzaW9uID0gXCJsYXRlc3RcIik6IFByb21pc2U8TmFtZWRQb2xpY3lJbmZvPiB7XG4gICAgdGhpcy5kYXRhID0gKGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB2ZXJzaW9uKSkgYXMgTmFtZWRQb2xpY3lJbmZvO1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgbmFtZWQga2V5IHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkS2V5UG9saWN5IGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBLZXlQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIG5ldyBydWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBuZXcgcnVsZXMgdG8gdXBkYXRlIHRoZSBwb2xpY3kgd2l0aC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJ1bGVzKHJ1bGVzOiBLZXlQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcnVsZXMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IEtleVBvbGljeUluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgbmFtZWQgcm9sZSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZFJvbGVQb2xpY3kgZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IFJvbGVQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIG5ldyBydWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBuZXcgcnVsZXMgdG8gdXBkYXRlIHRoZSBwb2xpY3kgd2l0aC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJ1bGVzKHJ1bGVzOiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHJ1bGVzIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBSb2xlUG9saWN5SW5mbykge1xuICAgIHN1cGVyKGFwaUNsaWVudCwgZGF0YSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24gKEMyRikuXG4gKlxuICogVGhpcyBjbGFzcyBleHRlbmRzIE5hbWVkUG9saWN5IGJlY2F1c2UgQzJGIGZ1bmN0aW9ucyBjYW4gYmUgYXR0YWNoZWRcbiAqIHRvIGtleXMgYW5kIHJvbGVzIGxpa2UgYSBuYW1lZCBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBDMkZGdW5jdGlvbiBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogQzJGSW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoaXMgQzJGIGZ1bmN0aW9uIHdpdGggYSBuZXcgV2FzbSBmdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IFdhc20gZnVuY3Rpb24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgZnVuY3Rpb24gZmFpbHMuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWQuXG4gICAqL1xuICBhc3luYyBzZXRXYXNtRnVuY3Rpb24ocG9saWN5OiBVaW50OEFycmF5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICAvLyB1cGxvYWQgdGhlIHBvbGljeSBvYmplY3RcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgdXBsb2FkV2FzbUZ1bmN0aW9uKHRoaXMuYXBpQ2xpZW50LCBwb2xpY3kpO1xuXG4gICAgLy8gdXBkYXRlIHRoaXMgcG9saWN5IHdpdGggdGhlIG5ldyBwb2xpY3kgdmVyc2lvbi5cbiAgICBjb25zdCBib2R5OiBVcGRhdGVQb2xpY3lSZXF1ZXN0ID0geyBydWxlczogW3sgaGFzaCB9XSB9O1xuICAgIHRoaXMuZGF0YSA9IChhd2FpdCB0aGlzLnVwZGF0ZShib2R5LCBtZmFSZWNlaXB0KSkgYXMgQzJGSW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBJbnZva2UgdGhpcyBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgb3B0aW9uYWwga2V5IGlkIHRoYXQgdGhlIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCB3aXRoLlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgdmVyc2lvbiBvZiB0aGUgZnVuY3Rpb24gdG8gaW52b2tlLiBEZWZhdWx0cyB0byBcImxhdGVzdFwiLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgb3B0aW9uYWwgc2lnbiByZXF1ZXN0IGJvZHkgdGhhdCB3aWxsIGJlIHNlbnQgdG8gdGhlIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBvcHRpb25hbCByb2xlIGlkIHRoYXQgdGhlIGZ1bmN0aW9uIHdpbGwgYmUgaW52b2tlZCBieS5cbiAgICogSWYgYHVuZGVmaW5lZGAsIHRoZSBwb2xpY3kgd2lsbCBiZSBpbnZva2VkIGJ5IHRoZSB1c2VyIHNlc3Npb24uXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIGZ1bmN0aW9uLlxuICAgKi9cbiAgYXN5bmMgaW52b2tlKFxuICAgIGtleUlkPzogc3RyaW5nLFxuICAgIHZlcnNpb246IFZlcnNpb24gPSBcImxhdGVzdFwiLFxuICAgIHJlcXVlc3Q/OiBKc29uVmFsdWUsXG4gICAgcm9sZUlkPzogc3RyaW5nLFxuICApOiBQcm9taXNlPEMyRkludm9jYXRpb24+IHtcbiAgICAvLyBUT0RPIElkZWFsbHksIGB2ZXJzaW9uYCBzaG91bGQgYmUgdGhlIGZpcnN0IHBhcmFtZXRlci4gQnV0IGZvciBiYWNrd2FyZHNcbiAgICAvLyBjb21wYXRpYmlsaXR5LCB3ZSBrZWVwIGBrZXlJZGAgYXMgdGhlIGZpcnN0IHBhcmFtZXRlciBmb3Igbm93LlxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lJbnZva2UodGhpcy5pZCwgdmVyc2lvbiwge1xuICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgIHJlcXVlc3QsXG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBQb2xpY3lJbnZvY2F0aW9uKHJlc3ApO1xuICB9XG5cbiAgLy8gQmFja3dhcmRzIGNvbXBhYmlsaXR5IHdpdGggTmFtZWQgV2FzbSBQb2xpY3kgbmFtZXNcbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5IHdpdGggdGhlIG5ldyBXYXNtIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IFdhc20gcG9saWN5IG9iamVjdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgb2JqZWN0IGZhaWxzLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkLlxuICAgKi9cbiAgc2V0V2FzbVBvbGljeSA9IHRoaXMuc2V0V2FzbUZ1bmN0aW9uO1xuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogQzJGSW5mbykge1xuICAgIHN1cGVyKGFwaUNsaWVudCwgZGF0YSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgc3BlY2lmaWMgdmVyc2lvbiBvZiBhIG5hbWVkIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkUG9saWN5UnVsZXMge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIHBvbGljeSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjZGF0YTogTmFtZWRQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgSUQgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQGV4YW1wbGUgTmFtZWRQb2xpY3kjYTRhNDVjYzItMDY0Mi00Yzk4LWI2YmQtMGRhMzQ3ZDYwOGE0XG4gICAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5wb2xpY3lfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHZlcnNpb24gb2YgdGhlIHBvbGljeSB0aGlzIG9iamVjdCBjb250YWlucy5cbiAgICovXG4gIGdldCB2ZXJzaW9uKCk6IFZlcnNpb24ge1xuICAgIHJldHVybiBgdiR7dGhpcy4jZGF0YS52ZXJzaW9ufWA7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBydWxlcy5cbiAgICpcbiAgICogQGV4YW1wbGUgWyBcIkFzc2VydEVyYzIwVHhcIiBdXG4gICAqL1xuICBnZXQgcnVsZXMoKTogUG9saWN5UnVsZVtdIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5ydWxlcyBhcyBQb2xpY3lSdWxlW107XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgYSBsaXN0IG9mIGFsbCBrZXlzLCByb2xlcywgYW5kIGtleS1pbi1yb2xlcyB0aGlzIHZlcnNpb24gb2YgdGhlIHBvbGljeVxuICAgKiAgICAgICAgICBpcyBhdHRhY2hlZCB0by5cbiAgICovXG4gIGFzeW5jIGFsbEF0dGFjaGVkKCk6IFByb21pc2U8UG9saWN5QXR0YWNoZWRUb0lkW10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmF0dGFjaGVkX3RvO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBOYW1lZFBvbGljeUluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8TmFtZWRQb2xpY3lJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IChhd2FpdCB0aGlzLiNhcGlDbGllbnQucG9saWN5R2V0KHRoaXMuaWQsIHRoaXMudmVyc2lvbikpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYSBDb25maWRlbnRpYWwgQ2xvdWQgRnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBjbGFzcyBDMkZJbnZvY2F0aW9uIHtcbiAgcmVhZG9ubHkgI2RhdGE6IEludm9rZUMyRlJlc3BvbnNlO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgcG9saWN5IHJlc3BvbnNlIGl0c2VsZi4gKi9cbiAgZ2V0IHJlc3BvbnNlKCk6IEMyRlJlc3BvbnNlIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5yZXNwb25zZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgc3RhbmRhcmQgb3V0cHV0IHN0cmVhbS4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLiAqL1xuICBnZXQgc3Rkb3V0KCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUhleCh0aGlzLiNkYXRhLnN0ZG91dCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHN0YW5kYXJkIGVycm9yIHN0cmVhbS4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLiAqL1xuICBnZXQgc3RkZXJyKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUhleCh0aGlzLiNkYXRhLnN0ZGVycik7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgbWV0aG9kIGZvciBjb252ZXJ0aW5nIGhleC1lbmNvZGVkIGRhdGEgdG8gYSBgQnVmZmVyYC5cbiAgICpcbiAgICogQHBhcmFtIGhleCBUaGUgaGV4LWVuY29kZWQgZGF0YS5cbiAgICogQHJldHVybnMgVGhlIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIGZyb21IZXgoaGV4OiBzdHJpbmcpOiBCdWZmZXIge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShoZXguc3RhcnRzV2l0aChcIjB4XCIpID8gaGV4LnNsaWNlKDIpIDogaGV4LCBcImhleFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhOiBJbnZva2VDMkZSZXNwb25zZSkge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8vIEJhY2t3YXJkcyBjb21wYWJpbGl0eSB3aXRoIE5hbWVkIFdhc20gUG9saWN5IG5hbWVzXG5cbi8qKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgV2FzbSBwb2xpY3kuICovXG5leHBvcnQgdHlwZSBOYW1lZFdhc21Qb2xpY3kgPSBDMkZGdW5jdGlvbjtcbi8qKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgV2FzbSBwb2xpY3kuICovXG5leHBvcnQgY29uc3QgTmFtZWRXYXNtUG9saWN5ID0gQzJGRnVuY3Rpb247XG5cbi8qKiBUaGUgcmVzdWx0IG9mIGludm9raW5nIGEgbmFtZWQgV0FTTSBwb2xpY3kuICovXG5leHBvcnQgdHlwZSBQb2xpY3lJbnZvY2F0aW9uID0gQzJGSW52b2NhdGlvbjtcbi8qKiBUaGUgcmVzdWx0IG9mIGludm9raW5nIGEgbmFtZWQgV0FTTSBwb2xpY3kuICovXG5leHBvcnQgY29uc3QgUG9saWN5SW52b2NhdGlvbiA9IEMyRkludm9jYXRpb247XG4iXX0=