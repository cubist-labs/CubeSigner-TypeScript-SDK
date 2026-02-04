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
        // update this policy with the new policy verison.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFnR0EsZ0RBdUJDO0FBaEdELHdCQUFxQztBQWdFckM7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsa0JBQWtCLENBQ3RDLFNBQW9CLEVBQ3BCLE1BQWtCO0lBRWxCLDhEQUE4RDtJQUM5RCxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUEsbUJBQWdCLEdBQUUsQ0FBQztJQUN4QyxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELE1BQU0sSUFBSSxHQUFHLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUUzRCxxQkFBcUI7SUFDckIsTUFBTSxFQUFFLFVBQVUsRUFBRSxHQUFHLE1BQU0sU0FBUyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUVsRSx5QkFBeUI7SUFDekIsTUFBTSxJQUFJLEdBQUcsTUFBTSxLQUFLLENBQUMsVUFBVSxFQUFFO1FBQ25DLE1BQU0sRUFBRSxLQUFLO1FBQ2IsSUFBSSxFQUFFLE1BQU07S0FDYixDQUFDLENBQUM7SUFFSCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ2IsTUFBTSxJQUFJLEtBQUssQ0FBQywwQ0FBMEMsSUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQztJQUMvRixDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDVSxRQUFBLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO0FBRW5EOztHQUVHO0FBQ0gsTUFBc0IsV0FBVztJQUkvQjs7Ozs7O09B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ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQXBpQ2xpZW50LFxuICBDMkZSZXNwb25zZSxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFZGl0UG9saWN5LFxuICBFbXB0eSxcbiAgSW52b2tlQzJGUmVzcG9uc2UsXG4gIEpzb25WYWx1ZSxcbiAgS2V5UG9saWN5LFxuICBLZXlQb2xpY3lSdWxlLFxuICBNZmFSZWNlaXB0cyxcbiAgUG9saWN5QXR0YWNoZWRUb0lkLFxuICBQb2xpY3lJbmZvLFxuICBQb2xpY3lUeXBlLFxuICBSb2xlUG9saWN5LFxuICBSb2xlUG9saWN5UnVsZSxcbiAgVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgV2FzbVJ1bGUsXG4gIEFjbCxcbiAgQWNlQXR0cmlidXRlLFxuICBQb2xpY3lBY3Rpb24sXG59IGZyb20gXCIuXCI7XG5cbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIE5hbWVkIHBvbGljeSBydWxlIHR5cGUuXG4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJ1bGUgPSBLZXlQb2xpY3lSdWxlIHwgUm9sZVBvbGljeVJ1bGUgfCBXYXNtUnVsZTtcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB7QGxpbmsgUG9saWN5SW5mb30gd2l0aCBhIG1vcmUgZGV0YWlsZWQgYGFjbGAgdHlwZS5cbiAqL1xudHlwZSBOYW1lZFBvbGljeUluZm8gPSBQb2xpY3lJbmZvICYge1xuICBhY2w/OiBBY2w8UG9saWN5QWN0aW9uLCBQb2xpY3lDdHg+O1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQga2V5IHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiS2V5XCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCByb2xlIHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeUluZm8gPSBOYW1lZFBvbGljeUluZm8gJiB7XG4gIHBvbGljeV90eXBlOiBcIlJvbGVcIjtcbn07XG5cbi8qKlxuICogVGhlIHBvbGljeSBpbmZvIGZvciBhIG5hbWVkIHdhc20gcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBXYXNtUG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiV2FzbVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICovXG5leHBvcnQgdHlwZSBDMkZJbmZvID0gV2FzbVBvbGljeUluZm87XG5cbi8qKlxuICogQSBoZWxwZXIgdHlwZSBmb3IgdmFsaWQgbmFtZWQgcG9saWN5IHZlcnNpb24gc3RyaW5ncy5cbiAqL1xuZXhwb3J0IHR5cGUgVmVyc2lvbiA9IGB2JHtudW1iZXJ9YCB8IGBsYXRlc3RgO1xuXG4vKiogQSBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cnkuICovXG5leHBvcnQgdHlwZSBQb2xpY3lBY2wgPSBBY2w8UG9saWN5QWN0aW9uLCBQb2xpY3lDdHg+O1xuXG4vKiogQWRkaXRpb25hbCBjb250ZXh0cyB3aGVuIHVzaW5nIHBvbGljaWVzLiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5Q3R4ID0ge1xuICAvKipcbiAgICogVGhlIHJlc291cmNlcyAoa2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMpIHRoYXQgdGhlIGFjY2VzcyBjb250cm9sIGVudHJ5XG4gICAqIGFwcGxpZXMgdG8uXG4gICAqL1xuICByZXNvdXJjZXM6IEFjZUF0dHJpYnV0ZTxQb2xpY3lSZXNvdXJjZT47XG59O1xuXG4vKiogQSByZXNvdXJjZSBhIHBvbGljeSBpcyBpbnZva2VkIHdpdGggb3IgYXR0YWNoZWQgdG8uICovXG5leHBvcnQgdHlwZSBQb2xpY3lSZXNvdXJjZSA9XG4gIC8qKiBBIGtleSBvciByb2xlIGlkLiAqL1xuICB8IHN0cmluZ1xuICAvKiogS2V5cyBhdHRhY2hlZCB0byByb2xlcy4gKi9cbiAgfCB7IGtleV9pZHM6IFwiKlwiIHwgc3RyaW5nW107IHJvbGVfaWRzOiBcIipcIiB8IHN0cmluZ1tdIH07XG5cbi8qKlxuICogVXBsb2FkIHRoZSBnaXZlbiBXYXNtIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgV2FzbSBmdW5jdGlvbiBvYmplY3QgaGFzaCB0byB1c2UgZm9yIGNyZWF0aW5nL3VwZGF0aW5nIEMyRiBwb2xpY2llcy5cbiAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgZmFpbHMuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZFdhc21GdW5jdGlvbihcbiAgYXBpQ2xpZW50OiBBcGlDbGllbnQsXG4gIHBvbGljeTogVWludDhBcnJheSxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIGdldCB0aGUgU0hBLTI1NiBoYXNoIG9mIHRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIHVwbG9hZCB1cmwuXG4gIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgY29uc3QgaGFzaEJ5dGVzID0gYXdhaXQgc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgcG9saWN5KTtcbiAgY29uc3QgaGFzaCA9IFwiMHhcIiArIEJ1ZmZlci5mcm9tKGhhc2hCeXRlcykudG9TdHJpbmcoXCJoZXhcIik7XG5cbiAgLy8gZ2V0IHRoZSB1cGxvYWQgVVJMXG4gIGNvbnN0IHsgc2lnbmVkX3VybCB9ID0gYXdhaXQgYXBpQ2xpZW50Lndhc21Qb2xpY3lVcGxvYWQoeyBoYXNoIH0pO1xuXG4gIC8vIHVwbG9hZCB0aGUgd2FzbSBvYmplY3RcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKHNpZ25lZF91cmwsIHtcbiAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgYm9keTogcG9saWN5LFxuICB9KTtcblxuICBpZiAoIXJlc3Aub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB1cGxvYWQgZnVuY3Rpb24gd2l0aCBzdGF0dXM6ICR7cmVzcC5zdGF0dXN9OiAke3Jlc3Auc3RhdHVzVGV4dH1gKTtcbiAgfVxuXG4gIHJldHVybiBoYXNoO1xufVxuXG4vKipcbiAqIFVwbG9hZCB0aGUgZ2l2ZW4gV2FzbSBwb2xpY3kuXG4gKlxuICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIGZ1bmN0aW9uLlxuICogQHJldHVybnMgVGhlIFdhc20gZnVuY3Rpb24gb2JqZWN0IGhhc2ggdG8gdXNlIGZvciBjcmVhdGluZy91cGRhdGluZyBDMkYgcG9saWNpZXMuXG4gKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgcG9saWN5IGZhaWxzLlxuICogQGludGVybmFsXG4gKi9cbmV4cG9ydCBjb25zdCB1cGxvYWRXYXNtUG9saWN5ID0gdXBsb2FkV2FzbUZ1bmN0aW9uO1xuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIGZvciBzaGFyZWQgbWV0aG9kcyBiZXR3ZWVuIGtleSwgcm9sZSBhbmQgV2FzbSBwb2xpY2llcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5hbWVkUG9saWN5IHtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGFwaUNsaWVudDogQXBpQ2xpZW50O1xuICBwcm90ZWN0ZWQgZGF0YTogTmFtZWRQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBIZWxwZXIgbWV0aG9kIGZvciBjcmVhdGluZyBhIG5hbWVkIHBvbGljeSBmcm9tIGEgcG9saWN5IGluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIGFwaSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgcG9saWN5IGluZm8uXG4gICAqIEByZXR1cm5zIFRoZSBuYW1lZCBwb2xpY3kgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gaW5mby5cbiAgICovXG4gIHN0YXRpYyBmcm9tSW5mbyhhcGlDbGllbnQ6IEFwaUNsaWVudCwgaW5mbzogUG9saWN5SW5mbyk6IE5hbWVkUG9saWN5IHtcbiAgICBzd2l0Y2ggKGluZm8ucG9saWN5X3R5cGUpIHtcbiAgICAgIGNhc2UgXCJLZXlcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBOYW1lZEtleVBvbGljeShhcGlDbGllbnQsIGluZm8gYXMgS2V5UG9saWN5SW5mbyk7XG4gICAgICBjYXNlIFwiUm9sZVwiOlxuICAgICAgICByZXR1cm4gbmV3IE5hbWVkUm9sZVBvbGljeShhcGlDbGllbnQsIGluZm8gYXMgUm9sZVBvbGljeUluZm8pO1xuICAgICAgY2FzZSBcIldhc21cIjpcbiAgICAgICAgcmV0dXJuIG5ldyBDMkZGdW5jdGlvbihhcGlDbGllbnQsIGluZm8gYXMgQzJGSW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgaWQgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wb2xpY3lfaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSB0eXBlICovXG4gIGdldCBwb2xpY3lUeXBlKCk6IFBvbGljeVR5cGUge1xuICAgIHJldHVybiB0aGlzLmRhdGEucG9saWN5X3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgcG9saWN5IHZlcnNpb24gdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgdmVyc2lvbih2ZXJzaW9uOiBWZXJzaW9uKTogUHJvbWlzZTxOYW1lZFBvbGljeVJ1bGVzPiB7XG4gICAgbGV0IHZlcnNpb25JbmZvO1xuXG4gICAgaWYgKHZlcnNpb24gPT0gYHYke3RoaXMuZGF0YS52ZXJzaW9ufWApIHtcbiAgICAgIHZlcnNpb25JbmZvID0gdGhpcy5kYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZXJzaW9uSW5mbyA9IChhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdmVyc2lvbikpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE5hbWVkUG9saWN5UnVsZXModGhpcy5hcGlDbGllbnQsIHZlcnNpb25JbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgbGF0ZXN0KCk6IFByb21pc2U8TmFtZWRQb2xpY3lSdWxlcz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKFwibGF0ZXN0XCIpO1xuICAgIHJldHVybiBuZXcgTmFtZWRQb2xpY3lSdWxlcyh0aGlzLmFwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgY3VycmVudCBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgbmFtZS5cbiAgICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IG5hbWUgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuZXcgcG9saWN5IG5hbWUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBuYW1lIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgb3duZXIgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgb2YgdGhlIHBvbGljeSBvd25lci5cbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgb3duZXIgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBvd25lciBUaGUgbmV3IG93bmVyIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRPd25lcihvd25lcjogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IG1ldGFkYXRhLlxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxKc29uVmFsdWU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm1ldGFkYXRhIGFzIEpzb25WYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgbmFtZWQgcG9saWN5IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgdmFsdWUpLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgVGhlIG5ldyBtZXRhZGF0YSBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBKc29uVmFsdWUsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlZGl0IHBvbGljeSBmb3IgdGhpcyBuYW1lZCBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGFjY2VzcyBjb250cm9sIGVudHJpZXMgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzIGZvciB0aGlzIG5hbWVkIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGFjbCgpOiBQcm9taXNlPFBvbGljeUFjbCB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuYWNsO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgbmV3IGFjY2VzcyBjb250cm9sIGVudHJpZXMgZm9yIHRoZSBuYW1lZCBwb2xpY3kgKG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyBlbnRyaWVzKS5cbiAgICpcbiAgICogQHBhcmFtIGFjbCBUaGUgYWNjZXNzIGNvbnRyb2wgZW50cmllcyB0byBzZXQuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRBY2woYWNsOiBQb2xpY3lBY2wsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgYWNsIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhhdCBhbGwgdmVyc2lvbnMgb2YgdGhpcyBwb2xpY3lcbiAgICogYXJlIGF0dGFjaGVkIHRvLlxuICAgKi9cbiAgYXN5bmMgYWxsQXR0YWNoZWQoKTogUHJvbWlzZTxQb2xpY3lBdHRhY2hlZFRvSWRbXT4ge1xuICAgIC8vIHRoZXJlIGlzIG5vIHNpbmdsZS1jYWxsIHdheSB0byBhY2hpZXZlIHRoaXMuIFNvIGluc3RlYWQsIHdlXG4gICAgLy8gMS4gR2V0IHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5XG4gICAgLy8gMi4gRm9yIGFsbCB2ZXJzaW9ucyBgdjBgIHRvIGBsYXRlc3RgLCBmZXRjaCB0aGUgcG9saWN5IGluZm9cbiAgICAvLyAzLiBKb2luIGFsbCBwb2xpY3kgYGF0dGFjaGVkX3RvYCBhcnJheXNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaChcImxhdGVzdFwiKTtcblxuICAgIGNvbnN0IGxhdGVzdCA9IGRhdGEudmVyc2lvbjtcbiAgICBjb25zdCB2ZXJzaW9ucyA9IEFycmF5LmZyb20oQXJyYXkobGF0ZXN0ICsgMSkua2V5cygpKTtcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDtcbiAgICBsZXQgYWxsQXR0YWNoZWQ6IFBvbGljeUF0dGFjaGVkVG9JZFtdID0gW107XG5cbiAgICBmb3IgKGxldCBiYXRjaCA9IDA7IGJhdGNoIDwgdmVyc2lvbnMubGVuZ3RoOyBiYXRjaCArPSBiYXRjaFNpemUpIHtcbiAgICAgIGNvbnN0IHJzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHZlcnNpb25zLnNsaWNlKGJhdGNoLCBiYXRjaCArIGJhdGNoU2l6ZSkubWFwKCh2ZXJzaW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCBgdiR7dmVyc2lvbn1gKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgYWxsQXR0YWNoZWQgPSBhbGxBdHRhY2hlZC5jb25jYXQocnMuZmxhdE1hcCgocG9saWN5KSA9PiBwb2xpY3kuYXR0YWNoZWRfdG8pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsQXR0YWNoZWQuY29uY2F0KGRhdGEuYXR0YWNoZWRfdG8pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIHBvbGljeS5cbiAgICpcbiAgICogVGhpcyBjYW4gZmFpbCBpZiB0aGUgcG9saWN5IGlzIHN0aWxsIGF0dGFjaGVkIHRvIGFueSBrZXksIHJvbGUsIG9yIGtleSBpbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBOYW1lZFBvbGljeUluZm8pIHtcbiAgICB0aGlzLmFwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgdXBkYXRlKFxuICAgIHJlcXVlc3Q6IFVwZGF0ZVBvbGljeVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy5kYXRhID0gcmVzcC5kYXRhKCkgYXMgTmFtZWRQb2xpY3lJbmZvO1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggdGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHZlcnNpb24gb2YgdGhlIHBvbGljeSB0byBmZXRjaC4gRGVmYXVsdHMgdG8gXCJsYXRlc3RcIi5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcm90ZWN0ZWQgYXN5bmMgZmV0Y2godmVyc2lvbjogVmVyc2lvbiA9IFwibGF0ZXN0XCIpOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIHRoaXMuZGF0YSA9IChhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdmVyc2lvbikpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIGtleSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZEtleVBvbGljeSBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogS2V5UG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHJ1bGVzIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBLZXlQb2xpY3lJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIHJvbGUgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRSb2xlUG9saWN5IGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBSb2xlUG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBydWxlcyB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZVBvbGljeUluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uIChDMkYpLlxuICpcbiAqIFRoaXMgY2xhc3MgZXh0ZW5kcyBOYW1lZFBvbGljeSBiZWNhdXNlIEMyRiBmdW5jdGlvbnMgY2FuIGJlIGF0dGFjaGVkXG4gKiB0byBrZXlzIGFuZCByb2xlcyBsaWtlIGEgbmFtZWQgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgQzJGRnVuY3Rpb24gZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IEMyRkluZm87XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGlzIEMyRiBmdW5jdGlvbiB3aXRoIGEgbmV3IFdhc20gZnVuY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBXYXNtIGZ1bmN0aW9uLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIGZ1bmN0aW9uIGZhaWxzLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkLlxuICAgKi9cbiAgYXN5bmMgc2V0V2FzbUZ1bmN0aW9uKHBvbGljeTogVWludDhBcnJheSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgLy8gdXBsb2FkIHRoZSBwb2xpY3kgb2JqZWN0XG4gICAgY29uc3QgaGFzaCA9IGF3YWl0IHVwbG9hZFdhc21GdW5jdGlvbih0aGlzLmFwaUNsaWVudCwgcG9saWN5KTtcblxuICAgIC8vIHVwZGF0ZSB0aGlzIHBvbGljeSB3aXRoIHRoZSBuZXcgcG9saWN5IHZlcmlzb24uXG4gICAgY29uc3QgYm9keTogVXBkYXRlUG9saWN5UmVxdWVzdCA9IHsgcnVsZXM6IFt7IGhhc2ggfV0gfTtcbiAgICB0aGlzLmRhdGEgPSAoYXdhaXQgdGhpcy51cGRhdGUoYm9keSwgbWZhUmVjZWlwdCkpIGFzIEMyRkluZm87XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIG9wdGlvbmFsIGtleSBpZCB0aGF0IHRoZSBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgd2l0aC5cbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHZlcnNpb24gb2YgdGhlIGZ1bmN0aW9uIHRvIGludm9rZS4gRGVmYXVsdHMgdG8gXCJsYXRlc3RcIi5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIG9wdGlvbmFsIHNpZ24gcmVxdWVzdCBib2R5IHRoYXQgd2lsbCBiZSBzZW50IHRvIHRoZSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgb3B0aW9uYWwgcm9sZSBpZCB0aGF0IHRoZSBmdW5jdGlvbiB3aWxsIGJlIGludm9rZWQgYnkuXG4gICAqIElmIGB1bmRlZmluZWRgLCB0aGUgcG9saWN5IHdpbGwgYmUgaW52b2tlZCBieSB0aGUgdXNlciBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIGludm9raW5nIHRoZSBmdW5jdGlvbi5cbiAgICovXG4gIGFzeW5jIGludm9rZShcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB2ZXJzaW9uOiBWZXJzaW9uID0gXCJsYXRlc3RcIixcbiAgICByZXF1ZXN0PzogSnNvblZhbHVlLFxuICAgIHJvbGVJZD86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDMkZJbnZvY2F0aW9uPiB7XG4gICAgLy8gVE9ETyBJZGVhbGx5LCBgdmVyc2lvbmAgc2hvdWxkIGJlIHRoZSBmaXJzdCBwYXJhbWV0ZXIuIEJ1dCBmb3IgYmFja3dhcmRzXG4gICAgLy8gY29tcGF0aWJpbGl0eSwgd2Uga2VlcCBga2V5SWRgIGFzIHRoZSBmaXJzdCBwYXJhbWV0ZXIgZm9yIG5vdy5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5SW52b2tlKHRoaXMuaWQsIHZlcnNpb24sIHtcbiAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICByZXF1ZXN0LFxuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgUG9saWN5SW52b2NhdGlvbihyZXNwKTtcbiAgfVxuXG4gIC8vIEJhY2t3YXJkcyBjb21wYWJpbGl0eSB3aXRoIE5hbWVkIFdhc20gUG9saWN5IG5hbWVzXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIHRoZSBuZXcgV2FzbSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgcG9saWN5IG9iamVjdCBmYWlscy5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZC5cbiAgICovXG4gIHNldFdhc21Qb2xpY3kgPSB0aGlzLnNldFdhc21GdW5jdGlvbjtcblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IEMyRkluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHNwZWNpZmljIHZlcnNpb24gb2YgYSBuYW1lZCBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZFBvbGljeVJ1bGVzIHtcbiAgLyoqIFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoYXQgdGhpcyBwb2xpY3kgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgI2RhdGE6IE5hbWVkUG9saWN5SW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBleGFtcGxlIE5hbWVkUG9saWN5I2E0YTQ1Y2MyLTA2NDItNGM5OC1iNmJkLTBkYTM0N2Q2MDhhNFxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucG9saWN5X2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdGhpcyBvYmplY3QgY29udGFpbnMuXG4gICAqL1xuICBnZXQgdmVyc2lvbigpOiBWZXJzaW9uIHtcbiAgICByZXR1cm4gYHYke3RoaXMuI2RhdGEudmVyc2lvbn1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgcnVsZXMuXG4gICAqXG4gICAqIEBleGFtcGxlIFsgXCJBc3NlcnRFcmMyMFR4XCIgXVxuICAgKi9cbiAgZ2V0IHJ1bGVzKCk6IFBvbGljeVJ1bGVbXSB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucnVsZXMgYXMgUG9saWN5UnVsZVtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhpcyB2ZXJzaW9uIG9mIHRoZSBwb2xpY3lcbiAgICogICAgICAgICAgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBhc3luYyBhbGxBdHRhY2hlZCgpOiBQcm9taXNlPFBvbGljeUF0dGFjaGVkVG9JZFtdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hdHRhY2hlZF90bztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTmFtZWRQb2xpY3lJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPE5hbWVkUG9saWN5SW5mbz4ge1xuICAgIHRoaXMuI2RhdGEgPSAoYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB0aGlzLnZlcnNpb24pKSBhcyBOYW1lZFBvbGljeUluZm87XG4gICAgcmV0dXJuIHRoaXMuI2RhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgcmVzdWx0IG9mIGludm9raW5nIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICovXG5leHBvcnQgY2xhc3MgQzJGSW52b2NhdGlvbiB7XG4gIHJlYWRvbmx5ICNkYXRhOiBJbnZva2VDMkZSZXNwb25zZTtcblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSByZXNwb25zZSBpdHNlbGYuICovXG4gIGdldCByZXNwb25zZSgpOiBDMkZSZXNwb25zZSB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucmVzcG9uc2U7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHN0YW5kYXJkIG91dHB1dCBzdHJlYW0uIFVzdWFsbHkgYSBVVEYtOCBlbmNvZGVkIHN0cmluZy4gKi9cbiAgZ2V0IHN0ZG91dCgpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLmZyb21IZXgodGhpcy4jZGF0YS5zdGRvdXQpO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBlcnJvciBzdHJlYW0uIFVzdWFsbHkgYSBVVEYtOCBlbmNvZGVkIHN0cmluZy4gKi9cbiAgZ2V0IHN0ZGVycigpOiBCdWZmZXIge1xuICAgIHJldHVybiB0aGlzLmZyb21IZXgodGhpcy4jZGF0YS5zdGRlcnIpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCBmb3IgY29udmVydGluZyBoZXgtZW5jb2RlZCBkYXRhIHRvIGEgYEJ1ZmZlcmAuXG4gICAqXG4gICAqIEBwYXJhbSBoZXggVGhlIGhleC1lbmNvZGVkIGRhdGEuXG4gICAqIEByZXR1cm5zIFRoZSBkYXRhLlxuICAgKi9cbiAgcHJpdmF0ZSBmcm9tSGV4KGhleDogc3RyaW5nKTogQnVmZmVyIHtcbiAgICByZXR1cm4gQnVmZmVyLmZyb20oaGV4LnN0YXJ0c1dpdGgoXCIweFwiKSA/IGhleC5zbGljZSgyKSA6IGhleCwgXCJoZXhcIik7XG4gIH1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoZGF0YTogSW52b2tlQzJGUmVzcG9uc2UpIHtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vLyBCYWNrd2FyZHMgY29tcGFiaWxpdHkgd2l0aCBOYW1lZCBXYXNtIFBvbGljeSBuYW1lc1xuXG4vKiogQSByZXByZXNlbnRhdGlvbiBvZiBhIFdhc20gcG9saWN5LiAqL1xuZXhwb3J0IHR5cGUgTmFtZWRXYXNtUG9saWN5ID0gQzJGRnVuY3Rpb247XG4vKiogQSByZXByZXNlbnRhdGlvbiBvZiBhIFdhc20gcG9saWN5LiAqL1xuZXhwb3J0IGNvbnN0IE5hbWVkV2FzbVBvbGljeSA9IEMyRkZ1bmN0aW9uO1xuXG4vKiogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIG5hbWVkIFdBU00gcG9saWN5LiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5SW52b2NhdGlvbiA9IEMyRkludm9jYXRpb247XG4vKiogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIG5hbWVkIFdBU00gcG9saWN5LiAqL1xuZXhwb3J0IGNvbnN0IFBvbGljeUludm9jYXRpb24gPSBDMkZJbnZvY2F0aW9uO1xuIl19