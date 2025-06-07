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
var _NamedPolicyRules_apiClient, _NamedPolicyRules_data, _PolicyInvocation_data;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyInvocation = exports.NamedPolicyRules = exports.NamedWasmPolicy = exports.NamedRolePolicy = exports.NamedKeyPolicy = exports.NamedPolicy = void 0;
exports.uploadWasmPolicy = uploadWasmPolicy;
const _1 = require(".");
/**
 * Upload the given Wasm policy object.
 *
 * @param apiClient The API client to use.
 * @param policy The Wasm policy object.
 * @returns The Wasm policy object hash to use for creating/updating policies.
 * @throws if uploading the policy fails.
 * @internal
 */
async function uploadWasmPolicy(apiClient, policy) {
    // get the SHA-256 hash of the policy to get the upload url.
    const subtle = await (0, _1.loadSubtleCrypto)();
    const hashBytes = await subtle.digest("SHA-256", policy);
    const hash = "0x" + Buffer.from(hashBytes).toString("hex");
    // get the upload URL
    const { signed_url } = await apiClient.wasmPolicyUpload({ hash });
    // upload the policy object
    const resp = await fetch(signed_url, {
        method: "PUT",
        body: policy,
    });
    if (!resp.ok) {
        throw new Error(`Failed to upload policy with status: ${resp.status}: ${resp.statusText}`);
    }
    return hash;
}
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
                return new NamedWasmPolicy(apiClient, info);
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
            versionInfo = await this.apiClient.policyGet(this.id, version);
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
     * Sets a new metadata value for the contact (overwriting the existing value).
     *
     * @param metadata The new metadata for the contact.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    async setMetadata(metadata, mfaReceipt) {
        await this.update({ metadata }, mfaReceipt);
    }
    /**
     * Fetch and return the edit policy for the contact.
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
        this.data = await this.apiClient.policyGet(this.id, version);
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
 * A representation of a Wasm policy.
 */
class NamedWasmPolicy extends NamedPolicy {
    /**
     * Update the policy with the new Wasm policy.
     *
     * @param policy The new Wasm policy object.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if uploading the policy object fails.
     * @throws if MFA is required and no receipts are provided.
     */
    async setWasmPolicy(policy, mfaReceipt) {
        // upload the policy object
        const hash = await uploadWasmPolicy(this.apiClient, policy);
        // update this policy with the new policy verison.
        const body = { rules: [{ hash }] };
        this.data = (await this.update(body, mfaReceipt));
    }
    /**
     * Invoke this wasm policy.
     *
     * @param keyId The key id that the policy will be invoked with.
     * @param version The version of the policy to invoke. Defaults to "latest".
     * @param request The optional sign request body that will be sent to the policy.
     * @param roleId The optional role id that the policy will be invoked by.
     * If `undefined`, the policy will be invoked by the user session.
     * @returns The result of invoking the policy.
     */
    async invoke(keyId, version = "latest", request, roleId) {
        const resp = await this.apiClient.policyInvoke(this.id, version, {
            key_id: keyId,
            request,
            role_id: roleId,
        });
        return new PolicyInvocation(resp);
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
exports.NamedWasmPolicy = NamedWasmPolicy;
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
        __classPrivateFieldSet(this, _NamedPolicyRules_data, await __classPrivateFieldGet(this, _NamedPolicyRules_apiClient, "f").policyGet(this.id, this.version), "f");
        return __classPrivateFieldGet(this, _NamedPolicyRules_data, "f");
    }
}
exports.NamedPolicyRules = NamedPolicyRules;
_NamedPolicyRules_apiClient = new WeakMap(), _NamedPolicyRules_data = new WeakMap();
/**
 * The result of invoking a named wasm policy.
 */
class PolicyInvocation {
    /** @returns The policy response itself. */
    get response() {
        return __classPrivateFieldGet(this, _PolicyInvocation_data, "f").response;
    }
    /** @returns The standard output stream. Usually a UTF-8 encoded string. */
    get stdout() {
        return this.fromHex(__classPrivateFieldGet(this, _PolicyInvocation_data, "f").stdout);
    }
    /** @returns The standard error stream. Usually a UTF-8 encoded string. */
    get stderr() {
        return this.fromHex(__classPrivateFieldGet(this, _PolicyInvocation_data, "f").stderr);
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
        _PolicyInvocation_data.set(this, void 0);
        __classPrivateFieldSet(this, _PolicyInvocation_data, data, "f");
    }
}
exports.PolicyInvocation = PolicyInvocation;
_PolicyInvocation_data = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUE4REEsNENBb0JDO0FBOURELHdCQUFxQztBQWlDckM7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsU0FBb0IsRUFBRSxNQUFrQjtJQUM3RSw0REFBNEQ7SUFDNUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLG1CQUFnQixHQUFFLENBQUM7SUFDeEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0QscUJBQXFCO0lBQ3JCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEUsMkJBQTJCO0lBQzNCLE1BQU0sSUFBSSxHQUFHLE1BQU0sS0FBSyxDQUFDLFVBQVUsRUFBRTtRQUNuQyxNQUFNLEVBQUUsS0FBSztRQUNiLElBQUksRUFBRSxNQUFNO0tBQ2IsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDN0YsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBc0IsV0FBVztJQUkvQjs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQW9CLEVBQUUsSUFBZ0I7UUFDcEQsUUFB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QUMsQ0FBQztJQUN6QyxDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFFN0U7Ozs7O09BS0c7SUFDSyxPQUFPLENBQUMsR0FBVztRQUN6QixPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFlBQVksSUFBMEI7UUFyQzdCLHlDQUE0QjtRQXNDbkMsdUJBQUEsSUFBSSwwQkFBUyxJQUFJLE1BQUEsQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUF6Q0QsNENBeUNDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBcGlDbGllbnQsXG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRWRpdFBvbGljeSxcbiAgRW1wdHksXG4gIEludm9rZVBvbGljeVJlc3BvbnNlLFxuICBKc29uVmFsdWUsXG4gIEtleVBvbGljeSxcbiAgS2V5UG9saWN5UnVsZSxcbiAgTWZhUmVjZWlwdHMsXG4gIFBvbGljeUF0dGFjaGVkVG9JZCxcbiAgUG9saWN5SW5mbyxcbiAgUG9saWN5VHlwZSxcbiAgUm9sZVBvbGljeSxcbiAgUm9sZVBvbGljeVJ1bGUsXG4gIFVwZGF0ZVBvbGljeVJlcXVlc3QsXG4gIFdhc21Qb2xpY3lSZXNwb25zZSxcbiAgV2FzbVJ1bGUsXG59IGZyb20gXCIuXCI7XG5cbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8gfSBmcm9tIFwiLlwiO1xuXG4vKipcbiAqIE5hbWVkIHBvbGljeSBydWxlIHR5cGUuXG4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeVJ1bGUgPSBLZXlQb2xpY3lSdWxlIHwgUm9sZVBvbGljeVJ1bGUgfCBXYXNtUnVsZTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQga2V5IHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5SW5mbyA9IFBvbGljeUluZm8gJiB7XG4gIHBvbGljeV90eXBlOiBcIktleVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQgcm9sZSBwb2xpY3kuXG4gKi9cbmV4cG9ydCB0eXBlIFJvbGVQb2xpY3lJbmZvID0gUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiUm9sZVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQgd2FzbSBwb2xpY3kuXG4gKi9cbmV4cG9ydCB0eXBlIFdhc21Qb2xpY3lJbmZvID0gUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiV2FzbVwiO1xufTtcblxuLyoqXG4gKiBBIGhlbHBlciB0eXBlIGZvciB2YWxpZCBuYW1lZCBwb2xpY3kgdmVyc2lvbiBzdHJpbmdzLlxuICovXG5leHBvcnQgdHlwZSBWZXJzaW9uID0gYHYke251bWJlcn1gIHwgYGxhdGVzdGA7XG5cbi8qKlxuICogVXBsb2FkIHRoZSBnaXZlbiBXYXNtIHBvbGljeSBvYmplY3QuXG4gKlxuICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gKiBAcGFyYW0gcG9saWN5IFRoZSBXYXNtIHBvbGljeSBvYmplY3QuXG4gKiBAcmV0dXJucyBUaGUgV2FzbSBwb2xpY3kgb2JqZWN0IGhhc2ggdG8gdXNlIGZvciBjcmVhdGluZy91cGRhdGluZyBwb2xpY2llcy5cbiAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgZmFpbHMuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZFdhc21Qb2xpY3koYXBpQ2xpZW50OiBBcGlDbGllbnQsIHBvbGljeTogVWludDhBcnJheSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIGdldCB0aGUgU0hBLTI1NiBoYXNoIG9mIHRoZSBwb2xpY3kgdG8gZ2V0IHRoZSB1cGxvYWQgdXJsLlxuICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gIGNvbnN0IGhhc2hCeXRlcyA9IGF3YWl0IHN1YnRsZS5kaWdlc3QoXCJTSEEtMjU2XCIsIHBvbGljeSk7XG4gIGNvbnN0IGhhc2ggPSBcIjB4XCIgKyBCdWZmZXIuZnJvbShoYXNoQnl0ZXMpLnRvU3RyaW5nKFwiaGV4XCIpO1xuXG4gIC8vIGdldCB0aGUgdXBsb2FkIFVSTFxuICBjb25zdCB7IHNpZ25lZF91cmwgfSA9IGF3YWl0IGFwaUNsaWVudC53YXNtUG9saWN5VXBsb2FkKHsgaGFzaCB9KTtcblxuICAvLyB1cGxvYWQgdGhlIHBvbGljeSBvYmplY3RcbiAgY29uc3QgcmVzcCA9IGF3YWl0IGZldGNoKHNpZ25lZF91cmwsIHtcbiAgICBtZXRob2Q6IFwiUFVUXCIsXG4gICAgYm9keTogcG9saWN5LFxuICB9KTtcblxuICBpZiAoIXJlc3Aub2spIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEZhaWxlZCB0byB1cGxvYWQgcG9saWN5IHdpdGggc3RhdHVzOiAke3Jlc3Auc3RhdHVzfTogJHtyZXNwLnN0YXR1c1RleHR9YCk7XG4gIH1cblxuICByZXR1cm4gaGFzaDtcbn1cblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyBmb3Igc2hhcmVkIG1ldGhvZHMgYmV0d2VlbiBrZXksIHJvbGUgYW5kIFdhc20gcG9saWNpZXMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOYW1lZFBvbGljeSB7XG4gIHByb3RlY3RlZCByZWFkb25seSBhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcHJvdGVjdGVkIGRhdGE6IFBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgZm9yIGNyZWF0aW5nIGEgbmFtZWQgcG9saWN5IGZyb20gYSBwb2xpY3kgaW5mby5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgYXBpIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBpbmZvIFRoZSBwb2xpY3kgaW5mby5cbiAgICogQHJldHVybnMgVGhlIG5hbWVkIHBvbGljeSBvYmplY3QgZm9yIHRoZSBnaXZlbiBpbmZvLlxuICAgKi9cbiAgc3RhdGljIGZyb21JbmZvKGFwaUNsaWVudDogQXBpQ2xpZW50LCBpbmZvOiBQb2xpY3lJbmZvKTogTmFtZWRQb2xpY3kge1xuICAgIHN3aXRjaCAoaW5mby5wb2xpY3lfdHlwZSkge1xuICAgICAgY2FzZSBcIktleVwiOlxuICAgICAgICByZXR1cm4gbmV3IE5hbWVkS2V5UG9saWN5KGFwaUNsaWVudCwgaW5mbyBhcyBLZXlQb2xpY3lJbmZvKTtcbiAgICAgIGNhc2UgXCJSb2xlXCI6XG4gICAgICAgIHJldHVybiBuZXcgTmFtZWRSb2xlUG9saWN5KGFwaUNsaWVudCwgaW5mbyBhcyBSb2xlUG9saWN5SW5mbyk7XG4gICAgICBjYXNlIFwiV2FzbVwiOlxuICAgICAgICByZXR1cm4gbmV3IE5hbWVkV2FzbVBvbGljeShhcGlDbGllbnQsIGluZm8gYXMgV2FzbVBvbGljeUluZm8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgcG9saWN5IGlkICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmRhdGEucG9saWN5X2lkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgdHlwZSAqL1xuICBnZXQgcG9saWN5VHlwZSgpOiBQb2xpY3lUeXBlIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnBvbGljeV90eXBlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHNwZWNpZmljIHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHBvbGljeSB2ZXJzaW9uIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHNwZWNpZmljIHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIHZlcnNpb24odmVyc2lvbjogVmVyc2lvbik6IFByb21pc2U8TmFtZWRQb2xpY3lSdWxlcz4ge1xuICAgIGxldCB2ZXJzaW9uSW5mbztcblxuICAgIGlmICh2ZXJzaW9uID09IGB2JHt0aGlzLmRhdGEudmVyc2lvbn1gKSB7XG4gICAgICB2ZXJzaW9uSW5mbyA9IHRoaXMuZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmVyc2lvbkluZm8gPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdmVyc2lvbik7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOYW1lZFBvbGljeVJ1bGVzKHRoaXMuYXBpQ2xpZW50LCB2ZXJzaW9uSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGxhdGVzdCgpOiBQcm9taXNlPE5hbWVkUG9saWN5UnVsZXM+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaChcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gbmV3IE5hbWVkUG9saWN5UnVsZXModGhpcy5hcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IG5hbWUuXG4gICAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyBuYW1lIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmV3IHBvbGljeSBuYW1lLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbmFtZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBjdXJyZW50IG93bmVyIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB1c2VyIGlkIG9mIHRoZSBwb2xpY3kgb3duZXIuXG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IG93bmVyIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gb3duZXIgVGhlIG5ldyBvd25lciBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBtZXRhZGF0YS5cbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIGNvbnRhY3QgKG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyB2YWx1ZSkuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBUaGUgbmV3IG1ldGFkYXRhIGZvciB0aGUgY29udGFjdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBKc29uVmFsdWUsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoaXMgbmFtZWQgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgZWRpdFBvbGljeSgpOiBQcm9taXNlPEVkaXRQb2xpY3kgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVkaXRfcG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyBlZGl0IHBvbGljeSBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIG5ldyBlZGl0IHBvbGljeS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBhIGxpc3Qgb2YgYWxsIGtleXMsIHJvbGVzLCBhbmQga2V5LWluLXJvbGVzIHRoYXQgYWxsIHZlcnNpb25zIG9mIHRoaXMgcG9saWN5XG4gICAqIGFyZSBhdHRhY2hlZCB0by5cbiAgICovXG4gIGFzeW5jIGFsbEF0dGFjaGVkKCk6IFByb21pc2U8UG9saWN5QXR0YWNoZWRUb0lkW10+IHtcbiAgICAvLyB0aGVyZSBpcyBubyBzaW5nbGUtY2FsbCB3YXkgdG8gYWNoaWV2ZSB0aGlzLiBTbyBpbnN0ZWFkLCB3ZVxuICAgIC8vIDEuIEdldCB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHBvbGljeVxuICAgIC8vIDIuIEZvciBhbGwgdmVyc2lvbnMgYHYwYCB0byBgbGF0ZXN0YCwgZmV0Y2ggdGhlIHBvbGljeSBpbmZvXG4gICAgLy8gMy4gSm9pbiBhbGwgcG9saWN5IGBhdHRhY2hlZF90b2AgYXJyYXlzXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goXCJsYXRlc3RcIik7XG5cbiAgICBjb25zdCBsYXRlc3QgPSBkYXRhLnZlcnNpb247XG4gICAgY29uc3QgdmVyc2lvbnMgPSBBcnJheS5mcm9tKEFycmF5KGxhdGVzdCArIDEpLmtleXMoKSk7XG4gICAgY29uc3QgYmF0Y2hTaXplID0gMTA7XG4gICAgbGV0IGFsbEF0dGFjaGVkOiBQb2xpY3lBdHRhY2hlZFRvSWRbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgYmF0Y2ggPSAwOyBiYXRjaCA8IHZlcnNpb25zLmxlbmd0aDsgYmF0Y2ggKz0gYmF0Y2hTaXplKSB7XG4gICAgICBjb25zdCBycyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICB2ZXJzaW9ucy5zbGljZShiYXRjaCwgYmF0Y2ggKyBiYXRjaFNpemUpLm1hcCgodmVyc2lvbikgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgYHYke3ZlcnNpb259YCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICAgIGFsbEF0dGFjaGVkID0gYWxsQXR0YWNoZWQuY29uY2F0KHJzLmZsYXRNYXAoKHBvbGljeSkgPT4gcG9saWN5LmF0dGFjaGVkX3RvKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbEF0dGFjaGVkLmNvbmNhdChkYXRhLmF0dGFjaGVkX3RvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBwb2xpY3kuXG4gICAqXG4gICAqIFRoaXMgY2FuIGZhaWwgaWYgdGhlIHBvbGljeSBpcyBzdGlsbCBhdHRhY2hlZCB0byBhbnkga2V5LCByb2xlLCBvciBrZXkgaW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5RGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUG9saWN5SW5mbykge1xuICAgIHRoaXMuYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyB1cGRhdGUoXG4gICAgcmVxdWVzdDogVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8UG9saWN5SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgdGhpcy5kYXRhID0gcmVzcC5kYXRhKCk7XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgdmVyc2lvbiBvZiB0aGUgcG9saWN5IHRvIGZldGNoLiBEZWZhdWx0cyB0byBcImxhdGVzdFwiLlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBhc3luYyBmZXRjaCh2ZXJzaW9uOiBWZXJzaW9uID0gXCJsYXRlc3RcIik6IFByb21pc2U8UG9saWN5SW5mbz4ge1xuICAgIHRoaXMuZGF0YSA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB2ZXJzaW9uKTtcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIGtleSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZEtleVBvbGljeSBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogS2V5UG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogS2V5UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHJ1bGVzIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBLZXlQb2xpY3lJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIG5hbWVkIHJvbGUgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRSb2xlUG9saWN5IGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBSb2xlUG9saWN5SW5mbztcblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCBuZXcgcnVsZXMuXG4gICAqXG4gICAqIEBwYXJhbSBydWxlcyBUaGUgbmV3IHJ1bGVzIHRvIHVwZGF0ZSB0aGUgcG9saWN5IHdpdGguXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRSdWxlcyhydWxlczogUm9sZVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBydWxlcyB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUm9sZVBvbGljeUluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgV2FzbSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZFdhc21Qb2xpY3kgZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IFdhc21Qb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIHRoZSBuZXcgV2FzbSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3kgVGhlIG5ldyBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIHVwbG9hZGluZyB0aGUgcG9saWN5IG9iamVjdCBmYWlscy5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZC5cbiAgICovXG4gIGFzeW5jIHNldFdhc21Qb2xpY3kocG9saWN5OiBVaW50OEFycmF5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICAvLyB1cGxvYWQgdGhlIHBvbGljeSBvYmplY3RcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgdXBsb2FkV2FzbVBvbGljeSh0aGlzLmFwaUNsaWVudCwgcG9saWN5KTtcblxuICAgIC8vIHVwZGF0ZSB0aGlzIHBvbGljeSB3aXRoIHRoZSBuZXcgcG9saWN5IHZlcmlzb24uXG4gICAgY29uc3QgYm9keTogVXBkYXRlUG9saWN5UmVxdWVzdCA9IHsgcnVsZXM6IFt7IGhhc2ggfV0gfTtcbiAgICB0aGlzLmRhdGEgPSAoYXdhaXQgdGhpcy51cGRhdGUoYm9keSwgbWZhUmVjZWlwdCkpIGFzIFdhc21Qb2xpY3lJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSB0aGlzIHdhc20gcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleSBpZCB0aGF0IHRoZSBwb2xpY3kgd2lsbCBiZSBpbnZva2VkIHdpdGguXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdG8gaW52b2tlLiBEZWZhdWx0cyB0byBcImxhdGVzdFwiLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgb3B0aW9uYWwgc2lnbiByZXF1ZXN0IGJvZHkgdGhhdCB3aWxsIGJlIHNlbnQgdG8gdGhlIHBvbGljeS5cbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgb3B0aW9uYWwgcm9sZSBpZCB0aGF0IHRoZSBwb2xpY3kgd2lsbCBiZSBpbnZva2VkIGJ5LlxuICAgKiBJZiBgdW5kZWZpbmVkYCwgdGhlIHBvbGljeSB3aWxsIGJlIGludm9rZWQgYnkgdGhlIHVzZXIgc2Vzc2lvbi5cbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgaW52b2tlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgdmVyc2lvbjogVmVyc2lvbiA9IFwibGF0ZXN0XCIsXG4gICAgcmVxdWVzdD86IEpzb25WYWx1ZSxcbiAgICByb2xlSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8UG9saWN5SW52b2NhdGlvbj4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lJbnZva2UodGhpcy5pZCwgdmVyc2lvbiwge1xuICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgIHJlcXVlc3QsXG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgfSk7XG4gICAgcmV0dXJuIG5ldyBQb2xpY3lJbnZvY2F0aW9uKHJlc3ApO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBXYXNtUG9saWN5SW5mbykge1xuICAgIHN1cGVyKGFwaUNsaWVudCwgZGF0YSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgc3BlY2lmaWMgdmVyc2lvbiBvZiBhIG5hbWVkIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkUG9saWN5UnVsZXMge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIHBvbGljeSBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuICAjZGF0YTogUG9saWN5SW5mbztcblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIElEIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBleGFtcGxlIE5hbWVkUG9saWN5I2E0YTQ1Y2MyLTA2NDItNGM5OC1iNmJkLTBkYTM0N2Q2MDhhNFxuICAgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucG9saWN5X2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdGhpcyBvYmplY3QgY29udGFpbnMuXG4gICAqL1xuICBnZXQgdmVyc2lvbigpOiBWZXJzaW9uIHtcbiAgICByZXR1cm4gYHYke3RoaXMuI2RhdGEudmVyc2lvbn1gO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgcnVsZXMuXG4gICAqXG4gICAqIEBleGFtcGxlIFsgXCJBc3NlcnRFcmMyMFR4XCIgXVxuICAgKi9cbiAgZ2V0IHJ1bGVzKCk6IFBvbGljeVJ1bGVbXSB7XG4gICAgcmV0dXJuIHRoaXMuI2RhdGEucnVsZXMgYXMgUG9saWN5UnVsZVtdO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhpcyB2ZXJzaW9uIG9mIHRoZSBwb2xpY3lcbiAgICogICAgICAgICAgaXMgYXR0YWNoZWQgdG8uXG4gICAqL1xuICBhc3luYyBhbGxBdHRhY2hlZCgpOiBQcm9taXNlPFBvbGljeUF0dGFjaGVkVG9JZFtdPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hdHRhY2hlZF90bztcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogUG9saWN5SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxQb2xpY3lJbmZvPiB7XG4gICAgdGhpcy4jZGF0YSA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdGhpcy52ZXJzaW9uKTtcbiAgICByZXR1cm4gdGhpcy4jZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYSBuYW1lZCB3YXNtIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIFBvbGljeUludm9jYXRpb24ge1xuICByZWFkb25seSAjZGF0YTogSW52b2tlUG9saWN5UmVzcG9uc2U7XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgcmVzcG9uc2UgaXRzZWxmLiAqL1xuICBnZXQgcmVzcG9uc2UoKTogV2FzbVBvbGljeVJlc3BvbnNlIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5yZXNwb25zZTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgc3RhbmRhcmQgb3V0cHV0IHN0cmVhbS4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLiAqL1xuICBnZXQgc3Rkb3V0KCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUhleCh0aGlzLiNkYXRhLnN0ZG91dCk7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHN0YW5kYXJkIGVycm9yIHN0cmVhbS4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLiAqL1xuICBnZXQgc3RkZXJyKCk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIHRoaXMuZnJvbUhleCh0aGlzLiNkYXRhLnN0ZGVycik7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBIZWxwZXIgbWV0aG9kIGZvciBjb252ZXJ0aW5nIGhleC1lbmNvZGVkIGRhdGEgdG8gYSBgQnVmZmVyYC5cbiAgICpcbiAgICogQHBhcmFtIGhleCBUaGUgaGV4LWVuY29kZWQgZGF0YS5cbiAgICogQHJldHVybnMgVGhlIGRhdGEuXG4gICAqL1xuICBwcml2YXRlIGZyb21IZXgoaGV4OiBzdHJpbmcpOiBCdWZmZXIge1xuICAgIHJldHVybiBCdWZmZXIuZnJvbShoZXguc3RhcnRzV2l0aChcIjB4XCIpID8gaGV4LnNsaWNlKDIpIDogaGV4LCBcImhleFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihkYXRhOiBJbnZva2VQb2xpY3lSZXNwb25zZSkge1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG59XG4iXX0=