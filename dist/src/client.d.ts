import createClient from "openapi-fetch";
import { paths } from "./schema";
import { SignerSessionData, SignerSessionLifetime, SignerSessionManager } from "./session/signer_session_manager";
import { CreateOidcUserOptions, IdentityProof, KeyInRoleInfo, KeyInfoApi, ListKeysResponse, ListRoleKeysResponse, ListRoleUsersResponse, ListRolesResponse, OidcIdentity, SessionsResponse, PublicKeyCredential, RoleInfo, UpdateKeyRequest, UpdateOrgRequest, UpdateOrgResponse, UpdateRoleRequest, UserIdInfo, UserInRoleInfo, UserInfo, SessionInfo, OrgInfo, RatchetConfig, OidcAuthResponse, EvmSignRequest, EvmSignResponse, Eth2SignRequest, Eth2SignResponse, Eth2StakeRequest, Eth2StakeResponse, Eth2UnstakeRequest, Eth2UnstakeResponse, BlobSignRequest, BlobSignResponse, BtcSignResponse, BtcSignRequest, SolanaSignRequest, SolanaSignResponse, AvaSignResponse, AvaTx, MfaRequestInfo, MemberRole } from "./schema_types";
import { AddFidoChallenge, MfaFidoChallenge, MfaReceipt, TotpChallenge } from "./mfa";
import { CubeSignerResponse } from "./signer_session";
import { Key, KeyType } from "./key";
import { PageOpts, Paginator } from "./paginator";
import { KeyPolicy } from "./role";
import { EnvInterface } from "./env";
/** @internal */
export type Client = ReturnType<typeof createClient<paths>>;
export { paths };
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export declare class CubeSignerClient {
    #private;
    /** Underlying session manager */
    get sessionMgr(): SignerSessionManager;
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
     * @return {CubeSignerClient} A new instance of this class using the same session manager but targeting different organization.
     */
    withOrg(orgId?: string): CubeSignerClient;
    /** Org id */
    get orgId(): string;
    /**
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    userGet(): Promise<UserInfo>;
    /**
     * Creates a request to change user's TOTP. This request returns a new TOTP challenge
     * that must be answered by calling `userResetTotpComplete`
     *
     * @param {MfaReceipt} mfaReceipt MFA receipt to include in HTTP headers
     */
    userResetTotpInit(mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by `userResetTotpInit`. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * @param {string} totpId - The ID of the TOTP challenge
     * @param {string} code - The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    userResetTotpComplete(totpId: string, code: string): Promise<void>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * @param {string} code Current TOTP code
     */
    userVerifyTotp(code: string): Promise<void>;
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a challenge that must
     * be answered with `userRegisterFidoComplete` (after MFA approvals).
     *
     * @param {string} name The name of the new device.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt to include in HTTP headers
     * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
     */
    userRegisterFidoInit(name: string, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Complete a previously initiated request to add a new FIDO device.
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
     */
    userRegisterFidoComplete(challengeId: string, credential: PublicKeyCredential): Promise<void>;
    /**
     * Obtain information about the current organization.
     * @return {Org} Information about the organization.
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
     * @param {MemberRole} role Optional role. Defaults to "alien.
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
     * Initiate approval of an existing MFA request using FIDO.
     *
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    mfaApproveFidoInit(mfaId: string): Promise<MfaFidoChallenge>;
    /**
     * Complete a previously initiated MFA request approval using FIDO.
     *
     * @param {string} mfaId The MFA request ID
     * @param {string} challengeId The challenge ID
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
    /** HTTPS client */
    private client;
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
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {List<string>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipt} mfaReceipt Optional MFA receipt (id + confirmation code)
     * @return {Promise<CubeSignerResponse<OidcAuthResponse>>} The session data.
     */
    sessionCreate(scopes: Array<string>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipt): Promise<CubeSignerResponse<OidcAuthResponse>>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    identityProve(): Promise<IdentityProof>;
}
