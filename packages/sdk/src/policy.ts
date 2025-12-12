import type {
  ApiClient,
  CubeSignerResponse,
  EditPolicy,
  Empty,
  InvokePolicyResponse,
  JsonValue,
  KeyPolicy,
  KeyPolicyRule,
  MfaReceipts,
  PolicyAttachedToId,
  PolicyInfo,
  PolicyType,
  RolePolicy,
  RolePolicyRule,
  UpdatePolicyRequest,
  WasmPolicyResponse,
  WasmRule,
} from ".";

import { loadSubtleCrypto } from ".";

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
export async function uploadWasmPolicy(apiClient: ApiClient, policy: Uint8Array): Promise<string> {
  // get the SHA-256 hash of the policy to get the upload url.
  const subtle = await loadSubtleCrypto();
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
export abstract class NamedPolicy {
  protected readonly apiClient: ApiClient;
  protected data: PolicyInfo;

  /**
   * Helper method for creating a named policy from a policy info.
   *
   * @param apiClient The api client to use.
   * @param info The policy info.
   * @returns The named policy object for the given info.
   */
  static fromInfo(apiClient: ApiClient, info: PolicyInfo): NamedPolicy {
    switch (info.policy_type) {
      case "Key":
        return new NamedKeyPolicy(apiClient, info as KeyPolicyInfo);
      case "Role":
        return new NamedRolePolicy(apiClient, info as RolePolicyInfo);
      case "Wasm":
        return new NamedWasmPolicy(apiClient, info as WasmPolicyInfo);
    }
  }

  /** @returns The policy id */
  get id(): string {
    return this.data.policy_id;
  }

  /** @returns The policy type */
  get policyType(): PolicyType {
    return this.data.policy_type;
  }

  /**
   * Get a specific version of the policy.
   *
   * @param version The policy version to get.
   * @returns The specific version of the policy.
   */
  async version(version: Version): Promise<NamedPolicyRules> {
    let versionInfo;

    if (version == `v${this.data.version}`) {
      versionInfo = this.data;
    } else {
      versionInfo = await this.apiClient.policyGet(this.id, version);
    }

    return new NamedPolicyRules(this.apiClient, versionInfo);
  }

  /**
   * Get the latest version of the policy.
   *
   * @returns The latest version of the policy.
   */
  async latest(): Promise<NamedPolicyRules> {
    const data = await this.fetch("latest");
    return new NamedPolicyRules(this.apiClient, data);
  }

  /**
   * Fetch and return the current name of the policy.
   *
   * @returns The policy name.
   */
  async name(): Promise<string> {
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
  async setName(name: string, mfaReceipt?: MfaReceipts) {
    await this.update({ name }, mfaReceipt);
  }

  /**
   * Fetch and return the current owner of the policy.
   *
   * @returns The user id of the policy owner.
   * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  async owner(): Promise<string> {
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
  async setOwner(owner: string, mfaReceipt?: MfaReceipts) {
    await this.update({ owner }, mfaReceipt);
  }

  /**
   * Fetch and return the metadata value for the policy.
   *
   * @returns The policy metadata.
   */
  async metadata(): Promise<JsonValue> {
    const data = await this.fetch();
    return data.metadata as JsonValue;
  }

  /**
   * Sets a new metadata value for the contact (overwriting the existing value).
   *
   * @param metadata The new metadata for the contact.
   * @param mfaReceipt Optional MFA receipt(s).
   * @throws if MFA is required and no receipts are provided
   */
  async setMetadata(metadata: JsonValue, mfaReceipt?: MfaReceipts) {
    await this.update({ metadata }, mfaReceipt);
  }

  /**
   * Fetch and return the edit policy for the contact.
   *
   * @returns The edit policy for this named policy.
   */
  async editPolicy(): Promise<EditPolicy | undefined> {
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
  async setEditPolicy(editPolicy: EditPolicy, mfaReceipt?: MfaReceipts) {
    await this.update({ edit_policy: editPolicy }, mfaReceipt);
  }

  /**
   * @returns a list of all keys, roles, and key-in-roles that all versions of this policy
   * are attached to.
   */
  async allAttached(): Promise<PolicyAttachedToId[]> {
    // there is no single-call way to achieve this. So instead, we
    // 1. Get the latest version of the policy
    // 2. For all versions `v0` to `latest`, fetch the policy info
    // 3. Join all policy `attached_to` arrays
    const data = await this.fetch("latest");

    const latest = data.version;
    const versions = Array.from(Array(latest + 1).keys());
    const batchSize = 10;
    let allAttached: PolicyAttachedToId[] = [];

    for (let batch = 0; batch < versions.length; batch += batchSize) {
      const rs = await Promise.all(
        versions.slice(batch, batch + batchSize).map((version) => {
          return this.apiClient.policyGet(this.id, `v${version}`);
        }),
      );
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
  async delete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>> {
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
  protected constructor(apiClient: ApiClient, data: PolicyInfo) {
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
  protected async update(
    request: UpdatePolicyRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<PolicyInfo> {
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
  protected async fetch(version: Version = "latest"): Promise<PolicyInfo> {
    this.data = await this.apiClient.policyGet(this.id, version);
    return this.data;
  }
}

/**
 * A representation of a named key policy.
 */
export class NamedKeyPolicy extends NamedPolicy {
  override data: KeyPolicyInfo;

  /**
   * Update the policy with new rules.
   *
   * @param rules The new rules to update the policy with.
   * @param mfaReceipt Optional MFA receipt(s).
   * @throws if MFA is required and no receipts are provided
   */
  async setRules(rules: KeyPolicy, mfaReceipt?: MfaReceipts) {
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
  constructor(apiClient: ApiClient, data: KeyPolicyInfo) {
    super(apiClient, data);
    this.data = data;
  }
}

/**
 * A representation of a named role policy.
 */
export class NamedRolePolicy extends NamedPolicy {
  override data: RolePolicyInfo;

  /**
   * Update the policy with new rules.
   *
   * @param rules The new rules to update the policy with.
   * @param mfaReceipt Optional MFA receipt(s).
   * @throws if MFA is required and no receipts are provided
   */
  async setRules(rules: RolePolicy, mfaReceipt?: MfaReceipts) {
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
  constructor(apiClient: ApiClient, data: RolePolicyInfo) {
    super(apiClient, data);
    this.data = data;
  }
}

/**
 * A representation of a Wasm policy.
 */
export class NamedWasmPolicy extends NamedPolicy {
  override data: WasmPolicyInfo;

  /**
   * Update the policy with the new Wasm policy.
   *
   * @param policy The new Wasm policy object.
   * @param mfaReceipt Optional MFA receipt(s).
   * @throws if uploading the policy object fails.
   * @throws if MFA is required and no receipts are provided.
   */
  async setWasmPolicy(policy: Uint8Array, mfaReceipt?: MfaReceipts) {
    // upload the policy object
    const hash = await uploadWasmPolicy(this.apiClient, policy);

    // update this policy with the new policy verison.
    const body: UpdatePolicyRequest = { rules: [{ hash }] };
    this.data = (await this.update(body, mfaReceipt)) as WasmPolicyInfo;
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
  async invoke(
    keyId?: string,
    version: Version = "latest",
    request?: JsonValue,
    roleId?: string,
  ): Promise<PolicyInvocation> {
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
  constructor(apiClient: ApiClient, data: WasmPolicyInfo) {
    super(apiClient, data);
    this.data = data;
  }
}

/**
 * A specific version of a named policy.
 */
export class NamedPolicyRules {
  /** The CubeSigner instance that this policy is associated with */
  readonly #apiClient: ApiClient;
  #data: PolicyInfo;

  /**
   * @returns The ID of the policy.
   *
   * @example NamedPolicy#a4a45cc2-0642-4c98-b6bd-0da347d608a4
   */
  get id(): string {
    return this.#data.policy_id;
  }

  /**
   * @returns The version of the policy this object contains.
   */
  get version(): Version {
    return `v${this.#data.version}`;
  }

  /**
   * @returns The policy rules.
   *
   * @example [ "AssertErc20Tx" ]
   */
  get rules(): PolicyRule[] {
    return this.#data.rules as PolicyRule[];
  }

  /**
   * @returns a list of all keys, roles, and key-in-roles this version of the policy
   *          is attached to.
   */
  async allAttached(): Promise<PolicyAttachedToId[]> {
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
  constructor(apiClient: ApiClient, data: PolicyInfo) {
    this.#apiClient = apiClient;
    this.#data = data;
  }

  /**
   * Fetch the policy information.
   *
   * @returns The policy information.
   * @internal
   */
  private async fetch(): Promise<PolicyInfo> {
    this.#data = await this.#apiClient.policyGet(this.id, this.version);
    return this.#data;
  }
}

/**
 * The result of invoking a named wasm policy.
 */
export class PolicyInvocation {
  readonly #data: InvokePolicyResponse;

  /** @returns The policy response itself. */
  get response(): WasmPolicyResponse {
    return this.#data.response;
  }

  /** @returns The standard output stream. Usually a UTF-8 encoded string. */
  get stdout(): Buffer {
    return this.fromHex(this.#data.stdout);
  }

  /** @returns The standard error stream. Usually a UTF-8 encoded string. */
  get stderr(): Buffer {
    return this.fromHex(this.#data.stderr);
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
  private fromHex(hex: string): Buffer {
    return Buffer.from(hex.startsWith("0x") ? hex.slice(2) : hex, "hex");
  }

  /**
   * Constructor.
   *
   * @param data The JSON response from the API server.
   * @internal
   */
  constructor(data: InvokePolicyResponse) {
    this.#data = data;
  }
}
