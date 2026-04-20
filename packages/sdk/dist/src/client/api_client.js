"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _ApiClient_processUserInfo, _ApiClient_processUserInOrgInfo;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiClient = void 0;
const util_1 = require("../util");
const mfa_1 = require("../mfa");
const response_1 = require("../response");
const paginator_1 = require("../paginator");
const user_export_1 = require("../user_export");
const index_1 = require("../index");
const fetch_1 = require("../fetch");
const base_client_1 = require("./base_client");
const retry_1 = require("../retry");
const passkey_1 = require("../passkey");
/**
 * String returned by API when a user does not have an email address (for backwards compatibility)
 */
const EMAIL_NOT_FOUND = "email not found";
/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
class ApiClient extends base_client_1.BaseClient {
    /**
     * Creates a new client using the same session manager but targeting a
     * different (child) organization.
     *
     * @param targetOrgId The ID of an organization that the new client should target
     * @returns A new client targeting a different org
     */
    withTargetOrg(targetOrgId) {
        return new _a(this.sessionMeta, this.sessionManager, targetOrgId, this.config);
    }
    /**
     * Creates a new client using with an updated {@link ClientConfig}.
     *
     * @param cfg Partial configuration to apply on top of the existing client
     * @returns A new client with the updated configuration
     */
    withConfig(cfg) {
        return new _a(this.sessionMeta, this.sessionManager, this.orgId, {
            ...this.config,
            ...cfg,
            headers: {
                ...(this.config.headers ?? {}),
                ...(cfg.headers ?? {}),
            },
        });
    }
    /**
     * Creates a new client in which the current session will assume a given role.
     * No validation is done on the client side; the back end will reject subsequent
     * requests if the current session is not allowed to assume that role.
     *
     * @param roleId The name or ID of a role to assume.
     * @returns A new client with the updated configuration.
     */
    assumeRole(roleId) {
        return this.withConfig({
            headers: { "x-cubist-assume-role": roleId },
        });
    }
    // #region USERS: userGet, userTotp(ResetInit|ResetComplete|Verify|Delete), userFido(RegisterInit|RegisterComplete|Delete)
    /**
     * @returns Information about the current user.
     */
    async userGet() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me", "get");
        return this.exec(o, {}).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInfo));
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
    static async initEmailOtpAuth(env, orgId, email) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/email-otp", "post");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: { email },
        })).then(fetch_1.assertOk);
    }
    /**
     * Retries a pending MFA request with the provided MfaReceipts
     *
     * @param req The request to retry
     * @param mfaReceipt The MFA receipt(s) to include in HTTP headers
     * @returns The response from the server
     */
    async mfaRetry(req, mfaReceipt) {
        const o = (opts) => 
        // @ts-expect-error We're doing some heavy casting to get this to work
        (0, fetch_1.apiFetch)(req.path, req.method, {
            ...opts,
            body: req.body,
        });
        const retry = async (headers) => this.exec(o, {
            headers,
        });
        return response_1.CubeSignerResponse.create(this.env, retry, mfaReceipt);
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
    async userEmailResetInit(req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/email", "post");
        const resetEmailFn = async (headers) => {
            const data = await this.exec(o, {
                headers,
                body: typeof req === "string" ? { email: req } : req,
            });
            return (0, response_1.mapResponse)(data, (emailOtp) => new mfa_1.ResetEmailChallenge(this, emailOtp));
        };
        return await response_1.CubeSignerResponse.create(this.env, resetEmailFn, mfaReceipt);
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
    async userEmailResetComplete(partialToken, signature) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/email", "patch");
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
    async userTotpResetInit(issuer, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "post");
        const resetTotpFn = async (headers) => {
            const data = await this.exec(o, {
                headers,
                body: issuer
                    ? {
                        issuer,
                    }
                    : null,
            });
            return (0, response_1.mapResponse)(data, (totpInfo) => new mfa_1.TotpChallenge(this, totpInfo));
        };
        return await response_1.CubeSignerResponse.create(this.env, resetTotpFn, mfaReceipt);
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
    async userTotpResetComplete(totpId, code) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "patch");
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
    async userTotpVerify(code) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp/verify", "post");
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
    async userTotpDelete(mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/totp", "delete");
        const deleteTotpFn = async (headers) => {
            return await this.exec(o, {
                headers,
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, deleteTotpFn, mfaReceipt);
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
    async userFidoRegisterInit(name, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido", "post");
        const addFidoFn = async (headers) => {
            const data = await this.exec(o, {
                headers,
                body: typeof name === "string" ? { name } : name,
            });
            return (0, response_1.mapResponse)(data, (c) => new mfa_1.AddFidoChallenge(this, c));
        };
        return await response_1.CubeSignerResponse.create(this.env, addFidoFn, mfaReceipt);
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
    async userFidoRegisterComplete(challengeId, credential) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido", "patch");
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
    async userFidoDelete(fidoId, mfaReceipt) {
        const deleteFidoFn = (headers) => {
            const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/fido/{fido_id}", "delete");
            return this.exec(o, {
                headers,
                params: { path: { fido_id: fidoId } },
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, deleteFidoFn, mfaReceipt);
    }
    // #endregion
    // #region ORGS: orgGet, orgUpdate, orgUpdateUserMembership, orgCreateOrg, orgQueryMetrics, orgGetEmailConfig, orgConfigureEmail, orgDeleteEmailConfig
    /**
     * Obtain information about an org
     *
     * @param orgId The org to get info for
     * @returns Information about the organization.
     */
    async orgGet(orgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}", "get");
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
    async orgUpdate(request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}", "patch");
        return this.exec(o, { body: request });
    }
    /**
     * Update user's membership in this org.
     *
     * @param userId The ID of the user whose membership to update.
     * @param req The update request
     * @returns Updated user membership
     */
    async orgUpdateUserMembership(userId, req) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}/membership", "patch");
        return this.exec(o, {
            params: { path: { user_id: userId } },
            body: req,
        }).then(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo));
    }
    /**
     * Create a new organization. The new org is a child of the
     * current org and inherits its key-export policy. The new org
     * is created with one owner, the caller of this API.
     *
     * @param body The details of the request
     * @returns The new organization information
     */
    async orgCreateOrg(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/orgs", "post");
        return await this.exec(o, { body });
    }
    /**
     * Query the audit log.
     *
     * @param body The query.
     * @param page Pagination options. Default to fetching the entire result set.
     * @returns Requested audit log.
     */
    orgQueryAuditLog(body, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/audit", "post");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { body, params: { query } }), (r) => r.entries, (r) => r.last_evaluated_key);
    }
    /**
     * Query org metrics.
     *
     * @param body The query
     * @param page Pagination options. Default to fetching the entire result set.
     * @returns Computed org metrics statistics.
     */
    orgQueryMetrics(body, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/metrics", "post");
        return new paginator_1.Paginator(page ?? paginator_1.Page.default(), (query) => this.exec(o, { body, params: { query } }), (r) => r.last_evaluated_key, (acc, next) => {
            if (!acc)
                return next;
            acc.raw_data ??= [];
            acc.raw_data.push(...(next.raw_data ?? []));
            return acc;
        });
    }
    /**
     * Get email configuration for a given purpose.
     *
     * @param purpose The email template kind to get
     * @returns The email configuration
     */
    async orgGetEmailConfig(purpose) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/emails/{purpose}", "get");
        return this.exec(o, {
            params: { path: { purpose } },
        });
    }
    /**
     * Configure email template
     *
     * @param purpose The template kind to configure
     * @param req The template parameters
     * @returns An empty response
     */
    async orgConfigureEmail(purpose, req) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/emails/{purpose}", "put");
        return this.exec(o, {
            params: { path: { purpose } },
            body: req,
        });
    }
    /**
     * Delete email configuration for a given purpose.
     *
     * @param purpose The email template kind to delete
     * @returns An empty response
     */
    async orgDeleteEmailConfig(purpose) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/emails/{purpose}", "delete");
        return this.exec(o, {
            params: { path: { purpose } },
            body: {},
        });
    }
    /**
     * Create a new (first-party) user in the organization and send an email invitation to that user.
     *
     * @param emailOrArgs Either the user's email (deprecated) or an InviteRequest object
     * @param name The full name of the user (required when emailOrArgs is a string)
     * @param role Optional role. Defaults to "alien" (only used when emailOrArgs is a string)
     * @param skipEmail Optionally skip sending the invite email (only used when emailOrArgs is a string)
     */
    async orgUserInvite(emailOrArgs, name, role, skipEmail) {
        const args = typeof emailOrArgs === "string"
            ? {
                email: emailOrArgs,
                name: name,
                role,
                skip_email: !!skipEmail,
            }
            : emailOrArgs;
        const o = (0, fetch_1.op)("/v0/org/{org_id}/invite", "post");
        await this.exec(o, {
            body: args,
        });
    }
    /**
     * Remove the user from the org.
     *
     * @param userId The ID of the user to remove.
     * @returns An empty response
     */
    async orgUserDelete(userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}", "delete");
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
    orgUsersList(page, searchQuery) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (pageQuery) => this.exec(o, { params: { query: { q: searchQuery, ...pageQuery } } }), (r) => r.users.map(__classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo)), (r) => r.last_evaluated_key);
    }
    /**
     * Get user by id.
     *
     * @param userId The id of the user to get.
     * @returns Org user.
     */
    async orgUserGet(userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/{user_id}", "get");
        const resp = await this.exec(o, {
            params: {
                path: {
                    user_id: userId,
                },
            },
        });
        return __classPrivateFieldGet(_a, _a, "m", _ApiClient_processUserInOrgInfo).call(_a, resp);
    }
    /**
     * Get user by email.
     *
     * @param email The email of the user to get.
     * @returns Org users with a given email
     * @throws if there is no user with that email, or email is invalid
     */
    async orgUserGetByEmail(email) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/email/{email}", "get");
        return await this.exec(o, {
            params: {
                path: { email },
            },
        });
    }
    /**
     * Get user by OIDC identity
     *
     * @param iss OIDC issuer
     * @param sub OIDC subject
     * @returns Org user with a given OIDC identity
     */
    async orgUserGetByOidc(iss, sub) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/oidc/{iss}/{sub}", "get");
        return await this.exec(o, {
            params: {
                path: { iss, sub },
            },
        });
    }
    /**
     * Create a new OIDC user. This can be a first-party "Member" or third-party "Alien".
     *
     * @param identityOrProof The identity or identity proof of the OIDC user, or null to create a user without an identity.
     * @param email Email of the OIDC user
     * @param opts Additional options for new OIDC users
     * @returns User id of the new user
     */
    async orgUserCreateOidc(identityOrProof, email, opts = {}) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users", "post");
        const identityOrProofFields = !identityOrProof
            ? {}
            : "id" in identityOrProof
                ? { proof: identityOrProof }
                : { identity: identityOrProof };
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
    async orgUserDeleteOidc(identity) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/users/oidc", "delete");
        return this.exec(o, {
            body: identity,
        });
    }
    // #endregion
    // #region KEYS: keyGet, keyAttest, keyUpdate, keyDelete, keysCreate, keysDerive, keysList, keyHistory
    /**
     * Get a key by its id.
     *
     * @param keyId The id of the key to get.
     * @returns The key information.
     */
    async keyGet(keyId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "get");
        return this.exec(o, {
            params: { path: { key_id: keyId } },
        });
    }
    /**
     * Attest to key properties.
     *
     * The response is a JWT whose claims are the properties of the requested key.
     *
     * @param keyId The id of the key.
     * @param query Query parameters:
     * @param query.include_roles if specified, include all the roles the key is in.
     * @returns A JWT whose claims are the properties of the key. The type of the returned JWT payload is {@link KeyAttestationClaims}.
     */
    async keyAttest(keyId, query) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}/attest", "get");
        return this.exec(o, {
            params: {
                path: { key_id: keyId },
                query,
            },
        });
    }
    /**
     * Get a key by its type and material id.
     *
     * @param keyType The key type.
     * @param materialId The material id of the key to get.
     * @returns The key information.
     */
    async keyGetByMaterialId(keyType, materialId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_type}/{material_id}", "get");
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
    keyRolesList(keyId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}/roles", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                path: { key_id: keyId },
                query,
            },
        }), (r) => r.roles, (r) => r.last_evaluated_key);
    }
    /**
     * Update key.
     *
     * @param keyId The ID of the key to update.
     * @param request The JSON request to send to the API server.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The JSON response from the API server.
     */
    async keyUpdate(keyId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "patch");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { key_id: keyId } },
            body: request,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Deletes a key.
     *
     * @param keyId Key id
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async keyDelete(keyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { key_id: keyId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
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
    async keysCreate(keyType, count, ownerId, props) {
        const chain_id = 0; // not used anymore
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys", "post");
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
    async keysDerive(keyType, derivationPaths, mnemonicId, props) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/derive_key", "put");
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
    async keysDeriveMulti(keyTypesAndDerivationPaths, props) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/derive_keys", "put");
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
    keysList(type, page, owner, search) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { key_type: type, key_owner: owner, search, ...query } } }), (r) => r.keys, (r) => r.last_evaluated_key);
    }
    /**
     * List recent historical key transactions.
     *
     * @param keyId The key id.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over historical transactions.
     */
    keyHistory(keyId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/keys/{key_id}/tx", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), () => this.exec(o, { params: { path: { key_id: keyId } } }), (r) => r.txs, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region ORG CONTACTS: contactCreate, contactGet, contactsList, contactDelete, contactUpdate, contactLookupByAddress
    /**
     * Creates a new contact in the organization-wide address book. The
     * user making the request is the owner of the contact, giving them edit access
     * to the contact along with the org owners.
     *
     * @param name The name for the new contact.
     * @param addresses The addresses associated with the contact.
     * @param metadata Metadata associated with the contact. Intended for use as a description.
     * @param editPolicy The edit policy for the contact, determining when and who can edit this contact.
     * @param labels The optional labels for the contact.
     * @returns The newly created contact.
     */
    async contactCreate(name, addresses, metadata, editPolicy, labels) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts", "post");
        return this.exec(o, {
            body: {
                name,
                addresses,
                metadata,
                edit_policy: editPolicy,
                labels,
            },
        });
    }
    /**
     * Returns the properties of a Contact.
     *
     * @param contactId The id of the contact you want to retrieve.
     * @returns The contact.
     */
    async contactGet(contactId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "get");
        return this.exec(o, {
            params: { path: { contact_id: contactId } },
        });
    }
    /**
     * Lists contacts in the org.
     *
     * @param page The optional pagination options. Defaults to getting every page.
     * @param search The optional search query. Either `label:...`, which will
     * return contacts with the label provided after the ':'; or an address
     * search, where all returned contacts will have an address starting with, or
     * equalling, the given search string.
     * @returns Paginator for iterating over the contacts in the org.
     */
    contactsList(page, search) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (pageQuery) => this.exec(o, { params: { query: { search, ...pageQuery } } }), (r) => r.contacts, (r) => r.last_evaluated_key);
    }
    /**
     * Returns all contacts in the org that have the given address.
     *
     * When querying with an EVM address without a chain, this endpoint returns
     * contacts with that address on *any* EVM chain, including those without a chain
     * defined.
     *
     * @param address The address all returned contacts must have.
     * @returns Contacts in the org with that address.
     */
    async contactLookupByAddress(address) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/by-address", "post");
        return (await this.exec(o, { body: address })).contacts;
    }
    /**
     * Delete a contact, specified by its ID.
     *
     * Only the contact owner and org owners are allowed to delete contacts.
     * Additionally, the contact's edit policy (if set) must permit the deletion.
     *
     * @param contactId The contact to delete.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async contactDelete(contactId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { contact_id: contactId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Updates an existing contact in the organization-wide address book. Only
     * the contact owner or an org owner can update contacts.
     *
     * Updates will overwrite the existing value of the field.
     *
     * @param contactId The contact to update.
     * @param request The fields to update.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The updated contact information.
     */
    async contactUpdate(contactId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/contacts/{contact_id}", "patch");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { contact_id: contactId } },
            body: request,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    // #endregion
    // #region ROLES: roleCreate, roleGet, roleAttest, roleRead, roleUpdate, roleDelete, rolesList
    /**
     * Create a new role.
     *
     * @param name The optional name of the role.
     * @returns The ID of the new role.
     */
    async roleCreate(name) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles", "post");
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
    async roleGet(roleId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "get");
        return this.exec(o, {
            params: { path: { role_id: roleId } },
        });
    }
    /**
     * Attest to role properties.
     *
     * The response is a JWT whose claims are the properties of the requested role.
     *
     * @param roleId The id of the role.
     * @param query Query parameters:
     * @param query.verbosity Role properties to include in an attestation. Defaults to basic role properties, including associated users, but excluding associated keys.
     * @param query.key_filter Filter down to a single associated key. Defaults to including all associated keys.
     * @returns A JWT whose claims are the role properties. The type of the returned JWT payload is {@link RoleAttestationClaims}.
     */
    async roleAttest(roleId, query) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/attest", "get");
        return this.exec(o, {
            params: {
                path: { role_id: roleId },
                query,
            },
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
    async roleUpdate(roleId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "patch");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId } },
            body: request,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Delete a role by its ID.
     *
     * @param roleId The ID of the role to delete.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async roleDelete(roleId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * List all roles in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over roles.
     */
    rolesList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query } }), (r) => r.roles, (r) => r.last_evaluated_key);
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
    async roleKeysAdd(roleId, keyIds, policy, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/add_keys", "put");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId } },
            body: {
                key_ids: keyIds,
                policy,
            },
            headers,
        });
        return response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
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
    async roleKeysRemove(roleId, keyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId, key_id: keyId } },
            headers,
        });
        return response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * List all keys in a role.
     *
     * @param roleId The ID of the role whose keys to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the keys in the role.
     */
    roleKeysList(roleId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/keys", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                path: { role_id: roleId },
                query,
            },
        }), (r) => r.keys, (r) => r.last_evaluated_key);
    }
    /**
     * Get a key in a role by its ID.
     *
     * @param roleId The ID of the role.
     * @param keyId The ID of the key to get.
     * @param opts Optional options for getting the key.
     * @returns The key with policies information.
     */
    roleKeyGet(roleId, keyId, opts) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/keys/{key_id}", "get");
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
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    async roleUserAdd(roleId, userId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/add_user/{user_id}", "put");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId, user_id: userId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Remove an existing user from an existing role.
     *
     * @param roleId The ID of the role.
     * @param userId The ID of the user to remove from the role.
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns an empty response, or a response that can be used to approve MFA if needed.
     */
    async roleUserRemove(roleId, userId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/users/{user_id}", "delete");
        const reqFn = (headers) => this.exec(o, {
            params: { path: { role_id: roleId, user_id: userId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * List all users in a role.
     *
     * @param roleId The ID of the role whose users to retrieve.
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over the users in the role.
     */
    roleUsersList(roleId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/users", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query, path: { role_id: roleId } } }), (r) => r.users, (r) => r.last_evaluated_key);
    }
    // #endregion
    // #region POLICY: policy(Create|Get|List|Update|Delete|Invoke|Secrets)
    /**
     * Create a new named policy.
     *
     * @param name The name of the policy.
     * @param type The type of the policy.
     * @param rules The policy rules.
     * @param acl Optional list of policy access control entries.
     * @returns The the new policy's info.
     */
    async policyCreate(name, type, rules, acl) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies", "post");
        return (await this.exec(o, {
            body: {
                name,
                policy_type: type,
                rules,
                acl,
            },
        }));
    }
    /**
     * Get a named policy by its name or id.
     *
     * @param policyId The name or id of the policy to get.
     * @param version The policy version to get.
     * @returns The policy.
     */
    async policyGet(policyId, version) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies/{policy_id}/{version}", "get");
        return (await this.exec(o, {
            params: { path: { policy_id: policyId, version } },
        }));
    }
    /**
     * List all named policies in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @param policyType The optional type of policies to fetch. Defaults to fetching all named policies regardless of type.
     * @returns Paginator for iterating over policies.
     */
    policiesList(page, policyType) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (pageQuery) => this.exec(o, { params: { query: { policy_type: policyType, ...pageQuery } } }), (r) => r.policies, (r) => r.last_evaluated_key);
    }
    /**
     * Update a named policy.
     *
     * @param policyId The name or id of the policy to update.
     * @param request The update request.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The updated policy information.
     */
    async policyUpdate(policyId, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies/{policy_id}", "patch");
        const signFn = async (headers) => this.exec(o, {
            params: { path: { policy_id: policyId } },
            body: request,
            headers,
        });
        return (await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt));
    }
    /**
     * Delete a named policy.
     *
     * @param policyId The name or id of the policy to delete.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns An empty response.
     */
    async policyDelete(policyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies/{policy_id}", "delete");
        const signFn = async (headers) => this.exec(o, {
            params: { path: { policy_id: policyId } },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Invoke a named policy.
     *
     * @param policyId The name or id of the policy to invoke.
     * @param version The policy version to invoke.
     * @param request The invoke request.
     * @returns The result of invoking the policy.
     */
    async policyInvoke(policyId, version, request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policies/{policy_id}/{version}/invoke", "post");
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
    async wasmPolicyUpload(request) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policy/wasm", "post");
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
    async sessionCreate(purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "post");
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
        return (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, data, {
            purpose,
            org_id: this.orgId,
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
    async sessionCreateExtended(purpose, scopes, lifetime, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "post");
        const requestFn = async (headers) => {
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
            return (0, response_1.mapResponse)(resp, (sessionInfo) => (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, sessionInfo, {
                purpose,
                org_id: this.orgId,
            }));
        };
        return await response_1.CubeSignerResponse.create(this.env, requestFn, mfaReceipt);
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
    async sessionCreateForRole(roleId, purpose, scopes, lifetimes) {
        lifetimes ??= defaultSignerSessionLifetime;
        const o = (0, fetch_1.op)("/v0/org/{org_id}/roles/{role_id}/tokens", "post");
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
        return (0, base_client_1.signerSessionFromSessionInfo)(this.sessionMeta, data, {
            role_id: roleId,
            org_id: this.orgId,
            purpose,
        });
    }
    /**
     * Get session by id.
     *
     * @param sessionId The ID of the session to retrieve. This session by default
     * @returns Requested session metadata.
     */
    async sessionGet(sessionId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session/{session_id}", "get");
        return await this.exec(o, {
            params: { path: { session_id: sessionId ?? "self" } },
        });
    }
    /**
     * Revoke a session.
     *
     * @param sessionId The ID of the session to revoke. This session by default
     */
    async sessionRevoke(sessionId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session/{session_id}", "delete");
        await this.exec(o, {
            params: { path: { session_id: sessionId ?? "self" } },
        });
    }
    /**
     * Revoke all sessions.
     *
     * @param selector Which sessions to revoke. If not defined, all the current user's sessions will be revoked.
     */
    async sessionRevokeAll(selector) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "delete");
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
    sessionsList(selector, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/session", "get");
        const selectorQuery = typeof selector === "string" ? { role: selector } : selector;
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { params: { query: { ...selectorQuery, ...query } } }), (r) => r.sessions, (r) => r.last_evaluated_key);
    }
    /**
     * Returns the list of keys that this session has access to.
     *
     * @returns The list of keys.
     */
    async sessionKeysList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/token/keys", "get");
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
    async identityProve() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove", "post");
        return this.exec(o, {});
    }
    /**
     * Checks if a given identity proof is valid.
     *
     * @param proof The proof of authentication.
     * @throws An error if proof is invalid
     */
    async identityVerify(proof) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/verify", "post");
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
    async identityAdd(body, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "post");
        const reqFn = (headers) => this.exec(o, { body, headers });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
    }
    /**
     * Removes an OIDC identity from the current user's account.
     *
     * @param body The identity to remove.
     */
    async identityRemove(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "delete");
        await this.exec(o, { body });
    }
    /**
     * Lists associated OIDC identities with the current user.
     *
     * @returns Associated identities
     */
    async identityList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity", "get");
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
    async mfaGet(mfaId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}", "get");
        return this.exec(o, {
            params: { path: { mfa_id: mfaId } },
        });
    }
    /**
     * List pending MFA requests accessible to the current user.
     *
     * @returns The MFA requests.
     */
    async mfaList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa", "get");
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
    async mfaVoteCs(mfaId, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}", "patch");
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
    async mfaVoteTotp(mfaId, code, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/totp", "patch");
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
    async mfaFidoInit(mfaId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/fido", "post");
        const challenge = await this.exec(o, {
            params: { path: { mfa_id: mfaId } },
        });
        return new mfa_1.MfaFidoChallenge(this, mfaId, challenge);
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
    async mfaVoteFidoComplete(mfaId, mfaVote, challengeId, credential) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/fido", "patch");
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
    async mfaVoteEmailInit(mfaId, mfaVote) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/email", "post");
        const challenge = await this.exec(o, {
            params: { path: { mfa_id: mfaId }, query: { mfa_vote: mfaVote } },
        });
        return new mfa_1.MfaEmailChallenge(this, mfaId, challenge);
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
    async mfaVoteEmailComplete(mfaId, partialToken, signature) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mfa/{mfa_id}/email", "patch");
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
    async signEvm(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth1/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    async signEip191(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/evm/eip191/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    async signEip712(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/evm/eip712/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain validation message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns Signature
     */
    async signEth2(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain deposit (or staking) message.
     *
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async signStake(req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/stake", "post");
        const sign = async (headers) => this.exec(o, {
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, sign, mfaReceipt);
    }
    /**
     * Sign an Eth2/Beacon-chain unstake/exit request.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req The request to sign.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async signUnstake(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/eth2/unstake/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign an Avalanche P- or X-chain message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param tx Avalanche message (transaction) to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signAva(key, tx, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/ava/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: {
                tx: tx,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    async signSerializedAva(key, avaChain, tx, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/ava/sign/{ava_chain}/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { ava_chain: avaChain, pubkey } },
            body: {
                tx,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    async signBlob(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/blob/sign/{key_id}", "post");
        const key_id = typeof key === "string" ? key : key.id;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { key_id } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
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
    async diffieHellmanExchange(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/diffie_hellman/{key_id}", "post");
        const key_id = typeof key === "string" ? key : key.id;
        const dhFn = async (headers) => this.exec(o, {
            params: { path: { key_id } },
            body: req,
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, dhFn, mfaReceipt);
    }
    /**
     * Sign a Bitcoin transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBtc(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Bitcoin BIP-137 message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBtcMessage(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/message/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Taproot transaction input.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signTaproot(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/taproot/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a PSBT.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signPsbt(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/btc/psbt/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Generate an Extractable One-Time Signature
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signEots(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/eots/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Generates a set of Babylon EOTS nonces for a specified chain-id, starting at a specified block height.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What and how many nonces to create
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async eotsCreateNonce(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/eots/nonces/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Babylon staking transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID). For a deposit, this can be either a Segwit or a Taproot key. For any other request type, this just be a Taproot key.
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBabylonStakingTxn(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/staking/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Babylon staking registration request.
     *
     * @param key The Taproot key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signBabylonRegistration(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/babylon/registration/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a Solana message.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param req What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSolana(key, req, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/solana/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            body: req,
            headers: headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a MMI pending message.
     *
     * @param message the message info.
     * @param mfaReceipt optional MFA receipt(s).
     * @returns the updated message.
     */
    async signMmi(message, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/sign", "post");
        const signFn = async (headers) => this.exec(o, {
            params: { path: { msg_id: message.id } },
            headers,
            body: message,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
    }
    /**
     * Sign a SUI transaction.
     *
     * @param key The key to sign with (either {@link Key} or its material ID).
     * @param request What to sign
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The response.
     */
    async signSui(key, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/sui/sign/{pubkey}", "post");
        const pubkey = typeof key === "string" ? key : key.materialId;
        const signFn = async (headers) => this.exec(o, {
            params: { path: { pubkey } },
            headers,
            body: request,
        });
        return await response_1.CubeSignerResponse.create(this.env, signFn, mfaReceipt);
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
    userExportList(keyId, userId, page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, {
            params: {
                query: {
                    user_id: userId,
                    key_id: keyId,
                    ...query,
                },
            },
        }), (r) => r.export_requests, (r) => r.last_evaluated_key);
    }
    /**
     * Delete an outstanding user-export request.
     *
     * @param keyId The key-id corresponding to the user-export request to delete.
     * @param userId Optional user ID. If omitted, uses the current user's ID. Only org owners can delete user-export requests for users other than themselves.
     */
    async userExportDelete(keyId, userId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "delete");
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
    async userExportInit(keyId, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "post");
        const initFn = async (headers) => {
            return this.exec(o, {
                body: { key_id: keyId },
                headers,
            });
        };
        return await response_1.CubeSignerResponse.create(this.env, initFn, mfaReceipt);
    }
    /**
     * Complete a user-export request.
     *
     * @param keyId The key-id for which to initiate an export.
     * @param publicKey The NIST P-256 public key to which the export will be encrypted. This should be the `publicKey` property of a value returned by `userExportKeygen`.
     * @param mfaReceipt Optional MFA receipt(s).
     * @returns The response.
     */
    async userExportComplete(keyId, publicKey, mfaReceipt) {
        // base64-encode the public key
        const subtle = await (0, user_export_1.loadSubtleCrypto)();
        const publicKeyB64 = (0, util_1.encodeToBase64)(Buffer.from(await subtle.exportKey("raw", publicKey)));
        const o = (0, fetch_1.op)("/v0/org/{org_id}/user/me/export", "patch");
        // make the request
        const completeFn = async (headers) => this.exec(o, {
            body: {
                key_id: keyId,
                public_key: publicKeyB64,
            },
            headers,
        });
        return await response_1.CubeSignerResponse.create(this.env, completeFn, mfaReceipt);
    }
    // #endregion
    // #region KEY IMPORT: createKeyImportKey, importKeys
    /**
     * Request a fresh key-import key.
     *
     * @returns A fresh key-import key
     */
    async createKeyImportKey() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/import_key", "get");
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
    async importKeys(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/import_key", "put");
        const { keys } = await this.exec(o, { body });
        return keys;
    }
    // #endregion
    // #region MISC: heartbeat()
    /**
     * Send a heartbeat / upcheck request.
     */
    async heartbeat() {
        const o = (0, fetch_1.op)("/v1/org/{org_id}/cube3signer/heartbeat", "post");
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
    async mmi(method, params) {
        const o = (0, fetch_1.op)("/v0/mmi/v3/json-rpc", "post");
        const body = {
            id: 1,
            jsonrpc: "2.0",
            method: method,
            params: params,
        };
        const func = async (headers) => {
            const resp = await this.exec(o, { headers, body });
            if (resp.error) {
                const data = resp.error.data;
                throw new index_1.ErrResponse({
                    message: resp.error.message,
                    errorCode: data?.error_code,
                    requestId: data?.request_id,
                });
            }
            return resp;
        };
        const resp = await response_1.CubeSignerResponse.create(this.env, func);
        return resp.data();
    }
    /**
     * Retrieve a proof of this session's CubeSigner identity.
     *
     * @param aud Intended audience
     * @returns a JWT that can be validated against the JWKS from {@link customerProofJwksUrl}.
     */
    async getCustomerProof(aud) {
        const resp = await this.mmi("custodian_getCustomerProof", [aud]);
        const jwt = resp.result?.jwt;
        if (!jwt || typeof jwt !== "string") {
            console.warn("Unexpected getCustomerProof response", resp);
            throw new Error("The type JWT included in the customer proof response is not string");
        }
        return jwt;
    }
    /**
     * List pending MMI messages.
     *
     * @returns The list of pending MMI messages.
     */
    async mmiList() {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages", "get");
        const { pending_messages } = await this.exec(o, {});
        return pending_messages;
    }
    /**
     * Get a pending MMI message by its ID.
     *
     * @param msgId The ID of the pending message.
     * @returns The pending MMI message.
     */
    async mmiGet(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "get");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Delete the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     */
    async mmiDelete(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}", "delete");
        await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * Reject the MMI message with the given ID.
     *
     * @param msgId the ID of the MMI message.
     * @returns The message with updated information
     */
    async mmiReject(msgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/mmi/v3/messages/{msg_id}/reject", "post");
        return await this.exec(o, { params: { path: { msg_id: msgId } } });
    }
    /**
     * @returns JSON Web Key Set (JWKS) URL with the keys used for key/role attestations (see {@link keyAttest} and {@link roleAttest}).
     */
    attestationJwksUrl() {
        const url = "/v0/attestation/.well-known/jwks.json";
        (0, fetch_1.op)(url, "get"); // just to type check the url above
        return new URL(`${this.env.SignerApiRoot.replace(/\/$/, "")}${url}`);
    }
    /**
     * @returns JSON Web Key Set (JWKS) URL with the keys used for validating JWTs returned by the {@link customerProof} method.
     */
    customerProofJwksUrl() {
        const url = "/v0/mmi/v3/.well-known/jwks.json";
        (0, fetch_1.op)(url, "get"); // just to type check the url above
        return new URL(`${this.env.SignerApiRoot.replace(/\/$/, "")}${url}`);
    }
    // #endregion
    /**
     * Returns public org information.
     *
     * @param env The environment to log into
     * @param orgId The org to log into
     * @returns Public org information
     */
    static async publicOrgInfo(env, orgId) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/info", "get");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
        })).then(fetch_1.assertOk);
    }
    /**
     * Returns a JSON Web Key Set (JWKS) with the keys used for key attestations (see {@link keyAttest} and {@link roleAttest}).
     *
     * @param env The CubeSigner environment
     * @returns A JWKS with they keys used for key attestation.
     */
    static async attestationJwks(env) {
        const o = (0, fetch_1.op)("/v0/attestation/.well-known/jwks.json", "get");
        return await (0, retry_1.retryOn5XX)(() => o({ baseUrl: env.SignerApiRoot })).then(fetch_1.assertOk);
    }
    /**
     * Sends an email to the given address with a list of orgs the user is a member of.
     *
     * @param env The environment to use
     * @param email The user's email
     * @returns Empty response
     */
    static async emailMyOrgs(env, email) {
        const o = (0, fetch_1.op)("/v0/email/orgs", "get");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { query: { email } },
        })).then(fetch_1.assertOk);
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
    static async oidcSessionCreate(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc", "post");
        const loginFn = async (headers) => {
            const data = await (0, retry_1.retryOn5XX)(() => o({
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
            })).then(fetch_1.assertOk);
            return (0, response_1.mapResponse)(data, (sessionInfo) => {
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
        return await response_1.CubeSignerResponse.create(env, loginFn, mfaReceipt);
    }
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
    static async siweLoginInit(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/siwe", "post");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
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
    static async siweLoginComplete(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/siwe", "patch");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Initiate the login with passkey flow.
     *
     * @param env The environment to log into
     * @param body The login request
     * @returns The challenge that must be answered (see {@link passkeyLoginComplete}) to log in.
     */
    static async passkeyLoginInit(env, body) {
        const o = (0, fetch_1.op)("/v0/passkey", "post");
        const resp = await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            body,
        })).then(fetch_1.assertOk);
        return new passkey_1.PasskeyLoginChallenge(env, resp, body.purpose);
    }
    /**
     * Answer the login with passkey challenge returned from {@link passkeyLoginInit}.
     *
     * @param env The environment to log into
     * @param body The request body
     * @param purpose Optional descriptive session purpose
     * @returns The session data
     */
    static async passkeyLoginComplete(env, body, purpose) {
        const o = (0, fetch_1.op)("/v0/passkey", "patch");
        const resp = await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            body,
        })).then(fetch_1.assertOk);
        return {
            env: {
                ["Dev-CubeSignerStack"]: env,
            },
            org_id: resp.org_id, // 'org_id' is always set from this endpoint
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
    static async idpAcceptInvite(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/invitation/accept", "post");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
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
    static async idpAuthenticate(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/authenticate", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @returns Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static async idpPasswordResetRequest(env, orgId, body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
        })).then(fetch_1.assertOk);
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
    static async idpPasswordResetConfirm(env, orgId, partialToken, signature, newPassword) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "patch");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: {
                token: `${partialToken}${signature}`,
                new_password: newPassword,
            },
        })).then(fetch_1.assertOk);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @returns Proof of authentication
     */
    static async identityProveOidc(env, orgId, token) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove/oidc", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            headers: {
                Authorization: token,
            },
        })).then(fetch_1.assertOk);
    }
    /**
     * Obtain all organizations a user is a member of
     *
     * @param env The environment to log into
     * @param token The oidc token identifying the user
     * @returns The organization the user belongs to
     */
    static async userOrgs(env, token) {
        const o = (0, fetch_1.op)("/v0/user/orgs", "get");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            headers: {
                Authorization: token,
            },
        })).then(fetch_1.assertOk);
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
    async migrateAddIdentities(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/auth_migration/add_identity", "post");
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
    async migrateRemoveIdentities(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/auth_migration/remove_identity", "post");
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
    async migrateUserProfiles(body) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/auth_migration/update_users", "post");
        return this.exec(o, { body });
    }
}
exports.ApiClient = ApiClient;
_a = ApiClient, _ApiClient_processUserInfo = function _ApiClient_processUserInfo(info) {
    if (info.email === EMAIL_NOT_FOUND) {
        info.email = null;
    }
    return info;
}, _ApiClient_processUserInOrgInfo = function _ApiClient_processUserInOrgInfo(info) {
    if (info.email === EMAIL_NOT_FOUND) {
        info.email = null;
    }
    return info;
};
const defaultSignerSessionLifetime = {
    session: 604800, // 1 week
    auth: 300, // 5 min
    refresh: 86400, // 1 day
    grace: 30, // seconds
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFzRUEsa0NBQXlDO0FBQ3pDLGdDQU1nQjtBQUNoQiwwQ0FBOEQ7QUFHOUQsNENBQStDO0FBRS9DLGdEQUFrRDtBQUVsRCxvQ0FxRWtCO0FBQ2xCLG9DQUEyRTtBQUMzRSwrQ0FBNEY7QUFDNUYsb0NBQXNDO0FBQ3RDLHdDQUFtRDtBQU1uRDs7R0FFRztBQUNILE1BQU0sZUFBZSxHQUFHLGlCQUFpQixDQUFDO0FBcUIxQzs7R0FFRztBQUNILE1BQWEsU0FBVSxTQUFRLHdCQUFVO0lBQ3ZDOzs7Ozs7T0FNRztJQUNILGFBQWEsQ0FBQyxXQUFtQjtRQUMvQixPQUFPLElBQUksRUFBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ3hGLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILFVBQVUsQ0FBQyxHQUEwQjtRQUNuQyxPQUFPLElBQUksRUFBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ3RFLEdBQUcsSUFBSSxDQUFDLE1BQU07WUFDZCxHQUFHLEdBQUc7WUFDTixPQUFPLEVBQUU7Z0JBQ1AsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztnQkFDOUIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO2FBQ3ZCO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVEOzs7Ozs7O09BT0c7SUFDSCxVQUFVLENBQUMsTUFBYztRQUN2QixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDckIsT0FBTyxFQUFFLEVBQUUsc0JBQXNC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Q0FBQyxLQUFLLEtBQUssZUFBZSxFQUFFLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7SUFDcEIsQ0FBQztJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQXFESCxNQUFNLDRCQUE0QixHQUFvQjtJQUNwRCxPQUFPLEVBQUUsTUFBTSxFQUFFLFNBQVM7SUFDMUIsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRO0lBQ25CLE9BQU8sRUFBRSxLQUFLLEVBQUUsUUFBUTtJQUN4QixLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVU7Q0FDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ3JlYXRlT2lkY1VzZXJPcHRpb25zLFxuICBJZGVudGl0eVByb29mLFxuICBLZXlJblJvbGVJbmZvLFxuICBLZXlJbmZvLFxuICBPaWRjSWRlbnRpdHksXG4gIFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gIFJvbGVJbmZvLFxuICBVcGRhdGVLZXlSZXF1ZXN0LFxuICBVcGRhdGVPcmdSZXF1ZXN0LFxuICBVcGRhdGVPcmdSZXNwb25zZSxcbiAgVXBkYXRlUm9sZVJlcXVlc3QsXG4gIFVzZXJJbk9yZ0luZm8sXG4gIFVzZXJJblJvbGVJbmZvLFxuICBHZXRVc2Vyc0luT3JnUmVzcG9uc2UsXG4gIFVzZXJJbmZvLFxuICBTZXNzaW9uSW5mbyxcbiAgT3JnSW5mbyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFdGgyU3Rha2VSZXF1ZXN0LFxuICBFdGgyU3Rha2VSZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIEJ0Y01lc3NhZ2VTaWduUmVzcG9uc2UsXG4gIEJ0Y01lc3NhZ2VTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlc3BvbnNlLFxuICBTb2xhbmFTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXF1ZXN0LFxuICBBdmFTZXJpYWxpemVkVHhTaWduUmVxdWVzdCxcbiAgQXZhVHgsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBNZW1iZXJSb2xlLFxuICBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSxcbiAgVXNlckV4cG9ydEluaXRSZXNwb25zZSxcbiAgVXNlckV4cG9ydExpc3RSZXNwb25zZSxcbiAgRW1wdHksXG4gIFVzZXJPcmdzUmVzcG9uc2UsXG4gIENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlLFxuICBJbXBvcnRLZXlSZXF1ZXN0LFxuICBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICBMaXN0UG9saWNpZXNSZXNwb25zZSxcbiAgUG9saWN5VHlwZSxcbiAgUG9saWN5SW5mbyxcbiAgRGlmZmllSGVsbG1hblJlcXVlc3QsXG4gIERpZmZpZUhlbGxtYW5SZXNwb25zZSxcbiAgS2V5SW5mb0p3dCxcbiAgQ29udGFjdExhYmVsLFxuICBDb250YWN0QWRkcmVzc0RhdGEsXG4gIEF1ZGl0TG9nUmVxdWVzdCxcbiAgQXVkaXRMb2dSZXNwb25zZSxcbiAgQXVkaXRMb2dFbnRyeSxcbiAgUm9sZUluZm9Kd3QsXG4gIEtleUF0dGVzdGF0aW9uUXVlcnksXG4gIFJvbGVBdHRlc3RhdGlvblF1ZXJ5LFxuICBFcnJvclJlc3BvbnNlLFxufSBmcm9tIFwiLi4vc2NoZW1hX3R5cGVzXCI7XG5pbXBvcnQgeyBlbmNvZGVUb0Jhc2U2NCB9IGZyb20gXCIuLi91dGlsXCI7XG5pbXBvcnQge1xuICBBZGRGaWRvQ2hhbGxlbmdlLFxuICBNZmFGaWRvQ2hhbGxlbmdlLFxuICBNZmFFbWFpbENoYWxsZW5nZSxcbiAgVG90cENoYWxsZW5nZSxcbiAgUmVzZXRFbWFpbENoYWxsZW5nZSxcbn0gZnJvbSBcIi4uL21mYVwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lclJlc3BvbnNlLCBtYXBSZXNwb25zZSB9IGZyb20gXCIuLi9yZXNwb25zZVwiO1xuaW1wb3J0IHR5cGUgeyBLZXksIEtleVR5cGUgfSBmcm9tIFwiLi4va2V5XCI7XG5pbXBvcnQgdHlwZSB7IFBhZ2VPcHRzIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHsgUGFnZSwgUGFnaW5hdG9yIH0gZnJvbSBcIi4uL3BhZ2luYXRvclwiO1xuaW1wb3J0IHR5cGUgeyBLZXlQb2xpY3kgfSBmcm9tIFwiLi4vcm9sZVwiO1xuaW1wb3J0IHsgbG9hZFN1YnRsZUNyeXB0byB9IGZyb20gXCIuLi91c2VyX2V4cG9ydFwiO1xuaW1wb3J0IHR5cGUgKiBhcyBwb2xpY3kgZnJvbSBcIi4uL3BvbGljeVwiO1xuaW1wb3J0IHtcbiAgdHlwZSBBZGRJZGVudGl0eVJlcXVlc3QsXG4gIHR5cGUgQXZhQ2hhaW4sXG4gIHR5cGUgRW52SW50ZXJmYWNlLFxuICB0eXBlIEVvdHNDcmVhdGVOb25jZVJlcXVlc3QsXG4gIHR5cGUgRW90c0NyZWF0ZU5vbmNlUmVzcG9uc2UsXG4gIHR5cGUgRW90c1NpZ25SZXF1ZXN0LFxuICB0eXBlIEVvdHNTaWduUmVzcG9uc2UsXG4gIHR5cGUgSnJwY1Jlc3BvbnNlLFxuICB0eXBlIEpzb25BcnJheSxcbiAgdHlwZSBMaXN0SWRlbnRpdHlSZXNwb25zZSxcbiAgdHlwZSBMaXN0S2V5Um9sZXNSZXNwb25zZSxcbiAgdHlwZSBMaXN0S2V5c1Jlc3BvbnNlLFxuICB0eXBlIExpc3RSb2xlS2V5c1Jlc3BvbnNlLFxuICB0eXBlIExpc3RSb2xlVXNlcnNSZXNwb25zZSxcbiAgdHlwZSBMaXN0Um9sZXNSZXNwb25zZSxcbiAgdHlwZSBNbWlKcnBjTWV0aG9kLFxuICB0eXBlIFBlbmRpbmdNZXNzYWdlSW5mbyxcbiAgdHlwZSBQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZSxcbiAgdHlwZSBSYXRjaGV0Q29uZmlnLFxuICB0eXBlIFNjb3BlLFxuICB0eXBlIFNlc3Npb25EYXRhLFxuICB0eXBlIFNlc3Npb25MaWZldGltZSxcbiAgdHlwZSBTZXNzaW9uc1Jlc3BvbnNlLFxuICB0eXBlIFRhcHJvb3RTaWduUmVxdWVzdCxcbiAgdHlwZSBUYXByb290U2lnblJlc3BvbnNlLFxuICB0eXBlIEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICB0eXBlIEJhYnlsb25SZWdpc3RyYXRpb25SZXNwb25zZSxcbiAgdHlwZSBCYWJ5bG9uU3Rha2luZ1JlcXVlc3QsXG4gIHR5cGUgQmFieWxvblN0YWtpbmdSZXNwb25zZSxcbiAgdHlwZSBVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3QsXG4gIHR5cGUgSGlzdG9yaWNhbFR4LFxuICB0eXBlIExpc3RIaXN0b3JpY2FsVHhSZXNwb25zZSxcbiAgdHlwZSBQdWJsaWNPcmdJbmZvLFxuICB0eXBlIEltcG9ydERlcml2ZUtleVByb3BlcnRpZXMsXG4gIHR5cGUgUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gIHR5cGUgRW1haWxPdHBSZXNwb25zZSxcbiAgdHlwZSBBdXRoZW50aWNhdGlvblJlcXVlc3QsXG4gIHR5cGUgQXV0aGVudGljYXRpb25SZXNwb25zZSxcbiAgdHlwZSBDcmVhdGVLZXlQcm9wZXJ0aWVzLFxuICB0eXBlIEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICB0eXBlIE1mYVJlY2VpcHRzLFxuICB0eXBlIFN1aVNpZ25SZXF1ZXN0LFxuICB0eXBlIFN1aVNpZ25SZXNwb25zZSxcbiAgdHlwZSBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICB0eXBlIFF1ZXJ5TWV0cmljc1Jlc3BvbnNlLFxuICB0eXBlIENyZWF0ZU9yZ1JlcXVlc3QsXG4gIHR5cGUgS2V5VHlwZUFuZERlcml2YXRpb25QYXRoLFxuICB0eXBlIERlcml2ZU11bHRpcGxlS2V5VHlwZXNQcm9wZXJ0aWVzLFxuICB0eXBlIENvbnRhY3RJbmZvLFxuICB0eXBlIExpc3RDb250YWN0c1Jlc3BvbnNlLFxuICB0eXBlIEpzb25WYWx1ZSxcbiAgdHlwZSBFZGl0UG9saWN5LFxuICB0eXBlIFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxuICB0eXBlIEFkZHJlc3NNYXAsXG4gIHR5cGUgUm9sZVBvbGljeSxcbiAgdHlwZSBJbnZva2VQb2xpY3lSZXNwb25zZSxcbiAgdHlwZSBJbnZva2VQb2xpY3lSZXF1ZXN0LFxuICB0eXBlIFVwbG9hZFdhc21Qb2xpY3lSZXF1ZXN0LFxuICB0eXBlIFVwbG9hZFdhc21Qb2xpY3lSZXNwb25zZSxcbiAgdHlwZSBMb2dpblJlcXVlc3QsXG4gIHR5cGUgUGFzc2tleUFzc2VydEFuc3dlcixcbiAgdHlwZSBzY2hlbWFzLFxuICB0eXBlIEtleVdpdGhQb2xpY2llc0luZm8sXG4gIHR5cGUgR2V0Um9sZUtleU9wdGlvbnMsXG4gIHR5cGUgR2V0VXNlckJ5RW1haWxSZXNwb25zZSxcbiAgdHlwZSBHZXRVc2VyQnlPaWRjUmVzcG9uc2UsXG4gIHR5cGUgRW1haWxUZW1wbGF0ZVB1cnBvc2UsXG4gIEVyclJlc3BvbnNlLFxufSBmcm9tIFwiLi4vaW5kZXhcIjtcbmltcG9ydCB7IGFzc2VydE9rLCBvcCwgdHlwZSBPcCwgdHlwZSBPcGVyYXRpb24sIGFwaUZldGNoIH0gZnJvbSBcIi4uL2ZldGNoXCI7XG5pbXBvcnQgeyBCYXNlQ2xpZW50LCB0eXBlIENsaWVudENvbmZpZywgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyB9IGZyb20gXCIuL2Jhc2VfY2xpZW50XCI7XG5pbXBvcnQgeyByZXRyeU9uNVhYIH0gZnJvbSBcIi4uL3JldHJ5XCI7XG5pbXBvcnQgeyBQYXNza2V5TG9naW5DaGFsbGVuZ2UgfSBmcm9tIFwiLi4vcGFzc2tleVwiO1xuXG4vLyB0aGVzZSB0eXBlcyBhcmUgdXNlZCBpbiBkb2MgY29tbWVudHMgb25seVxuLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuaW1wb3J0IHR5cGUgeyBSb2xlQXR0ZXN0YXRpb25DbGFpbXMsIEtleUF0dGVzdGF0aW9uQ2xhaW1zIH0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuXG4vKipcbiAqIFN0cmluZyByZXR1cm5lZCBieSBBUEkgd2hlbiBhIHVzZXIgZG9lcyBub3QgaGF2ZSBhbiBlbWFpbCBhZGRyZXNzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpXG4gKi9cbmNvbnN0IEVNQUlMX05PVF9GT1VORCA9IFwiZW1haWwgbm90IGZvdW5kXCI7XG5cbi8qKlxuICogU2Vzc2lvbiBzZWxlY3Rvci5cbiAqL1xuZXhwb3J0IHR5cGUgU2Vzc2lvblNlbGVjdG9yID1cbiAgLyoqXG4gICAqIFNlbGVjdHMgYWxsIHNlc3Npb25zIHRpZWQgdG8gYSByb2xlIHdpdGggdGhpcyBJRFxuICAgKlxuICAgKiBAZGVwcmVjYXRlZCBVc2UgYHsgcm9sZTogc3RyaW5nIH1gIGluc3RlYWRcbiAgICovXG4gIHwgc3RyaW5nXG4gIHwge1xuICAgICAgLyoqIFNlbGVjdHMgYWxsIHNlc3Npb25zIHRpZWQgdG8gYSByb2xlIHdpdGggdGhpcyBJRCAqL1xuICAgICAgcm9sZTogc3RyaW5nO1xuICAgIH1cbiAgfCB7XG4gICAgICAvKiogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHVzZXIgd2l0aCB0aGlzIElELiAqL1xuICAgICAgdXNlcjogc3RyaW5nO1xuICAgIH07XG5cbi8qKlxuICogQW4gZXh0ZW5zaW9uIG9mIEJhc2VDbGllbnQgdGhhdCBhZGRzIHNwZWNpYWxpemVkIG1ldGhvZHMgZm9yIGFwaSBlbmRwb2ludHNcbiAqL1xuZXhwb3J0IGNsYXNzIEFwaUNsaWVudCBleHRlbmRzIEJhc2VDbGllbnQge1xuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjbGllbnQgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgYVxuICAgKiBkaWZmZXJlbnQgKGNoaWxkKSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgYW4gb3JnYW5pemF0aW9uIHRoYXQgdGhlIG5ldyBjbGllbnQgc2hvdWxkIHRhcmdldFxuICAgKiBAcmV0dXJucyBBIG5ldyBjbGllbnQgdGFyZ2V0aW5nIGEgZGlmZmVyZW50IG9yZ1xuICAgKi9cbiAgd2l0aFRhcmdldE9yZyh0YXJnZXRPcmdJZDogc3RyaW5nKTogQXBpQ2xpZW50IHtcbiAgICByZXR1cm4gbmV3IEFwaUNsaWVudCh0aGlzLnNlc3Npb25NZXRhLCB0aGlzLnNlc3Npb25NYW5hZ2VyLCB0YXJnZXRPcmdJZCwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgY2xpZW50IHVzaW5nIHdpdGggYW4gdXBkYXRlZCB7QGxpbmsgQ2xpZW50Q29uZmlnfS5cbiAgICpcbiAgICogQHBhcmFtIGNmZyBQYXJ0aWFsIGNvbmZpZ3VyYXRpb24gdG8gYXBwbHkgb24gdG9wIG9mIHRoZSBleGlzdGluZyBjbGllbnRcbiAgICogQHJldHVybnMgQSBuZXcgY2xpZW50IHdpdGggdGhlIHVwZGF0ZWQgY29uZmlndXJhdGlvblxuICAgKi9cbiAgd2l0aENvbmZpZyhjZmc6IFBhcnRpYWw8Q2xpZW50Q29uZmlnPik6IEFwaUNsaWVudCB7XG4gICAgcmV0dXJuIG5ldyBBcGlDbGllbnQodGhpcy5zZXNzaW9uTWV0YSwgdGhpcy5zZXNzaW9uTWFuYWdlciwgdGhpcy5vcmdJZCwge1xuICAgICAgLi4udGhpcy5jb25maWcsXG4gICAgICAuLi5jZmcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIC4uLih0aGlzLmNvbmZpZy5oZWFkZXJzID8/IHt9KSxcbiAgICAgICAgLi4uKGNmZy5oZWFkZXJzID8/IHt9KSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjbGllbnQgaW4gd2hpY2ggdGhlIGN1cnJlbnQgc2Vzc2lvbiB3aWxsIGFzc3VtZSBhIGdpdmVuIHJvbGUuXG4gICAqIE5vIHZhbGlkYXRpb24gaXMgZG9uZSBvbiB0aGUgY2xpZW50IHNpZGU7IHRoZSBiYWNrIGVuZCB3aWxsIHJlamVjdCBzdWJzZXF1ZW50XG4gICAqIHJlcXVlc3RzIGlmIHRoZSBjdXJyZW50IHNlc3Npb24gaXMgbm90IGFsbG93ZWQgdG8gYXNzdW1lIHRoYXQgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgbmFtZSBvciBJRCBvZiBhIHJvbGUgdG8gYXNzdW1lLlxuICAgKiBAcmV0dXJucyBBIG5ldyBjbGllbnQgd2l0aCB0aGUgdXBkYXRlZCBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgYXNzdW1lUm9sZShyb2xlSWQ6IHN0cmluZyk6IEFwaUNsaWVudCB7XG4gICAgcmV0dXJuIHRoaXMud2l0aENvbmZpZyh7XG4gICAgICBoZWFkZXJzOiB7IFwieC1jdWJpc3QtYXNzdW1lLXJvbGVcIjogcm9sZUlkIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyAjcmVnaW9uIFVTRVJTOiB1c2VyR2V0LCB1c2VyVG90cChSZXNldEluaXR8UmVzZXRDb21wbGV0ZXxWZXJpZnl8RGVsZXRlKSwgdXNlckZpZG8oUmVnaXN0ZXJJbml0fFJlZ2lzdGVyQ29tcGxldGV8RGVsZXRlKVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKi9cbiAgYXN5bmMgdXNlckdldCgpOiBQcm9taXNlPFVzZXJJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pLnRoZW4oQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBsb2dpbiB2aWEgRW1haWwgT1RQLlxuICAgKiBSZXR1cm5zIGFuIHVuc2lnbmVkIE9JREMgdG9rZW4gYW5kIHNlbmRzIGFuIGVtYWlsIHRvIHRoZSB1c2VyIGNvbnRhaW5pbmcgdGhlIHNpZ25hdHVyZSBvZiB0aGF0IHRva2VuLlxuICAgKiBUaGUgT0lEQyB0b2tlbiBjYW4gYmUgcmVjb25zdHJ1Y3RlZCBieSBhcHBlbmRpbmcgdGhlIHNpZ25hdHVyZSB0byB0aGUgcGFydGlhbCB0b2tlbiBsaWtlIHNvOlxuICAgKlxuICAgKiB0b2tlbiA9IHBhcnRpYWxfdG9rZW4gKyBzaWduYXR1cmVcbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZ2luIHRvXG4gICAqIEBwYXJhbSBlbWFpbCBUaGUgZW1haWwgdG8gc2VuZCB0aGUgc2lnbmF0dXJlIHRvXG4gICAqIEByZXR1cm5zIFRoZSBwYXJ0aWFsIE9JREMgdG9rZW4gdGhhdCBtdXN0IGJlIGNvbWJpbmVkIHdpdGggdGhlIHNpZ25hdHVyZSBpbiB0aGUgZW1haWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbml0RW1haWxPdHBBdXRoKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgZW1haWw6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxFbWFpbE90cFJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjL2VtYWlsLW90cFwiLCBcInBvc3RcIik7XG5cbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keTogeyBlbWFpbCB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXRyaWVzIGEgcGVuZGluZyBNRkEgcmVxdWVzdCB3aXRoIHRoZSBwcm92aWRlZCBNZmFSZWNlaXB0c1xuICAgKlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHJldHJ5XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IFRoZSBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyXG4gICAqL1xuICBhc3luYyBtZmFSZXRyeShcbiAgICByZXE6IE1mYVJlcXVlc3RJbmZvW1wicmVxdWVzdFwiXSxcbiAgICBtZmFSZWNlaXB0OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8dW5rbm93bj4+IHtcbiAgICBjb25zdCBvOiBPcDxPcGVyYXRpb24+ID0gKG9wdHMpID0+XG4gICAgICAvLyBAdHMtZXhwZWN0LWVycm9yIFdlJ3JlIGRvaW5nIHNvbWUgaGVhdnkgY2FzdGluZyB0byBnZXQgdGhpcyB0byB3b3JrXG4gICAgICBhcGlGZXRjaChyZXEucGF0aCwgcmVxLm1ldGhvZCwge1xuICAgICAgICAuLi5vcHRzLFxuICAgICAgICBib2R5OiByZXEuYm9keSxcbiAgICAgIH0pO1xuICAgIGNvbnN0IHJldHJ5ID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmV0cnksIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSByZXF1ZXN0IHRvIGNoYW5nZSB1c2VyJ3MgdmVyaWZpZWQgZW1haWwuXG4gICAqXG4gICAqIFJldHVybnMgYSB7QGxpbmsgUmVzZXRFbWFpbENoYWxsZW5nZX0gdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGVpdGhlciBieSBjYWxsaW5nXG4gICAqIHtAbGluayBSZXNldEVtYWlsQ2hhbGxlbmdlLmFuc3dlcn0gKG9yIHtAbGluayBBcGlDbGllbnQudXNlckVtYWlsUmVzZXRDb21wbGV0ZX0pLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxIEVpdGhlciB0aGUgZW1haWwgdG8gcmVnaXN0ZXIgb3IgdGhlIHBhcmFtZXRlcnMgZm9yIHRoZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEFuIGVtYWlsIHZlcmlmaWNhdGlvbiBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkXG4gICAqL1xuICBhc3luYyB1c2VyRW1haWxSZXNldEluaXQoXG4gICAgcmVxOiBzdHJpbmcgfCBzY2hlbWFzW1wiRW1haWxSZXNldFJlcXVlc3RcIl0sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxSZXNldEVtYWlsQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9lbWFpbFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcmVzZXRFbWFpbEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHR5cGVvZiByZXEgPT09IFwic3RyaW5nXCIgPyB7IGVtYWlsOiByZXEgfSA6IHJlcSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsIChlbWFpbE90cCkgPT4gbmV3IFJlc2V0RW1haWxDaGFsbGVuZ2UodGhpcywgZW1haWxPdHApKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXNldEVtYWlsRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgcmVzZXQgZW1haWwgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgdXNlckVtYWlsUmVzZXRJbml0fS5cbiAgICogSWYgc3VjY2Vzc2Z1bCwgdXNlcidzIHZlcmlmaWVkIGVtYWlsIHdpbGwgYmUgdXBkYXRlZC5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIFJlc2V0RW1haWxDaGFsbGVuZ2UuYW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIHBhcnRpYWxUb2tlbiBUaGUgcGFydGlhbCB0b2tlbiByZXR1cm5lZCBieSB7QGxpbmsgdXNlckVtYWlsUmVzZXRJbml0fVxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIFRoZSBvbmUtdGltZSBjb2RlIChzaWduYXR1cmUgaW4gdGhpcyBjYXNlKSBzZW50IHZpYSBlbWFpbFxuICAgKi9cbiAgYXN5bmMgdXNlckVtYWlsUmVzZXRDb21wbGV0ZShwYXJ0aWFsVG9rZW46IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZW1haWxcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyB0b2tlbjogYCR7cGFydGlhbFRva2VufSR7c2lnbmF0dXJlfWAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIFRPVFAuIFJldHVybnMgYSB7QGxpbmsgVG90cENoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGVpdGhlciBieSBjYWxsaW5nIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0gKG9yXG4gICAqIHtAbGluayBBcGlDbGllbnQudXNlclRvdHBSZXNldENvbXBsZXRlfSkuXG4gICAqXG4gICAqIEBwYXJhbSBpc3N1ZXIgT3B0aW9uYWwgaXNzdWVyOyBkZWZhdWx0cyB0byBcIkN1YmlzdFwiXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEEgVE9UUCBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkXG4gICAqL1xuICBhc3luYyB1c2VyVG90cFJlc2V0SW5pdChcbiAgICBpc3N1ZXI/OiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxUb3RwQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCByZXNldFRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiBpc3N1ZXJcbiAgICAgICAgICA/IHtcbiAgICAgICAgICAgICAgaXNzdWVyLFxuICAgICAgICAgICAgfVxuICAgICAgICAgIDogbnVsbCxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKGRhdGEsICh0b3RwSW5mbykgPT4gbmV3IFRvdHBDaGFsbGVuZ2UodGhpcywgdG90cEluZm8pKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXNldFRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQW5zd2VyIHRoZSBUT1RQIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJUb3RwUmVzZXRJbml0fS4gSWYgc3VjY2Vzc2Z1bCwgdXNlcidzXG4gICAqIFRPVFAgY29uZmlndXJhdGlvbiB3aWxsIGJlIHVwZGF0ZWQgdG8gdGhhdCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2UuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBUb3RwQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSB0b3RwSWQgVGhlIElEIG9mIHRoZSBUT1RQIGNoYWxsZW5nZVxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlIHRoYXQgc2hvdWxkIHZlcmlmeSBhZ2FpbnN0IHRoZSBUT1RQIGNvbmZpZ3VyYXRpb24gZnJvbSB0aGUgY2hhbGxlbmdlLlxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldENvbXBsZXRlKHRvdHBJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcInBhdGNoXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7IHRvdHBfaWQ6IHRvdHBJZCwgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFZlcmlmaWVzIGEgZ2l2ZW4gVE9UUCBjb2RlIGFnYWluc3QgdGhlIGN1cnJlbnQgdXNlcidzIFRPVFAgY29uZmlndXJhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGNvZGUgQ3VycmVudCBUT1RQIGNvZGVcbiAgICogQHRocm93cyBBbiBlcnJvciBpZiB2ZXJpZmljYXRpb24gZmFpbHNcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwVmVyaWZ5KGNvZGU6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwL3ZlcmlmeVwiLCBcInBvc3RcIik7XG5cbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyBjb2RlIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIFRPVFAgZnJvbSB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIEFsbG93ZWQgb25seSBpZiBhdCBsZWFzdCBvbmUgRklETyBrZXkgaXMgcmVnaXN0ZXJlZCB3aXRoIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogTUZBIHZpYSBGSURPIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwRGVsZXRlKG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS90b3RwXCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IGRlbGV0ZVRvdHBGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZGVsZXRlVG90cEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhZGRpbmcgYSBuZXcgRklETyBkZXZpY2UuIE1GQSBtYXkgYmUgcmVxdWlyZWQuICBUaGlzIHJldHVybnMgYSB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZX1cbiAgICogdGhhdCBtdXN0IGJlIGFuc3dlcmVkIHdpdGgge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvciB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckNvbXBsZXRlfVxuICAgKiAoYWZ0ZXIgTUZBIGFwcHJvdmFscykuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBuZXcgZGV2aWNlIG9yIGEgZnVsbCByZXF1ZXN0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgaW4gb3JkZXIgdG8gY29tcGxldGUgRklETyByZWdpc3RyYXRpb24uXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVySW5pdChcbiAgICBuYW1lOiBzdHJpbmcgfCBzY2hlbWFzW1wiRmlkb0NyZWF0ZVJlcXVlc3RcIl0sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBZGRGaWRvQ2hhbGxlbmdlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBhZGRGaWRvRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogdHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIgPyB7IG5hbWUgfSA6IG5hbWUsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAoYykgPT4gbmV3IEFkZEZpZG9DaGFsbGVuZ2UodGhpcywgYykpO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGFkZEZpZG9GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayB1c2VyRmlkb1JlZ2lzdGVySW5pdH0pIHJlcXVlc3QgdG8gYWRkIGEgbmV3IEZJRE8gZGV2aWNlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gY2hhbGxlbmdlSWQgVGhlIElEIG9mIHRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqIEBwYXJhbSBjcmVkZW50aWFsIFRoZSBhbnN3ZXIgdG8gdGhlIGNoYWxsZW5nZS5cbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZShcbiAgICBjaGFsbGVuZ2VJZDogc3RyaW5nLFxuICAgIGNyZWRlbnRpYWw6IFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gICk6IFByb21pc2U8RW1wdHk+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIEZJRE8ga2V5IGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgVE9UUCBpcyBhbHNvIGRlZmluZWQuXG4gICAqIE1GQSB2aWEgVE9UUCBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBmaWRvSWQgVGhlIElEIG9mIHRoZSBkZXNpcmVkIEZJRE8ga2V5XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb0RlbGV0ZShcbiAgICBmaWRvSWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IGRlbGV0ZUZpZG9GbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9maWRvL3tmaWRvX2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGZpZG9faWQ6IGZpZG9JZCB9IH0sXG4gICAgICB9KTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkZWxldGVGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHUzogb3JnR2V0LCBvcmdVcGRhdGUsIG9yZ1VwZGF0ZVVzZXJNZW1iZXJzaGlwLCBvcmdDcmVhdGVPcmcsIG9yZ1F1ZXJ5TWV0cmljcywgb3JnR2V0RW1haWxDb25maWcsIG9yZ0NvbmZpZ3VyZUVtYWlsLCBvcmdEZWxldGVFbWFpbENvbmZpZ1xuXG4gIC8qKlxuICAgKiBPYnRhaW4gaW5mb3JtYXRpb24gYWJvdXQgYW4gb3JnXG4gICAqXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGdldCBpbmZvIGZvclxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgb3JnYW5pemF0aW9uLlxuICAgKi9cbiAgYXN5bmMgb3JnR2V0KG9yZ0lkPzogc3RyaW5nKTogUHJvbWlzZTxPcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IG9yZ19pZDogb3JnSWQgPz8gdGhpcy5vcmdJZCB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIEpTT04gcmVxdWVzdCB0byBzZW5kIHRvIHRoZSBBUEkgc2VydmVyLlxuICAgKiBAcmV0dXJucyBVcGRhdGVkIG9yZyBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIG9yZ1VwZGF0ZShyZXF1ZXN0OiBVcGRhdGVPcmdSZXF1ZXN0KTogUHJvbWlzZTxVcGRhdGVPcmdSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywgeyBib2R5OiByZXF1ZXN0IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSB1c2VyJ3MgbWVtYmVyc2hpcCBpbiB0aGlzIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgd2hvc2UgbWVtYmVyc2hpcCB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSByZXEgVGhlIHVwZGF0ZSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFVwZGF0ZWQgdXNlciBtZW1iZXJzaGlwXG4gICAqL1xuICBhc3luYyBvcmdVcGRhdGVVc2VyTWVtYmVyc2hpcChcbiAgICB1c2VySWQ6IHN0cmluZyxcbiAgICByZXE6IFVwZGF0ZVVzZXJNZW1iZXJzaGlwUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH0vbWVtYmVyc2hpcFwiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICAgIGJvZHk6IHJlcSxcbiAgICB9KS50aGVuKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBvcmdhbml6YXRpb24uIFRoZSBuZXcgb3JnIGlzIGEgY2hpbGQgb2YgdGhlXG4gICAqIGN1cnJlbnQgb3JnIGFuZCBpbmhlcml0cyBpdHMga2V5LWV4cG9ydCBwb2xpY3kuIFRoZSBuZXcgb3JnXG4gICAqIGlzIGNyZWF0ZWQgd2l0aCBvbmUgb3duZXIsIHRoZSBjYWxsZXIgb2YgdGhpcyBBUEkuXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IFRoZSBkZXRhaWxzIG9mIHRoZSByZXF1ZXN0XG4gICAqIEByZXR1cm5zIFRoZSBuZXcgb3JnYW5pemF0aW9uIGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBvcmdDcmVhdGVPcmcoYm9keTogQ3JlYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vb3Jnc1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IGJvZHkgfSk7XG4gIH1cblxuICAvKipcbiAgICogUXVlcnkgdGhlIGF1ZGl0IGxvZy5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIHF1ZXJ5LlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHQgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBSZXF1ZXN0ZWQgYXVkaXQgbG9nLlxuICAgKi9cbiAgb3JnUXVlcnlBdWRpdExvZyhcbiAgICBib2R5OiBBdWRpdExvZ1JlcXVlc3QsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8QXVkaXRMb2dSZXNwb25zZSwgQXVkaXRMb2dFbnRyeVtdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdWRpdFwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IGJvZHksIHBhcmFtczogeyBxdWVyeSB9IH0pLFxuICAgICAgKHIpID0+IHIuZW50cmllcyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgcXVlcnlcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0IHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgQ29tcHV0ZWQgb3JnIG1ldHJpY3Mgc3RhdGlzdGljcy5cbiAgICovXG4gIG9yZ1F1ZXJ5TWV0cmljcyhcbiAgICBib2R5OiBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFF1ZXJ5TWV0cmljc1Jlc3BvbnNlLCBRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWV0cmljc1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBib2R5LCBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICAgIChhY2MsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKCFhY2MpIHJldHVybiBuZXh0O1xuICAgICAgICBhY2MucmF3X2RhdGEgPz89IFtdO1xuICAgICAgICBhY2MucmF3X2RhdGEucHVzaCguLi4obmV4dC5yYXdfZGF0YSA/PyBbXSkpO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBlbWFpbCBjb25maWd1cmF0aW9uIGZvciBhIGdpdmVuIHB1cnBvc2UuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBlbWFpbCB0ZW1wbGF0ZSBraW5kIHRvIGdldFxuICAgKiBAcmV0dXJucyBUaGUgZW1haWwgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgb3JnR2V0RW1haWxDb25maWcoXG4gICAgcHVycG9zZTogRW1haWxUZW1wbGF0ZVB1cnBvc2UsXG4gICk6IFByb21pc2U8c2NoZW1hc1tcIkdldEVtYWlsQ29uZmlnUmVzcG9uc2VcIl0+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2VtYWlscy97cHVycG9zZX1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdXJwb3NlIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgZW1haWwgdGVtcGxhdGVcbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHRlbXBsYXRlIGtpbmQgdG8gY29uZmlndXJlXG4gICAqIEBwYXJhbSByZXEgVGhlIHRlbXBsYXRlIHBhcmFtZXRlcnNcbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIG9yZ0NvbmZpZ3VyZUVtYWlsKFxuICAgIHB1cnBvc2U6IEVtYWlsVGVtcGxhdGVQdXJwb3NlLFxuICAgIHJlcTogc2NoZW1hc1tcIkNvbmZpZ3VyZUVtYWlsUmVxdWVzdFwiXSxcbiAgKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZW1haWxzL3twdXJwb3NlfVwiLCBcInB1dFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1cnBvc2UgfSB9LFxuICAgICAgYm9keTogcmVxLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBlbWFpbCBjb25maWd1cmF0aW9uIGZvciBhIGdpdmVuIHB1cnBvc2UuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBlbWFpbCB0ZW1wbGF0ZSBraW5kIHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgb3JnRGVsZXRlRW1haWxDb25maWcocHVycG9zZTogRW1haWxUZW1wbGF0ZVB1cnBvc2UpOiBQcm9taXNlPEVtcHR5PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9lbWFpbHMve3B1cnBvc2V9XCIsIFwiZGVsZXRlXCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVycG9zZSB9IH0sXG4gICAgICBib2R5OiB7fSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SRyBVU0VSUzogb3JnVXNlckludml0ZSwgb3JnVXNlckRlbGV0ZSwgb3JnVXNlcnNMaXN0LCBvcmdVc2VyR2V0LCBvcmdVc2VyR2V0QnlFbWFpbCwgb3JnVXNlckNyZWF0ZU9pZGMsIG9yZ1VzZXJEZWxldGVPaWRjXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZCBhbiBlbWFpbCBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogQG92ZXJsb2FkXG4gICAqIEBwYXJhbSBhcmdzIFRoZSBpbnZpdGF0aW9uIHJlcXVlc3QgZGV0YWlsc1xuICAgKi9cbiAgYXN5bmMgb3JnVXNlckludml0ZShhcmdzOiBzY2hlbWFzW1wiSW52aXRlUmVxdWVzdFwiXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBvdmVybG9hZFxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqIEBwYXJhbSBza2lwRW1haWwgT3B0aW9uYWxseSBza2lwIHNlbmRpbmcgdGhlIGludml0ZSBlbWFpbC5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIHRoZSBvYmplY3QgcGFyYW1ldGVyIG92ZXJsb2FkIGluc3RlYWQuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKFxuICAgIGVtYWlsOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHJvbGU/OiBNZW1iZXJSb2xlLFxuICAgIHNraXBFbWFpbD86IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbWFpbE9yQXJncyBFaXRoZXIgdGhlIHVzZXIncyBlbWFpbCAoZGVwcmVjYXRlZCkgb3IgYW4gSW52aXRlUmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlciAocmVxdWlyZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICogQHBhcmFtIHJvbGUgT3B0aW9uYWwgcm9sZS4gRGVmYXVsdHMgdG8gXCJhbGllblwiIChvbmx5IHVzZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICogQHBhcmFtIHNraXBFbWFpbCBPcHRpb25hbGx5IHNraXAgc2VuZGluZyB0aGUgaW52aXRlIGVtYWlsIChvbmx5IHVzZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJJbnZpdGUoXG4gICAgZW1haWxPckFyZ3M6IHN0cmluZyB8IHNjaGVtYXNbXCJJbnZpdGVSZXF1ZXN0XCJdLFxuICAgIG5hbWU/OiBzdHJpbmcsXG4gICAgcm9sZT86IE1lbWJlclJvbGUsXG4gICAgc2tpcEVtYWlsPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYXJnczogc2NoZW1hc1tcIkludml0ZVJlcXVlc3RcIl0gPVxuICAgICAgdHlwZW9mIGVtYWlsT3JBcmdzID09PSBcInN0cmluZ1wiXG4gICAgICAgID8ge1xuICAgICAgICAgICAgZW1haWw6IGVtYWlsT3JBcmdzLFxuICAgICAgICAgICAgbmFtZTogbmFtZSEsXG4gICAgICAgICAgICByb2xlLFxuICAgICAgICAgICAgc2tpcF9lbWFpbDogISFza2lwRW1haWwsXG4gICAgICAgICAgfVxuICAgICAgICA6IGVtYWlsT3JBcmdzO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogYXJncyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHVzZXIgZnJvbSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIHNlYXJjaFF1ZXJ5IE9wdGlvbmFsIHF1ZXJ5IHN0cmluZy4gSWYgZGVmaW5lZCwgYWxsIHJldHVybmVkIHVzZXJzIHdpbGwgY29udGFpbiB0aGlzIHN0cmluZyBpbiB0aGVpciBuYW1lIG9yIGVtYWlsLlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSB1c2VycyBpbiB0aGUgb3JnLlxuICAgKi9cbiAgb3JnVXNlcnNMaXN0KFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBzZWFyY2hRdWVyeT86IHN0cmluZyxcbiAgKTogUGFnaW5hdG9yPEdldFVzZXJzSW5PcmdSZXNwb25zZSwgVXNlckluT3JnSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IHE6IHNlYXJjaFF1ZXJ5LCAuLi5wYWdlUXVlcnkgfSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMubWFwKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdldC5cbiAgICogQHJldHVybnMgT3JnIHVzZXIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyR2V0KHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBlbWFpbC5cbiAgICpcbiAgICogQHBhcmFtIGVtYWlsIFRoZSBlbWFpbCBvZiB0aGUgdXNlciB0byBnZXQuXG4gICAqIEByZXR1cm5zIE9yZyB1c2VycyB3aXRoIGEgZ2l2ZW4gZW1haWxcbiAgICogQHRocm93cyBpZiB0aGVyZSBpcyBubyB1c2VyIHdpdGggdGhhdCBlbWFpbCwgb3IgZW1haWwgaXMgaW52YWxpZFxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckdldEJ5RW1haWwoZW1haWw6IHN0cmluZyk6IFByb21pc2U8R2V0VXNlckJ5RW1haWxSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvZW1haWwve2VtYWlsfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IGVtYWlsIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IE9JREMgaWRlbnRpdHlcbiAgICpcbiAgICogQHBhcmFtIGlzcyBPSURDIGlzc3VlclxuICAgKiBAcGFyYW0gc3ViIE9JREMgc3ViamVjdFxuICAgKiBAcmV0dXJucyBPcmcgdXNlciB3aXRoIGEgZ2l2ZW4gT0lEQyBpZGVudGl0eVxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckdldEJ5T2lkYyhpc3M6IHN0cmluZywgc3ViOiBzdHJpbmcpOiBQcm9taXNlPEdldFVzZXJCeU9pZGNSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkYy97aXNzfS97c3VifVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IGlzcywgc3ViIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIEBwYXJhbSBpZGVudGl0eU9yUHJvb2YgVGhlIGlkZW50aXR5IG9yIGlkZW50aXR5IHByb29mIG9mIHRoZSBPSURDIHVzZXIsIG9yIG51bGwgdG8gY3JlYXRlIGEgdXNlciB3aXRob3V0IGFuIGlkZW50aXR5LlxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0gb3B0cyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIG5ldyBPSURDIHVzZXJzXG4gICAqIEByZXR1cm5zIFVzZXIgaWQgb2YgdGhlIG5ldyB1c2VyXG4gICAqL1xuICBhc3luYyBvcmdVc2VyQ3JlYXRlT2lkYyhcbiAgICBpZGVudGl0eU9yUHJvb2Y6IE9pZGNJZGVudGl0eSB8IElkZW50aXR5UHJvb2YgfCBudWxsLFxuICAgIGVtYWlsPzogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRzOiBDcmVhdGVPaWRjVXNlck9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGlkZW50aXR5T3JQcm9vZkZpZWxkcyA9ICFpZGVudGl0eU9yUHJvb2ZcbiAgICAgID8ge31cbiAgICAgIDogXCJpZFwiIGluIGlkZW50aXR5T3JQcm9vZlxuICAgICAgICA/IHsgcHJvb2Y6IGlkZW50aXR5T3JQcm9vZiB9XG4gICAgICAgIDogeyBpZGVudGl0eTogaWRlbnRpdHlPclByb29mIH07XG5cbiAgICBjb25zdCB7IHVzZXJfaWQgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5LFxuICAgICAgICAuLi5pZGVudGl0eU9yUHJvb2ZGaWVsZHMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlT2lkYyhpZGVudGl0eTogT2lkY0lkZW50aXR5KTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleUF0dGVzdCwga2V5VXBkYXRlLCBrZXlEZWxldGUsIGtleXNDcmVhdGUsIGtleXNEZXJpdmUsIGtleXNMaXN0LCBrZXlIaXN0b3J5XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBrZXlHZXQoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZXN0IHRvIGtleSBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBUaGUgcmVzcG9uc2UgaXMgYSBKV1Qgd2hvc2UgY2xhaW1zIGFyZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgcmVxdWVzdGVkIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5LlxuICAgKiBAcGFyYW0gcXVlcnkgUXVlcnkgcGFyYW1ldGVyczpcbiAgICogQHBhcmFtIHF1ZXJ5LmluY2x1ZGVfcm9sZXMgaWYgc3BlY2lmaWVkLCBpbmNsdWRlIGFsbCB0aGUgcm9sZXMgdGhlIGtleSBpcyBpbi5cbiAgICogQHJldHVybnMgQSBKV1Qgd2hvc2UgY2xhaW1zIGFyZSB0aGUgcHJvcGVydGllcyBvZiB0aGUga2V5LiBUaGUgdHlwZSBvZiB0aGUgcmV0dXJuZWQgSldUIHBheWxvYWQgaXMge0BsaW5rIEtleUF0dGVzdGF0aW9uQ2xhaW1zfS5cbiAgICovXG4gIGFzeW5jIGtleUF0dGVzdChrZXlJZDogc3RyaW5nLCBxdWVyeT86IEtleUF0dGVzdGF0aW9uUXVlcnkpOiBQcm9taXNlPEtleUluZm9Kd3Q+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vYXR0ZXN0XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBxdWVyeSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyB0eXBlIGFuZCBtYXRlcmlhbCBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIGtleSB0eXBlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxJZCBUaGUgbWF0ZXJpYWwgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBrZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZTogS2V5VHlwZSwgbWF0ZXJpYWxJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfdHlwZX0ve21hdGVyaWFsX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X3R5cGU6IGtleVR5cGUsIG1hdGVyaWFsX2lkOiBtYXRlcmlhbElkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBhIGtleSBpcyBpbi5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJvbGVzIGEga2V5IGlzIGluLlxuICAgKi9cbiAga2V5Um9sZXNMaXN0KGtleUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0S2V5Um9sZXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9L3JvbGVzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqL1xuICBhc3luYyBrZXlVcGRhdGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICByZXF1ZXN0OiBVcGRhdGVLZXlSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8S2V5SW5mbz4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgS2V5IGlkXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBrZXlEZWxldGUoa2V5SWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBrZXkgcHJvcGVydGllc1xuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzQ3JlYXRlKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcblxuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBvd25lcjogcHJvcHM/Lm93bmVyID8/IG93bmVySWQsXG4gICAgICAgIHBvbGljeTogcHJvcHM/LnBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0Rlcml2ZShcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwgXCJwdXRcIik7XG5cbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGRlcml2YXRpb25fcGF0aDogZGVyaXZhdGlvblBhdGhzLFxuICAgICAgICBtbmVtb25pY19pZDogbW5lbW9uaWNJZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBwb2xpY3k6IHByb3BzPy5wb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogVXNlIGVpdGhlciBhIG5ldyBvciBleGlzdGluZyBtbmVtb25pYyB0byBkZXJpdmUga2V5cyBvZiBvbmUgb3IgbW9yZVxuICAgKiBzcGVjaWZpZWQgdHlwZXMgdmlhIHNwZWNpZmllZCBkZXJpdmF0aW9uIHBhdGhzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMgQSBsaXN0IG9mIG9iamVjdHMgc3BlY2lmeWluZyB0aGUga2V5cyB0byBiZSBkZXJpdmVkXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzRGVyaXZlTXVsdGkoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9kZXJpdmVfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAga2V5X3R5cGVzX2FuZF9kZXJpdmF0aW9uX3BhdGhzOiBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyxcbiAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIHBvbGljeTogcHJvcHM/LnBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIG93bmVyIE9wdGlvbmFsIGtleSBvd25lciB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSBzZWFyY2ggT3B0aW9uYWxseSBzZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgSUQgYW5kIG1ldGFkYXRhXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIga2V5cy5cbiAgICovXG4gIGtleXNMaXN0KFxuICAgIHR5cGU/OiBLZXlUeXBlLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBvd25lcj86IHN0cmluZyxcbiAgICBzZWFyY2g/OiBzdHJpbmcsXG4gICk6IFBhZ2luYXRvcjxMaXN0S2V5c1Jlc3BvbnNlLCBLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IGtleV90eXBlOiB0eXBlLCBrZXlfb3duZXI6IG93bmVyLCBzZWFyY2gsIC4uLnF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHJlY2VudCBoaXN0b3JpY2FsIGtleSB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5IGlkLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBoaXN0b3JpY2FsIHRyYW5zYWN0aW9ucy5cbiAgICovXG4gIGtleUhpc3Rvcnkoa2V5SWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RIaXN0b3JpY2FsVHhSZXNwb25zZSwgSGlzdG9yaWNhbFR4W10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vdHhcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAoKSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnR4cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHIENPTlRBQ1RTOiBjb250YWN0Q3JlYXRlLCBjb250YWN0R2V0LCBjb250YWN0c0xpc3QsIGNvbnRhY3REZWxldGUsIGNvbnRhY3RVcGRhdGUsIGNvbnRhY3RMb29rdXBCeUFkZHJlc3NcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb250YWN0IGluIHRoZSBvcmdhbml6YXRpb24td2lkZSBhZGRyZXNzIGJvb2suIFRoZVxuICAgKiB1c2VyIG1ha2luZyB0aGUgcmVxdWVzdCBpcyB0aGUgb3duZXIgb2YgdGhlIGNvbnRhY3QsIGdpdmluZyB0aGVtIGVkaXQgYWNjZXNzXG4gICAqIHRvIHRoZSBjb250YWN0IGFsb25nIHdpdGggdGhlIG9yZyBvd25lcnMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIGZvciB0aGUgbmV3IGNvbnRhY3QuXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBNZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuIEludGVuZGVkIGZvciB1c2UgYXMgYSBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCwgZGV0ZXJtaW5pbmcgd2hlbiBhbmQgd2hvIGNhbiBlZGl0IHRoaXMgY29udGFjdC5cbiAgICogQHBhcmFtIGxhYmVscyBUaGUgb3B0aW9uYWwgbGFiZWxzIGZvciB0aGUgY29udGFjdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGNyZWF0ZWQgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RDcmVhdGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFkZHJlc3Nlcz86IEFkZHJlc3NNYXAsXG4gICAgbWV0YWRhdGE/OiBKc29uVmFsdWUsXG4gICAgZWRpdFBvbGljeT86IEVkaXRQb2xpY3ksXG4gICAgbGFiZWxzPzogQ29udGFjdExhYmVsW10sXG4gICk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2NvbnRhY3RzXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgYWRkcmVzc2VzLFxuICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3ksXG4gICAgICAgIGxhYmVscyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvcGVydGllcyBvZiBhIENvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGlkIG9mIHRoZSBjb250YWN0IHlvdSB3YW50IHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyBUaGUgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RHZXQoY29udGFjdElkOiBzdHJpbmcpOiBQcm9taXNlPENvbnRhY3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy97Y29udGFjdF9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGNvbnRhY3RfaWQ6IGNvbnRhY3RJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgY29udGFjdHMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIG9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZ2V0dGluZyBldmVyeSBwYWdlLlxuICAgKiBAcGFyYW0gc2VhcmNoIFRoZSBvcHRpb25hbCBzZWFyY2ggcXVlcnkuIEVpdGhlciBgbGFiZWw6Li4uYCwgd2hpY2ggd2lsbFxuICAgKiByZXR1cm4gY29udGFjdHMgd2l0aCB0aGUgbGFiZWwgcHJvdmlkZWQgYWZ0ZXIgdGhlICc6Jzsgb3IgYW4gYWRkcmVzc1xuICAgKiBzZWFyY2gsIHdoZXJlIGFsbCByZXR1cm5lZCBjb250YWN0cyB3aWxsIGhhdmUgYW4gYWRkcmVzcyBzdGFydGluZyB3aXRoLCBvclxuICAgKiBlcXVhbGxpbmcsIHRoZSBnaXZlbiBzZWFyY2ggc3RyaW5nLlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBjb250YWN0cyBpbiB0aGUgb3JnLlxuICAgKi9cbiAgY29udGFjdHNMaXN0KFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBzZWFyY2g/OiBgbGFiZWw6JHtDb250YWN0TGFiZWx9YCB8IHN0cmluZyxcbiAgKTogUGFnaW5hdG9yPExpc3RDb250YWN0c1Jlc3BvbnNlLCBDb250YWN0SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0c1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IHNlYXJjaCwgLi4ucGFnZVF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLmNvbnRhY3RzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgY29udGFjdHMgaW4gdGhlIG9yZyB0aGF0IGhhdmUgdGhlIGdpdmVuIGFkZHJlc3MuXG4gICAqXG4gICAqIFdoZW4gcXVlcnlpbmcgd2l0aCBhbiBFVk0gYWRkcmVzcyB3aXRob3V0IGEgY2hhaW4sIHRoaXMgZW5kcG9pbnQgcmV0dXJuc1xuICAgKiBjb250YWN0cyB3aXRoIHRoYXQgYWRkcmVzcyBvbiAqYW55KiBFVk0gY2hhaW4sIGluY2x1ZGluZyB0aG9zZSB3aXRob3V0IGEgY2hhaW5cbiAgICogZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgYWxsIHJldHVybmVkIGNvbnRhY3RzIG11c3QgaGF2ZS5cbiAgICogQHJldHVybnMgQ29udGFjdHMgaW4gdGhlIG9yZyB3aXRoIHRoYXQgYWRkcmVzcy5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RMb29rdXBCeUFkZHJlc3MoYWRkcmVzczogQ29udGFjdEFkZHJlc3NEYXRhKTogUHJvbWlzZTxDb250YWN0SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy9ieS1hZGRyZXNzXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiAoYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keTogYWRkcmVzcyB9KSkuY29udGFjdHM7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgY29udGFjdCwgc3BlY2lmaWVkIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogT25seSB0aGUgY29udGFjdCBvd25lciBhbmQgb3JnIG93bmVycyBhcmUgYWxsb3dlZCB0byBkZWxldGUgY29udGFjdHMuXG4gICAqIEFkZGl0aW9uYWxseSwgdGhlIGNvbnRhY3QncyBlZGl0IHBvbGljeSAoaWYgc2V0KSBtdXN0IHBlcm1pdCB0aGUgZGVsZXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGNvbnRhY3QgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMgY29udGFjdERlbGV0ZShcbiAgICBjb250YWN0SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vY29udGFjdHMve2NvbnRhY3RfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgY29udGFjdF9pZDogY29udGFjdElkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGNvbnRhY3QgaW4gdGhlIG9yZ2FuaXphdGlvbi13aWRlIGFkZHJlc3MgYm9vay4gT25seVxuICAgKiB0aGUgY29udGFjdCBvd25lciBvciBhbiBvcmcgb3duZXIgY2FuIHVwZGF0ZSBjb250YWN0cy5cbiAgICpcbiAgICogVXBkYXRlcyB3aWxsIG92ZXJ3cml0ZSB0aGUgZXhpc3RpbmcgdmFsdWUgb2YgdGhlIGZpZWxkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBjb250YWN0IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIGZpZWxkcyB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIGNvbnRhY3QgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBjb250YWN0VXBkYXRlKFxuICAgIGNvbnRhY3RJZDogc3RyaW5nLFxuICAgIHJlcXVlc3Q6IFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8Q29udGFjdEluZm8+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy97Y29udGFjdF9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGNvbnRhY3RfaWQ6IGNvbnRhY3RJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcblxuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFUzogcm9sZUNyZWF0ZSwgcm9sZUdldCwgcm9sZUF0dGVzdCwgcm9sZVJlYWQsIHJvbGVVcGRhdGUsIHJvbGVEZWxldGUsIHJvbGVzTGlzdFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlQ3JlYXRlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBuYW1lID8geyBuYW1lIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YS5yb2xlX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaXRzIGlkIChvciBuYW1lKS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb2YgdGhlIHJvbGUgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVHZXQocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZXN0IHRvIHJvbGUgcHJvcGVydGllcy5cbiAgICpcbiAgICogVGhlIHJlc3BvbnNlIGlzIGEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIHJlcXVlc3RlZCByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IHBhcmFtZXRlcnM6XG4gICAqIEBwYXJhbSBxdWVyeS52ZXJib3NpdHkgUm9sZSBwcm9wZXJ0aWVzIHRvIGluY2x1ZGUgaW4gYW4gYXR0ZXN0YXRpb24uIERlZmF1bHRzIHRvIGJhc2ljIHJvbGUgcHJvcGVydGllcywgaW5jbHVkaW5nIGFzc29jaWF0ZWQgdXNlcnMsIGJ1dCBleGNsdWRpbmcgYXNzb2NpYXRlZCBrZXlzLlxuICAgKiBAcGFyYW0gcXVlcnkua2V5X2ZpbHRlciBGaWx0ZXIgZG93biB0byBhIHNpbmdsZSBhc3NvY2lhdGVkIGtleS4gRGVmYXVsdHMgdG8gaW5jbHVkaW5nIGFsbCBhc3NvY2lhdGVkIGtleXMuXG4gICAqIEByZXR1cm5zIEEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHJvbGUgcHJvcGVydGllcy4gVGhlIHR5cGUgb2YgdGhlIHJldHVybmVkIEpXVCBwYXlsb2FkIGlzIHtAbGluayBSb2xlQXR0ZXN0YXRpb25DbGFpbXN9LlxuICAgKi9cbiAgYXN5bmMgcm9sZUF0dGVzdChyb2xlSWQ6IHN0cmluZywgcXVlcnk/OiBSb2xlQXR0ZXN0YXRpb25RdWVyeSk6IFByb21pc2U8Um9sZUluZm9Kd3Q+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hdHRlc3RcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgcXVlcnksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIHVwZGF0ZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVwZGF0ZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICByZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFJvbGVJbmZvPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgcm9sZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIHJvbGVEZWxldGUocm9sZUlkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5IH0gfSksXG4gICAgICAocikgPT4gci5yb2xlcyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBLRVlTOiByb2xlS2V5c0FkZCwgcm9sZUtleXNEZWxldGUsIHJvbGVLZXlzTGlzdCwgcm9sZUtleUdldFxuXG4gIC8qKlxuICAgKiBBZGQgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWRzIFRoZSBJRHMgb2YgdGhlIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lclJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUtleXNBZGQoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAga2V5SWRzOiBzdHJpbmdbXSxcbiAgICBwb2xpY3k/OiBLZXlQb2xpY3ksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgICAgcG9saWN5LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG5cbiAgICByZXR1cm4gQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyUmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyByb2xlS2V5c1JlbW92ZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcblxuICAgIHJldHVybiBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwga2V5cyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIGtleXMgdG8gcmV0cmlldmUuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBrZXlzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZUtleXNMaXN0KHJvbGVJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgaW4gYSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgSUQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIGtleS5cbiAgICogQHJldHVybnMgVGhlIGtleSB3aXRoIHBvbGljaWVzIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcm9sZUtleUdldChcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG9wdHM/OiBHZXRSb2xlS2V5T3B0aW9ucyxcbiAgKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgIHF1ZXJ5OiBvcHRzLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlclJlbW92ZSwgcm9sZVVzZXJzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyQWRkKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIGFuIGVtcHR5IHJlc3BvbnNlLCBvciBhIHJlc3BvbnNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJSZW1vdmUocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIHVzZXJzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlVXNlcnNMaXN0KFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSwgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFBPTElDWTogcG9saWN5KENyZWF0ZXxHZXR8TGlzdHxVcGRhdGV8RGVsZXRlfEludm9rZXxTZWNyZXRzKVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIHBvbGljeSBydWxlcy5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgdGhlIG5ldyBwb2xpY3kncyBpbmZvLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5Q3JlYXRlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBQb2xpY3lUeXBlLFxuICAgIHJ1bGVzOiBLZXlQb2xpY3kgfCBSb2xlUG9saWN5IHwgeyBoYXNoOiBzdHJpbmcgfVtdLFxuICAgIGFjbD86IEpzb25WYWx1ZVtdLFxuICApOiBQcm9taXNlPFBvbGljeUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIHBvbGljeV90eXBlOiB0eXBlLFxuICAgICAgICBydWxlcyxcbiAgICAgICAgYWNsLFxuICAgICAgfSxcbiAgICB9KSkgYXMgUG9saWN5SW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBuYW1lZCBwb2xpY3kgYnkgaXRzIG5hbWUgb3IgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgbmFtZSBvciBpZCBvZiB0aGUgcG9saWN5IHRvIGdldC5cbiAgICogQHBhcmFtIHZlcnNpb24gVGhlIHBvbGljeSB2ZXJzaW9uIHRvIGdldC5cbiAgICogQHJldHVybnMgVGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIHBvbGljeUdldChwb2xpY3lJZDogc3RyaW5nLCB2ZXJzaW9uOiBwb2xpY3kuVmVyc2lvbik6IFByb21pc2U8UG9saWN5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcG9saWNpZXMve3BvbGljeV9pZH0ve3ZlcnNpb259XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHBvbGljeV9pZDogcG9saWN5SWQsIHZlcnNpb24gfSB9LFxuICAgIH0pKSBhcyBQb2xpY3lJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgYWxsIG5hbWVkIHBvbGljaWVzIGluIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcGFyYW0gcG9saWN5VHlwZSBUaGUgb3B0aW9uYWwgdHlwZSBvZiBwb2xpY2llcyB0byBmZXRjaC4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgYWxsIG5hbWVkIHBvbGljaWVzIHJlZ2FyZGxlc3Mgb2YgdHlwZS5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBwb2xpY2llcy5cbiAgICovXG4gIHBvbGljaWVzTGlzdChcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICAgcG9saWN5VHlwZT86IFBvbGljeVR5cGUsXG4gICk6IFBhZ2luYXRvcjxMaXN0UG9saWNpZXNSZXNwb25zZSwgUG9saWN5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9wb2xpY2llc1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChwYWdlUXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyBwb2xpY3lfdHlwZTogcG9saWN5VHlwZSwgLi4ucGFnZVF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnBvbGljaWVzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICkgYXMgUGFnaW5hdG9yPExpc3RQb2xpY2llc1Jlc3BvbnNlLCBQb2xpY3lJbmZvW10+O1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeUlkIFRoZSBuYW1lIG9yIGlkIG9mIHRoZSBwb2xpY3kgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgdXBkYXRlIHJlcXVlc3QuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBwb2xpY3kgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBwb2xpY3lVcGRhdGUoXG4gICAgcG9saWN5SWQ6IHN0cmluZyxcbiAgICByZXF1ZXN0OiBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UG9saWN5SW5mbz4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzL3twb2xpY3lfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHBvbGljeV9pZDogcG9saWN5SWQgfSB9LFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIChhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKFxuICAgICAgdGhpcy5lbnYsXG4gICAgICBzaWduRm4sXG4gICAgICBtZmFSZWNlaXB0LFxuICAgICkpIGFzIEN1YmVTaWduZXJSZXNwb25zZTxQb2xpY3lJbmZvPjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBuYW1lZCBwb2xpY3kuXG4gICAqXG4gICAqIEBwYXJhbSBwb2xpY3lJZCBUaGUgbmFtZSBvciBpZCBvZiB0aGUgcG9saWN5IHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5RGVsZXRlKFxuICAgIHBvbGljeUlkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzL3twb2xpY3lfaWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwb2xpY3lfaWQ6IHBvbGljeUlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEludm9rZSBhIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeUlkIFRoZSBuYW1lIG9yIGlkIG9mIHRoZSBwb2xpY3kgdG8gaW52b2tlLlxuICAgKiBAcGFyYW0gdmVyc2lvbiBUaGUgcG9saWN5IHZlcnNpb24gdG8gaW52b2tlLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgaW52b2tlIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSByZXN1bHQgb2YgaW52b2tpbmcgdGhlIHBvbGljeS5cbiAgICovXG4gIGFzeW5jIHBvbGljeUludm9rZShcbiAgICBwb2xpY3lJZDogc3RyaW5nLFxuICAgIHZlcnNpb246IHN0cmluZyxcbiAgICByZXF1ZXN0OiBJbnZva2VQb2xpY3lSZXF1ZXN0LFxuICApOiBQcm9taXNlPEludm9rZVBvbGljeVJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9wb2xpY2llcy97cG9saWN5X2lkfS97dmVyc2lvbn0vaW52b2tlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHBvbGljeV9pZDogcG9saWN5SWQsIHZlcnNpb24gfSB9LFxuICAgICAgYm9keTogcmVxdWVzdCxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFdBU006IHdhc20oUG9saWN5VXBsb2FkKVxuXG4gIC8qKlxuICAgKiBSZXF1ZXN0IGFuIHVwbG9hZCBVUkwgZm9yIHVwbG9hZGluZyBhIFdhc20gcG9saWN5IG9iamVjdC5cbiAgICpcbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIHBvbGljeSB1cGxvYWQgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlIGNvbnRhaW5pbmcgdGhlIFVSTCBmb3IgdXBsb2FkaW5nIHRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyB3YXNtUG9saWN5VXBsb2FkKHJlcXVlc3Q6IFVwbG9hZFdhc21Qb2xpY3lSZXF1ZXN0KTogUHJvbWlzZTxVcGxvYWRXYXNtUG9saWN5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljeS93YXNtXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTRVNTSU9OUzogc2Vzc2lvbihDcmVhdGV8Q3JlYXRlRm9yUm9sZXxSZWZyZXNofFJldm9rZXxMaXN0fEtleXNMaXN0KVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHVzZXIgc2Vzc2lvbiAobWFuYWdlbWVudCBhbmQvb3Igc2lnbmluZykuIFRoZSBsaWZldGltZSBvZlxuICAgKiB0aGUgbmV3IHNlc3Npb24gaXMgc2lsZW50bHkgdHJ1bmNhdGVkIHRvIHRoYXQgb2YgdGhlIGN1cnJlbnQgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIGxpZmV0aW1lcyBMaWZldGltZSBzZXR0aW5nc1xuICAgKiBAcmV0dXJucyBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGUoXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3BlczogU2NvcGVbXSxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBsaWZldGltZXMgPz89IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIHJldHVybiBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKHRoaXMuc2Vzc2lvbk1ldGEsIGRhdGEsIHtcbiAgICAgIHB1cnBvc2UsXG4gICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpIHdob3NlIGxpZmV0aW1lIHBvdGVudGlhbGx5XG4gICAqIGV4dGVuZHMgdGhlIGxpZmV0aW1lIG9mIHRoZSBjdXJyZW50IHNlc3Npb24uICBNRkEgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gcHVycG9zZSBUaGUgcHVycG9zZSBvZiB0aGUgc2Vzc2lvblxuICAgKiBAcGFyYW0gc2NvcGVzIFNlc3Npb24gc2NvcGVzLlxuICAgKiBAcGFyYW0gbGlmZXRpbWUgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZUV4dGVuZGVkKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM6IFNjb3BlW10sXG4gICAgbGlmZXRpbWU6IFNlc3Npb25MaWZldGltZSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNlc3Npb25EYXRhPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCByZXF1ZXN0Rm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgICAgc2NvcGVzLFxuICAgICAgICAgIGV4dGVuZF9saWZldGltZXM6IHRydWUsXG4gICAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWUuYXV0aCxcbiAgICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZS5yZWZyZXNoLFxuICAgICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lLnNlc3Npb24sXG4gICAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lLmdyYWNlLFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UocmVzcCwgKHNlc3Npb25JbmZvKSA9PlxuICAgICAgICBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvKHRoaXMuc2Vzc2lvbk1ldGEsIHNlc3Npb25JbmZvLCB7XG4gICAgICAgICAgcHVycG9zZSxcbiAgICAgICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICAgIH0pLFxuICAgICAgKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXF1ZXN0Rm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBzaWduZXIgc2Vzc2lvbiBmb3IgYSBnaXZlbiByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFJvbGUgSURcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy4gTm90IGFsbCBzY29wZXMgYXJlIHZhbGlkIGZvciBhIHJvbGUuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlRm9yUm9sZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzPzogU2NvcGVbXSxcbiAgICBsaWZldGltZXM/OiBTZXNzaW9uTGlmZXRpbWUsXG4gICk6IFByb21pc2U8U2Vzc2lvbkRhdGE+IHtcbiAgICBsaWZldGltZXMgPz89IGRlZmF1bHRTaWduZXJTZXNzaW9uTGlmZXRpbWU7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vdG9rZW5zXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIHB1cnBvc2UsXG4gICAgICAgIHNjb3BlcyxcbiAgICAgICAgYXV0aF9saWZldGltZTogbGlmZXRpbWVzLmF1dGgsXG4gICAgICAgIHJlZnJlc2hfbGlmZXRpbWU6IGxpZmV0aW1lcy5yZWZyZXNoLFxuICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZXMuc2Vzc2lvbixcbiAgICAgICAgZ3JhY2VfbGlmZXRpbWU6IGxpZmV0aW1lcy5ncmFjZSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICByb2xlX2lkOiByb2xlSWQsXG4gICAgICBvcmdfaWQ6IHRoaXMub3JnSWQsXG4gICAgICBwdXJwb3NlLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBzZXNzaW9uIGJ5IGlkLlxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbklkIFRoZSBJRCBvZiB0aGUgc2Vzc2lvbiB0byByZXRyaWV2ZS4gVGhpcyBzZXNzaW9uIGJ5IGRlZmF1bHRcbiAgICogQHJldHVybnMgUmVxdWVzdGVkIHNlc3Npb24gbWV0YWRhdGEuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uR2V0KHNlc3Npb25JZD86IHN0cmluZyk6IFByb21pc2U8U2Vzc2lvbkluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24ve3Nlc3Npb25faWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgc2Vzc2lvbl9pZDogc2Vzc2lvbklkID8/IFwic2VsZlwiIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXZva2UgYSBzZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbklkIFRoZSBJRCBvZiB0aGUgc2Vzc2lvbiB0byByZXZva2UuIFRoaXMgc2Vzc2lvbiBieSBkZWZhdWx0XG4gICAqL1xuICBhc3luYyBzZXNzaW9uUmV2b2tlKHNlc3Npb25JZD86IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvbi97c2Vzc2lvbl9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHNlc3Npb25faWQ6IHNlc3Npb25JZCA/PyBcInNlbGZcIiB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGFsbCBzZXNzaW9ucy5cbiAgICpcbiAgICogQHBhcmFtIHNlbGVjdG9yIFdoaWNoIHNlc3Npb25zIHRvIHJldm9rZS4gSWYgbm90IGRlZmluZWQsIGFsbCB0aGUgY3VycmVudCB1c2VyJ3Mgc2Vzc2lvbnMgd2lsbCBiZSByZXZva2VkLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvblJldm9rZUFsbChzZWxlY3Rvcj86IFNlc3Npb25TZWxlY3Rvcikge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcImRlbGV0ZVwiKTtcbiAgICBjb25zdCBxdWVyeSA9IHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIiA/IHsgcm9sZTogc2VsZWN0b3IgfSA6IHNlbGVjdG9yO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcXVlcnkgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgcGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBhbGwgc2lnbmVyIHNlc3Npb25zIG9wdGlvbmFsbHkgZmlsdGVyZWQgYnkgYSByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gc2VsZWN0b3IgSWYgc2V0LCBsaW1pdCB0byBzZXNzaW9ucyBmb3IgYSBzcGVjaWZpZWQgdXNlciBvciBhIHJvbGUuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBTaWduZXIgc2Vzc2lvbnMgZm9yIHRoaXMgcm9sZS5cbiAgICovXG4gIHNlc3Npb25zTGlzdChcbiAgICBzZWxlY3Rvcj86IFNlc3Npb25TZWxlY3RvcixcbiAgICBwYWdlPzogUGFnZU9wdHMsXG4gICk6IFBhZ2luYXRvcjxTZXNzaW9uc1Jlc3BvbnNlLCBTZXNzaW9uSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHNlbGVjdG9yUXVlcnkgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIgPyB7IHJvbGU6IHNlbGVjdG9yIH0gOiBzZWxlY3RvcjtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IC4uLnNlbGVjdG9yUXVlcnksIC4uLnF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnNlc3Npb25zLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgbGlzdCBvZiBrZXlzIHRoYXQgdGhpcyBzZXNzaW9uIGhhcyBhY2Nlc3MgdG8uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIGtleXMuXG4gICAqL1xuICBhc3luYyBzZXNzaW9uS2V5c0xpc3QoKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Rva2VuL2tleXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBrZXlzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBrZXlzO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gSURFTlRJVFk6IGlkZW50aXR5UHJvdmUsIGlkZW50aXR5VmVyaWZ5LCBpZGVudGl0eUFkZCwgaWRlbnRpdHlSZW1vdmUsIGlkZW50aXR5TGlzdFxuXG4gIC8qKlxuICAgKiBPYnRhaW4gcHJvb2Ygb2YgYXV0aGVudGljYXRpb24gdXNpbmcgdGhlIGN1cnJlbnQgQ3ViZVNpZ25lciBzZXNzaW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlQcm92ZSgpOiBQcm9taXNlPElkZW50aXR5UHJvb2Y+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5L3Byb3ZlXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLyoqXG4gICAqIENoZWNrcyBpZiBhIGdpdmVuIGlkZW50aXR5IHByb29mIGlzIHZhbGlkLlxuICAgKlxuICAgKiBAcGFyYW0gcHJvb2YgVGhlIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uLlxuICAgKiBAdGhyb3dzIEFuIGVycm9yIGlmIHByb29mIGlzIGludmFsaWRcbiAgICovXG4gIGFzeW5jIGlkZW50aXR5VmVyaWZ5KHByb29mOiBJZGVudGl0eVByb29mKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBwcm9vZixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBc3NvY2lhdGVzIGFuIE9JREMgaWRlbnRpdHkgd2l0aCB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keSwgY29udGFpbmluZyBhbiBPSURDIHRva2VuIHRvIHByb3ZlIHRoZSBpZGVudGl0eSBvd25lcnNoaXAuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEVtcHR5IG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBpZGVudGl0eUFkZChcbiAgICBib2R5OiBBZGRJZGVudGl0eVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCByZXFGbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHRoaXMuZXhlYyhvLCB7IGJvZHksIGhlYWRlcnMgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGFuIE9JREMgaWRlbnRpdHkgZnJvbSB0aGUgY3VycmVudCB1c2VyJ3MgYWNjb3VudC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgVGhlIGlkZW50aXR5IHRvIHJlbW92ZS5cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5UmVtb3ZlKGJvZHk6IE9pZGNJZGVudGl0eSkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHlcIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0cyBhc3NvY2lhdGVkIE9JREMgaWRlbnRpdGllcyB3aXRoIHRoZSBjdXJyZW50IHVzZXIuXG4gICAqXG4gICAqIEByZXR1cm5zIEFzc29jaWF0ZWQgaWRlbnRpdGllc1xuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlMaXN0KCk6IFByb21pc2U8TGlzdElkZW50aXR5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gTUZBOiBtZmFHZXQsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUxpc3QsIG1mYUFwcHJvdmUsIG1mYUFwcHJvdmVUb3RwLCBtZmFBcHByb3ZlRmlkbyhJbml0fENvbXBsZXRlKSwgbWZhVm90ZUVtYWlsKEluaXR8Q29tcGxldGUpXG5cbiAgLyoqXG4gICAqIFJldHJpZXZlcyBleGlzdGluZyBNRkEgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIE1GQSByZXF1ZXN0IElEXG4gICAqIEByZXR1cm5zIE1GQSByZXF1ZXN0IGluZm9ybWF0aW9uXG4gICAqL1xuICBhc3luYyBtZmFHZXQobWZhSWQ6IHN0cmluZyk6IFByb21pc2U8TWZhUmVxdWVzdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNRkEgcmVxdWVzdHMgYWNjZXNzaWJsZSB0byB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgTUZBIHJlcXVlc3RzLlxuICAgKi9cbiAgYXN5bmMgbWZhTGlzdCgpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYVwiLCBcImdldFwiKTtcblxuICAgIGNvbnN0IHsgbWZhX3JlcXVlc3RzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBtZmFfcmVxdWVzdHM7XG4gIH1cblxuICAvKipcbiAgICogQXBwcm92ZSBvciByZWplY3QgYSBwZW5kaW5nIE1GQSByZXF1ZXN0IHVzaW5nIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgaWQgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgcmVzdWx0IG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUNzKG1mYUlkOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyBUT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIElEIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0gY29kZSBUaGUgVE9UUCBjb2RlXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0XG4gICAqL1xuICBhc3luYyBtZmFWb3RlVG90cChtZmFJZDogc3RyaW5nLCBjb2RlOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vdG90cFwiLCBcInBhdGNoXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGFwcHJvdmFsIG9mIGFuIGV4aXN0aW5nIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uIEEgY2hhbGxlbmdlIGlzXG4gICAqIHJldHVybmVkIHdoaWNoIG11c3QgYmUgYW5zd2VyZWQgdmlhIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIG1mYVZvdGVGaWRvQ29tcGxldGV9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElELlxuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYUZpZG9Jbml0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYUZpZG9DaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9maWRvXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgTWZhRmlkb0NoYWxsZW5nZSh0aGlzLCBtZmFJZCwgY2hhbGxlbmdlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHByZXZpb3VzbHkgaW5pdGlhdGVkICh2aWEge0BsaW5rIG1mYUZpZG9Jbml0fSkgTUZBIHJlcXVlc3QgdXNpbmcgRklETy5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIGlzc3VlZCBieSB7QGxpbmsgbWZhRmlkb0luaXR9XG4gICAqIEBwYXJhbSBjcmVkZW50aWFsIFRoZSBhbnN3ZXIgdG8gdGhlIGNoYWxsZW5nZVxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUZpZG9Db21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIG1mYVZvdGU6IE1mYVZvdGUsXG4gICAgY2hhbGxlbmdlSWQ6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsOiBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICApOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCBcInBhdGNoXCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgICBib2R5OiB7XG4gICAgICAgIGNoYWxsZW5nZV9pZDogY2hhbGxlbmdlSWQsXG4gICAgICAgIGNyZWRlbnRpYWwsXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIE1GQSBhcHByb3ZhbCB2aWEgZW1haWwgT1RQLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBtZmFWb3RlIEFwcHJvdmUgb3IgcmVqZWN0IHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBBIGNoYWxsZW5nZSB0aGF0IG5lZWRzIHRvIGJlIGFuc3dlcmVkIHRvIGNvbXBsZXRlIHRoZSBhcHByb3ZhbC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVFbWFpbEluaXQobWZhSWQ6IHN0cmluZywgbWZhVm90ZTogTWZhVm90ZSk6IFByb21pc2U8TWZhRW1haWxDaGFsbGVuZ2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21mYS97bWZhX2lkfS9lbWFpbFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgY2hhbGxlbmdlID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgIH0pO1xuICAgIHJldHVybiBuZXcgTWZhRW1haWxDaGFsbGVuZ2UodGhpcywgbWZhSWQsIGNoYWxsZW5nZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayBtZmFWb3RlRW1haWxJbml0fSkgTUZBIHZvdGUgcmVxdWVzdCB1c2luZyBlbWFpbCBPVFAuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBNZmFFbWFpbENoYWxsZW5nZS5hbnN3ZXJ9IG9yXG4gICAqIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmNyZWF0ZUNyZWRlbnRpYWxBbmRBbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIE1GQSByZXF1ZXN0IElEXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIG1mYVZvdGVFbWFpbEluaXR9XG4gICAqIEBwYXJhbSBzaWduYXR1cmUgVGhlIG9uZS10aW1lIGNvZGUgKHNpZ25hdHVyZSBpbiB0aGlzIGNhc2UpIHNlbnQgdmlhIGVtYWlsXG4gICAqIEByZXR1cm5zIFRoZSBjdXJyZW50IHN0YXR1cyBvZiB0aGUgTUZBIHJlcXVlc3QuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRW1haWxDb21wbGV0ZShcbiAgICBtZmFJZDogc3RyaW5nLFxuICAgIHBhcnRpYWxUb2tlbjogc3RyaW5nLFxuICAgIHNpZ25hdHVyZTogc3RyaW5nLFxuICApOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZW1haWxcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSB9LFxuICAgICAgYm9keTogeyB0b2tlbjogYCR7cGFydGlhbFRva2VufSR7c2lnbmF0dXJlfWAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFNJR046IHNpZ25Fdm0sIHNpZ25FdGgyLCBzaWduU3Rha2UsIHNpZ25VbnN0YWtlLCBzaWduQXZhLCBzaWduU2VyaWFsaXplZEF2YSwgc2lnbkJsb2IsIHNpZ25CdGMsIHNpZ25UYXByb290LCBzaWduU29sYW5hLCBzaWduRW90cywgZW90c0NyZWF0ZU5vbmNlLCBzaWduTW1pLCBzaWduU3VpXG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRVZNIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25Fdm0oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdm1TaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV2bVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDEvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gRUlQLTE5MSB0eXBlZCBkYXRhLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93RWlwMTkxU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZSAob3IgTUZBIGFwcHJvdmFsIHJlcXVlc3QpLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVpcDE5MShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVpcDE5MVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RWlwMTkxT3I3MTJTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9ldm0vZWlwMTkxL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC03MTIgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDcxMlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXA3MTIoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFaXA3MTJTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZXZtL2VpcDcxMi9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB2YWxpZGF0aW9uIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbkV0aDIoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFdGgyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gZGVwb3NpdCAob3Igc3Rha2luZykgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN0YWtlKFxuICAgIHJlcTogRXRoMlN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJTdGFrZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MS9vcmcve29yZ19pZH0vZXRoMi9zdGFrZVwiLCBcInBvc3RcIik7XG4gICAgY29uc3Qgc2lnbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBFdGgyL0JlYWNvbi1jaGFpbiB1bnN0YWtlL2V4aXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25VbnN0YWtlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlVuc3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvdW5zdGFrZS97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEF2YWxhbmNoZSBQLSBvciBYLWNoYWluIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gdHggQXZhbGFuY2hlIG1lc3NhZ2UgKHRyYW5zYWN0aW9uKSB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25BdmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgdHg6IEF2YVR4LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QXZhU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXZhL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogPEF2YVNpZ25SZXF1ZXN0PntcbiAgICAgICAgICB0eDogdHggYXMgdW5rbm93bixcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBzZXJpYWxpemVkIEF2YWxhbmNoZSBDLSwgUC0sIG9yIFgtY2hhaW4gbWVzc2FnZS4gU2VlIFt0aGUgQXZhbGFuY2hlXG4gICAqIGRvY3VtZW50YXRpb25dKGh0dHBzOi8vZG9jcy5hdmF4Lm5ldHdvcmsvcmVmZXJlbmNlL3N0YW5kYXJkcy9zZXJpYWxpemF0aW9uLXByaW1pdGl2ZXMpXG4gICAqIGZvciB0aGUgc3BlY2lmaWNhdGlvbiBvZiB0aGUgc2VyaWFsaXphdGlvbiBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gYXZhQ2hhaW4gQXZhbGFuY2hlIGNoYWluXG4gICAqIEBwYXJhbSB0eCBIZXggZW5jb2RlZCB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduU2VyaWFsaXplZEF2YShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICBhdmFDaGFpbjogQXZhQ2hhaW4sXG4gICAgdHg6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2F2YS9zaWduL3thdmFfY2hhaW59L3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGF2YV9jaGFpbjogYXZhQ2hhaW4sIHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IDxBdmFTZXJpYWxpemVkVHhTaWduUmVxdWVzdD57XG4gICAgICAgICAgdHgsXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgcmF3IGJsb2IuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dSYXdCbG9iU2lnbmluZ1wiJyB7QGxpbmsgS2V5UG9saWN5fS4gVGhpcyBpcyBiZWNhdXNlXG4gICAqIHNpZ25pbmcgYXJiaXRyYXJ5IG1lc3NhZ2VzIGlzLCBpbiBnZW5lcmFsLCBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIGluc3RlYWRcbiAgICogcHJlZmVyIHR5cGVkIGVuZC1wb2ludHMgYXMgdXNlZCBieSwgZm9yIGV4YW1wbGUsIHtAbGluayBzaWduRXZtfSkuIEZvciBTZWNwMjU2azEga2V5cyxcbiAgICogZm9yIGV4YW1wbGUsIHlvdSAqKm11c3QqKiBjYWxsIHRoaXMgZnVuY3Rpb24gd2l0aCBhIG1lc3NhZ2UgdGhhdCBpcyAzMiBieXRlcyBsb25nIGFuZFxuICAgKiB0aGUgb3V0cHV0IG9mIGEgc2VjdXJlIGhhc2ggZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyBzaWduYXR1cmVzIHNlcmlhbGl6ZWQgYXM7XG4gICAqXG4gICAqIC0gRUNEU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBhcyBiaWctZW5kaWFuIHIgYW5kIHMgcGx1cyByZWNvdmVyeS1pZFxuICAgKiAgICBieXRlIHYsIHdoaWNoIGNhbiBpbiBnZW5lcmFsIHRha2UgYW55IG9mIHRoZSB2YWx1ZXMgMCwgMSwgMiwgb3IgMy5cbiAgICpcbiAgICogLSBFZERTQSBzaWduYXR1cmVzIGFyZSBzZXJpYWxpemVkIGluIHRoZSBzdGFuZGFyZCBmb3JtYXQuXG4gICAqXG4gICAqIC0gQkxTIHNpZ25hdHVyZXMgYXJlIG5vdCBzdXBwb3J0ZWQgb24gdGhlIGJsb2Itc2lnbiBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CbG9iKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmxvYlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmxvYlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2Jsb2Ivc2lnbi97a2V5X2lkfVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBrZXlfaWQgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5LmlkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQZXJmb3JtIGEgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2UuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgYFwiQWxsb3dEaWZmaWVIZWxsbWFuRXhjaGFuZ2VcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXNcbiAgICogYmVjYXVzZSBwZXJmb3JtaW5nIGFyYml0cmFyeSBEaWZmaWUtSGVsbG1hbiBleGNoYW5nZXMgaXMsIGluIGdlbmVyYWwsXG4gICAqIGRhbmdlcm91cyAoYW5kIHlvdSBzaG91bGQgb25seSB1c2UgdGhpcyBBUEkgaWYgeW91IGFyZSAxMDAlIHN1cmUgeW91XG4gICAqIGtub3cgd2hhdCB5b3UgYXJlIGRvaW5nISkuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgcmF3IHJlc3BvbnNlLiBJZiB0aGUgb3JpZ2luYWwgcmVxdWVzdCBpbmNsdWRlZFxuICAgKiBhIHB1YmxpYyBrZXkgZm9yIGVuY3J5cHRpb24sIHRoZSByZXNwb25zZSBjYW4gYmUgZGVjcnlwdGVkIHVzaW5nIHRoZVxuICAgKiBgZGlmZmllSGVsbG1hbkRlY3J5cHRgIGhlbHBlciBmdW5jdGlvbi4gT3RoZXJ3aXNlLCB0aGUgcmVzcG9uc2Ugd2lsbFxuICAgKiBjb250YWluIGJhc2U2NC1lbmNvZGVkIHNlcmlhbGl6ZWQgcHVibGljIGtleXMgaW4gYSBrZXktdHlwZS0tc3BlY2lmaWNcbiAgICogZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gdXNlIGZvciBEaWZmaWUtSGVsbG1hbiBleGNoYW5nZSAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBJRCkuXG4gICAqIEBwYXJhbSByZXEgVGhlIERpZmZpZS1IZWxsbWFuIHJlcXVlc3QgdG8gc2VuZC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgZGlmZmllSGVsbG1hbkV4Y2hhbmdlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRGlmZmllSGVsbG1hblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxEaWZmaWVIZWxsbWFuUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9kaWZmaWVfaGVsbG1hbi97a2V5X2lkfVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBrZXlfaWQgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5LmlkO1xuICAgIGNvbnN0IGRoRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkIH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGRoRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIHRyYW5zYWN0aW9uIGlucHV0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0YyhcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJ0Y1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJpdGNvaW4gQklQLTEzNyBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJ0Y01lc3NhZ2UoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCdGNNZXNzYWdlU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxCdGNNZXNzYWdlU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL21lc3NhZ2Uvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgVGFwcm9vdCB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25UYXByb290KFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VGFwcm9vdFNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy90YXByb290L3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFBTQlQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduUHNidChcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFBzYnRTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFBzYnRTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvcHNidC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlIGFuIEV4dHJhY3RhYmxlIE9uZS1UaW1lIFNpZ25hdHVyZVxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkVvdHMoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFb3RzU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogR2VuZXJhdGVzIGEgc2V0IG9mIEJhYnlsb24gRU9UUyBub25jZXMgZm9yIGEgc3BlY2lmaWVkIGNoYWluLWlkLCBzdGFydGluZyBhdCBhIHNwZWNpZmllZCBibG9jayBoZWlnaHQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgYW5kIGhvdyBtYW55IG5vbmNlcyB0byBjcmVhdGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgZW90c0NyZWF0ZU5vbmNlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRW90c0NyZWF0ZU5vbmNlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVvdHNDcmVhdGVOb25jZVJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9lb3RzL25vbmNlcy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiBzdGFraW5nIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS4gRm9yIGEgZGVwb3NpdCwgdGhpcyBjYW4gYmUgZWl0aGVyIGEgU2Vnd2l0IG9yIGEgVGFwcm9vdCBrZXkuIEZvciBhbnkgb3RoZXIgcmVxdWVzdCB0eXBlLCB0aGlzIGp1c3QgYmUgYSBUYXByb290IGtleS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25TdGFraW5nVHhuKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQmFieWxvblN0YWtpbmdSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmFieWxvblN0YWtpbmdSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vc3Rha2luZy97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQmFieWxvbiBzdGFraW5nIHJlZ2lzdHJhdGlvbiByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBUYXByb290IGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmFieWxvblJlZ2lzdHJhdGlvbihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJhYnlsb25SZWdpc3RyYXRpb25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QmFieWxvblJlZ2lzdHJhdGlvblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYmFieWxvbi9yZWdpc3RyYXRpb24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFNvbGFuYSBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNvbGFuYShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFNvbGFuYVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U29sYW5hU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc29sYW5hL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIE1NSSBwZW5kaW5nIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSBtZXNzYWdlIHRoZSBtZXNzYWdlIGluZm8uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IG9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyB0aGUgdXBkYXRlZCBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgc2lnbk1taShcbiAgICBtZXNzYWdlOiBQZW5kaW5nTWVzc2FnZUluZm8sXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQZW5kaW5nTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L21taS92My9tZXNzYWdlcy97bXNnX2lkfS9zaWduXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtZXNzYWdlLmlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogbWVzc2FnZSxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTVUkgdHJhbnNhY3Rpb24uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblN1aShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXF1ZXN0OiBTdWlTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFN1aVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3N1aS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBVU0VSIEVYUE9SVDogdXNlckV4cG9ydChJbml0LENvbXBsZXRlLExpc3QsRGVsZXRlKVxuICAvKipcbiAgICogTGlzdCBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0cy5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIE9wdGlvbmFsIGtleSBJRC4gSWYgc3VwcGxpZWQsIGxpc3QgdGhlIG91dHN0YW5kaW5nIHJlcXVlc3QgKGlmIGFueSkgb25seSBmb3IgdGhlIHNwZWNpZmllZCBrZXk7IG90aGVyd2lzZSwgbGlzdCBhbGwgb3V0c3RhbmRpbmcgcmVxdWVzdHMgZm9yIHRoZSBzcGVjaWZpZWQgdXNlci5cbiAgICogQHBhcmFtIHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGxpc3QgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJlc3VsdCBzZXQuXG4gICAqL1xuICB1c2VyRXhwb3J0TGlzdChcbiAgICBrZXlJZD86IHN0cmluZyxcbiAgICB1c2VySWQ/OiBzdHJpbmcsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8VXNlckV4cG9ydExpc3RSZXNwb25zZSwgVXNlckV4cG9ydEluaXRSZXNwb25zZVtdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICAgICAgLi4ucXVlcnksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIuZXhwb3J0X3JlcXVlc3RzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIG91dHN0YW5kaW5nIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGNvcnJlc3BvbmRpbmcgdG8gdGhlIHVzZXItZXhwb3J0IHJlcXVlc3QgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gdXNlcklkIE9wdGlvbmFsIHVzZXIgSUQuIElmIG9taXR0ZWQsIHVzZXMgdGhlIGN1cnJlbnQgdXNlcidzIElELiBPbmx5IG9yZyBvd25lcnMgY2FuIGRlbGV0ZSB1c2VyLWV4cG9ydCByZXF1ZXN0cyBmb3IgdXNlcnMgb3RoZXIgdGhhbiB0aGVtc2VsdmVzLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydERlbGV0ZShrZXlJZDogc3RyaW5nLCB1c2VySWQ/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcXVlcnk6IHtcbiAgICAgICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydEluaXQoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRJbml0UmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgaW5pdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGJvZHk6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgaW5pdEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wbGV0ZSBhIHVzZXItZXhwb3J0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5LWlkIGZvciB3aGljaCB0byBpbml0aWF0ZSBhbiBleHBvcnQuXG4gICAqIEBwYXJhbSBwdWJsaWNLZXkgVGhlIE5JU1QgUC0yNTYgcHVibGljIGtleSB0byB3aGljaCB0aGUgZXhwb3J0IHdpbGwgYmUgZW5jcnlwdGVkLiBUaGlzIHNob3VsZCBiZSB0aGUgYHB1YmxpY0tleWAgcHJvcGVydHkgb2YgYSB2YWx1ZSByZXR1cm5lZCBieSBgdXNlckV4cG9ydEtleWdlbmAuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyB1c2VyRXhwb3J0Q29tcGxldGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICBwdWJsaWNLZXk6IENyeXB0b0tleSxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFVzZXJFeHBvcnRDb21wbGV0ZVJlc3BvbnNlPj4ge1xuICAgIC8vIGJhc2U2NC1lbmNvZGUgdGhlIHB1YmxpYyBrZXlcbiAgICBjb25zdCBzdWJ0bGUgPSBhd2FpdCBsb2FkU3VidGxlQ3J5cHRvKCk7XG4gICAgY29uc3QgcHVibGljS2V5QjY0ID0gZW5jb2RlVG9CYXNlNjQoQnVmZmVyLmZyb20oYXdhaXQgc3VidGxlLmV4cG9ydEtleShcInJhd1wiLCBwdWJsaWNLZXkpKSk7XG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwicGF0Y2hcIik7XG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWSBJTVBPUlQ6IGNyZWF0ZUtleUltcG9ydEtleSwgaW1wb3J0S2V5c1xuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlJbXBvcnRLZXkoKTogUHJvbWlzZTxDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW1wb3J0X2tleVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbXBvcnRfa2V5XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNSVNDOiBoZWFydGJlYXQoKVxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2N1YmUzc2lnbmVyL2hlYXJ0YmVhdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNTUk6IG1taSgpLCBtbWlMaXN0KClcbiAgLyoqXG4gICAqIENhbGwgdGhlIE1NSSBKU09OIFJQQyBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZCBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIGxpc3Qgb2YgbWV0aG9kIHBhcmFtZXRlcnMuXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtbWkobWV0aG9kOiBNbWlKcnBjTWV0aG9kLCBwYXJhbXM6IEpzb25BcnJheSk6IFByb21pc2U8SnJwY1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL21taS92My9qc29uLXJwY1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIGlkOiAxLFxuICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgfTtcbiAgICBjb25zdCBmdW5jID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7IGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICBpZiAocmVzcC5lcnJvcikge1xuICAgICAgICBjb25zdCBkYXRhID0gcmVzcC5lcnJvci5kYXRhIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICAgIHRocm93IG5ldyBFcnJSZXNwb25zZSh7XG4gICAgICAgICAgbWVzc2FnZTogcmVzcC5lcnJvci5tZXNzYWdlLFxuICAgICAgICAgIGVycm9yQ29kZTogZGF0YT8uZXJyb3JfY29kZSxcbiAgICAgICAgICByZXF1ZXN0SWQ6IGRhdGE/LnJlcXVlc3RfaWQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZnVuYyk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGEgcHJvb2Ygb2YgdGhpcyBzZXNzaW9uJ3MgQ3ViZVNpZ25lciBpZGVudGl0eS5cbiAgICpcbiAgICogQHBhcmFtIGF1ZCBJbnRlbmRlZCBhdWRpZW5jZVxuICAgKiBAcmV0dXJucyBhIEpXVCB0aGF0IGNhbiBiZSB2YWxpZGF0ZWQgYWdhaW5zdCB0aGUgSldLUyBmcm9tIHtAbGluayBjdXN0b21lclByb29mSndrc1VybH0uXG4gICAqL1xuICBhc3luYyBnZXRDdXN0b21lclByb29mKGF1ZDogXCJtbWlcIiB8IFwiY3ViZS1wYXlcIiB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMubW1pKFwiY3VzdG9kaWFuX2dldEN1c3RvbWVyUHJvb2ZcIiwgW2F1ZF0pO1xuICAgIGNvbnN0IGp3dCA9IHJlc3AucmVzdWx0Py5qd3Q7XG4gICAgaWYgKCFqd3QgfHwgdHlwZW9mIGp3dCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc29sZS53YXJuKFwiVW5leHBlY3RlZCBnZXRDdXN0b21lclByb29mIHJlc3BvbnNlXCIsIHJlc3ApO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHR5cGUgSldUIGluY2x1ZGVkIGluIHRoZSBjdXN0b21lciBwcm9vZiByZXNwb25zZSBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIH1cbiAgICByZXR1cm4gand0O1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNTUkgbWVzc2FnZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHBlbmRpbmcgTU1JIG1lc3NhZ2VzLlxuICAgKi9cbiAgYXN5bmMgbW1pTGlzdCgpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBwZW5kaW5nX21lc3NhZ2VzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBwZW5kaW5nX21lc3NhZ2VzIGFzIFBlbmRpbmdNZXNzYWdlSW5mb1tdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTU1JIG1lc3NhZ2UgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgVGhlIElEIG9mIHRoZSBwZW5kaW5nIG1lc3NhZ2UuXG4gICAqIEByZXR1cm5zIFRoZSBwZW5kaW5nIE1NSSBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgbW1pR2V0KG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIE1NSSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgdGhlIElEIG9mIHRoZSBNTUkgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIG1taURlbGV0ZShtc2dJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtc2dJZCB9IH0gfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNTUkgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiBJRC5cbiAgICpcbiAgICogQHBhcmFtIG1zZ0lkIHRoZSBJRCBvZiB0aGUgTU1JIG1lc3NhZ2UuXG4gICAqIEByZXR1cm5zIFRoZSBtZXNzYWdlIHdpdGggdXBkYXRlZCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbW1pUmVqZWN0KG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9L3JlamVjdFwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIEpTT04gV2ViIEtleSBTZXQgKEpXS1MpIFVSTCB3aXRoIHRoZSBrZXlzIHVzZWQgZm9yIGtleS9yb2xlIGF0dGVzdGF0aW9ucyAoc2VlIHtAbGluayBrZXlBdHRlc3R9IGFuZCB7QGxpbmsgcm9sZUF0dGVzdH0pLlxuICAgKi9cbiAgYXR0ZXN0YXRpb25Kd2tzVXJsKCk6IFVSTCB7XG4gICAgY29uc3QgdXJsID0gXCIvdjAvYXR0ZXN0YXRpb24vLndlbGwta25vd24vandrcy5qc29uXCI7XG4gICAgb3AodXJsLCBcImdldFwiKTsgLy8ganVzdCB0byB0eXBlIGNoZWNrIHRoZSB1cmwgYWJvdmVcbiAgICByZXR1cm4gbmV3IFVSTChgJHt0aGlzLmVudi5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKX0ke3VybH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBKU09OIFdlYiBLZXkgU2V0IChKV0tTKSBVUkwgd2l0aCB0aGUga2V5cyB1c2VkIGZvciB2YWxpZGF0aW5nIEpXVHMgcmV0dXJuZWQgYnkgdGhlIHtAbGluayBjdXN0b21lclByb29mfSBtZXRob2QuXG4gICAqL1xuICBjdXN0b21lclByb29mSndrc1VybCgpOiBVUkwge1xuICAgIGNvbnN0IHVybCA9IFwiL3YwL21taS92My8ud2VsbC1rbm93bi9qd2tzLmpzb25cIjtcbiAgICBvcCh1cmwsIFwiZ2V0XCIpOyAvLyBqdXN0IHRvIHR5cGUgY2hlY2sgdGhlIHVybCBhYm92ZVxuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpfSR7dXJsfWApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHB1YmxpYyBvcmcgaW5mb3JtYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZyBpbnRvXG4gICAqIEByZXR1cm5zIFB1YmxpYyBvcmcgaW5mb3JtYXRpb25cbiAgICovXG4gIHN0YXRpYyBhc3luYyBwdWJsaWNPcmdJbmZvKGVudjogRW52SW50ZXJmYWNlLCBvcmdJZDogc3RyaW5nKTogUHJvbWlzZTxQdWJsaWNPcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbmZvXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIGEgSlNPTiBXZWIgS2V5IFNldCAoSldLUykgd2l0aCB0aGUga2V5cyB1c2VkIGZvciBrZXkgYXR0ZXN0YXRpb25zIChzZWUge0BsaW5rIGtleUF0dGVzdH0gYW5kIHtAbGluayByb2xlQXR0ZXN0fSkuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIEN1YmVTaWduZXIgZW52aXJvbm1lbnRcbiAgICogQHJldHVybnMgQSBKV0tTIHdpdGggdGhleSBrZXlzIHVzZWQgZm9yIGtleSBhdHRlc3RhdGlvbi5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBhdHRlc3RhdGlvbkp3a3MoZW52OiBFbnZJbnRlcmZhY2UpOiBQcm9taXNlPHNjaGVtYXNbXCJKd2tTZXRSZXNwb25zZVwiXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9hdHRlc3RhdGlvbi8ud2VsbC1rbm93bi9qd2tzLmpzb25cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT4gbyh7IGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290IH0pKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kcyBhbiBlbWFpbCB0byB0aGUgZ2l2ZW4gYWRkcmVzcyB3aXRoIGEgbGlzdCBvZiBvcmdzIHRoZSB1c2VyIGlzIGEgbWVtYmVyIG9mLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byB1c2VcbiAgICogQHBhcmFtIGVtYWlsIFRoZSB1c2VyJ3MgZW1haWxcbiAgICogQHJldHVybnMgRW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIHN0YXRpYyBhc3luYyBlbWFpbE15T3JncyhlbnY6IEVudkludGVyZmFjZSwgZW1haWw6IHN0cmluZykge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9lbWFpbC9vcmdzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBxdWVyeTogeyBlbWFpbCB9IH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50by5cbiAgICogQHBhcmFtIHRva2VuIFRoZSBPSURDIHRva2VuIHRvIGV4Y2hhbmdlXG4gICAqIEBwYXJhbSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgc2Vzc2lvbiBkZXNjcmlwdGlvbi5cbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gZGF0YS5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBvaWRjU2Vzc2lvbkNyZWF0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHRva2VuOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBBcnJheTxTY29wZT4sXG4gICAgbGlmZXRpbWVzPzogUmF0Y2hldENvbmZpZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICAgcHVycG9zZT86IHN0cmluZyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8U2Vzc2lvbkRhdGE+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGxvZ2luRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgICBvKHtcbiAgICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAuLi5oZWFkZXJzLFxuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogdG9rZW4sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICApLnRoZW4oYXNzZXJ0T2spO1xuXG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKHNlc3Npb25JbmZvKTogU2Vzc2lvbkRhdGEgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudjoge1xuICAgICAgICAgICAgW1wiRGV2LUN1YmVTaWduZXJTdGFja1wiXTogZW52LFxuICAgICAgICAgIH0sXG4gICAgICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgICAgICB0b2tlbjogc2Vzc2lvbkluZm8udG9rZW4sXG4gICAgICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbkluZm8ucmVmcmVzaF90b2tlbixcbiAgICAgICAgICBzZXNzaW9uX2V4cDogc2Vzc2lvbkluZm8uZXhwaXJhdGlvbixcbiAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gaW4gdmlhIG9pZGNcIixcbiAgICAgICAgICBzZXNzaW9uX2luZm86IHNlc3Npb25JbmZvLnNlc3Npb25faW5mbyxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShlbnYsIGxvZ2luRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGxvZ2luIHZpYSBTaWduLWluIFdpdGggRXRoZXJldW0gKFNJV0UpLlxuICAgKlxuICAgKiBUaGUgcmVzcG9uc2UgY29udGFpbnMgYSBjaGFsbGVuZ2Ugd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCAodmlhIHtAbGluayBzaXdlTG9naW5Db21wbGV0ZX0pXG4gICAqIHRvIG9idGFpbiBhbiBPSURDIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byB1c2VcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9naW4gdG9cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcmV0dXJucyBUaGUgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdmlhIHtAbGluayBzaXdlTG9naW5Db21wbGV0ZX1cbiAgICovXG4gIHN0YXRpYyBhc3luYyBzaXdlTG9naW5Jbml0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogc2NoZW1hc1tcIlNpd2VJbml0UmVxdWVzdFwiXSxcbiAgKTogUHJvbWlzZTxzY2hlbWFzW1wiU2l3ZUluaXRSZXNwb25zZVwiXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vb2lkYy9zaXdlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgbG9naW4gdmlhIFNpZ24taW4gV2l0aCBFdGhlcmV1bSAoU0lXRSkuXG4gICAqXG4gICAqIFRoZSBjaGFsbGVuZ2UgcmV0dXJuZWQgYnkge0BsaW5rIHNpd2VMb2dpbkluaXR9IHNob3VsZCBiZSBzaWduZWRcbiAgICogYW5kIHN1Ym1pdHRlZCB2aWEgdGhpcyBBUEkgY2FsbCB0byBvYnRhaW4gYW4gT0lEQyB0b2tlbiwgd2hpY2ggY2FuXG4gICAqIHRoZW4gYmUgdXNlZCB0byBsb2cgaW4gdmlhIHtAbGluayBvaWRjU2Vzc2lvbkNyZWF0ZX0uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIHVzZVxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2dpbiB0b1xuICAgKiBAcGFyYW0gYm9keSBUaGUgcmVxdWVzdCBib2R5XG4gICAqIEByZXR1cm5zIEFuIE9JREMgdG9rZW4gd2hpY2ggY2FuIGJlIHVzZWQgdG8gbG9nIGluIHZpYSBPSURDIChzZWUge0BsaW5rIG9pZGNTZXNzaW9uQ3JlYXRlfSlcbiAgICovXG4gIHN0YXRpYyBhc3luYyBzaXdlTG9naW5Db21wbGV0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IHNjaGVtYXNbXCJTaXdlQ29tcGxldGVSZXF1ZXN0XCJdLFxuICApOiBQcm9taXNlPHNjaGVtYXNbXCJTaXdlQ29tcGxldGVSZXNwb25zZVwiXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vb2lkYy9zaXdlXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIHRoZSBsb2dpbiB3aXRoIHBhc3NrZXkgZmxvdy5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIGJvZHkgVGhlIGxvZ2luIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIGNoYWxsZW5nZSB0aGF0IG11c3QgYmUgYW5zd2VyZWQgKHNlZSB7QGxpbmsgcGFzc2tleUxvZ2luQ29tcGxldGV9KSB0byBsb2cgaW4uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcGFzc2tleUxvZ2luSW5pdChcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBib2R5OiBMb2dpblJlcXVlc3QsXG4gICk6IFByb21pc2U8UGFzc2tleUxvZ2luQ2hhbGxlbmdlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL3Bhc3NrZXlcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIGJvZHksXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICAgIHJldHVybiBuZXcgUGFzc2tleUxvZ2luQ2hhbGxlbmdlKGVudiwgcmVzcCwgYm9keS5wdXJwb3NlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGxvZ2luIHdpdGggcGFzc2tleSBjaGFsbGVuZ2UgcmV0dXJuZWQgZnJvbSB7QGxpbmsgcGFzc2tleUxvZ2luSW5pdH0uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgZGVzY3JpcHRpdmUgc2Vzc2lvbiBwdXJwb3NlXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBwYXNza2V5TG9naW5Db21wbGV0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBib2R5OiBQYXNza2V5QXNzZXJ0QW5zd2VyLFxuICAgIHB1cnBvc2U/OiBzdHJpbmcgfCBudWxsLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL3Bhc3NrZXlcIiwgXCJwYXRjaFwiKTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgICByZXR1cm4ge1xuICAgICAgZW52OiB7XG4gICAgICAgIFtcIkRldi1DdWJlU2lnbmVyU3RhY2tcIl06IGVudixcbiAgICAgIH0sXG4gICAgICBvcmdfaWQ6IHJlc3Aub3JnX2lkISwgLy8gJ29yZ19pZCcgaXMgYWx3YXlzIHNldCBmcm9tIHRoaXMgZW5kcG9pbnRcbiAgICAgIHRva2VuOiByZXNwLnRva2VuLFxuICAgICAgcmVmcmVzaF90b2tlbjogcmVzcC5yZWZyZXNoX3Rva2VuLFxuICAgICAgc2Vzc2lvbl9leHA6IHJlc3AuZXhwaXJhdGlvbixcbiAgICAgIHB1cnBvc2U6IHB1cnBvc2UgPz8gXCJzaWduIGluIHZpYSBwYXNza2V5XCIsXG4gICAgICBzZXNzaW9uX2luZm86IHJlc3Auc2Vzc2lvbl9pbmZvLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQWNjZXB0IGFuIGludml0YXRpb24gdG8gam9pbiBhIEN1YmVTaWduZXIgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEFjY2VwdEludml0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEludml0YXRpb25BY2NlcHRSZXF1ZXN0LFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2ludml0YXRpb24vYWNjZXB0XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbmF1dGhlbnRpY2F0ZWQgZW5kcG9pbnQgZm9yIGF1dGhlbnRpY2F0aW5nIHdpdGggZW1haWwvcGFzc3dvcmQuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0gYm9keSBUaGUgcmVxdWVzdCBib2R5XG4gICAqIEByZXR1cm5zIFJldHVybnMgYW4gT0lEQyB0b2tlbiB3aGljaCBjYW4gYmUgdXNlZFxuICAgKiAgIHRvIGxvZyBpbiB2aWEgT0lEQyAoc2VlIHtAbGluayBvaWRjU2Vzc2lvbkNyZWF0ZX0pLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcEF1dGhlbnRpY2F0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIGJvZHk6IEF1dGhlbnRpY2F0aW9uUmVxdWVzdCxcbiAgKTogUHJvbWlzZTxBdXRoZW50aWNhdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvYXV0aGVudGljYXRlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciByZXF1ZXN0aW5nIHBhc3N3b3JkIHJlc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRoZSBwYXJ0aWFsIHRva2VuIChgJHtoZWFkZXJ9LiR7Y2xhaW1zfS5gKSB3aGlsZSB0aGUgc2lnbmF0dXJlIGlzIHNlbnQgdmlhIGVtYWlsLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRSZXF1ZXN0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gICk6IFByb21pc2U8RW1haWxPdHBSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRwL3Bhc3N3b3JkX3Jlc2V0XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciBjb25maXJtaW5nIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgcGFzc3dvcmQgcmVzZXQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIHBhc3N3b3JkUmVzZXRSZXF1ZXN0fVxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIFRoZSBvbmUtdGltZSBjb2RlIChzaWduYXR1cmUgaW4gdGhpcyBjYXNlKSBzZW50IHZpYSBlbWFpbFxuICAgKiBAcGFyYW0gbmV3UGFzc3dvcmQgVGhlIG5ldyBwYXNzd29yZFxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRDb25maXJtKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgcGFydGlhbFRva2VuOiBzdHJpbmcsXG4gICAgc2lnbmF0dXJlOiBzdHJpbmcsXG4gICAgbmV3UGFzc3dvcmQ6IHN0cmluZyxcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvcGFzc3dvcmRfcmVzZXRcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG9yZ19pZDogb3JnSWQgfSB9LFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0ke3NpZ25hdHVyZX1gLFxuICAgICAgICAgIG5ld19wYXNzd29yZDogbmV3UGFzc3dvcmQsXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgcHJvb2Ygb2YgYXV0aGVudGljYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIGlkIGluIHdoaWNoIHRvIGdlbmVyYXRlIHByb29mXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlblxuICAgKiBAcmV0dXJucyBQcm9vZiBvZiBhdXRoZW50aWNhdGlvblxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkZW50aXR5UHJvdmVPaWRjKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZS9vaWRjXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPYnRhaW4gYWxsIG9yZ2FuaXphdGlvbnMgYSB1c2VyIGlzIGEgbWVtYmVyIG9mXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSB0b2tlbiBUaGUgb2lkYyB0b2tlbiBpZGVudGlmeWluZyB0aGUgdXNlclxuICAgKiBAcmV0dXJucyBUaGUgb3JnYW5pemF0aW9uIHRoZSB1c2VyIGJlbG9uZ3MgdG9cbiAgICovXG4gIHN0YXRpYyBhc3luYyB1c2VyT3JncyhlbnY6IEVudkludGVyZmFjZSwgdG9rZW46IHN0cmluZyk6IFByb21pc2U8VXNlck9yZ3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC91c2VyL29yZ3NcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgIEF1dGhvcml6YXRpb246IHRva2VuLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gICAgKS50aGVuKGFzc2VydE9rKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybnMgVGhlIHByb2Nlc3NlZCB1c2VyIGluZm9cbiAgICovXG4gIHN0YXRpYyAjcHJvY2Vzc1VzZXJJbmZvKGluZm86IFVzZXJJbmZvKTogVXNlckluZm8ge1xuICAgIGlmIChpbmZvLmVtYWlsID09PSBFTUFJTF9OT1RfRk9VTkQpIHtcbiAgICAgIGluZm8uZW1haWwgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG4gIC8qKlxuICAgKiBQb3N0LXByb2Nlc3MgYSB7QGxpbmsgVXNlckluT3JnSW5mb30gcmVzcG9uc2UuIFBvc3QtcHJvY2Vzc2luZyBlbnN1cmVzIHRoYXQgdGhlIGVtYWlsIGZpZWxkIGZvclxuICAgKiB1c2VycyB3aXRob3V0IGFuIGVtYWlsIGlzIHNldCB0byBgbnVsbGAuXG4gICAqXG4gICAqIEBwYXJhbSBpbmZvIFRoZSBpbmZvIHRvIHBvc3QtcHJvY2Vzc1xuICAgKiBAcmV0dXJucyBUaGUgcHJvY2Vzc2VkIHVzZXIgaW5mb1xuICAgKi9cbiAgc3RhdGljICNwcm9jZXNzVXNlckluT3JnSW5mbyhpbmZvOiBVc2VySW5PcmdJbmZvKTogVXNlckluT3JnSW5mbyB7XG4gICAgaWYgKGluZm8uZW1haWwgPT09IEVNQUlMX05PVF9GT1VORCkge1xuICAgICAgaW5mby5lbWFpbCA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBpbmZvO1xuICB9XG5cbiAgLy8gI3JlZ2lvbiBBVVRIIE1JR1JBVElPTjogbWlncmF0ZShBZGR8UmVtb3ZlKUlkZW50aXRpZXNcblxuICAvKipcbiAgICogQXNzb2NpYXRlIE9JREMgaWRlbnRpdGllcyB3aXRoIGFyYml0cmFyeSB1c2VycyBpbiBvcmcuXG4gICAqXG4gICAqIDxiPk5PVEU8L2I+OiBUaGlzIG9wZXJhdGlvbiBpcyBhdmFpbGFibGUgb25seSB3aGlsZSB5b3VyIG9yZyBpcyBpblxuICAgKiBtaWdyYXRpb24gbW9kZSBhbmQgbm90IGNvbmZpZ3VyYWJsZS5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqIEBwYXJhbSBib2R5IFRoZSBpZGVudGl0aWVzIHRvIGFkZFxuICAgKiBAdGhyb3dzIE9uIHNlcnZlci1zaWRlIGVycm9yXG4gICAqIEByZXR1cm5zIE5vdGhpbmdcbiAgICovXG4gIGFzeW5jIG1pZ3JhdGVBZGRJZGVudGl0aWVzKGJvZHk6IHNjaGVtYXNbXCJNaWdyYXRlSWRlbnRpdHlSZXF1ZXN0XCJdKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdXRoX21pZ3JhdGlvbi9hZGRfaWRlbnRpdHlcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERpc3NvY2lhdGUgT0lEQyBpZGVudGl0aWVzIGZyb20gYXJiaXRyYXJ5IHVzZXJzIGluIG9yZ1xuICAgKlxuICAgKiA8Yj5OT1RFPC9iPjogVGhpcyBvcGVyYXRpb24gaXMgYXZhaWxhYmxlIG9ubHkgd2hpbGUgeW91ciBvcmcgaXMgaW5cbiAgICogbWlncmF0aW9uIG1vZGUgYW5kIG5vdCBjb25maWd1cmFibGUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gYm9keSBUaGUgaWRlbnRpdGllcyB0byByZW1vdmUuXG4gICAqIEB0aHJvd3MgT24gc2VydmVyLXNpZGUgZXJyb3JcbiAgICogQHJldHVybnMgTm90aGluZ1xuICAgKi9cbiAgYXN5bmMgbWlncmF0ZVJlbW92ZUlkZW50aXRpZXMoYm9keTogc2NoZW1hc1tcIk1pZ3JhdGVJZGVudGl0eVJlcXVlc3RcIl0pIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2F1dGhfbWlncmF0aW9uL3JlbW92ZV9pZGVudGl0eVwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7IGJvZHkgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGV4aXN0aW5nIHVzZXJzJyBwcm9maWxlcy4gQ3VycmVudGx5IHN1cHBvcnRzIG9ubHkgKHJlKXNldHRpbmcgZW1haWxzLlxuICAgKlxuICAgKiA8Yj5OT1RFPC9iPjogVGhpcyBvcGVyYXRpb24gaXMgYXZhaWxhYmxlIG9ubHkgd2hpbGUgeW91ciBvcmcgaXMgaW5cbiAgICogbWlncmF0aW9uIG1vZGUgYW5kIG5vdCBjb25maWd1cmFibGUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gYm9keSBUaGUgdXNlcnMgd2hvc2UgcHJvZmlsZXMgdG8gdXBkYXRlXG4gICAqIEByZXR1cm5zIE5vdGhpbmdcbiAgICovXG4gIGFzeW5jIG1pZ3JhdGVVc2VyUHJvZmlsZXMoYm9keTogc2NoZW1hc1tcIk1pZ3JhdGVVcGRhdGVVc2Vyc1JlcXVlc3RcIl0pIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2F1dGhfbWlncmF0aW9uL3VwZGF0ZV91c2Vyc1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7IGJvZHkgfSk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxufVxuXG5jb25zdCBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lOiBTZXNzaW9uTGlmZXRpbWUgPSB7XG4gIHNlc3Npb246IDYwNDgwMCwgLy8gMSB3ZWVrXG4gIGF1dGg6IDMwMCwgLy8gNSBtaW5cbiAgcmVmcmVzaDogODY0MDAsIC8vIDEgZGF5XG4gIGdyYWNlOiAzMCwgLy8gc2Vjb25kc1xufTtcbiJdfQ==