import createClient from "openapi-fetch";
import { paths } from "./schema";
import {
  SignerSessionData,
  SignerSessionLifetime,
  SignerSessionManager,
} from "./session/signer_session_manager";
import {
  CreateOidcUserOptions,
  IdentityProof,
  KeyInRoleInfo,
  KeyInfoApi,
  ListKeysResponse,
  ListRoleKeysResponse,
  ListRoleUsersResponse,
  ListRolesResponse,
  OidcIdentity,
  SessionsResponse,
  PublicKeyCredential,
  RoleInfo,
  UpdateKeyRequest,
  UpdateOrgRequest,
  UpdateOrgResponse,
  UpdateRoleRequest,
  UserIdInfo,
  UserInRoleInfo,
  UserInfo,
  SessionInfo,
  OrgInfo,
  RatchetConfig,
  OidcAuthResponse,
  EvmSignRequest,
  EvmSignResponse,
  Eth2SignRequest,
  Eth2SignResponse,
  Eth2StakeRequest,
  Eth2StakeResponse,
  Eth2UnstakeRequest,
  Eth2UnstakeResponse,
  BlobSignRequest,
  BlobSignResponse,
  BtcSignResponse,
  BtcSignRequest,
  SolanaSignRequest,
  SolanaSignResponse,
  AvaSignResponse,
  AvaSignRequest,
  AvaTx,
  MfaRequestInfo,
  MemberRole,
} from "./schema_types";
import { assertOk } from "./util";
import { AddFidoChallenge, MfaFidoChallenge, MfaReceipt, TotpChallenge } from "./mfa";
import { CubeSignerResponse, mapResponse } from "./signer_session";
import { Key, KeyType } from "./key";
import { Page, PageOpts, PageQueryArgs, Paginator } from "./paginator";
import { KeyPolicy } from "./role";
import { EnvInterface } from "./env";

/** @internal */
export type Client = ReturnType<typeof createClient<paths>>;

export { paths };

/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerClient {
  readonly #orgId: string;
  readonly #sessionMgr: SignerSessionManager;

  /** Underlying session manager */
  get sessionMgr(): SignerSessionManager {
    return this.#sessionMgr;
  }

  /**
   * Constructor.
   * @param {SignerSessionManager} sessionMgr The session manager to use
   * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
   */
  constructor(sessionMgr: SignerSessionManager, orgId?: string) {
    this.#sessionMgr = sessionMgr;
    this.#orgId = orgId ?? sessionMgr.orgId;
  }

  /**
   * Returns a new instance of this class using the same session manager but targeting a different organization.
   *
   * @param {string} orgId The organization ID.
   * @return {CubeSignerClient} A new instance of this class using the same session manager but targeting different organization.
   */
  withOrg(orgId?: string): CubeSignerClient {
    return orgId ? new CubeSignerClient(this.#sessionMgr, orgId) : this;
  }

  /** Org id */
  get orgId() {
    return this.#orgId;
  }

  // #region USERS: userGet, userResetTotp(Init|Complete), userVerifyTotp, userRegisterFido(Init|Complete)

  /**
   * Obtain information about the current user.
   *
   * @return {Promise<UserInfo>} Retrieves information about the current user.
   */
  async userGet(): Promise<UserInfo> {
    const client = await this.client();
    const resp =
      `${this.orgId}` !== "undefined"
        ? await client.get("/v0/org/{org_id}/user/me", {
            params: { path: { org_id: this.orgId } },
            parseAs: "json",
          })
        : await client.get("/v0/about_me", { parseAs: "json" });
    return assertOk(resp);
  }

  /**
   * Creates a request to change user's TOTP. This request returns a new TOTP challenge
   * that must be answered by calling `userResetTotpComplete`
   *
   * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
   */
  async userResetTotpInit(mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<TotpChallenge>> {
    const resetTotpFn = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v0/org/{org_id}/user/me/totp", {
        headers,
        params: { path: { org_id: this.orgId } },
        body: null,
        parseAs: "json",
      });
      const data = assertOk(resp);
      return mapResponse(data, (totpInfo) => new TotpChallenge(this, totpInfo));
    };
    return await CubeSignerResponse.create(resetTotpFn, mfaReceipt);
  }

  /**
   * Answer the TOTP challenge issued by `userResetTotpInit`. If successful, user's
   * TOTP configuration will be updated to that of the TOTP challenge.
   *
   * @param {string} totpId - The ID of the TOTP challenge
   * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
   */
  async userResetTotpComplete(totpId: string, code: string): Promise<void> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/user/me/totp", {
      parseAs: "json",
      params: { path: { org_id: this.orgId } },
      body: { totp_id: totpId, code },
    });
    assertOk(resp);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   *
   * @param {string} code Current TOTP code
   */
  async userVerifyTotp(code: string) {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/user/me/totp/verify", {
      params: { path: { org_id: this.orgId } },
      body: { code },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Initiate adding a new FIDO device. MFA may be required.  This returns a challenge that must
   * be answered with `userRegisterFidoComplete` (after MFA approvals).
   *
   * @param {string} name The name of the new device.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
   * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
   */
  async userRegisterFidoInit(
    name: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<AddFidoChallenge>> {
    const addFidoFn = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v0/org/{org_id}/user/me/fido", {
        headers,
        params: { path: { org_id: this.orgId } },
        body: { name },
        parseAs: "json",
      });
      const data = assertOk(resp);
      return mapResponse(data, (c) => new AddFidoChallenge(this, c));
    };
    return await CubeSignerResponse.create(addFidoFn, mfaReceipt);
  }

  /**
   * Complete a previously initiated request to add a new FIDO device.
   * @param {string} challengeId The ID of the challenge returned by the remote end.
   * @param {PublicKeyCredential} credential The answer to the challenge.
   */
  async userRegisterFidoComplete(challengeId: string, credential: PublicKeyCredential) {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/user/me/fido", {
      params: { path: { org_id: this.orgId } },
      body: {
        challenge_id: challengeId,
        credential,
      },
      parseAs: "json",
    });
    assertOk(resp);
  }

  // #endregion

  // #region ORGS: orgGet, orgUpdate

  /**
   * Obtain information about the current organization.
   * @return {Org} Information about the organization.
   */
  async orgGet(): Promise<OrgInfo> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}", {
      params: { path: { org_id: this.orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Update the org.
   * @param {UpdateOrgRequest} request The JSON request to send to the API server.
   * @return {UpdateOrgResponse} Updated org information.
   */
  async orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}", {
      params: { path: { org_id: this.orgId } },
      body: request,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  // #endregion

  // #region ORG USERS: orgUserInvite, orgUsersList, orgUserCreateOidc, orgUserDeleteOidc

  /**
   * Create a new (first-party) user in the organization and send an email invitation to that user.
   *
   * @param {string} email Email of the user
   * @param {string} name The full name of the user
   * @param {MemberRole} role Optional role. Defaults to "alien.
   */
  async orgUserInvite(email: string, name: string, role?: MemberRole): Promise<void> {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/invite", {
      params: { path: { org_id: this.orgId } },
      body: {
        email,
        name,
        role,
        skip_email: false,
      },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * List users.
   * @return {User[]} Org users.
   */
  async orgUsersList(): Promise<UserIdInfo[]> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.orgId } },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.users;
  }

  /**
   * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
   * @param {OidcIdentity} identity The identity of the OIDC user
   * @param {string} email Email of the OIDC user
   * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
   * @return {string} User id of the new user
   */
  async orgUserCreateOidc(
    identity: OidcIdentity,
    email: string,
    opts: CreateOidcUserOptions = {},
  ): Promise<string> {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.orgId } },
      body: {
        identity,
        role: opts.memberRole ?? "Alien",
        email: email,
        mfa_policy: opts.mfaPolicy ?? null,
      },
      parseAs: "json",
    });
    return assertOk(resp).user_id;
  }

  /**
   * Delete an existing OIDC user.
   * @param {OidcIdentity} identity The identity of the OIDC user
   */
  async orgUserDeleteOidc(identity: OidcIdentity) {
    const client = await this.client();
    const resp = await client.del("/v0/org/{org_id}/users/oidc", {
      params: { path: { org_id: this.orgId } },
      body: identity,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  // #endregion

  // #region KEYS: keyGet, keyUpdate, keyDelete, keysCreate, keysDerive, keysList

  /**
   * Get a key by its id.
   *
   * @param {string} keyId The id of the key to get.
   * @return {KeyInfoApi} The key information.
   */
  async keyGet(keyId: string): Promise<KeyInfoApi> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Update key.
   * @param {string} keyId The ID of the key to update.
   * @param {UpdateKeyRequest} request The JSON request to send to the API server.
   * @return {KeyInfoApi} The JSON response from the API server.
   */
  async keyUpdate(keyId: string, request: UpdateKeyRequest): Promise<KeyInfoApi> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
      body: request,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Deletes a key.
   *
   * @param {string} keyId - Key id
   */
  async keyDelete(keyId: string) {
    const client = await this.client();
    const resp = await client.del("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Create new signing keys.
   *
   * @param {KeyType} keyType The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @return {KeyInfoApi[]} The new keys.
   */
  async keysCreate(keyType: KeyType, count: number, ownerId?: string): Promise<KeyInfoApi[]> {
    const chain_id = 0; // not used anymore
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/keys", {
      params: { path: { org_id: this.orgId } },
      body: {
        count,
        chain_id,
        key_type: keyType,
        owner: ownerId || null,
      },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return data.keys;
  }

  /**
   * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
   *
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param {KeyType} keyType The type of key to create.
   * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
   * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
   *
   * @return {KeyInfoApi[]} The newly derived keys.
   */
  async keysDerive(
    keyType: KeyType,
    derivationPaths: string[],
    mnemonicId: string,
  ): Promise<KeyInfoApi[]> {
    const client = await this.client();
    const resp = await client.put("/v0/org/{org_id}/derive_key", {
      params: { path: { org_id: this.orgId } },
      body: {
        derivation_path: derivationPaths,
        mnemonic_id: mnemonicId,
        key_type: keyType,
      },
      parseAs: "json",
    });
    return assertOk(resp).keys;
  }

  /**
   * List all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListKeysResponse, KeyInfoApi>} Paginator for iterating over keys.
   */
  keysList(type?: KeyType, page?: PageOpts): Paginator<ListKeysResponse, KeyInfoApi> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client();
      const resp = await client.get("/v0/org/{org_id}/keys", {
        params: {
          path: { org_id: this.orgId },
          query: {
            key_type: type,
            ...query,
          },
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.keys,
      (r) => r.last_evaluated_key,
    );
  }
  // #endregion

  // #region ROLES: roleCreate, roleRead, roleUpdate, roleDelete, rolesList

  /**
   * Create a new role.
   *
   * @param {string?} name The optional name of the role.
   * @return {string} The ID of the new role.
   */
  async roleCreate(name?: string): Promise<string> {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/roles", {
      params: { path: { org_id: this.orgId } },
      body: name ? { name } : undefined,
      parseAs: "json",
    });
    return assertOk(resp).role_id;
  }

  /**
   * Get a role by its id (or name).
   * @param {string} roleId The id of the role to get.
   * @return {RoleInfo} The role.
   */
  async roleGet(roleId: string): Promise<RoleInfo> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Update a role.
   *
   * @param {string} roleId The ID of the role to update.
   * @param {UpdateRoleRequest} request The update request.
   * @return {Promise<RoleInfo>} The updated role information.
   */
  async roleUpdate(roleId: string, request: UpdateRoleRequest): Promise<RoleInfo> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      body: request,
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Delete a role by its ID.
   *
   * @param {string} roleId The ID of the role to delete.
   */
  async roleDelete(roleId: string): Promise<void> {
    const client = await this.client();
    const resp = await client.del("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * List all roles in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {RoleInfo} Paginator for iterating over roles.
   */
  rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client();
      const resp = await client.get("/v0/org/{org_id}/roles", {
        params: {
          path: { org_id: this.orgId },
          query,
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.roles,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region ROLE KEYS: roleKeysAdd, roleKeysDelete, roleKeysList

  /**
   * Add existing keys to an existing role.
   *
   * @param {string} roleId The ID of the role
   * @param {string[]} keyIds The IDs of the keys to add to the role.
   * @param {KeyPolicy?} policy The optional policy to apply to each key.
   */
  async roleKeysAdd(roleId: string, keyIds: string[], policy?: KeyPolicy) {
    const client = await this.client();
    const resp = await client.put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
      params: { path: { org_id: this.#orgId, role_id: roleId } },
      body: {
        key_ids: keyIds,
        policy: (policy ?? null) as Record<string, never>[] | null,
      },
      parseAs: "json",
    });
    assertOk(resp, "Failed to add keys to role");
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param {string} roleId The ID of the role
   * @param {string} keyId The ID of the key to remove from the role
   */
  async roleKeysRemove(roleId: string, keyId: string) {
    const client = await this.client();
    const resp = await client.del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
      params: { path: { org_id: this.#orgId, role_id: roleId, key_id: keyId } },
      parseAs: "json",
    });
    assertOk(resp, "Failed to remove key from a role");
  }

  /**
   * List all keys in a role.
   *
   * @param {string} roleId The ID of the role whose keys to retrieve.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListRoleKeysResponse, KeyInRoleInfo>} Paginator for iterating over the keys in the role.
   */
  roleKeysList(roleId: string, page?: PageOpts): Paginator<ListRoleKeysResponse, KeyInRoleInfo> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client();
      const resp = await client.get("/v0/org/{org_id}/roles/{role_id}/keys", {
        params: {
          path: { org_id: this.orgId, role_id: roleId },
          query,
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.keys,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region ROLE USERS: roleUserAdd, roleUsersList

  /**
   * Add an existing user to an existing role.
   *
   * @param {string} roleId The ID of the role.
   * @param {string} userId The ID of the user to add to the role.
   */
  async roleUserAdd(roleId: string, userId: string) {
    const client = await this.client();
    const resp = await client.put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
      params: { path: { org_id: this.#orgId, role_id: roleId, user_id: userId } },
      parseAs: "json",
    });
    assertOk(resp, "Failed to add user to role");
  }

  /**
   * List all users in a role.
   *
   * @param {string} roleId The ID of the role whose users to retrieve.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
   */
  roleUsersList(roleId: string, page?: PageOpts): Paginator<ListRoleUsersResponse, UserInRoleInfo> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client();
      const resp = await client.get("/v0/org/{org_id}/roles/{role_id}/users", {
        params: {
          path: { org_id: this.orgId, role_id: roleId },
          query,
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.users,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region SESSIONS: sessionCreateForRole, sessionRefresh, sessionRevoke, sessionsList, sessionKeysList

  /**
   * Create a new signer session for a given role.
   *
   * @param {string} roleId Role ID
   * @param {string} purpose The purpose of the session
   * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
   * @param {SignerSessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SignerSessionData>} New signer session info.
   */
  async sessionCreateForRole(
    roleId: string,
    purpose: string,
    scopes?: string[],
    lifetimes?: SignerSessionLifetime,
  ): Promise<SignerSessionData> {
    lifetimes ??= defaultSignerSessionLifetime;
    const invalidScopes = (scopes || []).filter((s) => !s.startsWith("sign:"));
    if (invalidScopes.length > 0) {
      throw new Error(`Role scopes must start with 'sign:'; invalid scopes: ${invalidScopes}`);
    }

    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/roles/{role_id}/tokens", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      body: {
        purpose,
        scopes,
        auth_lifetime: lifetimes.auth,
        refresh_lifetime: lifetimes.refresh,
        session_lifetime: lifetimes.session,
        grace_lifetime: lifetimes.grace,
      },
      parseAs: "json",
    });
    const data = assertOk(resp);
    return {
      org_id: this.orgId,
      role_id: roleId,
      purpose,
      token: data.token,
      session_info: data.session_info,
      // Keep compatibility with tokens produced by CLI
      env: {
        ["Dev-CubeSignerStack"]: this.#sessionMgr.env,
      },
    };
  }

  /**
   * Revoke a session.
   *
   * @param {string} sessionId The ID of the session to revoke.
   */
  async sessionRevoke(sessionId: string) {
    const client = await this.client();
    const resp = await client.del("/v0/org/{org_id}/session/{session_id}", {
      params: { path: { org_id: this.orgId, session_id: sessionId } },
      parseAs: "json",
    });
    assertOk(resp);
  }

  /**
   * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
   *
   * @param {string?} roleId If set, limit to sessions for this role only.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
   */
  sessionsList(roleId?: string, page?: PageOpts): Paginator<SessionsResponse, SessionInfo> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client();
      const resp = await client.get("/v0/org/{org_id}/session", {
        params: {
          path: { org_id: this.#orgId },
          query: { role: roleId, ...query },
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.sessions,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Returns the list of keys that this session has access to.
   * @return {Key[]} The list of keys.
   */
  async sessionKeysList(): Promise<KeyInfoApi[]> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/token/keys", {
      params: { path: { org_id: this.orgId } },
      parseAs: "json",
    });
    return assertOk(resp).keys;
  }

  // #endregion

  // #region IDENTITY: identityProve, identityVerify

  /**
   * Obtain proof of authentication using the current CubeSigner session.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/identity/prove", {
      params: { path: { org_id: this.orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param {IdentityProof} proof The proof of authentication.
   */
  async identityVerify(proof: IdentityProof) {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/identity/verify", {
      params: { path: { org_id: this.orgId } },
      body: proof,
      parseAs: "json",
    });
    assertOk(resp);
  }

  // #endregion

  // #region MFA: mfaGet, mfaList, mfaApprove, mfaList, mfaApprove, mfaApproveTotp, mfaApproveFido(Init|Complete)

  /**
   * Retrieves existing MFA request.
   *
   * @param {string} mfaId MFA request ID
   * @return {Promise<MfaRequestInfo>} MFA request information
   */
  async mfaGet(mfaId: string): Promise<MfaRequestInfo> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * @return {Promise<MfaRequestInfo[]>} The MFA requests.
   */
  async mfaList(): Promise<MfaRequestInfo[]> {
    const client = await this.client();
    const resp = await client.get("/v0/org/{org_id}/mfa", {
      params: { path: { org_id: this.orgId } },
    });
    return assertOk(resp).mfa_requests;
  }

  /**
   * Approve a pending MFA request using the current session.
   *
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaApprove(mfaId: string): Promise<MfaRequestInfo> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
    });
    return assertOk(resp);
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * @param {string} mfaId The MFA request to approve
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request
   */
  async mfaApproveTotp(mfaId: string, code: string): Promise<MfaRequestInfo> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId } },
      body: { code },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  /**
   * Initiate approval of an existing MFA request using FIDO.
   *
   * @param {string} mfaId The MFA request ID.
   * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
   */
  async mfaApproveFidoInit(mfaId: string): Promise<MfaFidoChallenge> {
    const client = await this.client();
    const resp = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
      parseAs: "json",
    });
    const challenge = assertOk(resp);
    return new MfaFidoChallenge(this, mfaId, challenge);
  }

  /**
   * Complete a previously initiated MFA request approval using FIDO.
   *
   * @param {string} mfaId The MFA request ID
   * @param {string} challengeId The challenge ID
   * @param {PublicKeyCredential} credential The answer to the challenge
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
   */
  async mfaApproveFidoComplete(
    mfaId: string,
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<MfaRequestInfo> {
    const client = await this.client();
    const resp = await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
      body: {
        challenge_id: challengeId,
        credential,
      },
      parseAs: "json",
    });
    return assertOk(resp);
  }

  // #endregion

  // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signBlob, signBtc, signSolana

  /**
   * Sign an EVM transaction.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {EvmSignRequest} req What to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
   * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
   */
  async signEvm(
    key: Key | string,
    req: EvmSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<EvmSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an Eth2/Beacon-chain validation message.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2SignRequest} req What to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
   */
  async signEth2(
    key: Key | string,
    req: Eth2SignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Eth2SignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an Eth2/Beacon-chain deposit (or staking) message.
   *
   * @param {Eth2StakeRequest} req The request to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
   */
  async signStake(
    req: Eth2StakeRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Eth2StakeResponse>> {
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v1/org/{org_id}/eth2/stake", {
        params: { path: { org_id: this.orgId } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an Eth2/Beacon-chain unstake/exit request.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {Eth2UnstakeRequest} req The request to sign.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
   */
  async signUnstake(
    key: Key | string,
    req: Eth2UnstakeRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Eth2UnstakeResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign an Avalanche P- or X-chain message.
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {AvaTx} tx Avalanche message (transaction) to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
   */
  async signAva(
    key: Key | string,
    tx: AvaTx,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<AvaSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const req = <AvaSignRequest>{
        tx: tx as unknown,
      };
      const client = await this.client();
      const resp = await client.post("/v0/org/{org_id}/ava/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a raw blob.
   *
   * This requires the key to have a '"AllowRawBlobSigning"' policy. This is because
   * signing arbitrary messages is, in general, dangerous (and you should instead
   * prefer typed end-points as used by, for example, `signEvm`). For Secp256k1 keys,
   * for example, you **must** call this function with a message that is 32 bytes long and
   * the output of a secure hash function.
   *
   * This function returns signatures serialized as;
   *
   * - ECDSA signatures are serialized as big-endian r and s plus recovery-id
   *    byte v, which can in general take any of the values 0, 1, 2, or 3.
   *
   * - EdDSA signatures are serialized in the standard format.
   *
   * - BLS signatures are not supported on the blob-sign endpoint.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its ID).
   * @param {BlobSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
   */
  async signBlob(
    key: Key | string,
    req: BlobSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<BlobSignResponse>> {
    const key_id = typeof key === "string" ? (key as string) : key.id;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v1/org/{org_id}/blob/sign/{key_id}", {
        params: {
          path: { org_id: this.orgId, key_id },
        },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a Bitcoin message.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BtcSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
   */
  async signBtc(
    key: Key | string,
    req: BtcSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<BtcSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v0/org/{org_id}/btc/sign/{pubkey}", {
        params: {
          path: { org_id: this.orgId, pubkey },
        },
        body: req,
        headers: headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }

  /**
   * Sign a Solana message.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {SolanaSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
   */
  async signSolana(
    key: Key | string,
    req: SolanaSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<SolanaSignResponse>> {
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const sign = async (headers?: HeadersInit) => {
      const client = await this.client();
      const resp = await client.post("/v0/org/{org_id}/solana/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
        parseAs: "json",
      });
      return assertOk(resp);
    };
    return await CubeSignerResponse.create(sign, mfaReceipt);
  }
  // #endregion

  /** HTTPS client */
  private async client(): Promise<Client> {
    return await this.#sessionMgr.client();
  }
}

/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
export class OidcClient {
  readonly #orgId: string;
  readonly #client: Client;

  /**
   * @param {EnvInterface} env CubeSigner deployment
   * @param {string} orgId Target organization ID
   * @param {string} oidcToken User's OIDC token
   */
  constructor(env: EnvInterface, orgId: string, oidcToken: string) {
    this.#orgId = orgId;
    this.#client = createClient<paths>({
      baseUrl: env.SignerApiRoot,
      headers: {
        Authorization: oidcToken,
      },
    });
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {List<string>} scopes The scopes for the new session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @return {Promise<CubeSignerResponse<OidcAuthResponse>>} The session data.
   */
  async sessionCreate(
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<OidcAuthResponse>> {
    const loginFn = async (headers?: HeadersInit) => {
      const resp = await this.#client.post("/v0/org/{org_id}/oidc", {
        params: { path: { org_id: this.#orgId } },
        headers,
        body: {
          scopes,
          tokens: lifetimes,
        },
        parseAs: "json",
      });
      return assertOk(resp);
    };

    return await CubeSignerResponse.create(loginFn, mfaReceipt);
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const resp = await this.#client.post("/v0/org/{org_id}/identity/prove/oidc", {
      params: { path: { org_id: this.#orgId } },
      parseAs: "json",
    });
    return assertOk(resp);
  }
}

const defaultSignerSessionLifetime: SignerSessionLifetime = {
  session: 604800, // 1 week
  auth: 300, // 5 min
  refresh: 86400, // 1 day
  grace: 30, // seconds
};
