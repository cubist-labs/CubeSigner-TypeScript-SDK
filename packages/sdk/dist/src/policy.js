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
import { loadSubtleCrypto, encodeToHex, decodeFromHex } from "./index.js";
/**
 * Upload the given Wasm Confidential Cloud Function.
 *
 * @param apiClient The API client to use.
 * @param policy The Wasm function.
 * @returns The Wasm function object hash to use for creating/updating C2F policies.
 * @throws if uploading the policy fails.
 * @internal
 */
export async function uploadWasmFunction(apiClient, policy) {
    // get the SHA-256 hash of the function to get the upload url.
    const subtle = await loadSubtleCrypto();
    const hashBytes = await subtle.digest("SHA-256", policy);
    const hash = encodeToHex(new Uint8Array(hashBytes));
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
export const uploadWasmPolicy = uploadWasmFunction;
/**
 * Abstract class for shared methods between key, role and Wasm policies.
 */
export class NamedPolicy {
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
/**
 * A representation of a named key policy.
 */
export class NamedKeyPolicy extends NamedPolicy {
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
/**
 * A representation of a named role policy.
 */
export class NamedRolePolicy extends NamedPolicy {
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
/**
 * A representation of a Confidential Cloud Function (C2F).
 *
 * This class extends NamedPolicy because C2F functions can be attached
 * to keys and roles like a named policy.
 */
export class C2FFunction extends NamedPolicy {
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
/**
 * A specific version of a named policy.
 */
export class NamedPolicyRules {
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
_NamedPolicyRules_apiClient = new WeakMap(), _NamedPolicyRules_data = new WeakMap();
/**
 * The result of invoking a Confidential Cloud Function.
 */
export class C2FInvocation {
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
        return decodeFromHex(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stdout);
    }
    /**
     * The standard error stream as raw bytes. Usually a UTF-8 encoded string, use
     * {@link TextDecoder} to decode.
     *
     * @returns The standard error stream.
     */
    get stderrBytes() {
        return decodeFromHex(__classPrivateFieldGet(this, _C2FInvocation_data, "f").stderr);
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
_C2FInvocation_data = new WeakMap();
/** A representation of a Wasm policy. */
export const NamedWasmPolicy = C2FFunction;
/** The result of invoking a named WASM policy. */
export const PolicyInvocation = C2FInvocation;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUF1QkEsT0FBTyxFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFtRTFFOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxDQUFDLEtBQUssVUFBVSxrQkFBa0IsQ0FDdEMsU0FBb0IsRUFDcEIsTUFBa0I7SUFFbEIsOERBQThEO0lBQzlELE1BQU0sTUFBTSxHQUFHLE1BQU0sZ0JBQWdCLEVBQUUsQ0FBQztJQUN4QyxNQUFNLFNBQVMsR0FBRyxNQUFNLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQ3pELE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRXBELHFCQUFxQjtJQUNyQixNQUFNLEVBQUUsVUFBVSxFQUFFLEdBQUcsTUFBTSxTQUFTLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBRWxFLHlCQUF5QjtJQUN6QixNQUFNLElBQUksR0FBRyxNQUFNLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDbkMsTUFBTSxFQUFFLEtBQUs7UUFDYixJQUFJLEVBQUUsTUFBTTtLQUNiLENBQUMsQ0FBQztJQUVILElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDYixNQUFNLElBQUksS0FBSyxDQUFDLDBDQUEwQyxJQUFJLENBQUMsTUFBTSxLQUFLLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQy9GLENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sQ0FBQyxNQUFNLGdCQUFnQixHQUFHLGtCQUFrQixDQUFDO0FBRW5EOztHQUVHO0FBQ0gs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ICBDMkZSZXNwb25zZSxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFZGl0UG9saWN5LFxuICBFbXB0eSxcbiAgSW52b2tlQzJGUmVzcG9uc2UsXG4gIEpzb25WYWx1ZSxcbiAgS2V5UG9saWN5LFxuICBLZXlQb2xpY3lSdWxlLFxuICBNZmFSZWNlaXB0cyxcbiAgUG9saWN5QXR0YWNoZWRUb0lkLFxuICBQb2xpY3lUeXBlLFxuICBSb2xlUG9saWN5LFxuICBSb2xlUG9saWN5UnVsZSxcbiAgVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgV2FzbVJ1bGUsXG4gIEFjZUF0dHJpYnV0ZSxcbiAgUG9saWN5QWN0aW9uLFxuICBBY2UsXG4gIFBvbGljeUluZm8sXG59IGZyb20gXCIuL2luZGV4LnRzXCI7XG5cbmltcG9ydCB7IGxvYWRTdWJ0bGVDcnlwdG8sIGVuY29kZVRvSGV4LCBkZWNvZGVGcm9tSGV4IH0gZnJvbSBcIi4vaW5kZXgudHNcIjtcblxuLyoqXG4gKiBOYW1lZCBwb2xpY3kgcnVsZSB0eXBlLlxuICovXG5leHBvcnQgdHlwZSBQb2xpY3lSdWxlID0gS2V5UG9saWN5UnVsZSB8IFJvbGVQb2xpY3lSdWxlIHwgV2FzbVJ1bGU7XG5cbi8qKlxuICogQSBoZWxwZXIgdHlwZSBmb3Ige0BsaW5rIFBvbGljeUluZm99IHdpdGggYSBtb3JlIGRldGFpbGVkIGBhY2xgIHR5cGUuXG4gKi9cbnR5cGUgTmFtZWRQb2xpY3lJbmZvID0gUG9saWN5SW5mbyAmIHtcbiAgYWNsPzogUG9saWN5QWNsO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgbmFtZWQga2V5IHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgS2V5UG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiS2V5XCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCByb2xlIHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeUluZm8gPSBOYW1lZFBvbGljeUluZm8gJiB7XG4gIHBvbGljeV90eXBlOiBcIlJvbGVcIjtcbn07XG5cbi8qKlxuICogVGhlIHBvbGljeSBpbmZvIGZvciBhIG5hbWVkIHdhc20gcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBXYXNtUG9saWN5SW5mbyA9IE5hbWVkUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiV2FzbVwiO1xufTtcblxuLyoqXG4gKiBUaGUgcG9saWN5IGluZm8gZm9yIGEgQ29uZmlkZW50aWFsIENsb3VkIEZ1bmN0aW9uLlxuICovXG5leHBvcnQgdHlwZSBDMkZJbmZvID0gV2FzbVBvbGljeUluZm87XG5cbi8qKlxuICogQSBoZWxwZXIgdHlwZSBmb3IgdmFsaWQgbmFtZWQgcG9saWN5IHZlcnNpb24gc3RyaW5ncy5cbiAqL1xuZXhwb3J0IHR5cGUgVmVyc2lvbiA9IGB2JHtudW1iZXJ9YCB8IGBsYXRlc3RgO1xuXG4vKiogQSBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgZW50cnkuICovXG5leHBvcnQgdHlwZSBQb2xpY3lBY2UgPSBBY2U8UG9saWN5QWN0aW9uLCBQb2xpY3lDdHg+O1xuXG4vKiogQSBwb2xpY3kgYWNjZXNzIGNvbnRyb2wgbGlzdC4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeUFjbCA9IFBvbGljeUFjZVtdO1xuXG4vKiogQWRkaXRpb25hbCBjb250ZXh0cyB3aGVuIHVzaW5nIHBvbGljaWVzLiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5Q3R4ID0ge1xuICAvKipcbiAgICogVGhlIHJlc291cmNlcyAoa2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMpIHRoYXQgdGhlIGFjY2VzcyBjb250cm9sIGVudHJ5XG4gICAqIGFwcGxpZXMgdG8uXG4gICAqL1xuICByZXNvdXJjZXM6IEFjZUF0dHJpYnV0ZTxQb2xpY3lSZXNvdXJjZT47XG59O1xuXG4vKiogQSByZXNvdXJjZSBhIHBvbGljeSBpcyBpbnZva2VkIHdpdGggb3IgYXR0YWNoZWQgdG8uICovXG5leHBvcnQgdHlwZSBQb2xpY3lSZXNvdXJjZSA9XG4gIC8qKiBBIGtleSBvciByb2xlIGlkLiAqL1xuICB8IHN0cmluZ1xuICAvKiogS2V5cyBhdHRhY2hlZCB0byByb2xlcy4gKi9cbiAgfCB7IGtleV9pZHM6IFwiKlwiIHwgc3RyaW5nW107IHJvbGVfaWRzOiBcIipcIiB8IHN0cmluZ1tdIH07XG5cbi8qKlxuICogVXBsb2FkIHRoZSBnaXZlbiBXYXNtIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbi5cbiAqXG4gKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gZnVuY3Rpb24uXG4gKiBAcmV0dXJucyBUaGUgV2FzbSBmdW5jdGlvbiBvYmplY3QgaGFzaCB0byB1c2UgZm9yIGNyZWF0aW5nL3VwZGF0aW5nIEMyRiBwb2xpY2llcy5cbiAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgZmFpbHMuXG4gKiBAaW50ZXJuYWxcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwbG9hZFdhc21GdW5jdGlvbihcbiAgYXBpQ2xpZW50OiBBcGlDbGllbnQsXG4gIHBvbGljeTogVWludDhBcnJheSxcbik6IFByb21pc2U8c3RyaW5nPiB7XG4gIC8vIGdldCB0aGUgU0hBLTI1NiBoYXNoIG9mIHRoZSBmdW5jdGlvbiB0byBnZXQgdGhlIHVwbG9hZCB1cmwuXG4gIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgY29uc3QgaGFzaEJ5dGVzID0gYXdhaXQgc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgcG9saWN5KTtcbiAgY29uc3QgaGFzaCA9IGVuY29kZVRvSGV4KG5ldyBVaW50OEFycmF5KGhhc2hCeXRlcykpO1xuXG4gIC8vIGdldCB0aGUgdXBsb2FkIFVSTFxuICBjb25zdCB7IHNpZ25lZF91cmwgfSA9IGF3YWl0IGFwaUNsaWVudC53YXNtUG9saWN5VXBsb2FkKHsgaGFzaCB9KTtcblxuICAvLyB1cGxvYWQgdGhlIHdhc20gb2JqZWN0XG4gIGNvbnN0IHJlc3AgPSBhd2FpdCBmZXRjaChzaWduZWRfdXJsLCB7XG4gICAgbWV0aG9kOiBcIlBVVFwiLFxuICAgIGJvZHk6IHBvbGljeSxcbiAgfSk7XG5cbiAgaWYgKCFyZXNwLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBGYWlsZWQgdG8gdXBsb2FkIGZ1bmN0aW9uIHdpdGggc3RhdHVzOiAke3Jlc3Auc3RhdHVzfTogJHtyZXNwLnN0YXR1c1RleHR9YCk7XG4gIH1cblxuICByZXR1cm4gaGFzaDtcbn1cblxuLyoqXG4gKiBVcGxvYWQgdGhlIGdpdmVuIFdhc20gcG9saWN5LlxuICpcbiAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICogQHBhcmFtIHBvbGljeSBUaGUgV2FzbSBmdW5jdGlvbi5cbiAqIEByZXR1cm5zIFRoZSBXYXNtIGZ1bmN0aW9uIG9iamVjdCBoYXNoIHRvIHVzZSBmb3IgY3JlYXRpbmcvdXBkYXRpbmcgQzJGIHBvbGljaWVzLlxuICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIHBvbGljeSBmYWlscy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgY29uc3QgdXBsb2FkV2FzbVBvbGljeSA9IHVwbG9hZFdhc21GdW5jdGlvbjtcblxuLyoqXG4gKiBBYnN0cmFjdCBjbGFzcyBmb3Igc2hhcmVkIG1ldGhvZHMgYmV0d2VlbiBrZXksIHJvbGUgYW5kIFdhc20gcG9saWNpZXMuXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBOYW1lZFBvbGljeSB7XG4gIHByb3RlY3RlZCByZWFkb25seSBhcGlDbGllbnQ6IEFwaUNsaWVudDtcbiAgcHJvdGVjdGVkIGRhdGE6IE5hbWVkUG9saWN5SW5mbztcblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCBmb3IgY3JlYXRpbmcgYSBuYW1lZCBwb2xpY3kgZnJvbSBhIHBvbGljeSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBhcGkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGluZm8gVGhlIHBvbGljeSBpbmZvLlxuICAgKiBAcmV0dXJucyBUaGUgbmFtZWQgcG9saWN5IG9iamVjdCBmb3IgdGhlIGdpdmVuIGluZm8uXG4gICAqL1xuICBzdGF0aWMgZnJvbUluZm8oYXBpQ2xpZW50OiBBcGlDbGllbnQsIGluZm86IFBvbGljeUluZm8pOiBOYW1lZFBvbGljeSB7XG4gICAgc3dpdGNoIChpbmZvLnBvbGljeV90eXBlKSB7XG4gICAgICBjYXNlIFwiS2V5XCI6XG4gICAgICAgIHJldHVybiBuZXcgTmFtZWRLZXlQb2xpY3koYXBpQ2xpZW50LCBpbmZvIGFzIEtleVBvbGljeUluZm8pO1xuICAgICAgY2FzZSBcIlJvbGVcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBOYW1lZFJvbGVQb2xpY3koYXBpQ2xpZW50LCBpbmZvIGFzIFJvbGVQb2xpY3lJbmZvKTtcbiAgICAgIGNhc2UgXCJXYXNtXCI6XG4gICAgICAgIHJldHVybiBuZXcgQzJGRnVuY3Rpb24oYXBpQ2xpZW50LCBpbmZvIGFzIEMyRkluZm8pO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgcG9saWN5IGlkICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLmRhdGEucG9saWN5X2lkO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgdHlwZSAqL1xuICBnZXQgcG9saWN5VHlwZSgpOiBQb2xpY3lUeXBlIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLnBvbGljeV90eXBlO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHNwZWNpZmljIHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHBvbGljeSB2ZXJzaW9uIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHNwZWNpZmljIHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIHZlcnNpb24odmVyc2lvbjogVmVyc2lvbik6IFByb21pc2U8TmFtZWRQb2xpY3lSdWxlcz4ge1xuICAgIGxldCB2ZXJzaW9uSW5mbztcblxuICAgIGlmICh2ZXJzaW9uID09IGB2JHt0aGlzLmRhdGEudmVyc2lvbn1gKSB7XG4gICAgICB2ZXJzaW9uSW5mbyA9IHRoaXMuZGF0YTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmVyc2lvbkluZm8gPSAoYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5R2V0KHRoaXMuaWQsIHZlcnNpb24pKSBhcyBOYW1lZFBvbGljeUluZm87XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ldyBOYW1lZFBvbGljeVJ1bGVzKHRoaXMuYXBpQ2xpZW50LCB2ZXJzaW9uSW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIGxhdGVzdCgpOiBQcm9taXNlPE5hbWVkUG9saWN5UnVsZXM+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaChcImxhdGVzdFwiKTtcbiAgICByZXR1cm4gbmV3IE5hbWVkUG9saWN5UnVsZXModGhpcy5hcGlDbGllbnQsIGRhdGEpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IG5hbWUuXG4gICAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyBuYW1lIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmV3IHBvbGljeSBuYW1lLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbmFtZSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBjdXJyZW50IG93bmVyIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB1c2VyIGlkIG9mIHRoZSBwb2xpY3kgb3duZXIuXG4gICAqIEBleGFtcGxlIFVzZXIjYzNiOTM3OWMtNGU4Yy00MjE2LWJkMGEtNjVhY2U1M2NmOThmXG4gICAqL1xuICBhc3luYyBvd25lcigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEub3duZXI7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IG93bmVyIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gb3duZXIgVGhlIG5ldyBvd25lciBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBvd25lciB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBtZXRhZGF0YS5cbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIG5hbWVkIHBvbGljeSAob3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIHZhbHVlKS5cbiAgICpcbiAgICogQHBhcmFtIG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgZm9yIHRoZSBuYW1lZCBwb2xpY3kuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YShtZXRhZGF0YTogSnNvblZhbHVlLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG1ldGFkYXRhIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGVkaXQgcG9saWN5IGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoaXMgbmFtZWQgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgZWRpdFBvbGljeSgpOiBQcm9taXNlPEVkaXRQb2xpY3kgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVkaXRfcG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIG5ldyBlZGl0IHBvbGljeSBmb3IgdGhlIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIG5ldyBlZGl0IHBvbGljeS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzIGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWNjZXNzIGNvbnRyb2wgZW50cmllcyBmb3IgdGhpcyBuYW1lZCBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBhY2woKTogUHJvbWlzZTxQb2xpY3lBY2wgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmFjbDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIG5ldyBhY2Nlc3MgY29udHJvbCBlbnRyaWVzIGZvciB0aGUgbmFtZWQgcG9saWN5IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgZW50cmllcykuXG4gICAqXG4gICAqIEBwYXJhbSBhY2wgVGhlIGFjY2VzcyBjb250cm9sIGVudHJpZXMgdG8gc2V0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0QWNsKGFjbDogUG9saWN5QWNsLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGFjbCB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBhIGxpc3Qgb2YgYWxsIGtleXMsIHJvbGVzLCBhbmQga2V5LWluLXJvbGVzIHRoYXQgYWxsIHZlcnNpb25zIG9mIHRoaXMgcG9saWN5XG4gICAqIGFyZSBhdHRhY2hlZCB0by5cbiAgICovXG4gIGFzeW5jIGFsbEF0dGFjaGVkKCk6IFByb21pc2U8UG9saWN5QXR0YWNoZWRUb0lkW10+IHtcbiAgICAvLyB0aGVyZSBpcyBubyBzaW5nbGUtY2FsbCB3YXkgdG8gYWNoaWV2ZSB0aGlzLiBTbyBpbnN0ZWFkLCB3ZVxuICAgIC8vIDEuIEdldCB0aGUgbGF0ZXN0IHZlcnNpb24gb2YgdGhlIHBvbGljeVxuICAgIC8vIDIuIEZvciBhbGwgdmVyc2lvbnMgYHYwYCB0byBgbGF0ZXN0YCwgZmV0Y2ggdGhlIHBvbGljeSBpbmZvXG4gICAgLy8gMy4gSm9pbiBhbGwgcG9saWN5IGBhdHRhY2hlZF90b2AgYXJyYXlzXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goXCJsYXRlc3RcIik7XG5cbiAgICBjb25zdCBsYXRlc3QgPSBkYXRhLnZlcnNpb247XG4gICAgY29uc3QgdmVyc2lvbnMgPSBBcnJheS5mcm9tKEFycmF5KGxhdGVzdCArIDEpLmtleXMoKSk7XG4gICAgY29uc3QgYmF0Y2hTaXplID0gMTA7XG4gICAgbGV0IGFsbEF0dGFjaGVkOiBQb2xpY3lBdHRhY2hlZFRvSWRbXSA9IFtdO1xuXG4gICAgZm9yIChsZXQgYmF0Y2ggPSAwOyBiYXRjaCA8IHZlcnNpb25zLmxlbmd0aDsgYmF0Y2ggKz0gYmF0Y2hTaXplKSB7XG4gICAgICBjb25zdCBycyA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgICB2ZXJzaW9ucy5zbGljZShiYXRjaCwgYmF0Y2ggKyBiYXRjaFNpemUpLm1hcCgodmVyc2lvbikgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmFwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgYHYke3ZlcnNpb259YCk7XG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICAgIGFsbEF0dGFjaGVkID0gYWxsQXR0YWNoZWQuY29uY2F0KHJzLmZsYXRNYXAoKHBvbGljeSkgPT4gcG9saWN5LmF0dGFjaGVkX3RvKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGFsbEF0dGFjaGVkLmNvbmNhdChkYXRhLmF0dGFjaGVkX3RvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBwb2xpY3kuXG4gICAqXG4gICAqIFRoaXMgY2FuIGZhaWwgaWYgdGhlIHBvbGljeSBpcyBzdGlsbCBhdHRhY2hlZCB0byBhbnkga2V5LCByb2xlLCBvciBrZXkgaW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5RGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByb3RlY3RlZCBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogTmFtZWRQb2xpY3lJbmZvKSB7XG4gICAgdGhpcy5hcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZShcbiAgICByZXF1ZXN0OiBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxOYW1lZFBvbGljeUluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5VXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QsIG1mYVJlY2VpcHQpO1xuICAgIHRoaXMuZGF0YSA9IHJlc3AuZGF0YSgpIGFzIE5hbWVkUG9saWN5SW5mbztcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdG8gZmV0Y2guIERlZmF1bHRzIHRvIFwibGF0ZXN0XCIuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGZldGNoKHZlcnNpb246IFZlcnNpb24gPSBcImxhdGVzdFwiKTogUHJvbWlzZTxOYW1lZFBvbGljeUluZm8+IHtcbiAgICB0aGlzLmRhdGEgPSAoYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5R2V0KHRoaXMuaWQsIHZlcnNpb24pKSBhcyBOYW1lZFBvbGljeUluZm87XG4gICAgcmV0dXJuIHRoaXMuZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBuYW1lZCBrZXkgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRLZXlQb2xpY3kgZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IEtleVBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5IHdpdGggbmV3IHJ1bGVzLlxuICAgKlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIG5ldyBydWxlcyB0byB1cGRhdGUgdGhlIHBvbGljeSB3aXRoLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UnVsZXMocnVsZXM6IEtleVBvbGljeSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBydWxlcyB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGRhdGEgVGhlIEpTT04gcmVzcG9uc2UgZnJvbSB0aGUgQVBJIHNlcnZlci5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhcGlDbGllbnQ6IEFwaUNsaWVudCwgZGF0YTogS2V5UG9saWN5SW5mbykge1xuICAgIHN1cGVyKGFwaUNsaWVudCwgZGF0YSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBuYW1lZCByb2xlIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkUm9sZVBvbGljeSBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogUm9sZVBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5IHdpdGggbmV3IHJ1bGVzLlxuICAgKlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIG5ldyBydWxlcyB0byB1cGRhdGUgdGhlIHBvbGljeSB3aXRoLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0UnVsZXMocnVsZXM6IFJvbGVQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcnVsZXMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFJvbGVQb2xpY3lJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbiAoQzJGKS5cbiAqXG4gKiBUaGlzIGNsYXNzIGV4dGVuZHMgTmFtZWRQb2xpY3kgYmVjYXVzZSBDMkYgZnVuY3Rpb25zIGNhbiBiZSBhdHRhY2hlZFxuICogdG8ga2V5cyBhbmQgcm9sZXMgbGlrZSBhIG5hbWVkIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIEMyRkZ1bmN0aW9uIGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBDMkZJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhpcyBDMkYgZnVuY3Rpb24gd2l0aCBhIG5ldyBXYXNtIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgV2FzbSBmdW5jdGlvbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBmdW5jdGlvbiBmYWlscy5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZC5cbiAgICovXG4gIGFzeW5jIHNldFdhc21GdW5jdGlvbihwb2xpY3k6IFVpbnQ4QXJyYXksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIC8vIHVwbG9hZCB0aGUgcG9saWN5IG9iamVjdFxuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB1cGxvYWRXYXNtRnVuY3Rpb24odGhpcy5hcGlDbGllbnQsIHBvbGljeSk7XG5cbiAgICAvLyB1cGRhdGUgdGhpcyBwb2xpY3kgd2l0aCB0aGUgbmV3IHBvbGljeSB2ZXJzaW9uLlxuICAgIGNvbnN0IGJvZHk6IFVwZGF0ZVBvbGljeVJlcXVlc3QgPSB7IHJ1bGVzOiBbeyBoYXNoIH1dIH07XG4gICAgdGhpcy5kYXRhID0gKGF3YWl0IHRoaXMudXBkYXRlKGJvZHksIG1mYVJlY2VpcHQpKSBhcyBDMkZJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSB0aGlzIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBvcHRpb25hbCBrZXkgaWQgdGhhdCB0aGUgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIHdpdGguXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSB2ZXJzaW9uIG9mIHRoZSBmdW5jdGlvbiB0byBpbnZva2UuIERlZmF1bHRzIHRvIFwibGF0ZXN0XCIuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBvcHRpb25hbCBzaWduIHJlcXVlc3QgYm9keSB0aGF0IHdpbGwgYmUgc2VudCB0byB0aGUgZnVuY3Rpb24uXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIG9wdGlvbmFsIHJvbGUgaWQgdGhhdCB0aGUgZnVuY3Rpb24gd2lsbCBiZSBpbnZva2VkIGJ5LlxuICAgKiBJZiBgdW5kZWZpbmVkYCwgdGhlIHBvbGljeSB3aWxsIGJlIGludm9rZWQgYnkgdGhlIHVzZXIgc2Vzc2lvbi5cbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgZnVuY3Rpb24uXG4gICAqL1xuICBhc3luYyBpbnZva2UoXG4gICAga2V5SWQ/OiBzdHJpbmcsXG4gICAgdmVyc2lvbjogVmVyc2lvbiA9IFwibGF0ZXN0XCIsXG4gICAgcmVxdWVzdD86IEpzb25WYWx1ZSxcbiAgICByb2xlSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8QzJGSW52b2NhdGlvbj4ge1xuICAgIC8vIFRPRE8gSWRlYWxseSwgYHZlcnNpb25gIHNob3VsZCBiZSB0aGUgZmlyc3QgcGFyYW1ldGVyLiBCdXQgZm9yIGJhY2t3YXJkc1xuICAgIC8vIGNvbXBhdGliaWxpdHksIHdlIGtlZXAgYGtleUlkYCBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyIGZvciBub3cuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUludm9rZSh0aGlzLmlkLCB2ZXJzaW9uLCB7XG4gICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgcmVxdWVzdCxcbiAgICAgIHJvbGVfaWQ6IHJvbGVJZCxcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFBvbGljeUludm9jYXRpb24ocmVzcCk7XG4gIH1cblxuICAvLyBCYWNrd2FyZHMgY29tcGFiaWxpdHkgd2l0aCBOYW1lZCBXYXNtIFBvbGljeSBuYW1lc1xuICAvKipcbiAgICogVXBkYXRlIHRoZSBwb2xpY3kgd2l0aCB0aGUgbmV3IFdhc20gcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBuZXcgV2FzbSBwb2xpY3kgb2JqZWN0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIHBvbGljeSBvYmplY3QgZmFpbHMuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWQuXG4gICAqL1xuICBzZXRXYXNtUG9saWN5ID0gdGhpcy5zZXRXYXNtRnVuY3Rpb247XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBDMkZJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSBzcGVjaWZpYyB2ZXJzaW9uIG9mIGEgbmFtZWQgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRQb2xpY3lSdWxlcyB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMgcG9saWN5IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNkYXRhOiBOYW1lZFBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAZXhhbXBsZSBOYW1lZFBvbGljeSNhNGE0NWNjMi0wNjQyLTRjOTgtYjZiZC0wZGEzNDdkNjA4YTRcbiAgICovXG4gIGdldCBpZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnBvbGljeV9pZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgdmVyc2lvbiBvZiB0aGUgcG9saWN5IHRoaXMgb2JqZWN0IGNvbnRhaW5zLlxuICAgKi9cbiAgZ2V0IHZlcnNpb24oKTogVmVyc2lvbiB7XG4gICAgcmV0dXJuIGB2JHt0aGlzLiNkYXRhLnZlcnNpb259YDtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IHJ1bGVzLlxuICAgKlxuICAgKiBAZXhhbXBsZSBbIFwiQXNzZXJ0RXJjMjBUeFwiIF1cbiAgICovXG4gIGdldCBydWxlcygpOiBQb2xpY3lSdWxlW10ge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJ1bGVzIGFzIFBvbGljeVJ1bGVbXTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBhIGxpc3Qgb2YgYWxsIGtleXMsIHJvbGVzLCBhbmQga2V5LWluLXJvbGVzIHRoaXMgdmVyc2lvbiBvZiB0aGUgcG9saWN5XG4gICAqICAgICAgICAgIGlzIGF0dGFjaGVkIHRvLlxuICAgKi9cbiAgYXN5bmMgYWxsQXR0YWNoZWQoKTogUHJvbWlzZTxQb2xpY3lBdHRhY2hlZFRvSWRbXT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuYXR0YWNoZWRfdG87XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IE5hbWVkUG9saWN5SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGFwaUNsaWVudDtcbiAgICB0aGlzLiNkYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCB0aGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxOYW1lZFBvbGljeUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gKGF3YWl0IHRoaXMuI2FwaUNsaWVudC5wb2xpY3lHZXQodGhpcy5pZCwgdGhpcy52ZXJzaW9uKSkgYXMgTmFtZWRQb2xpY3lJbmZvO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIENvbmZpZGVudGlhbCBDbG91ZCBGdW5jdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIEMyRkludm9jYXRpb24ge1xuICByZWFkb25seSAjZGF0YTogSW52b2tlQzJGUmVzcG9uc2U7XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgcmVzcG9uc2UgaXRzZWxmLiAqL1xuICBnZXQgcmVzcG9uc2UoKTogQzJGUmVzcG9uc2Uge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJlc3BvbnNlO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFuZGFyZCBvdXRwdXQgc3RyZWFtIGFzIHJhdyBieXRlcy4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLFxuICAgKiB1c2Uge0BsaW5rIFRleHREZWNvZGVyfSB0byBkZWNvZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBvdXRwdXQgc3RyZWFtLlxuICAgKi9cbiAgZ2V0IHN0ZG91dEJ5dGVzKCk6IFVpbnQ4QXJyYXkge1xuICAgIHJldHVybiBkZWNvZGVGcm9tSGV4KHRoaXMuI2RhdGEuc3Rkb3V0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc3RhbmRhcmQgZXJyb3Igc3RyZWFtIGFzIHJhdyBieXRlcy4gVXN1YWxseSBhIFVURi04IGVuY29kZWQgc3RyaW5nLCB1c2VcbiAgICoge0BsaW5rIFRleHREZWNvZGVyfSB0byBkZWNvZGUuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBlcnJvciBzdHJlYW0uXG4gICAqL1xuICBnZXQgc3RkZXJyQnl0ZXMoKTogVWludDhBcnJheSB7XG4gICAgcmV0dXJuIGRlY29kZUZyb21IZXgodGhpcy4jZGF0YS5zdGRlcnIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFuZGFyZCBvdXRwdXQgc3RyZWFtIGFzIGEgQnVmZmVyLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBvdXRwdXQgc3RyZWFtLlxuICAgKiBAZGVwcmVjYXRlZCBVc2Uge0BsaW5rIHN0ZG91dEJ5dGVzfSBpbnN0ZWFkIGZvciBicm93c2VyIGNvbXBhdGliaWxpdHkuXG4gICAqL1xuICBnZXQgc3Rkb3V0KCk6IEJ1ZmZlciB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXJlc3RyaWN0ZWQtZ2xvYmFscyAtLSBCdWZmZXIgcmV0dXJuIHR5cGUgcHJlc2VydmVkIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICAgIHJldHVybiBCdWZmZXIuZnJvbSh0aGlzLnN0ZG91dEJ5dGVzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBUaGUgc3RhbmRhcmQgZXJyb3Igc3RyZWFtIGFzIGEgQnVmZmVyLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBlcnJvciBzdHJlYW0uXG4gICAqIEBkZXByZWNhdGVkIFVzZSB7QGxpbmsgc3RkZXJyQnl0ZXN9IGluc3RlYWQgZm9yIGJyb3dzZXIgY29tcGF0aWJpbGl0eS5cbiAgICovXG4gIGdldCBzdGRlcnIoKTogQnVmZmVyIHtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcmVzdHJpY3RlZC1nbG9iYWxzIC0tIEJ1ZmZlciByZXR1cm4gdHlwZSBwcmVzZXJ2ZWQgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKHRoaXMuc3RkZXJyQnl0ZXMpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRhdGE6IEludm9rZUMyRlJlc3BvbnNlKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLy8gQmFja3dhcmRzIGNvbXBhYmlsaXR5IHdpdGggTmFtZWQgV2FzbSBQb2xpY3kgbmFtZXNcblxuLyoqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBXYXNtIHBvbGljeS4gKi9cbmV4cG9ydCB0eXBlIE5hbWVkV2FzbVBvbGljeSA9IEMyRkZ1bmN0aW9uO1xuLyoqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBXYXNtIHBvbGljeS4gKi9cbmV4cG9ydCBjb25zdCBOYW1lZFdhc21Qb2xpY3kgPSBDMkZGdW5jdGlvbjtcblxuLyoqIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYSBuYW1lZCBXQVNNIHBvbGljeS4gKi9cbmV4cG9ydCB0eXBlIFBvbGljeUludm9jYXRpb24gPSBDMkZJbnZvY2F0aW9uO1xuLyoqIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgYSBuYW1lZCBXQVNNIHBvbGljeS4gKi9cbmV4cG9ydCBjb25zdCBQb2xpY3lJbnZvY2F0aW9uID0gQzJGSW52b2NhdGlvbjtcbiJdfQ==