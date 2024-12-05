import type { CreateOidcUserOptions, IdentityProof, KeyInRoleInfo, KeyInfo, OidcIdentity, PublicKeyCredential, RoleInfo, UpdateKeyRequest, UpdateOrgRequest, UpdateOrgResponse, UpdateRoleRequest, UserInOrgInfo, UserInRoleInfo, GetUsersInOrgResponse, UserInfo, SessionInfo, OrgInfo, Eip191SignRequest, Eip712SignRequest, Eip191Or712SignResponse, EvmSignRequest, EvmSignResponse, Eth2SignRequest, Eth2SignResponse, Eth2StakeRequest, Eth2StakeResponse, Eth2UnstakeRequest, Eth2UnstakeResponse, BlobSignRequest, BlobSignResponse, BtcSignResponse, BtcSignRequest, BtcMessageSignResponse, BtcMessageSignRequest, PsbtSignRequest, PsbtSignResponse, SolanaSignRequest, SolanaSignResponse, AvaSignResponse, AvaTx, MfaRequestInfo, MfaVote, MemberRole, UserExportCompleteResponse, UserExportInitResponse, UserExportListResponse, Empty, UserOrgsResponse, CreateKeyImportKeyResponse, ImportKeyRequest } from "../schema_types";
import { AddFidoChallenge, MfaFidoChallenge, MfaEmailChallenge, TotpChallenge } from "../mfa";
import { CubeSignerResponse } from "../response";
import type { Key, KeyType } from "../key";
import type { PageOpts } from "../paginator";
import { Paginator } from "../paginator";
import type { KeyPolicy } from "../role";
import type { AddIdentityRequest, AvaChain, EnvInterface, EotsCreateNonceRequest, EotsCreateNonceResponse, EotsSignRequest, EotsSignResponse, JrpcResponse, JsonArray, ListIdentityResponse, ListKeyRolesResponse, ListKeysResponse, ListRoleKeysResponse, ListRoleUsersResponse, ListRolesResponse, MmiJrpcMethod, PendingMessageInfo, PendingMessageSignResponse, RatchetConfig, Scope, SessionData, SessionLifetime, SessionsResponse, TaprootSignRequest, TaprootSignResponse, BabylonStakingRequest, BabylonStakingResponse, UpdateUserMembershipRequest, HistoricalTx, ListHistoricalTxResponse, PublicOrgInfo, ImportDeriveKeyProperties, PasswordResetRequest, EmailOtpResponse, AuthenticationRequest, AuthenticationResponse, CreateKeyProperties, InvitationAcceptRequest, MfaReceipts, SuiSignRequest, SuiSignResponse } from "../index";
import { BaseClient } from "./base_client";
/**
 * Session selector.
 */
export type SessionSelector = 
/**
 * Selects all sessions tied to a role with this ID
 * @deprecated Use `{ role: string }` instead
 */
string | {
    /** Selects all sessions tied to a role with this ID */
    role: string;
} | {
    /** Selects all sessions tied to a user with this ID. */
    user: string;
};
/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
export declare class ApiClient extends BaseClient {
    #private;
    /**
     * Obtain information about the current user.
     *
     * @return {Promise<UserInfo>} Retrieves information about the current user.
     */
    userGet(): Promise<UserInfo>;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link ApiClient.userTotpResetComplete}).
     *
     * @param {string} issuer Optional issuer; defaults to "Cubist"
     * @param {MfaReceipts} mfaReceipt MFA receipt(s) to include in HTTP headers
     */
    userTotpResetInit(issuer?: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<TotpChallenge>>;
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     */
    userTotpDelete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
     * that must be answered with {@link AddFidoChallenge.answer} or {@link userFidoRegisterComplete}
     * (after MFA approvals).
     *
     * @param {string} name The name of the new device.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @return {Promise<CubeSignerResponse<AddFidoChallenge>>} A challenge that must be answered in order to complete FIDO registration.
     */
    userFidoRegisterInit(name: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Complete a previously initiated (via {@link userFidoRegisterInit}) request to add a new FIDO device.
     *
     * Instead of calling this method directly, prefer {@link AddFidoChallenge.answer} or
     * {@link AddFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} challengeId The ID of the challenge returned by the remote end.
     * @param {PublicKeyCredential} credential The answer to the challenge.
     */
    userFidoRegisterComplete(challengeId: string, credential: PublicKeyCredential): Promise<{
        status: string;
    }>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * @param {string} fidoId The ID of the desired FIDO key
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     */
    userFidoDelete(fidoId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Obtain information about an org
     *
     * @param {string | undefined} orgId The org to get info for
     * @return {OrgInfo} Information about the organization.
     */
    orgGet(orgId?: string): Promise<OrgInfo>;
    /**
     * Update the org.
     * @param {UpdateOrgRequest} request The JSON request to send to the API server.
     * @return {UpdateOrgResponse} Updated org information.
     */
    orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse>;
    /**
     * Update user's membership in this org.
     * @param {string} userId The ID of the user whose membership to update.
     * @param {UpdateUserMembershipRequest} req The update request
     * @return {Promise<UserInOrgInfo>} Updated user membership
     */
    orgUpdateUserMembership(userId: string, req: UpdateUserMembershipRequest): Promise<UserInOrgInfo>;
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param {string} email Email of the user
     * @param {string} name The full name of the user
     * @param {MemberRole} role Optional role. Defaults to "alien".
     * @param {boolean} skipEmail Optionally skip sending the invite email.
     */
    orgUserInvite(email: string, name: string, role?: MemberRole, skipEmail?: boolean): Promise<void>;
    /**
     * Remove the user from the org.
     * @param {string} userId The ID of the user to remove.
     */
    orgUserDelete(userId: string): Promise<Empty>;
    /**
     * List users in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<GetUsersInOrgResponse, UserInOrgInfo>} Paginator for iterating over the users in the org.
     */
    orgUsersList(page?: PageOpts): Paginator<GetUsersInOrgResponse, UserInOrgInfo>;
    /**
     * Get user by id.
     * @param {string} userId The id of the user to get.
     * @return {UserInOrgInfo} Org user.
     */
    orgUserGet(userId: string): Promise<UserInOrgInfo>;
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     * @param {OidcIdentity | IdentityProof} identityOrProof The identity or
     *   identity proof of the OIDC user
     * @param {string} email Email of the OIDC user
     * @param {CreateOidcUserOptions} opts Additional options for new OIDC users
     * @return {string} User id of the new user
     */
    orgUserCreateOidc(identityOrProof: OidcIdentity | IdentityProof, email?: string | null, opts?: CreateOidcUserOptions): Promise<string>;
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
     * @return {KeyInfo} The key information.
     */
    keyGet(keyId: string): Promise<KeyInfo>;
    /**
     * Get a key by its type and material id.
     *
     * @param {KeyType} keyType The key type.
     * @param {string} materialId The material id of the key to get.
     * @return {KeyInfo} The key information.
     */
    keyGetByMaterialId(keyType: KeyType, materialId: string): Promise<KeyInfo>;
    /**
     * List all roles a key is in.
     *
     * @param {string} keyId The id of the key to get.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListKeyRolesResponse, KeyInRoleInfo>} Paginator for iterating over the roles a key is in.
     */
    keyRolesList(keyId: string, page?: PageOpts): Paginator<ListKeyRolesResponse, KeyInRoleInfo>;
    /**
     * Update key.
     * @param {string} keyId The ID of the key to update.
     * @param {UpdateKeyRequest} request The JSON request to send to the API server.
     * @return {KeyInfo} The JSON response from the API server.
     */
    keyUpdate(keyId: string, request: UpdateKeyRequest): Promise<KeyInfo>;
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
     * @param {KeyProperties?} props Additional key properties
     * @return {KeyInfo[]} The new keys.
     */
    keysCreate(keyType: KeyType, count: number, ownerId?: string, props?: CreateKeyProperties): Promise<KeyInfo[]>;
    /**
     * Derive a set of keys of a specified type using a supplied derivation path and an existing long-lived mnemonic.
     *
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} keyType The type of key to create.
     * @param {string[]} derivationPaths Derivation paths from which to derive new keys.
     * @param {string} mnemonicId material_id of mnemonic key used to derive the new key.
     * @param { ImportDeriveKeyProperties? } props Additional options for derivation.
     *
     * @return {KeyInfo[]} The newly derived keys.
     */
    keysDerive(keyType: KeyType, derivationPaths: string[], mnemonicId: string, props?: ImportDeriveKeyProperties): Promise<KeyInfo[]>;
    /**
     * List all keys in the org.
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @param {string?} owner Optional key owner to filter list for.
     * @param {string?} search Optionally search by key's material ID and metadata
     * @return {Paginator<ListKeysResponse, KeyInfo>} Paginator for iterating over keys.
     */
    keysList(type?: KeyType, page?: PageOpts, owner?: string, search?: string): Paginator<ListKeysResponse, KeyInfo>;
    /**
     * List recent historical key transactions.
     *
     * @param {string} keyId The key id.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListHistoricalTxResponse, HistoricalTx>} Paginator for iterating over historical transactions.
     */
    keyHistory(keyId: string, page?: PageOpts): Paginator<ListHistoricalTxResponse, HistoricalTx>;
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
     * Remove an existing user from an existing role.
     *
     * @param {string} roleId The ID of the role.
     * @param {string} userId The ID of the user to remove from the role.
     */
    roleUserRemove(roleId: string, userId: string): Promise<void>;
    /**
     * List all users in a role.
     *
     * @param {string} roleId The ID of the role whose users to retrieve.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Paginator<ListRoleUsersResponse, UserInRoleInfo>} Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId: string, page?: PageOpts): Paginator<ListRoleUsersResponse, UserInRoleInfo>;
    /**
     * Create new user session (management and/or signing). The lifetime of
     * the new session is silently truncated to that of the current session.
     *
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes.
     * @param {SessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SessionData>} New signer session info.
     */
    sessionCreate(purpose: string, scopes: Scope[], lifetimes?: SessionLifetime): Promise<SessionData>;
    /**
     * Create new user session (management and/or signing) whose lifetime potentially
     * extends the lifetime of the current session.  MFA is always required.
     *
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes.
     * @param {SessionLifetime} lifetime Lifetime settings
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<CubeSignerResponse<SessionData>>} New signer session info.
     */
    sessionCreateExtended(purpose: string, scopes: Scope[], lifetime: SessionLifetime, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Create a new signer session for a given role.
     *
     * @param {string} roleId Role ID
     * @param {string} purpose The purpose of the session
     * @param {Scope[]} scopes Session scopes. Not all scopes are valid for a role.
     * @param {SessionLifetime} lifetimes Lifetime settings
     * @return {Promise<SessionData>} New signer session info.
     */
    sessionCreateForRole(roleId: string, purpose: string, scopes?: Scope[], lifetimes?: SessionLifetime): Promise<SessionData>;
    /**
     * Revoke a session.
     *
     * @param {string} [sessionId] The ID of the session to revoke. This session by default
     */
    sessionRevoke(sessionId?: string): Promise<void>;
    /**
     * Revoke all sessions.
     *
     * @param {SessionSelector?} [selector] Which sessions to revoke.
     *  If not defined, all the current user's sessions will be revoked.
     */
    sessionRevokeAll(selector?: SessionSelector): Promise<void>;
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param {SessionSelector?} selector If set, limit to sessions for a specified user or a role.
     * @param {PageOpts?} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<SignerSessionInfo[]>} Signer sessions for this role.
     */
    sessionsList(selector?: SessionSelector, page?: PageOpts): Paginator<SessionsResponse, SessionInfo>;
    /**
     * Returns the list of keys that this session has access to.
     * @return {KeyInfo[]} The list of keys.
     */
    sessionKeysList(): Promise<KeyInfo[]>;
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
     * Associates an OIDC identity with the current user's account.
     *
     * @param {AddIdentityRequest} body The request body, containing an OIDC token to prove the identity ownership.
     */
    identityAdd(body: AddIdentityRequest): Promise<void>;
    /**
     * Removes an OIDC identity from the current user's account.
     *
     * @param {OidcIdentity} body The identity to remove.
     */
    identityRemove(body: OidcIdentity): Promise<void>;
    /**
     * Lists associated OIDC identities with the current user.
     *
     * @return {ListIdentityResponse} Associated identities
     */
    identityList(): Promise<ListIdentityResponse>;
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
     * Approve or reject a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    mfaVoteCs(mfaId: string, mfaVote: MfaVote): Promise<MfaRequestInfo>;
    /**
     * Approve or reject a pending MFA request using TOTP.
     *
     * @param {string} mfaId The ID of the MFA request
     * @param {string} code The TOTP code
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    mfaVoteTotp(mfaId: string, code: string, mfaVote: MfaVote): Promise<MfaRequestInfo>;
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaVoteFidoComplete}.
     *
     * @param {string} mfaId The MFA request ID.
     * @return {Promise<MfaFidoChallenge>} A challenge that needs to be answered to complete the approval.
     */
    mfaFidoInit(mfaId: string): Promise<MfaFidoChallenge>;
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
    mfaVoteFidoComplete(mfaId: string, mfaVote: MfaVote, challengeId: string, credential: PublicKeyCredential): Promise<MfaRequestInfo>;
    /**
     * Initiate MFA approval via email OTP.
     *
     * @param {string} mfaId The MFA request ID
     * @param {MfaVote} mfaVote Approve or reject the MFA request
     * @return {Promise<MfaEmailChallenge>} A challenge that needs to be answered to complete the approval.
     */
    mfaVoteEmailInit(mfaId: string, mfaVote: MfaVote): Promise<MfaEmailChallenge>;
    /**
     * Complete a previously initiated (via {@link mfaVoteEmailInit}) MFA vote request using email OTP.
     *
     * Instead of calling this method directly, prefer {@link MfaEmailChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} mfaId The MFA request ID
     * @param {string} partialToken The partial token returned by {@link mfaVoteEmailInit}
     * @param {string} signature The one-time code (signature in this case) sent via email
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    mfaVoteEmailComplete(mfaId: string, partialToken: string, signature: string): Promise<MfaRequestInfo>;
    /**
     * Sign an EVM transaction.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EvmSignRequest} req What to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEvm(key: Key | string, req: EvmSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EvmSignResponse>>;
    /**
     * Sign EIP-191 typed data.
     *
     * This requires the key to have a '"AllowEip191Signing"' {@link KeyPolicy}.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEip191(key: Key | string, req: Eip191SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign EIP-712 typed data.
     *
     * This requires the key to have a '"AllowEip712Signing"' {@link KeyPolicy}.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BlobSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<EvmSignResponse | AcceptedResponse>} Signature (or MFA approval request).
     */
    signEip712(key: Key | string, req: Eip712SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2SignRequest} req What to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<Eth2SignResponse | AcceptedResponse>} Signature
     */
    signEth2(key: Key | string, req: Eth2SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param {Eth2StakeRequest} req The request to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<Eth2StakeResponse | AcceptedResponse>} The response.
     */
    signStake(req: Eth2StakeRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2StakeResponse>>;
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {Eth2UnstakeRequest} req The request to sign.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<Eth2UnstakeResponse | AcceptedResponse>} The response.
     */
    signUnstake(key: Key | string, req: Eth2UnstakeRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2UnstakeResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {AvaTx} tx Avalanche message (transaction) to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signAva(key: Key | string, tx: AvaTx, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>>;
    /**
     * Sign a serialized Avalanche C-, P-, or X-chain message. See [the Avalanche
     * documentation](https://docs.avax.network/reference/standards/serialization-primitives)
     * for the specification of the serialization format.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its
     * material ID).
     * @param {AvaChain} avaChain Avalanche chain
     * @param {string} tx Hex encoded transaction
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<AvaSignResponse | AcceptedResponse>} The response.
     */
    signSerializedAva(key: Key | string, avaChain: AvaChain, tx: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>>;
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BlobSignResponse | AcceptedResponse>} The response.
     */
    signBlob(key: Key | string, req: BlobSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BlobSignResponse>>;
    /**
     * Sign a Bitcoin transaction input.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    signBtc(key: Key | string, req: BtcSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BtcSignResponse>>;
    /**
     * Sign a Bitcoin BIP-137 message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcMessageSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BtcMessageSignResponse | AcceptedResponse>} The response.
     */
    signBtcMessage(key: Key | string, req: BtcMessageSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BtcMessageSignResponse>>;
    /**
     * Sign a Taproot transaction input.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {TaprootSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
     */
    signTaproot(key: Key | string, req: TaprootSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<TaprootSignResponse>>;
    /**
     * Sign a PSBT.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {BtcSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<BtcSignResponse | AcceptedResponse>} The response.
     */
    signPsbt(key: Key | string, req: PsbtSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PsbtSignResponse>>;
    /**
     * Generate an Extractable One-Time Signature
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EotsSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<EotsSignResponse | AcceptedResponse>} The response.
     */
    signEots(key: Key | string, req: EotsSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EotsSignResponse>>;
    /**
     * Generates a set of Babylon EOTS nonces for a specified chain-id, starting at a specified block height.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {EotsCreateNonceRequest} req What and how many nonces to create
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<EotsCreateNonceResponse | AcceptedResponse>} The response.
     */
    eotsCreateNonce(key: Key | string, req: EotsCreateNonceRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EotsCreateNonceResponse>>;
    /**
     * Sign a Babylon staking transaction.
     *
     * @param {Key | string} key The taproot key to sign with (either {@link Key} or its material ID).
     * @param {BabylonStakingRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<TaprootSignResponse | AcceptedResponse>} The response.
     */
    signBabylonStakingTxn(key: Key | string, req: BabylonStakingRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BabylonStakingResponse>>;
    /**
     * Sign a Solana message.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SolanaSignRequest} req What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<SolanaSignResponse | AcceptedResponse>} The response.
     */
    signSolana(key: Key | string, req: SolanaSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SolanaSignResponse>>;
    /**
     * Sign a MMI pending message.
     *
     * @param {PendingMessageInfo} message the message info.
     * @param {MfaReceipts | undefined} mfaReceipt optional MFA receipt(s).
     * @return {PendingMessageSignResponse} the updated message.
     */
    signMmi(message: PendingMessageInfo, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PendingMessageSignResponse>>;
    /**
     * Sign a SUI transaction.
     *
     * @param {Key | string} key The key to sign with (either {@link Key} or its material ID).
     * @param {SuiSignRequest} request What to sign
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @return {Promise<CubeSignerResponse<SuiSignResponse>>} The response.
     */
    signSui(key: Key | string, request: SuiSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SuiSignResponse>>;
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
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<UserExportInitResponse | AcceptedResponse>} The response.
     */
    userExportInit(keyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<UserExportInitResponse>>;
    /**
     * Complete a user-export request.
     *
     * @param {string} keyId The key-id for which to initiate an export.
     * @param {CryptoKey} publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s).
     * @return {Promise<UserExportCompleteResponse | AcceptedResponse>} The response.
     */
    userExportComplete(keyId: string, publicKey: CryptoKey, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<UserExportCompleteResponse>>;
    /**
     * Request a fresh key-import key.
     *
     * @return { Promise<GetKeyImportKeyResponse> } A fresh key-import key
     */
    createKeyImportKey(): Promise<CreateKeyImportKeyResponse>;
    /**
     * Import one or more keys. To use this functionality, you must first create an
     * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
     * library. See that library's documentation for more info.
     *
     * @param { ImportKeyRequest } body An encrypted key-import request.
     * @return { KeyInfo[] } The newly imported keys.
     */
    importKeys(body: ImportKeyRequest): Promise<KeyInfo[]>;
    /**
     * Send a heartbeat / upcheck request.
     *
     * @return { Promise<void> } The response.
     */
    heartbeat(): Promise<void>;
    /**
     * Call the MMI JSON RPC endpoint.
     *
     * @param {MmiJrpcMethod} method The name of the method to call.
     * @param {JsonArray} params The list of method parameters.
     * @return {object | null | undefined} the return value of the method.
     * @internal
     */
    mmi(method: MmiJrpcMethod, params: JsonArray): Promise<JrpcResponse>;
    /**
     * List pending MMI messages.
     *
     * @return { PendingMessageInfo[] } The list of pending MMI messages.
     */
    mmiList(): Promise<PendingMessageInfo[]>;
    /**
     * Get a pending MMI message by its ID.
     *
     * @param {string} msgId The ID of the pending message.
     * @return {PendingMessageInfo} The pending MMI message.
     */
    mmiGet(msgId: string): Promise<PendingMessageInfo>;
    /**
     * Delete the MMI message with the given ID.
     *
     * @param {string} msgId the ID of the MMI message.
     */
    mmiDelete(msgId: string): Promise<void>;
    /**
     * Reject the MMI message with the given ID.
     *
     * @param {string} msgId the ID of the MMI message.
     */
    mmiReject(msgId: string): Promise<PendingMessageInfo>;
    /**
     * Returns public org information.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into
     * @return {Promise<PublicOrgInfo>} Public org information
     */
    static publicOrgInfo(env: EnvInterface, orgId: string): Promise<PublicOrgInfo>;
    /**
     * Exchange an OIDC token for a CubeSigner session token.
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org to log into.
     * @param {string} token The OIDC token to exchange
     * @param {List<Scope>} scopes The scopes for the new session
     * @param {RatchetConfig} lifetimes Lifetimes of the new session.
     * @param {MfaReceipts} mfaReceipt Optional MFA receipt(s)
     * @param {string} purpose Optional session description.
     * @return {Promise<CubeSignerResponse<SessionData>>} The session data.
     */
    static oidcSessionCreate(env: EnvInterface, orgId: string, token: string, scopes: Array<Scope>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipts, purpose?: string): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Accept an invitation to join a CubeSigner org.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {InvitationAcceptRequest} body The request body
     */
    static idpAcceptInvite(env: EnvInterface, orgId: string, body: InvitationAcceptRequest): Promise<void>;
    /**
     * Unauthenticated endpoint for authenticating with email/password.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {AuthenticationRequest} body The request body
     * @return {AuthenticationResponse} Returns an OIDC token which can be used
     *   to log in via OIDC (see {@link oidcSessionCreate}).
     */
    static idpAuthenticate(env: EnvInterface, orgId: string, body: AuthenticationRequest): Promise<AuthenticationResponse>;
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {PasswordResetRequest} body The request body
     * @return {EmailOtpResponse} Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static idpPasswordResetRequest(env: EnvInterface, orgId: string, body: PasswordResetRequest): Promise<EmailOtpResponse>;
    /**
     * Unauthenticated endpoint for confirming a previously initiated password reset request.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The id of the organization
     * @param {string} partialToken The partial token returned by {@link passwordResetRequest}
     * @param {string} signature The one-time code (signature in this case) sent via email
     * @param {string} newPassword The new password
     */
    static idpPasswordResetConfirm(env: EnvInterface, orgId: string, partialToken: string, signature: string, newPassword: string): Promise<void>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} orgId The org id in which to generate proof
     * @param {string} token The oidc token
     * @return {Promise<IdentityProof>} Proof of authentication
     */
    static identityProveOidc(env: EnvInterface, orgId: string, token: string): Promise<IdentityProof>;
    /**
     * Obtain all organizations a user is a member of
     *
     * @param {EnvInterface} env The environment to log into
     * @param {string} token The oidc token identifying the user
     * @return {Promise<UserOrgsResponse>} The organization the user belongs to
     */
    static userOrgs(env: EnvInterface, token: string): Promise<UserOrgsResponse>;
}
//# sourceMappingURL=api_client.d.ts.map