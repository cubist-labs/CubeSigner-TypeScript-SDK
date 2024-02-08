import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";
import { CubeSignerApi, OidcClient } from "./api";
import { KeyType, Key } from "./key";
import { MfaRequestInfo, OrgInfo, PublicKeyCredential, RatchetConfig } from "./schema_types";
import { MfaReceipt } from "./mfa";
import { PageOpts } from "./paginator";
import { Role } from "./role";
import { AddFidoChallenge, MfaFidoChallenge, TotpChallenge } from "./mfa";
/** Options for logging in with OIDC token */
export interface OidcAuthOptions {
    /** Optional token lifetimes */
    lifetimes?: RatchetConfig;
    /** Optional MFA receipt */
    mfaReceipt?: MfaReceipt;
    /** Optional storage to use for the returned session (defaults to {@link MemorySessionStorage}) */
    storage?: SignerSessionStorage;
}
/**
 * Client to use to send requests to CubeSigner services
 * when authenticating using a CubeSigner session token.
 */
export declare class CubeSignerClient extends CubeSignerApi {
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
    /**
     * Loads an existing management session and creates a {@link CubeSignerClient} instance.
     *
     * @param {SignerSessionStorage} storage Storage from which to load the session
     * @return {Promise<CubeSignerClient>} New CubeSigner instance
     */
    static loadManagementSession(storage: SignerSessionStorage): Promise<CubeSignerClient>;
    /**
     * Create a new signing key.
     * @param {KeyType} type The type of key to create.
     * @param {string?} ownerId The owner of the key. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    createKey(type: KeyType, ownerId?: string): Promise<Key>;
    /**
     * Create new signing keys.
     * @param {KeyType} type The type of key to create.
     * @param {number} count The number of keys to create.
     * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
     * @return {Key[]} The new keys.
     */
    createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]>;
    /**
     * Derive a key of the given type using the given derivation path and mnemonic.
     * The owner of the derived key will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string} derivationPath Mnemonic derivation path used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key} newly derived key or undefined if it already exists.
     */
    deriveKey(type: KeyType, derivationPath: string, mnemonicId: string): Promise<Key | undefined>;
    /**
     * Derive a set of keys of the given type using the given derivation paths and mnemonic.
     *
     * The owner of the derived keys will be the owner of the mnemonic.
     *
     * @param {KeyType} type Type of key to derive from the mnemonic.
     * @param {string[]} derivationPaths Mnemonic derivation paths used to generate new key.
     * @param {string} mnemonicId materialId of mnemonic key used to derive the new key.
     *
     * @return {Key[]} newly derived keys.
     */
    deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]>;
    /**
     * Create a new {@link OidcClient} that will use a given OIDC token for auth.
     * @param {string} oidcToken The authentication token to use
     * @return {OidcClient} New OIDC client.
     */
    newOidcClient(oidcToken: string): OidcClient;
    /**
     * Authenticate an OIDC user and create a new session manager for them.
     *
     * @param {string} oidcToken The OIDC token
     * @param {List<string>} scopes The scopes of the resulting session
     * @param {OidcAuthOptions} options Options.
     * @return {Promise<SignerSessionManager>} The signer session manager
     */
    oidcAuth(oidcToken: string, scopes: Array<string>, options?: OidcAuthOptions): Promise<SignerSessionManager>;
    /**
     * Create a new user in the organization and sends an invitation to that user.
     *
     * Same as {@link orgUserInvite}.
     */
    get createUser(): (email: string, name: string, role?: "Alien" | "Member" | "Owner" | undefined) => Promise<void>;
    /**
     * Create a new OIDC user.
     *
     * Same as {@link orgUserCreateOidc}.
     */
    get createOidcUser(): (identity: {
        iss: string;
        sub: string;
    }, email: string, opts?: import("./schema_types").CreateOidcUserOptions) => Promise<string>;
    /**
     * Delete an existing OIDC user.
     *
     * Same as {@link orgUserDeleteOidc}.
     */
    get deleteOidcUser(): (identity: {
        iss: string;
        sub: string;
    }) => Promise<{
        status: string;
    }>;
    /**
     * List users in the organization.
     *
     * Same as {@link orgUsersList}
     */
    get users(): () => Promise<{
        email: string;
        id: string;
        membership: "Alien" | "Member" | "Owner";
        name?: string | null | undefined;
    }[]>;
    /**
     * Obtain information about the current user.
     *
     * Same as {@link userGet}
     */
    get user(): () => Promise<{
        email: string;
        mfa: ({
            type: "totp";
        } | {
            id: string;
            name: string;
            type: "fido";
        })[];
        mfa_policy?: unknown;
        name?: string | null | undefined;
        org_ids: string[];
        user_id: string;
    }>;
    /**
     * Get information about a specific org.
     *
     * @param {string?} orgId The ID or name of the org
     * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
     */
    org(orgId?: string): Promise<OrgInfo>;
    /**
     * Obtain information about the current user.
     *
     * Same as {@link userGet}
     */
    get aboutMe(): () => Promise<{
        email: string;
        mfa: ({
            type: "totp";
        } | {
            id: string;
            name: string;
            type: "fido";
        })[];
        mfa_policy?: unknown;
        name?: string | null | undefined;
        org_ids: string[];
        user_id: string;
    }>;
    /**
     * Get a key by id.
     *
     * @param {string} keyId The id of the key to get.
     * @return {Key} The key.
     */
    getKey(keyId: string): Promise<Key>;
    /**
     * Get all keys in the org.
     *
     * @param {KeyType?} type Optional key type to filter list for.
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Promise<Key[]>} The keys.
     */
    orgKeys(type?: KeyType, page?: PageOpts): Promise<Key[]>;
    /**
     * Create a new role.
     *
     * @param {string?} name The name of the role.
     * @return {Role} The new role.
     */
    createRole(name?: string): Promise<Role>;
    /**
     * Get a role by id or name.
     *
     * @param {string} roleId The id or name of the role to get.
     * @return {Role} The role.
     */
    getRole(roleId: string): Promise<Role>;
    /**
     * List all roles in the org.
     *
     * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
     * @return {Role[]} The roles.
     */
    listRoles(page?: PageOpts): Promise<Role[]>;
    /**
     * List all users in the org.
     *
     * Same as {@link orgUsersList}
     */
    get listUsers(): () => Promise<{
        email: string;
        id: string;
        membership: "Alien" | "Member" | "Owner";
        name?: string | null | undefined;
    }[]>;
    /**
     * Approve a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    mfaApprove(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Reject a pending MFA request using the current session.
     *
     * @param {string} mfaId The id of the MFA request
     * @return {Promise<MfaRequestInfo>} The result of the MFA request
     */
    mfaReject(mfaId: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request.
     *
     * Same as {@link mfaApprove}
     */
    get approveMfaRequest(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: unknown;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ({
                FidoKey: {
                    key_id: string;
                };
            } | "CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * Approve a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to approve
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    mfaApproveTotp(mfaId: string, code: string): Promise<MfaRequestInfo>;
    /**
     * Reject a pending MFA request using TOTP.
     *
     * @param {string} mfaId The MFA request to reject
     * @param {string} code The TOTP code
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request
     */
    mfaRejectTotp(mfaId: string, code: string): Promise<MfaRequestInfo>;
    /**
     * Approve a pending MFA request using TOTP.
     *
     * Same as {@link mfaApproveTotp}
     */
    get totpApprove(): (mfaId: string, code: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: unknown;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ({
                FidoKey: {
                    key_id: string;
                };
            } | "CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * Initiate approval of an existing MFA request using FIDO.
     *
     * Returns a {@link MfaFidoChallenge} that must be answered by calling
     * {@link MfaFidoChallenge.answer} or {@link fidoApproveComplete}.
     *
     * Same as {@link mfaApproveFidoInit}
     */
    get fidoApproveFidoInit(): (mfaId: string) => Promise<MfaFidoChallenge>;
    /**
     * Initiate approval of an existing MFA request using FIDO.
     *
     * Returns a {@link MfaFidoChallenge} that must be answered by calling
     * {@link MfaFidoChallenge.answer} or {@link fidoApproveComplete}.
     *
     * Same as {@link mfaApproveFidoInit}
     */
    get fidoApproveStart(): (mfaId: string) => Promise<MfaFidoChallenge>;
    /**
     * Approve a previously initiated (via {@link mfaApproveFidoInit}) MFA request using FIDO.
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
     * Reject a previously initiated (via {@link mfaApproveFidoInit}) MFA request using FIDO.
     *
     * Instead of calling this method directly, prefer {@link MfaFidoChallenge.answer} or
     * {@link MfaFidoChallenge.createCredentialAndAnswer}.
     *
     * @param {string} mfaId The MFA request ID
     * @param {string} challengeId The ID of the challenge issued by {@link mfaApproveFidoInit}
     * @param {PublicKeyCredential} credential The answer to the challenge
     * @return {Promise<MfaRequestInfo>} The current status of the MFA request.
     */
    mfaRejectFidoComplete(mfaId: string, challengeId: string, credential: PublicKeyCredential): Promise<MfaRequestInfo>;
    /**
     * Answer the MFA approval with FIDO challenge issued by {@link fidoApproveStart}.
     *
     * Same as {@link mfaApproveFidoComplete}
     */
    get fidoApproveComplete(): (mfaId: string, challengeId: string, credential: {
        clientExtensionResults?: unknown;
        id: string;
        response: {
            authenticatorData: string;
            clientDataJSON: string;
            signature: string;
            userHandle?: string | null | undefined;
        } | {
            attestationObject: string;
            clientDataJSON: string;
        };
    }) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: unknown;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ({
                FidoKey: {
                    key_id: string;
                };
            } | "CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * Get a pending MFA request by its id.
     *
     * Same as {@link mfaGet}
     */
    get getMfaInfo(): (mfaId: string) => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: unknown;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ({
                FidoKey: {
                    key_id: string;
                };
            } | "CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }>;
    /**
     * List pending MFA requests accessible to the current user.
     *
     * Same as {@link mfaList}
     */
    get listMfaInfos(): () => Promise<{
        expires_at: number;
        id: string;
        receipt?: {
            confirmation: string;
            final_approver: string;
            timestamp: number;
        } | null | undefined;
        request: {
            body?: unknown;
            method: string;
            path: string;
        };
        status: {
            allowed_approvers: string[];
            allowed_mfa_types?: ({
                FidoKey: {
                    key_id: string;
                };
            } | "CubeSigner" | "Totp" | "Fido")[] | null | undefined;
            approved_by: {
                [key: string]: {
                    [key: string]: {
                        timestamp: number;
                    };
                };
            };
            count: number;
            num_auth_factors: number;
        };
    }[]>;
    /**
     * Obtain a proof of authentication.
     *
     * Same as {@link identityProve}
     */
    get proveIdentity(): () => Promise<{
        aud?: string | null | undefined;
        email?: string | null | undefined;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        preferred_username?: string | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            name?: string | null | undefined;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }>;
    /**
     * Check if a given proof of OIDC authentication is valid.
     *
     * Same as {@link identityVerify}
     */
    get verifyIdentity(): (proof: {
        aud?: string | null | undefined;
        email?: string | null | undefined;
        exp_epoch: number;
        identity?: {
            iss: string;
            sub: string;
        } | null | undefined;
        preferred_username?: string | null | undefined;
        user_info?: {
            configured_mfa: ({
                type: "totp";
            } | {
                id: string;
                name: string;
                type: "fido";
            })[];
            initialized: boolean;
            name?: string | null | undefined;
            user_id: string;
        } | null | undefined;
    } & {
        id: string;
    }) => Promise<void>;
    /**
     * Creates a request to add a new FIDO device.
     *
     * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
     *
     * MFA may be required.
     *
     * Same as {@link userFidoRegisterInit}
     */
    get addFidoStart(): (name: string, mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<AddFidoChallenge>>;
    /**
     * Delete a FIDO key from the user's account.
     * Allowed only if TOTP is also defined.
     * MFA via TOTP is always required.
     *
     * Same as {@link userFidoDelete}
     */
    get deleteFido(): (fidoId: string, mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
     * that must be answered by calling {@link TotpChallenge.answer} or
     * {@link resetTotpComplete}.
     *
     * Same as {@link userTotpResetInit}
     */
    get resetTotpStart(): (issuer?: string | undefined, mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<TotpChallenge>>;
    /**
     * Answer the TOTP challenge issued by {@link resetTotpStart}. If successful,
     * user's TOTP configuration will be updated to that of the TOTP challenge.
     *
     * Same as {@link userTotpResetComplete}
     */
    get resetTotpComplete(): (totpId: string, code: string) => Promise<void>;
    /**
     * Verifies a given TOTP code against the current user's TOTP configuration.
     * Throws an error if the verification fails.
     *
     * Same as {@link userTotpVerify}
     */
    get verifyTotp(): (code: string) => Promise<void>;
    /**
     * Delete TOTP from the user's account.
     * Allowed only if at least one FIDO key is registered with the user's account.
     * MFA via FIDO is always required.
     *
     * Same as {@link userTotpDelete}.
     */
    get deleteTotp(): (mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        status: string;
    }>>;
    /**
     * Sign a stake request.
     *
     * Same as {@link signStake}
     */
    get stake(): (req: {
        chain_id: number;
        deposit_type: "Canonical" | "Wrapper";
        staking_amount_gwei?: number | undefined;
        unsafe_conf?: {
            deposit_contract_addr?: string | null | undefined;
            genesis_fork_version?: string | null | undefined;
        } | null | undefined;
        validator_key?: string | null | undefined;
        withdrawal_addr: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        created_validator_key_id: string;
        deposit_tx: {
            chain_id: number;
            deposit_txn: Record<string, never>;
            new_validator_pk: string;
        };
    }>>;
    /**
     * Sign an unstake request.
     *
     * Same as {@link signUnstake}
     */
    get unstake(): (key: string | Key, req: {
        epoch?: string | null | undefined;
        fork: {
            current_version: string;
            epoch: string;
            previous_version: string;
        };
        genesis_data: {
            genesis_fork_version: string;
            genesis_time: string;
            genesis_validators_root: string;
        };
        network: "mainnet" | "prater" | "goerli" | "holesky";
        validator_index: string;
    }, mfaReceipt?: MfaReceipt | undefined) => Promise<import("./response").CubeSignerResponse<{
        message: {
            epoch: string;
            validator_index: string;
        };
        signature: string;
    }>>;
}
