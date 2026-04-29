import createClient, { FetchOptions, FetchResponse, FilterKeys, HttpMethod, PathsWith } from "openapi-fetch";
import { paths, operations } from "./schema";
import { SignerSessionData, SignerSessionLifetime, SignerSessionManager } from "./session/signer_session_manager";
import { CreateOidcUserOptions, IdentityProof, KeyInRoleInfo, KeyInfoApi, ListKeysResponse, ListRoleKeysResponse, ListRoleUsersResponse, ListRolesResponse, OidcIdentity, SessionsResponse, PublicKeyCredential, RoleInfo, UpdateKeyRequest, UpdateOrgRequest, UpdateOrgResponse, UpdateRoleRequest, UserIdInfo, UserInRoleInfo, UserInfo, SessionInfo, OrgInfo, RatchetConfig, Eip191SignRequest, Eip712SignRequest, Eip191Or712SignResponse, EvmSignRequest, EvmSignResponse, Eth2SignRequest, Eth2SignResponse, Eth2StakeRequest, Eth2StakeResponse, Eth2UnstakeRequest, Eth2UnstakeResponse, BlobSignRequest, BlobSignResponse, BtcSignResponse, BtcSignRequest, SolanaSignRequest, SolanaSignResponse, AvaSignResponse, AvaTx, MfaRequestInfo, MemberRole, UserExportCompleteResponse, UserExportInitResponse, UserExportListResponse, Empty } from "./schema_types";
import { AddFidoChallenge, MfaFidoChallenge, MfaReceipt, TotpChallenge } from "./mfa";
import { CubeSignerResponse } from "./response";
import { Key, KeyType } from "./key";
import { PageOpts, Paginator } from "./paginator";
import { KeyPolicy } from "./role";
import { EnvInterface } from "./env";
import { EventEmitter } from "./events";
/** @internal */
export type Client = ReturnType<typeof createClient<paths>>;
export { paths, operations };
/**
 * Omit routes in {@link T} whose methods are all 'never'
 */
type OmitNeverPaths<T extends paths> = {
    [p in keyof T as T[p] extends {
        [m in keyof T[p]]: never;
    } ? never : p]: T[p];
};
/**
 * Filter out methods that don't match operation {@link Op}
 */
type FilterPaths<Op extends keyof operations> = {
    [p in keyof paths]: {
        [m in HttpMethod as m extends keyof paths[p] ? m : never]: m extends keyof paths[p] ? operations[Op] extends paths[p][m] ? paths[p][m] extends operations[Op] ? operations[Op] : never : never : never;
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
 * Wrapper around an open-fetch client restricted to a single operation.
 * The restriction applies only when type checking, the actual
 * client does not restrict anything at runtime.
 * client does not restrict anything at runtime
 */
export declare class OpClient<Op extends keyof operations> {
    #private;
    /**
     * @param {Op} op The operation this client should be restricted to
     * @param {FetchClient<Op> | Client} client open-fetch client (either restricted to {@link Op} or not)
     * @param {EventEmitter} eventEmitter The client-local event dispatcher.
     */
    constructor(op: Op, client: FetchClient<Op> | Client, eventEmitter: EventEmitter);
    /** The operation this client is restricted to */
    get op(): Op;
    /**
     * Inspects the response and returns the response body if the request was successful.
     * Otherwise, dispatches the error to event listeners, then throws {@link ErrResponse}.
     *
     * @param {FetchResponse<T>} resp The response to check
     * @return {FetchResponseSuccessData<T>} The response data corresponding to response type {@link T}.
     */
    private assertOk;
    /**
     * Invoke HTTP GET
     */
    get(url: PathsWith<Paths<Op>, "get">, init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "get">], "get">>): Promise<("get" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">] & "get"] : unknown) extends infer T ? T extends ("get" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "get">] & "get"] : unknown) ? T extends {
        responses: any;
    } ? NonNullable<FilterKeys<import("openapi-fetch").Success<T["responses"]>, `${string}/${string}`>> : unknown : never : never>;
    /** Invoke HTTP POST */
    post(url: PathsWith<Paths<Op>, "post">, init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "post">], "post">>): Promise<("post" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">] & "post"] : unknown) extends infer T ? T extends ("post" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "post">] & "post"] : unknown) ? T extends {
        responses: any;
    } ? NonNullable<FilterKeys<import("openapi-fetch").Success<T["responses"]>, `${string}/${string}`>> : unknown : never : never>;
    /** Invoke HTTP PATCH */
    patch(url: PathsWith<Paths<Op>, "patch">, init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "patch">], "patch">>): Promise<("patch" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">] & "patch"] : unknown) extends infer T ? T extends ("patch" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "patch">] & "patch"] : unknown) ? T extends {
        responses: any;
    } ? NonNullable<FilterKeys<import("openapi-fetch").Success<T["responses"]>, `${string}/${string}`>> : unknown : never : never>;
    /** Invoke HTTP DELETE */
    del(url: PathsWith<Paths<Op>, "delete">, init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "delete">], "delete">>): Promise<("delete" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">] & "delete"] : unknown) extends infer T ? T extends ("delete" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "delete">] & "delete"] : unknown) ? T extends {
        responses: any;
    } ? NonNullable<FilterKeys<import("openapi-fetch").Success<T["responses"]>, `${string}/${string}`>> : unknown : never : never>;
    /** Invoke HTTP PUT */
    put(url: PathsWith<Paths<Op>, "put">, init: FetchOptions<FilterKeys<Paths<Op>[PathsWith<Paths<Op>, "put">], "put">>): Promise<("put" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">] & "put"] : unknown) extends infer T ? T extends ("put" extends keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">] ? OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">][keyof OmitNeverPaths<FilterPaths<Op>>[PathsWith<OmitNeverPaths<FilterPaths<Op>>, "put">] & "put"] : unknown) ? T extends {
        responses: any;
    } ? NonNullable<FilterKeys<import("openapi-fetch").Success<T["responses"]>, `${string}/${string}`>> : unknown : never : never>;
}
/**
 * Creates a new HTTP client, setting the "User-Agent" header to this package's {name}@{version}.
 *
 * @param {string} baseUrl The base URL of the client (e.g., "https://gamma.signer.cubist.dev")
 * @param {string} authToken The value to send as "Authorization" header.
 * @return {Client} The new HTTP client.
 */
export declare function createHttpClient(baseUrl: string, authToken: string): Client;
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export declare class CubeSignerApi {
    #private;
    /** Underlying session manager */
    get sessionMgr(): SignerSessionManager;
    /** Target environment */
    get env(): EnvInterface;
    /**
     * Constructor.
     * @param {SignerSessionManager} sessionMgr The session manager to use
     * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
     */
    constructor(sessionMgr: SignerSessionManager, orgId?: string);
    /**
     * Returns a new instance of this class using the same session manager but targeting a different organization.
     *
     * @param {string} orgId The organization ID.
     * @return {CubeSignerApi} A new instance of this class using the same session manager but targeting different organization.
     */
    withOrg(orgId?: string): CubeSignerApi;
    /** Org id or name */
    get orgId(): string;
    /**
     * HTTP client restricted to a single operation. The restriction applies only
     * when type checking, the actual client does not restrict anything at runtime.
     *
     * @param {Op} op The operation to restrict the client to
     * @return {Promise<OpClient<Op>>} The client restricted to {@link op}
     */
    private client;
    /**
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    userGet(): Promise<UserInfo>;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link CubeSignerApi.userTotpResetComplete}).
     *
     * @param {string} issuer Optional issuer; defaults to "Cubist"
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    userTotpResetInit(issuer?: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by {@link userTotpResetInit}. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Instead of calling this method directly, prefer {@link TotpChallenge.answer}.
     *
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    userTotpResetComplete(totpId: string, code: string): Promise<void>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * @param {string} code Current TOTP code
     */
    userTotpVerify(code: string): Promise<void>;
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     */
    userTotpDelete(mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Empty>>;
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
     * that must be answered with {@link AddFidoChallenge.answer} or {@link userFidoRegisterComplete}
     * (after MFA approvals).
     *
     * @param {string} name The name of the new device.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
     */
    userFidoRegisterInit(name: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Complete a previously initiated (via {@link userFidoRegisterInit}) request to add a new FIDO device.
     *
     * Instead of calling this method directly, prefer {@link AddFidoChallenge.answer} or
     * {@link AddFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
     */
    userFidoRegisterComplete(challengeId: string, credential: PublicKeyCredential): Promise<void>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * @param {string} fidoId The ID of the desired FIDO key
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     */
    userFidoDelete(fidoId: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Empty>>;
    /**
     * Obtain information about the current organization.
     * @return {OrgInfo} Information about the organization.
     */
    orgGet(): Promise<OrgInfo>;
    /**
     * Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} Updated org information.
     */
    orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse>;
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     * @param {MemberRole} role Optional role. Defaults to "alien".
     */
    orgUserInvite(email: string, name: string, role?: MemberRole): Promise<void>;
    /**
     * List users.
     * @return {User[]} Org users.
     */
    orgUsersList(): Promise<UserIdInfo[]>;
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     * @param {OidcIdentity} identity The identity of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    orgUserCreateOidc(identity: OidcIdentity, email: string, opts?: CreateOidcUserOptions): Promise<string>;
    /**
     * Delete an existing OIDC user.
     * @param {OidcIdentity} identity The identity of the OIDC user
     */
    orgUserDeleteOidc(identity: OidcIdentity): Promise<{
        status: string;
    }>;
    /**
     * Get a key by its id.
     *
     * @param {string} keyId The id of the key to get.
     * @return {KeyInfoApi} The key information.
     */
    keyGet(keyId: string): Promise<KeyInfoApi>;
    /**
     * Update key.
     * @param {string} keyId The ID of the key to update.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfoApi} The JSON response from the API server.
     */
    keyUpdate(keyId: string, request: UpdateKeyRequest): Promise<KeyInfoApi>;
    /**
     * Deletes a key.
     *
     * @param {string} keyId - Key id
     */
    keyDelete(keyId: string): Promise<void>;
    /**
     * Create new signing keys.
     *
     * @param {KeyType} keyType The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {KeyInfoApi[]} The new keys.
     */
    keysCreate(keyType: KeyType, count: number, ownerId?: string): Promise<KeyInfoApi[]>;
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
    keysDerive(keyType: KeyType, derivationPaths: string[], mnemonicId: string): Promise<KeyInfoApi[]>;
    /**
     * List all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListKeysResponse, KeyInfoApi>} Paginator for iterating over keys.
     */
    keysList(type?: KeyType, page?: PageOpts): Paginator<ListKeysResponse, KeyInfoApi>;
    /**
     * Create a new role.
     *
     * @param {string?} name The optional name of the role.
     * @return {string} The ID of the new role.
     */
    roleCreate(name?: string): Promise<string>;
    /**
     * Get a role by its id (or name).
     * @param {string} roleId The id of the role to get.
     * @return {RoleInfo} The role.
     */
    roleGet(roleId: string): Promise<RoleInfo>;
    /**
     * Update a role.
     *
     * @param {string} roleId The ID of the role to update.
     * @param {UpdateRoleRequest} request The update request.
     * @return {Promise<RoleInfo>} The updated role information.
     */
    roleUpdate(roleId: string, request: UpdateRoleRequest): Promise<RoleInfo>;
    /**
     * Delete a role by its ID.
     *
     * @param {string} roleId The ID of the role to delete.
     */
    roleDelete(roleId: string): Promise<void>;
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {RoleInfo} Paginator for iterating over roles.
     */
    rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo>;
    /**
     * Add existing keys to an existing role.
     *
     * @param {string} roleId The ID of the role
     * @param {string[]} keyIds The IDs of the keys to add to the role.
     * @param {KeyPolicy?} policy The optional policy to apply to each key.
     */
    roleKeysAdd(roleId: string, keyIds: string[], policy?: KeyPolicy): Promise<void>;
    /**
     * Remove an existing key from an existing role.
     *
     * @param {string} roleId The ID of the role
     * @param {string} keyId The ID of the key to remove from the role
     */
    roleKeysRemove(roleId: string, keyId: string): Promise<void>;
    /**
     * List all keys in a role.
     *
     * @param {string} roleId The ID of the role whose keys to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleKeysResponse, KeyInRoleInfo>} Paginator for iterating over the keys in the role.
     */
    roleKeysList(roleId: string, page?: PageOpts): Paginator<ListRoleKeysResponse, KeyInRoleInfo>;
    /**
     * Add an existing user to an existing role.
     *
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to add to the role.
     */
    roleUserAdd(roleId: string, userId: string): Promise<void>;
    /**
     * List all users in a role.
     *
     * @param {string} roleId The ID of the role whose users to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId: string, page?: PageOpts): Paginator<ListRoleUsersResponse, UserInRoleInfo>;
    /**
     * Create new user session (management and/or signing)
     *
     * @param {string} purpose The purpose of the session
     * @param {string[]} scopes Session scopes.
     * @param {SignerSessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SignerSessionData>} New signer session info.
     */
    sessionCreate(purpose: string, scopes: string[], lifetimes?: SignerSessionLifetime): Promise<SignerSessionData>;
    /**
     * Create a new signer session for a given role.
     *
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {string[]} scopes Session scopes. Only `sign:*` scopes are allowed.
     * @param {SignerSessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SignerSessionData>} New signer session info.
     */
    sessionCreateForRole(roleId: string, purpose: string, scopes?: string[], lifetimes?: SignerSessionLifetime): Promise<SignerSessionData>;
    /**
     * Revoke a session.
     *
     * @param {string} sessionId The ID of the session to revoke.
     */
    sessionRevoke(sessionId: string): Promise<void>;
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param {string?} roleId If set, limit to sessions for this role only.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    sessionsList(roleId?: string, page?: PageOpts): Paginator<SessionsResponse, SessionInfo>;
    /**
     * Returns the list of keys that this session has access to.
     * @return {Key[]} The list of keys.
     */
    sessionKeysList(): Promise<KeyInfoApi[]>;
    /**
     * Obtain proof of authentication using the current CubeSigner session.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    identityProve(): Promise<IdentityProof>;
    /**
     * Checks if a given identity proof is valid.
     *
     * @param {IdentityProof} proof The proof of authentication.
     */
    identityVerify(proof: IdentityProof): Promise<void>;
    /**
     * Retrieves existing MFA request.
     *
     * @param {string} mfaId MFA request ID
     * @return {Promise<MfaRequestInfo>} MFA request information
     */
    mfaGet(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @return {Promise<MfaRequestInfo[]>} The MFA requests.
     */
    mfaList(): Promise<MfaRequestInfo[]>;
    /**
     * Approve a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    mfaApprove(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to approve
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    mfaApproveTotp(mfaId: string, code: string): Promise<MfaRequestInfo>;
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaApproveFidoComplete}.
     *
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    mfaApproveFidoInit(mfaId: string): Promise<MfaFidoChallenge>;
    /**
     * Complete a previously initiated (via {@link mfaApproveFidoInit}) MFA request approval using FIDO.
     *
     * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} mfaId The MFA request ID
     * @param {string} challengeId The ID of the challenge issued by {@link mfaApproveFidoInit}
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    mfaApproveFidoComplete(mfaId: string, challengeId: string, credential: PublicKeyCredential): Promise<MfaRequestInfo>;
    /**
     * Sign an EVM transaction.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEvm(key: Key | string, req: EvmSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<EvmSignResponse>>;
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
    signEip191(key: Key | string, req: Eip191SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
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
    signEip712(key: Key | string, req: Eip712SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    signEth2(key: Key | string, req: Eth2SignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eth2SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param {Eth2StakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    signStake(req: Eth2StakeRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eth2StakeResponse>>;
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    signUnstake(key: Key | string, req: Eth2UnstakeRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<Eth2UnstakeResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signAva(key: Key | string, tx: AvaTx, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<AvaSignResponse>>;
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
    signBlob(key: Key | string, req: BlobSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<BlobSignResponse>>;
    /**
     * Sign a Bitcoin message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    signBtc(key: Key | string, req: BtcSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<BtcSignResponse>>;
    /**
     * Sign a Solana message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    signSolana(key: Key | string, req: SolanaSignRequest, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<SolanaSignResponse>>;
    /**
     * List outstanding user-export requests.
     *
     * @param {string?} keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
     * @param {string?} userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<UserExportListResponse, UserExportInitResponse>} Paginator for iterating over the result set.
     */
    userExportList(keyId?: string, userId?: string, page?: PageOpts): Paginator<UserExportListResponse, UserExportInitResponse>;
    /**
     * Delete an outstanding user-export request.
     *
     * @param {string} keyId The key-id corresponding to the user-export request to delete.
     * @param {string?} userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    userExportDelete(keyId: string, userId?: string): Promise<void>;
    /**
     * Initiate a user-export request.
     *
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<UserExportInitResponse | AcceptedResponse>} The response.
     */
    userExportInit(keyId: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<UserExportInitResponse>>;
    /**
     * Complete a user-export request.
     *
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {CryptoKey} publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt.
     * @return {Promise<UserExportCompleteResponse | AcceptedResponse>} The response.
     */
    userExportComplete(keyId: string, publicKey: CryptoKey, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<UserExportCompleteResponse>>;
    /**
     * Send a heartbeat / upcheck request.
     *
     * @return { Promise<void> } The response.
     */
    heartbeat(): Promise<void>;
}
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using an OIDC token.
 */
export declare class OidcClient {
    #private;
    /**
     * @param {EnvInterface} env CubeSigner deployment
     * @param {string} orgId Target organization ID
     * @param {string} oidcToken User's OIDC token
     */
    constructor(env: EnvInterface, orgId: string, oidcToken: string);
    /**
     * HTTP client restricted to a single operation.
     *
     * @param {Op} op The operation to restrict the client to
     * @return {OpClient<Op>} The client restricted to {@link op}
     */
    private client;
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {List<string>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<CubeSignerResponse<SignerSessionData>>} The session data.
     */
    sessionCreate(scopes: Array<string>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<SignerSessionData>>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    identityProve(): Promise<IdentityProof>;
}
