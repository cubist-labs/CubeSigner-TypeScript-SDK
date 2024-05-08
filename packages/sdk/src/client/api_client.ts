import type {
  CreateOidcUserOptions,
  IdentityProof,
  KeyInRoleInfo,
  KeyInfo,
  OidcIdentity,
  PublicKeyCredential,
  RoleInfo,
  UpdateKeyRequest,
  UpdateOrgRequest,
  UpdateOrgResponse,
  UpdateRoleRequest,
  UserInOrgInfo,
  UserInRoleInfo,
  UserInfo,
  SessionInfo,
  OrgInfo,
  Eip191SignRequest,
  Eip712SignRequest,
  Eip191Or712SignResponse,
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
  AvaSerializedTxSignRequest,
  AvaTx,
  MfaRequestInfo,
  MfaVote,
  MemberRole,
  UserExportCompleteResponse,
  UserExportInitResponse,
  UserExportListResponse,
  KeyProperties,
  Empty,
  UserOrgsResponse,
} from "../schema_types";
import { encodeToBase64 } from "../util";
import type { MfaReceipt } from "../mfa";
import { AddFidoChallenge, MfaFidoChallenge, TotpChallenge } from "../mfa";
import { CubeSignerResponse, mapResponse } from "../response";
import type { Key, KeyType } from "../key";
import type { PageOpts } from "../paginator";
import { Page, Paginator } from "../paginator";
import type { KeyPolicy } from "../role";
import { loadSubtleCrypto } from "../user_export";
import type {
  AddIdentityRequest,
  AvaChain,
  EnvInterface,
  EotsCreateNonceRequest,
  EotsCreateNonceResponse,
  EotsSignRequest,
  EotsSignResponse,
  ListIdentityResponse,
  ListKeyRolesResponse,
  ListKeysResponse,
  ListRoleKeysResponse,
  ListRoleUsersResponse,
  ListRolesResponse,
  RatchetConfig,
  SessionData,
  SessionLifetime,
  SessionsResponse,
  TaprootSignRequest,
  TaprootSignResponse,
  UpdateUserMembershipRequest,
} from "../index";
import { assertOk, op } from "../fetch";
import { BaseClient, signerSessionFromSessionInfo } from "./base_client";
import { retryOn5XX } from "../retry";

/**
 * String returned by API when a user does not have an email address (for backwards compatibility)
 */
const EMAIL_NOT_FOUND = "email not found";

/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
export class ApiClient extends BaseClient {
  // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)

  /**
   * Obtain information about the current user.
   *
   * @return {Promise<UserInfo>} Retrieves information about the current user.
   */
  async userGet(): Promise<UserInfo> {
    const o = op("/v0/org/{org_id}/user/me", "get");

    return this.exec(o, {}).then(ApiClient.#processUserInfo);
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered either by calling {@link TotpChallenge.answer} (or
   * {@link ApiClient.userTotpResetComplete}).
   *
   * @param {string} issuer Optional issuer; defaults to "Cubist"
   * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
   */
  async userTotpResetInit(
    issuer?: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<TotpChallenge>> {
    const o = op("/v0/org/{org_id}/user/me/totp", "post");
    const resetTotpFn = async (headers?: HeadersInit) => {
      const data = await this.exec(o, {
        headers,
        body: issuer
          ? {
              issuer,
            }
          : null,
      });
      return mapResponse(data, (totpInfo) => new TotpChallenge(this, totpInfo));
    };
    return await CubeSignerResponse.create(this.env, resetTotpFn, mfaReceipt);
  }

  /**
   * Answer the TOTP challenge issued by {@link userTotpResetInit}. If successful, user's
   * TOTP configuration will be updated to that of the TOTP challenge.
   *
   * Instead of calling this method directly, prefer {@link TotpChallenge.answer}.
   *
   * @param {string} totpId - The ID of the TOTP challenge
   * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
   */
  async userTotpResetComplete(totpId: string, code: string): Promise<void> {
    const o = op("/v0/org/{org_id}/user/me/totp", "patch");
    await this.exec(o, {
      body: { totp_id: totpId, code },
    });
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   *
   * @param {string} code Current TOTP code
   */
  async userTotpVerify(code: string) {
    const o = op("/v0/org/{org_id}/user/me/totp/verify", "post");

    await this.exec(o, {
      body: { code },
    });
  }

  /**
   * Delete TOTP from the user's account.
   * Allowed only if at least one FIDO key is registered with the user's account.
   * MFA via FIDO is always required.
   *
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
   */
  async userTotpDelete(mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/user/me/totp", "delete");
    const deleteTotpFn = async (headers?: HeadersInit) => {
      return await this.exec(o, {
        headers,
      });
    };
    return await CubeSignerResponse.create(this.env, deleteTotpFn, mfaReceipt);
  }

  /**
   * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
   * that must be answered with {@link AddFidoChallenge.answer} or {@link userFidoRegisterComplete}
   * (after MFA approvals).
   *
   * @param {string} name The name of the new device.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
   * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
   */
  async userFidoRegisterInit(
    name: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<AddFidoChallenge>> {
    const o = op("/v0/org/{org_id}/user/me/fido", "post");
    const addFidoFn = async (headers?: HeadersInit) => {
      const data = await this.exec(o, {
        headers,
        body: { name },
      });
      return mapResponse(data, (c) => new AddFidoChallenge(this, c));
    };
    return await CubeSignerResponse.create(this.env, addFidoFn, mfaReceipt);
  }

  /**
   * Complete a previously initiated (via {@link userFidoRegisterInit}) request to add a new FIDO device.
   *
   * Instead of calling this method directly, prefer {@link AddFidoChallenge.answer} or
   * {@link AddFidoChallenge.createCredentialAndAnswer}.
   *
   * @param {string} challengeId The ID of the challenge returned by the remote end.
   * @param {PublicKeyCredential} credential The answer to the challenge.
   */
  async userFidoRegisterComplete(challengeId: string, credential: PublicKeyCredential) {
    const o = op("/v0/org/{org_id}/user/me/fido", "patch");

    return this.exec(o, {
      body: {
        challenge_id: challengeId,
        credential,
      },
    });
  }

  /**
   * Delete a FIDO key from the user's account.
   * Allowed only if TOTP is also defined.
   * MFA via TOTP is always required.
   *
   * @param {string} fidoId The ID of the desired FIDO key
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
   */
  async userFidoDelete(
    fidoId: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Empty>> {
    const deleteFidoFn = (headers?: HeadersInit) => {
      const o = op("/v0/org/{org_id}/user/me/fido/{fido_id}", "delete");

      return this.exec(o, {
        headers,
        params: { path: { fido_id: fidoId } },
      });
    };
    return await CubeSignerResponse.create(this.env, deleteFidoFn, mfaReceipt);
  }

  // #endregion

  // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership

  /**
   * Obtain information about an org
   *
   * @param {string | undefined} orgId The org to get info for
   * @return {OrgInfo} Information about the organization.
   */
  async orgGet(orgId?: string): Promise<OrgInfo> {
    const o = op("/v0/org/{org_id}", "get");
    return this.exec(o, {
      params: {
        path: { org_id: orgId ?? this.sessionMeta.org_id },
      },
    });
  }

  /**
   * Update the org.
   * @param {UpdateOrgRequest} request The JSON request to send to the API server.
   * @return {UpdateOrgResponse} Updated org information.
   */
  async orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const o = op("/v0/org/{org_id}", "patch");

    return this.exec(o, { body: request });
  }

  /**
   * Update user's membership in this org.
   * @param {string} userId The ID of the user whose membership to update.
   * @param {UpdateUserMembershipRequest} req The update request
   * @return {Promise<UserInOrgInfo>} Updated user membership
   */
  async orgUpdateUserMembership(
    userId: string,
    req: UpdateUserMembershipRequest,
  ): Promise<UserInOrgInfo> {
    const o = op("/v0/org/{org_id}/users/{user_id}/membership", "patch");
    return this.exec(o, {
      params: { path: { user_id: userId } },
      body: req,
    }).then(ApiClient.#processUserInOrgInfo);
  }

  // #endregion

  // #region ORG USERS: orgUserInvite, orgUserDelete, orgUsersList, orgUserCreateOidc, orgUserDeleteOidc

  /**
   * Create a new (first-party) user in the organization and send an email invitation to that user.
   *
   * @param {string} email Email of the user
   * @param {string} name The full name of the user
   * @param {MemberRole} role Optional role. Defaults to "alien".
   * @param {boolean} skipEmail Optionally skip sending the invite email.
   */
  async orgUserInvite(
    email: string,
    name: string,
    role?: MemberRole,
    skipEmail?: boolean,
  ): Promise<void> {
    const o = op("/v0/org/{org_id}/invite", "post");

    await this.exec(o, {
      body: {
        email,
        name,
        role,
        skip_email: !!skipEmail,
      },
    });
  }

  /**
   * Remove the user from the org.
   * @param {string} userId The ID of the user to remove.
   * @param {string} orgId The ID of the organization to remove the user from.
   */
  async orgUserDelete(userId: string): Promise<Empty> {
    const o = op("/v0/org/{org_id}/users/{user_id}", "delete");

    return this.exec(o, {
      params: {
        path: {
          user_id: userId,
        },
      },
    });
  }

  /**
   * List users.
   * @return {User[]} Org users.
   */
  async orgUsersList(): Promise<UserInOrgInfo[]> {
    const o = op("/v0/org/{org_id}/users", "get");

    const resp = await this.exec(o, {});
    return resp.users.map(ApiClient.#processUserInOrgInfo);
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
    email?: string | null,
    opts: CreateOidcUserOptions = {},
  ): Promise<string> {
    const o = op("/v0/org/{org_id}/users", "post");

    const { user_id } = await this.exec(o, {
      body: {
        identity,
        role: opts.memberRole ?? "Alien",
        email,
        name: opts.name,
        mfa_policy: opts.mfaPolicy,
      },
    });

    return user_id;
  }

  /**
   * Delete an existing OIDC user.
   * @param {OidcIdentity} identity The identity of the OIDC user
   */
  async orgUserDeleteOidc(identity: OidcIdentity) {
    const o = op("/v0/org/{org_id}/users/oidc", "delete");

    return this.exec(o, {
      body: identity,
    });
  }

  // #endregion

  // #region KEYS: keyGet, keyUpdate, keyDelete, keysCreate, keysDerive, keysList

  /**
   * Get a key by its id.
   *
   * @param {string} keyId The id of the key to get.
   * @return {KeyInfo} The key information.
   */
  async keyGet(keyId: string): Promise<KeyInfo> {
    const o = op("/v0/org/{org_id}/keys/{key_id}", "get");

    return this.exec(o, {
      params: { path: { key_id: keyId } },
    });
  }

  /**
   * List all roles a key is in.
   *
   * @param {string} keyId The id of the key to get.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListKeyRolesResponse, KeyInRoleInfo>} Paginator for iterating over the roles a key is in.
   */
  keyRolesList(keyId: string, page?: PageOpts): Paginator<ListKeyRolesResponse, KeyInRoleInfo> {
    const o = op("/v0/org/{org_id}/keys/{key_id}/roles", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) =>
        this.exec(o, {
          params: {
            path: { key_id: keyId },
            ...query,
          },
        }),
      (r) => r.roles,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Update key.
   * @param {string} keyId The ID of the key to update.
   * @param {UpdateKeyRequest} request The JSON request to send to the API server.
   * @return {KeyInfo} The JSON response from the API server.
   */
  async keyUpdate(keyId: string, request: UpdateKeyRequest): Promise<KeyInfo> {
    const o = op("/v0/org/{org_id}/keys/{key_id}", "patch");

    return this.exec(o, {
      params: { path: { key_id: keyId } },
      body: request,
    });
  }

  /**
   * Deletes a key.
   *
   * @param {string} keyId - Key id
   */
  async keyDelete(keyId: string) {
    const o = op("/v0/org/{org_id}/keys/{key_id}", "delete");
    await this.exec(o, {
      params: { path: { key_id: keyId } },
    });
  }

  /**
   * Create new signing keys.
   *
   * @param {KeyType} keyType The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @param {KeyProperties?} props Additional key properties
   * @return {KeyInfo[]} The new keys.
   */
  async keysCreate(
    keyType: KeyType,
    count: number,
    ownerId?: string,
    props?: KeyProperties,
  ): Promise<KeyInfo[]> {
    const chain_id = 0; // not used anymore

    const o = op("/v0/org/{org_id}/keys", "post");

    const { keys } = await this.exec(o, {
      body: {
        count,
        chain_id,
        key_type: keyType,
        ...props,
        owner: props?.owner ?? ownerId,
      },
    });
    return keys;
  }

  /**
   * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
   *
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param {KeyType} keyType The type of key to create.
   * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
   * @param {string} mnemonicId material_id of mnemonic key used to derive the new key.
   *
   * @return {KeyInfo[]} The newly derived keys.
   */
  async keysDerive(
    keyType: KeyType,
    derivationPaths: string[],
    mnemonicId: string,
  ): Promise<KeyInfo[]> {
    const o = op("/v0/org/{org_id}/derive_key", "put");

    const { keys } = await this.exec(o, {
      body: {
        derivation_path: derivationPaths,
        mnemonic_id: mnemonicId,
        key_type: keyType,
      },
    });

    return keys;
  }

  /**
   * List all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @param {string?} owner Optional key owner to filter list for.
   * @return {Paginator<ListKeysResponse, KeyInfo>} Paginator for iterating over keys.
   */
  keysList(type?: KeyType, page?: PageOpts, owner?: string): Paginator<ListKeysResponse, KeyInfo> {
    const o = op("/v0/org/{org_id}/keys", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) =>
        this.exec(o, { params: { query: { key_type: type, key_owner: owner, ...query } } }),
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
    const o = op("/v0/org/{org_id}/roles", "post");

    const data = await this.exec(o, {
      body: name ? { name } : undefined,
    });

    return data.role_id;
  }

  /**
   * Get a role by its id (or name).
   * @param {string} roleId The id of the role to get.
   * @return {RoleInfo} The role.
   */
  async roleGet(roleId: string): Promise<RoleInfo> {
    const o = op("/v0/org/{org_id}/roles/{role_id}", "get");

    return this.exec(o, {
      params: { path: { role_id: roleId } },
    });
  }

  /**
   * Update a role.
   *
   * @param {string} roleId The ID of the role to update.
   * @param {UpdateRoleRequest} request The update request.
   * @return {Promise<RoleInfo>} The updated role information.
   */
  async roleUpdate(roleId: string, request: UpdateRoleRequest): Promise<RoleInfo> {
    const o = op("/v0/org/{org_id}/roles/{role_id}", "patch");
    return this.exec(o, {
      params: { path: { role_id: roleId } },
      body: request,
    });
  }

  /**
   * Delete a role by its ID.
   *
   * @param {string} roleId The ID of the role to delete.
   */
  async roleDelete(roleId: string): Promise<void> {
    const o = op("/v0/org/{org_id}/roles/{role_id}", "delete");

    await this.exec(o, {
      params: { path: { role_id: roleId } },
    });
  }

  /**
   * List all roles in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {RoleInfo} Paginator for iterating over roles.
   */
  rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo> {
    const o = op("/v0/org/{org_id}/roles", "get");
    return new Paginator(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query } }),
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
    const o = op("/v0/org/{org_id}/roles/{role_id}/add_keys", "put");

    await this.exec(o, {
      params: { path: { role_id: roleId } },
      body: {
        key_ids: keyIds,
        policy: (policy ?? null) as Record<string, never>[] | null,
      },
    });
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param {string} roleId The ID of the role
   * @param {string} keyId The ID of the key to remove from the role
   */
  async roleKeysRemove(roleId: string, keyId: string) {
    const o = op("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "delete");

    await this.exec(o, {
      params: { path: { role_id: roleId, key_id: keyId } },
    });
  }

  /**
   * List all keys in a role.
   *
   * @param {string} roleId The ID of the role whose keys to retrieve.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListRoleKeysResponse, KeyInRoleInfo>} Paginator for iterating over the keys in the role.
   */
  roleKeysList(roleId: string, page?: PageOpts): Paginator<ListRoleKeysResponse, KeyInRoleInfo> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/keys", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) =>
        this.exec(o, {
          params: {
            path: { role_id: roleId },
            query,
          },
        }),
      (r) => r.keys,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region ROLE USERS: roleUserAdd, roleUserRemove, roleUsersList

  /**
   * Add an existing user to an existing role.
   *
   * @param {string} roleId The ID of the role.
   * @param {string} userId The ID of the user to add to the role.
   */
  async roleUserAdd(roleId: string, userId: string) {
    const o = op("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", "put");

    await this.exec(o, {
      params: { path: { role_id: roleId, user_id: userId } },
    });
  }

  /**
   * Remove an existing user from an existing role.
   *
   * @param {string} roleId The ID of the role.
   * @param {string} userId The ID of the user to remove from the role.
   */
  async roleUserRemove(roleId: string, userId: string) {
    const o = op("/v0/org/{org_id}/roles/{role_id}/users/{user_id}", "delete");

    await this.exec(o, {
      params: { path: { role_id: roleId, user_id: userId } },
    });
  }

  /**
   * List all users in a role.
   *
   * @param {string} roleId The ID of the role whose users to retrieve.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
   */
  roleUsersList(roleId: string, page?: PageOpts): Paginator<ListRoleUsersResponse, UserInRoleInfo> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/users", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query, path: { role_id: roleId } } }),
      (r) => r.users,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region SESSIONS: session(Create|CreateForRole|Refresh|Revoke|List|KeysList)

  /**
   * Create new user session (management and/or signing)
   *
   * @param {string} purpose The purpose of the session
   * @param {string[]} scopes Session scopes.
   * @param {SessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SessionData>} New signer session info.
   */
  async sessionCreate(
    purpose: string,
    scopes: string[],
    lifetimes?: SessionLifetime,
  ): Promise<SessionData> {
    lifetimes ??= defaultSignerSessionLifetime;
    const o = op("/v0/org/{org_id}/session", "post");

    const data = await this.exec(o, {
      body: {
        purpose,
        scopes,
        auth_lifetime: lifetimes.auth,
        refresh_lifetime: lifetimes.refresh,
        session_lifetime: lifetimes.session,
        grace_lifetime: lifetimes.grace,
      },
    });
    return signerSessionFromSessionInfo(this.sessionMeta, data, {
      purpose,
    });
  }

  /**
   * Create a new signer session for a given role.
   *
   * @param {string} roleId Role ID
   * @param {string} purpose The purpose of the session
   * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
   * @param {SessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SessionData>} New signer session info.
   */
  async sessionCreateForRole(
    roleId: string,
    purpose: string,
    scopes?: string[],
    lifetimes?: SessionLifetime,
  ): Promise<SessionData> {
    lifetimes ??= defaultSignerSessionLifetime;
    const invalidScopes = (scopes || []).filter((s) => !s.startsWith("sign:"));
    if (invalidScopes.length > 0) {
      throw new Error(`Role scopes must start with 'sign:'; invalid scopes: ${invalidScopes}`);
    }

    const o = op("/v0/org/{org_id}/roles/{role_id}/tokens", "post");
    const data = await this.exec(o, {
      params: { path: { role_id: roleId } },
      body: {
        purpose,
        scopes,
        auth_lifetime: lifetimes.auth,
        refresh_lifetime: lifetimes.refresh,
        session_lifetime: lifetimes.session,
        grace_lifetime: lifetimes.grace,
      },
    });

    return signerSessionFromSessionInfo(this.sessionMeta, data, {
      role_id: roleId,
      purpose,
    });
  }

  /**
   * Revoke a session.
   *
   * @param {string} [sessionId] The ID of the session to revoke. This session by default
   */
  async sessionRevoke(sessionId?: string) {
    const o = op("/v0/org/{org_id}/session/{session_id}", "delete");
    await this.exec(o, {
      params: { path: { session_id: sessionId ?? "self" } },
    });
  }

  /**
   * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
   *
   * @param {string?} roleId If set, limit to sessions for this role only.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
   */
  sessionsList(roleId?: string, page?: PageOpts): Paginator<SessionsResponse, SessionInfo> {
    const o = op("/v0/org/{org_id}/session", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query: { role: roleId, ...query } } }),
      (r) => r.sessions,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Returns the list of keys that this session has access to.
   * @return {KeyInfo[]} The list of keys.
   */
  async sessionKeysList(): Promise<KeyInfo[]> {
    const o = op("/v0/org/{org_id}/token/keys", "get");
    const { keys } = await this.exec(o, {});
    return keys;
  }

  // #endregion

  // #region IDENTITY: identityProve, identityVerify, identityAdd, identityRemove, identityList

  /**
   * Obtain proof of authentication using the current CubeSigner session.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const o = op("/v0/org/{org_id}/identity/prove", "post");

    return this.exec(o, {});
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param {IdentityProof} proof The proof of authentication.
   */
  async identityVerify(proof: IdentityProof) {
    const o = op("/v0/org/{org_id}/identity/verify", "post");
    await this.exec(o, {
      body: proof,
    });
  }

  /**
   * Associates an OIDC identity with the current user's account.
   *
   * @param {AddIdentityRequest} body The request body, containing an OIDC token to prove the identity ownership.
   */
  async identityAdd(body: AddIdentityRequest) {
    const o = op("/v0/org/{org_id}/identity", "post");
    await this.exec(o, { body });
  }

  /**
   * Removes an OIDC identity from the current user's account.
   *
   * @param {OidcIdentity} body The identity to remove.
   */
  async identityRemove(body: OidcIdentity) {
    const o = op("/v0/org/{org_id}/identity", "delete");
    await this.exec(o, { body });
  }

  /**
   * Lists associated OIDC identities with the current user.
   *
   * @return {ListIdentityResponse} Associated identities
   */
  async identityList(): Promise<ListIdentityResponse> {
    const o = op("/v0/org/{org_id}/identity", "get");
    return await this.exec(o, {});
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
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}", "get");
    return this.exec(o, {
      params: { path: { mfa_id: mfaId } },
    });
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * @return {Promise<MfaRequestInfo[]>} The MFA requests.
   */
  async mfaList(): Promise<MfaRequestInfo[]> {
    const o = op("/v0/org/{org_id}/mfa", "get");

    const { mfa_requests } = await this.exec(o, {});
    return mfa_requests;
  }

  /**
   * Approve or reject a pending MFA request using the current session.
   *
   * @param {string} mfaId The id of the MFA request
   * @param {MfaVote} mfaVote Approve or reject the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaVoteCs(mfaId: string, mfaVote: MfaVote): Promise<MfaRequestInfo> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}", "patch");
    return this.exec(o, {
      params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
    });
  }

  /**
   * Approve or reject a pending MFA request using TOTP.
   *
   * @param {string} mfaId The ID of the MFA request
   * @param {string} code The TOTP code
   * @param {MfaVote} mfaVote Approve or reject the MFA request
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request
   */
  async mfaVoteTotp(mfaId: string, code: string, mfaVote: MfaVote): Promise<MfaRequestInfo> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}/totp", "patch");

    return this.exec(o, {
      params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
      body: { code },
    });
  }

  /**
   * Initiate approval of an existing MFA request using FIDO. A challenge is
   * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaApproveFidoComplete}.
   *
   * @param {string} mfaId The MFA request ID.
   * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
   */
  async mfaFidoInit(mfaId: string): Promise<MfaFidoChallenge> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}/fido", "post");

    const challenge = await this.exec(o, {
      params: { path: { mfa_id: mfaId } },
    });

    return new MfaFidoChallenge(this, mfaId, challenge);
  }

  /**
   * Complete a previously initiated (via {@link mfaApproveFidoInit}) MFA request using FIDO.
   *
   * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
   * {@link MfaFidoChallenge.createCredentialAndAnswer}.
   *
   * @param {string} mfaId The MFA request ID
   * @param {MfaVote} mfaVote Approve or reject the MFA request
   * @param {string} challengeId The ID of the challenge issued by {@link mfaApproveFidoInit}
   * @param {PublicKeyCredential} credential The answer to the challenge
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
   */
  async mfaVoteFidoComplete(
    mfaId: string,
    mfaVote: MfaVote,
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<MfaRequestInfo> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}/fido", "patch");
    return await this.exec(o, {
      params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
      body: {
        challenge_id: challengeId,
        credential,
      },
    });
  }

  // #endregion

  // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signSerializedAva, signBlob, signBtc, signTaproot, signSolana, signEots, generateEotsNonces

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
    const o = op("/v1/org/{org_id}/eth1/sign/{pubkey}", "post");

    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign EIP-191 typed data.
   *
   * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BlobSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
   */
  async signEip191(
    key: Key | string,
    req: Eip191SignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Eip191Or712SignResponse>> {
    const o = op("/v0/org/{org_id}/evm/eip191/sign/{pubkey}", "post");

    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign EIP-712 typed data.
   *
   * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BlobSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
   */
  async signEip712(
    key: Key | string,
    req: Eip712SignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<Eip191Or712SignResponse>> {
    const o = op("/v0/org/{org_id}/evm/eip712/sign/{pubkey}", "post");

    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    const o = op("/v1/org/{org_id}/eth2/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    const o = op("/v1/org/{org_id}/eth2/stake", "post");
    const sign = async (headers?: HeadersInit) =>
      this.exec(o, {
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, sign, mfaReceipt);
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
    const o = op("/v1/org/{org_id}/eth2/unstake/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    const o = op("/v0/org/{org_id}/ava/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: <AvaSignRequest>{
          tx: tx as unknown,
        },
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign a serialized Avalanche C-, P-, or X-chain message. See [the Avalanche
   * documentation](https://docs.avax.network/reference/standards/serialization-primitives)
   * for the specification of the serialization format.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its
   * material ID).
   * @param {AvaChain} avaChain Avalanche chain
   * @param {string} tx Hex encoded transaction
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
   */
  async signSerializedAva(
    key: Key | string,
    avaChain: AvaChain,
    tx: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<AvaSignResponse>> {
    const o = op("/v0/org/{org_id}/ava/sign/{ava_chain}/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { ava_chain: avaChain, pubkey } },
        body: <AvaSerializedTxSignRequest>{
          tx,
        },
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign a raw blob.
   *
   * This requires the key to have a '"AllowRawBlobSigning"' {@link KeyPolicy}. This is because
   * signing arbitrary messages is, in general, dangerous (and you should instead
   * prefer typed end-points as used by, for example, {@link signEvm}). For Secp256k1 keys,
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
    const o = op("/v1/org/{org_id}/blob/sign/{key_id}", "post");

    const key_id = typeof key === "string" ? (key as string) : key.id;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { key_id } },
        body: req,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    const o = op("/v0/org/{org_id}/btc/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers: headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign a Taproot message.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {TaprootSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
   */
  async signTaproot(
    key: Key | string,
    req: TaprootSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<TaprootSignResponse>> {
    const o = op("/v0/org/{org_id}/btc/taproot/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers: headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Generate an Extractable One-Time Signature
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {EotsSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<EotsSignResponse | AcceptedResponse>} The response.
   */
  async signEots(
    key: Key | string,
    req: EotsSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<EotsSignResponse>> {
    const o = op("/v0/org/{org_id}/babylon/eots/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers: headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Generates a set of Babylon EOTS nonces for a specified chain-id, starting at a specified block height.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {EotsCreateNonceRequest} req What and how many nonces to create
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<EotsCreateNonceResponse | AcceptedResponse>} The response.
   */
  async eotsCreateNonce(
    key: Key | string,
    req: EotsCreateNonceRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<EotsCreateNonceResponse>> {
    const o = op("/v0/org/{org_id}/babylon/eots/nonces/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers: headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    const o = op("/v0/org/{org_id}/solana/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        body: req,
        headers: headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }
  // #endregion

  // #region USER EXPORT: userExport(Init,Complete,List,Delete)
  /**
   * List outstanding user-export requests.
   *
   * @param {string?} keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
   * @param {string?} userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<UserExportListResponse, UserExportInitResponse>} Paginator for iterating over the result set.
   */
  userExportList(
    keyId?: string,
    userId?: string,
    page?: PageOpts,
  ): Paginator<UserExportListResponse, UserExportInitResponse> {
    const o = op("/v0/org/{org_id}/user/me/export", "get");
    return new Paginator(
      page ?? Page.default(),
      (query) =>
        this.exec(o, {
          params: {
            query: {
              user_id: userId,
              key_id: keyId,
              ...query,
            },
          },
        }),
      (r) => r.export_requests,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Delete an outstanding user-export request.
   *
   * @param {string} keyId The key-id corresponding to the user-export request to delete.
   * @param {string?} userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
   */
  async userExportDelete(keyId: string, userId?: string): Promise<void> {
    const o = op("/v0/org/{org_id}/user/me/export", "delete");
    await this.exec(o, {
      params: {
        query: {
          key_id: keyId,
          user_id: userId,
        },
      },
    });
  }

  /**
   * Initiate a user-export request.
   *
   * @param {string} keyId The key-id for which to initiate an export.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
   * @return {Promise<UserExportInitResponse | AcceptedResponse>} The response.
   */
  async userExportInit(
    keyId: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<UserExportInitResponse>> {
    const o = op("/v0/org/{org_id}/user/me/export", "post");
    const initFn = async (headers?: HeadersInit) => {
      return this.exec(o, {
        body: { key_id: keyId },
        headers,
      });
    };
    return await CubeSignerResponse.create(this.env, initFn, mfaReceipt);
  }

  /**
   * Complete a user-export request.
   *
   * @param {string} keyId The key-id for which to initiate an export.
   * @param {CryptoKey} publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
   * @return {Promise<UserExportCompleteResponse | AcceptedResponse>} The response.
   */
  async userExportComplete(
    keyId: string,
    publicKey: CryptoKey,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<UserExportCompleteResponse>> {
    // base64-encode the public key
    const subtle = await loadSubtleCrypto();
    const publicKeyB64 = encodeToBase64(Buffer.from(await subtle.exportKey("raw", publicKey)));

    const o = op("/v0/org/{org_id}/user/me/export", "patch");
    // make the request
    const completeFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        body: {
          key_id: keyId,
          public_key: publicKeyB64,
        },
        headers,
      });
    return await CubeSignerResponse.create(this.env, completeFn, mfaReceipt);
  }
  // #endregion

  // #region MISC: heartbeat()
  /**
   * Send a heartbeat / upcheck request.
   *
   * @return { Promise<void> } The response.
   */
  async heartbeat(): Promise<void> {
    const o = op("/v1/org/{org_id}/cube3signer/heartbeat", "post");
    await this.exec(o, {});
  }
  // #endregion

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org to log into.
   * @param {string} token The OIDC token to exchange
   * @param {List<string>} scopes The scopes for the new session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @return {Promise<CubeSignerResponse<SessionData>>} The session data.
   */
  static async oidcSessionCreate(
    env: EnvInterface,
    orgId: string,
    token: string,
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<SessionData>> {
    const o = op("/v0/org/{org_id}/oidc", "post");

    const loginFn = async (headers?: HeadersInit) => {
      const data = await retryOn5XX(() =>
        o({
          baseUrl: env.SignerApiRoot,
          params: { path: { org_id: orgId } },
          headers: {
            ...headers,
            Authorization: token,
          },
          body: {
            scopes,
            tokens: lifetimes,
          },
        }),
      ).then(assertOk);

      return mapResponse(
        data,
        (sessionInfo) =>
          <SessionData>{
            env: {
              ["Dev-CubeSignerStack"]: env,
            },
            org_id: orgId,
            token: sessionInfo.token,
            session_exp: sessionInfo.expiration,
            purpose: "sign in via oidc",
            session_info: sessionInfo.session_info,
          },
      );
    };

    return await CubeSignerResponse.create(env, loginFn, mfaReceipt);
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org id in which to generate proof
   * @param {string} token The oidc token
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  static async identityProveOidc(
    env: EnvInterface,
    orgId: string,
    token: string,
  ): Promise<IdentityProof> {
    const o = op("/v0/org/{org_id}/identity/prove/oidc", "post");
    return retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        headers: {
          Authorization: token,
        },
      }),
    ).then(assertOk);
  }

  /**
   * Obtain all organizations a user is a member of
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} token The oidc token identifying the user
   * @return {Promise<UserOrgsResponse>} The organization the user belongs to
   */
  static async userOrgs(env: EnvInterface, token: string): Promise<UserOrgsResponse> {
    const o = op("/v0/user/orgs", "get");
    return retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        headers: {
          Authorization: token,
        },
      }),
    ).then(assertOk);
  }

  /**
   * Post-process a {@link UserInfo} response. Post-processing ensures that the email field for
   * users without an email is set to `null`.
   *
   * @param {UserInfo} info The info to post-process
   * @return {Promise<UserInfo>} The processed user info
   */
  static #processUserInfo(info: UserInfo): UserInfo {
    if (info.email === EMAIL_NOT_FOUND) {
      info.email = null;
    }
    return info;
  }

  /**
   * Post-process a {@link UserInOrgInfo} response. Post-processing ensures that the email field for
   * users without an email is set to `null`.
   *
   * @param {UserInOrgInfo} info The info to post-process
   * @return {Promise<UserInOrgInfo>} The processed user info
   */
  static #processUserInOrgInfo(info: UserInOrgInfo): UserInOrgInfo {
    if (info.email === EMAIL_NOT_FOUND) {
      info.email = null;
    }
    return info;
  }
}

const defaultSignerSessionLifetime: SessionLifetime = {
  session: 604800, // 1 week
  auth: 300, // 5 min
  refresh: 86400, // 1 day
  grace: 30, // seconds
};
