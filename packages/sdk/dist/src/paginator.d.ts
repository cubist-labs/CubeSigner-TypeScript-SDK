/** Pagination options. */
export interface PageOpts {
    /** Max number of items per page. */
    size?: number;
    /**
     * Starting point (i.e., 'last_evaluated_key' from the previous page).
     * Omit to start from the beginning.
     */
    start?: string;
    /** Iterate until retrieving the entire result set. */
    all: boolean;
}
/** Static constructors for `IPage` */
export declare class Page {
    /**
     * The default is to fetch the entire result set
     * (by repeatedly calling the remote endpoint until all pages are retrieved).
     *
     * @returns Pagination options.
     */
    static default(): PageOpts;
}
export interface PageQueryArgs {
    /**
     * Max number of items to return per page.
     *
     * The actual number of returned items may be less that this, even if there exist more
     * data in the result set. To reliably determine if more data is left in the result set,
     * inspect the [UnencryptedLastEvalKey] value in the response object.
     */
    "page.size"?: number;
    /**
     * The start of the page.
     *
     * Omit to start from the beginning; otherwise, only specify the exact
     * value previously returned as 'last_evaluated_key' from the same endpoint.
     */
    "page.start"?: string | null;
}
export type ListFn<U> = (pageQueryArgs: PageQueryArgs) => Promise<U>;
export type LastFn<U> = (resp: U) => string | null | undefined;
export type CombineFn<A, U> = (acc: A | undefined, next: U) => A;
/**
 * Helper class for fetching paginated results.
 *
 * @template U The type of the response
 * @template A The type of the aggregate result (produced by {@link fetchAll})
 */
export declare class Paginator<U, A> {
    #private;
    /**
     * @param pageOpts Pagination options
     * @param listFn Calls a remote endpoint that returns a paginated response
     * @param lastFn Extracts the last evaluated key from the paginated response
     * @param combineFn Combines the current response with a previous one
     */
    constructor(pageOpts: PageOpts, listFn: ListFn<U>, lastFn: LastFn<U>, combineFn: CombineFn<A, U>);
    /**
     * @param pageOpts Pagination options
     * @param listFn Calls a remote endpoint that returns a paginated response
     * @param itemsFn Extracts items from the paginated response
     * @param lastFn Extracts the last evaluated key from the paginated response
     * @returns Paginator which combines responses by concatenating their items (as defined by {@link itemsFn}).
     */
    static items<U, T>(pageOpts: PageOpts, listFn: ListFn<U>, itemsFn: (resp: U) => T[], lastFn: LastFn<U>): Paginator<U, T[]>;
    /**
     * @returns Whether this paginator already fetched everything. Once done, calling
     *  {@link fetchNext}, {@link fetchPage}, and {@link fetchAll} is no longer allowed.
     */
    isDone(): boolean;
    /**
     * Fetches either a single page or the entire result set, depending on
     * the `all` property of the pagination options.
     *
     * @returns A single page or the entire result set.
     */
    fetch(): Promise<A>;
    /**
     * Fetches a single page of the result set from where it previously left off.
     * Mutates self to remember where it left off.
     *
     * @returns The next page of the result set.
     */
    fetchPage(): Promise<A>;
    /**
     * Fetches the next response, from where it previously left off.
     * Mutates self to remember where it left off.
     *
     * @returns The next response.
     * @throws If already done
     */
    fetchNext(): Promise<U>;
    /**
     * Fetches the entire result set starting from where it previously left off
     * by iterating through the pages returned by the remote end.
     *
     * @returns The entire result set.
     */
    fetchAll(): Promise<A>;
}
//# sourceMappingURL=paginator.d.ts.map