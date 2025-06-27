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
  Empty,
  UserOrgsResponse,
  CreateKeyImportKeyResponse,
  ImportKeyRequest,
  UpdatePolicyRequest,
  ListPoliciesResponse,
  PolicyType,
  PolicyInfo,
} from "../schema_types";
import { encodeToBase64 } from "../util";
import {
  AddFidoChallenge,
  MfaFidoChallenge,
  MfaEmailChallenge,
  TotpChallenge,
  ResetEmailChallenge,
} from "../mfa";
import { CubeSignerResponse, mapResponse } from "../response";
import type { Key, KeyType } from "../key";
import type { PageOpts } from "../paginator";
import { Page, Paginator } from "../paginator";
import type { KeyPolicy } from "../role";
import { loadSubtleCrypto } from "../user_export";
import type * as policy from "../policy";
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
  BabylonRegistrationRequest,
  BabylonRegistrationResponse,
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
  CreateKeyProperties,
  InvitationAcceptRequest,
  MfaReceipts,
  SuiSignRequest,
  SuiSignResponse,
  QueryMetricsRequest,
  QueryMetricsResponse,
  CreateOrgRequest,
  KeyTypeAndDerivationPath,
  DeriveMultipleKeyTypesProperties,
  ContactInfo,
  ListContactsResponse,
  JsonValue,
  EditPolicy,
  UpdateContactRequest,
  AddressMap,
  RolePolicy,
  InvokePolicyResponse,
  InvokePolicyRequest,
  UploadWasmPolicyRequest,
  UploadWasmPolicyResponse,
  LoginRequest,
  PasskeyAssertAnswer,
  schemas,
  KeyWithPoliciesInfo,
  GetRoleKeyOptions,
} from "../index";
import { assertOk, op, type Op, type Operation, apiFetch } from "../fetch";
import { BaseClient, signerSessionFromSessionInfo } from "./base_client";
import { retryOn5XX } from "../retry";
import { PasskeyLoginChallenge } from "../passkey";

/**
 * String returned by API when a user does not have an email address (for backwards compatibility)
 */
const EMAIL_NOT_FOUND = "email not found";

/**
 * Session selector.
 */
export type SessionSelector =
  /**
   * Selects all sessions tied to a role with this ID
   *
   * @deprecated Use `{ role: string }` instead
   */
  | string
  | {
      /** Selects all sessions tied to a role with this ID */
      role: string;
    }
  | {
      /** Selects all sessions tied to a user with this ID. */
      user: string;
    };

/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
export class ApiClient extends BaseClient {
  /**
   * Creates a new client using the same session manager but targeting a
   * different (child) organization.
   *
   * @param targetOrgId The ID of an organization that the new client should target
   * @returns A new client targeting a different org
   */
  withTargetOrg(targetOrgId: string): ApiClient {
    return new ApiClient(this.sessionMeta, this.sessionManager, targetOrgId);
  }

  // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)

  /**
   * @returns Information about the current user.
   */
  async userGet(): Promise<UserInfo> {
    const o = op("/v0/org/{org_id}/user/me", "get");
    return this.exec(o, {}).then(ApiClient.#processUserInfo);
  }

  /**
   * Initiates login via Email OTP.
   * Returns an unsigned OIDC token and sends an email to the user containing the signature of that token.
   * The OIDC token can be reconstructed by appending the signature to the partial token like so:
   *
   * token = partial_token + signature
   *
   * @param env The environment to use
   * @param orgId The org to login to
   * @param email The email to send the signature to
   * @returns The partial OIDC token that must be combined with the signature in the email
   */
  static async initEmailOtpAuth(
    env: EnvInterface,
    orgId: string,
    email: string,
  ): Promise<EmailOtpResponse> {
    const o = op("/v0/org/{org_id}/oidc/email-otp", "post");

    return await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body: { email },
      }),
    ).then(assertOk);
  }

  /**
   * Retries a pending MFA request with the provided MfaReceipts
   *
   * @param req The request to retry
   * @param mfaReceipt The MFA receipt(s) to include in HTTP headers
   * @returns The response from the server
   */
  async mfaRetry(
    req: MfaRequestInfo["request"],
    mfaReceipt: MfaReceipts,
  ): Promise<CubeSignerResponse<unknown>> {
    const o: Op<Operation> = (opts) =>
      // @ts-expect-error We're doing some heavy casting to get this to work
      apiFetch(req.path, req.method, {
        ...opts,
        body: req.body,
      });
    const retry = async (headers?: HeadersInit) =>
      this.exec(o, {
        headers,
      });
    return CubeSignerResponse.create(this.env, retry, mfaReceipt);
  }

  /**
   * Creates a request to change user's verified email.
   *
   * Returns a {@link ResetEmailChallenge} that must be answered either by calling
   * {@link ResetEmailChallenge.answer} (or {@link ApiClient.userEmailResetComplete}).
   *
   * @param req Either the email to register or the parameters for the request
   * @param mfaReceipt MFA receipt(s) to include in HTTP headers
   * @returns An email verification challenge that must be answered
   */
  async userEmailResetInit(
    req: string | schemas["EmailResetRequest"],
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<ResetEmailChallenge>> {
    const o = op("/v0/org/{org_id}/user/me/email", "post");
    const resetEmailFn = async (headers?: HeadersInit) => {
      const data = await this.exec(o, {
        headers,
        body: typeof req === "string" ? { email: req } : req,
      });
      return mapResponse(data, (emailOtp) => new ResetEmailChallenge(this, emailOtp));
    };
    return await CubeSignerResponse.create(this.env, resetEmailFn, mfaReceipt);
  }

  /**
   * Answer the reset email challenge issued by {@link userEmailResetInit}.
   * If successful, user's verified email will be updated.
   *
   * Instead of calling this method directly, prefer {@link ResetEmailChallenge.answer}.
   *
   * @param partialToken The partial token returned by {@link userEmailResetInit}
   * @param signature The one-time code (signature in this case) sent via email
   */
  async userEmailResetComplete(partialToken: string, signature: string) {
    const o = op("/v0/org/{org_id}/user/me/email", "patch");
    await this.exec(o, {
      body: { token: `${partialToken}${signature}` },
    });
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered either by calling {@link TotpChallenge.answer} (or
   * {@link ApiClient.userTotpResetComplete}).
   *
   * @param issuer Optional issuer; defaults to "Cubist"
   * @param mfaReceipt MFA receipt(s) to include in HTTP headers
   * @returns A TOTP challenge that must be answered
   */
  async userTotpResetInit(
    issuer?: string,
    mfaReceipt?: MfaReceipts,
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
   * @param totpId The ID of the TOTP challenge
   * @param code The TOTP code that should verify against the TOTP configuration from the challenge.
   */
  async userTotpResetComplete(totpId: string, code: string): Promise<void> {
    const o = op("/v0/org/{org_id}/user/me/totp", "patch");
    await this.exec(o, {
      body: { totp_id: totpId, code },
    });
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   *
   * @param code Current TOTP code
   * @throws An error if verification fails
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
   * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
   * @returns An empty response
   */
  async userTotpDelete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>> {
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
   * @param name The name of the new device or a full request.
   * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
   * @returns A challenge that must be answered in order to complete FIDO registration.
   */
  async userFidoRegisterInit(
    name: string | schemas["FidoCreateRequest"],
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<AddFidoChallenge>> {
    const o = op("/v0/org/{org_id}/user/me/fido", "post");
    const addFidoFn = async (headers?: HeadersInit) => {
      const data = await this.exec(o, {
        headers,
        body: typeof name === "string" ? { name } : name,
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
   * @param challengeId The ID of the challenge returned by the remote end.
   * @param credential The answer to the challenge.
   * @returns An empty response
   */
  async userFidoRegisterComplete(
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<Empty> {
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
   * @param fidoId The ID of the desired FIDO key
   * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
   * @returns An empty response
   */
  async userFidoDelete(
    fidoId: string,
    mfaReceipt?: MfaReceipts,
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

  // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership, orgCreateOrg, orgQueryMetrics

  /**
   * Obtain information about an org
   *
   * @param orgId The org to get info for
   * @returns Information about the organization.
   */
  async orgGet(orgId?: string): Promise<OrgInfo> {
    const o = op("/v0/org/{org_id}", "get");
    return this.exec(o, {
      params: {
        path: { org_id: orgId ?? this.orgId },
      },
    });
  }

  /**
   * Update the org.
   *
   * @param request The JSON request to send to the API server.
   * @returns Updated org information.
   */
  async orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const o = op("/v0/org/{org_id}", "patch");

    return this.exec(o, { body: request });
  }

  /**
   * Update user's membership in this org.
   *
   * @param userId The ID of the user whose membership to update.
   * @param req The update request
   * @returns Updated user membership
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

  /**
   * Create a new organization. The new org is a child of the
   * current org and inherits its key-export policy. The new org
   * is created with one owner, the caller of this API.
   *
   * @param body The details of the request
   * @returns The new organization information
   */
  async orgCreateOrg(body: CreateOrgRequest): Promise<OrgInfo> {
    const o = op("/v0/org/{org_id}/orgs", "post");
    return await this.exec(o, { body });
  }

  /**
   * Query org metrics.
   *
   * @param body The query
   * @param page Pagination options. Default to fetching the entire result set.
   * @returns Computed org metrics statistics.
   */
  orgQueryMetrics(
    body: QueryMetricsRequest,
    page?: PageOpts,
  ): Paginator<QueryMetricsResponse, QueryMetricsResponse> {
    const o = op("/v0/org/{org_id}/metrics", "post");
    return new Paginator(
      page ?? Page.default(),
      (query) => this.exec(o, { body, params: { query } }),
      (r) => r.last_evaluated_key,
      (acc, next) => {
        if (!acc) return next;
        acc.raw_data ??= [];
        acc.raw_data.push(...(next.raw_data ?? []));
        return acc;
      },
    );
  }

  // #endregion

  // #region ORG USERS: orgUserInvite, orgUserDelete, orgUsersList, orgUserGet, orgUserGetByEmail, orgUserCreateOidc, orgUserDeleteOidc

  /**
   * Create a new (first-party) user in the organization and send an email invitation to that user.
   *
   * @param email Email of the user
   * @param name The full name of the user
   * @param role Optional role. Defaults to "alien".
   * @param skipEmail Optionally skip sending the invite email.
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
   *
   * @param userId The ID of the user to remove.
   * @returns An empty response
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
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @param searchQuery Optional query string. If defined, all returned users will contain this string in their name or email.
   * @returns Paginator for iterating over the users in the org.
   */
  orgUsersList(
    page?: PageOpts,
    searchQuery?: string,
  ): Paginator<GetUsersInOrgResponse, UserInOrgInfo[]> {
    const o = op("/v0/org/{org_id}/users", "get");

    return Paginator.items(
      page ?? Page.default(),
      (pageQuery) => this.exec(o, { params: { query: { q: searchQuery, ...pageQuery } } }),
      (r) => r.users.map(ApiClient.#processUserInOrgInfo),
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Get user by id.
   *
   * @param userId The id of the user to get.
   * @returns Org user.
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
   * Get user by email.
   *
   * @param email The email of the user to get.
   * @returns Org user
   * @throws if there is no user with that email, or email is invalid
   */
  async orgUserGetByEmail(email: string): Promise<UserInOrgInfo> {
    const o = op("/v0/org/{org_id}/users/email/{email}", "get");

    return await this.exec(o, {
      params: {
        path: { email },
      },
    });
  }

  /**
   * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
   *
   * @param identityOrProof The identity or identity proof of the OIDC user
   * @param email Email of the OIDC user
   * @param opts Additional options for new OIDC users
   * @returns User id of the new user
   */
  async orgUserCreateOidc(
    identityOrProof: OidcIdentity | IdentityProof,
    email?: string | null,
    opts: CreateOidcUserOptions = {},
  ): Promise<string> {
    const o = op("/v0/org/{org_id}/users", "post");

    const identityOrProofFields =
      "id" in identityOrProof ? { proof: identityOrProof } : { identity: identityOrProof };

    const { user_id } = await this.exec(o, {
      body: {
        role: opts.memberRole ?? "Alien",
        email,
        name: opts.name,
        mfa_policy: opts.mfaPolicy,
        ...identityOrProofFields,
      },
    });

    return user_id;
  }

  /**
   * Delete an existing OIDC user.
   *
   * @param identity The identity of the OIDC user
   * @returns An empty response
   */
  async orgUserDeleteOidc(identity: OidcIdentity): Promise<Empty> {
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
   * @param keyId The id of the key to get.
   * @returns The key information.
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
   * @param keyType The key type.
   * @param materialId The material id of the key to get.
   * @returns The key information.
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
   * @param keyId The id of the key to get.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over the roles a key is in.
   */
  keyRolesList(keyId: string, page?: PageOpts): Paginator<ListKeyRolesResponse, KeyInRoleInfo[]> {
    const o = op("/v0/org/{org_id}/keys/{key_id}/roles", "get");

    return Paginator.items(
      page ?? Page.default(),
      (query) =>
        this.exec(o, {
          params: {
            path: { key_id: keyId },
            query,
          },
        }),
      (r) => r.roles,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Update key.
   *
   * @param keyId The ID of the key to update.
   * @param request The JSON request to send to the API server.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The JSON response from the API server.
   */
  async keyUpdate(
    keyId: string,
    request: UpdateKeyRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<KeyInfo>> {
    const o = op("/v0/org/{org_id}/keys/{key_id}", "patch");

    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { key_id: keyId } },
        body: request,
        headers,
      });
    return await CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * Deletes a key.
   *
   * @param keyId Key id
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns A response which can be used to approve MFA if needed
   */
  async keyDelete(keyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/keys/{key_id}", "delete");
    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { key_id: keyId } },
        headers,
      });
    return await CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * Create new signing keys.
   *
   * @param keyType The type of key to create.
   * @param count The number of keys to create.
   * @param ownerId The owner of the keys. Defaults to the session's user.
   * @param props Additional key properties
   * @returns The new keys.
   */
  async keysCreate(
    keyType: KeyType,
    count: number,
    ownerId?: string,
    props?: CreateKeyProperties,
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
        policy: props?.policy,
      },
    });
    return keys;
  }

  /**
   * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
   *
   * The owner of the derived key will be the owner of the mnemonic.
   *
   * @param keyType The type of key to create.
   * @param derivationPaths Derivation paths from which to derive new keys.
   * @param mnemonicId material_id of mnemonic key used to derive the new key.
   * @param props Additional options for derivation.
   *
   * @returns The newly derived keys.
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
        ...props,
        policy: props?.policy,
      },
    });

    return keys;
  }

  /**
   * Use either a new or existing mnemonic to derive keys of one or more
   * specified types via specified derivation paths.
   *
   * @param keyTypesAndDerivationPaths A list of objects specifying the keys to be derived
   * @param props Additional options for derivation.
   *
   * @returns The newly derived keys.
   */
  async keysDeriveMulti(
    keyTypesAndDerivationPaths: KeyTypeAndDerivationPath[],
    props?: DeriveMultipleKeyTypesProperties,
  ): Promise<KeyInfo[]> {
    const o = op("/v0/org/{org_id}/derive_keys", "put");

    const { keys } = await this.exec(o, {
      body: {
        key_types_and_derivation_paths: keyTypesAndDerivationPaths,
        ...props,
        policy: props?.policy,
      },
    });

    return keys;
  }

  /**
   * List all accessible keys in the org.
   *
   * @param type Optional key type to filter list for.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @param owner Optional key owner to filter list for.
   * @param search Optionally search by key's material ID and metadata
   * @returns Paginator for iterating over keys.
   */
  keysList(
    type?: KeyType,
    page?: PageOpts,
    owner?: string,
    search?: string,
  ): Paginator<ListKeysResponse, KeyInfo[]> {
    const o = op("/v0/org/{org_id}/keys", "get");

    return Paginator.items(
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
   * @param keyId The key id.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over historical transactions.
   */
  keyHistory(keyId: string, page?: PageOpts): Paginator<ListHistoricalTxResponse, HistoricalTx[]> {
    const o = op("/v0/org/{org_id}/keys/{key_id}/tx", "get");
    return Paginator.items(
      page ?? Page.default(),
      () => this.exec(o, { params: { path: { key_id: keyId } } }),
      (r) => r.txs,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region ORG CONTACTS: contactCreate, contactGet, contactsList, contactDelete, contactUpdate

  /**
   * Creates a new contact in the organization-wide address book. The
   * user making the request is the owner of the contact, giving them edit access
   * to the contact along with the org owners.
   *
   * @param name The name for the new contact.
   * @param addresses The addresses associated with the contact.
   * @param metadata Metadata associated with the contact. Intended for use as a description.
   * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
   * @returns The newly created contact.
   */
  async contactCreate(
    name: string,
    addresses?: AddressMap,
    metadata?: JsonValue,
    editPolicy?: EditPolicy,
  ): Promise<ContactInfo> {
    const o = op("/v0/org/{org_id}/contacts", "post");
    return this.exec(o, {
      body: {
        name,
        addresses: addresses ?? {},
        metadata,
        edit_policy: editPolicy,
      },
    });
  }

  /**
   * Returns the properties of a Contact.
   *
   * @param contactId The id of the contact you want to retrieve.
   * @returns The contact.
   */
  async contactGet(contactId: string): Promise<ContactInfo> {
    const o = op("/v0/org/{org_id}/contacts/{contact_id}", "get");

    return this.exec(o, {
      params: { path: { contact_id: contactId } },
    });
  }

  /**
   * Lists contacts in the org.
   *
   * @param page The optional pagination options. Defaults to getting every contact.
   * @returns Paginator for iterating over the contacts in the org.
   */
  contactsList(page?: PageOpts): Paginator<ListContactsResponse, ContactInfo[]> {
    const o = op("/v0/org/{org_id}/contacts", "get");

    return Paginator.items(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query } }),
      (r) => r.contacts,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Delete a contact, specified by its ID.
   *
   * Only the contact owner and org owners are allowed to delete contacts.
   * Additionally, the contact's edit policy (if set) must permit the deletion.
   *
   * @param contactId The contact to delete.
   * @returns An empty response.
   */
  async contactDelete(contactId: string): Promise<Empty> {
    const o = op("/v0/org/{org_id}/contacts/{contact_id}", "delete");

    return this.exec(o, {
      params: { path: { contact_id: contactId } },
    });
  }

  /**
   * Updates an existing contact in the organization-wide address book. Only
   * the contact owner or an org owner can update contacts.
   *
   * Updates will overwrite the existing value of the field.
   *
   * @param contactId The contact to update.
   * @param request The fields to update.
   * @returns The updated contact.
   */
  async contactUpdate(contactId: string, request: UpdateContactRequest): Promise<ContactInfo> {
    const o = op("/v0/org/{org_id}/contacts/{contact_id}", "patch");

    return this.exec(o, {
      params: { path: { contact_id: contactId } },
      body: request,
    });
  }

  // #endregion

  // #region ROLES: roleCreate, roleRead, roleUpdate, roleDelete, rolesList

  /**
   * Create a new role.
   *
   * @param name The optional name of the role.
   * @returns The ID of the new role.
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
   *
   * @param roleId The id of the role to get.
   * @returns The role.
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
   * @param roleId The ID of the role to update.
   * @param request The update request.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The updated role information.
   */
  async roleUpdate(
    roleId: string,
    request: UpdateRoleRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<RoleInfo>> {
    const o = op("/v0/org/{org_id}/roles/{role_id}", "patch");
    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { role_id: roleId } },
        body: request,
        headers,
      });
    return await CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * Delete a role by its ID.
   *
   * @param roleId The ID of the role to delete.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns A response which can be used to approve MFA if needed
   */
  async roleDelete(roleId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/roles/{role_id}", "delete");

    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { role_id: roleId } },
        headers,
      });
    return await CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * List all roles in the org.
   *
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over roles.
   */
  rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo[]> {
    const o = op("/v0/org/{org_id}/roles", "get");
    return Paginator.items(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query } }),
      (r) => r.roles,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region ROLE KEYS: roleKeysAdd, roleKeysDelete, roleKeysList, roleKeyGet

  /**
   * Add existing keys to an existing role.
   *
   * @param roleId The ID of the role
   * @param keyIds The IDs of the keys to add to the role.
   * @param policy The optional policy to apply to each key.
   * @param mfaReceipt Optional MFA receipt(s)
   *
   * @returns A CubeSignerResponse indicating success or failure.
   */
  async roleKeysAdd(
    roleId: string,
    keyIds: string[],
    policy?: KeyPolicy,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/add_keys", "put");

    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { role_id: roleId } },
        body: {
          key_ids: keyIds,
          policy,
        },
        headers,
      });

    return CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * Remove an existing key from an existing role.
   *
   * @param roleId The ID of the role
   * @param keyId The ID of the key to remove from the role
   * @param mfaReceipt Optional MFA receipt(s)
   *
   * @returns A CubeSignerResponse indicating success or failure.
   */
  async roleKeysRemove(
    roleId: string,
    keyId: string,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "delete");

    const reqFn = (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { role_id: roleId, key_id: keyId } },
        headers,
      });

    return CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * List all keys in a role.
   *
   * @param roleId The ID of the role whose keys to retrieve.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over the keys in the role.
   */
  roleKeysList(roleId: string, page?: PageOpts): Paginator<ListRoleKeysResponse, KeyInRoleInfo[]> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/keys", "get");

    return Paginator.items(
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

  /**
   * Get a key in a role by its ID.
   *
   * @param roleId The ID of the role.
   * @param keyId The ID of the key to get.
   * @param opts Optional options for getting the key.
   * @returns The key with policies information.
   */
  roleKeyGet(
    roleId: string,
    keyId: string,
    opts?: GetRoleKeyOptions,
  ): Promise<KeyWithPoliciesInfo> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "get");

    return this.exec(o, {
      params: {
        path: { role_id: roleId, key_id: keyId },
        query: opts,
      },
    });
  }

  // #endregion

  // #region ROLE USERS: roleUserAdd, roleUserRemove, roleUsersList

  /**
   * Add an existing user to an existing role.
   *
   * @param roleId The ID of the role.
   * @param userId The ID of the user to add to the role.
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
   * @param roleId The ID of the role.
   * @param userId The ID of the user to remove from the role.
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
   * @param roleId The ID of the role whose users to retrieve.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over the users in the role.
   */
  roleUsersList(
    roleId: string,
    page?: PageOpts,
  ): Paginator<ListRoleUsersResponse, UserInRoleInfo[]> {
    const o = op("/v0/org/{org_id}/roles/{role_id}/users", "get");

    return Paginator.items(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query, path: { role_id: roleId } } }),
      (r) => r.users,
      (r) => r.last_evaluated_key,
    );
  }

  // #endregion

  // #region POLICY: policy(Create|Get|List|Update|Delete|Invoke|Secrets)

  /**
   * Create a new named policy.
   *
   * @param name The name of the policy.
   * @param type The type of the policy.
   * @param rules The policy rules.
   * @returns The the new policy's info.
   */
  async policyCreate(
    name: string,
    type: PolicyType,
    rules: KeyPolicy | RolePolicy | { hash: string }[],
  ): Promise<PolicyInfo> {
    const o = op("/v0/org/{org_id}/policies", "post");
    return await this.exec(o, {
      body: {
        name,
        policy_type: type,
        rules,
      },
    });
  }

  /**
   * Get a named policy by its name or id.
   *
   * @param policyId The name or id of the policy to get.
   * @param version The policy version to get.
   * @returns The policy.
   */
  async policyGet(policyId: string, version: policy.Version): Promise<PolicyInfo> {
    const o = op("/v0/org/{org_id}/policies/{policy_id}/{version}", "get");
    return this.exec(o, {
      params: { path: { policy_id: policyId, version } },
    });
  }

  /**
   * List all named policies in the org.
   *
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over policies.
   */
  policiesList(page?: PageOpts): Paginator<ListPoliciesResponse, PolicyInfo[]> {
    const o = op("/v0/org/{org_id}/policies", "get");
    return Paginator.items(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query } }),
      (r) => r.policies,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Update a named policy.
   *
   * @param policyId The name or id of the policy to update.
   * @param request The update request.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns The updated policy information.
   */
  async policyUpdate(
    policyId: string,
    request: UpdatePolicyRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<PolicyInfo>> {
    const o = op("/v0/org/{org_id}/policies/{policy_id}", "patch");
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { policy_id: policyId } },
        body: request,
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Delete a named policy.
   *
   * @param policyId The name or id of the policy to delete.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns An empty response.
   */
  async policyDelete(
    policyId: string,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/policies/{policy_id}", "delete");
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { policy_id: policyId } },
        headers,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Invoke a named policy.
   *
   * @param policyId The name or id of the policy to invoke.
   * @param version The policy version to invoke.
   * @param request The invoke request.
   * @returns The result of invoking the policy.
   */
  async policyInvoke(
    policyId: string,
    version: string,
    request: InvokePolicyRequest,
  ): Promise<InvokePolicyResponse> {
    const o = op("/v0/org/{org_id}/policies/{policy_id}/{version}/invoke", "post");
    return this.exec(o, {
      params: { path: { policy_id: policyId, version } },
      body: request,
    });
  }

  // #endregion

  // #region WASM: wasm(PolicyUpload)

  /**
   * Request an upload URL for uploading a Wasm policy object.
   *
   * @param request The policy upload request.
   * @returns The response containing the URL for uploading the policy.
   */
  async wasmPolicyUpload(request: UploadWasmPolicyRequest): Promise<UploadWasmPolicyResponse> {
    const o = op("/v0/org/{org_id}/policy/wasm", "post");
    return this.exec(o, {
      body: request,
    });
  }

  // #endregion

  // #region SESSIONS: session(Create|CreateForRole|Refresh|Revoke|List|KeysList)

  /**
   * Create new user session (management and/or signing). The lifetime of
   * the new session is silently truncated to that of the current session.
   *
   * @param purpose The purpose of the session
   * @param scopes Session scopes.
   * @param lifetimes Lifetime settings
   * @returns New signer session info.
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
   * @param purpose The purpose of the session
   * @param scopes Session scopes.
   * @param lifetime Lifetime settings
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns New signer session info.
   */
  async sessionCreateExtended(
    purpose: string,
    scopes: Scope[],
    lifetime: SessionLifetime,
    mfaReceipt?: MfaReceipts,
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
   * @param roleId Role ID
   * @param purpose The purpose of the session
   * @param scopes Session scopes. Not all scopes are valid for a role.
   * @param lifetimes Lifetime settings
   * @returns New signer session info.
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
   * @param sessionId The ID of the session to revoke. This session by default
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
   * @param selector Which sessions to revoke. If not defined, all the current user's sessions will be revoked.
   */
  async sessionRevokeAll(selector?: SessionSelector) {
    const o = op("/v0/org/{org_id}/session", "delete");
    const query = typeof selector === "string" ? { role: selector } : selector;
    await this.exec(o, {
      params: { query },
    });
  }

  /**
   * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
   *
   * @param selector If set, limit to sessions for a specified user or a role.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Signer sessions for this role.
   */
  sessionsList(
    selector?: SessionSelector,
    page?: PageOpts,
  ): Paginator<SessionsResponse, SessionInfo[]> {
    const o = op("/v0/org/{org_id}/session", "get");
    const selectorQuery = typeof selector === "string" ? { role: selector } : selector;
    return Paginator.items(
      page ?? Page.default(),
      (query) => this.exec(o, { params: { query: { ...selectorQuery, ...query } } }),
      (r) => r.sessions,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Returns the list of keys that this session has access to.
   *
   * @returns The list of keys.
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
   * @returns Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const o = op("/v0/org/{org_id}/identity/prove", "post");

    return this.exec(o, {});
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param proof The proof of authentication.
   * @throws An error if proof is invalid
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
   * @param body The request body, containing an OIDC token to prove the identity ownership.
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns Empty or MFA approval request
   */
  async identityAdd(
    body: AddIdentityRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<Empty>> {
    const o = op("/v0/org/{org_id}/identity", "post");
    const reqFn = (headers?: HeadersInit) => this.exec(o, { body, headers });
    return await CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
  }

  /**
   * Removes an OIDC identity from the current user's account.
   *
   * @param body The identity to remove.
   */
  async identityRemove(body: OidcIdentity) {
    const o = op("/v0/org/{org_id}/identity", "delete");
    await this.exec(o, { body });
  }

  /**
   * Lists associated OIDC identities with the current user.
   *
   * @returns Associated identities
   */
  async identityList(): Promise<ListIdentityResponse> {
    const o = op("/v0/org/{org_id}/identity", "get");
    return await this.exec(o, {});
  }

  // #endregion

  // #region MFA: mfaGet, mfaList, mfaApprove, mfaList, mfaApprove, mfaApproveTotp, mfaApproveFido(Init|Complete), mfaVoteEmail(Init|Complete)

  /**
   * Retrieves existing MFA request.
   *
   * @param mfaId MFA request ID
   * @returns MFA request information
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
   * @returns The MFA requests.
   */
  async mfaList(): Promise<MfaRequestInfo[]> {
    const o = op("/v0/org/{org_id}/mfa", "get");

    const { mfa_requests } = await this.exec(o, {});
    return mfa_requests;
  }

  /**
   * Approve or reject a pending MFA request using the current session.
   *
   * @param mfaId The id of the MFA request
   * @param mfaVote Approve or reject the MFA request
   * @returns The result of the MFA request
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
   * @param mfaId The ID of the MFA request
   * @param code The TOTP code
   * @param mfaVote Approve or reject the MFA request
   * @returns The current status of the MFA request
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
   * @param mfaId The MFA request ID.
   * @returns A challenge that needs to be answered to complete the approval.
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
   * @param mfaId The MFA request ID
   * @param mfaVote Approve or reject the MFA request
   * @param challengeId The ID of the challenge issued by {@link mfaFidoInit}
   * @param credential The answer to the challenge
   * @returns The current status of the MFA request.
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

  /**
   * Initiate MFA approval via email OTP.
   *
   * @param mfaId The MFA request ID
   * @param mfaVote Approve or reject the MFA request
   * @returns A challenge that needs to be answered to complete the approval.
   */
  async mfaVoteEmailInit(mfaId: string, mfaVote: MfaVote): Promise<MfaEmailChallenge> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}/email", "post");
    const challenge = await this.exec(o, {
      params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
    });
    return new MfaEmailChallenge(this, mfaId, challenge);
  }

  /**
   * Complete a previously initiated (via {@link mfaVoteEmailInit}) MFA vote request using email OTP.
   *
   * Instead of calling this method directly, prefer {@link MfaEmailChallenge.answer} or
   * {@link MfaFidoChallenge.createCredentialAndAnswer}.
   *
   * @param mfaId The MFA request ID
   * @param partialToken The partial token returned by {@link mfaVoteEmailInit}
   * @param signature The one-time code (signature in this case) sent via email
   * @returns The current status of the MFA request.
   */
  async mfaVoteEmailComplete(
    mfaId: string,
    partialToken: string,
    signature: string,
  ): Promise<MfaRequestInfo> {
    const o = op("/v0/org/{org_id}/mfa/{mfa_id}/email", "patch");
    return await this.exec(o, {
      params: { path: { mfa_id: mfaId } },
      body: { token: `${partialToken}${signature}` },
    });
  }

  // #endregion

  // #region SIGN: signEvm, signEth2, signStake, signUnstake, signAva, signSerializedAva, signBlob, signBtc, signTaproot, signSolana, signEots, eotsCreateNonce, signMmi, signSui

  /**
   * Sign an EVM transaction.
   *
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns Signature (or MFA approval request).
   */
  async signEvm(
    key: Key | string,
    req: EvmSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns Signature (or MFA approval request).
   */
  async signEip191(
    key: Key | string,
    req: Eip191SignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns Signature (or MFA approval request).
   */
  async signEip712(
    key: Key | string,
    req: Eip712SignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns Signature
   */
  async signEth2(
    key: Key | string,
    req: Eth2SignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param req The request to sign.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns The response.
   */
  async signStake(
    req: Eth2StakeRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req The request to sign.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns The response.
   */
  async signUnstake(
    key: Key | string,
    req: Eth2UnstakeRequest,
    mfaReceipt?: MfaReceipts,
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
   *
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param tx Avalanche message (transaction) to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signAva(
    key: Key | string,
    tx: AvaTx,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param avaChain Avalanche chain
   * @param tx Hex encoded transaction
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSerializedAva(
    key: Key | string,
    avaChain: AvaChain,
    tx: string,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBlob(
    key: Key | string,
    req: BlobSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBtc(
    key: Key | string,
    req: BtcSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBtcMessage(
    key: Key | string,
    req: BtcMessageSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signTaproot(
    key: Key | string,
    req: TaprootSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signPsbt(
    key: Key | string,
    req: PsbtSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signEots(
    key: Key | string,
    req: EotsSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What and how many nonces to create
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async eotsCreateNonce(
    key: Key | string,
    req: EotsCreateNonceRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param key The key to sign with (either {@link Key} or its material ID). For a deposit, this can be either a Segwit or a Taproot key. For any other request type, this just be a Taproot key.
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBabylonStakingTxn(
    key: Key | string,
    req: BabylonStakingRequest,
    mfaReceipt?: MfaReceipts,
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
   * Sign a Babylon staking registration request.
   *
   * @param key The Taproot key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signBabylonRegistration(
    key: Key | string,
    req: BabylonRegistrationRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<BabylonRegistrationResponse>> {
    const o = op("/v0/org/{org_id}/babylon/registration/{pubkey}", "post");
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
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param req What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSolana(
    key: Key | string,
    req: SolanaSignRequest,
    mfaReceipt?: MfaReceipts,
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
   * @param message the message info.
   * @param mfaReceipt optional MFA receipt(s).
   * @returns the updated message.
   */
  async signMmi(
    message: PendingMessageInfo,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<PendingMessageSignResponse>> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/sign", "post");
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { msg_id: message.id } },
        headers,
        body: message,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }

  /**
   * Sign a SUI transaction.
   *
   * @param key The key to sign with (either {@link Key} or its material ID).
   * @param request What to sign
   * @param mfaReceipt Optional MFA receipt(s)
   * @returns The response.
   */
  async signSui(
    key: Key | string,
    request: SuiSignRequest,
    mfaReceipt?: MfaReceipts,
  ): Promise<CubeSignerResponse<SuiSignResponse>> {
    const o = op("/v0/org/{org_id}/sui/sign/{pubkey}", "post");
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) =>
      this.exec(o, {
        params: { path: { pubkey } },
        headers,
        body: request,
      });
    return await CubeSignerResponse.create(this.env, signFn, mfaReceipt);
  }
  // #endregion

  // #region USER EXPORT: userExport(Init,Complete,List,Delete)
  /**
   * List outstanding user-export requests.
   *
   * @param keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
   * @param userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
   * @param page Pagination options. Defaults to fetching the entire result set.
   * @returns Paginator for iterating over the result set.
   */
  userExportList(
    keyId?: string,
    userId?: string,
    page?: PageOpts,
  ): Paginator<UserExportListResponse, UserExportInitResponse[]> {
    const o = op("/v0/org/{org_id}/user/me/export", "get");
    return Paginator.items(
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
   * @param keyId The key-id corresponding to the user-export request to delete.
   * @param userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
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
   * @param keyId The key-id for which to initiate an export.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns The response.
   */
  async userExportInit(
    keyId: string,
    mfaReceipt?: MfaReceipts,
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
   * @param keyId The key-id for which to initiate an export.
   * @param publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
   * @param mfaReceipt Optional MFA receipt(s).
   * @returns The response.
   */
  async userExportComplete(
    keyId: string,
    publicKey: CryptoKey,
    mfaReceipt?: MfaReceipts,
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
   * @returns A fresh key-import key
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
   * @param body An encrypted key-import request.
   * @returns The newly imported keys.
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
   * @param method The name of the method to call.
   * @param params The list of method parameters.
   * @returns the return value of the method.
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
   * @returns The list of pending MMI messages.
   */
  async mmiList(): Promise<PendingMessageInfo[]> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages", "get");
    const { pending_messages } = await this.exec(o, {});
    return pending_messages as PendingMessageInfo[];
  }

  /**
   * Get a pending MMI message by its ID.
   *
   * @param msgId The ID of the pending message.
   * @returns The pending MMI message.
   */
  async mmiGet(msgId: string): Promise<PendingMessageInfo> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "get");
    return await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  /**
   * Delete the MMI message with the given ID.
   *
   * @param msgId the ID of the MMI message.
   */
  async mmiDelete(msgId: string): Promise<void> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "delete");
    await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  /**
   * Reject the MMI message with the given ID.
   *
   * @param msgId the ID of the MMI message.
   * @returns The message with updated information
   */
  async mmiReject(msgId: string): Promise<PendingMessageInfo> {
    const o = op("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/reject", "post");
    return await this.exec(o, { params: { path: { msg_id: msgId } } });
  }

  // #endregion

  /**
   * Returns public org information.
   *
   * @param env The environment to log into
   * @param orgId The org to log into
   * @returns Public org information
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
   * Sends an email to the given address with a list of orgs the user is a member of.
   *
   * @param env The environment to use
   * @param email The user's email
   * @returns Empty response
   */
  static async emailMyOrgs(env: EnvInterface, email: string) {
    const o = op("/v0/email/orgs", "get");
    return await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { query: { email } },
      }),
    ).then(assertOk);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   *
   * @param env The environment to log into
   * @param orgId The org to log into.
   * @param token The OIDC token to exchange
   * @param scopes The scopes for the new session
   * @param lifetimes Lifetimes of the new session.
   * @param mfaReceipt Optional MFA receipt(s)
   * @param purpose Optional session description.
   * @returns The session data.
   */
  static async oidcSessionCreate(
    env: EnvInterface,
    orgId: string,
    token: string,
    scopes: Array<Scope>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipts,
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

      return mapResponse(data, (sessionInfo): SessionData => {
        return {
          env: {
            ["Dev-CubeSignerStack"]: env,
          },
          org_id: orgId,
          token: sessionInfo.token,
          refresh_token: sessionInfo.refresh_token,
          session_exp: sessionInfo.expiration,
          purpose: "sign in via oidc",
          session_info: sessionInfo.session_info,
        };
      });
    };

    return await CubeSignerResponse.create(env, loginFn, mfaReceipt);
  }

  /**
   * Initiate the login with passkey flow.
   *
   * @param env The environment to log into
   * @param body The login request
   * @returns The challenge that must be answered (see {@link passkeyLoginComplete}) to log in.
   */
  static async passkeyLoginInit(
    env: EnvInterface,
    body: LoginRequest,
  ): Promise<PasskeyLoginChallenge> {
    const o = op("/v0/passkey", "post");
    const resp = await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        body,
      }),
    ).then(assertOk);
    return new PasskeyLoginChallenge(env, resp, body.purpose);
  }

  /**
   * Answer the login with passkey challenge returned from {@link passkeyLoginInit}.
   *
   * @param env The environment to log into
   * @param body The request body
   * @param purpose Optional descriptive session purpose
   * @returns The session data
   */
  static async passkeyLoginComplete(
    env: EnvInterface,
    body: PasskeyAssertAnswer,
    purpose?: string | null,
  ): Promise<SessionData> {
    const o = op("/v0/passkey", "patch");
    const resp = await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        body,
      }),
    ).then(assertOk);
    return {
      env: {
        ["Dev-CubeSignerStack"]: env,
      },
      org_id: resp.org_id!, // 'org_id' is always set from this endpoint
      token: resp.token,
      refresh_token: resp.refresh_token,
      session_exp: resp.expiration,
      purpose: purpose ?? "sign in via passkey",
      session_info: resp.session_info,
    };
  }

  /**
   * Accept an invitation to join a CubeSigner org.
   *
   * @param env The environment to log into
   * @param orgId The id of the organization
   * @param body The request body
   */
  static async idpAcceptInvite(
    env: EnvInterface,
    orgId: string,
    body: InvitationAcceptRequest,
  ): Promise<void> {
    const o = op("/v0/org/{org_id}/invitation/accept", "post");
    await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body,
      }),
    ).then(assertOk);
  }

  /**
   * Unauthenticated endpoint for authenticating with email/password.
   *
   * @param env The environment to log into
   * @param orgId The id of the organization
   * @param body The request body
   * @returns Returns an OIDC token which can be used
   *   to log in via OIDC (see {@link oidcSessionCreate}).
   */
  static async idpAuthenticate(
    env: EnvInterface,
    orgId: string,
    body: AuthenticationRequest,
  ): Promise<AuthenticationResponse> {
    const o = op("/v0/org/{org_id}/idp/authenticate", "post");
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
   * @param env The environment to log into
   * @param orgId The id of the organization
   * @param body The request body
   * @returns Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
   */
  static async idpPasswordResetRequest(
    env: EnvInterface,
    orgId: string,
    body: PasswordResetRequest,
  ): Promise<EmailOtpResponse> {
    const o = op("/v0/org/{org_id}/idp/password_reset", "post");
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
   * @param env The environment to log into
   * @param orgId The id of the organization
   * @param partialToken The partial token returned by {@link passwordResetRequest}
   * @param signature The one-time code (signature in this case) sent via email
   * @param newPassword The new password
   */
  static async idpPasswordResetConfirm(
    env: EnvInterface,
    orgId: string,
    partialToken: string,
    signature: string,
    newPassword: string,
  ): Promise<void> {
    const o = op("/v0/org/{org_id}/idp/password_reset", "patch");
    await retryOn5XX(() =>
      o({
        baseUrl: env.SignerApiRoot,
        params: { path: { org_id: orgId } },
        body: {
          token: `${partialToken}${signature}`,
          new_password: newPassword,
        },
      }),
    ).then(assertOk);
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @param env The environment to log into
   * @param orgId The org id in which to generate proof
   * @param token The oidc token
   * @returns Proof of authentication
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
   * @param env The environment to log into
   * @param token The oidc token identifying the user
   * @returns The organization the user belongs to
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
   * @param info The info to post-process
   * @returns The processed user info
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
   * @param info The info to post-process
   * @returns The processed user info
   */
  static #processUserInOrgInfo(info: UserInOrgInfo): UserInOrgInfo {
    if (info.email === EMAIL_NOT_FOUND) {
      info.email = null;
    }
    return info;
  }

  // #region AUTH MIGRATION: migrate(Add|Remove)Identities

  /**
   * Associate OIDC identities with arbitrary users in org.
   *
   * <b>NOTE</b>: This operation is available only while your org is in
   * migration mode and not configurable.
   *
   * @internal
   * @param body The identities to add
   * @throws On server-side error
   * @returns Nothing
   */
  async migrateAddIdentities(body: schemas["MigrateIdentityRequest"]) {
    const o = op("/v0/org/{org_id}/auth_migration/add_identity", "post");
    return this.exec(o, { body });
  }

  /**
   * Dissociate OIDC identities from arbitrary users in org
   *
   * <b>NOTE</b>: This operation is available only while your org is in
   * migration mode and not configurable.
   *
   * @internal
   * @param body The identities to remove.
   * @throws On server-side error
   * @returns Nothing
   */
  async migrateRemoveIdentities(body: schemas["MigrateIdentityRequest"]) {
    const o = op("/v0/org/{org_id}/auth_migration/remove_identity", "post");
    return this.exec(o, { body });
  }

  /**
   * Update existing users' profiles. Currently supports only (re)setting emails.
   *
   * <b>NOTE</b>: This operation is available only while your org is in
   * migration mode and not configurable.
   *
   * @internal
   * @param body The users whose profiles to update
   * @returns Nothing
   */
  async migrateUserProfiles(body: schemas["MigrateUpdateUsersRequest"]) {
    const o = op("/v0/org/{org_id}/auth_migration/update_users", "post");
    return this.exec(o, { body });
  }
  // #endregion
}

const defaultSignerSessionLifetime: SessionLifetime = {
  session: 604800, // 1 week
  auth: 300, // 5 min
  refresh: 86400, // 1 day
  grace: 30, // seconds
};
