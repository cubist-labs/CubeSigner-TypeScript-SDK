/** A list of access control entries. */
export type Acl<TAction, TCtx> = Ace<TAction, TCtx>[];
/** An access control entry. */
export type Ace<TAction, TCtx> = {
    /** The users or roles performing the action. */
    subjects: AceAttribute<string>;
    /** The actions being performed */
    actions: AceAttribute<TAction>;
    /** The effect of this access control entry. */
    effect?: "Allow" | "Deny";
} & TCtx;
/** An attribute of an access control entry. */
export type AceAttribute<T> = "*" | T | T[] | {
    except: T[];
};
//# sourceMappingURL=acl.d.ts.map