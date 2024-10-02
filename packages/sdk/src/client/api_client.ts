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
  GetUsersInOrgResponse,
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
  BtcMessageSignResponse,
  BtcMessageSignRequest,
  PsbtSignRequest,
  PsbtSignResponse,
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
  CreateKeyImportKeyResponse,
  ImportKeyRequest,
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
  JrpcResponse,
  JsonArray,
  ListIdentityResponse,
  ListKeyRolesResponse,
  ListKeysResponse,
  ListRoleKeysResponse,
  ListRoleUsersResponse,
  ListRolesResponse,
  MmiJrpcMethod,
  PendingMessageInfo,
  PendingMessageSignResponse,
  RatchetConfig,
  Scope,
  SessionData,
  SessionLifetime,
  SessionsResponse,
  TaprootSignRequest,
  TaprootSignResponse,
  BabylonStakingRequest,
  BabylonStakingResponse,
  UpdateUserMembershipRequest,
  HistoricalTx,
  ListHistoricalTxResponse,
  PublicOrgInfo,
  ImportDeriveKeyProperties,
  PasswordResetRequest,
  EmailOtpResponse,
  AuthenticationRequest,
  AuthenticationResponse,
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

  // #region ORG USERS: orgUserInvite, orgUserDelete, orgUsersList, orgUserGet, orgUserCreateOidc, orgUserDeleteOidc

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
   * List users in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<GetUsersInOrgResponse, UserInOrgInfo>} Paginator for iterating over the users in the org.
   */
  orgUsersList(page?: PageOpts): Paginator<GetUsersInOrgResponse, UserInOrgInfo> {
    const o = op("/v0/org/{org_id}/users", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { path: {}, ...query } }),
      (r) => r.users.map(ApiClient.#processUserInOrgInfo),
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Get user by id.
   * @param {string} userId The id of the user to get.
   * @return {UserInOrgInfo} Org user.
   */
  async orgUserGet(userId: string): Promise<UserInOrgInfo> {
    const o = op("/v0/org/{org_id}/users/{user_id}", "get");

    const resp = await this.exec(o, {
      params: {
        path: {
          user_id: userId,
        },
      },
    });
    return ApiClient.#processUserInOrgInfo(resp);
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

  // #region KEYS: keyGet, keyUpdate, keyDelete, keysCreate, keysDerive, keysList, keyHistory

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
   * Get a key by its type and material id.
   *
   * @param {KeyType} keyType The key type.
   * @param {string} materialId The material id of the key to get.
   * @return {KeyInfo} The key information.
   */
  async keyGetByMaterialId(keyType: KeyType, materialId: string): Promise<KeyInfo> {
    const o = op("/v0/org/{org_id}/keys/{key_type}/{material_id}", "get");

    return this.exec(o, {
      params: { path: { key_type: keyType, material_id: materialId } },
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
   * @param { ImportDeriveKeyProperties } props Additional options for derivation.
   *
   * @return {KeyInfo[]} The newly derived keys.
   */
  async keysDerive(
    keyType: KeyType,
    derivationPaths: string[],
    mnemonicId: string,
    props?: ImportDeriveKeyProperties,
  ): Promise<KeyInfo[]> {
    const o = op("/v0/org/{org_id}/derive_key", "put");

    const { keys } = await this.exec(o, {
      body: {
        derivation_path: derivationPaths,
        mnemonic_id: mnemonicId,
        key_type: keyType,
        // Casting `props.policy` to the proper type does not work here:
        // tsc appears to get the type wrong. Our workaround is `any`.
        ...(props as any), // eslint-disable-line @typescript-eslint/no-explicit-any
      },
    });

    return keys;
  }

  /**
   * List all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @param {string?} owner Optional key owner to filter list for.
   * @param {string?} search Optionally search by key's material ID and metadata
   * @return {Paginator<ListKeysResponse, KeyInfo>} Paginator for iterating over keys.
   */
  keysList(
    type?: KeyType,
    page?: PageOpts,
    owner?: string,
    search?: string,
  ): Paginator<ListKeysResponse, KeyInfo> {
    const o = op("/v0/org/{org_id}/keys", "get");

    return new Paginator(
      page ?? Page.default(),
      (query) =>
        this.exec(o, { params: { query: { key_type: type, key_owner: owner, search, ...query } } }),
      (r) => r.keys,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * List recent historical key transactions.
   *
   * @param {string} keyId The key id.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @return {Paginator<ListHistoricalTxResponse, HistoricalTx>} Paginator for iterating over historical transactions.
   */
  keyHistory(keyId: string, page?: PageOpts): Paginator<ListHistoricalTxResponse, HistoricalTx> {
    const o = op("/v0/org/{org_id}/keys/{key_id}/tx", "get");
    return new Paginator(
      page ?? Page.default(),
      () => this.exec(o, { params: { path: { key_id: keyId } } }),
      (r) => r.txs,
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
   * Create new user session (management and/or signing). The lifetime of
   * the new session is silently truncated to that of the current session.
   *
   * @param {string} purpose The purpose of the session
   * @param {Scope[]} scopes Session scopes.
   * @param {SessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SessionData>} New signer session info.
   */
  async sessionCreate(
    purpose: string,
    scopes: Scope[],
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
   * Create new user session (management and/or signing) whose lifetime potentially
   * extends the lifetime of the current session.  MFA is always required.
   *
   * @param {string} purpose The purpose of the session
   * @param {Scope[]} scopes Session scopes.
   * @param {SessionLifetime} lifetime Lifetime settings
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
   * @return {Promise<CubeSignerResponse<SessionData>>} New signer session info.
   */
  async sessionCreateExtended(
    purpose: string,
    scopes: Scope[],
    lifetime: SessionLifetime,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<SessionData>> {
    const o = op("/v0/org/{org_id}/session", "post");

    const requestFn = async (headers?: HeadersInit) => {
      const resp = await this.exec(o, {
        headers,
        body: {
          purpose,
          scopes,
          extend_lifetimes: true,
          auth_lifetime: lifetime.auth,
          refresh_lifetime: lifetime.refresh,
          session_lifetime: lifetime.session,
          grace_lifetime: lifetime.grace,
        },
      });
      return mapResponse(resp, (sessionInfo) =>
        signerSessionFromSessionInfo(this.sessionMeta, sessionInfo, {
          purpose,
        }),
      );
    };
    return await CubeSignerResponse.create(this.env, requestFn, mfaReceipt);
  }

  /**
   * Create a new signer session for a given role.
   *
   * @param {string} roleId Role ID
   * @param {string} purpose The purpose of the session
   * @param {Scope[]} scopes Session scopes. Not all scopes are valid for a role.
   * @param {SessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SessionData>} New signer session info.
   */
  async sessionCreateForRole(
    roleId: string,
    purpose: string,
    scopes?: Scope[],
    lifetimes?: SessionLifetime,
  ): Promise<SessionData> {
    lifetimes ??= defaultSignerSessionLifetime;
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
   * Revoke all sessions.
   *
   * @param {string} [roleId] The ID of a role whose sessions to revoke. If not defined, all the current user's sessions will be revoked instead.
   */
  async sessionRevokeAll(roleId?: string) {
    const o = op("/v0/org/{org_id}/session", "delete");
    await this.exec(o, {
      params: { query: { role: roleId } },
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
   * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaVoteFidoComplete}.
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
   * Complete a previously initiated (via {@link mfaFidoInit}) MFA request using FIDO.
   *
   * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
   * {@link MfaFidoChallenge.createCredentialAndAnswer}.
   *
   * @param {string} mfaId The MFA request ID
   * @param {MfaVote} mfaVote Approve or reject the MFA request
   * @param {string} challengeId The ID of the challenge issued by {@link mfaFidoInit}
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

  // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signSerializedAva, signBlob, signBtc, signTaproot, signSolana, signEots, eotsCreateNonce, signMmi

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
   * Sign a Bitcoin transaction input.
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
   * Sign a Bitcoin BIP-137 message.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BtcMessageSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BtcMessageSignResponse | AcceptedResponse>} The response.
   */
  async signBtcMessage(
    key: Key | string,
    req: BtcMessageSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<BtcMessageSignResponse>> {
    const o = op("/v0/org/{org_id}/btc/message/sign/{pubkey}", "post");
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
   * Sign a Taproot transaction input.
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
   * Sign a PSBT.
   *
   * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
   * @param {BtcSignRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
   */
  async signPsbt(
    key: Key | string,
    req: PsbtSignRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<PsbtSignResponse>> {
    const o = op("/v0/org/{org_id}/btc/psbt/sign/{pubkey}", "post");
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
   * Sign a Babylon staking transaction.
   *
   * @param {Key | string} key The taproot key to sign with (either {@link Key} or its material ID).
   * @param {BabylonStakingRequest} req What to sign
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt
   * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
   */
  async signBabylonStakingTxn(
    key: Key | string,
    req: BabylonStakingRequest,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<BabylonStakingResponse>> {
    const o = op("/v0/org/{org_id}/babylon/staking/{pubkey}", "post");
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

  /**
   * Sign a MMI pending message.
   *
   * @param {PendingMessageInfo} message the message info.
   * @param {MfaReceipt | undefined} mfaReceipt optional MFA receipt.
   * @return {PendingMessageSignResponse} the updated message.
   */
  async signMmi(
    message: PendingMessageInfo,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<PendingMessageSignResponse>> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/sign", "post");
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { msg_id: message.id } },
        headers: headers,
        body: message,
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

  // #region KEY IMPORT: createKeyImportKey, importKeys
  /**
   * Request a fresh key-import key.
   *
   * @return { Promise<GetKeyImportKeyResponse> } A fresh key-import key
   */
  async createKeyImportKey(): Promise<CreateKeyImportKeyResponse> {
    const o = op("/v0/org/{org_id}/import_key", "get");
    return await this.exec(o, {});
  }

  /**
   * Import one or more keys. To use this functionality, you must first create an
   * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
   * library. See that library's documentation for more info.
   *
   * @param { ImportKeyRequest } body An encrypted key-import request.
   * @return { KeyInfo[] } The newly imported keys.
   */
  async importKeys(body: ImportKeyRequest): Promise<KeyInfo[]> {
    const o = op("/v0/org/{org_id}/import_key", "put");
    const { keys } = await this.exec(o, { body });
    return keys;
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

  // #region MMI: mmi(), mmiList()
  /**
   * Call the MMI JSON RPC endpoint.
   *
   * @param {MmiJrpcMethod} method The name of the method to call.
   * @param {JsonArray} params The list of method parameters.
   * @return {object | null | undefined} the return value of the method.
   * @internal
   */
  async mmi(method: MmiJrpcMethod, params: JsonArray): Promise<JrpcResponse> {
    const o = op("/v0/mmi/v3/json-rpc", "post");
    const body = {
      id: 1,
      jsonrpc: "2.0",
      method: method,
      params: params,
    };
    const func = async (headers?: HeadersInit) => this.exec(o, { headers, body });
    const resp = (await CubeSignerResponse.create(this.env, func)).data();
    return resp;
  }

  /**
   * List pending MMI messages.
   *
   * @return { PendingMessageInfo[] } The list of pending MMI messages.
   */
  async mmiList(): Promise<PendingMessageInfo[]> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages", "get");
    const { pending_messages } = await this.exec(o, {});
    return pending_messages as PendingMessageInfo[];
  }

  /**
   * Get a pending MMI message by its ID.
   *
   * @param {string} msgId The ID of the pending message.
   * @return {PendingMessageInfo} The pending MMI message.
   */
  async mmiGet(msgId: string): Promise<PendingMessageInfo> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "get");
    return await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  /**
   * Delete the MMI message with the given ID.
   *
   * @param {string} msgId the ID of the MMI message.
   */
  async mmiDelete(msgId: string): Promise<void> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "delete");
    await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  /**
   * Reject the MMI message with the given ID.
   *
   * @param {string} msgId the ID of the MMI message.
   */
  async mmiReject(msgId: string): Promise<PendingMessageInfo> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/reject", "post");
    return await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  // #endregion

  /**
   * Returns public org information.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org to log into
   * @return {Promise<PublicOrgInfo>} Public org information
   */
  static async publicOrgInfo(env: EnvInterface, orgId: string): Promise<PublicOrgInfo> {
    const o = op("/v0/org/{org_id}/info", "get");
    return await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
      }),
    ).then(assertOk);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The org to log into.
   * @param {string} token The OIDC token to exchange
   * @param {List<Scope>} scopes The scopes for the new session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @param {string} purpose Optional session description.
   * @return {Promise<CubeSignerResponse<SessionData>>} The session data.
   */
  static async oidcSessionCreate(
    env: EnvInterface,
    orgId: string,
    token: string,
    scopes: Array<Scope>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
    purpose?: string,
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
            purpose,
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
   * Unauthenticated endpoint for authenticating with email/password.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The id of the organization
   * @param {AuthenticationRequest} body The request body
   * @return {AuthenticationResponse} Returns an OIDC token which can be used
   *   to log in via OIDC (see {@link oidcSessionCreate}).
   */
  static async idpAuthenticate(
    env: EnvInterface,
    orgId: string,
    body: AuthenticationRequest,
  ): Promise<AuthenticationResponse> {
    const o = op("/v0/org/{org_id}/oidc/password", "post");
    return retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body,
      }),
    ).then(assertOk);
  }

  /**
   * Unauthenticated endpoint for requesting password reset.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The id of the organization
   * @param {PasswordResetRequest} body The request body
   * @return {EmailOtpResponse} Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
   */
  static async idpPasswordResetRequest(
    env: EnvInterface,
    orgId: string,
    body: PasswordResetRequest,
  ): Promise<EmailOtpResponse> {
    const o = op("/v0/org/{org_id}/oidc/password/reset", "post");
    return retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body,
      }),
    ).then(assertOk);
  }

  /**
   * Unauthenticated endpoint for confirming a previously initiated password reset request.
   *
   * @param {EnvInterface} env The environment to log into
   * @param {string} orgId The id of the organization
   * @param {string} partialToken The partial token returned by {@link passwordResetRequest}
   * @param {string} signature The one-time code (signature in this case) sent via email
   * @param {string} newPassword The new password
   */
  static async idpPasswordResetConfirm(
    env: EnvInterface,
    orgId: string,
    partialToken: string,
    signature: string,
    newPassword: string,
  ): Promise<void> {
    const o = op("/v0/org/{org_id}/oidc/password/reset", "patch");
    await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body: {
          token: `${partialToken}.${signature}`,
          new_password: newPassword,
        },
      }),
    ).then(assertOk);
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
