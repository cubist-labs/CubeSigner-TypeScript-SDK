import { type ExplicitScope } from ".";
export type ScopesDictionary = Record<string, {
    label: string;
    scopes: ScopeItem[];
}>;
export interface ScopeItem {
    value: ExplicitScope;
    description: string;
    children?: ScopeItem[];
}
/** Mapping from scope name to scope description */
export declare const AllScopes: Record<ExplicitScope, string>;
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
export declare const allScopesDictionary: ScopesDictionary;
/**
 * Restricted scopes dictionary for role-based session generation.
 * Contains only the scopes that are allowed for role sessions.
 */
export declare const roleScopesDictionary: {
    sign: {
        label: string;
        scopes: ScopeItem[];
    };
    mmi: {
        label: string;
        scopes: ScopeItem[];
    };
    manage: {
        label: string;
        scopes: ScopeItem[];
    };
};
/**
 * Restricted scopes dictionary for user session generation.
 * Excludes scopes that require elevated permissions (orgAccess, export).
 */
export declare const userScopesDictionary: {
    manage: {
        label: string;
        scopes: ScopeItem[];
    };
    sign: {
        label: string;
        scopes: ScopeItem[];
    };
    mmi: {
        label: string;
        scopes: ScopeItem[];
    };
};
//# sourceMappingURL=scopes.d.ts.map