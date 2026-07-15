/** A list of access control entries. */
export type Acl<TAction, TCtx> = Ace<TAction, TCtx>[];
/** An access control entry. */
export type Ace<TAction, TCtx> = {
    /** The users or roles performing the action. */
    subjects: AceAttribute<string>;
    /** The actions being performed */
    actions: AceAttribute<TAction>;
} & TCtx;
/** An attribute of an access control entry. */
export type AceAttribute<T> = "*" | T | T[];
//# sourceMappingURL=acl.d.ts.map