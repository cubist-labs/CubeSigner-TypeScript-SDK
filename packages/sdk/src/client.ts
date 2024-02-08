import { SignerSessionManager, SignerSessionStorage } from "./session/signer_session_manager";
import { CubeSignerApi, OidcClient } from "./api";
import { KeyType, Key } from "./key";
import { MfaRequestInfo, OrgInfo, PublicKeyCredential, RatchetConfig } from "./schema_types";
import { MfaReceipt } from "./mfa";
import { PageOpts } from "./paginator";
import { Role } from "./role";

// used in doc comments
// eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
import { AddFidoChallenge, MfaFidoChallenge, TotpChallenge } from "./mfa";
import { MemorySessionStorage } from "./session/session_storage";

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
export class CubeSignerClient extends CubeSignerApi {
  /**
   * Constructor.
   * @param {SignerSessionManager} sessionMgr The session manager to use
   * @param {string?} orgId Optional organization ID; if omitted, uses the org ID from the session manager.
   */
  constructor(sessionMgr: SignerSessionManager, orgId?: string) {
    super(sessionMgr, orgId);
  }

  /**
   * Returns a new instance of this class using the same session manager but targeting a different organization.
   *
   * @param {string} orgId The organization ID.
   * @return {CubeSignerClient} A new instance of this class using the same session manager but targeting different organization.
   */
  withOrg(orgId?: string): CubeSignerClient {
    return orgId ? new CubeSignerClient(this.sessionMgr, orgId) : this;
  }

  /**
   * Loads an existing management session and creates a {@link CubeSignerClient} instance.
   *
   * @param {SignerSessionStorage} storage Storage from which to load the session
   * @return {Promise<CubeSignerClient>} New CubeSigner instance
   */
  static async loadManagementSession(storage: SignerSessionStorage): Promise<CubeSignerClient> {
    // Throw and actionable error if the management session file contains a Cognito session
    const session = await storage.retrieve();
    if ((session as unknown as { id_token: string }).id_token) {
      throw new Error(
        `It appears that the storage contains the old (Cognito) session; please update your session by updating your 'cs' to version 'v0.37.0' or later and then running 'cs login'`,
      );
    }

    const mgr = await SignerSessionManager.loadFromStorage(storage);
    return new CubeSignerClient(mgr);
  }

  /**
   * Create a new signing key.
   * @param {KeyType} type The type of key to create.
   * @param {string?} ownerId The owner of the key. Defaults to the session's user.
   * @return {Key[]} The new keys.
   */
  async createKey(type: KeyType, ownerId?: string): Promise<Key> {
    return (await this.createKeys(type, 1, ownerId))[0];
  }

  /**
   * Create new signing keys.
   * @param {KeyType} type The type of key to create.
   * @param {number} count The number of keys to create.
   * @param {string?} ownerId The owner of the keys. Defaults to the session's user.
   * @return {Key[]} The new keys.
   */
  async createKeys(type: KeyType, count: number, ownerId?: string): Promise<Key[]> {
    const keys = await this.keysCreate(type, count, ownerId);
    return keys.map((k) => new Key(this, k));
  }

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
  async deriveKey(
    type: KeyType,
    derivationPath: string,
    mnemonicId: string,
  ): Promise<Key | undefined> {
    return (await this.deriveKeys(type, [derivationPath], mnemonicId))[0];
  }

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
  async deriveKeys(type: KeyType, derivationPaths: string[], mnemonicId: string): Promise<Key[]> {
    const keys = await this.keysDerive(type, derivationPaths, mnemonicId);
    return keys.map((k) => new Key(this, k));
  }

  /**
   * Create a new {@link OidcClient} that will use a given OIDC token for auth.
   * @param {string} oidcToken The authentication token to use
   * @return {OidcClient} New OIDC client.
   */
  newOidcClient(oidcToken: string): OidcClient {
    return new OidcClient(this.sessionMgr.env, this.orgId, oidcToken);
  }

  /**
   * Authenticate an OIDC user and create a new session manager for them.
   *
   * @param {string} oidcToken The OIDC token
   * @param {List<string>} scopes The scopes of the resulting session
   * @param {OidcAuthOptions} options Options.
   * @return {Promise<SignerSessionManager>} The signer session manager
   */
  async oidcAuth(
    oidcToken: string,
    scopes: Array<string>,
    options?: OidcAuthOptions,
  ): Promise<SignerSessionManager> {
    const oidcClient = this.newOidcClient(oidcToken);
    const resp = await oidcClient.sessionCreate(scopes, options?.lifetimes, options?.mfaReceipt);
    return await SignerSessionManager.loadFromStorage(new MemorySessionStorage(resp.data()));
  }

  /**
   * Create a new user in the organization and sends an invitation to that user.
   *
   * Same as {@link orgUserInvite}.
   */
  get createUser() {
    return this.orgUserInvite.bind(this);
  }

  /**
   * Create a new OIDC user.
   *
   * Same as {@link orgUserCreateOidc}.
   */
  get createOidcUser() {
    return this.orgUserCreateOidc.bind(this);
  }

  /**
   * Delete an existing OIDC user.
   *
   * Same as {@link orgUserDeleteOidc}.
   */
  get deleteOidcUser() {
    return this.orgUserDeleteOidc.bind(this);
  }

  /**
   * List users in the organization.
   *
   * Same as {@link orgUsersList}
   */
  get users() {
    return this.orgUsersList.bind(this);
  }

  /**
   * Obtain information about the current user.
   *
   * Same as {@link userGet}
   */
  get user() {
    return this.userGet.bind(this);
  }

  /**
   * Get information about a specific org.
   *
   * @param {string?} orgId The ID or name of the org
   * @return {Promise<OrgInfo>} CubeSigner client for the requested org.
   */
  async org(orgId?: string): Promise<OrgInfo> {
    return await this.withOrg(orgId).orgGet();
  }

  /**
   * Obtain information about the current user.
   *
   * Same as {@link userGet}
   */
  get aboutMe() {
    return this.userGet.bind(this);
  }

  /**
   * Get a key by id.
   *
   * @param {string} keyId The id of the key to get.
   * @return {Key} The key.
   */
  async getKey(keyId: string): Promise<Key> {
    const keyInfo = await this.keyGet(keyId);
    return new Key(this, keyInfo);
  }

  /**
   * Get all keys in the org.
   *
   * @param {KeyType?} type Optional key type to filter list for.
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Promise<Key[]>} The keys.
   */
  async orgKeys(type?: KeyType, page?: PageOpts): Promise<Key[]> {
    const paginator = this.keysList(type, page);
    const keys = await paginator.fetch();
    return keys.map((k) => new Key(this, k));
  }

  /**
   * Create a new role.
   *
   * @param {string?} name The name of the role.
   * @return {Role} The new role.
   */
  async createRole(name?: string): Promise<Role> {
    const roleId = await this.roleCreate(name);
    const roleInfo = await this.roleGet(roleId);
    return new Role(this, roleInfo);
  }

  /**
   * Get a role by id or name.
   *
   * @param {string} roleId The id or name of the role to get.
   * @return {Role} The role.
   */
  async getRole(roleId: string): Promise<Role> {
    const roleInfo = await this.roleGet(roleId);
    return new Role(this, roleInfo);
  }

  /**
   * List all roles in the org.
   *
   * @param {PageOpts} page Pagination options. Defaults to fetching the entire result set.
   * @return {Role[]} The roles.
   */
  async listRoles(page?: PageOpts): Promise<Role[]> {
    const roles = await this.rolesList(page).fetch();
    return roles.map((r) => new Role(this, r));
  }

  /**
   * List all users in the org.
   *
   * Same as {@link orgUsersList}
   */
  get listUsers() {
    return this.orgUsersList.bind(this);
  }

  /**
   * Approve a pending MFA request using the current session.
   *
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaApprove(mfaId: string): Promise<MfaRequestInfo> {
    return await this.mfaVoteCs(mfaId, "approve");
  }

  /**
   * Reject a pending MFA request using the current session.
   *
   * @param {string} mfaId The id of the MFA request
   * @return {Promise<MfaRequestInfo>} The result of the MFA request
   */
  async mfaReject(mfaId: string): Promise<MfaRequestInfo> {
    return await this.mfaVoteCs(mfaId, "reject");
  }

  /**
   * Approve a pending MFA request.
   *
   * Same as {@link mfaApprove}
   */
  get approveMfaRequest() {
    return this.mfaApprove.bind(this);
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * @param {string} mfaId The MFA request to approve
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request
   */
  async mfaApproveTotp(mfaId: string, code: string): Promise<MfaRequestInfo> {
    return await this.mfaVoteTotp(mfaId, code, "approve");
  }

  /**
   * Reject a pending MFA request using TOTP.
   *
   * @param {string} mfaId The MFA request to reject
   * @param {string} code The TOTP code
   * @return {Promise<MfaRequestInfo>} The current status of the MFA request
   */
  async mfaRejectTotp(mfaId: string, code: string): Promise<MfaRequestInfo> {
    return await this.mfaVoteTotp(mfaId, code, "reject");
  }

  /**
   * Approve a pending MFA request using TOTP.
   *
   * Same as {@link mfaApproveTotp}
   */
  get totpApprove() {
    return this.mfaApproveTotp.bind(this);
  }

  /**
   * Initiate approval of an existing MFA request using FIDO.
   *
   * Returns a {@link MfaFidoChallenge} that must be answered by calling
   * {@link MfaFidoChallenge.answer} or {@link fidoApproveComplete}.
   *
   * Same as {@link mfaApproveFidoInit}
   */
  get fidoApproveFidoInit() {
    return this.mfaFidoInit.bind(this);
  }

  /**
   * Initiate approval of an existing MFA request using FIDO.
   *
   * Returns a {@link MfaFidoChallenge} that must be answered by calling
   * {@link MfaFidoChallenge.answer} or {@link fidoApproveComplete}.
   *
   * Same as {@link mfaApproveFidoInit}
   */
  get fidoApproveStart() {
    return this.mfaFidoInit.bind(this);
  }

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
  async mfaApproveFidoComplete(
    mfaId: string,
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<MfaRequestInfo> {
    return await this.mfaVoteFidoComplete(mfaId, "approve", challengeId, credential);
  }

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
  async mfaRejectFidoComplete(
    mfaId: string,
    challengeId: string,
    credential: PublicKeyCredential,
  ): Promise<MfaRequestInfo> {
    return await this.mfaVoteFidoComplete(mfaId, "reject", challengeId, credential);
  }

  /**
   * Answer the MFA approval with FIDO challenge issued by {@link fidoApproveStart}.
   *
   * Same as {@link mfaApproveFidoComplete}
   */
  get fidoApproveComplete() {
    return this.mfaApproveFidoComplete.bind(this);
  }

  /**
   * Get a pending MFA request by its id.
   *
   * Same as {@link mfaGet}
   */
  get getMfaInfo() {
    return this.mfaGet.bind(this);
  }

  /**
   * List pending MFA requests accessible to the current user.
   *
   * Same as {@link mfaList}
   */
  get listMfaInfos() {
    return this.mfaList.bind(this);
  }

  /**
   * Obtain a proof of authentication.
   *
   * Same as {@link identityProve}
   */
  get proveIdentity() {
    return this.identityProve.bind(this);
  }

  /**
   * Check if a given proof of OIDC authentication is valid.
   *
   * Same as {@link identityVerify}
   */
  get verifyIdentity() {
    return this.identityVerify.bind(this);
  }

  /**
   * Creates a request to add a new FIDO device.
   *
   * Returns a {@link AddFidoChallenge} that must be answered by calling {@link AddFidoChallenge.answer}.
   *
   * MFA may be required.
   *
   * Same as {@link userFidoRegisterInit}
   */
  get addFidoStart() {
    return this.userFidoRegisterInit.bind(this);
  }

  /**
   * Delete a FIDO key from the user's account.
   * Allowed only if TOTP is also defined.
   * MFA via TOTP is always required.
   *
   * Same as {@link userFidoDelete}
   */
  get deleteFido() {
    return this.userFidoDelete.bind(this);
  }

  /**
   * Creates a request to change user's TOTP. Returns a {@link TotpChallenge}
   * that must be answered by calling {@link TotpChallenge.answer} or
   * {@link resetTotpComplete}.
   *
   * Same as {@link userTotpResetInit}
   */
  get resetTotpStart() {
    return this.userTotpResetInit.bind(this);
  }

  /**
   * Answer the TOTP challenge issued by {@link resetTotpStart}. If successful,
   * user's TOTP configuration will be updated to that of the TOTP challenge.
   *
   * Same as {@link userTotpResetComplete}
   */
  get resetTotpComplete() {
    return this.userTotpResetComplete.bind(this);
  }

  /**
   * Verifies a given TOTP code against the current user's TOTP configuration.
   * Throws an error if the verification fails.
   *
   * Same as {@link userTotpVerify}
   */
  get verifyTotp() {
    return this.userTotpVerify.bind(this);
  }

  /**
   * Delete TOTP from the user's account.
   * Allowed only if at least one FIDO key is registered with the user's account.
   * MFA via FIDO is always required.
   *
   * Same as {@link userTotpDelete}.
   */
  get deleteTotp() {
    return this.userTotpDelete.bind(this);
  }

  /**
   * Sign a stake request.
   *
   * Same as {@link signStake}
   */
  get stake() {
    return this.signStake.bind(this);
  }

  /**
   * Sign an unstake request.
   *
   * Same as {@link signUnstake}
   */
  get unstake() {
    return this.signUnstake.bind(this);
  }
}
