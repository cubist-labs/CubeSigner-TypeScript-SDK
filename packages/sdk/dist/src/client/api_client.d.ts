import type { CreateOidcUserOptions, IdentityProof, KeyInRoleInfo, KeyInfo, OidcIdentity, PublicKeyCredential, RoleInfo, UpdateKeyRequest, UpdateOrgRequest, UpdateOrgResponse, UpdateRoleRequest, UserInOrgInfo, UserInRoleInfo, GetUsersInOrgResponse, UserInfo, SessionInfo, OrgInfo, Eip191SignRequest, Eip712SignRequest, Eip191Or712SignResponse, EvmSignRequest, EvmSignResponse, Eth2SignRequest, Eth2SignResponse, Eth2StakeRequest, Eth2StakeResponse, Eth2UnstakeRequest, Eth2UnstakeResponse, BlobSignRequest, BlobSignResponse, BtcSignResponse, BtcSignRequest, BtcMessageSignResponse, BtcMessageSignRequest, PsbtSignRequest, PsbtSignResponse, SolanaSignRequest, SolanaSignResponse, AvaSignResponse, AvaTx, MfaRequestInfo, MfaVote, MemberRole, UserExportCompleteResponse, UserExportInitResponse, UserExportListResponse, Empty, UserOrgsResponse, CreateKeyImportKeyResponse, ImportKeyRequest, UpdatePolicyRequest, ListPoliciesResponse, PolicyType, PolicyInfo, DiffieHellmanRequest, DiffieHellmanResponse, KeyInfoJwt } from "../schema_types";
import { AddFidoChallenge, MfaFidoChallenge, MfaEmailChallenge, TotpChallenge, ResetEmailChallenge } from "../mfa";
import { CubeSignerResponse } from "../response";
import type { Key, KeyType } from "../key";
import type { PageOpts } from "../paginator";
import { Paginator } from "../paginator";
import type { KeyPolicy } from "../role";
import type * as policy from "../policy";
import type { AddIdentityRequest, AvaChain, EnvInterface, EotsCreateNonceRequest, EotsCreateNonceResponse, EotsSignRequest, EotsSignResponse, JrpcResponse, JsonArray, ListIdentityResponse, ListKeyRolesResponse, ListKeysResponse, ListRoleKeysResponse, ListRoleUsersResponse, ListRolesResponse, MmiJrpcMethod, PendingMessageInfo, PendingMessageSignResponse, RatchetConfig, Scope, SessionData, SessionLifetime, SessionsResponse, TaprootSignRequest, TaprootSignResponse, BabylonRegistrationRequest, BabylonRegistrationResponse, BabylonStakingRequest, BabylonStakingResponse, UpdateUserMembershipRequest, HistoricalTx, ListHistoricalTxResponse, PublicOrgInfo, ImportDeriveKeyProperties, PasswordResetRequest, EmailOtpResponse, AuthenticationRequest, AuthenticationResponse, CreateKeyProperties, InvitationAcceptRequest, MfaReceipts, SuiSignRequest, SuiSignResponse, QueryMetricsRequest, QueryMetricsResponse, CreateOrgRequest, KeyTypeAndDerivationPath, DeriveMultipleKeyTypesProperties, ContactInfo, ListContactsResponse, JsonValue, EditPolicy, UpdateContactRequest, AddressMap, RolePolicy, InvokePolicyResponse, InvokePolicyRequest, UploadWasmPolicyRequest, UploadWasmPolicyResponse, LoginRequest, PasskeyAssertAnswer, schemas, KeyWithPoliciesInfo, GetRoleKeyOptions, GetUserByEmailResponse, GetUserByOidcResponse, EmailTemplatePurpose } from "../index";
import { BaseClient } from "./base_client";
import { PasskeyLoginChallenge } from "../passkey";
/**
 * Session selector.
 */
export type SessionSelector = 
/**
 * Selects all sessions tied to a role with this ID
 *
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
     * Creates a new client using the same session manager but targeting a
     * different (child) organization.
     *
     * @param targetOrgId The ID of an organization that the new client should target
     * @returns A new client targeting a different org
     */
    withTargetOrg(targetOrgId: string): ApiClient;
    /**
     * @returns Information about the current user.
     */
    userGet(): Promise<UserInfo>;
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
    static initEmailOtpAuth(env: EnvInterface, orgId: string, email: string): Promise<EmailOtpResponse>;
    /**
     * Retries a pending MFA request with the provided MfaReceipts
     *
     * @param req The request to retry
     * @param mfaReceipt The MFA receipt(s) to include in HTTP headers
     * @returns The response from the server
     */
    mfaRetry(req: MfaRequestInfo["request"], mfaReceipt: MfaReceipts): Promise<CubeSignerResponse<unknown>>;
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
    userEmailResetInit(req: string | schemas["EmailResetRequest"], mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<ResetEmailChallenge>>;
    /**
     * Answer the reset email challenge issued by {@link userEmailResetInit}.
     * If successful, user's verified email will be updated.
     *
     * Instead of calling this method directly, prefer {@link ResetEmailChallenge.answer}.
     *
     * @param partialToken The partial token returned by {@link userEmailResetInit}
     * @param signature The one-time code (signature in this case) sent via email
     */
    userEmailResetComplete(partialToken: string, signature: string): Promise<void>;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered either by calling {@link TotpChallenge.answer} (or
     * {@link ApiClient.userTotpResetComplete}).
     *
     * @param issuer Optional issuer; defaults to "Cubist"
     * @param mfaReceipt MFA receipt(s) to include in HTTP headers
     * @returns A TOTP challenge that must be answered
     */
    userTotpResetInit(issuer?: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by {@link userTotpResetInit}. If successful, user's
     * TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Instead of calling this method directly, prefer {@link TotpChallenge.answer}.
     *
     * @param totpId The ID of the TOTP challenge
     * @param code The TOTP code that should verify against the TOTP configuration from the challenge.
     */
    userTotpResetComplete(totpId: string, code: string): Promise<void>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     *
     * @param code Current TOTP code
     * @throws An error if verification fails
     */
    userTotpVerify(code: string): Promise<void>;
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns An empty response
     */
    userTotpDelete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Initiate adding a new FIDO device. MFA may be required.  This returns a {@link AddFidoChallenge}
     * that must be answered with {@link AddFidoChallenge.answer} or {@link userFidoRegisterComplete}
     * (after MFA approvals).
     *
     * @param name The name of the new device or a full request.
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns A challenge that must be answered in order to complete FIDO registration.
     */
    userFidoRegisterInit(name: string | schemas["FidoCreateRequest"], mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AddFidoChallenge>>;
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
    userFidoRegisterComplete(challengeId: string, credential: PublicKeyCredential): Promise<Empty>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * @param fidoId The ID of the desired FIDO key
     * @param mfaReceipt Optional MFA receipt(s) to include in HTTP headers
     * @returns An empty response
     */
    userFidoDelete(fidoId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Obtain information about an org
     *
     * @param orgId The org to get info for
     * @returns Information about the organization.
     */
    orgGet(orgId?: string): Promise<OrgInfo>;
    /**
     * Update the org.
     *
     * @param request The JSON request to send to the API server.
     * @returns Updated org information.
     */
    orgUpdate(request: UpdateOrgRequest): Promise<UpdateOrgResponse>;
    /**
     * Update user's membership in this org.
     *
     * @param userId The ID of the user whose membership to update.
     * @param req The update request
     * @returns Updated user membership
     */
    orgUpdateUserMembership(userId: string, req: UpdateUserMembershipRequest): Promise<UserInOrgInfo>;
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param body The details of the request
     * @returns The new organization information
     */
    orgCreateOrg(body: CreateOrgRequest): Promise<OrgInfo>;
    /**
     * Query org metrics.
     *
     * @param body The query
     * @param page Pagination options. Default to fetching the entire result set.
     * @returns Computed org metrics statistics.
     */
    orgQueryMetrics(body: QueryMetricsRequest, page?: PageOpts): Paginator<QueryMetricsResponse, QueryMetricsResponse>;
    /**
     * Configure email template
     *
     * @param purpose The template kind to configure
     * @param req The template parameters
     * @returns An empty response
     */
    orgConfigureEmail(purpose: EmailTemplatePurpose, req: schemas["ConfigureEmailRequest"]): Promise<Empty>;
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @overload
     * @param args The invitation request details
     */
    orgUserInvite(args: schemas["InviteRequest"]): Promise<void>;
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @overload
     * @param email Email of the user
     * @param name The full name of the user
     * @param role Optional role. Defaults to "alien".
     * @param skipEmail Optionally skip sending the invite email.
     * @deprecated Use the object parameter overload instead.
     */
    orgUserInvite(email: string, name: string, role?: MemberRole, skipEmail?: boolean): Promise<void>;
    /**
     * Remove the user from the org.
     *
     * @param userId The ID of the user to remove.
     * @returns An empty response
     */
    orgUserDelete(userId: string): Promise<Empty>;
    /**
     * List users in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @param searchQuery Optional query string. If defined, all returned users will contain this string in their name or email.
     * @returns Paginator for iterating over the users in the org.
     */
    orgUsersList(page?: PageOpts, searchQuery?: string): Paginator<GetUsersInOrgResponse, UserInOrgInfo[]>;
    /**
     * Get user by id.
     *
     * @param userId The id of the user to get.
     * @returns Org user.
     */
    orgUserGet(userId: string): Promise<UserInOrgInfo>;
    /**
     * Get user by email.
     *
     * @param email The email of the user to get.
     * @returns Org users with a given email
     * @throws if there is no user with that email, or email is invalid
     */
    orgUserGetByEmail(email: string): Promise<GetUserByEmailResponse>;
    /**
     * Get user by OIDC identity
     *
     * @param iss OIDC issuer
     * @param sub OIDC subject
     * @returns Org user with a given OIDC identity
     */
    orgUserGetByOidc(iss: string, sub: string): Promise<GetUserByOidcResponse>;
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     *
     * @param identityOrProof The identity or identity proof of the OIDC user
     * @param email Email of the OIDC user
     * @param opts Additional options for new OIDC users
     * @returns User id of the new user
     */
    orgUserCreateOidc(identityOrProof: OidcIdentity | IdentityProof, email?: string | null, opts?: CreateOidcUserOptions): Promise<string>;
    /**
     * Delete an existing OIDC user.
     *
     * @param identity The identity of the OIDC user
     * @returns An empty response
     */
    orgUserDeleteOidc(identity: OidcIdentity): Promise<Empty>;
    /**
     * Get a key by its id.
     *
     * @param keyId The id of the key to get.
     * @returns The key information.
     */
    keyGet(keyId: string): Promise<KeyInfo>;
    /**
     * Attest to key properties.
     *
     * The response is a JWT whose claims are the properties of the requested key.
     *
     * @param keyId The id of the key.
     * @returns A JWT whose claims are the properties of the key.
     */
    keyAttest(keyId: string): Promise<KeyInfoJwt>;
    /**
     * Get a key by its type and material id.
     *
     * @param keyType The key type.
     * @param materialId The material id of the key to get.
     * @returns The key information.
     */
    keyGetByMaterialId(keyType: KeyType, materialId: string): Promise<KeyInfo>;
    /**
     * List all roles a key is in.
     *
     * @param keyId The id of the key to get.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the roles a key is in.
     */
    keyRolesList(keyId: string, page?: PageOpts): Paginator<ListKeyRolesResponse, KeyInRoleInfo[]>;
    /**
     * Update key.
     *
     * @param keyId The ID of the key to update.
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The JSON response from the API server.
     */
    keyUpdate(keyId: string, request: UpdateKeyRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<KeyInfo>>;
    /**
     * Deletes a key.
     *
     * @param keyId Key id
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    keyDelete(keyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Create new signing keys.
     *
     * @param keyType The type of key to create.
     * @param count The number of keys to create.
     * @param ownerId The owner of the keys. Defaults to the session's user.
     * @param props Additional key properties
     * @returns The new keys.
     */
    keysCreate(keyType: KeyType, count: number, ownerId?: string, props?: CreateKeyProperties): Promise<KeyInfo[]>;
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
    keysDerive(keyType: KeyType, derivationPaths: string[], mnemonicId: string, props?: ImportDeriveKeyProperties): Promise<KeyInfo[]>;
    /**
     * Use either a new or existing mnemonic to derive keys of one or more
     * specified types via specified derivation paths.
     *
     * @param keyTypesAndDerivationPaths A list of objects specifying the keys to be derived
     * @param props Additional options for derivation.
     *
     * @returns The newly derived keys.
     */
    keysDeriveMulti(keyTypesAndDerivationPaths: KeyTypeAndDerivationPath[], props?: DeriveMultipleKeyTypesProperties): Promise<KeyInfo[]>;
    /**
     * List all accessible keys in the org.
     *
     * @param type Optional key type to filter list for.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @param owner Optional key owner to filter list for.
     * @param search Optionally search by key's material ID and metadata
     * @returns Paginator for iterating over keys.
     */
    keysList(type?: KeyType, page?: PageOpts, owner?: string, search?: string): Paginator<ListKeysResponse, KeyInfo[]>;
    /**
     * List recent historical key transactions.
     *
     * @param keyId The key id.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over historical transactions.
     */
    keyHistory(keyId: string, page?: PageOpts): Paginator<ListHistoricalTxResponse, HistoricalTx[]>;
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
    contactCreate(name: string, addresses?: AddressMap, metadata?: JsonValue, editPolicy?: EditPolicy): Promise<ContactInfo>;
    /**
     * Returns the properties of a Contact.
     *
     * @param contactId The id of the contact you want to retrieve.
     * @returns The contact.
     */
    contactGet(contactId: string): Promise<ContactInfo>;
    /**
     * Lists contacts in the org.
     *
     * @param page The optional pagination options. Defaults to getting every contact.
     * @returns Paginator for iterating over the contacts in the org.
     */
    contactsList(page?: PageOpts): Paginator<ListContactsResponse, ContactInfo[]>;
    /**
     * Delete a contact, specified by its ID.
     *
     * Only the contact owner and org owners are allowed to delete contacts.
     * Additionally, the contact's edit policy (if set) must permit the deletion.
     *
     * @param contactId The contact to delete.
     * @returns An empty response.
     */
    contactDelete(contactId: string): Promise<Empty>;
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
    contactUpdate(contactId: string, request: UpdateContactRequest): Promise<ContactInfo>;
    /**
     * Create a new role.
     *
     * @param name The optional name of the role.
     * @returns The ID of the new role.
     */
    roleCreate(name?: string): Promise<string>;
    /**
     * Get a role by its id (or name).
     *
     * @param roleId The id of the role to get.
     * @returns The role.
     */
    roleGet(roleId: string): Promise<RoleInfo>;
    /**
     * Update a role.
     *
     * @param roleId The ID of the role to update.
     * @param request The update request.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The updated role information.
     */
    roleUpdate(roleId: string, request: UpdateRoleRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<RoleInfo>>;
    /**
     * Delete a role by its ID.
     *
     * @param roleId The ID of the role to delete.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    roleDelete(roleId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * List all roles in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over roles.
     */
    rolesList(page?: PageOpts): Paginator<ListRolesResponse, RoleInfo[]>;
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
    roleKeysAdd(roleId: string, keyIds: string[], policy?: KeyPolicy, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Remove an existing key from an existing role.
     *
     * @param roleId The ID of the role
     * @param keyId The ID of the key to remove from the role
     * @param mfaReceipt Optional MFA receipt(s)
     *
     * @returns A CubeSignerResponse indicating success or failure.
     */
    roleKeysRemove(roleId: string, keyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * List all keys in a role.
     *
     * @param roleId The ID of the role whose keys to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the keys in the role.
     */
    roleKeysList(roleId: string, page?: PageOpts): Paginator<ListRoleKeysResponse, KeyInRoleInfo[]>;
    /**
     * Get a key in a role by its ID.
     *
     * @param roleId The ID of the role.
     * @param keyId The ID of the key to get.
     * @param opts Optional options for getting the key.
     * @returns The key with policies information.
     */
    roleKeyGet(roleId: string, keyId: string, opts?: GetRoleKeyOptions): Promise<KeyWithPoliciesInfo>;
    /**
     * Add an existing user to an existing role.
     *
     * @param roleId The ID of the role.
     * @param userId The ID of the user to add to the role.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    roleUserAdd(roleId: string, userId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * Remove an existing user from an existing role.
     *
     * @param roleId The ID of the role.
     * @param userId The ID of the user to remove from the role.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    roleUserRemove(roleId: string, userId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * List all users in a role.
     *
     * @param roleId The ID of the role whose users to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId: string, page?: PageOpts): Paginator<ListRoleUsersResponse, UserInRoleInfo[]>;
    /**
     * Create a new named policy.
     *
     * @param name The name of the policy.
     * @param type The type of the policy.
     * @param rules The policy rules.
     * @returns The the new policy's info.
     */
    policyCreate(name: string, type: PolicyType, rules: KeyPolicy | RolePolicy | {
        hash: string;
    }[]): Promise<PolicyInfo>;
    /**
     * Get a named policy by its name or id.
     *
     * @param policyId The name or id of the policy to get.
     * @param version The policy version to get.
     * @returns The policy.
     */
    policyGet(policyId: string, version: policy.Version): Promise<PolicyInfo>;
    /**
     * List all named policies in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over policies.
     */
    policiesList(page?: PageOpts): Paginator<ListPoliciesResponse, PolicyInfo[]>;
    /**
     * Update a named policy.
     *
     * @param policyId The name or id of the policy to update.
     * @param request The update request.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The updated policy information.
     */
    policyUpdate(policyId: string, request: UpdatePolicyRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PolicyInfo>>;
    /**
     * Delete a named policy.
     *
     * @param policyId The name or id of the policy to delete.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns An empty response.
     */
    policyDelete(policyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Invoke a named policy.
     *
     * @param policyId The name or id of the policy to invoke.
     * @param version The policy version to invoke.
     * @param request The invoke request.
     * @returns The result of invoking the policy.
     */
    policyInvoke(policyId: string, version: string, request: InvokePolicyRequest): Promise<InvokePolicyResponse>;
    /**
     * Request an upload URL for uploading a Wasm policy object.
     *
     * @param request The policy upload request.
     * @returns The response containing the URL for uploading the policy.
     */
    wasmPolicyUpload(request: UploadWasmPolicyRequest): Promise<UploadWasmPolicyResponse>;
    /**
     * Create new user session (management and/or signing). The lifetime of
     * the new session is silently truncated to that of the current session.
     *
     * @param purpose The purpose of the session
     * @param scopes Session scopes.
     * @param lifetimes Lifetime settings
     * @returns New signer session info.
     */
    sessionCreate(purpose: string, scopes: Scope[], lifetimes?: SessionLifetime): Promise<SessionData>;
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
    sessionCreateExtended(purpose: string, scopes: Scope[], lifetime: SessionLifetime, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Create a new signer session for a given role.
     *
     * @param roleId Role ID
     * @param purpose The purpose of the session
     * @param scopes Session scopes. Not all scopes are valid for a role.
     * @param lifetimes Lifetime settings
     * @returns New signer session info.
     */
    sessionCreateForRole(roleId: string, purpose: string, scopes?: Scope[], lifetimes?: SessionLifetime): Promise<SessionData>;
    /**
     * Get session by id.
     *
     * @param sessionId The ID of the session to retrieve. This session by default
     * @returns Requested session metadata.
     */
    sessionGet(sessionId?: string): Promise<SessionInfo>;
    /**
     * Revoke a session.
     *
     * @param sessionId The ID of the session to revoke. This session by default
     */
    sessionRevoke(sessionId?: string): Promise<void>;
    /**
     * Revoke all sessions.
     *
     * @param selector Which sessions to revoke. If not defined, all the current user's sessions will be revoked.
     */
    sessionRevokeAll(selector?: SessionSelector): Promise<void>;
    /**
     * Returns a paginator for iterating over all signer sessions optionally filtered by a role.
     *
     * @param selector If set, limit to sessions for a specified user or a role.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Signer sessions for this role.
     */
    sessionsList(selector?: SessionSelector, page?: PageOpts): Paginator<SessionsResponse, SessionInfo[]>;
    /**
     * Returns the list of keys that this session has access to.
     *
     * @returns The list of keys.
     */
    sessionKeysList(): Promise<KeyInfo[]>;
    /**
     * Obtain proof of authentication using the current CubeSigner session.
     *
     * @returns Proof of authentication
     */
    identityProve(): Promise<IdentityProof>;
    /**
     * Checks if a given identity proof is valid.
     *
     * @param proof The proof of authentication.
     * @throws An error if proof is invalid
     */
    identityVerify(proof: IdentityProof): Promise<void>;
    /**
     * Associates an OIDC identity with the current user's account.
     *
     * @param body The request body, containing an OIDC token to prove the identity ownership.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns Empty or MFA approval request
     */
    identityAdd(body: AddIdentityRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Removes an OIDC identity from the current user's account.
     *
     * @param body The identity to remove.
     */
    identityRemove(body: OidcIdentity): Promise<void>;
    /**
     * Lists associated OIDC identities with the current user.
     *
     * @returns Associated identities
     */
    identityList(): Promise<ListIdentityResponse>;
    /**
     * Retrieves existing MFA request.
     *
     * @param mfaId MFA request ID
     * @returns MFA request information
     */
    mfaGet(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    mfaList(): Promise<MfaRequestInfo[]>;
    /**
     * Approve or reject a pending MFA request using the current session.
     *
     * @param mfaId The id of the MFA request
     * @param mfaVote Approve or reject the MFA request
     * @returns The result of the MFA request
     */
    mfaVoteCs(mfaId: string, mfaVote: MfaVote): Promise<MfaRequestInfo>;
    /**
     * Approve or reject a pending MFA request using TOTP.
     *
     * @param mfaId The ID of the MFA request
     * @param code The TOTP code
     * @param mfaVote Approve or reject the MFA request
     * @returns The current status of the MFA request
     */
    mfaVoteTotp(mfaId: string, code: string, mfaVote: MfaVote): Promise<MfaRequestInfo>;
    /**
     * Initiate approval of an existing MFA request using FIDO. A challenge is
     * returned which must be answered via {@link MfaFidoChallenge.answer} or {@link mfaVoteFidoComplete}.
     *
     * @param mfaId The MFA request ID.
     * @returns A challenge that needs to be answered to complete the approval.
     */
    mfaFidoInit(mfaId: string): Promise<MfaFidoChallenge>;
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
    mfaVoteFidoComplete(mfaId: string, mfaVote: MfaVote, challengeId: string, credential: PublicKeyCredential): Promise<MfaRequestInfo>;
    /**
     * Initiate MFA approval via email OTP.
     *
     * @param mfaId The MFA request ID
     * @param mfaVote Approve or reject the MFA request
     * @returns A challenge that needs to be answered to complete the approval.
     */
    mfaVoteEmailInit(mfaId: string, mfaVote: MfaVote): Promise<MfaEmailChallenge>;
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
    mfaVoteEmailComplete(mfaId: string, partialToken: string, signature: string): Promise<MfaRequestInfo>;
    /**
     * Sign an EVM transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature (or MFA approval request).
     */
    signEvm(key: Key | string, req: EvmSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EvmSignResponse>>;
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
    signEip191(key: Key | string, req: Eip191SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
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
    signEip712(key: Key | string, req: Eip712SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eip191Or712SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature
     */
    signEth2(key: Key | string, req: Eth2SignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2SignResponse>>;
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    signStake(req: Eth2StakeRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2StakeResponse>>;
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    signUnstake(key: Key | string, req: Eth2UnstakeRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Eth2UnstakeResponse>>;
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param tx Avalanche message (transaction) to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signAva(key: Key | string, tx: AvaTx, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<AvaSignResponse>>;
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
     * @param key The key to sign with (either {@link Key} or its ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBlob(key: Key | string, req: BlobSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BlobSignResponse>>;
    /**
     * Perform a Diffie-Hellman exchange.
     *
     * This requires the key to have a `"AllowDiffieHellmanExchange"' {@link KeyPolicy}. This is
     * because performing arbitrary Diffie-Hellman exchanges is, in general,
     * dangerous (and you should only use this API if you are 100% sure you
     * know what you are doing!).
     *
     * This function returns the raw response. If the original request included
     * a public key for encryption, the response can be decrypted using the
     * `diffieHellmanDecrypt` helper function. Otherwise, the response will
     * contain base64-encoded serialized public keys in a key-type--specific
     * format.
     *
     * @param key The key to use for Diffie-Hellman exchange (either {@link Key} or its ID).
     * @param req The Diffie-Hellman request to send.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    diffieHellmanExchange(key: Key | string, req: DiffieHellmanRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<DiffieHellmanResponse>>;
    /**
     * Sign a Bitcoin transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBtc(key: Key | string, req: BtcSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BtcSignResponse>>;
    /**
     * Sign a Bitcoin BIP-137 message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBtcMessage(key: Key | string, req: BtcMessageSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BtcMessageSignResponse>>;
    /**
     * Sign a Taproot transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signTaproot(key: Key | string, req: TaprootSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<TaprootSignResponse>>;
    /**
     * Sign a PSBT.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signPsbt(key: Key | string, req: PsbtSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PsbtSignResponse>>;
    /**
     * Generate an Extractable One-Time Signature
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signEots(key: Key | string, req: EotsSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EotsSignResponse>>;
    /**
     * Generates a set of Babylon EOTS nonces for a specified chain-id, starting at a specified block height.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What and how many nonces to create
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    eotsCreateNonce(key: Key | string, req: EotsCreateNonceRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<EotsCreateNonceResponse>>;
    /**
     * Sign a Babylon staking transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID). For a deposit, this can be either a Segwit or a Taproot key. For any other request type, this just be a Taproot key.
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBabylonStakingTxn(key: Key | string, req: BabylonStakingRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BabylonStakingResponse>>;
    /**
     * Sign a Babylon staking registration request.
     *
     * @param key The Taproot key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signBabylonRegistration(key: Key | string, req: BabylonRegistrationRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<BabylonRegistrationResponse>>;
    /**
     * Sign a Solana message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signSolana(key: Key | string, req: SolanaSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SolanaSignResponse>>;
    /**
     * Sign a MMI pending message.
     *
     * @param message the message info.
     * @param mfaReceipt optional MFA receipt(s).
     * @returns the updated message.
     */
    signMmi(message: PendingMessageInfo, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<PendingMessageSignResponse>>;
    /**
     * Sign a SUI transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param request What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    signSui(key: Key | string, request: SuiSignRequest, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<SuiSignResponse>>;
    /**
     * List outstanding user-export requests.
     *
     * @param keyId Optional key ID. If supplied, list the outstanding request (if any) only for the specified key; otherwise, list all outstanding requests for the specified user.
     * @param userId Optional user ID. If omtted, uses the current user's ID. Only org owners can list user-export requests for users other than themselves.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the result set.
     */
    userExportList(keyId?: string, userId?: string, page?: PageOpts): Paginator<UserExportListResponse, UserExportInitResponse[]>;
    /**
     * Delete an outstanding user-export request.
     *
     * @param keyId The key-id corresponding to the user-export request to delete.
     * @param userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    userExportDelete(keyId: string, userId?: string): Promise<void>;
    /**
     * Initiate a user-export request.
     *
     * @param keyId The key-id for which to initiate an export.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    userExportInit(keyId: string, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<UserExportInitResponse>>;
    /**
     * Complete a user-export request.
     *
     * @param keyId The key-id for which to initiate an export.
     * @param publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    userExportComplete(keyId: string, publicKey: CryptoKey, mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<UserExportCompleteResponse>>;
    /**
     * Request a fresh key-import key.
     *
     * @returns A fresh key-import key
     */
    createKeyImportKey(): Promise<CreateKeyImportKeyResponse>;
    /**
     * Import one or more keys. To use this functionality, you must first create an
     * encrypted key-import request using the `@cubist-labs/cubesigner-sdk-key-import`
     * library. See that library's documentation for more info.
     *
     * @param body An encrypted key-import request.
     * @returns The newly imported keys.
     */
    importKeys(body: ImportKeyRequest): Promise<KeyInfo[]>;
    /**
     * Send a heartbeat / upcheck request.
     */
    heartbeat(): Promise<void>;
    /**
     * Call the MMI JSON RPC endpoint.
     *
     * @param method The name of the method to call.
     * @param params The list of method parameters.
     * @returns the return value of the method.
     * @internal
     */
    mmi(method: MmiJrpcMethod, params: JsonArray): Promise<JrpcResponse>;
    /**
     * List pending MMI messages.
     *
     * @returns The list of pending MMI messages.
     */
    mmiList(): Promise<PendingMessageInfo[]>;
    /**
     * Get a pending MMI message by its ID.
     *
     * @param msgId The ID of the pending message.
     * @returns The pending MMI message.
     */
    mmiGet(msgId: string): Promise<PendingMessageInfo>;
    /**
     * Delete the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     */
    mmiDelete(msgId: string): Promise<void>;
    /**
     * Reject the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     * @returns The message with updated information
     */
    mmiReject(msgId: string): Promise<PendingMessageInfo>;
    /**
     * Returns public org information.
     *
     * @param env The environment to log into
     * @param orgId The org to log into
     * @returns Public org information
     */
    static publicOrgInfo(env: EnvInterface, orgId: string): Promise<PublicOrgInfo>;
    /**
     * Returns a JSON Web Key Set (JWKS) with the keys used for key attestations (see {@link keyAttest}).
     *
     * @param env The CubeSigner environment
     * @returns A JWKS with they keys used for key attestation.
     */
    static attestationJwks(env: EnvInterface): Promise<schemas["JwkSetResponse"]>;
    /**
     * Sends an email to the given address with a list of orgs the user is a member of.
     *
     * @param env The environment to use
     * @param email The user's email
     * @returns Empty response
     */
    static emailMyOrgs(env: EnvInterface, email: string): Promise<{
        status: string;
    }>;
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
    static oidcSessionCreate(env: EnvInterface, orgId: string, token: string, scopes: Array<Scope>, lifetimes?: RatchetConfig, mfaReceipt?: MfaReceipts, purpose?: string): Promise<CubeSignerResponse<SessionData>>;
    /**
     * Initiate login via Sign-in With Ethereum (SIWE).
     *
     * The response contains a challenge which must be answered (via {@link siweLoginComplete})
     * to obtain an OIDC token.
     *
     * @param env The environment to use
     * @param orgId The org to login to
     * @param body The request body
     * @returns The challenge that needs to be answered via {@link siweLoginComplete}
     */
    static siweLoginInit(env: EnvInterface, orgId: string, body: schemas["SiweInitRequest"]): Promise<schemas["SiweInitResponse"]>;
    /**
     * Complete login via Sign-in With Ethereum (SIWE).
     *
     * The challenge returned by {@link siweLoginInit} should be signed
     * and submitted via this API call to obtain an OIDC token, which can
     * then be used to log in via {@link oidcSessionCreate}.
     *
     * @param env The environment to use
     * @param orgId The org to login to
     * @param body The request body
     * @returns An OIDC token which can be used to log in via OIDC (see {@link oidcSessionCreate})
     */
    static siweLoginComplete(env: EnvInterface, orgId: string, body: schemas["SiweCompleteRequest"]): Promise<schemas["SiweCompleteResponse"]>;
    /**
     * Initiate the login with passkey flow.
     *
     * @param env The environment to log into
     * @param body The login request
     * @returns The challenge that must be answered (see {@link passkeyLoginComplete}) to log in.
     */
    static passkeyLoginInit(env: EnvInterface, body: LoginRequest): Promise<PasskeyLoginChallenge>;
    /**
     * Answer the login with passkey challenge returned from {@link passkeyLoginInit}.
     *
     * @param env The environment to log into
     * @param body The request body
     * @param purpose Optional descriptive session purpose
     * @returns The session data
     */
    static passkeyLoginComplete(env: EnvInterface, body: PasskeyAssertAnswer, purpose?: string | null): Promise<SessionData>;
    /**
     * Accept an invitation to join a CubeSigner org.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     */
    static idpAcceptInvite(env: EnvInterface, orgId: string, body: InvitationAcceptRequest): Promise<void>;
    /**
     * Unauthenticated endpoint for authenticating with email/password.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @returns Returns an OIDC token which can be used
     *   to log in via OIDC (see {@link oidcSessionCreate}).
     */
    static idpAuthenticate(env: EnvInterface, orgId: string, body: AuthenticationRequest): Promise<AuthenticationResponse>;
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @returns Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static idpPasswordResetRequest(env: EnvInterface, orgId: string, body: PasswordResetRequest): Promise<EmailOtpResponse>;
    /**
     * Unauthenticated endpoint for confirming a previously initiated password reset request.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param partialToken The partial token returned by {@link passwordResetRequest}
     * @param signature The one-time code (signature in this case) sent via email
     * @param newPassword The new password
     */
    static idpPasswordResetConfirm(env: EnvInterface, orgId: string, partialToken: string, signature: string, newPassword: string): Promise<void>;
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @returns Proof of authentication
     */
    static identityProveOidc(env: EnvInterface, orgId: string, token: string): Promise<IdentityProof>;
    /**
     * Obtain all organizations a user is a member of
     *
     * @param env The environment to log into
     * @param token The oidc token identifying the user
     * @returns The organization the user belongs to
     */
    static userOrgs(env: EnvInterface, token: string): Promise<UserOrgsResponse>;
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
    migrateAddIdentities(body: schemas["MigrateIdentityRequest"]): Promise<{
        status: string;
    }>;
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
    migrateRemoveIdentities(body: schemas["MigrateIdentityRequest"]): Promise<{
        status: string;
    }>;
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
    migrateUserProfiles(body: schemas["MigrateUpdateUsersRequest"]): Promise<{
        status: string;
    }>;
}
//# sourceMappingURL=api_client.d.ts.map