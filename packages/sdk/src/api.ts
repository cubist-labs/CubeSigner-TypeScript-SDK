import createClient, {
  FetchOptions,
  FetchResponse,
  FilterKeys,
  HttpMethod,
  PathsWith,
} from "openapi-fetch";
import { paths, operations } from "./schema";
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
  ListKeyRolesResponse,
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
  UserInOrgInfo,
  UserInRoleInfo,
  UserInfo,
  SessionInfo,
  OrgInfo,
  RatchetConfig,
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
  AvaTx,
  MfaRequestInfo,
  MfaVote,
  MemberRole,
  UserExportCompleteResponse,
  UserExportInitResponse,
  UserExportListResponse,
  Empty,
  ErrorResponse,
} from "./schema_types";
import { delay, encodeToBase64 } from "./util";
import { AddFidoChallenge, MfaFidoChallenge, MfaReceipt, TotpChallenge } from "./mfa";
import { CubeSignerResponse, mapResponse } from "./response";
import { ErrResponse } from "./error";
import { Key, KeyType } from "./key";
import { Page, PageOpts, PageQueryArgs, Paginator } from "./paginator";
import { KeyPolicy } from "./role";
import { EnvInterface } from "./env";
import { loadSubtleCrypto } from "./user_export";
import { EventEmitter } from "./events";
import { NAME, KeyProperties, VERSION } from "./index";

/** @internal */
export type Client = ReturnType<typeof createClient<paths>>;

export { paths, operations };

/**
 * Omit routes in {@link T} whose methods are all 'never'
 */
type OmitNeverPaths<T extends paths> = {
  /* eslint-disable-next-line no-unused-vars */ // 'm', but it's needed
  [p in keyof T as T[p] extends { [m in keyof T[p]]: never } ? never : p]: T[p];
};

/**
 * Filter out methods that don't match operation {@link Op}
 */
type FilterPaths<Op extends keyof operations> = {
  [p in keyof paths]: {
    [m in HttpMethod as m extends keyof paths[p] ? m : never]: m extends keyof paths[p]
      ? operations[Op] extends paths[p][m]
        ? paths[p][m] extends operations[Op]
          ? operations[Op]
          : never
        : never
      : never;
  };
};

type Paths<Op extends keyof operations> = OmitNeverPaths<FilterPaths<Op>>;

/**
 * Open-fetch client restricted to the route that corresponds to operation {@link Op}
 */
export type FetchClient<Op extends keyof operations> = ReturnType<typeof createClient<Paths<Op>>>;

/**
 * Type alias for the type of the response body (the "data" field of
 * {@link FetchResponse<T>}) when that response is successful.
 */
export type FetchResponseSuccessData<T> = Required<FetchResponse<T>>["data"];

/**
 * Internal type for a function that returns a promise of a fetch response.
 */
type ReqFn<T> = () => Promise<FetchResponse<T>>;

/**
 * Retry settings.
 *
 * By default, {@link OpClient} retries on 5xx codes with delays of
 * 100ms, 200ms, and 400ms between retries.
 */
export interface RetrySettings {
  /** HTTP status codes on which to retry */
  codes: number[];
  /** Delays in milliseconds between retries */
  delaysMs: number[];
}

/**
 * Wrapper around an open-fetch client restricted to a single operation.
 * The restriction applies only when type checking, the actual
 * client does not restrict anything at runtime.
 * client does not restrict anything at runtime
 */
export class OpClient<Op extends keyof operations> {
  readonly #op: Op;
  readonly #client: FetchClient<Op>;
  readonly #eventEmitter: EventEmitter;
  readonly #retry: RetrySettings;

  /**
   * @param {Op} op The operation this client should be restricted to
   * @param {FetchClient<Op> | Client} client open-fetch client (either restricted to {@link Op} or not)
   * @param {EventEmitter} eventEmitter The client-local event dispatcher.
   * @param {number[]} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
   *  after the first failed attempt, 200ms after the second, and finally 400ms after the third,
   */
  constructor(
    op: Op,
    client: FetchClient<Op> | Client,
    eventEmitter: EventEmitter,
    retrySettings?: RetrySettings,
  ) {
    this.#op = op;
    this.#client = client as FetchClient<Op>; // either works
    this.#eventEmitter = eventEmitter;
    this.#retry = retrySettings ?? {
      codes: [...Array(100).keys()].map((i) => 500 + i),
      delaysMs: [100, 200, 400],
    };
  }

  /** The operation this client is restricted to */
  get op() {
    return this.#op;
  }

  /**
   * Inspects the response and returns the response body if the request was successful.
   * Otherwise, dispatches the error to event listeners, then throws {@link ErrResponse}.
   *
   * @param {FetchResponse<T>} resp The response to check
   * @return {FetchResponseSuccessData<T>} The response data corresponding to response type {@link T}.
   */
  private async assertOk<T>(resp: FetchResponse<T>): Promise<FetchResponseSuccessData<T>> {
    if (resp.error) {
      const errResp = resp.error as unknown as ErrorResponse | undefined;
      const error = new ErrResponse({
        operation: this.op,
        requestId: errResp?.request_id,
        message: errResp?.message,
        statusText: resp.response?.statusText,
        status: resp.response?.status,
        url: resp.response?.url,
        errorCode: errResp?.error_code,
      });
      await this.#eventEmitter.classifyAndEmitError(error);
      throw error;
    }
    if (resp.data === undefined) {
      throw new Error("Response data is undefined");
    }
    return resp.data;
  }

  /**
   * @param {number[]} delaysMs Delays in milliseconds between retries.
   * @return {OpClient<Op>} Returns the same client as this except with different retry delays.
   */
  withRetries(delaysMs: number[]): OpClient<Op> {
    return this.withRetrySettings({
      codes: this.#retry.codes,
      delaysMs,
    });
  }

  /**
   * @param {RetrySettings} retrySettings New retry settings
   * @return {OpClient<Op>} Returns the same client as this except with different retry settings.
   */
  withRetrySettings(retrySettings: RetrySettings): OpClient<Op> {
    return new OpClient(this.op, this.#client, this.#eventEmitter, retrySettings);
  }

  // not private only so that the test can call it
  /**
   * Internal.
   *
   * Executes a given request, potentially retrying on 5xx errors. The
   * retry configuration can be set via the constructor.
   * On all other errors, throws {@link ErrResponse} (as well as after exhausting all retries).
   * On success, returns the response body.
   *
   * @param {ReqFn<T>} req The request to execute and then retry on 5xx errors
   * @return {Promise<FetchResponseSuccessData<T>>}
   * @internal
   */
  async execute<T>(req: ReqFn<T>): Promise<FetchResponseSuccessData<T>> {
    let resp = await req();
    let i = 0;
    while (this.#retry.codes.includes(resp.response?.status) && i < this.#retry.delaysMs.length) {
      await delay(this.#retry.delaysMs[i]);
      resp = await req();
      i++;
    }
    return await this.assertOk(resp);
  }

  /* eslint-disable valid-jsdoc */

  /**
   * Invoke HTTP GET
   */
  async get(
    url: PathsWith<Paths<Op>, "get">,
    init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "get">], "get">>,
  ) {
    return await this.execute(() => this.#client.get(url, init));
  }

  /** Invoke HTTP POST */
  async post(
    url: PathsWith<Paths<Op>, "post">,
    init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "post">], "post">>,
  ) {
    return await this.execute(() => this.#client.post(url, init));
  }

  /** Invoke HTTP PATCH */
  async patch(
    url: PathsWith<Paths<Op>, "patch">,
    init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "patch">], "patch">>,
  ) {
    return await this.execute(() => this.#client.patch(url, init));
  }

  /** Invoke HTTP DELETE */
  async del(
    url: PathsWith<Paths<Op>, "delete">,
    init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "delete">], "delete">>,
  ) {
    return await this.execute(() => this.#client.del(url, init));
  }

  /** Invoke HTTP PUT */
  async put(
    url: PathsWith<Paths<Op>, "put">,
    init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "put">], "put">>,
  ) {
    return await this.execute(() => this.#client.put(url, init));
  }

  /* eslint-enable valid-jsdoc */
}

/**
 * Creates a new HTTP client, setting the "User-Agent" header to this package's {name}@{version}.
 *
 * @param {string} baseUrl The base URL of the client (e.g., "https://gamma.signer.cubist.dev")
 * @param {string} authToken The value to send as "Authorization" header.
 * @return {Client} The new HTTP client.
 */
export function createHttpClient(baseUrl: string, authToken: string): Client {
  return createClient<paths>({
    baseUrl,
    cache: "no-store",
    headers: {
      Authorization: authToken,
      ["User-Agent"]: `${NAME}@${VERSION}`,
      ["X-Cubist-Ts-Sdk"]: `${NAME}@${VERSION}`,
    },
  });
}

/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export class CubeSignerApi {
  readonly #orgId: string;
  readonly #sessionMgr: SignerSessionManager;
  readonly #eventEmitter: EventEmitter;
  readonly #retrySettings?: RetrySettings;

  /** Underlying session manager */
  get sessionMgr(): SignerSessionManager {
    return this.#sessionMgr;
  }

  /** Target environment */
  get env(): EnvInterface {
    return this.sessionMgr.env;
  }

  /**
   * Constructor.
   * @param {SignerSessionManager} sessionMgr The session manager to use
   * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
   * @param {RetrySettings} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
   *   after the first failed attempt, 200ms after the second, and finally 400ms after the third,
   */
  constructor(sessionMgr: SignerSessionManager, orgId?: string, retrySettings?: RetrySettings) {
    this.#sessionMgr = sessionMgr;
    this.#eventEmitter = new EventEmitter([sessionMgr.events]);
    this.#orgId = orgId ?? sessionMgr.orgId;
    this.#retrySettings = retrySettings;
  }

  /**
   * Returns a new instance of this class using the same session manager but targeting a different organization.
   *
   * @param {string} orgId The organization ID.
   * @return {CubeSignerApi} A new instance of this class using the same session manager but targeting different organization.
   */
  withOrg(orgId?: string): CubeSignerApi {
    return orgId ? new CubeSignerApi(this.#sessionMgr, orgId) : this;
  }

  /** Org id or name */
  get orgId() {
    return this.#orgId;
  }

  /**
   * HTTP client restricted to a single operation. The restriction applies only
   * when type checking, the actual client does not restrict anything at runtime.
   *
   * @param {Op} op The operation to restrict the client to
   * @return {Promise<OpClient<Op>>} The client restricted to {@link op}
   */
  private async client<Op extends keyof operations>(op: Op): Promise<OpClient<Op>> {
    const fetchClient = await this.#sessionMgr.client(op);
    return new OpClient(op, fetchClient, this.#eventEmitter, this.#retrySettings);
  }

  // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)

  /**
   * Obtain information about the current user.
   *
   * @return {Promise<UserInfo>} Retrieves information about the current user.
   */
  async userGet(): Promise<UserInfo> {
    if (`${this.orgId}` === "undefined") {
      const client = await this.client("aboutMeLegacy");
      return await client.get("/v0/about_me", {});
    } else {
      const client = await this.client("aboutMe");
      return await client.get("/v0/org/{org_id}/user/me", {
        params: { path: { org_id: this.orgId } },
      });
    }
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered either by calling {@link TotpChallenge.answer} (or
   * {@link CubeSignerApi.userTotpResetComplete}).
   *
   * @param {string} issuer Optional issuer; defaults to "Cubist"
   * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
   */
  async userTotpResetInit(
    issuer?: string,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<TotpChallenge>> {
    const resetTotpFn = async (headers?: HeadersInit) => {
      const client = await this.client("userResetTotpInit");
      const data = await client.post("/v0/org/{org_id}/user/me/totp", {
        headers,
        params: { path: { org_id: this.orgId } },
        body: issuer
          ? {
              issuer,
            }
          : null,
      });
      return mapResponse(data, (totpInfo) => new TotpChallenge(this, totpInfo));
    };
    return await CubeSignerResponse.create(resetTotpFn, mfaReceipt);
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
    const client = await this.client("userResetTotpComplete");
    await client.patch("/v0/org/{org_id}/user/me/totp", {
      params: { path: { org_id: this.orgId } },
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
    const client = await this.client("userVerifyTotp");
    await client.post("/v0/org/{org_id}/user/me/totp/verify", {
      params: { path: { org_id: this.orgId } },
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
    const deleteTotpFn = async (headers?: HeadersInit) => {
      const client = await this.client("userDeleteTotp");
      return await client.del("/v0/org/{org_id}/user/me/totp", {
        headers,
        params: { path: { org_id: this.orgId } },
        body: null,
      });
    };
    return await CubeSignerResponse.create(deleteTotpFn, mfaReceipt);
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
    const addFidoFn = async (headers?: HeadersInit) => {
      const client = await this.client("userRegisterFidoInit");
      const data = await client.post("/v0/org/{org_id}/user/me/fido", {
        headers,
        params: { path: { org_id: this.orgId } },
        body: { name },
      });
      return mapResponse(data, (c) => new AddFidoChallenge(this, c));
    };
    return await CubeSignerResponse.create(addFidoFn, mfaReceipt);
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
    const client = await this.client("userRegisterFidoComplete");
    await client.patch("/v0/org/{org_id}/user/me/fido", {
      params: { path: { org_id: this.orgId } },
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
    const deleteFidoFn = async (headers?: HeadersInit) => {
      const client = await this.client("userDeleteFido");
      return await client.del("/v0/org/{org_id}/user/me/fido/{fido_id}", {
        headers,
        params: { path: { org_id: this.orgId, fido_id: fidoId } },
        body: null,
      });
    };
    return await CubeSignerResponse.create(deleteFidoFn, mfaReceipt);
  }

  // #endregion

  // #region ORGS: orgGet, orgUpdate

  /**
   * Obtain information about the current organization.
   * @return {OrgInfo} Information about the organization.
   */
  async orgGet(): Promise<OrgInfo> {
    const client = await this.client("getOrg");
    return await client.get("/v0/org/{org_id}", {
      params: { path: { org_id: this.orgId } },
    });
  }

  /**
   * Update the org.
   * @param {UpdateOrgRequest} request The JSON request to send to the API server.
   * @return {UpdateOrgResponse} Updated org information.
   */
  async orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse> {
    const client = await this.client("updateOrg");
    return await client.patch("/v0/org/{org_id}", {
      params: { path: { org_id: this.orgId } },
      body: request,
    });
  }

  // #endregion

  // #region ORG USERS: orgUserInvite, orgUsersList, orgUserCreateOidc, orgUserDeleteOidc

  /**
   * Create a new (first-party) user in the organization and send an email invitation to that user.
   *
   * @param {string} email Email of the user
   * @param {string} name The full name of the user
   * @param {MemberRole} role Optional role. Defaults to "alien".
   */
  async orgUserInvite(email: string, name: string, role?: MemberRole): Promise<void> {
    const client = await this.client("invite");
    await client.post("/v0/org/{org_id}/invite", {
      params: { path: { org_id: this.orgId } },
      body: {
        email,
        name,
        role,
        skip_email: false,
      },
    });
  }

  /**
   * List users.
   * @return {User[]} Org users.
   */
  async orgUsersList(): Promise<UserInOrgInfo[]> {
    const client = await this.client("listUsersInOrg");
    const resp = await client.get("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.orgId } },
    });
    return resp.users;
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
    const client = await this.client("createOidcUser");
    const data = await client.post("/v0/org/{org_id}/users", {
      params: { path: { org_id: this.orgId } },
      body: {
        identity,
        role: opts.memberRole ?? "Alien",
        email,
        name: opts.name,
        mfa_policy: opts.mfaPolicy,
      },
    });
    return data.user_id;
  }

  /**
   * Delete an existing OIDC user.
   * @param {OidcIdentity} identity The identity of the OIDC user
   */
  async orgUserDeleteOidc(identity: OidcIdentity) {
    const client = await this.client("deleteOidcUser");
    return await client.del("/v0/org/{org_id}/users/oidc", {
      params: { path: { org_id: this.orgId } },
      body: identity,
    });
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
    const client = await this.client("getKeyInOrg");
    return await client.get("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
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
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listKeyRoles");
      return await client.get("/v0/org/{org_id}/keys/{key_id}/roles", {
        params: {
          path: { org_id: this.orgId, key_id: keyId },
          query,
        },
      });
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
      (r) => r.roles,
      (r) => r.last_evaluated_key,
    );
  }

  /**
   * Update key.
   * @param {string} keyId The ID of the key to update.
   * @param {UpdateKeyRequest} request The JSON request to send to the API server.
   * @return {KeyInfoApi} The JSON response from the API server.
   */
  async keyUpdate(keyId: string, request: UpdateKeyRequest): Promise<KeyInfoApi> {
    const client = await this.client("updateKey");
    return await client.patch("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
      body: request,
    });
  }

  /**
   * Deletes a key.
   *
   * @param {string} keyId - Key id
   */
  async keyDelete(keyId: string) {
    const client = await this.client("deleteKey");
    await client.del("/v0/org/{org_id}/keys/{key_id}", {
      params: { path: { org_id: this.orgId, key_id: keyId } },
    });
  }

  /**
   * Create new signing keys.
   *
   * @param {KeyType} keyType The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @param {KeyProperties?} props Additional key properties
   * @return {KeyInfoApi[]} The new keys.
   */
  async keysCreate(
    keyType: KeyType,
    count: number,
    ownerId?: string,
    props?: KeyProperties,
  ): Promise<KeyInfoApi[]> {
    const chain_id = 0; // not used anymore
    const client = await this.client("createKey");
    const data = await client.post("/v0/org/{org_id}/keys", {
      params: { path: { org_id: this.orgId } },
      body: {
        count,
        chain_id,
        key_type: keyType,
        ...props,
        owner: props?.owner ?? ownerId,
      },
    });
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
    const client = await this.client("deriveKey");
    const data = await client.put("/v0/org/{org_id}/derive_key", {
      params: { path: { org_id: this.orgId } },
      body: {
        derivation_path: derivationPaths,
        mnemonic_id: mnemonicId,
        key_type: keyType,
      },
    });
    return data.keys;
  }

  /**
   * List all keys in the org.
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
   * @param {string?} owner Optional key owner to filter list for.
   * @return {Paginator<ListKeysResponse, KeyInfoApi>} Paginator for iterating over keys.
   */
  keysList(
    type?: KeyType,
    page?: PageOpts,
    owner?: string,
  ): Paginator<ListKeysResponse, KeyInfoApi> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listKeysInOrg");
      return await client.get("/v0/org/{org_id}/keys", {
        params: {
          path: { org_id: this.orgId },
          query: {
            key_type: type,
            key_owner: owner,
            ...query,
          },
        },
      });
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
    const client = await this.client("createRole");
    const data = await client.post("/v0/org/{org_id}/roles", {
      params: { path: { org_id: this.orgId } },
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
    const client = await this.client("getRole");
    return await client.get("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
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
    const client = await this.client("updateRole");
    return await client.patch("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      body: request,
    });
  }

  /**
   * Delete a role by its ID.
   *
   * @param {string} roleId The ID of the role to delete.
   */
  async roleDelete(roleId: string): Promise<void> {
    const client = await this.client("deleteRole");
    await client.del("/v0/org/{org_id}/roles/{role_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
    });
  }

  /**
   * List all roles in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {RoleInfo} Paginator for iterating over roles.
   */
  rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo> {
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listRoles");
      return await client.get("/v0/org/{org_id}/roles", {
        params: {
          path: { org_id: this.orgId },
          query,
        },
      });
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
    const client = await this.client("addKeysToRole");
    await client.put("/v0/org/{org_id}/roles/{role_id}/add_keys", {
      params: { path: { org_id: this.#orgId, role_id: roleId } },
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
    const client = await this.client("removeKeyFromRole");
    await client.del("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", {
      params: { path: { org_id: this.#orgId, role_id: roleId, key_id: keyId } },
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
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listRoleKeys");
      return await client.get("/v0/org/{org_id}/roles/{role_id}/keys", {
        params: {
          path: { org_id: this.orgId, role_id: roleId },
          query,
        },
      });
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
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
    const client = await this.client("addUserToRole");
    await client.put("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", {
      params: { path: { org_id: this.#orgId, role_id: roleId, user_id: userId } },
    });
  }

  /**
   * Remove an existing user from an existing role.
   *
   * @param {string} roleId The ID of the role.
   * @param {string} userId The ID of the user to remove from the role.
   */
  async roleUserRemove(roleId: string, userId: string) {
    const client = await this.client("removeUserFromRole");
    await client.del("/v0/org/{org_id}/roles/{role_id}/users/{user_id}", {
      params: { path: { org_id: this.orgId, role_id: roleId, user_id: userId } },
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
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listRoleUsers");
      return await client.get("/v0/org/{org_id}/roles/{role_id}/users", {
        params: {
          path: { org_id: this.orgId, role_id: roleId },
          query,
        },
      });
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
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
   * @param {SignerSessionLifetime} lifetimes Lifetime settings
   * @return {Promise<SignerSessionData>} New signer session info.
   */
  async sessionCreate(
    purpose: string,
    scopes: string[],
    lifetimes?: SignerSessionLifetime,
  ): Promise<SignerSessionData> {
    lifetimes ??= defaultSignerSessionLifetime;
    const client = await this.client("createSession");
    const data = await client.post("/v0/org/{org_id}/session", {
      params: { path: { org_id: this.orgId } },
      body: {
        purpose,
        scopes,
        auth_lifetime: lifetimes.auth,
        refresh_lifetime: lifetimes.refresh,
        session_lifetime: lifetimes.session,
        grace_lifetime: lifetimes.grace,
      },
    });
    return {
      org_id: this.orgId,
      role_id: undefined,
      purpose,
      token: data.token,
      session_info: data.session_info,
      session_exp: data.expiration!,
      // Keep compatibility with tokens produced by CLI
      env: {
        ["Dev-CubeSignerStack"]: this.#sessionMgr.env,
      },
    };
  }

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

    const client = await this.client("createRoleToken");
    const data = await client.post("/v0/org/{org_id}/roles/{role_id}/tokens", {
      params: { path: { org_id: this.orgId, role_id: roleId } },
      body: {
        purpose,
        scopes,
        auth_lifetime: lifetimes.auth,
        refresh_lifetime: lifetimes.refresh,
        session_lifetime: lifetimes.session,
        grace_lifetime: lifetimes.grace,
      },
    });
    return {
      org_id: this.orgId,
      role_id: roleId,
      purpose,
      token: data.token,
      session_info: data.session_info,
      session_exp: data.expiration!,
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
    const client = await this.client("revokeSession");
    await client.del("/v0/org/{org_id}/session/{session_id}", {
      params: { path: { org_id: this.orgId, session_id: sessionId } },
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
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("listSessions");
      return await client.get("/v0/org/{org_id}/session", {
        params: {
          path: { org_id: this.#orgId },
          query: { role: roleId, ...query },
        },
      });
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
    const client = await this.client("listTokenKeys");
    const resp = await client.get("/v0/org/{org_id}/token/keys", {
      params: { path: { org_id: this.orgId } },
    });
    return resp.keys;
  }

  // #endregion

  // #region IDENTITY: identityProve, identityVerify

  /**
   * Obtain proof of authentication using the current CubeSigner session.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const client = await this.client("createProofCubeSigner");
    return await client.post("/v0/org/{org_id}/identity/prove", {
      params: { path: { org_id: this.orgId } },
    });
  }

  /**
   * Checks if a given identity proof is valid.
   *
   * @param {IdentityProof} proof The proof of authentication.
   */
  async identityVerify(proof: IdentityProof) {
    const client = await this.client("verifyProof");
    await client.post("/v0/org/{org_id}/identity/verify", {
      params: { path: { org_id: this.orgId } },
      body: proof,
    });
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
    const client = await this.client("mfaGet");
    return await client.get("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
    });
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * @return {Promise<MfaRequestInfo[]>} The MFA requests.
   */
  async mfaList(): Promise<MfaRequestInfo[]> {
    const client = await this.client("mfaList");
    const resp = await client.get("/v0/org/{org_id}/mfa", {
      params: { path: { org_id: this.orgId } },
    });
    return resp.mfa_requests;
  }

  /**
   * Approve or reject a pending MFA request using the current session.
   *
   * @param {string} mfaId The id of the MFA request
   * @param {MfaVote} mfaVote Approve or reject the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaVoteCs(mfaId: string, mfaVote: MfaVote): Promise<MfaRequestInfo> {
    const client = await this.client("mfaVoteCs");
    return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
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
    const client = await this.client("mfaVoteTotp");
    return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/totp", {
      params: { path: { org_id: this.#orgId, mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
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
    const client = await this.client("mfaFidoInit");
    const challenge = await client.post("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId } },
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
    const client = await this.client("mfaVoteFidoComplete");
    return await client.patch("/v0/org/{org_id}/mfa/{mfa_id}/fido", {
      params: { path: { org_id: this.orgId, mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
      body: {
        challenge_id: challengeId,
        credential,
      },
    });
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
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("eth1Sign");
      return await client.post("/v1/org/{org_id}/eth1/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("eip191Sign");
      return await client.post("/v0/org/{org_id}/evm/eip191/sign/{pubkey}", {
        params: {
          path: { org_id: this.orgId, pubkey },
        },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const pubkey = typeof key === "string" ? (key as string) : key.materialId;
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("eip712Sign");
      return await client.post("/v0/org/{org_id}/evm/eip712/sign/{pubkey}", {
        params: {
          path: { org_id: this.orgId, pubkey },
        },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
      const client = await this.client("eth2Sign");
      return await client.post("/v1/org/{org_id}/eth2/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
      });
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
      const client = await this.client("stake");
      return await client.post("/v1/org/{org_id}/eth2/stake", {
        params: { path: { org_id: this.orgId } },
        body: req,
        headers,
      });
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
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("unstake");
      return await client.post("/v1/org/{org_id}/eth2/unstake/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const signFn = async (headers?: HeadersInit) => {
      const req = <AvaSignRequest>{
        tx: tx as unknown,
      };
      const client = await this.client("avaSign");
      return await client.post("/v0/org/{org_id}/ava/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const key_id = typeof key === "string" ? (key as string) : key.id;
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("blobSign");
      return await client.post("/v1/org/{org_id}/blob/sign/{key_id}", {
        params: {
          path: { org_id: this.orgId, key_id },
        },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("btcSign");
      return await client.post("/v0/org/{org_id}/btc/sign/{pubkey}", {
        params: {
          path: { org_id: this.orgId, pubkey },
        },
        body: req,
        headers: headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const signFn = async (headers?: HeadersInit) => {
      const client = await this.client("solanaSign");
      return await client.post("/v0/org/{org_id}/solana/sign/{pubkey}", {
        params: { path: { org_id: this.orgId, pubkey } },
        body: req,
        headers,
      });
    };
    return await CubeSignerResponse.create(signFn, mfaReceipt);
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
    const listFn = async (query: PageQueryArgs) => {
      const client = await this.client("userExportList");
      return await client.get("/v0/org/{org_id}/user/me/export", {
        params: {
          path: { org_id: this.orgId },
          query: {
            user_id: userId,
            key_id: keyId,
            ...query,
          },
        },
      });
    };
    return new Paginator(
      page ?? Page.default(),
      listFn,
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
    const client = await this.client("userExportDelete");
    await client.del("/v0/org/{org_id}/user/me/export", {
      params: {
        path: { org_id: this.orgId },
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
    const initFn = async (headers?: HeadersInit) => {
      const client = await this.client("userExportInit");
      return await client.post("/v0/org/{org_id}/user/me/export", {
        params: { path: { org_id: this.orgId } },
        body: { key_id: keyId },
        headers,
      });
    };
    return await CubeSignerResponse.create(initFn, mfaReceipt);
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

    // make the request
    const completeFn = async (headers?: HeadersInit) => {
      const client = await this.client("userExportComplete");
      return await client.patch("/v0/org/{org_id}/user/me/export", {
        params: { path: { org_id: this.orgId } },
        body: {
          key_id: keyId,
          public_key: publicKeyB64,
        },
        headers,
      });
    };
    return await CubeSignerResponse.create(completeFn, mfaReceipt);
  }
  // #endregion

  // #region MISC: heartbeat()
  /**
   * Send a heartbeat / upcheck request.
   *
   * @return { Promise<void> } The response.
   */
  async heartbeat(): Promise<void> {
    const client = await this.client("cube3signerHeartbeat");
    await client.post("/v1/org/{org_id}/cube3signer/heartbeat", {
      params: {
        path: { org_id: this.orgId },
      },
    });
  }
  // #endregion
}

/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
export class OidcClient {
  readonly #env: EnvInterface;
  readonly #orgId: string;
  readonly #client: Client;
  readonly #retrySettings?: RetrySettings;

  /**
   * @param {EnvInterface} env CubeSigner deployment
   * @param {string} orgId Target organization ID
   * @param {string} oidcToken User's OIDC token
   * @param {RetrySettings} retrySettings Retry settings. By default, retries 3 times, sleeping 100ms
   *  after the first failed attempt, 200ms after the second, and finally 400ms after the third.
   */
  constructor(env: EnvInterface, orgId: string, oidcToken: string, retrySettings?: RetrySettings) {
    this.#orgId = orgId;
    this.#env = env;
    this.#client = createHttpClient(env.SignerApiRoot, oidcToken);
    this.#retrySettings = retrySettings;
  }

  /**
   * HTTP client restricted to a single operation.
   *
   * @param {Op} op The operation to restrict the client to
   * @return {OpClient<Op>} The client restricted to {@link op}
   */
  private client<Op extends keyof operations>(op: Op): OpClient<Op> {
    return new OpClient(op, this.#client, new EventEmitter([]), this.#retrySettings);
  }

  /**
   * Exchange an OIDC token for a CubeSigner session token.
   * @param {List<string>} scopes The scopes for the new session
   * @param {RatchetConfig} lifetimes Lifetimes of the new session.
   * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
   * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
   */
  async sessionCreate(
    scopes: Array<string>,
    lifetimes?: RatchetConfig,
    mfaReceipt?: MfaReceipt,
  ): Promise<CubeSignerResponse<SignerSessionData>> {
    const loginFn = async (headers?: HeadersInit) => {
      const client = this.client("oidcAuth");
      const data = await client.post("/v0/org/{org_id}/oidc", {
        params: { path: { org_id: this.#orgId } },
        headers,
        body: {
          scopes,
          tokens: lifetimes,
        },
      });
      return mapResponse(
        data,
        (sessionInfo) =>
          <SignerSessionData>{
            env: {
              ["Dev-CubeSignerStack"]: this.#env,
            },
            org_id: this.#orgId,
            token: sessionInfo.token,
            purpose: "sign via oidc",
            session_info: sessionInfo.session_info,
          },
      );
    };

    return await CubeSignerResponse.create(loginFn, mfaReceipt);
  }

  /**
   * Exchange an OIDC token for a proof of authentication.
   *
   * @return {Promise<IdentityProof>} Proof of authentication
   */
  async identityProve(): Promise<IdentityProof> {
    const client = this.client("createProofOidc");
    return await client.post("/v0/org/{org_id}/identity/prove/oidc", {
      params: { path: { org_id: this.#orgId } },
    });
  }
}

const defaultSignerSessionLifetime: SignerSessionLifetime = {
  session: 604800, // 1 week
  auth: 300, // 5 min
  refresh: 86400, // 1 day
  grace: 30, // seconds
};
