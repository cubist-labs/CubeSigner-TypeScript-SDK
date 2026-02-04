// eslint-disable spaced-comment

import { type ExplicitScope } from ".";

export type ScopesDictionary = Record<string, { label: string; scopes: ScopeItem[] }>;

export interface ScopeItem {
  value: ExplicitScope;
  description: string;
  children?: ScopeItem[];
}

/** Mapping from scope name to scope description */
export const AllScopes: Record<ExplicitScope, string> =
  // prettier-ignore
  {
  "sign:*"                                      : "Allows access to all signer endpoints (e.g., sign blob, sign bitcoin/avalanche/evm transaction, etc.)",
  "sign:ava"                                    : "Allows access to the sign 'ava' endpoint",
  "sign:blob"                                   : "Allows access to the sign 'blob' endpoint",
  "sign:diffieHellman"                          : "Allows access to the Diffie-Hellman endpoint. This is not really signing, but we put it under the `sign` hierarchy because it is conceptually similar.",
  "sign:btc:*"                                  : "Allows access to all BTC endpoints",
  "sign:btc:segwit"                             : "Allows access to the signing endpoint for segwit transactions",
  "sign:btc:taproot"                            : "Allows access to the signing endpoint for taproot transactions",
  "sign:btc:psbt:*"                             : "Allows access to the PSBT signing endpoint for any key type",
  "sign:btc:psbt:doge"                          : "Allows access to the PSBT signing endpoint for Doge keys",
  "sign:btc:psbt:legacy"                        : "Allows access to the PSBT signing endpoint for legacy keys",
  "sign:btc:psbt:segwit"                        : "Allows access to the PSBT signing endpoint for segwit keys",
  "sign:btc:psbt:taproot"                       : "Allows access to the PSBT signing endpoint for taproot keys",
  "sign:btc:psbt:ltcSegwit"                     : "Allows access to the PSBT signing endpoint for Litecoin segwit keys",
  "sign:btc:message:*"                          : "Allows access to the BTC message signing endpoint for any key type",
  "sign:btc:message:segwit"                     : "Allows access to the BTC message signing endpoint for segwit keys",
  "sign:btc:message:legacy"                     : "Allows access to the BTC message signing endpoint for legacy keys",
  "sign:babylon:*"                              : "Allows access to all Babylon endpoints",
  "sign:babylon:eots:*"                         : "Allows access to all Babylon EOTS endpoints",
  "sign:babylon:eots:nonces"                    : "Allows access to the EOTS nonce generation endpoint",
  "sign:babylon:eots:sign"                      : "Allows access to the EOTS signing endpoint",
  "sign:babylon:staking:*"                      : "Allows access to the signing endpoint for all Babylon staking operations",
  "sign:babylon:staking:deposit"                : "Allows access to the signing endpoint for Babylon deposits",
  "sign:babylon:staking:unbond"                 : "Allows access to the signing endpoint for Babylon unbonding",
  "sign:babylon:staking:withdraw"               : "Allows access to the signing endpoint for Babylon withdrawals",
  "sign:babylon:staking:slash"                  : "Allows access to the signing endpoint for Babylon slashing pre-signatures",
  "sign:babylon:registration"                   : "Allows access to the signing endpoint for Babylon registration",
  "sign:babylon:covenant"                       : "Allows access to the signing endpoint for Babylon covenant signing",
  "sign:evm:*"                                  : "Allows access to all sign 'evm' endpoints",
  "sign:evm:tx"                                 : "Allows access to the signing endpoint for evm transactions",
  "sign:evm:eip191"                             : "Allows access to the signing endpoint for EIP-191 personal_message data",
  "sign:evm:eip712"                             : "Allows acess to the signing endpoint for EIP-712 typed data",
  "sign:eth2:*"                                 : "Allows access to all sign 'eth2' endpoints",
  "sign:eth2:validate"                          : "Allows access to the sign eth2 'validate' endpoint",
  "sign:eth2:stake"                             : "Allows access to the sign eth2 'stake' endpoint",
  "sign:eth2:unstake"                           : "Allows access to the sign eth2 'unstake' endpoint",
  "sign:solana"                                 : "Allows access to the sign 'solana' endpoint",
  "sign:sui"                                    : "Allows access to the sign 'sui' endpoint",
  "sign:tendermint"                             : "Allows access to the sign 'tendermint' endpoint",
  "sign:mmi"                                    : "Allows access to the sign 'mmi' endpoint",
  "manage:*"                                    : "Allows access to all management endpoints (e.g., create role, create key, add key to role, etc.)",
  "manage:readonly"                             : "Allows access to all management readonly endpoints",
  "manage:email"                                : "Allows access only to the email management endpoints",
  "manage:mfa:*"                                : "Allows access only to MFA endpoints (e.g., get/approve existing MFA request)",
  "manage:mfa:readonly"                         : "Allows access only to MFA readonly endpoints (e.g., get/list existing MFA request(s))",
  "manage:mfa:list"                             : "Allows access only to the MFA list endpoint (list existing MFA requests)",
  "manage:mfa:vote:*"                           : "Allows access to all MFA vote endpoints (vote using current CubeSigner session, TOTP, or FIDO)",
  "manage:mfa:vote:cs"                          : "Allows access only to the MFA 'vote with CubeSigner' endpoint",
  "manage:mfa:vote:email"                       : "Allows access only to the MFA 'vote with email' endpoint",
  "manage:mfa:vote:fido"                        : "Allows access only to the MFA 'vote with TOTP' endpoint",
  "manage:mfa:vote:totp"                        : "Allows access only to the MFA 'vote with FIDO' endpoint",
  "manage:mfa:register:*"                       : "Allows access to all MFA register endpoints",
  "manage:mfa:register:fido"                    : "Allows access only to the MFA 'register TOTP' endpoint",
  "manage:mfa:register:totp"                    : "Allows access only to the MFA 'register FIDO' endpoint",
  "manage:mfa:register:email"                   : "Allows access only to the MFA 'register verified email' endpoint",
  "manage:mfa:unregister:*"                     : "Allows access to all MFA unregister endpoints",
  "manage:mfa:unregister:fido"                  : "Allows access only to the MFA 'delete TOTP' endpoint",
  "manage:mfa:unregister:totp"                  : "Allows access only to the MFA 'delete FIDO' endpoint",
  "manage:mfa:verify:*"                         : "Allows access to all MFA verify endpoints",
  "manage:mfa:verify:totp"                      : "Allows access only to the MFA 'verify TOTP' endpoint",
  "manage:key:*"                                : "Allows access to all key endpoints",
  "manage:key:readonly"                         : "Allows access to all key readonly endpoints",
  "manage:key:attest"                           : "Allows access only to the key 'attest' endpoint",
  "manage:key:get"                              : "Allows access only to the key 'get' endpoint",
  "manage:key:listRoles"                        : "Allows access only to the key 'listRoles' endpoint",
  "manage:key:list"                             : "Allows access only to the key 'list' endpoint",
  "manage:key:history:tx:list"                  : "Allows access only to the key 'list_historical_tx' endpoint",
  "manage:key:create"                           : "Allows access only to key creation endpoints (e.g., 'create' and 'derive')",
  "manage:key:import"                           : "Allows access only to the key 'import' endpoint",
  "manage:key:update:*"                         : "Allows access only to the key 'update' endpoint, within which allowing all possible updates",
  "manage:key:update:owner"                     : "Allows access only to the key 'update' endpoint, but restricting updates to the key owner property",
  "manage:key:update:policy"                    : "Allows access only to the key 'update' endpoint, but restricting updates to the key policy property",
  "manage:key:update:enabled"                   : "Allows access only to the key 'update' endpoint, but restricting updates to the key enabled property",
  "manage:key:update:metadata"                  : "Allows access only to the key 'update' endpoint and restricts updates to the key metadata property",
  "manage:key:update:editPolicy"                : "Allows access only to the key 'update' endpoint and restricts updates to the 'edit_policy' property",
  "manage:key:delete"                           : "Allows access only to the key 'delete' endpoint",
  "manage:policy:*"                             : "Allows access to all policy endpoints",
  "manage:policy:create"                        : "Allows access only to the policy creation endpoint",
  "manage:policy:get"                           : "Allows access only to the policy 'get' endpoint",
  "manage:policy:list"                          : "Allows access only to the policy 'list' endpoint",
  "manage:policy:delete"                        : "Allows access only to the policy `delete` endpoint",
  "manage:policy:update:*"                      : "Allows access only to the policy 'update' endpoint, within which allowing all possible updates",
  "manage:policy:update:acl"                    : "Allows access only to the policy 'update' endpoint, but restricting updates to the policy ACL",
  "manage:policy:update:owner"                  : "Allows access only to the policy 'update' endpoint, but restricting updates to the policy owner property",
  "manage:policy:update:name"                   : "Allows access only to the policy 'update' endpoint, but restricting updates to the policy name",
  "manage:policy:update:editPolicy"             : "Allows access only to the policy 'update' endpoint, but restricting updates to the 'edit_policy' property",
  "manage:policy:update:metadata"               : "Allows access only to the policy 'update' endpoint, but restricting updates to the 'metadata' property",
  "manage:policy:update:rule"                   : "Allows access only to the policy 'update' endpoint, but restricting updates to the policy rule itself",
  "manage:policy:invoke"                        : "Allows access only to the policy 'invoke' endpoint.",
  "manage:policy:wasm:*"                        : "Allows access to all wasm policy endpoints",
  "manage:policy:wasm:upload"                   : "Allows access only to the wasm policy 'upload' endpoint",
  "manage:policy:secrets:*"                     : "Allows access to all policy secrets endpoints",
  "manage:policy:secrets:get"                   : "Allows access only to the policy secrets 'get' endpoint",
  "manage:policy:secrets:update:*"              : "Allows access to all policy secrets 'update' endpoints",
  "manage:policy:secrets:update:values"         : "Allows access only to the policy secrets 'update' endpoint, but restricting updates to the secrets keys and values",
  "manage:policy:secrets:update:acl"            : "Allows access only to the policy secrets 'update' endpoint, but restricting updates to the secrets acl",
  "manage:policy:secrets:update:editPolicy"     : "Allows access only to the policy secrets 'update' endpoint, but restricting updates to the `edit_policy` property",
  "manage:contact:*"                            : "Allows access to all contact endpoints",
  "manage:contact:create"                       : "Allows access to the contact 'create' endpoint",
  "manage:contact:get"                          : "Allows access to the contact `get` endpoint",
  "manage:contact:list"                         : "Allows access to the contact `list` endpoint",
  "manage:contact:delete"                       : "Allows access to the contact `delete` endpoint",
  "manage:contact:update:*"                     : "Allows access only to the contact 'update' endpoint",
  "manage:contact:update:name"                  : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'name' field.",
  "manage:contact:update:addresses"             : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'addresses' field.",
  "manage:contact:update:owner"                 : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'owner' field.",
  "manage:contact:update:metadata"              : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'metadata' field.",
  "manage:contact:update:labels"                : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'labels' field.",
  "manage:contact:update:editPolicy"            : "Allows access only to the contact 'update' endpoint, but restricts updates to the contact's 'edit_policy' field.",
  "manage:contact:lookup:*"                     : "Allows access to the contact `lookup` endpoints",
  "manage:contact:lookup:address"               : "Allows access only to the contact 'lookup by address' endpoint",
  "manage:policy:createImportKey"               : "Allows access only to the policy key endpoint",
  "manage:role:*"                               : "Allows access to all role endpoints",
  "manage:role:readonly"                        : "Allows access to all role readonly endpoints",
  "manage:role:create"                          : "Allows access only to the role 'create' endpoint",
  "manage:role:delete"                          : "Allows access only to the role 'delete' endpoint",
  "manage:role:get:*"                           : "Allows access only to the role 'get' endpoint",
  "manage:role:get:keys"                        : "Allows access to the role 'list keys' and 'get key' endpoints",
  "manage:role:get:keys:list"                   : "Allows access to the role 'list keys' endpoint",
  "manage:role:get:keys:get"                    : "Allows access to the role 'get key' endpoint",
  "manage:role:get:users"                       : "Allows access to the role 'list users' endpoint",
  "manage:role:list"                            : "Allows access only to the role 'list' endpoint",
  "manage:role:update:*"                        : "Allows access only to the role 'update' endpoint",
  "manage:role:update:enabled"                  : "Allows access only to the role 'update' endpoint, but restricting updates to the role 'enabled' property",
  "manage:role:update:policy"                   : "Allows access only to the role 'update' endpoint, but restricting updates to the role 'policy' property",
  "manage:role:update:editPolicy"               : "Allows access only to the role 'update' endpoint, but restricting updates to the role 'edit_policy' property",
  "manage:role:update:key:*"                    : "Allows access to all role 'update:key' endpoints",
  "manage:role:update:key:add"                  : "Allows access to the role 'update:keys:add' endpoint",
  "manage:role:update:key:remove"               : "Allows access to the role 'update:keys:remove' endpoint",
  "manage:role:update:user:*"                   : "Allows access to all role 'update:user' endpoints",
  "manage:role:update:user:add"                 : "Allows access to the role 'update:user:add' endpoint",
  "manage:role:update:user:remove"              : "Allows access to the role 'update:user:remove' endpoint",
  "manage:role:history:tx:list"                 : "Allows access only to the role 'list_historical_tx' endpoint",
  "manage:identity:*"                           : "Allows access to all identity endpoints",
  "manage:identity:verify"                      : "Allows access only to the identity 'verify' endpoint",
  "manage:identity:add"                         : "Allows access only to the identity 'add' endpoint",
  "manage:identity:remove"                      : "Allows access only to the identity 'remove' endpoint",
  "manage:identity:list"                        : "Allows access only to the identity 'list' endpoint",
  "manage:org:*"                                : "Allows access to all org endpoints",
  "manage:org:create"                           : "Allows access to the org 'create' endpoint",
  "manage:org:metrics:query"                    : "Allows access to retrieving org metrics",
  "manage:org:readonly"                         : "Allows access to all org readonly endpoints",
  "manage:org:addUser"                          : "Allows access only to the org endpoint for adding an OIDC user to the org",
  "manage:org:inviteUser"                       : "Allows access only to the org endpoint for inviting a new member or org owner to the org",
  "manage:org:inviteAlien"                      : "Allows access only to the org endpoint for inviting a new alien user to the org",
  "manage:org:updateMembership"                 : "Allows access only to the org endpoint for updating existing user's org membership",
  "manage:org:listUsers"                        : "Allows access only to the org endpoint for listing all org users (members)",
  "manage:org:user:get"                         : "Allows access only to the org endpoints for getting users by id or email",
  "manage:org:deleteUser"                       : "Allows access only to the org endpoint for deleting an OIDC user",
  "manage:org:get"                              : "Allows access to retrieving organization information",
  "manage:org:user:resetMfa"                    : "Allows an owner to initiate an MFA reset for a user",
  "manage:session:*"                            : "Allows access to all session endpoints",
  "manage:session:readonly"                     : "Allows access to all session readonly endpoints",
  "manage:session:get"                          : "Allows access only to the session 'get' endpoint",
  "manage:session:list"                         : "Allows access only to the session 'list' endpoint",
  "manage:session:create"                       : "Allows access only to the session 'create' endpoint, but without the ability to extend session lifetimes",
  "manage:session:extend"                       : "Allows access only to the session 'create' endpoint, including the ability to extend session lifetimes",
  "manage:session:revoke"                       : "Allows access only to the session 'revoke' endpoints",
  "manage:export:*"                             : "Allows access to all export endpoints",
  "manage:export:org:*"                         : "Allows access to all org-export management endpoints",
  "manage:export:org:get"                       : "Allows access to the org-export download endpoint",
  "manage:export:user:*"                        : "Allows access to all user-export management endpoints",
  "manage:export:user:delete"                   : "Allows deleting an existing user-export request",
  "manage:export:user:list"                     : "Allows listing existing user-export requests",
  "manage:authMigration:*"                      : "Allows all auth migration scopes",
  "manage:authMigration:identity:add"           : "Allows adding identities to existing users during an auth migration",
  "manage:authMigration:identity:remove"        : "Allows removing identities from existing users during an auth migration",
  "manage:authMigration:user:update"            : "Allows updating existing users' profiles",
  "manage:mmi:*"                                : "Allows all CRUD operations on MMI pending messages",
  "manage:mmi:readonly"                         : "Allows all readonly operations on MMI pending messages",
  "manage:mmi:get"                              : "Allows retrieving MMI pending messages",
  "manage:mmi:list"                             : "Allows listing MMI pending messages",
  "manage:mmi:reject"                           : "Allows rejecting MMI pending messages",
  "manage:mmi:delete"                           : "Allows deleting MMI pending messages",
  "export:*"                                    : "Allows access to all export endpoints",
  "export:user:*"                               : "Allows access to all user-export execution endpoints",
  "export:user:init"                            : "Allows initiating a new user-export request",
  "export:user:complete"                        : "Allows completing an existing user-export request",
  "mmi:*"                                       : "Allows calls to the MMI endpoint",
  "orgAccess:*"                                 : "Allows access to certain orgs other than the current session's",
  "orgAccess:child:*"                           : "Allows a session to be used for access to orgs transitively parented by the session's org.",
};

// Const for scope category labels
const CATEGORY_LABELS: Record<string, string> = {
  sign: "Sign",
  manage: "Manage",
  export: "Export",
  mmi: "MMI",
  orgAccess: "Org Access",
};

/**
 * Finds the parent scope for a given scope.
 * A parent is a scope ending with '*' that is a prefix of the current scope.
 * Returns the longest matching parent (closest ancestor), excluding the scope itself.
 *
 * @param scope The scope to find the parent for.
 * @param allScopes The list of all scopes.
 * @returns The parent scope or null if no parent is found.
 */
function findParent(scope: ExplicitScope, allScopes: ExplicitScope[]): ExplicitScope | null {
  let parent: ExplicitScope | null = null;
  let maxLength = 0;

  for (const candidate of allScopes) {
    // Skip the scope itself
    if (candidate === scope) continue;

    if (candidate.endsWith("*") && scope.startsWith(candidate.slice(0, -1))) {
      // Prefer the longest matching parent (closest ancestor)
      if (candidate.length > maxLength) {
        parent = candidate;
        maxLength = candidate.length;
      }
    }
  }

  return parent;
}

/**
 * Computes the scopes dictionary from AllScopes.
 *
 * @returns The complete dictionary of all available scopes organized by category.
 */
function computeScopesDictionary(): ScopesDictionary {
  const allScopes = Object.keys(AllScopes) as ExplicitScope[];
  const items = new Map<ExplicitScope, ScopeItem>();
  const result: ScopesDictionary = {};

  // First pass: create all items
  for (const scope of allScopes) {
    const category = scope.split(":")[0];
    if (!result[category]) {
      result[category] = { label: CATEGORY_LABELS[category] || category, scopes: [] };
    }

    items.set(scope, {
      value: scope,
      description: AllScopes[scope],
      children: [],
    });
  }

  // Second pass: build parent-child relationships
  for (const scope of allScopes) {
    const category = scope.split(":")[0];
    const item = items.get(scope)!;
    const parentScope = findParent(scope, allScopes);

    if (parentScope && parentScope !== scope) {
      items.get(parentScope)!.children!.push(item);
    } else {
      result[category].scopes.push(item);
    }
  }

  // Sort roots: wildcards first
  for (const category of Object.values(result)) {
    category.scopes.sort((a, b) => {
      if (a.value.endsWith("*") && !b.value.endsWith("*")) return -1;
      if (!a.value.endsWith("*") && b.value.endsWith("*")) return 1;
      return a.value.localeCompare(b.value);
    });
  }

  return result;
}

/**
 * Complete dictionary of all available scopes organized by category.
 *
 * This dictionary is automatically computed from {@link AllScopes} by inferring
 * the hierarchy from scope names. A scope's parent is determined by finding a
 * scope ending with '*' that is a prefix of the current scope.
 *
 * The dictionary is organized into the following categories:
 * - `sign`: Scopes for signing operations (blob, transactions, etc.)
 * - `manage`: Scopes for management operations (keys, roles, policies, etc.)
 * - `export`: Scopes for export operations
 * - `mmi`: Scopes for MetaMask Integration
 * - `orgAccess`: Scopes for cross-organization access
 *
 * This dictionary serves as the source of truth for scope definitions and is used
 * to generate scopes for role and user sessions. It is also referenced by
 * {@link roleScopesDictionary} and {@link userScopesDictionary} which provide
 * filtered subsets of these scopes.
 *
 * @see {@link AllScopes} - The source record containing scope descriptions
 * @see {@link roleScopesDictionary} - Restricted scopes for role sessions
 * @see {@link userScopesDictionary} - Restricted scopes for user sessions
 */
export const allScopesDictionary: ScopesDictionary = computeScopesDictionary();

/**
 * Restricted scopes dictionary for role-based session generation.
 * Contains only the scopes that are allowed for role sessions.
 */
export const roleScopesDictionary = {
  sign: allScopesDictionary.sign,
  mmi: allScopesDictionary.mmi,
  manage: {
    label: "Manage",
    scopes: [
      // Find and include manage:mmi:*
      (allScopesDictionary.manage.scopes as ScopeItem[])
        .find((s) => s.value === "manage:*")!
        .children!.find((s) => s.value === "manage:mmi:*")!,
      // Find and include manage:mfa:list
      (allScopesDictionary.manage.scopes as ScopeItem[])
        .find((s) => s.value === "manage:*")!
        .children!.find((s) => s.value === "manage:mfa:*")!
        .children!.find((s) => s.value === "manage:mfa:list")!,
      // Find and include manage:key:get
      (allScopesDictionary.manage.scopes as ScopeItem[])
        .find((s) => s.value === "manage:*")!
        .children!.find((s) => s.value === "manage:key:*")!
        .children!.find((s) => s.value === "manage:key:get")!,
      // Find and include manage:key:list
      (allScopesDictionary.manage.scopes as ScopeItem[])
        .find((s) => s.value === "manage:*")!
        .children!.find((s) => s.value === "manage:key:*")!
        .children!.find((s) => s.value === "manage:key:list")!,
    ],
  },
} satisfies ScopesDictionary;

/**
 * Restricted scopes dictionary for user session generation.
 * Excludes scopes that require elevated permissions (orgAccess, export).
 */
export const userScopesDictionary = {
  manage: allScopesDictionary.manage,
  sign: allScopesDictionary.sign,
  mmi: allScopesDictionary.mmi,
};
