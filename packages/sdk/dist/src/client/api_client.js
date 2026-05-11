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
const audit_log_1 = require("../audit_log");
const mfa_1 = require("../mfa");
const response_1 = require("../response");
const paginator_1 = require("../paginator");
const user_export_1 = require("../user_export");
const index_1 = require("../index");
const fetch_1 = require("../fetch");
const base_client_1 = require("./base_client");
const retry_1 = require("../retry");
const passkey_1 = require("../passkey");
const openapi_fetch_1 = require("openapi-fetch");
/**
 * String returned by API when a user does not have an email address (for backwards compatibility)
 */
const EMAIL_NOT_FOUND = "email not found";
/**
 * An extension of BaseClient that adds specialized methods for api endpoints
 */
class ApiClient extends base_client_1.BaseClient {
    /**
     * Creates a **new** client using the same session manager but targeting a
     * different (child) organization.
     *
     * @param targetOrgId The ID of an organization that the new client should target
     * @returns A new client targeting a different org
     */
    withTargetOrg(targetOrgId) {
        return new _a(this.sessionMeta, this.sessionManager, targetOrgId, this.config);
    }
    /**
     * Creates a **new** client using with an updated {@link ClientConfig}.
     *
     * @param cfg Partial configuration to apply on top of the existing client
     * @returns A new client with the updated configuration
     */
    withConfig(cfg) {
        return new _a(this.sessionMeta, this.sessionManager, this.orgId, {
            ...this.config,
            ...cfg,
            headers: (0, openapi_fetch_1.mergeHeaders)(this.config.headers, cfg.headers),
        });
    }
    /**
     * Creates a **new** client with a preferred regional environment {@link env} to use.
     *
     * @param env Preferred environment to use.
     * @returns A new client with updated preferred environment.
     */
    withPreferredEnv(env) {
        return new _a(this.sessionMeta, this.sessionManager, this.orgId, {
            ...this.config,
            preferredEnv: env,
        });
    }
    /**
     * Creates a **new** client in which the current session will assume a given role.
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
     * @param headers Optional headers to set
     * @returns The partial OIDC token that must be combined with the signature in the email
     */
    static async initEmailOtpAuth(env, orgId, email, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/email-otp", "post");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: { email },
            headers,
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
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (query) => this.exec(o, { body, params: { query } }), (r) => r.entries.flatMap((entry) => {
            const result = audit_log_1.auditLogEntrySchema.safeParse(entry);
            return result.success ? [result.data] : [];
        }), (r) => r.last_evaluated_key);
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
        return await this.exec(o, {
            body: {
                name,
                policy_type: type,
                rules,
                acl,
            },
        }).then(index_1.coercePolicyInfo);
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
        return await this.exec(o, {
            params: { path: { policy_id: policyId, version } },
        }).then(index_1.coercePolicyInfo);
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
        const reqFn = async (headers) => this.exec(o, {
            params: { path: { policy_id: policyId } },
            body: request,
            headers,
        }).then((resp) => (0, response_1.mapResponse)(resp, index_1.coercePolicyInfo));
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
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
    // #region BUCKET: bucket(Get|List|Update)
    /**
     * List available meta information about all policy buckets in the org.
     *
     * @param page Pagination options. Defaults to fetching the entire result set.
     * @returns Paginator for iterating over policy buckets.
     */
    bucketsList(page) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policy/buckets", "get");
        return paginator_1.Paginator.items(page ?? paginator_1.Page.default(), (pageQuery) => this.exec(o, { params: { query: { ...pageQuery } } }), (r) => r.buckets, (r) => r.last_evaluated_key);
    }
    /**
     * Get the meta information of a policy KV store bucket.
     *
     * @param bucketName The name of the bucket to get
     * @returns The bucket information
     */
    async bucketGet(bucketName) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policy/buckets/{bucket_name}", "get");
        return await this.exec(o, {
            params: { path: { bucket_name: bucketName } },
        }).then(index_1.coerceBucketInfo);
    }
    /**
     * Set or update meta information for a policy KV store bucket.
     *
     * @param bucketName The name of the bucket to update.
     * @param request The update request
     * @param mfaReceipt Option MFA receipt(s)
     * @returns The updated bucket information
     */
    async bucketUpdate(bucketName, request, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/policy/buckets/{bucket_name}", "patch");
        const reqFn = async (headers) => this.exec(o, {
            params: { path: { bucket_name: bucketName } },
            body: request,
            headers,
        }).then((resp) => (0, response_1.mapResponse)(resp, index_1.coerceBucketInfo));
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
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
        const publicKeyB64 = (0, util_1.encodeToBase64)(await subtle.exportKey("raw", publicKey));
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
    // #region RPC
    /**
     * Send a JSON RPC request to the high-level API endpoint.
     *
     * @param body JSON RPC request body
     * @param mfaReceipt Optional MFA receipts
     * @returns Corresponding response
     */
    async rpc(body, mfaReceipt) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/rpc", "post");
        const reqFn = (headers) => this.exec(o, {
            headers,
            body: {
                jsonrpc: "2.0",
                ...body,
            },
        });
        return await response_1.CubeSignerResponse.create(this.env, reqFn, mfaReceipt);
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
     * @param headers Optional headers to set
     * @returns Empty response
     */
    static async emailMyOrgs(env, email, headers) {
        const o = (0, fetch_1.op)("/v0/email/orgs", "get");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { query: { email } },
            headers,
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
     * @param headers Additional headers to set
     * @returns The session data.
     */
    static async oidcSessionCreate(env, orgId, token, scopes, lifetimes, mfaReceipt, purpose, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc", "post");
        env = index_1.MultiRegionEnv.create(env);
        const loginFn = async (mfaHeaders) => {
            const data = await (0, retry_1.retryOn5XX)(() => o({
                baseUrl: env.primary.SignerApiRoot,
                params: { path: { org_id: orgId } },
                headers: (0, openapi_fetch_1.mergeHeaders)(headers, mfaHeaders, (0, base_client_1.authHeader)(token)),
                body: {
                    scopes,
                    purpose,
                    tokens: lifetimes,
                },
            })).then(fetch_1.assertOk);
            return (0, response_1.mapResponse)(data, (sessionInfo) => {
                return {
                    env: env.spec,
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
     * @param headers Optional headers to set
     * @returns The challenge that needs to be answered via {@link siweLoginComplete}
     */
    static async siweLoginInit(env, orgId, body, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/siwe", "post");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
            headers,
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
     * @param headers Optional headers to set
     * @returns An OIDC token which can be used to log in via OIDC (see {@link oidcSessionCreate})
     */
    static async siweLoginComplete(env, orgId, body, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/oidc/siwe", "patch");
        return await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
            headers,
        })).then(fetch_1.assertOk);
    }
    /**
     * Initiate the login with passkey flow.
     *
     * @param env The environment to log into
     * @param body The login request
     * @param headers Optional headers to set
     * @returns The challenge that must be answered (see {@link passkeyLoginComplete}) to log in.
     */
    static async passkeyLoginInit(env, body, headers) {
        const o = (0, fetch_1.op)("/v0/passkey", "post");
        const resp = await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            body,
            headers,
        })).then(fetch_1.assertOk);
        return new passkey_1.PasskeyLoginChallenge(env, resp, body.purpose);
    }
    /**
     * Answer the login with passkey challenge returned from {@link passkeyLoginInit}.
     *
     * @param env The environment to log into
     * @param body The request body
     * @param purpose Optional descriptive session purpose
     * @param headers Optional headers to set
     * @returns The session data
     */
    static async passkeyLoginComplete(env, body, purpose, headers) {
        const o = (0, fetch_1.op)("/v0/passkey", "patch");
        env = index_1.MultiRegionEnv.create(env);
        const resp = await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.primary.SignerApiRoot,
            body,
            headers,
        })).then(fetch_1.assertOk);
        return {
            env: env.spec,
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
     * @param headers Optional headers to set
     */
    static async idpAcceptInvite(env, orgId, body, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/invitation/accept", "post");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
            headers,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for authenticating with email/password.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @param headers Optional headers to set
     * @returns Returns an OIDC token which can be used
     *   to log in via OIDC (see {@link oidcSessionCreate}).
     */
    static async idpAuthenticate(env, orgId, body, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/authenticate", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
            headers,
        })).then(fetch_1.assertOk);
    }
    /**
     * Unauthenticated endpoint for requesting password reset.
     *
     * @param env The environment to log into
     * @param orgId The id of the organization
     * @param body The request body
     * @param headers Optional headers to set
     * @returns Returns the partial token (`${header}.${claims}.`) while the signature is sent via email.
     */
    static async idpPasswordResetRequest(env, orgId, body, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body,
            headers,
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
     * @param headers Optional headers to set
     */
    static async idpPasswordResetConfirm(env, orgId, partialToken, signature, newPassword, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/idp/password_reset", "patch");
        await (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            body: {
                token: `${partialToken}${signature}`,
                new_password: newPassword,
            },
            headers,
        })).then(fetch_1.assertOk);
    }
    /**
     * Exchange an OIDC token for a proof of authentication.
     *
     * @param env The environment to log into
     * @param orgId The org id in which to generate proof
     * @param token The oidc token
     * @param headers Optional headers to set
     * @returns Proof of authentication
     */
    static async identityProveOidc(env, orgId, token, headers) {
        const o = (0, fetch_1.op)("/v0/org/{org_id}/identity/prove/oidc", "post");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            params: { path: { org_id: orgId } },
            headers: (0, openapi_fetch_1.mergeHeaders)(headers, (0, base_client_1.authHeader)(token)),
        })).then(fetch_1.assertOk);
    }
    /**
     * Obtain all organizations a user is a member of
     *
     * @param env The environment to log into
     * @param token The oidc token identifying the user
     * @param headers Optional headers to set
     * @returns The organization the user belongs to
     */
    static async userOrgs(env, token, headers) {
        const o = (0, fetch_1.op)("/v0/user/orgs", "get");
        return (0, retry_1.retryOn5XX)(() => o({
            baseUrl: env.SignerApiRoot,
            headers: (0, openapi_fetch_1.mergeHeaders)(headers, (0, base_client_1.authHeader)(token)),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBpX2NsaWVudC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jbGllbnQvYXBpX2NsaWVudC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUF5RUEsa0NBQXlDO0FBQ3pDLDRDQUFtRDtBQUNuRCxnQ0FNZ0I7QUFDaEIsMENBQThEO0FBRzlELDRDQUErQztBQUUvQyxnREFBa0Q7QUFFbEQsb0NBeUVrQjtBQUNsQixvQ0FBMkU7QUFDM0UsK0NBS3VCO0FBQ3ZCLG9DQUFzQztBQUN0Qyx3Q0FBbUQ7QUFLbkQsaURBQTZDO0FBRTdDOztHQUVHO0FBQ0gsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLENBQUM7QUFxQjFDOztHQUVHO0FBQ0gsTUFBYSxTQUFVLFNBQVEsd0JBQVU7SUFDdkM7Ozs7OztPQU1HO0lBQ0gsYUFBYSxDQUFDLFdBQW1CO1FBQy9CLE9BQU8sSUFBSSxFQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7SUFDeEYsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsVUFBVSxDQUFDLEdBQTBCO1FBQ25DLE9BQU8sSUFBSSxFQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDdEUsR0FBRyxJQUFJLENBQUMsTUFBTTtZQUNkLEdBQUcsR0FBRztZQUNOLE9BQU8sRUFBRSxJQUFBLDRCQUFZLEVBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQztTQUN4RCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxnQkFBZ0IsQ0FBQyxHQUE2QjtRQUM1QyxPQUFPLElBQUksRUFBUyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLGNBQWMsRUFBRSxJQUFJLENB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UTtJQUN4QixLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVU7Q0FDdEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHtcbiAgQ3JlYXRlT2lkY1VzZXJPcHRpb25zLFxuICBJZGVudGl0eVByb29mLFxuICBLZXlJblJvbGVJbmZvLFxuICBLZXlJbmZvLFxuICBPaWRjSWRlbnRpdHksXG4gIFB1YmxpY0tleUNyZWRlbnRpYWwsXG4gIFJvbGVJbmZvLFxuICBVcGRhdGVLZXlSZXF1ZXN0LFxuICBVcGRhdGVPcmdSZXF1ZXN0LFxuICBVcGRhdGVPcmdSZXNwb25zZSxcbiAgVXBkYXRlUm9sZVJlcXVlc3QsXG4gIFVzZXJJbk9yZ0luZm8sXG4gIFVzZXJJblJvbGVJbmZvLFxuICBHZXRVc2Vyc0luT3JnUmVzcG9uc2UsXG4gIFVzZXJJbmZvLFxuICBTZXNzaW9uSW5mbyxcbiAgT3JnSW5mbyxcbiAgRWlwMTkxU2lnblJlcXVlc3QsXG4gIEVpcDcxMlNpZ25SZXF1ZXN0LFxuICBFaXAxOTFPcjcxMlNpZ25SZXNwb25zZSxcbiAgRXZtU2lnblJlcXVlc3QsXG4gIEV2bVNpZ25SZXNwb25zZSxcbiAgRXRoMlNpZ25SZXF1ZXN0LFxuICBFdGgyU2lnblJlc3BvbnNlLFxuICBFdGgyU3Rha2VSZXF1ZXN0LFxuICBFdGgyU3Rha2VSZXNwb25zZSxcbiAgRXRoMlVuc3Rha2VSZXF1ZXN0LFxuICBFdGgyVW5zdGFrZVJlc3BvbnNlLFxuICBCbG9iU2lnblJlcXVlc3QsXG4gIEJsb2JTaWduUmVzcG9uc2UsXG4gIEJ0Y1NpZ25SZXNwb25zZSxcbiAgQnRjU2lnblJlcXVlc3QsXG4gIEJ0Y01lc3NhZ2VTaWduUmVzcG9uc2UsXG4gIEJ0Y01lc3NhZ2VTaWduUmVxdWVzdCxcbiAgUHNidFNpZ25SZXF1ZXN0LFxuICBQc2J0U2lnblJlc3BvbnNlLFxuICBTb2xhbmFTaWduUmVxdWVzdCxcbiAgU29sYW5hU2lnblJlc3BvbnNlLFxuICBBdmFTaWduUmVzcG9uc2UsXG4gIEF2YVNpZ25SZXF1ZXN0LFxuICBBdmFTZXJpYWxpemVkVHhTaWduUmVxdWVzdCxcbiAgQXZhVHgsXG4gIE1mYVJlcXVlc3RJbmZvLFxuICBNZmFWb3RlLFxuICBNZW1iZXJSb2xlLFxuICBVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZSxcbiAgVXNlckV4cG9ydEluaXRSZXNwb25zZSxcbiAgVXNlckV4cG9ydExpc3RSZXNwb25zZSxcbiAgRW1wdHksXG4gIFVzZXJPcmdzUmVzcG9uc2UsXG4gIENyZWF0ZUtleUltcG9ydEtleVJlc3BvbnNlLFxuICBJbXBvcnRLZXlSZXF1ZXN0LFxuICBVcGRhdGVQb2xpY3lSZXF1ZXN0LFxuICBMaXN0UG9saWNpZXNSZXNwb25zZSxcbiAgUG9saWN5VHlwZSxcbiAgRGlmZmllSGVsbG1hblJlcXVlc3QsXG4gIERpZmZpZUhlbGxtYW5SZXNwb25zZSxcbiAgS2V5SW5mb0p3dCxcbiAgQ29udGFjdExhYmVsLFxuICBDb250YWN0QWRkcmVzc0RhdGEsXG4gIEF1ZGl0TG9nUmVxdWVzdCxcbiAgQXVkaXRMb2dSZXNwb25zZSxcbiAgQXVkaXRMb2dFbnRyeSxcbiAgUm9sZUluZm9Kd3QsXG4gIEtleUF0dGVzdGF0aW9uUXVlcnksXG4gIFJvbGVBdHRlc3RhdGlvblF1ZXJ5LFxuICBFcnJvclJlc3BvbnNlLFxuICBMaXN0QnVja2V0c1Jlc3BvbnNlLFxuICBVcGRhdGVCdWNrZXRSZXF1ZXN0LFxuICBQb2xpY3lJbmZvLFxuICBKc29uUnBjUmVxdWVzdCxcbn0gZnJvbSBcIi4uL3NjaGVtYV90eXBlc1wiO1xuaW1wb3J0IHsgZW5jb2RlVG9CYXNlNjQgfSBmcm9tIFwiLi4vdXRpbFwiO1xuaW1wb3J0IHsgYXVkaXRMb2dFbnRyeVNjaGVtYSB9IGZyb20gXCIuLi9hdWRpdF9sb2dcIjtcbmltcG9ydCB7XG4gIEFkZEZpZG9DaGFsbGVuZ2UsXG4gIE1mYUZpZG9DaGFsbGVuZ2UsXG4gIE1mYUVtYWlsQ2hhbGxlbmdlLFxuICBUb3RwQ2hhbGxlbmdlLFxuICBSZXNldEVtYWlsQ2hhbGxlbmdlLFxufSBmcm9tIFwiLi4vbWZhXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyUmVzcG9uc2UsIG1hcFJlc3BvbnNlIH0gZnJvbSBcIi4uL3Jlc3BvbnNlXCI7XG5pbXBvcnQgdHlwZSB7IEtleSwgS2V5VHlwZSB9IGZyb20gXCIuLi9rZXlcIjtcbmltcG9ydCB0eXBlIHsgUGFnZU9wdHMgfSBmcm9tIFwiLi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgeyBQYWdlLCBQYWdpbmF0b3IgfSBmcm9tIFwiLi4vcGFnaW5hdG9yXCI7XG5pbXBvcnQgdHlwZSB7IEtleVBvbGljeSB9IGZyb20gXCIuLi9yb2xlXCI7XG5pbXBvcnQgeyBsb2FkU3VidGxlQ3J5cHRvIH0gZnJvbSBcIi4uL3VzZXJfZXhwb3J0XCI7XG5pbXBvcnQgdHlwZSAqIGFzIHBvbGljeSBmcm9tIFwiLi4vcG9saWN5XCI7XG5pbXBvcnQge1xuICB0eXBlIEFkZElkZW50aXR5UmVxdWVzdCxcbiAgdHlwZSBBdmFDaGFpbixcbiAgdHlwZSBFbnZJbnRlcmZhY2UsXG4gIHR5cGUgRW90c0NyZWF0ZU5vbmNlUmVxdWVzdCxcbiAgdHlwZSBFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZSxcbiAgdHlwZSBFb3RzU2lnblJlcXVlc3QsXG4gIHR5cGUgRW90c1NpZ25SZXNwb25zZSxcbiAgdHlwZSBKcnBjUmVzcG9uc2UsXG4gIHR5cGUgSnNvbkFycmF5LFxuICB0eXBlIExpc3RJZGVudGl0eVJlc3BvbnNlLFxuICB0eXBlIExpc3RLZXlSb2xlc1Jlc3BvbnNlLFxuICB0eXBlIExpc3RLZXlzUmVzcG9uc2UsXG4gIHR5cGUgTGlzdFJvbGVLZXlzUmVzcG9uc2UsXG4gIHR5cGUgTGlzdFJvbGVVc2Vyc1Jlc3BvbnNlLFxuICB0eXBlIExpc3RSb2xlc1Jlc3BvbnNlLFxuICB0eXBlIE1taUpycGNNZXRob2QsXG4gIHR5cGUgUGVuZGluZ01lc3NhZ2VJbmZvLFxuICB0eXBlIFBlbmRpbmdNZXNzYWdlU2lnblJlc3BvbnNlLFxuICB0eXBlIFJhdGNoZXRDb25maWcsXG4gIHR5cGUgU2NvcGUsXG4gIHR5cGUgU2Vzc2lvbkRhdGEsXG4gIHR5cGUgU2Vzc2lvbkxpZmV0aW1lLFxuICB0eXBlIFNlc3Npb25zUmVzcG9uc2UsXG4gIHR5cGUgVGFwcm9vdFNpZ25SZXF1ZXN0LFxuICB0eXBlIFRhcHJvb3RTaWduUmVzcG9uc2UsXG4gIHR5cGUgQmFieWxvblJlZ2lzdHJhdGlvblJlcXVlc3QsXG4gIHR5cGUgQmFieWxvblJlZ2lzdHJhdGlvblJlc3BvbnNlLFxuICB0eXBlIEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgdHlwZSBCYWJ5bG9uU3Rha2luZ1Jlc3BvbnNlLFxuICB0eXBlIFVwZGF0ZVVzZXJNZW1iZXJzaGlwUmVxdWVzdCxcbiAgdHlwZSBIaXN0b3JpY2FsVHgsXG4gIHR5cGUgTGlzdEhpc3RvcmljYWxUeFJlc3BvbnNlLFxuICB0eXBlIFB1YmxpY09yZ0luZm8sXG4gIHR5cGUgSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgdHlwZSBQYXNzd29yZFJlc2V0UmVxdWVzdCxcbiAgdHlwZSBFbWFpbE90cFJlc3BvbnNlLFxuICB0eXBlIEF1dGhlbnRpY2F0aW9uUmVxdWVzdCxcbiAgdHlwZSBBdXRoZW50aWNhdGlvblJlc3BvbnNlLFxuICB0eXBlIENyZWF0ZUtleVByb3BlcnRpZXMsXG4gIHR5cGUgSW52aXRhdGlvbkFjY2VwdFJlcXVlc3QsXG4gIHR5cGUgTWZhUmVjZWlwdHMsXG4gIHR5cGUgU3VpU2lnblJlcXVlc3QsXG4gIHR5cGUgU3VpU2lnblJlc3BvbnNlLFxuICB0eXBlIFF1ZXJ5TWV0cmljc1JlcXVlc3QsXG4gIHR5cGUgUXVlcnlNZXRyaWNzUmVzcG9uc2UsXG4gIHR5cGUgQ3JlYXRlT3JnUmVxdWVzdCxcbiAgdHlwZSBLZXlUeXBlQW5kRGVyaXZhdGlvblBhdGgsXG4gIHR5cGUgRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gIHR5cGUgQ29udGFjdEluZm8sXG4gIHR5cGUgTGlzdENvbnRhY3RzUmVzcG9uc2UsXG4gIHR5cGUgSnNvblZhbHVlLFxuICB0eXBlIEVkaXRQb2xpY3ksXG4gIHR5cGUgVXBkYXRlQ29udGFjdFJlcXVlc3QsXG4gIHR5cGUgQWRkcmVzc01hcCxcbiAgdHlwZSBSb2xlUG9saWN5LFxuICB0eXBlIEludm9rZVBvbGljeVJlc3BvbnNlLFxuICB0eXBlIEludm9rZVBvbGljeVJlcXVlc3QsXG4gIHR5cGUgVXBsb2FkV2FzbVBvbGljeVJlcXVlc3QsXG4gIHR5cGUgVXBsb2FkV2FzbVBvbGljeVJlc3BvbnNlLFxuICB0eXBlIExvZ2luUmVxdWVzdCxcbiAgdHlwZSBQYXNza2V5QXNzZXJ0QW5zd2VyLFxuICB0eXBlIHNjaGVtYXMsXG4gIHR5cGUgS2V5V2l0aFBvbGljaWVzSW5mbyxcbiAgdHlwZSBHZXRSb2xlS2V5T3B0aW9ucyxcbiAgdHlwZSBHZXRVc2VyQnlFbWFpbFJlc3BvbnNlLFxuICB0eXBlIEdldFVzZXJCeU9pZGNSZXNwb25zZSxcbiAgdHlwZSBFbWFpbFRlbXBsYXRlUHVycG9zZSxcbiAgRXJyUmVzcG9uc2UsXG4gIGNvZXJjZUJ1Y2tldEluZm8sXG4gIGNvZXJjZVBvbGljeUluZm8sXG4gIHR5cGUgQnVja2V0SW5mbyxcbiAgTXVsdGlSZWdpb25FbnYsXG59IGZyb20gXCIuLi9pbmRleFwiO1xuaW1wb3J0IHsgYXNzZXJ0T2ssIG9wLCB0eXBlIE9wLCB0eXBlIE9wZXJhdGlvbiwgYXBpRmV0Y2ggfSBmcm9tIFwiLi4vZmV0Y2hcIjtcbmltcG9ydCB7XG4gIGF1dGhIZWFkZXIsXG4gIEJhc2VDbGllbnQsXG4gIHR5cGUgQ2xpZW50Q29uZmlnLFxuICBzaWduZXJTZXNzaW9uRnJvbVNlc3Npb25JbmZvLFxufSBmcm9tIFwiLi9iYXNlX2NsaWVudFwiO1xuaW1wb3J0IHsgcmV0cnlPbjVYWCB9IGZyb20gXCIuLi9yZXRyeVwiO1xuaW1wb3J0IHsgUGFzc2tleUxvZ2luQ2hhbGxlbmdlIH0gZnJvbSBcIi4uL3Bhc3NrZXlcIjtcblxuLy8gdGhlc2UgdHlwZXMgYXJlIHVzZWQgaW4gZG9jIGNvbW1lbnRzIG9ubHlcbi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbmltcG9ydCB0eXBlIHsgUm9sZUF0dGVzdGF0aW9uQ2xhaW1zLCBLZXlBdHRlc3RhdGlvbkNsYWltcyB9IGZyb20gXCIuLi9zY2hlbWFfdHlwZXNcIjtcbmltcG9ydCB7IG1lcmdlSGVhZGVycyB9IGZyb20gXCJvcGVuYXBpLWZldGNoXCI7XG5cbi8qKlxuICogU3RyaW5nIHJldHVybmVkIGJ5IEFQSSB3aGVuIGEgdXNlciBkb2VzIG5vdCBoYXZlIGFuIGVtYWlsIGFkZHJlc3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSlcbiAqL1xuY29uc3QgRU1BSUxfTk9UX0ZPVU5EID0gXCJlbWFpbCBub3QgZm91bmRcIjtcblxuLyoqXG4gKiBTZXNzaW9uIHNlbGVjdG9yLlxuICovXG5leHBvcnQgdHlwZSBTZXNzaW9uU2VsZWN0b3IgPVxuICAvKipcbiAgICogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHJvbGUgd2l0aCB0aGlzIElEXG4gICAqXG4gICAqIEBkZXByZWNhdGVkIFVzZSBgeyByb2xlOiBzdHJpbmcgfWAgaW5zdGVhZFxuICAgKi9cbiAgfCBzdHJpbmdcbiAgfCB7XG4gICAgICAvKiogU2VsZWN0cyBhbGwgc2Vzc2lvbnMgdGllZCB0byBhIHJvbGUgd2l0aCB0aGlzIElEICovXG4gICAgICByb2xlOiBzdHJpbmc7XG4gICAgfVxuICB8IHtcbiAgICAgIC8qKiBTZWxlY3RzIGFsbCBzZXNzaW9ucyB0aWVkIHRvIGEgdXNlciB3aXRoIHRoaXMgSUQuICovXG4gICAgICB1c2VyOiBzdHJpbmc7XG4gICAgfTtcblxuLyoqXG4gKiBBbiBleHRlbnNpb24gb2YgQmFzZUNsaWVudCB0aGF0IGFkZHMgc3BlY2lhbGl6ZWQgbWV0aG9kcyBmb3IgYXBpIGVuZHBvaW50c1xuICovXG5leHBvcnQgY2xhc3MgQXBpQ2xpZW50IGV4dGVuZHMgQmFzZUNsaWVudCB7XG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgKipuZXcqKiBjbGllbnQgdXNpbmcgdGhlIHNhbWUgc2Vzc2lvbiBtYW5hZ2VyIGJ1dCB0YXJnZXRpbmcgYVxuICAgKiBkaWZmZXJlbnQgKGNoaWxkKSBvcmdhbml6YXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSB0YXJnZXRPcmdJZCBUaGUgSUQgb2YgYW4gb3JnYW5pemF0aW9uIHRoYXQgdGhlIG5ldyBjbGllbnQgc2hvdWxkIHRhcmdldFxuICAgKiBAcmV0dXJucyBBIG5ldyBjbGllbnQgdGFyZ2V0aW5nIGEgZGlmZmVyZW50IG9yZ1xuICAgKi9cbiAgd2l0aFRhcmdldE9yZyh0YXJnZXRPcmdJZDogc3RyaW5nKTogQXBpQ2xpZW50IHtcbiAgICByZXR1cm4gbmV3IEFwaUNsaWVudCh0aGlzLnNlc3Npb25NZXRhLCB0aGlzLnNlc3Npb25NYW5hZ2VyLCB0YXJnZXRPcmdJZCwgdGhpcy5jb25maWcpO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYSAqKm5ldyoqIGNsaWVudCB1c2luZyB3aXRoIGFuIHVwZGF0ZWQge0BsaW5rIENsaWVudENvbmZpZ30uXG4gICAqXG4gICAqIEBwYXJhbSBjZmcgUGFydGlhbCBjb25maWd1cmF0aW9uIHRvIGFwcGx5IG9uIHRvcCBvZiB0aGUgZXhpc3RpbmcgY2xpZW50XG4gICAqIEByZXR1cm5zIEEgbmV3IGNsaWVudCB3aXRoIHRoZSB1cGRhdGVkIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIHdpdGhDb25maWcoY2ZnOiBQYXJ0aWFsPENsaWVudENvbmZpZz4pOiBBcGlDbGllbnQge1xuICAgIHJldHVybiBuZXcgQXBpQ2xpZW50KHRoaXMuc2Vzc2lvbk1ldGEsIHRoaXMuc2Vzc2lvbk1hbmFnZXIsIHRoaXMub3JnSWQsIHtcbiAgICAgIC4uLnRoaXMuY29uZmlnLFxuICAgICAgLi4uY2ZnLFxuICAgICAgaGVhZGVyczogbWVyZ2VIZWFkZXJzKHRoaXMuY29uZmlnLmhlYWRlcnMsIGNmZy5oZWFkZXJzKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgKipuZXcqKiBjbGllbnQgd2l0aCBhIHByZWZlcnJlZCByZWdpb25hbCBlbnZpcm9ubWVudCB7QGxpbmsgZW52fSB0byB1c2UuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgUHJlZmVycmVkIGVudmlyb25tZW50IHRvIHVzZS5cbiAgICogQHJldHVybnMgQSBuZXcgY2xpZW50IHdpdGggdXBkYXRlZCBwcmVmZXJyZWQgZW52aXJvbm1lbnQuXG4gICAqL1xuICB3aXRoUHJlZmVycmVkRW52KGVudjogRW52SW50ZXJmYWNlIHwgdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG5ldyBBcGlDbGllbnQodGhpcy5zZXNzaW9uTWV0YSwgdGhpcy5zZXNzaW9uTWFuYWdlciwgdGhpcy5vcmdJZCwge1xuICAgICAgLi4udGhpcy5jb25maWcsXG4gICAgICBwcmVmZXJyZWRFbnY6IGVudixcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgKipuZXcqKiBjbGllbnQgaW4gd2hpY2ggdGhlIGN1cnJlbnQgc2Vzc2lvbiB3aWxsIGFzc3VtZSBhIGdpdmVuIHJvbGUuXG4gICAqIE5vIHZhbGlkYXRpb24gaXMgZG9uZSBvbiB0aGUgY2xpZW50IHNpZGU7IHRoZSBiYWNrIGVuZCB3aWxsIHJlamVjdCBzdWJzZXF1ZW50XG4gICAqIHJlcXVlc3RzIGlmIHRoZSBjdXJyZW50IHNlc3Npb24gaXMgbm90IGFsbG93ZWQgdG8gYXNzdW1lIHRoYXQgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgbmFtZSBvciBJRCBvZiBhIHJvbGUgdG8gYXNzdW1lLlxuICAgKiBAcmV0dXJucyBBIG5ldyBjbGllbnQgd2l0aCB0aGUgdXBkYXRlZCBjb25maWd1cmF0aW9uLlxuICAgKi9cbiAgYXNzdW1lUm9sZShyb2xlSWQ6IHN0cmluZyk6IEFwaUNsaWVudCB7XG4gICAgcmV0dXJuIHRoaXMud2l0aENvbmZpZyh7XG4gICAgICBoZWFkZXJzOiB7IFwieC1jdWJpc3QtYXNzdW1lLXJvbGVcIjogcm9sZUlkIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyAjcmVnaW9uIFVTRVJTOiB1c2VyR2V0LCB1c2VyVG90cChSZXNldEluaXR8UmVzZXRDb21wbGV0ZXxWZXJpZnl8RGVsZXRlKSwgdXNlckZpZG8oUmVnaXN0ZXJJbml0fFJlZ2lzdGVyQ29tcGxldGV8RGVsZXRlKVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyLlxuICAgKi9cbiAgYXN5bmMgdXNlckdldCgpOiBQcm9taXNlPFVzZXJJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge30pLnRoZW4oQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlcyBsb2dpbiB2aWEgRW1haWwgT1RQLlxuICAgKiBSZXR1cm5zIGFuIHVuc2lnbmVkIE9JREMgdG9rZW4gYW5kIHNlbmRzIGFuIGVtYWlsIHRvIHRoZSB1c2VyIGNvbnRhaW5pbmcgdGhlIHNpZ25hdHVyZSBvZiB0aGF0IHRva2VuLlxuICAgKiBUaGUgT0lEQyB0b2tlbiBjYW4gYmUgcmVjb25zdHJ1Y3RlZCBieSBhcHBlbmRpbmcgdGhlIHNpZ25hdHVyZSB0byB0aGUgcGFydGlhbCB0b2tlbiBsaWtlIHNvOlxuICAgKlxuICAgKiB0b2tlbiA9IHBhcnRpYWxfdG9rZW4gKyBzaWduYXR1cmVcbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgb3JnIHRvIGxvZ2luIHRvXG4gICAqIEBwYXJhbSBlbWFpbCBUaGUgZW1haWwgdG8gc2VuZCB0aGUgc2lnbmF0dXJlIHRvXG4gICAqIEBwYXJhbSBoZWFkZXJzIE9wdGlvbmFsIGhlYWRlcnMgdG8gc2V0XG4gICAqIEByZXR1cm5zIFRoZSBwYXJ0aWFsIE9JREMgdG9rZW4gdGhhdCBtdXN0IGJlIGNvbWJpbmVkIHdpdGggdGhlIHNpZ25hdHVyZSBpbiB0aGUgZW1haWxcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpbml0RW1haWxPdHBBdXRoKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgZW1haWw6IHN0cmluZyxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8RW1haWxPdHBSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vb2lkYy9lbWFpbC1vdHBcIiwgXCJwb3N0XCIpO1xuXG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHsgZW1haWwgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogUmV0cmllcyBhIHBlbmRpbmcgTUZBIHJlcXVlc3Qgd2l0aCB0aGUgcHJvdmlkZWQgTWZhUmVjZWlwdHNcbiAgICpcbiAgICogQHBhcmFtIHJlcSBUaGUgcmVxdWVzdCB0byByZXRyeVxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBUaGUgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlIGZyb20gdGhlIHNlcnZlclxuICAgKi9cbiAgYXN5bmMgbWZhUmV0cnkoXG4gICAgcmVxOiBNZmFSZXF1ZXN0SW5mb1tcInJlcXVlc3RcIl0sXG4gICAgbWZhUmVjZWlwdDogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPHVua25vd24+PiB7XG4gICAgY29uc3QgbzogT3A8T3BlcmF0aW9uPiA9IChvcHRzKSA9PlxuICAgICAgLy8gQHRzLWV4cGVjdC1lcnJvciBXZSdyZSBkb2luZyBzb21lIGhlYXZ5IGNhc3RpbmcgdG8gZ2V0IHRoaXMgdG8gd29ya1xuICAgICAgYXBpRmV0Y2gocmVxLnBhdGgsIHJlcS5tZXRob2QsIHtcbiAgICAgICAgLi4ub3B0cyxcbiAgICAgICAgYm9keTogcmVxLmJvZHksXG4gICAgICB9KTtcbiAgICBjb25zdCByZXRyeSA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJldHJ5LCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcmVxdWVzdCB0byBjaGFuZ2UgdXNlcidzIHZlcmlmaWVkIGVtYWlsLlxuICAgKlxuICAgKiBSZXR1cm5zIGEge0BsaW5rIFJlc2V0RW1haWxDaGFsbGVuZ2V9IHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBlaXRoZXIgYnkgY2FsbGluZ1xuICAgKiB7QGxpbmsgUmVzZXRFbWFpbENoYWxsZW5nZS5hbnN3ZXJ9IChvciB7QGxpbmsgQXBpQ2xpZW50LnVzZXJFbWFpbFJlc2V0Q29tcGxldGV9KS5cbiAgICpcbiAgICogQHBhcmFtIHJlcSBFaXRoZXIgdGhlIGVtYWlsIHRvIHJlZ2lzdGVyIG9yIHRoZSBwYXJhbWV0ZXJzIGZvciB0aGUgcmVxdWVzdFxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBbiBlbWFpbCB2ZXJpZmljYXRpb24gY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZFxuICAgKi9cbiAgYXN5bmMgdXNlckVtYWlsUmVzZXRJbml0KFxuICAgIHJlcTogc3RyaW5nIHwgc2NoZW1hc1tcIkVtYWlsUmVzZXRSZXF1ZXN0XCJdLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UmVzZXRFbWFpbENoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZW1haWxcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHJlc2V0RW1haWxGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiB0eXBlb2YgcmVxID09PSBcInN0cmluZ1wiID8geyBlbWFpbDogcmVxIH0gOiByZXEsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAoZW1haWxPdHApID0+IG5ldyBSZXNldEVtYWlsQ2hhbGxlbmdlKHRoaXMsIGVtYWlsT3RwKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVzZXRFbWFpbEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIHJlc2V0IGVtYWlsIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIHVzZXJFbWFpbFJlc2V0SW5pdH0uXG4gICAqIElmIHN1Y2Nlc3NmdWwsIHVzZXIncyB2ZXJpZmllZCBlbWFpbCB3aWxsIGJlIHVwZGF0ZWQuXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBSZXNldEVtYWlsQ2hhbGxlbmdlLmFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBwYXJ0aWFsVG9rZW4gVGhlIHBhcnRpYWwgdG9rZW4gcmV0dXJuZWQgYnkge0BsaW5rIHVzZXJFbWFpbFJlc2V0SW5pdH1cbiAgICogQHBhcmFtIHNpZ25hdHVyZSBUaGUgb25lLXRpbWUgY29kZSAoc2lnbmF0dXJlIGluIHRoaXMgY2FzZSkgc2VudCB2aWEgZW1haWxcbiAgICovXG4gIGFzeW5jIHVzZXJFbWFpbFJlc2V0Q29tcGxldGUocGFydGlhbFRva2VuOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2VtYWlsXCIsIFwicGF0Y2hcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHsgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0ke3NpZ25hdHVyZX1gIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlcyBhIHJlcXVlc3QgdG8gY2hhbmdlIHVzZXIncyBUT1RQLiBSZXR1cm5zIGEge0BsaW5rIFRvdHBDaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCBlaXRoZXIgYnkgY2FsbGluZyB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9IChvclxuICAgKiB7QGxpbmsgQXBpQ2xpZW50LnVzZXJUb3RwUmVzZXRDb21wbGV0ZX0pLlxuICAgKlxuICAgKiBAcGFyYW0gaXNzdWVyIE9wdGlvbmFsIGlzc3VlcjsgZGVmYXVsdHMgdG8gXCJDdWJpc3RcIlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBIFRPVFAgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZFxuICAgKi9cbiAgYXN5bmMgdXNlclRvdHBSZXNldEluaXQoXG4gICAgaXNzdWVyPzogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8VG90cENoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcmVzZXRUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgICAgYm9keTogaXNzdWVyXG4gICAgICAgICAgPyB7XG4gICAgICAgICAgICAgIGlzc3VlcixcbiAgICAgICAgICAgIH1cbiAgICAgICAgICA6IG51bGwsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBtYXBSZXNwb25zZShkYXRhLCAodG90cEluZm8pID0+IG5ldyBUb3RwQ2hhbGxlbmdlKHRoaXMsIHRvdHBJbmZvKSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVzZXRUb3RwRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEFuc3dlciB0aGUgVE9UUCBjaGFsbGVuZ2UgaXNzdWVkIGJ5IHtAbGluayB1c2VyVG90cFJlc2V0SW5pdH0uIElmIHN1Y2Nlc3NmdWwsIHVzZXInc1xuICAgKiBUT1RQIGNvbmZpZ3VyYXRpb24gd2lsbCBiZSB1cGRhdGVkIHRvIHRoYXQgb2YgdGhlIFRPVFAgY2hhbGxlbmdlLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgVG90cENoYWxsZW5nZS5hbnN3ZXJ9LlxuICAgKlxuICAgKiBAcGFyYW0gdG90cElkIFRoZSBJRCBvZiB0aGUgVE9UUCBjaGFsbGVuZ2VcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZSB0aGF0IHNob3VsZCB2ZXJpZnkgYWdhaW5zdCB0aGUgVE9UUCBjb25maWd1cmF0aW9uIGZyb20gdGhlIGNoYWxsZW5nZS5cbiAgICovXG4gIGFzeW5jIHVzZXJUb3RwUmVzZXRDb21wbGV0ZSh0b3RwSWQ6IHN0cmluZywgY29kZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL3RvdHBcIiwgXCJwYXRjaFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogeyB0b3RwX2lkOiB0b3RwSWQsIGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBWZXJpZmllcyBhIGdpdmVuIFRPVFAgY29kZSBhZ2FpbnN0IHRoZSBjdXJyZW50IHVzZXIncyBUT1RQIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb2RlIEN1cnJlbnQgVE9UUCBjb2RlXG4gICAqIEB0aHJvd3MgQW4gZXJyb3IgaWYgdmVyaWZpY2F0aW9uIGZhaWxzXG4gICAqL1xuICBhc3luYyB1c2VyVG90cFZlcmlmeShjb2RlOiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cC92ZXJpZnlcIiwgXCJwb3N0XCIpO1xuXG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHsgY29kZSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBUT1RQIGZyb20gdGhlIHVzZXIncyBhY2NvdW50LlxuICAgKiBBbGxvd2VkIG9ubHkgaWYgYXQgbGVhc3Qgb25lIEZJRE8ga2V5IGlzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgdXNlcidzIGFjY291bnQuXG4gICAqIE1GQSB2aWEgRklETyBpcyBhbHdheXMgcmVxdWlyZWQuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpIHRvIGluY2x1ZGUgaW4gSFRUUCBoZWFkZXJzXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyVG90cERlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvdG90cFwiLCBcImRlbGV0ZVwiKTtcbiAgICBjb25zdCBkZWxldGVUb3RwRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGRlbGV0ZVRvdHBGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgYWRkaW5nIGEgbmV3IEZJRE8gZGV2aWNlLiBNRkEgbWF5IGJlIHJlcXVpcmVkLiAgVGhpcyByZXR1cm5zIGEge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2V9XG4gICAqIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCB3aXRoIHtAbGluayBBZGRGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3Ige0BsaW5rIHVzZXJGaWRvUmVnaXN0ZXJDb21wbGV0ZX1cbiAgICogKGFmdGVyIE1GQSBhcHByb3ZhbHMpLlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgbmV3IGRldmljZSBvciBhIGZ1bGwgcmVxdWVzdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykgdG8gaW5jbHVkZSBpbiBIVFRQIGhlYWRlcnNcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBtdXN0IGJlIGFuc3dlcmVkIGluIG9yZGVyIHRvIGNvbXBsZXRlIEZJRE8gcmVnaXN0cmF0aW9uLlxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9SZWdpc3RlckluaXQoXG4gICAgbmFtZTogc3RyaW5nIHwgc2NoZW1hc1tcIkZpZG9DcmVhdGVSZXF1ZXN0XCJdLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QWRkRmlkb0NoYWxsZW5nZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkb1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYWRkRmlkb0ZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiID8geyBuYW1lIH0gOiBuYW1lLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKGMpID0+IG5ldyBBZGRGaWRvQ2hhbGxlbmdlKHRoaXMsIGMpKTtcbiAgICB9O1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBhZGRGaWRvRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgdXNlckZpZG9SZWdpc3RlckluaXR9KSByZXF1ZXN0IHRvIGFkZCBhIG5ldyBGSURPIGRldmljZS5cbiAgICpcbiAgICogSW5zdGVhZCBvZiBjYWxsaW5nIHRoaXMgbWV0aG9kIGRpcmVjdGx5LCBwcmVmZXIge0BsaW5rIEFkZEZpZG9DaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgQWRkRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIGNoYWxsZW5nZUlkIFRoZSBJRCBvZiB0aGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHRoZSByZW1vdGUgZW5kLlxuICAgKiBAcGFyYW0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2UuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyB1c2VyRmlkb1JlZ2lzdGVyQ29tcGxldGUoXG4gICAgY2hhbGxlbmdlSWQ6IHN0cmluZyxcbiAgICBjcmVkZW50aWFsOiBQdWJsaWNLZXlDcmVkZW50aWFsLFxuICApOiBQcm9taXNlPEVtcHR5PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2ZpZG9cIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgYSBGSURPIGtleSBmcm9tIHRoZSB1c2VyJ3MgYWNjb3VudC5cbiAgICogQWxsb3dlZCBvbmx5IGlmIFRPVFAgaXMgYWxzbyBkZWZpbmVkLlxuICAgKiBNRkEgdmlhIFRPVFAgaXMgYWx3YXlzIHJlcXVpcmVkLlxuICAgKlxuICAgKiBAcGFyYW0gZmlkb0lkIFRoZSBJRCBvZiB0aGUgZGVzaXJlZCBGSURPIGtleVxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKSB0byBpbmNsdWRlIGluIEhUVFAgaGVhZGVyc1xuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgdXNlckZpZG9EZWxldGUoXG4gICAgZmlkb0lkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBkZWxldGVGaWRvRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB7XG4gICAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZmlkby97Zmlkb19pZH1cIiwgXCJkZWxldGVcIik7XG5cbiAgICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBmaWRvX2lkOiBmaWRvSWQgfSB9LFxuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZGVsZXRlRmlkb0ZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SR1M6IG9yZ0dldCwgb3JnVXBkYXRlLCBvcmdVcGRhdGVVc2VyTWVtYmVyc2hpcCwgb3JnQ3JlYXRlT3JnLCBvcmdRdWVyeU1ldHJpY3MsIG9yZ0dldEVtYWlsQ29uZmlnLCBvcmdDb25maWd1cmVFbWFpbCwgb3JnRGVsZXRlRW1haWxDb25maWdcblxuICAvKipcbiAgICogT2J0YWluIGluZm9ybWF0aW9uIGFib3V0IGFuIG9yZ1xuICAgKlxuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBnZXQgaW5mbyBmb3JcbiAgICogQHJldHVybnMgSW5mb3JtYXRpb24gYWJvdXQgdGhlIG9yZ2FuaXphdGlvbi5cbiAgICovXG4gIGFzeW5jIG9yZ0dldChvcmdJZD86IHN0cmluZyk6IFByb21pc2U8T3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkID8/IHRoaXMub3JnSWQgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIHRoZSBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBKU09OIHJlcXVlc3QgdG8gc2VuZCB0byB0aGUgQVBJIHNlcnZlci5cbiAgICogQHJldHVybnMgVXBkYXRlZCBvcmcgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBvcmdVcGRhdGUocmVxdWVzdDogVXBkYXRlT3JnUmVxdWVzdCk6IFByb21pc2U8VXBkYXRlT3JnUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9XCIsIFwicGF0Y2hcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHsgYm9keTogcmVxdWVzdCB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUgdXNlcidzIG1lbWJlcnNoaXAgaW4gdGhpcyBvcmcuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIElEIG9mIHRoZSB1c2VyIHdob3NlIG1lbWJlcnNoaXAgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxIFRoZSB1cGRhdGUgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBVcGRhdGVkIHVzZXIgbWVtYmVyc2hpcFxuICAgKi9cbiAgYXN5bmMgb3JnVXBkYXRlVXNlck1lbWJlcnNoaXAoXG4gICAgdXNlcklkOiBzdHJpbmcsXG4gICAgcmVxOiBVcGRhdGVVc2VyTWVtYmVyc2hpcFJlcXVlc3QsXG4gICk6IFByb21pc2U8VXNlckluT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9L21lbWJlcnNoaXBcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHVzZXJfaWQ6IHVzZXJJZCB9IH0sXG4gICAgICBib2R5OiByZXEsXG4gICAgfSkudGhlbihBcGlDbGllbnQuI3Byb2Nlc3NVc2VySW5PcmdJbmZvKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgb3JnYW5pemF0aW9uLiBUaGUgbmV3IG9yZyBpcyBhIGNoaWxkIG9mIHRoZVxuICAgKiBjdXJyZW50IG9yZyBhbmQgaW5oZXJpdHMgaXRzIGtleS1leHBvcnQgcG9saWN5LiBUaGUgbmV3IG9yZ1xuICAgKiBpcyBjcmVhdGVkIHdpdGggb25lIG93bmVyLCB0aGUgY2FsbGVyIG9mIHRoaXMgQVBJLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgZGV0YWlscyBvZiB0aGUgcmVxdWVzdFxuICAgKiBAcmV0dXJucyBUaGUgbmV3IG9yZ2FuaXphdGlvbiBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgb3JnQ3JlYXRlT3JnKGJvZHk6IENyZWF0ZU9yZ1JlcXVlc3QpOiBQcm9taXNlPE9yZ0luZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29yZ3NcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IHRoZSBhdWRpdCBsb2cuXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IFRoZSBxdWVyeS5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0IHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUmVxdWVzdGVkIGF1ZGl0IGxvZy5cbiAgICovXG4gIG9yZ1F1ZXJ5QXVkaXRMb2coXG4gICAgYm9keTogQXVkaXRMb2dSZXF1ZXN0LFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPEF1ZGl0TG9nUmVzcG9uc2UsIEF1ZGl0TG9nRW50cnlbXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXVkaXRcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBib2R5LCBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PlxuICAgICAgICByLmVudHJpZXMuZmxhdE1hcCgoZW50cnkpID0+IHtcbiAgICAgICAgICBjb25zdCByZXN1bHQgPSBhdWRpdExvZ0VudHJ5U2NoZW1hLnNhZmVQYXJzZShlbnRyeSk7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdC5zdWNjZXNzID8gW3Jlc3VsdC5kYXRhXSA6IFtdO1xuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFF1ZXJ5IG9yZyBtZXRyaWNzLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBUaGUgcXVlcnlcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0IHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgQ29tcHV0ZWQgb3JnIG1ldHJpY3Mgc3RhdGlzdGljcy5cbiAgICovXG4gIG9yZ1F1ZXJ5TWV0cmljcyhcbiAgICBib2R5OiBRdWVyeU1ldHJpY3NSZXF1ZXN0LFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFF1ZXJ5TWV0cmljc1Jlc3BvbnNlLCBRdWVyeU1ldHJpY3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWV0cmljc1wiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIG5ldyBQYWdpbmF0b3IoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHF1ZXJ5KSA9PiB0aGlzLmV4ZWMobywgeyBib2R5LCBwYXJhbXM6IHsgcXVlcnkgfSB9KSxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICAgIChhY2MsIG5leHQpID0+IHtcbiAgICAgICAgaWYgKCFhY2MpIHJldHVybiBuZXh0O1xuICAgICAgICBhY2MucmF3X2RhdGEgPz89IFtdO1xuICAgICAgICBhY2MucmF3X2RhdGEucHVzaCguLi4obmV4dC5yYXdfZGF0YSA/PyBbXSkpO1xuICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgfSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBlbWFpbCBjb25maWd1cmF0aW9uIGZvciBhIGdpdmVuIHB1cnBvc2UuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBlbWFpbCB0ZW1wbGF0ZSBraW5kIHRvIGdldFxuICAgKiBAcmV0dXJucyBUaGUgZW1haWwgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgb3JnR2V0RW1haWxDb25maWcoXG4gICAgcHVycG9zZTogRW1haWxUZW1wbGF0ZVB1cnBvc2UsXG4gICk6IFByb21pc2U8c2NoZW1hc1tcIkdldEVtYWlsQ29uZmlnUmVzcG9uc2VcIl0+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2VtYWlscy97cHVycG9zZX1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdXJwb3NlIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb25maWd1cmUgZW1haWwgdGVtcGxhdGVcbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHRlbXBsYXRlIGtpbmQgdG8gY29uZmlndXJlXG4gICAqIEBwYXJhbSByZXEgVGhlIHRlbXBsYXRlIHBhcmFtZXRlcnNcbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2VcbiAgICovXG4gIGFzeW5jIG9yZ0NvbmZpZ3VyZUVtYWlsKFxuICAgIHB1cnBvc2U6IEVtYWlsVGVtcGxhdGVQdXJwb3NlLFxuICAgIHJlcTogc2NoZW1hc1tcIkNvbmZpZ3VyZUVtYWlsUmVxdWVzdFwiXSxcbiAgKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZW1haWxzL3twdXJwb3NlfVwiLCBcInB1dFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1cnBvc2UgfSB9LFxuICAgICAgYm9keTogcmVxLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBlbWFpbCBjb25maWd1cmF0aW9uIGZvciBhIGdpdmVuIHB1cnBvc2UuXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBlbWFpbCB0ZW1wbGF0ZSBraW5kIHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJucyBBbiBlbXB0eSByZXNwb25zZVxuICAgKi9cbiAgYXN5bmMgb3JnRGVsZXRlRW1haWxDb25maWcocHVycG9zZTogRW1haWxUZW1wbGF0ZVB1cnBvc2UpOiBQcm9taXNlPEVtcHR5PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9lbWFpbHMve3B1cnBvc2V9XCIsIFwiZGVsZXRlXCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVycG9zZSB9IH0sXG4gICAgICBib2R5OiB7fSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE9SRyBVU0VSUzogb3JnVXNlckludml0ZSwgb3JnVXNlckRlbGV0ZSwgb3JnVXNlcnNMaXN0LCBvcmdVc2VyR2V0LCBvcmdVc2VyR2V0QnlFbWFpbCwgb3JnVXNlckNyZWF0ZU9pZGMsIG9yZ1VzZXJEZWxldGVPaWRjXG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyAoZmlyc3QtcGFydHkpIHVzZXIgaW4gdGhlIG9yZ2FuaXphdGlvbiBhbmQgc2VuZCBhbiBlbWFpbCBpbnZpdGF0aW9uIHRvIHRoYXQgdXNlci5cbiAgICpcbiAgICogQG92ZXJsb2FkXG4gICAqIEBwYXJhbSBhcmdzIFRoZSBpbnZpdGF0aW9uIHJlcXVlc3QgZGV0YWlsc1xuICAgKi9cbiAgYXN5bmMgb3JnVXNlckludml0ZShhcmdzOiBzY2hlbWFzW1wiSW52aXRlUmVxdWVzdFwiXSk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBvdmVybG9hZFxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIHVzZXJcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlclxuICAgKiBAcGFyYW0gcm9sZSBPcHRpb25hbCByb2xlLiBEZWZhdWx0cyB0byBcImFsaWVuXCIuXG4gICAqIEBwYXJhbSBza2lwRW1haWwgT3B0aW9uYWxseSBza2lwIHNlbmRpbmcgdGhlIGludml0ZSBlbWFpbC5cbiAgICogQGRlcHJlY2F0ZWQgVXNlIHRoZSBvYmplY3QgcGFyYW1ldGVyIG92ZXJsb2FkIGluc3RlYWQuXG4gICAqL1xuICBhc3luYyBvcmdVc2VySW52aXRlKFxuICAgIGVtYWlsOiBzdHJpbmcsXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIHJvbGU/OiBNZW1iZXJSb2xlLFxuICAgIHNraXBFbWFpbD86IGJvb2xlYW4sXG4gICk6IFByb21pc2U8dm9pZD47XG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgKGZpcnN0LXBhcnR5KSB1c2VyIGluIHRoZSBvcmdhbml6YXRpb24gYW5kIHNlbmQgYW4gZW1haWwgaW52aXRhdGlvbiB0byB0aGF0IHVzZXIuXG4gICAqXG4gICAqIEBwYXJhbSBlbWFpbE9yQXJncyBFaXRoZXIgdGhlIHVzZXIncyBlbWFpbCAoZGVwcmVjYXRlZCkgb3IgYW4gSW52aXRlUmVxdWVzdCBvYmplY3RcbiAgICogQHBhcmFtIG5hbWUgVGhlIGZ1bGwgbmFtZSBvZiB0aGUgdXNlciAocmVxdWlyZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICogQHBhcmFtIHJvbGUgT3B0aW9uYWwgcm9sZS4gRGVmYXVsdHMgdG8gXCJhbGllblwiIChvbmx5IHVzZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICogQHBhcmFtIHNraXBFbWFpbCBPcHRpb25hbGx5IHNraXAgc2VuZGluZyB0aGUgaW52aXRlIGVtYWlsIChvbmx5IHVzZWQgd2hlbiBlbWFpbE9yQXJncyBpcyBhIHN0cmluZylcbiAgICovXG4gIGFzeW5jIG9yZ1VzZXJJbnZpdGUoXG4gICAgZW1haWxPckFyZ3M6IHN0cmluZyB8IHNjaGVtYXNbXCJJbnZpdGVSZXF1ZXN0XCJdLFxuICAgIG5hbWU/OiBzdHJpbmcsXG4gICAgcm9sZT86IE1lbWJlclJvbGUsXG4gICAgc2tpcEVtYWlsPzogYm9vbGVhbixcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgYXJnczogc2NoZW1hc1tcIkludml0ZVJlcXVlc3RcIl0gPVxuICAgICAgdHlwZW9mIGVtYWlsT3JBcmdzID09PSBcInN0cmluZ1wiXG4gICAgICAgID8ge1xuICAgICAgICAgICAgZW1haWw6IGVtYWlsT3JBcmdzLFxuICAgICAgICAgICAgbmFtZTogbmFtZSEsXG4gICAgICAgICAgICByb2xlLFxuICAgICAgICAgICAgc2tpcF9lbWFpbDogISFza2lwRW1haWwsXG4gICAgICAgICAgfVxuICAgICAgICA6IGVtYWlsT3JBcmdzO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW52aXRlXCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogYXJncyxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZW1vdmUgdGhlIHVzZXIgZnJvbSB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gdXNlcklkIFRoZSBJRCBvZiB0aGUgdXNlciB0byByZW1vdmUuXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMve3VzZXJfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDoge1xuICAgICAgICAgIHVzZXJfaWQ6IHVzZXJJZCxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCB1c2VycyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIHNlYXJjaFF1ZXJ5IE9wdGlvbmFsIHF1ZXJ5IHN0cmluZy4gSWYgZGVmaW5lZCwgYWxsIHJldHVybmVkIHVzZXJzIHdpbGwgY29udGFpbiB0aGlzIHN0cmluZyBpbiB0aGVpciBuYW1lIG9yIGVtYWlsLlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSB1c2VycyBpbiB0aGUgb3JnLlxuICAgKi9cbiAgb3JnVXNlcnNMaXN0KFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBzZWFyY2hRdWVyeT86IHN0cmluZyxcbiAgKTogUGFnaW5hdG9yPEdldFVzZXJzSW5PcmdSZXNwb25zZSwgVXNlckluT3JnSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vyc1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IHE6IHNlYXJjaFF1ZXJ5LCAuLi5wYWdlUXVlcnkgfSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMubWFwKEFwaUNsaWVudC4jcHJvY2Vzc1VzZXJJbk9yZ0luZm8pLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHVzZXIgYnkgaWQuXG4gICAqXG4gICAqIEBwYXJhbSB1c2VySWQgVGhlIGlkIG9mIHRoZSB1c2VyIHRvIGdldC5cbiAgICogQHJldHVybnMgT3JnIHVzZXIuXG4gICAqL1xuICBhc3luYyBvcmdVc2VyR2V0KHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxVc2VySW5PcmdJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7XG4gICAgICAgICAgdXNlcl9pZDogdXNlcklkLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gQXBpQ2xpZW50LiNwcm9jZXNzVXNlckluT3JnSW5mbyhyZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdXNlciBieSBlbWFpbC5cbiAgICpcbiAgICogQHBhcmFtIGVtYWlsIFRoZSBlbWFpbCBvZiB0aGUgdXNlciB0byBnZXQuXG4gICAqIEByZXR1cm5zIE9yZyB1c2VycyB3aXRoIGEgZ2l2ZW4gZW1haWxcbiAgICogQHRocm93cyBpZiB0aGVyZSBpcyBubyB1c2VyIHdpdGggdGhhdCBlbWFpbCwgb3IgZW1haWwgaXMgaW52YWxpZFxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckdldEJ5RW1haWwoZW1haWw6IHN0cmluZyk6IFByb21pc2U8R2V0VXNlckJ5RW1haWxSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvZW1haWwve2VtYWlsfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IGVtYWlsIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB1c2VyIGJ5IE9JREMgaWRlbnRpdHlcbiAgICpcbiAgICogQHBhcmFtIGlzcyBPSURDIGlzc3VlclxuICAgKiBAcGFyYW0gc3ViIE9JREMgc3ViamVjdFxuICAgKiBAcmV0dXJucyBPcmcgdXNlciB3aXRoIGEgZ2l2ZW4gT0lEQyBpZGVudGl0eVxuICAgKi9cbiAgYXN5bmMgb3JnVXNlckdldEJ5T2lkYyhpc3M6IHN0cmluZywgc3ViOiBzdHJpbmcpOiBQcm9taXNlPEdldFVzZXJCeU9pZGNSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkYy97aXNzfS97c3VifVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczoge1xuICAgICAgICBwYXRoOiB7IGlzcywgc3ViIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBPSURDIHVzZXIuIFRoaXMgY2FuIGJlIGEgZmlyc3QtcGFydHkgXCJNZW1iZXJcIiBvciB0aGlyZC1wYXJ0eSBcIkFsaWVuXCIuXG4gICAqXG4gICAqIEBwYXJhbSBpZGVudGl0eU9yUHJvb2YgVGhlIGlkZW50aXR5IG9yIGlkZW50aXR5IHByb29mIG9mIHRoZSBPSURDIHVzZXIsIG9yIG51bGwgdG8gY3JlYXRlIGEgdXNlciB3aXRob3V0IGFuIGlkZW50aXR5LlxuICAgKiBAcGFyYW0gZW1haWwgRW1haWwgb2YgdGhlIE9JREMgdXNlclxuICAgKiBAcGFyYW0gb3B0cyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIG5ldyBPSURDIHVzZXJzXG4gICAqIEByZXR1cm5zIFVzZXIgaWQgb2YgdGhlIG5ldyB1c2VyXG4gICAqL1xuICBhc3luYyBvcmdVc2VyQ3JlYXRlT2lkYyhcbiAgICBpZGVudGl0eU9yUHJvb2Y6IE9pZGNJZGVudGl0eSB8IElkZW50aXR5UHJvb2YgfCBudWxsLFxuICAgIGVtYWlsPzogc3RyaW5nIHwgbnVsbCxcbiAgICBvcHRzOiBDcmVhdGVPaWRjVXNlck9wdGlvbnMgPSB7fSxcbiAgKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXJzXCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IGlkZW50aXR5T3JQcm9vZkZpZWxkcyA9ICFpZGVudGl0eU9yUHJvb2ZcbiAgICAgID8ge31cbiAgICAgIDogXCJpZFwiIGluIGlkZW50aXR5T3JQcm9vZlxuICAgICAgICA/IHsgcHJvb2Y6IGlkZW50aXR5T3JQcm9vZiB9XG4gICAgICAgIDogeyBpZGVudGl0eTogaWRlbnRpdHlPclByb29mIH07XG5cbiAgICBjb25zdCB7IHVzZXJfaWQgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIHJvbGU6IG9wdHMubWVtYmVyUm9sZSA/PyBcIkFsaWVuXCIsXG4gICAgICAgIGVtYWlsLFxuICAgICAgICBuYW1lOiBvcHRzLm5hbWUsXG4gICAgICAgIG1mYV9wb2xpY3k6IG9wdHMubWZhUG9saWN5LFxuICAgICAgICAuLi5pZGVudGl0eU9yUHJvb2ZGaWVsZHMsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHVzZXJfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGFuIGV4aXN0aW5nIE9JREMgdXNlci5cbiAgICpcbiAgICogQHBhcmFtIGlkZW50aXR5IFRoZSBpZGVudGl0eSBvZiB0aGUgT0lEQyB1c2VyXG4gICAqIEByZXR1cm5zIEFuIGVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBvcmdVc2VyRGVsZXRlT2lkYyhpZGVudGl0eTogT2lkY0lkZW50aXR5KTogUHJvbWlzZTxFbXB0eT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlcnMvb2lkY1wiLCBcImRlbGV0ZVwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogaWRlbnRpdHksXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBLRVlTOiBrZXlHZXQsIGtleUF0dGVzdCwga2V5VXBkYXRlLCBrZXlEZWxldGUsIGtleXNDcmVhdGUsIGtleXNEZXJpdmUsIGtleXNMaXN0LCBrZXlIaXN0b3J5XG5cbiAgLyoqXG4gICAqIEdldCBhIGtleSBieSBpdHMgaWQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBrZXlHZXQoa2V5SWQ6IHN0cmluZyk6IFByb21pc2U8S2V5SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5cy97a2V5X2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZXN0IHRvIGtleSBwcm9wZXJ0aWVzLlxuICAgKlxuICAgKiBUaGUgcmVzcG9uc2UgaXMgYSBKV1Qgd2hvc2UgY2xhaW1zIGFyZSB0aGUgcHJvcGVydGllcyBvZiB0aGUgcmVxdWVzdGVkIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5LlxuICAgKiBAcGFyYW0gcXVlcnkgUXVlcnkgcGFyYW1ldGVyczpcbiAgICogQHBhcmFtIHF1ZXJ5LmluY2x1ZGVfcm9sZXMgaWYgc3BlY2lmaWVkLCBpbmNsdWRlIGFsbCB0aGUgcm9sZXMgdGhlIGtleSBpcyBpbi5cbiAgICogQHJldHVybnMgQSBKV1Qgd2hvc2UgY2xhaW1zIGFyZSB0aGUgcHJvcGVydGllcyBvZiB0aGUga2V5LiBUaGUgdHlwZSBvZiB0aGUgcmV0dXJuZWQgSldUIHBheWxvYWQgaXMge0BsaW5rIEtleUF0dGVzdGF0aW9uQ2xhaW1zfS5cbiAgICovXG4gIGFzeW5jIGtleUF0dGVzdChrZXlJZDogc3RyaW5nLCBxdWVyeT86IEtleUF0dGVzdGF0aW9uUXVlcnkpOiBQcm9taXNlPEtleUluZm9Kd3Q+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vYXR0ZXN0XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsga2V5X2lkOiBrZXlJZCB9LFxuICAgICAgICBxdWVyeSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEga2V5IGJ5IGl0cyB0eXBlIGFuZCBtYXRlcmlhbCBpZC5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIGtleSB0eXBlLlxuICAgKiBAcGFyYW0gbWF0ZXJpYWxJZCBUaGUgbWF0ZXJpYWwgaWQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBrZXkgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBrZXlHZXRCeU1hdGVyaWFsSWQoa2V5VHlwZTogS2V5VHlwZSwgbWF0ZXJpYWxJZDogc3RyaW5nKTogUHJvbWlzZTxLZXlJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfdHlwZX0ve21hdGVyaWFsX2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X3R5cGU6IGtleVR5cGUsIG1hdGVyaWFsX2lkOiBtYXRlcmlhbElkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCByb2xlcyBhIGtleSBpcyBpbi5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBpZCBvZiB0aGUga2V5IHRvIGdldC5cbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgdGhlIHJvbGVzIGEga2V5IGlzIGluLlxuICAgKi9cbiAga2V5Um9sZXNMaXN0KGtleUlkOiBzdHJpbmcsIHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0S2V5Um9sZXNSZXNwb25zZSwgS2V5SW5Sb2xlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9L3JvbGVzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgICAgIHF1ZXJ5LFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuICAgICAgKHIpID0+IHIucm9sZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gdXBkYXRlLlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgSlNPTiByZXF1ZXN0IHRvIHNlbmQgdG8gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSBKU09OIHJlc3BvbnNlIGZyb20gdGhlIEFQSSBzZXJ2ZXIuXG4gICAqL1xuICBhc3luYyBrZXlVcGRhdGUoXG4gICAga2V5SWQ6IHN0cmluZyxcbiAgICByZXF1ZXN0OiBVcGRhdGVLZXlSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8S2V5SW5mbz4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGVzIGEga2V5LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgS2V5IGlkXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBrZXlEZWxldGUoa2V5SWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9rZXlzL3trZXlfaWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZDoga2V5SWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgbmV3IHNpZ25pbmcga2V5cy5cbiAgICpcbiAgICogQHBhcmFtIGtleVR5cGUgVGhlIHR5cGUgb2Yga2V5IHRvIGNyZWF0ZS5cbiAgICogQHBhcmFtIGNvdW50IFRoZSBudW1iZXIgb2Yga2V5cyB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBvd25lcklkIFRoZSBvd25lciBvZiB0aGUga2V5cy4gRGVmYXVsdHMgdG8gdGhlIHNlc3Npb24ncyB1c2VyLlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBrZXkgcHJvcGVydGllc1xuICAgKiBAcmV0dXJucyBUaGUgbmV3IGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzQ3JlYXRlKFxuICAgIGtleVR5cGU6IEtleVR5cGUsXG4gICAgY291bnQ6IG51bWJlcixcbiAgICBvd25lcklkPzogc3RyaW5nLFxuICAgIHByb3BzPzogQ3JlYXRlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBjaGFpbl9pZCA9IDA7IC8vIG5vdCB1c2VkIGFueW1vcmVcblxuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0va2V5c1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGNvdW50LFxuICAgICAgICBjaGFpbl9pZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBvd25lcjogcHJvcHM/Lm93bmVyID8/IG93bmVySWQsXG4gICAgICAgIHBvbGljeTogcHJvcHM/LnBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogRGVyaXZlIGEgc2V0IG9mIGtleXMgb2YgYSBzcGVjaWZpZWQgdHlwZSB1c2luZyBhIHN1cHBsaWVkIGRlcml2YXRpb24gcGF0aCBhbmQgYW4gZXhpc3RpbmcgbG9uZy1saXZlZCBtbmVtb25pYy5cbiAgICpcbiAgICogVGhlIG93bmVyIG9mIHRoZSBkZXJpdmVkIGtleSB3aWxsIGJlIHRoZSBvd25lciBvZiB0aGUgbW5lbW9uaWMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlUeXBlIFRoZSB0eXBlIG9mIGtleSB0byBjcmVhdGUuXG4gICAqIEBwYXJhbSBkZXJpdmF0aW9uUGF0aHMgRGVyaXZhdGlvbiBwYXRocyBmcm9tIHdoaWNoIHRvIGRlcml2ZSBuZXcga2V5cy5cbiAgICogQHBhcmFtIG1uZW1vbmljSWQgbWF0ZXJpYWxfaWQgb2YgbW5lbW9uaWMga2V5IHVzZWQgdG8gZGVyaXZlIHRoZSBuZXcga2V5LlxuICAgKiBAcGFyYW0gcHJvcHMgQWRkaXRpb25hbCBvcHRpb25zIGZvciBkZXJpdmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgZGVyaXZlZCBrZXlzLlxuICAgKi9cbiAgYXN5bmMga2V5c0Rlcml2ZShcbiAgICBrZXlUeXBlOiBLZXlUeXBlLFxuICAgIGRlcml2YXRpb25QYXRoczogc3RyaW5nW10sXG4gICAgbW5lbW9uaWNJZDogc3RyaW5nLFxuICAgIHByb3BzPzogSW1wb3J0RGVyaXZlS2V5UHJvcGVydGllcyxcbiAgKTogUHJvbWlzZTxLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2Rlcml2ZV9rZXlcIiwgXCJwdXRcIik7XG5cbiAgICBjb25zdCB7IGtleXMgfSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiB7XG4gICAgICAgIGRlcml2YXRpb25fcGF0aDogZGVyaXZhdGlvblBhdGhzLFxuICAgICAgICBtbmVtb25pY19pZDogbW5lbW9uaWNJZCxcbiAgICAgICAga2V5X3R5cGU6IGtleVR5cGUsXG4gICAgICAgIC4uLnByb3BzLFxuICAgICAgICBwb2xpY3k6IHByb3BzPy5wb2xpY3ksXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGtleXM7XG4gIH1cblxuICAvKipcbiAgICogVXNlIGVpdGhlciBhIG5ldyBvciBleGlzdGluZyBtbmVtb25pYyB0byBkZXJpdmUga2V5cyBvZiBvbmUgb3IgbW9yZVxuICAgKiBzcGVjaWZpZWQgdHlwZXMgdmlhIHNwZWNpZmllZCBkZXJpdmF0aW9uIHBhdGhzLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHMgQSBsaXN0IG9mIG9iamVjdHMgc3BlY2lmeWluZyB0aGUga2V5cyB0byBiZSBkZXJpdmVkXG4gICAqIEBwYXJhbSBwcm9wcyBBZGRpdGlvbmFsIG9wdGlvbnMgZm9yIGRlcml2YXRpb24uXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXdseSBkZXJpdmVkIGtleXMuXG4gICAqL1xuICBhc3luYyBrZXlzRGVyaXZlTXVsdGkoXG4gICAga2V5VHlwZXNBbmREZXJpdmF0aW9uUGF0aHM6IEtleVR5cGVBbmREZXJpdmF0aW9uUGF0aFtdLFxuICAgIHByb3BzPzogRGVyaXZlTXVsdGlwbGVLZXlUeXBlc1Byb3BlcnRpZXMsXG4gICk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9kZXJpdmVfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAga2V5X3R5cGVzX2FuZF9kZXJpdmF0aW9uX3BhdGhzOiBrZXlUeXBlc0FuZERlcml2YXRpb25QYXRocyxcbiAgICAgICAgLi4ucHJvcHMsXG4gICAgICAgIHBvbGljeTogcHJvcHM/LnBvbGljeSxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCBhY2Nlc3NpYmxlIGtleXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHR5cGUgT3B0aW9uYWwga2V5IHR5cGUgdG8gZmlsdGVyIGxpc3QgZm9yLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHBhcmFtIG93bmVyIE9wdGlvbmFsIGtleSBvd25lciB0byBmaWx0ZXIgbGlzdCBmb3IuXG4gICAqIEBwYXJhbSBzZWFyY2ggT3B0aW9uYWxseSBzZWFyY2ggYnkga2V5J3MgbWF0ZXJpYWwgSUQgYW5kIG1ldGFkYXRhXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIga2V5cy5cbiAgICovXG4gIGtleXNMaXN0KFxuICAgIHR5cGU/OiBLZXlUeXBlLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBvd25lcj86IHN0cmluZyxcbiAgICBzZWFyY2g/OiBzdHJpbmcsXG4gICk6IFBhZ2luYXRvcjxMaXN0S2V5c1Jlc3BvbnNlLCBLZXlJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IGtleV90eXBlOiB0eXBlLCBrZXlfb3duZXI6IG93bmVyLCBzZWFyY2gsIC4uLnF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHJlY2VudCBoaXN0b3JpY2FsIGtleSB0cmFuc2FjdGlvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUga2V5IGlkLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBoaXN0b3JpY2FsIHRyYW5zYWN0aW9ucy5cbiAgICovXG4gIGtleUhpc3Rvcnkoa2V5SWQ6IHN0cmluZywgcGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RIaXN0b3JpY2FsVHhSZXNwb25zZSwgSGlzdG9yaWNhbFR4W10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2tleXMve2tleV9pZH0vdHhcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAoKSA9PiB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBrZXlfaWQ6IGtleUlkIH0gfSB9KSxcbiAgICAgIChyKSA9PiByLnR4cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gT1JHIENPTlRBQ1RTOiBjb250YWN0Q3JlYXRlLCBjb250YWN0R2V0LCBjb250YWN0c0xpc3QsIGNvbnRhY3REZWxldGUsIGNvbnRhY3RVcGRhdGUsIGNvbnRhY3RMb29rdXBCeUFkZHJlc3NcblxuICAvKipcbiAgICogQ3JlYXRlcyBhIG5ldyBjb250YWN0IGluIHRoZSBvcmdhbml6YXRpb24td2lkZSBhZGRyZXNzIGJvb2suIFRoZVxuICAgKiB1c2VyIG1ha2luZyB0aGUgcmVxdWVzdCBpcyB0aGUgb3duZXIgb2YgdGhlIGNvbnRhY3QsIGdpdmluZyB0aGVtIGVkaXQgYWNjZXNzXG4gICAqIHRvIHRoZSBjb250YWN0IGFsb25nIHdpdGggdGhlIG9yZyBvd25lcnMuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIGZvciB0aGUgbmV3IGNvbnRhY3QuXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgVGhlIGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBNZXRhZGF0YSBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuIEludGVuZGVkIGZvciB1c2UgYXMgYSBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCwgZGV0ZXJtaW5pbmcgd2hlbiBhbmQgd2hvIGNhbiBlZGl0IHRoaXMgY29udGFjdC5cbiAgICogQHBhcmFtIGxhYmVscyBUaGUgb3B0aW9uYWwgbGFiZWxzIGZvciB0aGUgY29udGFjdC5cbiAgICogQHJldHVybnMgVGhlIG5ld2x5IGNyZWF0ZWQgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RDcmVhdGUoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFkZHJlc3Nlcz86IEFkZHJlc3NNYXAsXG4gICAgbWV0YWRhdGE/OiBKc29uVmFsdWUsXG4gICAgZWRpdFBvbGljeT86IEVkaXRQb2xpY3ksXG4gICAgbGFiZWxzPzogQ29udGFjdExhYmVsW10sXG4gICk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2NvbnRhY3RzXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgYWRkcmVzc2VzLFxuICAgICAgICBtZXRhZGF0YSxcbiAgICAgICAgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3ksXG4gICAgICAgIGxhYmVscyxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0aGUgcHJvcGVydGllcyBvZiBhIENvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGlkIG9mIHRoZSBjb250YWN0IHlvdSB3YW50IHRvIHJldHJpZXZlLlxuICAgKiBAcmV0dXJucyBUaGUgY29udGFjdC5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RHZXQoY29udGFjdElkOiBzdHJpbmcpOiBQcm9taXNlPENvbnRhY3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy97Y29udGFjdF9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGNvbnRhY3RfaWQ6IGNvbnRhY3RJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgY29udGFjdHMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgVGhlIG9wdGlvbmFsIHBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZ2V0dGluZyBldmVyeSBwYWdlLlxuICAgKiBAcGFyYW0gc2VhcmNoIFRoZSBvcHRpb25hbCBzZWFyY2ggcXVlcnkuIEVpdGhlciBgbGFiZWw6Li4uYCwgd2hpY2ggd2lsbFxuICAgKiByZXR1cm4gY29udGFjdHMgd2l0aCB0aGUgbGFiZWwgcHJvdmlkZWQgYWZ0ZXIgdGhlICc6Jzsgb3IgYW4gYWRkcmVzc1xuICAgKiBzZWFyY2gsIHdoZXJlIGFsbCByZXR1cm5lZCBjb250YWN0cyB3aWxsIGhhdmUgYW4gYWRkcmVzcyBzdGFydGluZyB3aXRoLCBvclxuICAgKiBlcXVhbGxpbmcsIHRoZSBnaXZlbiBzZWFyY2ggc3RyaW5nLlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBjb250YWN0cyBpbiB0aGUgb3JnLlxuICAgKi9cbiAgY29udGFjdHNMaXN0KFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBzZWFyY2g/OiBgbGFiZWw6JHtDb250YWN0TGFiZWx9YCB8IHN0cmluZyxcbiAgKTogUGFnaW5hdG9yPExpc3RDb250YWN0c1Jlc3BvbnNlLCBDb250YWN0SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0c1wiLCBcImdldFwiKTtcblxuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IHNlYXJjaCwgLi4ucGFnZVF1ZXJ5IH0gfSB9KSxcbiAgICAgIChyKSA9PiByLmNvbnRhY3RzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhbGwgY29udGFjdHMgaW4gdGhlIG9yZyB0aGF0IGhhdmUgdGhlIGdpdmVuIGFkZHJlc3MuXG4gICAqXG4gICAqIFdoZW4gcXVlcnlpbmcgd2l0aCBhbiBFVk0gYWRkcmVzcyB3aXRob3V0IGEgY2hhaW4sIHRoaXMgZW5kcG9pbnQgcmV0dXJuc1xuICAgKiBjb250YWN0cyB3aXRoIHRoYXQgYWRkcmVzcyBvbiAqYW55KiBFVk0gY2hhaW4sIGluY2x1ZGluZyB0aG9zZSB3aXRob3V0IGEgY2hhaW5cbiAgICogZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3MgVGhlIGFkZHJlc3MgYWxsIHJldHVybmVkIGNvbnRhY3RzIG11c3QgaGF2ZS5cbiAgICogQHJldHVybnMgQ29udGFjdHMgaW4gdGhlIG9yZyB3aXRoIHRoYXQgYWRkcmVzcy5cbiAgICovXG4gIGFzeW5jIGNvbnRhY3RMb29rdXBCeUFkZHJlc3MoYWRkcmVzczogQ29udGFjdEFkZHJlc3NEYXRhKTogUHJvbWlzZTxDb250YWN0SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy9ieS1hZGRyZXNzXCIsIFwicG9zdFwiKTtcblxuICAgIHJldHVybiAoYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keTogYWRkcmVzcyB9KSkuY29udGFjdHM7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgY29udGFjdCwgc3BlY2lmaWVkIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogT25seSB0aGUgY29udGFjdCBvd25lciBhbmQgb3JnIG93bmVycyBhcmUgYWxsb3dlZCB0byBkZWxldGUgY29udGFjdHMuXG4gICAqIEFkZGl0aW9uYWxseSwgdGhlIGNvbnRhY3QncyBlZGl0IHBvbGljeSAoaWYgc2V0KSBtdXN0IHBlcm1pdCB0aGUgZGVsZXRpb24uXG4gICAqXG4gICAqIEBwYXJhbSBjb250YWN0SWQgVGhlIGNvbnRhY3QgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBBIHJlc3BvbnNlIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZFxuICAgKi9cbiAgYXN5bmMgY29udGFjdERlbGV0ZShcbiAgICBjb250YWN0SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vY29udGFjdHMve2NvbnRhY3RfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgY29udGFjdF9pZDogY29udGFjdElkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuXG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIGFuIGV4aXN0aW5nIGNvbnRhY3QgaW4gdGhlIG9yZ2FuaXphdGlvbi13aWRlIGFkZHJlc3MgYm9vay4gT25seVxuICAgKiB0aGUgY29udGFjdCBvd25lciBvciBhbiBvcmcgb3duZXIgY2FuIHVwZGF0ZSBjb250YWN0cy5cbiAgICpcbiAgICogVXBkYXRlcyB3aWxsIG92ZXJ3cml0ZSB0aGUgZXhpc3RpbmcgdmFsdWUgb2YgdGhlIGZpZWxkLlxuICAgKlxuICAgKiBAcGFyYW0gY29udGFjdElkIFRoZSBjb250YWN0IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIGZpZWxkcyB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIGNvbnRhY3QgaW5mb3JtYXRpb24uXG4gICAqL1xuICBhc3luYyBjb250YWN0VXBkYXRlKFxuICAgIGNvbnRhY3RJZDogc3RyaW5nLFxuICAgIHJlcXVlc3Q6IFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8Q29udGFjdEluZm8+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9jb250YWN0cy97Y29udGFjdF9pZH1cIiwgXCJwYXRjaFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGNvbnRhY3RfaWQ6IGNvbnRhY3RJZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcXVlc3QsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcblxuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBST0xFUzogcm9sZUNyZWF0ZSwgcm9sZUdldCwgcm9sZUF0dGVzdCwgcm9sZVJlYWQsIHJvbGVVcGRhdGUsIHJvbGVEZWxldGUsIHJvbGVzTGlzdFxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG9wdGlvbmFsIG5hbWUgb2YgdGhlIHJvbGUuXG4gICAqIEByZXR1cm5zIFRoZSBJRCBvZiB0aGUgbmV3IHJvbGUuXG4gICAqL1xuICBhc3luYyByb2xlQ3JlYXRlKG5hbWU/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXNcIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiBuYW1lID8geyBuYW1lIH0gOiB1bmRlZmluZWQsXG4gICAgfSk7XG5cbiAgICByZXR1cm4gZGF0YS5yb2xlX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHJvbGUgYnkgaXRzIGlkIChvciBuYW1lKS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgaWQgb2YgdGhlIHJvbGUgdG8gZ2V0LlxuICAgKiBAcmV0dXJucyBUaGUgcm9sZS5cbiAgICovXG4gIGFzeW5jIHJvbGVHZXQocm9sZUlkOiBzdHJpbmcpOiBQcm9taXNlPFJvbGVJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH1cIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXR0ZXN0IHRvIHJvbGUgcHJvcGVydGllcy5cbiAgICpcbiAgICogVGhlIHJlc3BvbnNlIGlzIGEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHByb3BlcnRpZXMgb2YgdGhlIHJlcXVlc3RlZCByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBpZCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHF1ZXJ5IFF1ZXJ5IHBhcmFtZXRlcnM6XG4gICAqIEBwYXJhbSBxdWVyeS52ZXJib3NpdHkgUm9sZSBwcm9wZXJ0aWVzIHRvIGluY2x1ZGUgaW4gYW4gYXR0ZXN0YXRpb24uIERlZmF1bHRzIHRvIGJhc2ljIHJvbGUgcHJvcGVydGllcywgaW5jbHVkaW5nIGFzc29jaWF0ZWQgdXNlcnMsIGJ1dCBleGNsdWRpbmcgYXNzb2NpYXRlZCBrZXlzLlxuICAgKiBAcGFyYW0gcXVlcnkua2V5X2ZpbHRlciBGaWx0ZXIgZG93biB0byBhIHNpbmdsZSBhc3NvY2lhdGVkIGtleS4gRGVmYXVsdHMgdG8gaW5jbHVkaW5nIGFsbCBhc3NvY2lhdGVkIGtleXMuXG4gICAqIEByZXR1cm5zIEEgSldUIHdob3NlIGNsYWltcyBhcmUgdGhlIHJvbGUgcHJvcGVydGllcy4gVGhlIHR5cGUgb2YgdGhlIHJldHVybmVkIEpXVCBwYXlsb2FkIGlzIHtAbGluayBSb2xlQXR0ZXN0YXRpb25DbGFpbXN9LlxuICAgKi9cbiAgYXN5bmMgcm9sZUF0dGVzdChyb2xlSWQ6IHN0cmluZywgcXVlcnk/OiBSb2xlQXR0ZXN0YXRpb25RdWVyeSk6IFByb21pc2U8Um9sZUluZm9Kd3Q+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hdHRlc3RcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHtcbiAgICAgICAgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSxcbiAgICAgICAgcXVlcnksXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIHVwZGF0ZSByZXF1ZXN0LlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCByb2xlIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVwZGF0ZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICByZXF1ZXN0OiBVcGRhdGVSb2xlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFJvbGVJbmZvPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIGEgcm9sZSBieSBpdHMgSUQuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIHJvbGVEZWxldGUocm9sZUlkOiBzdHJpbmcsIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9XCIsIFwiZGVsZXRlXCIpO1xuXG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgcm9sZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEByZXR1cm5zIFBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgcm9sZXMuXG4gICAqL1xuICByb2xlc0xpc3QocGFnZT86IFBhZ2VPcHRzKTogUGFnaW5hdG9yPExpc3RSb2xlc1Jlc3BvbnNlLCBSb2xlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlc1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5IH0gfSksXG4gICAgICAocikgPT4gci5yb2xlcyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUk9MRSBLRVlTOiByb2xlS2V5c0FkZCwgcm9sZUtleXNEZWxldGUsIHJvbGVLZXlzTGlzdCwgcm9sZUtleUdldFxuXG4gIC8qKlxuICAgKiBBZGQgZXhpc3Rpbmcga2V5cyB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWRzIFRoZSBJRHMgb2YgdGhlIGtleXMgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gcG9saWN5IFRoZSBvcHRpb25hbCBwb2xpY3kgdG8gYXBwbHkgdG8gZWFjaCBrZXkuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqXG4gICAqIEByZXR1cm5zIEEgQ3ViZVNpZ25lclJlc3BvbnNlIGluZGljYXRpbmcgc3VjY2VzcyBvciBmYWlsdXJlLlxuICAgKi9cbiAgYXN5bmMgcm9sZUtleXNBZGQoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAga2V5SWRzOiBzdHJpbmdbXSxcbiAgICBwb2xpY3k/OiBLZXlQb2xpY3ksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS9hZGRfa2V5c1wiLCBcInB1dFwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCB9IH0sXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBrZXlfaWRzOiBrZXlJZHMsXG4gICAgICAgICAgcG9saWN5LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG5cbiAgICByZXR1cm4gQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJlbW92ZSBhbiBleGlzdGluZyBrZXkgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZVxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIElEIG9mIHRoZSBrZXkgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICpcbiAgICogQHJldHVybnMgQSBDdWJlU2lnbmVyUmVzcG9uc2UgaW5kaWNhdGluZyBzdWNjZXNzIG9yIGZhaWx1cmUuXG4gICAqL1xuICBhc3luYyByb2xlS2V5c1JlbW92ZShcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImRlbGV0ZVwiKTtcblxuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwga2V5X2lkOiBrZXlJZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcblxuICAgIHJldHVybiBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwga2V5cyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIGtleXMgdG8gcmV0cmlldmUuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSBrZXlzIGluIHRoZSByb2xlLlxuICAgKi9cbiAgcm9sZUtleXNMaXN0KHJvbGVJZDogc3RyaW5nLCBwYWdlPzogUGFnZU9wdHMpOiBQYWdpbmF0b3I8TGlzdFJvbGVLZXlzUmVzcG9uc2UsIEtleUluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L2tleXNcIiwgXCJnZXRcIik7XG5cbiAgICByZXR1cm4gUGFnaW5hdG9yLml0ZW1zKFxuICAgICAgcGFnZSA/PyBQYWdlLmRlZmF1bHQoKSxcbiAgICAgIChxdWVyeSkgPT5cbiAgICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkIH0sXG4gICAgICAgICAgICBxdWVyeSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmtleXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBrZXkgaW4gYSByb2xlIGJ5IGl0cyBJRC5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBUaGUgSUQgb2YgdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBrZXlJZCBUaGUgSUQgb2YgdGhlIGtleSB0byBnZXQuXG4gICAqIEBwYXJhbSBvcHRzIE9wdGlvbmFsIG9wdGlvbnMgZm9yIGdldHRpbmcgdGhlIGtleS5cbiAgICogQHJldHVybnMgVGhlIGtleSB3aXRoIHBvbGljaWVzIGluZm9ybWF0aW9uLlxuICAgKi9cbiAgcm9sZUtleUdldChcbiAgICByb2xlSWQ6IHN0cmluZyxcbiAgICBrZXlJZDogc3RyaW5nLFxuICAgIG9wdHM/OiBHZXRSb2xlS2V5T3B0aW9ucyxcbiAgKTogUHJvbWlzZTxLZXlXaXRoUG9saWNpZXNJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0va2V5cy97a2V5X2lkfVwiLCBcImdldFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCBrZXlfaWQ6IGtleUlkIH0sXG4gICAgICAgIHF1ZXJ5OiBvcHRzLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFJPTEUgVVNFUlM6IHJvbGVVc2VyQWRkLCByb2xlVXNlclJlbW92ZSwgcm9sZVVzZXJzTGlzdFxuXG4gIC8qKlxuICAgKiBBZGQgYW4gZXhpc3RpbmcgdXNlciB0byBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gYWRkIHRvIHRoZSByb2xlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBhbiBlbXB0eSByZXNwb25zZSwgb3IgYSByZXNwb25zZSB0aGF0IGNhbiBiZSB1c2VkIHRvIGFwcHJvdmUgTUZBIGlmIG5lZWRlZC5cbiAgICovXG4gIGFzeW5jIHJvbGVVc2VyQWRkKHJvbGVJZDogc3RyaW5nLCB1c2VySWQ6IHN0cmluZywgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9yb2xlcy97cm9sZV9pZH0vYWRkX3VzZXIve3VzZXJfaWR9XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHJlcUZuID0gKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHJvbGVfaWQ6IHJvbGVJZCwgdXNlcl9pZDogdXNlcklkIH0gfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlIGFuIGV4aXN0aW5nIHVzZXIgZnJvbSBhbiBleGlzdGluZyByb2xlLlxuICAgKlxuICAgKiBAcGFyYW0gcm9sZUlkIFRoZSBJRCBvZiB0aGUgcm9sZS5cbiAgICogQHBhcmFtIHVzZXJJZCBUaGUgSUQgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHJvbGUuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIGFuIGVtcHR5IHJlc3BvbnNlLCBvciBhIHJlc3BvbnNlIHRoYXQgY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkLlxuICAgKi9cbiAgYXN5bmMgcm9sZVVzZXJSZW1vdmUocm9sZUlkOiBzdHJpbmcsIHVzZXJJZDogc3RyaW5nLCBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3JvbGVzL3tyb2xlX2lkfS91c2Vycy97dXNlcl9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcm9sZV9pZDogcm9sZUlkLCB1c2VyX2lkOiB1c2VySWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IGFsbCB1c2VycyBpbiBhIHJvbGUuXG4gICAqXG4gICAqIEBwYXJhbSByb2xlSWQgVGhlIElEIG9mIHRoZSByb2xlIHdob3NlIHVzZXJzIHRvIHJldHJpZXZlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciB0aGUgdXNlcnMgaW4gdGhlIHJvbGUuXG4gICAqL1xuICByb2xlVXNlcnNMaXN0KFxuICAgIHJvbGVJZDogc3RyaW5nLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPExpc3RSb2xlVXNlcnNSZXNwb25zZSwgVXNlckluUm9sZUluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3VzZXJzXCIsIFwiZ2V0XCIpO1xuXG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeSwgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9IH0pLFxuICAgICAgKHIpID0+IHIudXNlcnMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIFBPTElDWTogcG9saWN5KENyZWF0ZXxHZXR8TGlzdHxVcGRhdGV8RGVsZXRlfEludm9rZXxTZWNyZXRzKVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gbmFtZSBUaGUgbmFtZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgcG9saWN5LlxuICAgKiBAcGFyYW0gcnVsZXMgVGhlIHBvbGljeSBydWxlcy5cbiAgICogQHBhcmFtIGFjbCBPcHRpb25hbCBsaXN0IG9mIHBvbGljeSBhY2Nlc3MgY29udHJvbCBlbnRyaWVzLlxuICAgKiBAcmV0dXJucyBUaGUgdGhlIG5ldyBwb2xpY3kncyBpbmZvLlxuICAgKi9cbiAgYXN5bmMgcG9saWN5Q3JlYXRlKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICB0eXBlOiBQb2xpY3lUeXBlLFxuICAgIHJ1bGVzOiBLZXlQb2xpY3kgfCBSb2xlUG9saWN5IHwgeyBoYXNoOiBzdHJpbmcgfVtdLFxuICAgIGFjbD86IEpzb25WYWx1ZVtdLFxuICApOiBQcm9taXNlPFBvbGljeUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgbmFtZSxcbiAgICAgICAgcG9saWN5X3R5cGU6IHR5cGUsXG4gICAgICAgIHJ1bGVzLFxuICAgICAgICBhY2wsXG4gICAgICB9LFxuICAgIH0pLnRoZW4oY29lcmNlUG9saWN5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgbmFtZWQgcG9saWN5IGJ5IGl0cyBuYW1lIG9yIGlkLlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5SWQgVGhlIG5hbWUgb3IgaWQgb2YgdGhlIHBvbGljeSB0byBnZXQuXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSBwb2xpY3kgdmVyc2lvbiB0byBnZXQuXG4gICAqIEByZXR1cm5zIFRoZSBwb2xpY3kuXG4gICAqL1xuICBhc3luYyBwb2xpY3lHZXQocG9saWN5SWQ6IHN0cmluZywgdmVyc2lvbjogcG9saWN5LlZlcnNpb24pOiBQcm9taXNlPFBvbGljeUluZm8+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzL3twb2xpY3lfaWR9L3t2ZXJzaW9ufVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHBvbGljeV9pZDogcG9saWN5SWQsIHZlcnNpb24gfSB9LFxuICAgIH0pLnRoZW4oY29lcmNlUG9saWN5SW5mbyk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdCBhbGwgbmFtZWQgcG9saWNpZXMgaW4gdGhlIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIHBhZ2UgUGFnaW5hdGlvbiBvcHRpb25zLiBEZWZhdWx0cyB0byBmZXRjaGluZyB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqIEBwYXJhbSBwb2xpY3lUeXBlIFRoZSBvcHRpb25hbCB0eXBlIG9mIHBvbGljaWVzIHRvIGZldGNoLiBEZWZhdWx0cyB0byBmZXRjaGluZyBhbGwgbmFtZWQgcG9saWNpZXMgcmVnYXJkbGVzcyBvZiB0eXBlLlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHBvbGljaWVzLlxuICAgKi9cbiAgcG9saWNpZXNMaXN0KFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgICBwb2xpY3lUeXBlPzogUG9saWN5VHlwZSxcbiAgKTogUGFnaW5hdG9yPExpc3RQb2xpY2llc1Jlc3BvbnNlLCBQb2xpY3lJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IHBvbGljeV90eXBlOiBwb2xpY3lUeXBlLCAuLi5wYWdlUXVlcnkgfSB9IH0pLFxuICAgICAgKHIpID0+IHIucG9saWNpZXMsXG4gICAgICAocikgPT4gci5sYXN0X2V2YWx1YXRlZF9rZXksXG4gICAgKSBhcyBQYWdpbmF0b3I8TGlzdFBvbGljaWVzUmVzcG9uc2UsIFBvbGljeUluZm9bXT47XG4gIH1cblxuICAvKipcbiAgICogVXBkYXRlIGEgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5SWQgVGhlIG5hbWUgb3IgaWQgb2YgdGhlIHBvbGljeSB0byB1cGRhdGUuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSB1cGRhdGUgcmVxdWVzdC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSB1cGRhdGVkIHBvbGljeSBpbmZvcm1hdGlvbi5cbiAgICovXG4gIGFzeW5jIHBvbGljeVVwZGF0ZShcbiAgICBwb2xpY3lJZDogc3RyaW5nLFxuICAgIHJlcXVlc3Q6IFVwZGF0ZVBvbGljeVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQb2xpY3lJbmZvPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcG9saWNpZXMve3BvbGljeV9pZH1cIiwgXCJwYXRjaFwiKTtcbiAgICBjb25zdCByZXFGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwb2xpY3lfaWQ6IHBvbGljeUlkIH0gfSxcbiAgICAgICAgYm9keTogcmVxdWVzdCxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pLnRoZW4oKHJlc3ApID0+IG1hcFJlc3BvbnNlKHJlc3AsIGNvZXJjZVBvbGljeUluZm8pKTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhIG5hbWVkIHBvbGljeS5cbiAgICpcbiAgICogQHBhcmFtIHBvbGljeUlkIFRoZSBuYW1lIG9yIGlkIG9mIHRoZSBwb2xpY3kgdG8gZGVsZXRlLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgQW4gZW1wdHkgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBwb2xpY3lEZWxldGUoXG4gICAgcG9saWN5SWQ6IHN0cmluZyxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVtcHR5Pj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcG9saWNpZXMve3BvbGljeV9pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHBvbGljeV9pZDogcG9saWN5SWQgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogSW52b2tlIGEgbmFtZWQgcG9saWN5LlxuICAgKlxuICAgKiBAcGFyYW0gcG9saWN5SWQgVGhlIG5hbWUgb3IgaWQgb2YgdGhlIHBvbGljeSB0byBpbnZva2UuXG4gICAqIEBwYXJhbSB2ZXJzaW9uIFRoZSBwb2xpY3kgdmVyc2lvbiB0byBpbnZva2UuXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBpbnZva2UgcmVxdWVzdC5cbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiBpbnZva2luZyB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgcG9saWN5SW52b2tlKFxuICAgIHBvbGljeUlkOiBzdHJpbmcsXG4gICAgdmVyc2lvbjogc3RyaW5nLFxuICAgIHJlcXVlc3Q6IEludm9rZVBvbGljeVJlcXVlc3QsXG4gICk6IFByb21pc2U8SW52b2tlUG9saWN5UmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljaWVzL3twb2xpY3lfaWR9L3t2ZXJzaW9ufS9pbnZva2VcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcG9saWN5X2lkOiBwb2xpY3lJZCwgdmVyc2lvbiB9IH0sXG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gQlVDS0VUOiBidWNrZXQoR2V0fExpc3R8VXBkYXRlKVxuXG4gIC8qKlxuICAgKiBMaXN0IGF2YWlsYWJsZSBtZXRhIGluZm9ybWF0aW9uIGFib3V0IGFsbCBwb2xpY3kgYnVja2V0cyBpbiB0aGUgb3JnLlxuICAgKlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgUGFnaW5hdG9yIGZvciBpdGVyYXRpbmcgb3ZlciBwb2xpY3kgYnVja2V0cy5cbiAgICovXG4gIGJ1Y2tldHNMaXN0KHBhZ2U/OiBQYWdlT3B0cyk6IFBhZ2luYXRvcjxMaXN0QnVja2V0c1Jlc3BvbnNlLCBCdWNrZXRJbmZvW10+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3BvbGljeS9idWNrZXRzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBQYWdpbmF0b3IuaXRlbXMoXG4gICAgICBwYWdlID8/IFBhZ2UuZGVmYXVsdCgpLFxuICAgICAgKHBhZ2VRdWVyeSkgPT4gdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHF1ZXJ5OiB7IC4uLnBhZ2VRdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5idWNrZXRzLFxuICAgICAgKHIpID0+IHIubGFzdF9ldmFsdWF0ZWRfa2V5LFxuICAgICkgYXMgUGFnaW5hdG9yPExpc3RCdWNrZXRzUmVzcG9uc2UsIEJ1Y2tldEluZm9bXT47XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBtZXRhIGluZm9ybWF0aW9uIG9mIGEgcG9saWN5IEtWIHN0b3JlIGJ1Y2tldC5cbiAgICpcbiAgICogQHBhcmFtIGJ1Y2tldE5hbWUgVGhlIG5hbWUgb2YgdGhlIGJ1Y2tldCB0byBnZXRcbiAgICogQHJldHVybnMgVGhlIGJ1Y2tldCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgYnVja2V0R2V0KGJ1Y2tldE5hbWU6IHN0cmluZyk6IFByb21pc2U8QnVja2V0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcG9saWN5L2J1Y2tldHMve2J1Y2tldF9uYW1lfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IGJ1Y2tldF9uYW1lOiBidWNrZXROYW1lIH0gfSxcbiAgICB9KS50aGVuKGNvZXJjZUJ1Y2tldEluZm8pO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBvciB1cGRhdGUgbWV0YSBpbmZvcm1hdGlvbiBmb3IgYSBwb2xpY3kgS1Ygc3RvcmUgYnVja2V0LlxuICAgKlxuICAgKiBAcGFyYW0gYnVja2V0TmFtZSBUaGUgbmFtZSBvZiB0aGUgYnVja2V0IHRvIHVwZGF0ZS5cbiAgICogQHBhcmFtIHJlcXVlc3QgVGhlIHVwZGF0ZSByZXF1ZXN0XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbiBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgdXBkYXRlZCBidWNrZXQgaW5mb3JtYXRpb25cbiAgICovXG4gIGFzeW5jIGJ1Y2tldFVwZGF0ZShcbiAgICBidWNrZXROYW1lOiBzdHJpbmcsXG4gICAgcmVxdWVzdDogVXBkYXRlQnVja2V0UmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ1Y2tldEluZm8+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9wb2xpY3kvYnVja2V0cy97YnVja2V0X25hbWV9XCIsIFwicGF0Y2hcIik7XG4gICAgY29uc3QgcmVxRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgYnVja2V0X25hbWU6IGJ1Y2tldE5hbWUgfSB9LFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSkudGhlbigocmVzcCkgPT4gbWFwUmVzcG9uc2UocmVzcCwgY29lcmNlQnVja2V0SW5mbykpO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBXQVNNOiB3YXNtKFBvbGljeVVwbG9hZClcblxuICAvKipcbiAgICogUmVxdWVzdCBhbiB1cGxvYWQgVVJMIGZvciB1cGxvYWRpbmcgYSBXYXNtIHBvbGljeSBvYmplY3QuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBwb2xpY3kgdXBsb2FkIHJlcXVlc3QuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZSBjb250YWluaW5nIHRoZSBVUkwgZm9yIHVwbG9hZGluZyB0aGUgcG9saWN5LlxuICAgKi9cbiAgYXN5bmMgd2FzbVBvbGljeVVwbG9hZChyZXF1ZXN0OiBVcGxvYWRXYXNtUG9saWN5UmVxdWVzdCk6IFByb21pc2U8VXBsb2FkV2FzbVBvbGljeVJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9wb2xpY3kvd2FzbVwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBib2R5OiByZXF1ZXN0LFxuICAgIH0pO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gU0VTU0lPTlM6IHNlc3Npb24oQ3JlYXRlfENyZWF0ZUZvclJvbGV8UmVmcmVzaHxSZXZva2V8TGlzdHxLZXlzTGlzdClcblxuICAvKipcbiAgICogQ3JlYXRlIG5ldyB1c2VyIHNlc3Npb24gKG1hbmFnZW1lbnQgYW5kL29yIHNpZ25pbmcpLiBUaGUgbGlmZXRpbWUgb2ZcbiAgICogdGhlIG5ldyBzZXNzaW9uIGlzIHNpbGVudGx5IHRydW5jYXRlZCB0byB0aGF0IG9mIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAqXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWUgc2V0dGluZ3NcbiAgICogQHJldHVybnMgTmV3IHNpZ25lciBzZXNzaW9uIGluZm8uXG4gICAqL1xuICBhc3luYyBzZXNzaW9uQ3JlYXRlKFxuICAgIHB1cnBvc2U6IHN0cmluZyxcbiAgICBzY29wZXM6IFNjb3BlW10sXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIGJvZHk6IHtcbiAgICAgICAgcHVycG9zZSxcbiAgICAgICAgc2NvcGVzLFxuICAgICAgICBhdXRoX2xpZmV0aW1lOiBsaWZldGltZXMuYXV0aCxcbiAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWVzLnJlZnJlc2gsXG4gICAgICAgIHNlc3Npb25fbGlmZXRpbWU6IGxpZmV0aW1lcy5zZXNzaW9uLFxuICAgICAgICBncmFjZV9saWZldGltZTogbGlmZXRpbWVzLmdyYWNlLFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXR1cm4gc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBkYXRhLCB7XG4gICAgICBwdXJwb3NlLFxuICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBuZXcgdXNlciBzZXNzaW9uIChtYW5hZ2VtZW50IGFuZC9vciBzaWduaW5nKSB3aG9zZSBsaWZldGltZSBwb3RlbnRpYWxseVxuICAgKiBleHRlbmRzIHRoZSBsaWZldGltZSBvZiB0aGUgY3VycmVudCBzZXNzaW9uLiAgTUZBIGlzIGFsd2F5cyByZXF1aXJlZC5cbiAgICpcbiAgICogQHBhcmFtIHB1cnBvc2UgVGhlIHB1cnBvc2Ugb2YgdGhlIHNlc3Npb25cbiAgICogQHBhcmFtIHNjb3BlcyBTZXNzaW9uIHNjb3Blcy5cbiAgICogQHBhcmFtIGxpZmV0aW1lIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBOZXcgc2lnbmVyIHNlc3Npb24gaW5mby5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25DcmVhdGVFeHRlbmRlZChcbiAgICBwdXJwb3NlOiBzdHJpbmcsXG4gICAgc2NvcGVzOiBTY29wZVtdLFxuICAgIGxpZmV0aW1lOiBTZXNzaW9uTGlmZXRpbWUsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcmVxdWVzdEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgIHNjb3BlcyxcbiAgICAgICAgICBleHRlbmRfbGlmZXRpbWVzOiB0cnVlLFxuICAgICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lLmF1dGgsXG4gICAgICAgICAgcmVmcmVzaF9saWZldGltZTogbGlmZXRpbWUucmVmcmVzaCxcbiAgICAgICAgICBzZXNzaW9uX2xpZmV0aW1lOiBsaWZldGltZS5zZXNzaW9uLFxuICAgICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZS5ncmFjZSxcbiAgICAgICAgfSxcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIG1hcFJlc3BvbnNlKHJlc3AsIChzZXNzaW9uSW5mbykgPT5cbiAgICAgICAgc2lnbmVyU2Vzc2lvbkZyb21TZXNzaW9uSW5mbyh0aGlzLnNlc3Npb25NZXRhLCBzZXNzaW9uSW5mbywge1xuICAgICAgICAgIHB1cnBvc2UsXG4gICAgICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgICAgICB9KSxcbiAgICAgICk7XG4gICAgfTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgcmVxdWVzdEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgc2lnbmVyIHNlc3Npb24gZm9yIGEgZ2l2ZW4gcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHJvbGVJZCBSb2xlIElEXG4gICAqIEBwYXJhbSBwdXJwb3NlIFRoZSBwdXJwb3NlIG9mIHRoZSBzZXNzaW9uXG4gICAqIEBwYXJhbSBzY29wZXMgU2Vzc2lvbiBzY29wZXMuIE5vdCBhbGwgc2NvcGVzIGFyZSB2YWxpZCBmb3IgYSByb2xlLlxuICAgKiBAcGFyYW0gbGlmZXRpbWVzIExpZmV0aW1lIHNldHRpbmdzXG4gICAqIEByZXR1cm5zIE5ldyBzaWduZXIgc2Vzc2lvbiBpbmZvLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkNyZWF0ZUZvclJvbGUoXG4gICAgcm9sZUlkOiBzdHJpbmcsXG4gICAgcHVycG9zZTogc3RyaW5nLFxuICAgIHNjb3Blcz86IFNjb3BlW10sXG4gICAgbGlmZXRpbWVzPzogU2Vzc2lvbkxpZmV0aW1lLFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgbGlmZXRpbWVzID8/PSBkZWZhdWx0U2lnbmVyU2Vzc2lvbkxpZmV0aW1lO1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcm9sZXMve3JvbGVfaWR9L3Rva2Vuc1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyByb2xlX2lkOiByb2xlSWQgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBwdXJwb3NlLFxuICAgICAgICBzY29wZXMsXG4gICAgICAgIGF1dGhfbGlmZXRpbWU6IGxpZmV0aW1lcy5hdXRoLFxuICAgICAgICByZWZyZXNoX2xpZmV0aW1lOiBsaWZldGltZXMucmVmcmVzaCxcbiAgICAgICAgc2Vzc2lvbl9saWZldGltZTogbGlmZXRpbWVzLnNlc3Npb24sXG4gICAgICAgIGdyYWNlX2xpZmV0aW1lOiBsaWZldGltZXMuZ3JhY2UsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHNpZ25lclNlc3Npb25Gcm9tU2Vzc2lvbkluZm8odGhpcy5zZXNzaW9uTWV0YSwgZGF0YSwge1xuICAgICAgcm9sZV9pZDogcm9sZUlkLFxuICAgICAgb3JnX2lkOiB0aGlzLm9yZ0lkLFxuICAgICAgcHVycG9zZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgc2Vzc2lvbiBieSBpZC5cbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb25JZCBUaGUgSUQgb2YgdGhlIHNlc3Npb24gdG8gcmV0cmlldmUuIFRoaXMgc2Vzc2lvbiBieSBkZWZhdWx0XG4gICAqIEByZXR1cm5zIFJlcXVlc3RlZCBzZXNzaW9uIG1ldGFkYXRhLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbkdldChzZXNzaW9uSWQ/OiBzdHJpbmcpOiBQcm9taXNlPFNlc3Npb25JbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zZXNzaW9uL3tzZXNzaW9uX2lkfVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IHNlc3Npb25faWQ6IHNlc3Npb25JZCA/PyBcInNlbGZcIiB9IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV2b2tlIGEgc2Vzc2lvbi5cbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb25JZCBUaGUgSUQgb2YgdGhlIHNlc3Npb24gdG8gcmV2b2tlLiBUaGlzIHNlc3Npb24gYnkgZGVmYXVsdFxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvblJldm9rZShzZXNzaW9uSWQ/OiBzdHJpbmcpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb24ve3Nlc3Npb25faWR9XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBzZXNzaW9uX2lkOiBzZXNzaW9uSWQgPz8gXCJzZWxmXCIgfSB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldm9rZSBhbGwgc2Vzc2lvbnMuXG4gICAqXG4gICAqIEBwYXJhbSBzZWxlY3RvciBXaGljaCBzZXNzaW9ucyB0byByZXZva2UuIElmIG5vdCBkZWZpbmVkLCBhbGwgdGhlIGN1cnJlbnQgdXNlcidzIHNlc3Npb25zIHdpbGwgYmUgcmV2b2tlZC5cbiAgICovXG4gIGFzeW5jIHNlc3Npb25SZXZva2VBbGwoc2VsZWN0b3I/OiBTZXNzaW9uU2VsZWN0b3IpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3Nlc3Npb25cIiwgXCJkZWxldGVcIik7XG4gICAgY29uc3QgcXVlcnkgPSB0eXBlb2Ygc2VsZWN0b3IgPT09IFwic3RyaW5nXCIgPyB7IHJvbGU6IHNlbGVjdG9yIH0gOiBzZWxlY3RvcjtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHF1ZXJ5IH0sXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIHBhZ2luYXRvciBmb3IgaXRlcmF0aW5nIG92ZXIgYWxsIHNpZ25lciBzZXNzaW9ucyBvcHRpb25hbGx5IGZpbHRlcmVkIGJ5IGEgcm9sZS5cbiAgICpcbiAgICogQHBhcmFtIHNlbGVjdG9yIElmIHNldCwgbGltaXQgdG8gc2Vzc2lvbnMgZm9yIGEgc3BlY2lmaWVkIHVzZXIgb3IgYSByb2xlLlxuICAgKiBAcGFyYW0gcGFnZSBQYWdpbmF0aW9uIG9wdGlvbnMuIERlZmF1bHRzIHRvIGZldGNoaW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICogQHJldHVybnMgU2lnbmVyIHNlc3Npb25zIGZvciB0aGlzIHJvbGUuXG4gICAqL1xuICBzZXNzaW9uc0xpc3QoXG4gICAgc2VsZWN0b3I/OiBTZXNzaW9uU2VsZWN0b3IsXG4gICAgcGFnZT86IFBhZ2VPcHRzLFxuICApOiBQYWdpbmF0b3I8U2Vzc2lvbnNSZXNwb25zZSwgU2Vzc2lvbkluZm9bXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vc2Vzc2lvblwiLCBcImdldFwiKTtcbiAgICBjb25zdCBzZWxlY3RvclF1ZXJ5ID0gdHlwZW9mIHNlbGVjdG9yID09PSBcInN0cmluZ1wiID8geyByb2xlOiBzZWxlY3RvciB9IDogc2VsZWN0b3I7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBxdWVyeTogeyAuLi5zZWxlY3RvclF1ZXJ5LCAuLi5xdWVyeSB9IH0gfSksXG4gICAgICAocikgPT4gci5zZXNzaW9ucyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHVybnMgdGhlIGxpc3Qgb2Yga2V5cyB0aGF0IHRoaXMgc2Vzc2lvbiBoYXMgYWNjZXNzIHRvLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGlzdCBvZiBrZXlzLlxuICAgKi9cbiAgYXN5bmMgc2Vzc2lvbktleXNMaXN0KCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS90b2tlbi9rZXlzXCIsIFwiZ2V0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIElERU5USVRZOiBpZGVudGl0eVByb3ZlLCBpZGVudGl0eVZlcmlmeSwgaWRlbnRpdHlBZGQsIGlkZW50aXR5UmVtb3ZlLCBpZGVudGl0eUxpc3RcblxuICAvKipcbiAgICogT2J0YWluIHByb29mIG9mIGF1dGhlbnRpY2F0aW9uIHVzaW5nIHRoZSBjdXJyZW50IEN1YmVTaWduZXIgc2Vzc2lvbi5cbiAgICpcbiAgICogQHJldHVybnMgUHJvb2Ygb2YgYXV0aGVudGljYXRpb25cbiAgICovXG4gIGFzeW5jIGlkZW50aXR5UHJvdmUoKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZVwiLCBcInBvc3RcIik7XG5cbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDaGVja3MgaWYgYSBnaXZlbiBpZGVudGl0eSBwcm9vZiBpcyB2YWxpZC5cbiAgICpcbiAgICogQHBhcmFtIHByb29mIFRoZSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICogQHRocm93cyBBbiBlcnJvciBpZiBwcm9vZiBpcyBpbnZhbGlkXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVZlcmlmeShwcm9vZjogSWRlbnRpdHlQcm9vZikge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaWRlbnRpdHkvdmVyaWZ5XCIsIFwicG9zdFwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgYm9keTogcHJvb2YsXG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQXNzb2NpYXRlcyBhbiBPSURDIGlkZW50aXR5IHdpdGggdGhlIGN1cnJlbnQgdXNlcidzIGFjY291bnQuXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHksIGNvbnRhaW5pbmcgYW4gT0lEQyB0b2tlbiB0byBwcm92ZSB0aGUgaWRlbnRpdHkgb3duZXJzaGlwLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBFbXB0eSBvciBNRkEgYXBwcm92YWwgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgaWRlbnRpdHlBZGQoXG4gICAgYm9keTogQWRkSWRlbnRpdHlSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcmVxRm4gPSAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PiB0aGlzLmV4ZWMobywgeyBib2R5LCBoZWFkZXJzIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCByZXFGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUmVtb3ZlcyBhbiBPSURDIGlkZW50aXR5IGZyb20gdGhlIGN1cnJlbnQgdXNlcidzIGFjY291bnQuXG4gICAqXG4gICAqIEBwYXJhbSBib2R5IFRoZSBpZGVudGl0eSB0byByZW1vdmUuXG4gICAqL1xuICBhc3luYyBpZGVudGl0eVJlbW92ZShib2R5OiBPaWRjSWRlbnRpdHkpIHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkZW50aXR5XCIsIFwiZGVsZXRlXCIpO1xuICAgIGF3YWl0IHRoaXMuZXhlYyhvLCB7IGJvZHkgfSk7XG4gIH1cblxuICAvKipcbiAgICogTGlzdHMgYXNzb2NpYXRlZCBPSURDIGlkZW50aXRpZXMgd2l0aCB0aGUgY3VycmVudCB1c2VyLlxuICAgKlxuICAgKiBAcmV0dXJucyBBc3NvY2lhdGVkIGlkZW50aXRpZXNcbiAgICovXG4gIGFzeW5jIGlkZW50aXR5TGlzdCgpOiBQcm9taXNlPExpc3RJZGVudGl0eVJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIE1GQTogbWZhR2V0LCBtZmFMaXN0LCBtZmFBcHByb3ZlLCBtZmFMaXN0LCBtZmFBcHByb3ZlLCBtZmFBcHByb3ZlVG90cCwgbWZhQXBwcm92ZUZpZG8oSW5pdHxDb21wbGV0ZSksIG1mYVZvdGVFbWFpbChJbml0fENvbXBsZXRlKVxuXG4gIC8qKlxuICAgKiBSZXRyaWV2ZXMgZXhpc3RpbmcgTUZBIHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcmV0dXJucyBNRkEgcmVxdWVzdCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbWZhR2V0KG1mYUlkOiBzdHJpbmcpOiBQcm9taXNlPE1mYVJlcXVlc3RJbmZvPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH1cIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMaXN0IHBlbmRpbmcgTUZBIHJlcXVlc3RzIGFjY2Vzc2libGUgdG8gdGhlIGN1cnJlbnQgdXNlci5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIE1GQSByZXF1ZXN0cy5cbiAgICovXG4gIGFzeW5jIG1mYUxpc3QoKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmFcIiwgXCJnZXRcIik7XG5cbiAgICBjb25zdCB7IG1mYV9yZXF1ZXN0cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgICByZXR1cm4gbWZhX3JlcXVlc3RzO1xuICB9XG5cbiAgLyoqXG4gICAqIEFwcHJvdmUgb3IgcmVqZWN0IGEgcGVuZGluZyBNRkEgcmVxdWVzdCB1c2luZyB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgKlxuICAgKiBAcGFyYW0gbWZhSWQgVGhlIGlkIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKiBAcGFyYW0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIHJlc3VsdCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICovXG4gIGFzeW5jIG1mYVZvdGVDcyhtZmFJZDogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9XCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBcHByb3ZlIG9yIHJlamVjdCBhIHBlbmRpbmcgTUZBIHJlcXVlc3QgdXNpbmcgVE9UUC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBJRCBvZiB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHBhcmFtIGNvZGUgVGhlIFRPVFAgY29kZVxuICAgKiBAcGFyYW0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdFxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZVRvdHAobWZhSWQ6IHN0cmluZywgY29kZTogc3RyaW5nLCBtZmFWb3RlOiBNZmFWb3RlKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L3RvdHBcIiwgXCJwYXRjaFwiKTtcblxuICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9LCBxdWVyeTogeyBtZmFfdm90ZTogbWZhVm90ZSB9IH0sXG4gICAgICBib2R5OiB7IGNvZGUgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBhcHByb3ZhbCBvZiBhbiBleGlzdGluZyBNRkEgcmVxdWVzdCB1c2luZyBGSURPLiBBIGNoYWxsZW5nZSBpc1xuICAgKiByZXR1cm5lZCB3aGljaCBtdXN0IGJlIGFuc3dlcmVkIHZpYSB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5hbnN3ZXJ9IG9yIHtAbGluayBtZmFWb3RlRmlkb0NvbXBsZXRlfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRC5cbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBtZmFGaWRvSW5pdChtZmFJZDogc3RyaW5nKTogUHJvbWlzZTxNZmFGaWRvQ2hhbGxlbmdlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZmlkb1wiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBjaGFsbGVuZ2UgPSBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgbWZhX2lkOiBtZmFJZCB9IH0sXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IE1mYUZpZG9DaGFsbGVuZ2UodGhpcywgbWZhSWQsIGNoYWxsZW5nZSk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSBwcmV2aW91c2x5IGluaXRpYXRlZCAodmlhIHtAbGluayBtZmFGaWRvSW5pdH0pIE1GQSByZXF1ZXN0IHVzaW5nIEZJRE8uXG4gICAqXG4gICAqIEluc3RlYWQgb2YgY2FsbGluZyB0aGlzIG1ldGhvZCBkaXJlY3RseSwgcHJlZmVyIHtAbGluayBNZmFGaWRvQ2hhbGxlbmdlLmFuc3dlcn0gb3JcbiAgICoge0BsaW5rIE1mYUZpZG9DaGFsbGVuZ2UuY3JlYXRlQ3JlZGVudGlhbEFuZEFuc3dlcn0uXG4gICAqXG4gICAqIEBwYXJhbSBtZmFJZCBUaGUgTUZBIHJlcXVlc3QgSURcbiAgICogQHBhcmFtIG1mYVZvdGUgQXBwcm92ZSBvciByZWplY3QgdGhlIE1GQSByZXF1ZXN0XG4gICAqIEBwYXJhbSBjaGFsbGVuZ2VJZCBUaGUgSUQgb2YgdGhlIGNoYWxsZW5nZSBpc3N1ZWQgYnkge0BsaW5rIG1mYUZpZG9Jbml0fVxuICAgKiBAcGFyYW0gY3JlZGVudGlhbCBUaGUgYW5zd2VyIHRvIHRoZSBjaGFsbGVuZ2VcbiAgICogQHJldHVybnMgVGhlIGN1cnJlbnQgc3RhdHVzIG9mIHRoZSBNRkEgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIG1mYVZvdGVGaWRvQ29tcGxldGUoXG4gICAgbWZhSWQ6IHN0cmluZyxcbiAgICBtZmFWb3RlOiBNZmFWb3RlLFxuICAgIGNoYWxsZW5nZUlkOiBzdHJpbmcsXG4gICAgY3JlZGVudGlhbDogUHVibGljS2V5Q3JlZGVudGlhbCxcbiAgKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2ZpZG9cIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHtcbiAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1mYV9pZDogbWZhSWQgfSwgcXVlcnk6IHsgbWZhX3ZvdGU6IG1mYVZvdGUgfSB9LFxuICAgICAgYm9keToge1xuICAgICAgICBjaGFsbGVuZ2VfaWQ6IGNoYWxsZW5nZUlkLFxuICAgICAgICBjcmVkZW50aWFsLFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbml0aWF0ZSBNRkEgYXBwcm92YWwgdmlhIGVtYWlsIE9UUC5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0gbWZhVm90ZSBBcHByb3ZlIG9yIHJlamVjdCB0aGUgTUZBIHJlcXVlc3RcbiAgICogQHJldHVybnMgQSBjaGFsbGVuZ2UgdGhhdCBuZWVkcyB0byBiZSBhbnN3ZXJlZCB0byBjb21wbGV0ZSB0aGUgYXBwcm92YWwuXG4gICAqL1xuICBhc3luYyBtZmFWb3RlRW1haWxJbml0KG1mYUlkOiBzdHJpbmcsIG1mYVZvdGU6IE1mYVZvdGUpOiBQcm9taXNlPE1mYUVtYWlsQ2hhbGxlbmdlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tZmEve21mYV9pZH0vZW1haWxcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGNoYWxsZW5nZSA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0sIHF1ZXJ5OiB7IG1mYV92b3RlOiBtZmFWb3RlIH0gfSxcbiAgICB9KTtcbiAgICByZXR1cm4gbmV3IE1mYUVtYWlsQ2hhbGxlbmdlKHRoaXMsIG1mYUlkLCBjaGFsbGVuZ2UpO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGEgcHJldmlvdXNseSBpbml0aWF0ZWQgKHZpYSB7QGxpbmsgbWZhVm90ZUVtYWlsSW5pdH0pIE1GQSB2b3RlIHJlcXVlc3QgdXNpbmcgZW1haWwgT1RQLlxuICAgKlxuICAgKiBJbnN0ZWFkIG9mIGNhbGxpbmcgdGhpcyBtZXRob2QgZGlyZWN0bHksIHByZWZlciB7QGxpbmsgTWZhRW1haWxDaGFsbGVuZ2UuYW5zd2VyfSBvclxuICAgKiB7QGxpbmsgTWZhRmlkb0NoYWxsZW5nZS5jcmVhdGVDcmVkZW50aWFsQW5kQW5zd2VyfS5cbiAgICpcbiAgICogQHBhcmFtIG1mYUlkIFRoZSBNRkEgcmVxdWVzdCBJRFxuICAgKiBAcGFyYW0gcGFydGlhbFRva2VuIFRoZSBwYXJ0aWFsIHRva2VuIHJldHVybmVkIGJ5IHtAbGluayBtZmFWb3RlRW1haWxJbml0fVxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIFRoZSBvbmUtdGltZSBjb2RlIChzaWduYXR1cmUgaW4gdGhpcyBjYXNlKSBzZW50IHZpYSBlbWFpbFxuICAgKiBAcmV0dXJucyBUaGUgY3VycmVudCBzdGF0dXMgb2YgdGhlIE1GQSByZXF1ZXN0LlxuICAgKi9cbiAgYXN5bmMgbWZhVm90ZUVtYWlsQ29tcGxldGUoXG4gICAgbWZhSWQ6IHN0cmluZyxcbiAgICBwYXJ0aWFsVG9rZW46IHN0cmluZyxcbiAgICBzaWduYXR1cmU6IHN0cmluZyxcbiAgKTogUHJvbWlzZTxNZmFSZXF1ZXN0SW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbWZhL3ttZmFfaWR9L2VtYWlsXCIsIFwicGF0Y2hcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7XG4gICAgICBwYXJhbXM6IHsgcGF0aDogeyBtZmFfaWQ6IG1mYUlkIH0gfSxcbiAgICAgIGJvZHk6IHsgdG9rZW46IGAke3BhcnRpYWxUb2tlbn0ke3NpZ25hdHVyZX1gIH0sXG4gICAgfSk7XG4gIH1cblxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBTSUdOOiBzaWduRXZtLCBzaWduRXRoMiwgc2lnblN0YWtlLCBzaWduVW5zdGFrZSwgc2lnbkF2YSwgc2lnblNlcmlhbGl6ZWRBdmEsIHNpZ25CbG9iLCBzaWduQnRjLCBzaWduVGFwcm9vdCwgc2lnblNvbGFuYSwgc2lnbkVvdHMsIGVvdHNDcmVhdGVOb25jZSwgc2lnbk1taSwgc2lnblN1aVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEVWTSB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRXZtKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXZtU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdm1TaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgxL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIEVJUC0xOTEgdHlwZWQgZGF0YS5cbiAgICpcbiAgICogVGhpcyByZXF1aXJlcyB0aGUga2V5IHRvIGhhdmUgYSAnXCJBbGxvd0VpcDE5MVNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBTaWduYXR1cmUgKG9yIE1GQSBhcHByb3ZhbCByZXF1ZXN0KS5cbiAgICovXG4gIGFzeW5jIHNpZ25FaXAxOTEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBFaXAxOTFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEVpcDE5MU9yNzEyU2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZXZtL2VpcDE5MS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcblxuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBFSVAtNzEyIHR5cGVkIGRhdGEuXG4gICAqXG4gICAqIFRoaXMgcmVxdWlyZXMgdGhlIGtleSB0byBoYXZlIGEgJ1wiQWxsb3dFaXA3MTJTaWduaW5nXCInIHtAbGluayBLZXlQb2xpY3l9LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgU2lnbmF0dXJlIChvciBNRkEgYXBwcm92YWwgcmVxdWVzdCkuXG4gICAqL1xuICBhc3luYyBzaWduRWlwNzEyKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRWlwNzEyU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFaXAxOTFPcjcxMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2V2bS9laXA3MTIvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG5cbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdmFsaWRhdGlvbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBTaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25FdGgyKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRXRoMlNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RXRoMlNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGFuIEV0aDIvQmVhY29uLWNoYWluIGRlcG9zaXQgKG9yIHN0YWtpbmcpIG1lc3NhZ2UuXG4gICAqXG4gICAqIEBwYXJhbSByZXEgVGhlIHJlcXVlc3QgdG8gc2lnbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdGFrZShcbiAgICByZXE6IEV0aDJTdGFrZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFdGgyU3Rha2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2V0aDIvc3Rha2VcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHNpZ24gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ24sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYW4gRXRoMi9CZWFjb24tY2hhaW4gdW5zdGFrZS9leGl0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFRoZSByZXF1ZXN0IHRvIHNpZ24uXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpLlxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduVW5zdGFrZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEV0aDJVbnN0YWtlUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEV0aDJVbnN0YWtlUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ldGgyL3Vuc3Rha2Uve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhbiBBdmFsYW5jaGUgUC0gb3IgWC1jaGFpbiBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHR4IEF2YWxhbmNoZSBtZXNzYWdlICh0cmFuc2FjdGlvbikgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQXZhKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHR4OiBBdmFUeCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEF2YVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2F2YS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IDxBdmFTaWduUmVxdWVzdD57XG4gICAgICAgICAgdHg6IHR4IGFzIHVua25vd24sXG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgc2VyaWFsaXplZCBBdmFsYW5jaGUgQy0sIFAtLCBvciBYLWNoYWluIG1lc3NhZ2UuIFNlZSBbdGhlIEF2YWxhbmNoZVxuICAgKiBkb2N1bWVudGF0aW9uXShodHRwczovL2RvY3MuYXZheC5uZXR3b3JrL3JlZmVyZW5jZS9zdGFuZGFyZHMvc2VyaWFsaXphdGlvbi1wcmltaXRpdmVzKVxuICAgKiBmb3IgdGhlIHNwZWNpZmljYXRpb24gb2YgdGhlIHNlcmlhbGl6YXRpb24gZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIGF2YUNoYWluIEF2YWxhbmNoZSBjaGFpblxuICAgKiBAcGFyYW0gdHggSGV4IGVuY29kZWQgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblNlcmlhbGl6ZWRBdmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgYXZhQ2hhaW46IEF2YUNoYWluLFxuICAgIHR4OiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxBdmFTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdmEvc2lnbi97YXZhX2NoYWlufS97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBhdmFfY2hhaW46IGF2YUNoYWluLCBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiA8QXZhU2VyaWFsaXplZFR4U2lnblJlcXVlc3Q+e1xuICAgICAgICAgIHR4LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIHJhdyBibG9iLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhICdcIkFsbG93UmF3QmxvYlNpZ25pbmdcIicge0BsaW5rIEtleVBvbGljeX0uIFRoaXMgaXMgYmVjYXVzZVxuICAgKiBzaWduaW5nIGFyYml0cmFyeSBtZXNzYWdlcyBpcywgaW4gZ2VuZXJhbCwgZGFuZ2Vyb3VzIChhbmQgeW91IHNob3VsZCBpbnN0ZWFkXG4gICAqIHByZWZlciB0eXBlZCBlbmQtcG9pbnRzIGFzIHVzZWQgYnksIGZvciBleGFtcGxlLCB7QGxpbmsgc2lnbkV2bX0pLiBGb3IgU2VjcDI1NmsxIGtleXMsXG4gICAqIGZvciBleGFtcGxlLCB5b3UgKiptdXN0KiogY2FsbCB0aGlzIGZ1bmN0aW9uIHdpdGggYSBtZXNzYWdlIHRoYXQgaXMgMzIgYnl0ZXMgbG9uZyBhbmRcbiAgICogdGhlIG91dHB1dCBvZiBhIHNlY3VyZSBoYXNoIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgc2lnbmF0dXJlcyBzZXJpYWxpemVkIGFzO1xuICAgKlxuICAgKiAtIEVDRFNBIHNpZ25hdHVyZXMgYXJlIHNlcmlhbGl6ZWQgYXMgYmlnLWVuZGlhbiByIGFuZCBzIHBsdXMgcmVjb3ZlcnktaWRcbiAgICogICAgYnl0ZSB2LCB3aGljaCBjYW4gaW4gZ2VuZXJhbCB0YWtlIGFueSBvZiB0aGUgdmFsdWVzIDAsIDEsIDIsIG9yIDMuXG4gICAqXG4gICAqIC0gRWREU0Egc2lnbmF0dXJlcyBhcmUgc2VyaWFsaXplZCBpbiB0aGUgc3RhbmRhcmQgZm9ybWF0LlxuICAgKlxuICAgKiAtIEJMUyBzaWduYXR1cmVzIGFyZSBub3Qgc3VwcG9ydGVkIG9uIHRoZSBibG9iLXNpZ24gZW5kcG9pbnQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduQmxvYihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJsb2JTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJsb2JTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YxL29yZy97b3JnX2lkfS9ibG9iL3NpZ24ve2tleV9pZH1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsga2V5X2lkIH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogUGVyZm9ybSBhIERpZmZpZS1IZWxsbWFuIGV4Y2hhbmdlLlxuICAgKlxuICAgKiBUaGlzIHJlcXVpcmVzIHRoZSBrZXkgdG8gaGF2ZSBhIGBcIkFsbG93RGlmZmllSGVsbG1hbkV4Y2hhbmdlXCInIHtAbGluayBLZXlQb2xpY3l9LiBUaGlzIGlzXG4gICAqIGJlY2F1c2UgcGVyZm9ybWluZyBhcmJpdHJhcnkgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2VzIGlzLCBpbiBnZW5lcmFsLFxuICAgKiBkYW5nZXJvdXMgKGFuZCB5b3Ugc2hvdWxkIG9ubHkgdXNlIHRoaXMgQVBJIGlmIHlvdSBhcmUgMTAwJSBzdXJlIHlvdVxuICAgKiBrbm93IHdoYXQgeW91IGFyZSBkb2luZyEpLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIHJhdyByZXNwb25zZS4gSWYgdGhlIG9yaWdpbmFsIHJlcXVlc3QgaW5jbHVkZWRcbiAgICogYSBwdWJsaWMga2V5IGZvciBlbmNyeXB0aW9uLCB0aGUgcmVzcG9uc2UgY2FuIGJlIGRlY3J5cHRlZCB1c2luZyB0aGVcbiAgICogYGRpZmZpZUhlbGxtYW5EZWNyeXB0YCBoZWxwZXIgZnVuY3Rpb24uIE90aGVyd2lzZSwgdGhlIHJlc3BvbnNlIHdpbGxcbiAgICogY29udGFpbiBiYXNlNjQtZW5jb2RlZCBzZXJpYWxpemVkIHB1YmxpYyBrZXlzIGluIGEga2V5LXR5cGUtLXNwZWNpZmljXG4gICAqIGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHVzZSBmb3IgRGlmZmllLUhlbGxtYW4gZXhjaGFuZ2UgKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFRoZSBEaWZmaWUtSGVsbG1hbiByZXF1ZXN0IHRvIHNlbmQuXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIGRpZmZpZUhlbGxtYW5FeGNoYW5nZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IERpZmZpZUhlbGxtYW5SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RGlmZmllSGVsbG1hblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vZGlmZmllX2hlbGxtYW4ve2tleV9pZH1cIiwgXCJwb3N0XCIpO1xuXG4gICAgY29uc3Qga2V5X2lkID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5pZDtcbiAgICBjb25zdCBkaEZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IGtleV9pZCB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBkaEZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgQml0Y29pbiB0cmFuc2FjdGlvbiBpbnB1dC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGMoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCdGNTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJ0Y1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBCaXRjb2luIEJJUC0xMzcgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CdGNNZXNzYWdlKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogQnRjTWVzc2FnZVNpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8QnRjTWVzc2FnZVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2J0Yy9tZXNzYWdlL3NpZ24ve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIFRhcHJvb3QgdHJhbnNhY3Rpb24gaW5wdXQuXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byBzaWduIHdpdGggKGVpdGhlciB7QGxpbmsgS2V5fSBvciBpdHMgbWF0ZXJpYWwgSUQpLlxuICAgKiBAcGFyYW0gcmVxIFdoYXQgdG8gc2lnblxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgcmVzcG9uc2UuXG4gICAqL1xuICBhc3luYyBzaWduVGFwcm9vdChcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IFRhcHJvb3RTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFRhcHJvb3RTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9idGMvdGFwcm9vdC9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBQU0JULlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnblBzYnQoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBQc2J0U2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxQc2J0U2lnblJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYnRjL3BzYnQvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBib2R5OiByZXEsXG4gICAgICAgIGhlYWRlcnM6IGhlYWRlcnMsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhbiBFeHRyYWN0YWJsZSBPbmUtVGltZSBTaWduYXR1cmVcbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Fb3RzKFxuICAgIGtleTogS2V5IHwgc3RyaW5nLFxuICAgIHJlcTogRW90c1NpZ25SZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW90c1NpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIHNldCBvZiBCYWJ5bG9uIEVPVFMgbm9uY2VzIGZvciBhIHNwZWNpZmllZCBjaGFpbi1pZCwgc3RhcnRpbmcgYXQgYSBzcGVjaWZpZWQgYmxvY2sgaGVpZ2h0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IGFuZCBob3cgbWFueSBub25jZXMgdG8gY3JlYXRlXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIGVvdHNDcmVhdGVOb25jZShcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEVvdHNDcmVhdGVOb25jZVJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFb3RzQ3JlYXRlTm9uY2VSZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vZW90cy9ub25jZXMve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyB0cmFuc2FjdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuIEZvciBhIGRlcG9zaXQsIHRoaXMgY2FuIGJlIGVpdGhlciBhIFNlZ3dpdCBvciBhIFRhcHJvb3Qga2V5LiBGb3IgYW55IG90aGVyIHJlcXVlc3QgdHlwZSwgdGhpcyBqdXN0IGJlIGEgVGFwcm9vdCBrZXkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25CYWJ5bG9uU3Rha2luZ1R4bihcbiAgICBrZXk6IEtleSB8IHN0cmluZyxcbiAgICByZXE6IEJhYnlsb25TdGFraW5nUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25TdGFraW5nUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9iYWJ5bG9uL3N0YWtpbmcve3B1YmtleX1cIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHB1YmtleSA9IHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIgPyAoa2V5IGFzIHN0cmluZykgOiBrZXkubWF0ZXJpYWxJZDtcbiAgICBjb25zdCBzaWduRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgcHVia2V5IH0gfSxcbiAgICAgICAgYm9keTogcmVxLFxuICAgICAgICBoZWFkZXJzOiBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogU2lnbiBhIEJhYnlsb24gc3Rha2luZyByZWdpc3RyYXRpb24gcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUgVGFwcm9vdCBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcSBXaGF0IHRvIHNpZ25cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgc2lnbkJhYnlsb25SZWdpc3RyYXRpb24oXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBCYWJ5bG9uUmVnaXN0cmF0aW9uUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPEJhYnlsb25SZWdpc3RyYXRpb25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2JhYnlsb24vcmVnaXN0cmF0aW9uL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBTb2xhbmEgbWVzc2FnZS5cbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUga2V5IHRvIHNpZ24gd2l0aCAoZWl0aGVyIHtAbGluayBLZXl9IG9yIGl0cyBtYXRlcmlhbCBJRCkuXG4gICAqIEBwYXJhbSByZXEgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25Tb2xhbmEoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxOiBTb2xhbmFTaWduUmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q3ViZVNpZ25lclJlc3BvbnNlPFNvbGFuYVNpZ25SZXNwb25zZT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3NvbGFuYS9zaWduL3twdWJrZXl9XCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCBwdWJrZXkgPSB0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiID8gKGtleSBhcyBzdHJpbmcpIDoga2V5Lm1hdGVyaWFsSWQ7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IHB1YmtleSB9IH0sXG4gICAgICAgIGJvZHk6IHJlcSxcbiAgICAgICAgaGVhZGVyczogaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIHJldHVybiBhd2FpdCBDdWJlU2lnbmVyUmVzcG9uc2UuY3JlYXRlKHRoaXMuZW52LCBzaWduRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNpZ24gYSBNTUkgcGVuZGluZyBtZXNzYWdlLlxuICAgKlxuICAgKiBAcGFyYW0gbWVzc2FnZSB0aGUgbWVzc2FnZSBpbmZvLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBvcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgdGhlIHVwZGF0ZWQgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIHNpZ25NbWkoXG4gICAgbWVzc2FnZTogUGVuZGluZ01lc3NhZ2VJbmZvLFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8UGVuZGluZ01lc3NhZ2VTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH0vc2lnblwiLCBcInBvc3RcIik7XG4gICAgY29uc3Qgc2lnbkZuID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT5cbiAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgIHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbWVzc2FnZS5pZCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICAgIGJvZHk6IG1lc3NhZ2UsXG4gICAgICB9KTtcbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgc2lnbkZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTaWduIGEgU1VJIHRyYW5zYWN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gc2lnbiB3aXRoIChlaXRoZXIge0BsaW5rIEtleX0gb3IgaXRzIG1hdGVyaWFsIElEKS5cbiAgICogQHBhcmFtIHJlcXVlc3QgV2hhdCB0byBzaWduXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHNpZ25TdWkoXG4gICAga2V5OiBLZXkgfCBzdHJpbmcsXG4gICAgcmVxdWVzdDogU3VpU2lnblJlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTdWlTaWduUmVzcG9uc2U+PiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9zdWkvc2lnbi97cHVia2V5fVwiLCBcInBvc3RcIik7XG4gICAgY29uc3QgcHVia2V5ID0gdHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIiA/IChrZXkgYXMgc3RyaW5nKSA6IGtleS5tYXRlcmlhbElkO1xuICAgIGNvbnN0IHNpZ25GbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBwdWJrZXkgfSB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiByZXF1ZXN0LFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHNpZ25GbiwgbWZhUmVjZWlwdCk7XG4gIH1cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gVVNFUiBFWFBPUlQ6IHVzZXJFeHBvcnQoSW5pdCxDb21wbGV0ZSxMaXN0LERlbGV0ZSlcbiAgLyoqXG4gICAqIExpc3Qgb3V0c3RhbmRpbmcgdXNlci1leHBvcnQgcmVxdWVzdHMuXG4gICAqXG4gICAqIEBwYXJhbSBrZXlJZCBPcHRpb25hbCBrZXkgSUQuIElmIHN1cHBsaWVkLCBsaXN0IHRoZSBvdXRzdGFuZGluZyByZXF1ZXN0IChpZiBhbnkpIG9ubHkgZm9yIHRoZSBzcGVjaWZpZWQga2V5OyBvdGhlcndpc2UsIGxpc3QgYWxsIG91dHN0YW5kaW5nIHJlcXVlc3RzIGZvciB0aGUgc3BlY2lmaWVkIHVzZXIuXG4gICAqIEBwYXJhbSB1c2VySWQgT3B0aW9uYWwgdXNlciBJRC4gSWYgb210dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBsaXN0IHVzZXItZXhwb3J0IHJlcXVlc3RzIGZvciB1c2VycyBvdGhlciB0aGFuIHRoZW1zZWx2ZXMuXG4gICAqIEBwYXJhbSBwYWdlIFBhZ2luYXRpb24gb3B0aW9ucy4gRGVmYXVsdHMgdG8gZmV0Y2hpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3IgZm9yIGl0ZXJhdGluZyBvdmVyIHRoZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgdXNlckV4cG9ydExpc3QoXG4gICAga2V5SWQ/OiBzdHJpbmcsXG4gICAgdXNlcklkPzogc3RyaW5nLFxuICAgIHBhZ2U/OiBQYWdlT3B0cyxcbiAgKTogUGFnaW5hdG9yPFVzZXJFeHBvcnRMaXN0UmVzcG9uc2UsIFVzZXJFeHBvcnRJbml0UmVzcG9uc2VbXT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIFBhZ2luYXRvci5pdGVtcyhcbiAgICAgIHBhZ2UgPz8gUGFnZS5kZWZhdWx0KCksXG4gICAgICAocXVlcnkpID0+XG4gICAgICAgIHRoaXMuZXhlYyhvLCB7XG4gICAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBxdWVyeToge1xuICAgICAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgICAgIC4uLnF1ZXJ5LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9KSxcbiAgICAgIChyKSA9PiByLmV4cG9ydF9yZXF1ZXN0cyxcbiAgICAgIChyKSA9PiByLmxhc3RfZXZhbHVhdGVkX2tleSxcbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBvdXRzdGFuZGluZyB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBjb3JyZXNwb25kaW5nIHRvIHRoZSB1c2VyLWV4cG9ydCByZXF1ZXN0IHRvIGRlbGV0ZS5cbiAgICogQHBhcmFtIHVzZXJJZCBPcHRpb25hbCB1c2VyIElELiBJZiBvbWl0dGVkLCB1c2VzIHRoZSBjdXJyZW50IHVzZXIncyBJRC4gT25seSBvcmcgb3duZXJzIGNhbiBkZWxldGUgdXNlci1leHBvcnQgcmVxdWVzdHMgZm9yIHVzZXJzIG90aGVyIHRoYW4gdGhlbXNlbHZlcy5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnREZWxldGUoa2V5SWQ6IHN0cmluZywgdXNlcklkPzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS91c2VyL21lL2V4cG9ydFwiLCBcImRlbGV0ZVwiKTtcbiAgICBhd2FpdCB0aGlzLmV4ZWMobywge1xuICAgICAgcGFyYW1zOiB7XG4gICAgICAgIHF1ZXJ5OiB7XG4gICAgICAgICAga2V5X2lkOiBrZXlJZCxcbiAgICAgICAgICB1c2VyX2lkOiB1c2VySWQsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGEgdXNlci1leHBvcnQgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIGtleUlkIFRoZSBrZXktaWQgZm9yIHdoaWNoIHRvIGluaXRpYXRlIGFuIGV4cG9ydC5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocykuXG4gICAqIEByZXR1cm5zIFRoZSByZXNwb25zZS5cbiAgICovXG4gIGFzeW5jIHVzZXJFeHBvcnRJbml0KFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0SW5pdFJlc3BvbnNlPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vdXNlci9tZS9leHBvcnRcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IGluaXRGbiA9IGFzeW5jIChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIHJldHVybiB0aGlzLmV4ZWMobywge1xuICAgICAgICBib2R5OiB7IGtleV9pZDoga2V5SWQgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGluaXRGbiwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvKipcbiAgICogQ29tcGxldGUgYSB1c2VyLWV4cG9ydCByZXF1ZXN0LlxuICAgKlxuICAgKiBAcGFyYW0ga2V5SWQgVGhlIGtleS1pZCBmb3Igd2hpY2ggdG8gaW5pdGlhdGUgYW4gZXhwb3J0LlxuICAgKiBAcGFyYW0gcHVibGljS2V5IFRoZSBOSVNUIFAtMjU2IHB1YmxpYyBrZXkgdG8gd2hpY2ggdGhlIGV4cG9ydCB3aWxsIGJlIGVuY3J5cHRlZC4gVGhpcyBzaG91bGQgYmUgdGhlIGBwdWJsaWNLZXlgIHByb3BlcnR5IG9mIGEgdmFsdWUgcmV0dXJuZWQgYnkgYHVzZXJFeHBvcnRLZXlnZW5gLlxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKS5cbiAgICogQHJldHVybnMgVGhlIHJlc3BvbnNlLlxuICAgKi9cbiAgYXN5bmMgdXNlckV4cG9ydENvbXBsZXRlKFxuICAgIGtleUlkOiBzdHJpbmcsXG4gICAgcHVibGljS2V5OiBDcnlwdG9LZXksXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxVc2VyRXhwb3J0Q29tcGxldGVSZXNwb25zZT4+IHtcbiAgICAvLyBiYXNlNjQtZW5jb2RlIHRoZSBwdWJsaWMga2V5XG4gICAgY29uc3Qgc3VidGxlID0gYXdhaXQgbG9hZFN1YnRsZUNyeXB0bygpO1xuICAgIGNvbnN0IHB1YmxpY0tleUI2NCA9IGVuY29kZVRvQmFzZTY0KGF3YWl0IHN1YnRsZS5leHBvcnRLZXkoXCJyYXdcIiwgcHVibGljS2V5KSk7XG5cbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L3VzZXIvbWUvZXhwb3J0XCIsIFwicGF0Y2hcIik7XG4gICAgLy8gbWFrZSB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IGNvbXBsZXRlRm4gPSBhc3luYyAoaGVhZGVycz86IEhlYWRlcnNJbml0KSA9PlxuICAgICAgdGhpcy5leGVjKG8sIHtcbiAgICAgICAgYm9keToge1xuICAgICAgICAgIGtleV9pZDoga2V5SWQsXG4gICAgICAgICAgcHVibGljX2tleTogcHVibGljS2V5QjY0LFxuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzLFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIGNvbXBsZXRlRm4sIG1mYVJlY2VpcHQpO1xuICB9XG4gIC8vICNlbmRyZWdpb25cblxuICAvLyAjcmVnaW9uIEtFWSBJTVBPUlQ6IGNyZWF0ZUtleUltcG9ydEtleSwgaW1wb3J0S2V5c1xuICAvKipcbiAgICogUmVxdWVzdCBhIGZyZXNoIGtleS1pbXBvcnQga2V5LlxuICAgKlxuICAgKiBAcmV0dXJucyBBIGZyZXNoIGtleS1pbXBvcnQga2V5XG4gICAqL1xuICBhc3luYyBjcmVhdGVLZXlJbXBvcnRLZXkoKTogUHJvbWlzZTxDcmVhdGVLZXlJbXBvcnRLZXlSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW1wb3J0X2tleVwiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBJbXBvcnQgb25lIG9yIG1vcmUga2V5cy4gVG8gdXNlIHRoaXMgZnVuY3Rpb25hbGl0eSwgeW91IG11c3QgZmlyc3QgY3JlYXRlIGFuXG4gICAqIGVuY3J5cHRlZCBrZXktaW1wb3J0IHJlcXVlc3QgdXNpbmcgdGhlIGBAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNkay1rZXktaW1wb3J0YFxuICAgKiBsaWJyYXJ5LiBTZWUgdGhhdCBsaWJyYXJ5J3MgZG9jdW1lbnRhdGlvbiBmb3IgbW9yZSBpbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gYm9keSBBbiBlbmNyeXB0ZWQga2V5LWltcG9ydCByZXF1ZXN0LlxuICAgKiBAcmV0dXJucyBUaGUgbmV3bHkgaW1wb3J0ZWQga2V5cy5cbiAgICovXG4gIGFzeW5jIGltcG9ydEtleXMoYm9keTogSW1wb3J0S2V5UmVxdWVzdCk6IFByb21pc2U8S2V5SW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pbXBvcnRfa2V5XCIsIFwicHV0XCIpO1xuICAgIGNvbnN0IHsga2V5cyB9ID0gYXdhaXQgdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgICByZXR1cm4ga2V5cztcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNSVNDOiBoZWFydGJlYXQoKVxuICAvKipcbiAgICogU2VuZCBhIGhlYXJ0YmVhdCAvIHVwY2hlY2sgcmVxdWVzdC5cbiAgICovXG4gIGFzeW5jIGhlYXJ0YmVhdCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjEvb3JnL3tvcmdfaWR9L2N1YmUzc2lnbmVyL2hlYXJ0YmVhdFwiLCBcInBvc3RcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHt9KTtcbiAgfVxuICAvLyAjZW5kcmVnaW9uXG5cbiAgLy8gI3JlZ2lvbiBNTUk6IG1taSgpLCBtbWlMaXN0KClcbiAgLyoqXG4gICAqIENhbGwgdGhlIE1NSSBKU09OIFJQQyBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIG1ldGhvZCBUaGUgbmFtZSBvZiB0aGUgbWV0aG9kIHRvIGNhbGwuXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIGxpc3Qgb2YgbWV0aG9kIHBhcmFtZXRlcnMuXG4gICAqIEByZXR1cm5zIHRoZSByZXR1cm4gdmFsdWUgb2YgdGhlIG1ldGhvZC5cbiAgICogQGludGVybmFsXG4gICAqL1xuICBhc3luYyBtbWkobWV0aG9kOiBNbWlKcnBjTWV0aG9kLCBwYXJhbXM6IEpzb25BcnJheSk6IFByb21pc2U8SnJwY1Jlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL21taS92My9qc29uLXJwY1wiLCBcInBvc3RcIik7XG4gICAgY29uc3QgYm9keSA9IHtcbiAgICAgIGlkOiAxLFxuICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgcGFyYW1zOiBwYXJhbXMsXG4gICAgfTtcbiAgICBjb25zdCBmdW5jID0gYXN5bmMgKGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkgPT4ge1xuICAgICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMuZXhlYyhvLCB7IGhlYWRlcnMsIGJvZHkgfSk7XG4gICAgICBpZiAocmVzcC5lcnJvcikge1xuICAgICAgICBjb25zdCBkYXRhID0gcmVzcC5lcnJvci5kYXRhIGFzIEVycm9yUmVzcG9uc2UgfCB1bmRlZmluZWQ7XG4gICAgICAgIHRocm93IG5ldyBFcnJSZXNwb25zZSh7XG4gICAgICAgICAgbWVzc2FnZTogcmVzcC5lcnJvci5tZXNzYWdlLFxuICAgICAgICAgIGVycm9yQ29kZTogZGF0YT8uZXJyb3JfY29kZSxcbiAgICAgICAgICByZXF1ZXN0SWQ6IGRhdGE/LnJlcXVlc3RfaWQsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZSh0aGlzLmVudiwgZnVuYyk7XG4gICAgcmV0dXJuIHJlc3AuZGF0YSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIFJldHJpZXZlIGEgcHJvb2Ygb2YgdGhpcyBzZXNzaW9uJ3MgQ3ViZVNpZ25lciBpZGVudGl0eS5cbiAgICpcbiAgICogQHBhcmFtIGF1ZCBJbnRlbmRlZCBhdWRpZW5jZVxuICAgKiBAcmV0dXJucyBhIEpXVCB0aGF0IGNhbiBiZSB2YWxpZGF0ZWQgYWdhaW5zdCB0aGUgSldLUyBmcm9tIHtAbGluayBjdXN0b21lclByb29mSndrc1VybH0uXG4gICAqL1xuICBhc3luYyBnZXRDdXN0b21lclByb29mKGF1ZDogXCJtbWlcIiB8IFwiY3ViZS1wYXlcIiB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgcmVzcCA9IGF3YWl0IHRoaXMubW1pKFwiY3VzdG9kaWFuX2dldEN1c3RvbWVyUHJvb2ZcIiwgW2F1ZF0pO1xuICAgIGNvbnN0IGp3dCA9IHJlc3AucmVzdWx0Py5qd3Q7XG4gICAgaWYgKCFqd3QgfHwgdHlwZW9mIGp3dCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgY29uc29sZS53YXJuKFwiVW5leHBlY3RlZCBnZXRDdXN0b21lclByb29mIHJlc3BvbnNlXCIsIHJlc3ApO1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVGhlIHR5cGUgSldUIGluY2x1ZGVkIGluIHRoZSBjdXN0b21lciBwcm9vZiByZXNwb25zZSBpcyBub3Qgc3RyaW5nXCIpO1xuICAgIH1cbiAgICByZXR1cm4gand0O1xuICB9XG5cbiAgLyoqXG4gICAqIExpc3QgcGVuZGluZyBNTUkgbWVzc2FnZXMuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsaXN0IG9mIHBlbmRpbmcgTU1JIG1lc3NhZ2VzLlxuICAgKi9cbiAgYXN5bmMgbW1pTGlzdCgpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mb1tdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXNcIiwgXCJnZXRcIik7XG4gICAgY29uc3QgeyBwZW5kaW5nX21lc3NhZ2VzIH0gPSBhd2FpdCB0aGlzLmV4ZWMobywge30pO1xuICAgIHJldHVybiBwZW5kaW5nX21lc3NhZ2VzIGFzIFBlbmRpbmdNZXNzYWdlSW5mb1tdO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHBlbmRpbmcgTU1JIG1lc3NhZ2UgYnkgaXRzIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgVGhlIElEIG9mIHRoZSBwZW5kaW5nIG1lc3NhZ2UuXG4gICAqIEByZXR1cm5zIFRoZSBwZW5kaW5nIE1NSSBtZXNzYWdlLlxuICAgKi9cbiAgYXN5bmMgbW1pR2V0KG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9XCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmV4ZWMobywgeyBwYXJhbXM6IHsgcGF0aDogeyBtc2dfaWQ6IG1zZ0lkIH0gfSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhlIE1NSSBtZXNzYWdlIHdpdGggdGhlIGdpdmVuIElELlxuICAgKlxuICAgKiBAcGFyYW0gbXNnSWQgdGhlIElEIG9mIHRoZSBNTUkgbWVzc2FnZS5cbiAgICovXG4gIGFzeW5jIG1taURlbGV0ZShtc2dJZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9tbWkvdjMvbWVzc2FnZXMve21zZ19pZH1cIiwgXCJkZWxldGVcIik7XG4gICAgYXdhaXQgdGhpcy5leGVjKG8sIHsgcGFyYW1zOiB7IHBhdGg6IHsgbXNnX2lkOiBtc2dJZCB9IH0gfSk7XG4gIH1cblxuICAvKipcbiAgICogUmVqZWN0IHRoZSBNTUkgbWVzc2FnZSB3aXRoIHRoZSBnaXZlbiBJRC5cbiAgICpcbiAgICogQHBhcmFtIG1zZ0lkIHRoZSBJRCBvZiB0aGUgTU1JIG1lc3NhZ2UuXG4gICAqIEByZXR1cm5zIFRoZSBtZXNzYWdlIHdpdGggdXBkYXRlZCBpbmZvcm1hdGlvblxuICAgKi9cbiAgYXN5bmMgbW1pUmVqZWN0KG1zZ0lkOiBzdHJpbmcpOiBQcm9taXNlPFBlbmRpbmdNZXNzYWdlSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vbW1pL3YzL21lc3NhZ2VzL3ttc2dfaWR9L3JlamVjdFwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZXhlYyhvLCB7IHBhcmFtczogeyBwYXRoOiB7IG1zZ19pZDogbXNnSWQgfSB9IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIEpTT04gV2ViIEtleSBTZXQgKEpXS1MpIFVSTCB3aXRoIHRoZSBrZXlzIHVzZWQgZm9yIGtleS9yb2xlIGF0dGVzdGF0aW9ucyAoc2VlIHtAbGluayBrZXlBdHRlc3R9IGFuZCB7QGxpbmsgcm9sZUF0dGVzdH0pLlxuICAgKi9cbiAgYXR0ZXN0YXRpb25Kd2tzVXJsKCk6IFVSTCB7XG4gICAgY29uc3QgdXJsID0gXCIvdjAvYXR0ZXN0YXRpb24vLndlbGwta25vd24vandrcy5qc29uXCI7XG4gICAgb3AodXJsLCBcImdldFwiKTsgLy8ganVzdCB0byB0eXBlIGNoZWNrIHRoZSB1cmwgYWJvdmVcbiAgICByZXR1cm4gbmV3IFVSTChgJHt0aGlzLmVudi5TaWduZXJBcGlSb290LnJlcGxhY2UoL1xcLyQvLCBcIlwiKX0ke3VybH1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBKU09OIFdlYiBLZXkgU2V0IChKV0tTKSBVUkwgd2l0aCB0aGUga2V5cyB1c2VkIGZvciB2YWxpZGF0aW5nIEpXVHMgcmV0dXJuZWQgYnkgdGhlIHtAbGluayBjdXN0b21lclByb29mfSBtZXRob2QuXG4gICAqL1xuICBjdXN0b21lclByb29mSndrc1VybCgpOiBVUkwge1xuICAgIGNvbnN0IHVybCA9IFwiL3YwL21taS92My8ud2VsbC1rbm93bi9qd2tzLmpzb25cIjtcbiAgICBvcCh1cmwsIFwiZ2V0XCIpOyAvLyBqdXN0IHRvIHR5cGUgY2hlY2sgdGhlIHVybCBhYm92ZVxuICAgIHJldHVybiBuZXcgVVJMKGAke3RoaXMuZW52LlNpZ25lckFwaVJvb3QucmVwbGFjZSgvXFwvJC8sIFwiXCIpfSR7dXJsfWApO1xuICB9XG5cbiAgLy8gI2VuZHJlZ2lvblxuXG4gIC8vICNyZWdpb24gUlBDXG5cbiAgLyoqXG4gICAqIFNlbmQgYSBKU09OIFJQQyByZXF1ZXN0IHRvIHRoZSBoaWdoLWxldmVsIEFQSSBlbmRwb2ludC5cbiAgICpcbiAgICogQHBhcmFtIGJvZHkgSlNPTiBSUEMgcmVxdWVzdCBib2R5XG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0c1xuICAgKiBAcmV0dXJucyBDb3JyZXNwb25kaW5nIHJlc3BvbnNlXG4gICAqL1xuICBhc3luYyBycGMoXG4gICAgYm9keTogSnNvblJwY1JlcXVlc3QsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxzY2hlbWFzW1wiSnNvblJwY1Jlc3BvbnNlXCJdPj4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vcnBjXCIsIFwicG9zdFwiKTtcbiAgICBjb25zdCByZXFGbiA9IChoZWFkZXJzPzogSGVhZGVyc0luaXQpID0+XG4gICAgICB0aGlzLmV4ZWMobywge1xuICAgICAgICBoZWFkZXJzLFxuICAgICAgICBib2R5OiB7XG4gICAgICAgICAganNvbnJwYzogXCIyLjBcIixcbiAgICAgICAgICAuLi5ib2R5LFxuICAgICAgICB9LFxuICAgICAgfSk7XG4gICAgcmV0dXJuIGF3YWl0IEN1YmVTaWduZXJSZXNwb25zZS5jcmVhdGUodGhpcy5lbnYsIHJlcUZuLCBtZmFSZWNlaXB0KTtcbiAgfVxuXG4gIC8vICNlbmRyZWdpb25cblxuICAvKipcbiAgICogUmV0dXJucyBwdWJsaWMgb3JnIGluZm9ybWF0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50b1xuICAgKiBAcmV0dXJucyBQdWJsaWMgb3JnIGluZm9ybWF0aW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcHVibGljT3JnSW5mbyhlbnY6IEVudkludGVyZmFjZSwgb3JnSWQ6IHN0cmluZyk6IFByb21pc2U8UHVibGljT3JnSW5mbz4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW5mb1wiLCBcImdldFwiKTtcbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEpTT04gV2ViIEtleSBTZXQgKEpXS1MpIHdpdGggdGhlIGtleXMgdXNlZCBmb3Iga2V5IGF0dGVzdGF0aW9ucyAoc2VlIHtAbGluayBrZXlBdHRlc3R9IGFuZCB7QGxpbmsgcm9sZUF0dGVzdH0pLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBDdWJlU2lnbmVyIGVudmlyb25tZW50XG4gICAqIEByZXR1cm5zIEEgSldLUyB3aXRoIHRoZXkga2V5cyB1c2VkIGZvciBrZXkgYXR0ZXN0YXRpb24uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgYXR0ZXN0YXRpb25Kd2tzKGVudjogRW52SW50ZXJmYWNlKTogUHJvbWlzZTxzY2hlbWFzW1wiSndrU2V0UmVzcG9uc2VcIl0+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvYXR0ZXN0YXRpb24vLndlbGwta25vd24vandrcy5qc29uXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCByZXRyeU9uNVhYKCgpID0+IG8oeyBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCB9KSkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogU2VuZHMgYW4gZW1haWwgdG8gdGhlIGdpdmVuIGFkZHJlc3Mgd2l0aCBhIGxpc3Qgb2Ygb3JncyB0aGUgdXNlciBpcyBhIG1lbWJlciBvZi5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gdXNlXG4gICAqIEBwYXJhbSBlbWFpbCBUaGUgdXNlcidzIGVtYWlsXG4gICAqIEBwYXJhbSBoZWFkZXJzIE9wdGlvbmFsIGhlYWRlcnMgdG8gc2V0XG4gICAqIEByZXR1cm5zIEVtcHR5IHJlc3BvbnNlXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgZW1haWxNeU9yZ3MoZW52OiBFbnZJbnRlcmZhY2UsIGVtYWlsOiBzdHJpbmcsIGhlYWRlcnM/OiBIZWFkZXJzSW5pdCkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9lbWFpbC9vcmdzXCIsIFwiZ2V0XCIpO1xuICAgIHJldHVybiBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIHBhcmFtczogeyBxdWVyeTogeyBlbWFpbCB9IH0sXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIEV4Y2hhbmdlIGFuIE9JREMgdG9rZW4gZm9yIGEgQ3ViZVNpZ25lciBzZXNzaW9uIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIG9yZyB0byBsb2cgaW50by5cbiAgICogQHBhcmFtIHRva2VuIFRoZSBPSURDIHRva2VuIHRvIGV4Y2hhbmdlXG4gICAqIEBwYXJhbSBzY29wZXMgVGhlIHNjb3BlcyBmb3IgdGhlIG5ldyBzZXNzaW9uXG4gICAqIEBwYXJhbSBsaWZldGltZXMgTGlmZXRpbWVzIG9mIHRoZSBuZXcgc2Vzc2lvbi5cbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgc2Vzc2lvbiBkZXNjcmlwdGlvbi5cbiAgICogQHBhcmFtIGhlYWRlcnMgQWRkaXRpb25hbCBoZWFkZXJzIHRvIHNldFxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBkYXRhLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIG9pZGNTZXNzaW9uQ3JlYXRlKFxuICAgIGVudjogRW52SW50ZXJmYWNlIHwgTXVsdGlSZWdpb25FbnYsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIHNjb3BlczogQXJyYXk8U2NvcGU+LFxuICAgIGxpZmV0aW1lcz86IFJhdGNoZXRDb25maWcsXG4gICAgbWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzLFxuICAgIHB1cnBvc2U/OiBzdHJpbmcsXG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0LFxuICApOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxTZXNzaW9uRGF0YT4+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGNcIiwgXCJwb3N0XCIpO1xuXG4gICAgZW52ID0gTXVsdGlSZWdpb25FbnYuY3JlYXRlKGVudik7XG4gICAgY29uc3QgbG9naW5GbiA9IGFzeW5jIChtZmFIZWFkZXJzPzogSGVhZGVyc0luaXQpID0+IHtcbiAgICAgIGNvbnN0IGRhdGEgPSBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICAgIG8oe1xuICAgICAgICAgIGJhc2VVcmw6IGVudi5wcmltYXJ5LlNpZ25lckFwaVJvb3QsXG4gICAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgICAgaGVhZGVyczogbWVyZ2VIZWFkZXJzKGhlYWRlcnMsIG1mYUhlYWRlcnMsIGF1dGhIZWFkZXIodG9rZW4pKSxcbiAgICAgICAgICBib2R5OiB7XG4gICAgICAgICAgICBzY29wZXMsXG4gICAgICAgICAgICBwdXJwb3NlLFxuICAgICAgICAgICAgdG9rZW5zOiBsaWZldGltZXMsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSksXG4gICAgICApLnRoZW4oYXNzZXJ0T2spO1xuXG4gICAgICByZXR1cm4gbWFwUmVzcG9uc2UoZGF0YSwgKHNlc3Npb25JbmZvKTogU2Vzc2lvbkRhdGEgPT4ge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGVudjogZW52LnNwZWMsXG4gICAgICAgICAgb3JnX2lkOiBvcmdJZCxcbiAgICAgICAgICB0b2tlbjogc2Vzc2lvbkluZm8udG9rZW4sXG4gICAgICAgICAgcmVmcmVzaF90b2tlbjogc2Vzc2lvbkluZm8ucmVmcmVzaF90b2tlbixcbiAgICAgICAgICBzZXNzaW9uX2V4cDogc2Vzc2lvbkluZm8uZXhwaXJhdGlvbixcbiAgICAgICAgICBwdXJwb3NlOiBcInNpZ24gaW4gdmlhIG9pZGNcIixcbiAgICAgICAgICBzZXNzaW9uX2luZm86IHNlc3Npb25JbmZvLnNlc3Npb25faW5mbyxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICByZXR1cm4gYXdhaXQgQ3ViZVNpZ25lclJlc3BvbnNlLmNyZWF0ZShlbnYsIGxvZ2luRm4sIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLyoqXG4gICAqIEluaXRpYXRlIGxvZ2luIHZpYSBTaWduLWluIFdpdGggRXRoZXJldW0gKFNJV0UpLlxuICAgKlxuICAgKiBUaGUgcmVzcG9uc2UgY29udGFpbnMgYSBjaGFsbGVuZ2Ugd2hpY2ggbXVzdCBiZSBhbnN3ZXJlZCAodmlhIHtAbGluayBzaXdlTG9naW5Db21wbGV0ZX0pXG4gICAqIHRvIG9idGFpbiBhbiBPSURDIHRva2VuLlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byB1c2VcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9naW4gdG9cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcGFyYW0gaGVhZGVycyBPcHRpb25hbCBoZWFkZXJzIHRvIHNldFxuICAgKiBAcmV0dXJucyBUaGUgY2hhbGxlbmdlIHRoYXQgbmVlZHMgdG8gYmUgYW5zd2VyZWQgdmlhIHtAbGluayBzaXdlTG9naW5Db21wbGV0ZX1cbiAgICovXG4gIHN0YXRpYyBhc3luYyBzaXdlTG9naW5Jbml0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogc2NoZW1hc1tcIlNpd2VJbml0UmVxdWVzdFwiXSxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8c2NoZW1hc1tcIlNpd2VJbml0UmVzcG9uc2VcIl0+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L29pZGMvc2l3ZVwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXBsZXRlIGxvZ2luIHZpYSBTaWduLWluIFdpdGggRXRoZXJldW0gKFNJV0UpLlxuICAgKlxuICAgKiBUaGUgY2hhbGxlbmdlIHJldHVybmVkIGJ5IHtAbGluayBzaXdlTG9naW5Jbml0fSBzaG91bGQgYmUgc2lnbmVkXG4gICAqIGFuZCBzdWJtaXR0ZWQgdmlhIHRoaXMgQVBJIGNhbGwgdG8gb2J0YWluIGFuIE9JREMgdG9rZW4sIHdoaWNoIGNhblxuICAgKiB0aGVuIGJlIHVzZWQgdG8gbG9nIGluIHZpYSB7QGxpbmsgb2lkY1Nlc3Npb25DcmVhdGV9LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byB1c2VcbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgdG8gbG9naW4gdG9cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcGFyYW0gaGVhZGVycyBPcHRpb25hbCBoZWFkZXJzIHRvIHNldFxuICAgKiBAcmV0dXJucyBBbiBPSURDIHRva2VuIHdoaWNoIGNhbiBiZSB1c2VkIHRvIGxvZyBpbiB2aWEgT0lEQyAoc2VlIHtAbGluayBvaWRjU2Vzc2lvbkNyZWF0ZX0pXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgc2l3ZUxvZ2luQ29tcGxldGUoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBib2R5OiBzY2hlbWFzW1wiU2l3ZUNvbXBsZXRlUmVxdWVzdFwiXSxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8c2NoZW1hc1tcIlNpd2VDb21wbGV0ZVJlc3BvbnNlXCJdPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9vaWRjL3Npd2VcIiwgXCJwYXRjaFwiKTtcbiAgICByZXR1cm4gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogSW5pdGlhdGUgdGhlIGxvZ2luIHdpdGggcGFzc2tleSBmbG93LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gYm9keSBUaGUgbG9naW4gcmVxdWVzdFxuICAgKiBAcGFyYW0gaGVhZGVycyBPcHRpb25hbCBoZWFkZXJzIHRvIHNldFxuICAgKiBAcmV0dXJucyBUaGUgY2hhbGxlbmdlIHRoYXQgbXVzdCBiZSBhbnN3ZXJlZCAoc2VlIHtAbGluayBwYXNza2V5TG9naW5Db21wbGV0ZX0pIHRvIGxvZyBpbi5cbiAgICovXG4gIHN0YXRpYyBhc3luYyBwYXNza2V5TG9naW5Jbml0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIGJvZHk6IExvZ2luUmVxdWVzdCxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8UGFzc2tleUxvZ2luQ2hhbGxlbmdlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL3Bhc3NrZXlcIiwgXCJwb3N0XCIpO1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCByZXRyeU9uNVhYKCgpID0+XG4gICAgICBvKHtcbiAgICAgICAgYmFzZVVybDogZW52LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICAgIHJldHVybiBuZXcgUGFzc2tleUxvZ2luQ2hhbGxlbmdlKGVudiwgcmVzcCwgYm9keS5wdXJwb3NlKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbnN3ZXIgdGhlIGxvZ2luIHdpdGggcGFzc2tleSBjaGFsbGVuZ2UgcmV0dXJuZWQgZnJvbSB7QGxpbmsgcGFzc2tleUxvZ2luSW5pdH0uXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIHB1cnBvc2UgT3B0aW9uYWwgZGVzY3JpcHRpdmUgc2Vzc2lvbiBwdXJwb3NlXG4gICAqIEBwYXJhbSBoZWFkZXJzIE9wdGlvbmFsIGhlYWRlcnMgdG8gc2V0XG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIGRhdGFcbiAgICovXG4gIHN0YXRpYyBhc3luYyBwYXNza2V5TG9naW5Db21wbGV0ZShcbiAgICBlbnY6IEVudkludGVyZmFjZSB8IE11bHRpUmVnaW9uRW52LFxuICAgIGJvZHk6IFBhc3NrZXlBc3NlcnRBbnN3ZXIsXG4gICAgcHVycG9zZT86IHN0cmluZyB8IG51bGwsXG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0LFxuICApOiBQcm9taXNlPFNlc3Npb25EYXRhPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL3Bhc3NrZXlcIiwgXCJwYXRjaFwiKTtcbiAgICBlbnYgPSBNdWx0aVJlZ2lvbkVudi5jcmVhdGUoZW52KTtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5wcmltYXJ5LlNpZ25lckFwaVJvb3QsXG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICAgIHJldHVybiB7XG4gICAgICBlbnY6IGVudi5zcGVjLFxuICAgICAgb3JnX2lkOiByZXNwLm9yZ19pZCEsIC8vICdvcmdfaWQnIGlzIGFsd2F5cyBzZXQgZnJvbSB0aGlzIGVuZHBvaW50XG4gICAgICB0b2tlbjogcmVzcC50b2tlbixcbiAgICAgIHJlZnJlc2hfdG9rZW46IHJlc3AucmVmcmVzaF90b2tlbixcbiAgICAgIHNlc3Npb25fZXhwOiByZXNwLmV4cGlyYXRpb24sXG4gICAgICBwdXJwb3NlOiBwdXJwb3NlID8/IFwic2lnbiBpbiB2aWEgcGFzc2tleVwiLFxuICAgICAgc2Vzc2lvbl9pbmZvOiByZXNwLnNlc3Npb25faW5mbyxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEFjY2VwdCBhbiBpbnZpdGF0aW9uIHRvIGpvaW4gYSBDdWJlU2lnbmVyIG9yZy5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIGhlYWRlcnMgT3B0aW9uYWwgaGVhZGVycyB0byBzZXRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBBY2NlcHRJbnZpdGUoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICBib2R5OiBJbnZpdGF0aW9uQWNjZXB0UmVxdWVzdCxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vaW52aXRhdGlvbi9hY2NlcHRcIiwgXCJwb3N0XCIpO1xuICAgIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYXV0aGVudGljYXRlZCBlbmRwb2ludCBmb3IgYXV0aGVudGljYXRpbmcgd2l0aCBlbWFpbC9wYXNzd29yZC5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBpZCBvZiB0aGUgb3JnYW5pemF0aW9uXG4gICAqIEBwYXJhbSBib2R5IFRoZSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIGhlYWRlcnMgT3B0aW9uYWwgaGVhZGVycyB0byBzZXRcbiAgICogQHJldHVybnMgUmV0dXJucyBhbiBPSURDIHRva2VuIHdoaWNoIGNhbiBiZSB1c2VkXG4gICAqICAgdG8gbG9nIGluIHZpYSBPSURDIChzZWUge0BsaW5rIG9pZGNTZXNzaW9uQ3JlYXRlfSkuXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaWRwQXV0aGVudGljYXRlKFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogQXV0aGVudGljYXRpb25SZXF1ZXN0LFxuICAgIGhlYWRlcnM/OiBIZWFkZXJzSW5pdCxcbiAgKTogUHJvbWlzZTxBdXRoZW50aWNhdGlvblJlc3BvbnNlPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZHAvYXV0aGVudGljYXRlXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgYm9keSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogVW5hdXRoZW50aWNhdGVkIGVuZHBvaW50IGZvciByZXF1ZXN0aW5nIHBhc3N3b3JkIHJlc2V0LlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gb3JnSWQgVGhlIGlkIG9mIHRoZSBvcmdhbml6YXRpb25cbiAgICogQHBhcmFtIGJvZHkgVGhlIHJlcXVlc3QgYm9keVxuICAgKiBAcGFyYW0gaGVhZGVycyBPcHRpb25hbCBoZWFkZXJzIHRvIHNldFxuICAgKiBAcmV0dXJucyBSZXR1cm5zIHRoZSBwYXJ0aWFsIHRva2VuIChgJHtoZWFkZXJ9LiR7Y2xhaW1zfS5gKSB3aGlsZSB0aGUgc2lnbmF0dXJlIGlzIHNlbnQgdmlhIGVtYWlsLlxuICAgKi9cbiAgc3RhdGljIGFzeW5jIGlkcFBhc3N3b3JkUmVzZXRSZXF1ZXN0KFxuICAgIGVudjogRW52SW50ZXJmYWNlLFxuICAgIG9yZ0lkOiBzdHJpbmcsXG4gICAgYm9keTogUGFzc3dvcmRSZXNldFJlcXVlc3QsXG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0LFxuICApOiBQcm9taXNlPEVtYWlsT3RwUmVzcG9uc2U+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkcC9wYXNzd29yZF9yZXNldFwiLCBcInBvc3RcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHksXG4gICAgICAgIGhlYWRlcnMsXG4gICAgICB9KSxcbiAgICApLnRoZW4oYXNzZXJ0T2spO1xuICB9XG5cbiAgLyoqXG4gICAqIFVuYXV0aGVudGljYXRlZCBlbmRwb2ludCBmb3IgY29uZmlybWluZyBhIHByZXZpb3VzbHkgaW5pdGlhdGVkIHBhc3N3b3JkIHJlc2V0IHJlcXVlc3QuXG4gICAqXG4gICAqIEBwYXJhbSBlbnYgVGhlIGVudmlyb25tZW50IHRvIGxvZyBpbnRvXG4gICAqIEBwYXJhbSBvcmdJZCBUaGUgaWQgb2YgdGhlIG9yZ2FuaXphdGlvblxuICAgKiBAcGFyYW0gcGFydGlhbFRva2VuIFRoZSBwYXJ0aWFsIHRva2VuIHJldHVybmVkIGJ5IHtAbGluayBwYXNzd29yZFJlc2V0UmVxdWVzdH1cbiAgICogQHBhcmFtIHNpZ25hdHVyZSBUaGUgb25lLXRpbWUgY29kZSAoc2lnbmF0dXJlIGluIHRoaXMgY2FzZSkgc2VudCB2aWEgZW1haWxcbiAgICogQHBhcmFtIG5ld1Bhc3N3b3JkIFRoZSBuZXcgcGFzc3dvcmRcbiAgICogQHBhcmFtIGhlYWRlcnMgT3B0aW9uYWwgaGVhZGVycyB0byBzZXRcbiAgICovXG4gIHN0YXRpYyBhc3luYyBpZHBQYXNzd29yZFJlc2V0Q29uZmlybShcbiAgICBlbnY6IEVudkludGVyZmFjZSxcbiAgICBvcmdJZDogc3RyaW5nLFxuICAgIHBhcnRpYWxUb2tlbjogc3RyaW5nLFxuICAgIHNpZ25hdHVyZTogc3RyaW5nLFxuICAgIG5ld1Bhc3N3b3JkOiBzdHJpbmcsXG4gICAgaGVhZGVycz86IEhlYWRlcnNJbml0LFxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBvID0gb3AoXCIvdjAvb3JnL3tvcmdfaWR9L2lkcC9wYXNzd29yZF9yZXNldFwiLCBcInBhdGNoXCIpO1xuICAgIGF3YWl0IHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgcGFyYW1zOiB7IHBhdGg6IHsgb3JnX2lkOiBvcmdJZCB9IH0sXG4gICAgICAgIGJvZHk6IHtcbiAgICAgICAgICB0b2tlbjogYCR7cGFydGlhbFRva2VufSR7c2lnbmF0dXJlfWAsXG4gICAgICAgICAgbmV3X3Bhc3N3b3JkOiBuZXdQYXNzd29yZCxcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVycyxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogRXhjaGFuZ2UgYW4gT0lEQyB0b2tlbiBmb3IgYSBwcm9vZiBvZiBhdXRoZW50aWNhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIGVudiBUaGUgZW52aXJvbm1lbnQgdG8gbG9nIGludG9cbiAgICogQHBhcmFtIG9yZ0lkIFRoZSBvcmcgaWQgaW4gd2hpY2ggdG8gZ2VuZXJhdGUgcHJvb2ZcbiAgICogQHBhcmFtIHRva2VuIFRoZSBvaWRjIHRva2VuXG4gICAqIEBwYXJhbSBoZWFkZXJzIE9wdGlvbmFsIGhlYWRlcnMgdG8gc2V0XG4gICAqIEByZXR1cm5zIFByb29mIG9mIGF1dGhlbnRpY2F0aW9uXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgaWRlbnRpdHlQcm92ZU9pZGMoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgb3JnSWQ6IHN0cmluZyxcbiAgICB0b2tlbjogc3RyaW5nLFxuICAgIGhlYWRlcnM/OiBIZWFkZXJzSW5pdCxcbiAgKTogUHJvbWlzZTxJZGVudGl0eVByb29mPiB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9pZGVudGl0eS9wcm92ZS9vaWRjXCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gcmV0cnlPbjVYWCgoKSA9PlxuICAgICAgbyh7XG4gICAgICAgIGJhc2VVcmw6IGVudi5TaWduZXJBcGlSb290LFxuICAgICAgICBwYXJhbXM6IHsgcGF0aDogeyBvcmdfaWQ6IG9yZ0lkIH0gfSxcbiAgICAgICAgaGVhZGVyczogbWVyZ2VIZWFkZXJzKGhlYWRlcnMsIGF1dGhIZWFkZXIodG9rZW4pKSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogT2J0YWluIGFsbCBvcmdhbml6YXRpb25zIGEgdXNlciBpcyBhIG1lbWJlciBvZlxuICAgKlxuICAgKiBAcGFyYW0gZW52IFRoZSBlbnZpcm9ubWVudCB0byBsb2cgaW50b1xuICAgKiBAcGFyYW0gdG9rZW4gVGhlIG9pZGMgdG9rZW4gaWRlbnRpZnlpbmcgdGhlIHVzZXJcbiAgICogQHBhcmFtIGhlYWRlcnMgT3B0aW9uYWwgaGVhZGVycyB0byBzZXRcbiAgICogQHJldHVybnMgVGhlIG9yZ2FuaXphdGlvbiB0aGUgdXNlciBiZWxvbmdzIHRvXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgdXNlck9yZ3MoXG4gICAgZW52OiBFbnZJbnRlcmZhY2UsXG4gICAgdG9rZW46IHN0cmluZyxcbiAgICBoZWFkZXJzPzogSGVhZGVyc0luaXQsXG4gICk6IFByb21pc2U8VXNlck9yZ3NSZXNwb25zZT4ge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC91c2VyL29yZ3NcIiwgXCJnZXRcIik7XG4gICAgcmV0dXJuIHJldHJ5T241WFgoKCkgPT5cbiAgICAgIG8oe1xuICAgICAgICBiYXNlVXJsOiBlbnYuU2lnbmVyQXBpUm9vdCxcbiAgICAgICAgaGVhZGVyczogbWVyZ2VIZWFkZXJzKGhlYWRlcnMsIGF1dGhIZWFkZXIodG9rZW4pKSxcbiAgICAgIH0pLFxuICAgICkudGhlbihhc3NlcnRPayk7XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbmZvfSByZXNwb25zZS4gUG9zdC1wcm9jZXNzaW5nIGVuc3VyZXMgdGhhdCB0aGUgZW1haWwgZmllbGQgZm9yXG4gICAqIHVzZXJzIHdpdGhvdXQgYW4gZW1haWwgaXMgc2V0IHRvIGBudWxsYC5cbiAgICpcbiAgICogQHBhcmFtIGluZm8gVGhlIGluZm8gdG8gcG9zdC1wcm9jZXNzXG4gICAqIEByZXR1cm5zIFRoZSBwcm9jZXNzZWQgdXNlciBpbmZvXG4gICAqL1xuICBzdGF0aWMgI3Byb2Nlc3NVc2VySW5mbyhpbmZvOiBVc2VySW5mbyk6IFVzZXJJbmZvIHtcbiAgICBpZiAoaW5mby5lbWFpbCA9PT0gRU1BSUxfTk9UX0ZPVU5EKSB7XG4gICAgICBpbmZvLmVtYWlsID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIGluZm87XG4gIH1cblxuICAvKipcbiAgICogUG9zdC1wcm9jZXNzIGEge0BsaW5rIFVzZXJJbk9yZ0luZm99IHJlc3BvbnNlLiBQb3N0LXByb2Nlc3NpbmcgZW5zdXJlcyB0aGF0IHRoZSBlbWFpbCBmaWVsZCBmb3JcbiAgICogdXNlcnMgd2l0aG91dCBhbiBlbWFpbCBpcyBzZXQgdG8gYG51bGxgLlxuICAgKlxuICAgKiBAcGFyYW0gaW5mbyBUaGUgaW5mbyB0byBwb3N0LXByb2Nlc3NcbiAgICogQHJldHVybnMgVGhlIHByb2Nlc3NlZCB1c2VyIGluZm9cbiAgICovXG4gIHN0YXRpYyAjcHJvY2Vzc1VzZXJJbk9yZ0luZm8oaW5mbzogVXNlckluT3JnSW5mbyk6IFVzZXJJbk9yZ0luZm8ge1xuICAgIGlmIChpbmZvLmVtYWlsID09PSBFTUFJTF9OT1RfRk9VTkQpIHtcbiAgICAgIGluZm8uZW1haWwgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gaW5mbztcbiAgfVxuXG4gIC8vICNyZWdpb24gQVVUSCBNSUdSQVRJT046IG1pZ3JhdGUoQWRkfFJlbW92ZSlJZGVudGl0aWVzXG5cbiAgLyoqXG4gICAqIEFzc29jaWF0ZSBPSURDIGlkZW50aXRpZXMgd2l0aCBhcmJpdHJhcnkgdXNlcnMgaW4gb3JnLlxuICAgKlxuICAgKiA8Yj5OT1RFPC9iPjogVGhpcyBvcGVyYXRpb24gaXMgYXZhaWxhYmxlIG9ubHkgd2hpbGUgeW91ciBvcmcgaXMgaW5cbiAgICogbWlncmF0aW9uIG1vZGUgYW5kIG5vdCBjb25maWd1cmFibGUuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKiBAcGFyYW0gYm9keSBUaGUgaWRlbnRpdGllcyB0byBhZGRcbiAgICogQHRocm93cyBPbiBzZXJ2ZXItc2lkZSBlcnJvclxuICAgKiBAcmV0dXJucyBOb3RoaW5nXG4gICAqL1xuICBhc3luYyBtaWdyYXRlQWRkSWRlbnRpdGllcyhib2R5OiBzY2hlbWFzW1wiTWlncmF0ZUlkZW50aXR5UmVxdWVzdFwiXSkge1xuICAgIGNvbnN0IG8gPSBvcChcIi92MC9vcmcve29yZ19pZH0vYXV0aF9taWdyYXRpb24vYWRkX2lkZW50aXR5XCIsIFwicG9zdFwiKTtcbiAgICByZXR1cm4gdGhpcy5leGVjKG8sIHsgYm9keSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXNzb2NpYXRlIE9JREMgaWRlbnRpdGllcyBmcm9tIGFyYml0cmFyeSB1c2VycyBpbiBvcmdcbiAgICpcbiAgICogPGI+Tk9URTwvYj46IFRoaXMgb3BlcmF0aW9uIGlzIGF2YWlsYWJsZSBvbmx5IHdoaWxlIHlvdXIgb3JnIGlzIGluXG4gICAqIG1pZ3JhdGlvbiBtb2RlIGFuZCBub3QgY29uZmlndXJhYmxlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIGJvZHkgVGhlIGlkZW50aXRpZXMgdG8gcmVtb3ZlLlxuICAgKiBAdGhyb3dzIE9uIHNlcnZlci1zaWRlIGVycm9yXG4gICAqIEByZXR1cm5zIE5vdGhpbmdcbiAgICovXG4gIGFzeW5jIG1pZ3JhdGVSZW1vdmVJZGVudGl0aWVzKGJvZHk6IHNjaGVtYXNbXCJNaWdyYXRlSWRlbnRpdHlSZXF1ZXN0XCJdKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdXRoX21pZ3JhdGlvbi9yZW1vdmVfaWRlbnRpdHlcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZSBleGlzdGluZyB1c2VycycgcHJvZmlsZXMuIEN1cnJlbnRseSBzdXBwb3J0cyBvbmx5IChyZSlzZXR0aW5nIGVtYWlscy5cbiAgICpcbiAgICogPGI+Tk9URTwvYj46IFRoaXMgb3BlcmF0aW9uIGlzIGF2YWlsYWJsZSBvbmx5IHdoaWxlIHlvdXIgb3JnIGlzIGluXG4gICAqIG1pZ3JhdGlvbiBtb2RlIGFuZCBub3QgY29uZmlndXJhYmxlLlxuICAgKlxuICAgKiBAaW50ZXJuYWxcbiAgICogQHBhcmFtIGJvZHkgVGhlIHVzZXJzIHdob3NlIHByb2ZpbGVzIHRvIHVwZGF0ZVxuICAgKiBAcmV0dXJucyBOb3RoaW5nXG4gICAqL1xuICBhc3luYyBtaWdyYXRlVXNlclByb2ZpbGVzKGJvZHk6IHNjaGVtYXNbXCJNaWdyYXRlVXBkYXRlVXNlcnNSZXF1ZXN0XCJdKSB7XG4gICAgY29uc3QgbyA9IG9wKFwiL3YwL29yZy97b3JnX2lkfS9hdXRoX21pZ3JhdGlvbi91cGRhdGVfdXNlcnNcIiwgXCJwb3N0XCIpO1xuICAgIHJldHVybiB0aGlzLmV4ZWMobywgeyBib2R5IH0pO1xuICB9XG4gIC8vICNlbmRyZWdpb25cbn1cblxuY29uc3QgZGVmYXVsdFNpZ25lclNlc3Npb25MaWZldGltZTogU2Vzc2lvbkxpZmV0aW1lID0ge1xuICBzZXNzaW9uOiA2MDQ4MDAsIC8vIDEgd2Vla1xuICBhdXRoOiAzMDAsIC8vIDUgbWluXG4gIHJlZnJlc2g6IDg2NDAwLCAvLyAxIGRheVxuICBncmFjZTogMzAsIC8vIHNlY29uZHNcbn07XG4iXX0=