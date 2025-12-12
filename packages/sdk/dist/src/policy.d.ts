import type { ApiClient, CubeSignerResponse, EditPolicy, Empty, InvokePolicyResponse, JsonValue, KeyPolicy, KeyPolicyRule, MfaReceipts, PolicyAttachedToId, PolicyInfo, PolicyType, RolePolicy, RolePolicyRule, UpdatePolicyRequest, WasmPolicyResponse, WasmRule } from ".";
/**
 * Named policy rule type.
 */
export type PolicyRule = KeyPolicyRule | RolePolicyRule | WasmRule;
/**
 * The policy info for a named key policy.
 */
export type KeyPolicyInfo = PolicyInfo & {
    policy_type: "Key";
};
/**
 * The policy info for a named role policy.
 */
export type RolePolicyInfo = PolicyInfo & {
    policy_type: "Role";
};
/**
 * The policy info for a named wasm policy.
 */
export type WasmPolicyInfo = PolicyInfo & {
    policy_type: "Wasm";
};
/**
 * A helper type for valid named policy version strings.
 */
export type Version = `v${number}` | `latest`;
/**
 * Upload the given Wasm policy object.
 *
 * @param apiClient The API client to use.
 * @param policy The Wasm policy object.
 * @returns The Wasm policy object hash to use for creating/updating policies.
 * @throws if uploading the policy fails.
 * @internal
 */
export declare function uploadWasmPolicy(apiClient: ApiClient, policy: Uint8Array): Promise<string>;
/**
 * Abstract class for shared methods between key, role and Wasm policies.
 */
export declare abstract class NamedPolicy {
    protected readonly apiClient: ApiClient;
    protected data: PolicyInfo;
    /**
     * Helper method for creating a named policy from a policy info.
     *
     * @param apiClient The api client to use.
     * @param info The policy info.
     * @returns The named policy object for the given info.
     */
    static fromInfo(apiClient: ApiClient, info: PolicyInfo): NamedPolicy;
    /** @returns The policy id */
    get id(): string;
    /** @returns The policy type */
    get policyType(): PolicyType;
    /**
     * Get a specific version of the policy.
     *
     * @param version The policy version to get.
     * @returns The specific version of the policy.
     */
    version(version: Version): Promise<NamedPolicyRules>;
    /**
     * Get the latest version of the policy.
     *
     * @returns The latest version of the policy.
     */
    latest(): Promise<NamedPolicyRules>;
    /**
     * Fetch and return the current name of the policy.
     *
     * @returns The policy name.
     */
    name(): Promise<string>;
    /**
     * Set a new name for the policy.
     *
     * @param name The new policy name.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setName(name: string, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Fetch and return the current owner of the policy.
     *
     * @returns The user id of the policy owner.
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    owner(): Promise<string>;
    /**
     * Set a new owner for the policy.
     *
     * @param owner The new owner of the policy.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setOwner(owner: string, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Fetch and return the metadata value for the policy.
     *
     * @returns The policy metadata.
     */
    metadata(): Promise<JsonValue>;
    /**
     * Sets a new metadata value for the contact (overwriting the existing value).
     *
     * @param metadata The new metadata for the contact.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setMetadata(metadata: JsonValue, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Fetch and return the edit policy for the contact.
     *
     * @returns The edit policy for this named policy.
     */
    editPolicy(): Promise<EditPolicy | undefined>;
    /**
     * Set a new edit policy for the named policy.
     *
     * @param editPolicy The new edit policy.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setEditPolicy(editPolicy: EditPolicy, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * @returns a list of all keys, roles, and key-in-roles that all versions of this policy
     * are attached to.
     */
    allAttached(): Promise<PolicyAttachedToId[]>;
    /**
     * Delete this policy.
     *
     * This can fail if the policy is still attached to any key, role, or key in role.
     *
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns A response which can be used to approve MFA if needed
     * @throws if MFA is required and no receipts are provided
     */
    delete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    protected constructor(apiClient: ApiClient, data: PolicyInfo);
    /**
     * Update the policy.
     *
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The updated policy information.
     * @throws if MFA is required and no receipts are provided
     * @internal
     */
    protected update(request: UpdatePolicyRequest, mfaReceipt?: MfaReceipts): Promise<PolicyInfo>;
    /**
     * Fetch the policy information.
     *
     * @param version The version of the policy to fetch. Defaults to "latest".
     * @returns The policy information.
     * @internal
     */
    protected fetch(version?: Version): Promise<PolicyInfo>;
}
/**
 * A representation of a named key policy.
 */
export declare class NamedKeyPolicy extends NamedPolicy {
    data: KeyPolicyInfo;
    /**
     * Update the policy with new rules.
     *
     * @param rules The new rules to update the policy with.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setRules(rules: KeyPolicy, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient: ApiClient, data: KeyPolicyInfo);
}
/**
 * A representation of a named role policy.
 */
export declare class NamedRolePolicy extends NamedPolicy {
    data: RolePolicyInfo;
    /**
     * Update the policy with new rules.
     *
     * @param rules The new rules to update the policy with.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if MFA is required and no receipts are provided
     */
    setRules(rules: RolePolicy, mfaReceipt?: MfaReceipts): Promise<void>;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient: ApiClient, data: RolePolicyInfo);
}
/**
 * A representation of a Wasm policy.
 */
export declare class NamedWasmPolicy extends NamedPolicy {
    data: WasmPolicyInfo;
    /**
     * Update the policy with the new Wasm policy.
     *
     * @param policy The new Wasm policy object.
     * @param mfaReceipt Optional MFA receipt(s).
     * @throws if uploading the policy object fails.
     * @throws if MFA is required and no receipts are provided.
     */
    setWasmPolicy(policy: Uint8Array, mfaReceipt?: MfaReceipts): Promise<void>;
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
    invoke(keyId?: string, version?: Version, request?: JsonValue, roleId?: string): Promise<PolicyInvocation>;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient: ApiClient, data: WasmPolicyInfo);
}
/**
 * A specific version of a named policy.
 */
export declare class NamedPolicyRules {
    #private;
    /**
     * @returns The ID of the policy.
     *
     * @example NamedPolicy#a4a45cc2-0642-4c98-b6bd-0da347d608a4
     */
    get id(): string;
    /**
     * @returns The version of the policy this object contains.
     */
    get version(): Version;
    /**
     * @returns The policy rules.
     *
     * @example [ "AssertErc20Tx" ]
     */
    get rules(): PolicyRule[];
    /**
     * @returns a list of all keys, roles, and key-in-roles this version of the policy
     *          is attached to.
     */
    allAttached(): Promise<PolicyAttachedToId[]>;
    /**
     * Constructor.
     *
     * @param apiClient The API client to use.
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(apiClient: ApiClient, data: PolicyInfo);
    /**
     * Fetch the policy information.
     *
     * @returns The policy information.
     * @internal
     */
    private fetch;
}
/**
 * The result of invoking a named wasm policy.
 */
export declare class PolicyInvocation {
    #private;
    /** @returns The policy response itself. */
    get response(): WasmPolicyResponse;
    /** @returns The standard output stream. Usually a UTF-8 encoded string. */
    get stdout(): Buffer;
    /** @returns The standard error stream. Usually a UTF-8 encoded string. */
    get stderr(): Buffer;
    /**
     * Helper method for converting hex-encoded data to a `Buffer`.
     *
     * @param hex The hex-encoded data.
     * @returns The data.
     */
    private fromHex;
    /**
     * Constructor.
     *
     * @param data The JSON response from the API server.
     * @internal
     */
    constructor(data: InvokePolicyResponse);
}
//# sourceMappingURL=policy.d.ts.map