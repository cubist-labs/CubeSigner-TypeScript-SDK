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
     * @param keyId The optional key id that the policy will be invoked with.
     * @param version The version of the policy to invoke. Defaults to "latest".
     * @param request The optional sign request body that will be sent to the policy.
     * @param roleId The optional role id that the policy will be invoked by.
     * If `undefined`, the policy will be invoked by the user session.
     * @returns The result of invoking the policy.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9saWN5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUE4REEsNENBb0JDO0FBOURELHdCQUFxQztBQWlDckM7Ozs7Ozs7O0dBUUc7QUFDSSxLQUFLLFVBQVUsZ0JBQWdCLENBQUMsU0FBb0IsRUFBRSxNQUFrQjtJQUM3RSw0REFBNEQ7SUFDNUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFBLG1CQUFnQixHQUFFLENBQUM7SUFDeEMsTUFBTSxTQUFTLEdBQUcsTUFBTSxNQUFNLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztJQUN6RCxNQUFNLElBQUksR0FBRyxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFM0QscUJBQXFCO0lBQ3JCLE1BQU0sRUFBRSxVQUFVLEVBQUUsR0FBRyxNQUFNLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFFbEUsMkJBQTJCO0lBQzNCLE1BQU0sSUFBSSxHQUFHLE1BQU0sS0FBSyxDQUFDLFVBQVUsRUFBRTtRQUNuQyxNQUFNLEVBQUUsS0FBSztRQUNiLElBQUksRUFBRSxNQUFNO0tBQ2IsQ0FBQyxDQUFDO0lBRUgsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUNiLE1BQU0sSUFBSSxLQUFLLENBQUMsd0NBQXdDLElBQUksQ0FBQyxNQUFNLEtBQUssSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDN0YsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBc0IsV0FBVztJQUkvQjs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQW9CLEVBQUUsSUFBZ0I7UUFDcEQsUUFBUSxJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDekIsS0FBSyxLQUFLO2dCQUNSLE9BQU8sSUFBSSxjQUFjLENBQUMsU0FBUyxFQUFFLElBQXFCLENBQUMsQ0FBQztZQUM5RCxLQUFLLE1BQU07Z0JBQ1QsT0FBTyxJQUFJLGVBQWUsQ0FBQyxTQUFTLEVBQUUsSUFBc0IsQ0FBQyxDQUFDO1lBQ2hFLEtBQUssTUFBTTtnQkFDVCxPQUFPLElBQUksZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFzQixDQUFDLENBQUM7UUFDbEUsQ0FBQztJQUNILENBQUM7SUFFRCw2QkFBNkI7SUFDN0IsSUFBSSxFQUFFO1FBQ0osT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztJQUM3QixDQUFDO0lBRUQsK0JBQStCO0lBQy9CLElBQUksVUFBVTtRQUNaLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDL0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxPQUFnQjtRQUM1QixJQUFJLFdBQVcsQ0FBQztRQUVoQixJQUFJLE9BQU8sSUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUN2QyxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLFdBQVcsR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELE9BQU8sSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzNELENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsT0FBTyxJQUFJLGdCQUFnQixDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDcEQsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsSUFBSTtRQUNSLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZLEVBQUUsVUFBd0I7UUFDbEQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxRQUFRLENBQUMsS0FBYSxFQUFFLFVBQXdCO1FBQ3BELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxRQUFxQixDQUFDO0lBQ3BDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQW1CLEVBQUUsVUFBd0I7UUFDN0QsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDOUMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNkLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQ7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLGFBQWEsQ0FBQyxVQUFzQixFQUFFLFVBQXdCO1FBQ2xFLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM3RCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFdBQVc7UUFDZiw4REFBOEQ7UUFDOUQsMENBQTBDO1FBQzFDLDhEQUE4RDtRQUM5RCwwQ0FBMEM7UUFDMUMsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRXhDLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7UUFDNUIsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7UUFDdEQsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLElBQUksV0FBVyxHQUF5QixFQUFFLENBQUM7UUFFM0MsS0FBSyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2hFLE1BQU0sRUFBRSxHQUFHLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FDMUIsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFO2dCQUN2RCxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsSUFBSSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1lBQzFELENBQUMsQ0FBQyxDQUNILENBQUM7WUFDRixXQUFXLEdBQUcsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQztRQUMvRSxDQUFDO1FBRUQsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUM5QyxDQUFDO0lBRUQ7Ozs7Ozs7O09BUUc7SUFDSCxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQXdCO1FBQ25DLE9BQU8sTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7O09BTUc7SUFDSCxZQUFzQixTQUFvQixFQUFFLElBQWdCO1FBQzFELElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO1FBQzNCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7Ozs7T0FRRztJQUNPLEtBQUssQ0FBQyxNQUFNLENBQ3BCLE9BQTRCLEVBQzVCLFVBQXdCO1FBRXhCLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDN0UsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDeEIsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDTyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQW1CLFFBQVE7UUFDL0MsSUFBSSxDQUFDLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQXZPRCxrQ0F1T0M7QUFFRDs7R0FFRztBQUNILE1BQWEsY0FBZSxTQUFRLFdBQVc7SUFHN0M7Ozs7OztPQU1HO0lBQ0gsS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUFnQixFQUFFLFVBQXdCO1FBQ3ZELE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7O09BTUc7SUFDSCxZQUFZLFNBQW9CLEVBQUUsSUFBbUI7UUFDbkQsS0FBSyxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN2QixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztJQUNuQixDQUFDO0NBQ0Y7QUE3QkQsd0NBNkJDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGVBQWdCLFNBQVEsV0FBVztJQUc5Qzs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQWlCLEVBQUUsVUFBd0I7UUFDeEQsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDM0MsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBRTdFOzs7Ozs7T0FNRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUFvQjtRQUNwRCxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQTdCRCwwQ0E2QkM7QUFFRDs7R0FFRztBQUNILE1BQWEsZUFBZ0IsU0FBUSxXQUFXO0lBRzlDOzs7Ozs7O09BT0c7SUFDSCxLQUFLLENBQUMsYUFBYSxDQUFDLE1BQWtCLEVBQUUsVUFBd0I7UUFDOUQsMkJBQTJCO1FBQzNCLE1BQU0sSUFBSSxHQUFHLE1BQU0sZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUU1RCxrREFBa0Q7UUFDbEQsTUFBTSxJQUFJLEdBQXdCLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUM7UUFDeEQsSUFBSSxDQUFDLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQW1CLENBQUM7SUFDdEUsQ0FBQztJQUVEOzs7Ozs7Ozs7T0FTRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQ1YsS0FBYyxFQUNkLFVBQW1CLFFBQVEsRUFDM0IsT0FBbUIsRUFDbkIsTUFBZTtRQUVmLDJFQUEyRTtRQUMzRSxpRUFBaUU7UUFDakUsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRTtZQUMvRCxNQUFNLEVBQUUsS0FBSztZQUNiLE9BQU87WUFDUCxPQUFPLEVBQUUsTUFBTTtTQUNoQixDQUFDLENBQUM7UUFDSCxPQUFPLElBQUksZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBRTdFOzs7Ozs7T0FNRztJQUNILFlBQVksU0FBb0IsRUFBRSxJQUFvQjtRQUNwRCxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7Q0FDRjtBQTdERCwwQ0E2REM7QUFFRDs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBSzNCOzs7O09BSUc7SUFDSCxJQUFJLEVBQUU7UUFDSixPQUFPLHVCQUFBLElBQUksOEJBQU0sQ0FBQyxTQUFTLENBQUM7SUFDOUIsQ0FBQztJQUVEOztPQUVHO0lBQ0gsSUFBSSxPQUFPO1FBQ1QsT0FBTyxJQUFJLHVCQUFBLElBQUksOEJBQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILElBQUksS0FBSztRQUNQLE9BQU8sdUJBQUEsSUFBSSw4QkFBTSxDQUFDLEtBQXFCLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7T0FHRztJQUNILEtBQUssQ0FBQyxXQUFXO1FBQ2YsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7O09BTUc7SUFDSCxZQUFZLFNBQW9CLEVBQUUsSUFBZ0I7UUFqRGxELGtFQUFrRTtRQUN6RCw4Q0FBc0I7UUFDL0IseUNBQWtCO1FBZ0RoQix1QkFBQSxJQUFJLCtCQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksMEJBQVMsSUFBSSxNQUFBLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssS0FBSyxDQUFDLEtBQUs7UUFDakIsdUJBQUEsSUFBSSwwQkFBUyxNQUFNLHVCQUFBLElBQUksbUNBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQUEsQ0FBQztRQUNwRSxPQUFPLHVCQUFBLElBQUksOEJBQU0sQ0FBQztJQUNwQixDQUFDO0NBQ0Y7QUFqRUQsNENBaUVDOztBQUVEOztHQUVHO0FBQ0gsTUFBYSxnQkFBZ0I7SUFHM0IsMkNBQTJDO0lBQzNDLElBQUksUUFBUTtRQUNWLE9BQU8sdUJBQUEsSUFBSSw4QkFBTSxDQUFDLFFBQVEsQ0FBQztJQUM3QixDQUFDO0lBRUQsMkVBQTJFO0lBQzNFLElBQUksTUFBTTtRQUNSLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLDhCQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDekMsQ0FBQztJQUVELDBFQUEwRTtJQUMxRSxJQUFJLE1BQU07UUFDUixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsdUJBQUEsSUFBSSw4QkFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7T0FLRztJQUNLLE9BQU8sQ0FBQyxHQUFXO1FBQ3pCLE9BQU8sTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsWUFBWSxJQUEwQjtRQXJDN0IseUNBQTRCO1FBc0NuQyx1QkFBQSxJQUFJLDBCQUFTLElBQUksTUFBQSxDQUFDO0lBQ3BCLENBQUM7Q0FDRjtBQXpDRCw0Q0F5Q0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7XG4gIEFwaUNsaWVudCxcbiAgQ3ViZVNpZ25lclJlc3BvbnNlLFxuICBFZGl0UG9saWN5LFxuICBFbXB0eSxcbiAgSW52b2tlUG9saWN5UmVzcG9uc2UsXG4gIEpzb25WYWx1ZSxcbiAgS2V5UG9saWN5LFxuICBLZXlQb2xpY3lSdWxlLFxuICBNZmFSZWNlaXB0cyxcbiAgUG9saWN5QXR0YWNoZWRUb0lkLFxuICBQb2xpY3lJbmZvLFxuICBQb2xpY3lUeXBlLFxuICBSb2xlUG9saWN5LFxuICBSb2xlUG9saWN5UnVsZSxcbiAgVXBkYXRlUG9saWN5UmVxdWVzdCxcbiAgV2FzbVBvbGljeVJlc3BvbnNlLFxuICBXYXNtUnVsZSxcbn0gZnJvbSBcIi5cIjtcblxuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCIuXCI7XG5cbi8qKlxuICogTmFtZWQgcG9saWN5IHJ1bGUgdHlwZS5cbiAqL1xuZXhwb3J0IHR5cGUgUG9saWN5UnVsZSA9IEtleVBvbGljeVJ1bGUgfCBSb2xlUG9saWN5UnVsZSB8IFdhc21SdWxlO1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCBrZXkgcG9saWN5LlxuICovXG5leHBvcnQgdHlwZSBLZXlQb2xpY3lJbmZvID0gUG9saWN5SW5mbyAmIHtcbiAgcG9saWN5X3R5cGU6IFwiS2V5XCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCByb2xlIHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgUm9sZVBvbGljeUluZm8gPSBQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJSb2xlXCI7XG59O1xuXG4vKipcbiAqIFRoZSBwb2xpY3kgaW5mbyBmb3IgYSBuYW1lZCB3YXNtIHBvbGljeS5cbiAqL1xuZXhwb3J0IHR5cGUgV2FzbVBvbGljeUluZm8gPSBQb2xpY3lJbmZvICYge1xuICBwb2xpY3lfdHlwZTogXCJXYXNtXCI7XG59O1xuXG4vKipcbiAqIEEgaGVscGVyIHR5cGUgZm9yIHZhbGlkIG5hbWVkIHBvbGljeSB2ZXJzaW9uIHN0cmluZ3MuXG4gKi9cbmV4cG9ydCB0eXBlIFZlcnNpb24gPSBgdiR7bnVtYmVyfWAgfCBgbGF0ZXN0YDtcblxuLyoqXG4gKiBVcGxvYWQgdGhlIGdpdmVuIFdhc20gcG9saWN5IG9iamVjdC5cbiAqXG4gKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBBUEkgY2xpZW50IHRvIHVzZS5cbiAqIEBwYXJhbSBwb2xpY3kgVGhlIFdhc20gcG9saWN5IG9iamVjdC5cbiAqIEByZXR1cm5zIFRoZSBXYXNtIHBvbGljeSBvYmplY3QgaGFzaCB0byB1c2UgZm9yIGNyZWF0aW5nL3VwZGF0aW5nIHBvbGljaWVzLlxuICogQHRocm93cyBpZiB1cGxvYWRpbmcgdGhlIHBvbGljeSBmYWlscy5cbiAqIEBpbnRlcm5hbFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBsb2FkV2FzbVBvbGljeShhcGlDbGllbnQ6IEFwaUNsaWVudCwgcG9saWN5OiBVaW50OEFycmF5KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgLy8gZ2V0IHRoZSBTSEEtMjU2IGhhc2ggb2YgdGhlIHBvbGljeSB0byBnZXQgdGhlIHVwbG9hZCB1cmwuXG4gIGNvbnN0IHN1YnRsZSA9IGF3YWl0IGxvYWRTdWJ0bGVDcnlwdG8oKTtcbiAgY29uc3QgaGFzaEJ5dGVzID0gYXdhaXQgc3VidGxlLmRpZ2VzdChcIlNIQS0yNTZcIiwgcG9saWN5KTtcbiAgY29uc3QgaGFzaCA9IFwiMHhcIiArIEJ1ZmZlci5mcm9tKGhhc2hCeXRlcykudG9TdHJpbmcoXCJoZXhcIik7XG5cbiAgLy8gZ2V0IHRoZSB1cGxvYWQgVVJMXG4gIGNvbnN0IHsgc2lnbmVkX3VybCB9ID0gYXdhaXQgYXBpQ2xpZW50Lndhc21Qb2xpY3lVcGxvYWQoeyBoYXNoIH0pO1xuXG4gIC8vIHVwbG9hZCB0aGUgcG9saWN5IG9iamVjdFxuICBjb25zdCByZXNwID0gYXdhaXQgZmV0Y2goc2lnbmVkX3VybCwge1xuICAgIG1ldGhvZDogXCJQVVRcIixcbiAgICBib2R5OiBwb2xpY3ksXG4gIH0pO1xuXG4gIGlmICghcmVzcC5vaykge1xuICAgIHRocm93IG5ldyBFcnJvcihgRmFpbGVkIHRvIHVwbG9hZCBwb2xpY3kgd2l0aCBzdGF0dXM6ICR7cmVzcC5zdGF0dXN9OiAke3Jlc3Auc3RhdHVzVGV4dH1gKTtcbiAgfVxuXG4gIHJldHVybiBoYXNoO1xufVxuXG4vKipcbiAqIEFic3RyYWN0IGNsYXNzIGZvciBzaGFyZWQgbWV0aG9kcyBiZXR3ZWVuIGtleSwgcm9sZSBhbmQgV2FzbSBwb2xpY2llcy5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIE5hbWVkUG9saWN5IHtcbiAgcHJvdGVjdGVkIHJlYWRvbmx5IGFwaUNsaWVudDogQXBpQ2xpZW50O1xuICBwcm90ZWN0ZWQgZGF0YTogUG9saWN5SW5mbztcblxuICAvKipcbiAgICogSGVscGVyIG1ldGhvZCBmb3IgY3JlYXRpbmcgYSBuYW1lZCBwb2xpY3kgZnJvbSBhIHBvbGljeSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYXBpQ2xpZW50IFRoZSBhcGkgY2xpZW50IHRvIHVzZS5cbiAgICogQHBhcmFtIGluZm8gVGhlIHBvbGljeSBpbmZvLlxuICAgKiBAcmV0dXJucyBUaGUgbmFtZWQgcG9saWN5IG9iamVjdCBmb3IgdGhlIGdpdmVuIGluZm8uXG4gICAqL1xuICBzdGF0aWMgZnJvbUluZm8oYXBpQ2xpZW50OiBBcGlDbGllbnQsIGluZm86IFBvbGljeUluZm8pOiBOYW1lZFBvbGljeSB7XG4gICAgc3dpdGNoIChpbmZvLnBvbGljeV90eXBlKSB7XG4gICAgICBjYXNlIFwiS2V5XCI6XG4gICAgICAgIHJldHVybiBuZXcgTmFtZWRLZXlQb2xpY3koYXBpQ2xpZW50LCBpbmZvIGFzIEtleVBvbGljeUluZm8pO1xuICAgICAgY2FzZSBcIlJvbGVcIjpcbiAgICAgICAgcmV0dXJuIG5ldyBOYW1lZFJvbGVQb2xpY3koYXBpQ2xpZW50LCBpbmZvIGFzIFJvbGVQb2xpY3lJbmZvKTtcbiAgICAgIGNhc2UgXCJXYXNtXCI6XG4gICAgICAgIHJldHVybiBuZXcgTmFtZWRXYXNtUG9saWN5KGFwaUNsaWVudCwgaW5mbyBhcyBXYXNtUG9saWN5SW5mbyk7XG4gICAgfVxuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBwb2xpY3kgaWQgKi9cbiAgZ2V0IGlkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5wb2xpY3lfaWQ7XG4gIH1cblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSB0eXBlICovXG4gIGdldCBwb2xpY3lUeXBlKCk6IFBvbGljeVR5cGUge1xuICAgIHJldHVybiB0aGlzLmRhdGEucG9saWN5X3R5cGU7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgcG9saWN5IHZlcnNpb24gdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgc3BlY2lmaWMgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgdmVyc2lvbih2ZXJzaW9uOiBWZXJzaW9uKTogUHJvbWlzZTxOYW1lZFBvbGljeVJ1bGVzPiB7XG4gICAgbGV0IHZlcnNpb25JbmZvO1xuXG4gICAgaWYgKHZlcnNpb24gPT0gYHYke3RoaXMuZGF0YS52ZXJzaW9ufWApIHtcbiAgICAgIHZlcnNpb25JbmZvID0gdGhpcy5kYXRhO1xuICAgIH0gZWxzZSB7XG4gICAgICB2ZXJzaW9uSW5mbyA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB2ZXJzaW9uKTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE5hbWVkUG9saWN5UnVsZXModGhpcy5hcGlDbGllbnQsIHZlcnNpb25JbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhdGVzdCB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgbGF0ZXN0KCk6IFByb21pc2U8TmFtZWRQb2xpY3lSdWxlcz4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKFwibGF0ZXN0XCIpO1xuICAgIHJldHVybiBuZXcgTmFtZWRQb2xpY3lSdWxlcyh0aGlzLmFwaUNsaWVudCwgZGF0YSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2ggYW5kIHJldHVybiB0aGUgY3VycmVudCBuYW1lIG9mIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgbmFtZS5cbiAgICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IG5hbWUgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuZXcgcG9saWN5IG5hbWUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXROYW1lKG5hbWU6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBuYW1lIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIGN1cnJlbnQgb3duZXIgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgb2YgdGhlIHBvbGljeSBvd25lci5cbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBuZXcgb3duZXIgZm9yIHRoZSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBvd25lciBUaGUgbmV3IG93bmVyIG9mIHRoZSBwb2xpY3kuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqL1xuICBhc3luYyBzZXRPd25lcihvd25lcjogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIGFuZCByZXR1cm4gdGhlIG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgcG9saWN5LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcG9saWN5IG1ldGFkYXRhLlxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxKc29uVmFsdWU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm1ldGFkYXRhIGFzIEpzb25WYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgY29udGFjdCAob3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIHZhbHVlKS5cbiAgICpcbiAgICogQHBhcmFtIG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgZm9yIHRoZSBjb250YWN0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGEobWV0YWRhdGE6IEpzb25WYWx1ZSwgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaCBhbmQgcmV0dXJuIHRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlZGl0IHBvbGljeSBmb3IgdGhpcyBuYW1lZCBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIGEgbGlzdCBvZiBhbGwga2V5cywgcm9sZXMsIGFuZCBrZXktaW4tcm9sZXMgdGhhdCBhbGwgdmVyc2lvbnMgb2YgdGhpcyBwb2xpY3lcbiAgICogYXJlIGF0dGFjaGVkIHRvLlxuICAgKi9cbiAgYXN5bmMgYWxsQXR0YWNoZWQoKTogUHJvbWlzZTxQb2xpY3lBdHRhY2hlZFRvSWRbXT4ge1xuICAgIC8vIHRoZXJlIGlzIG5vIHNpbmdsZS1jYWxsIHdheSB0byBhY2hpZXZlIHRoaXMuIFNvIGluc3RlYWQsIHdlXG4gICAgLy8gMS4gR2V0IHRoZSBsYXRlc3QgdmVyc2lvbiBvZiB0aGUgcG9saWN5XG4gICAgLy8gMi4gRm9yIGFsbCB2ZXJzaW9ucyBgdjBgIHRvIGBsYXRlc3RgLCBmZXRjaCB0aGUgcG9saWN5IGluZm9cbiAgICAvLyAzLiBKb2luIGFsbCBwb2xpY3kgYGF0dGFjaGVkX3RvYCBhcnJheXNcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaChcImxhdGVzdFwiKTtcblxuICAgIGNvbnN0IGxhdGVzdCA9IGRhdGEudmVyc2lvbjtcbiAgICBjb25zdCB2ZXJzaW9ucyA9IEFycmF5LmZyb20oQXJyYXkobGF0ZXN0ICsgMSkua2V5cygpKTtcbiAgICBjb25zdCBiYXRjaFNpemUgPSAxMDtcbiAgICBsZXQgYWxsQXR0YWNoZWQ6IFBvbGljeUF0dGFjaGVkVG9JZFtdID0gW107XG5cbiAgICBmb3IgKGxldCBiYXRjaCA9IDA7IGJhdGNoIDwgdmVyc2lvbnMubGVuZ3RoOyBiYXRjaCArPSBiYXRjaFNpemUpIHtcbiAgICAgIGNvbnN0IHJzID0gYXdhaXQgUHJvbWlzZS5hbGwoXG4gICAgICAgIHZlcnNpb25zLnNsaWNlKGJhdGNoLCBiYXRjaCArIGJhdGNoU2l6ZSkubWFwKCh2ZXJzaW9uKSA9PiB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCBgdiR7dmVyc2lvbn1gKTtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgICAgYWxsQXR0YWNoZWQgPSBhbGxBdHRhY2hlZC5jb25jYXQocnMuZmxhdE1hcCgocG9saWN5KSA9PiBwb2xpY3kuYXR0YWNoZWRfdG8pKTtcbiAgICB9XG5cbiAgICByZXR1cm4gYWxsQXR0YWNoZWQuY29uY2F0KGRhdGEuYXR0YWNoZWRfdG8pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIHBvbGljeS5cbiAgICpcbiAgICogVGhpcyBjYW4gZmFpbCBpZiB0aGUgcG9saWN5IGlzIHN0aWxsIGF0dGFjaGVkIHRvIGFueSBrZXksIHJvbGUsIG9yIGtleSBpbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICogQHRocm93cyBpZiBNRkEgaXMgcmVxdWlyZWQgYW5kIG5vIHJlY2VpcHRzIGFyZSBwcm92aWRlZFxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmFwaUNsaWVudC5wb2xpY3lEZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBQb2xpY3lJbmZvKSB7XG4gICAgdGhpcy5hcGlDbGllbnQgPSBhcGlDbGllbnQ7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHVwZGF0ZWQgcG9saWN5IGluZm9ybWF0aW9uLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIHVwZGF0ZShcbiAgICByZXF1ZXN0OiBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxQb2xpY3lJbmZvPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeVVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0LCBtZmFSZWNlaXB0KTtcbiAgICB0aGlzLmRhdGEgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy5kYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSB2ZXJzaW9uIG9mIHRoZSBwb2xpY3kgdG8gZmV0Y2guIERlZmF1bHRzIHRvIFwibGF0ZXN0XCIuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJvdGVjdGVkIGFzeW5jIGZldGNoKHZlcnNpb246IFZlcnNpb24gPSBcImxhdGVzdFwiKTogUHJvbWlzZTxQb2xpY3lJbmZvPiB7XG4gICAgdGhpcy5kYXRhID0gYXdhaXQgdGhpcy5hcGlDbGllbnQucG9saWN5R2V0KHRoaXMuaWQsIHZlcnNpb24pO1xuICAgIHJldHVybiB0aGlzLmRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgbmFtZWQga2V5IHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkS2V5UG9saWN5IGV4dGVuZHMgTmFtZWRQb2xpY3kge1xuICBvdmVycmlkZSBkYXRhOiBLZXlQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIG5ldyBydWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBuZXcgcnVsZXMgdG8gdXBkYXRlIHRoZSBwb2xpY3kgd2l0aC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJ1bGVzKHJ1bGVzOiBLZXlQb2xpY3ksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgcnVsZXMgfSwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IEtleVBvbGljeUluZm8pIHtcbiAgICBzdXBlcihhcGlDbGllbnQsIGRhdGEpO1xuICAgIHRoaXMuZGF0YSA9IGRhdGE7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgbmFtZWQgcm9sZSBwb2xpY3kuXG4gKi9cbmV4cG9ydCBjbGFzcyBOYW1lZFJvbGVQb2xpY3kgZXh0ZW5kcyBOYW1lZFBvbGljeSB7XG4gIG92ZXJyaWRlIGRhdGE6IFJvbGVQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIHBvbGljeSB3aXRoIG5ldyBydWxlcy5cbiAgICpcbiAgICogQHBhcmFtIHJ1bGVzIFRoZSBuZXcgcnVsZXMgdG8gdXBkYXRlIHRoZSBwb2xpY3kgd2l0aC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgTUZBIGlzIHJlcXVpcmVkIGFuZCBubyByZWNlaXB0cyBhcmUgcHJvdmlkZWRcbiAgICovXG4gIGFzeW5jIHNldFJ1bGVzKHJ1bGVzOiBSb2xlUG9saWN5LCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IHJ1bGVzIH0sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBSb2xlUG9saWN5SW5mbykge1xuICAgIHN1cGVyKGFwaUNsaWVudCwgZGF0YSk7XG4gICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgfVxufVxuXG4vKipcbiAqIEEgcmVwcmVzZW50YXRpb24gb2YgYSBXYXNtIHBvbGljeS5cbiAqL1xuZXhwb3J0IGNsYXNzIE5hbWVkV2FzbVBvbGljeSBleHRlbmRzIE5hbWVkUG9saWN5IHtcbiAgb3ZlcnJpZGUgZGF0YTogV2FzbVBvbGljeUluZm87XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB0aGUgcG9saWN5IHdpdGggdGhlIG5ldyBXYXNtIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeSBUaGUgbmV3IFdhc20gcG9saWN5IG9iamVjdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEB0aHJvd3MgaWYgdXBsb2FkaW5nIHRoZSBwb2xpY3kgb2JqZWN0IGZhaWxzLlxuICAgKiBAdGhyb3dzIGlmIE1GQSBpcyByZXF1aXJlZCBhbmQgbm8gcmVjZWlwdHMgYXJlIHByb3ZpZGVkLlxuICAgKi9cbiAgYXN5bmMgc2V0V2FzbVBvbGljeShwb2xpY3k6IFVpbnQ4QXJyYXksIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cykge1xuICAgIC8vIHVwbG9hZCB0aGUgcG9saWN5IG9iamVjdFxuICAgIGNvbnN0IGhhc2ggPSBhd2FpdCB1cGxvYWRXYXNtUG9saWN5KHRoaXMuYXBpQ2xpZW50LCBwb2xpY3kpO1xuXG4gICAgLy8gdXBkYXRlIHRoaXMgcG9saWN5IHdpdGggdGhlIG5ldyBwb2xpY3kgdmVyaXNvbi5cbiAgICBjb25zdCBib2R5OiBVcGRhdGVQb2xpY3lSZXF1ZXN0ID0geyBydWxlczogW3sgaGFzaCB9XSB9O1xuICAgIHRoaXMuZGF0YSA9IChhd2FpdCB0aGlzLnVwZGF0ZShib2R5LCBtZmFSZWNlaXB0KSkgYXMgV2FzbVBvbGljeUluZm87XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIHRoaXMgd2FzbSBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgb3B0aW9uYWwga2V5IGlkIHRoYXQgdGhlIHBvbGljeSB3aWxsIGJlIGludm9rZWQgd2l0aC5cbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHZlcnNpb24gb2YgdGhlIHBvbGljeSB0byBpbnZva2UuIERlZmF1bHRzIHRvIFwibGF0ZXN0XCIuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBvcHRpb25hbCBzaWduIHJlcXVlc3QgYm9keSB0aGF0IHdpbGwgYmUgc2VudCB0byB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBvcHRpb25hbCByb2xlIGlkIHRoYXQgdGhlIHBvbGljeSB3aWxsIGJlIGludm9rZWQgYnkuXG4gICAqIElmIGB1bmRlZmluZWRgLCB0aGUgcG9saWN5IHdpbGwgYmUgaW52b2tlZCBieSB0aGUgdXNlciBzZXNzaW9uLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIGludm9raW5nIHRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBpbnZva2UoXG4gICAga2V5SWQ/OiBzdHJpbmcsXG4gICAgdmVyc2lvbjogVmVyc2lvbiA9IFwibGF0ZXN0XCIsXG4gICAgcmVxdWVzdD86IEpzb25WYWx1ZSxcbiAgICByb2xlSWQ/OiBzdHJpbmcsXG4gICk6IFByb21pc2U8UG9saWN5SW52b2NhdGlvbj4ge1xuICAgIC8vIFRPRE8gSWRlYWxseSwgYHZlcnNpb25gIHNob3VsZCBiZSB0aGUgZmlyc3QgcGFyYW1ldGVyLiBCdXQgZm9yIGJhY2t3YXJkc1xuICAgIC8vIGNvbXBhdGliaWxpdHksIHdlIGtlZXAgYGtleUlkYCBhcyB0aGUgZmlyc3QgcGFyYW1ldGVyIGZvciBub3cuXG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuYXBpQ2xpZW50LnBvbGljeUludm9rZSh0aGlzLmlkLCB2ZXJzaW9uLCB7XG4gICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgcmVxdWVzdCxcbiAgICAgIHJvbGVfaWQ6IHJvbGVJZCxcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IFBvbGljeUludm9jYXRpb24ocmVzcCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3Rvci5cbiAgICpcbiAgICogQHBhcmFtIGFwaUNsaWVudCBUaGUgQVBJIGNsaWVudCB0byB1c2UuXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgY29uc3RydWN0b3IoYXBpQ2xpZW50OiBBcGlDbGllbnQsIGRhdGE6IFdhc21Qb2xpY3lJbmZvKSB7XG4gICAgc3VwZXIoYXBpQ2xpZW50LCBkYXRhKTtcbiAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICB9XG59XG5cbi8qKlxuICogQSBzcGVjaWZpYyB2ZXJzaW9uIG9mIGEgbmFtZWQgcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgTmFtZWRQb2xpY3lSdWxlcyB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMgcG9saWN5IGlzIGFzc29jaWF0ZWQgd2l0aCAqL1xuICByZWFkb25seSAjYXBpQ2xpZW50OiBBcGlDbGllbnQ7XG4gICNkYXRhOiBQb2xpY3lJbmZvO1xuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBUaGUgSUQgb2YgdGhlIHBvbGljeS5cbiAgICpcbiAgICogQGV4YW1wbGUgTmFtZWRQb2xpY3kjYTRhNDVjYzItMDY0Mi00Yzk4LWI2YmQtMGRhMzQ3ZDYwOGE0XG4gICAqL1xuICBnZXQgaWQoKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5wb2xpY3lfaWQ7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHZlcnNpb24gb2YgdGhlIHBvbGljeSB0aGlzIG9iamVjdCBjb250YWlucy5cbiAgICovXG4gIGdldCB2ZXJzaW9uKCk6IFZlcnNpb24ge1xuICAgIHJldHVybiBgdiR7dGhpcy4jZGF0YS52ZXJzaW9ufWA7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIHBvbGljeSBydWxlcy5cbiAgICpcbiAgICogQGV4YW1wbGUgWyBcIkFzc2VydEVyYzIwVHhcIiBdXG4gICAqL1xuICBnZXQgcnVsZXMoKTogUG9saWN5UnVsZVtdIHtcbiAgICByZXR1cm4gdGhpcy4jZGF0YS5ydWxlcyBhcyBQb2xpY3lSdWxlW107XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgYSBsaXN0IG9mIGFsbCBrZXlzLCByb2xlcywgYW5kIGtleS1pbi1yb2xlcyB0aGlzIHZlcnNpb24gb2YgdGhlIHBvbGljeVxuICAgKiAgICAgICAgICBpcyBhdHRhY2hlZCB0by5cbiAgICovXG4gIGFzeW5jIGFsbEF0dGFjaGVkKCk6IFByb21pc2U8UG9saWN5QXR0YWNoZWRUb0lkW10+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmF0dGFjaGVkX3RvO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ29uc3RydWN0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBhcGlDbGllbnQgVGhlIEFQSSBjbGllbnQgdG8gdXNlLlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGFwaUNsaWVudDogQXBpQ2xpZW50LCBkYXRhOiBQb2xpY3lJbmZvKSB7XG4gICAgdGhpcy4jYXBpQ2xpZW50ID0gYXBpQ2xpZW50O1xuICAgIHRoaXMuI2RhdGEgPSBkYXRhO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoIHRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFBvbGljeUluZm8+IHtcbiAgICB0aGlzLiNkYXRhID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LnBvbGljeUdldCh0aGlzLmlkLCB0aGlzLnZlcnNpb24pO1xuICAgIHJldHVybiB0aGlzLiNkYXRhO1xuICB9XG59XG5cbi8qKlxuICogVGhlIHJlc3VsdCBvZiBpbnZva2luZyBhIG5hbWVkIHdhc20gcG9saWN5LlxuICovXG5leHBvcnQgY2xhc3MgUG9saWN5SW52b2NhdGlvbiB7XG4gIHJlYWRvbmx5ICNkYXRhOiBJbnZva2VQb2xpY3lSZXNwb25zZTtcblxuICAvKiogQHJldHVybnMgVGhlIHBvbGljeSByZXNwb25zZSBpdHNlbGYuICovXG4gIGdldCByZXNwb25zZSgpOiBXYXNtUG9saWN5UmVzcG9uc2Uge1xuICAgIHJldHVybiB0aGlzLiNkYXRhLnJlc3BvbnNlO1xuICB9XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBzdGFuZGFyZCBvdXRwdXQgc3RyZWFtLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcuICovXG4gIGdldCBzdGRvdXQoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tSGV4KHRoaXMuI2RhdGEuc3Rkb3V0KTtcbiAgfVxuXG4gIC8qKiBAcmV0dXJucyBUaGUgc3RhbmRhcmQgZXJyb3Igc3RyZWFtLiBVc3VhbGx5IGEgVVRGLTggZW5jb2RlZCBzdHJpbmcuICovXG4gIGdldCBzdGRlcnIoKTogQnVmZmVyIHtcbiAgICByZXR1cm4gdGhpcy5mcm9tSGV4KHRoaXMuI2RhdGEuc3RkZXJyKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tIElOVEVSTkFMIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIEhlbHBlciBtZXRob2QgZm9yIGNvbnZlcnRpbmcgaGV4LWVuY29kZWQgZGF0YSB0byBhIGBCdWZmZXJgLlxuICAgKlxuICAgKiBAcGFyYW0gaGV4IFRoZSBoZXgtZW5jb2RlZCBkYXRhLlxuICAgKiBAcmV0dXJucyBUaGUgZGF0YS5cbiAgICovXG4gIHByaXZhdGUgZnJvbUhleChoZXg6IHN0cmluZyk6IEJ1ZmZlciB7XG4gICAgcmV0dXJuIEJ1ZmZlci5mcm9tKGhleC5zdGFydHNXaXRoKFwiMHhcIikgPyBoZXguc2xpY2UoMikgOiBoZXgsIFwiaGV4XCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbnN0cnVjdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSBUaGUgSlNPTiByZXNwb25zZSBmcm9tIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIGNvbnN0cnVjdG9yKGRhdGE6IEludm9rZVBvbGljeVJlc3BvbnNlKSB7XG4gICAgdGhpcy4jZGF0YSA9IGRhdGE7XG4gIH1cbn1cbiJdfQ==