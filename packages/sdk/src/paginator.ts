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
export class Page {
  /**
   * The default is to fetch the entire result set
   * (by repeatedly calling the remote endpoint until all pages are retrieved).
   *
   * @returns Pagination options.
   */
  static default(): PageOpts {
    return <PageOpts>{
      all: true,
    };
  }
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
export class Paginator<U, A> {
  readonly #listFn: ListFn<U>;
  readonly #lastFn: LastFn<U>;
  readonly #combineFn: CombineFn<A, U>;
  #opts: PageOpts;
  #last: string | null | undefined;
  #done: boolean;

  /**
   * @param pageOpts Pagination options
   * @param listFn Calls a remote endpoint that returns a paginated response
   * @param lastFn Extracts the last evaluated key from the paginated response
   * @param combineFn Combines the current response with a previous one
   */
  constructor(
    pageOpts: PageOpts,
    listFn: ListFn<U>,
    lastFn: LastFn<U>,
    combineFn: CombineFn<A, U>,
  ) {
    this.#listFn = listFn;
    this.#combineFn = combineFn;
    this.#lastFn = lastFn;
    this.#opts = pageOpts;
    this.#last = pageOpts.start;
    this.#done = false;
  }

  /**
   * @param pageOpts Pagination options
   * @param listFn Calls a remote endpoint that returns a paginated response
   * @param itemsFn Extracts items from the paginated response
   * @param lastFn Extracts the last evaluated key from the paginated response
   * @returns Paginator which combines responses by concatenating their items (as defined by {@link itemsFn}).
   */
  static items<U, T>(
    pageOpts: PageOpts,
    listFn: ListFn<U>,
    itemsFn: (resp: U) => T[],
    lastFn: LastFn<U>,
  ): Paginator<U, T[]> {
    return new Paginator(pageOpts, listFn, lastFn, (acc, next) => {
      const result = acc ?? [];
      result.push(...itemsFn(next));
      return result;
    });
  }

  /**
   * @returns Whether this paginator already fetched everything. Once done, calling
   *  {@link fetchNext}, {@link fetchPage}, and {@link fetchAll} is no longer allowed.
   */
  isDone(): boolean {
    return this.#done;
  }

  /**
   * Fetches either a single page or the entire result set, depending on
   * the `all` property of the pagination options.
   *
   * @returns A single page or the entire result set.
   */
  async fetch(): Promise<A> {
    return this.#opts.all ? await this.fetchAll() : await this.fetchPage();
  }

  /**
   * Fetches a single page of the result set from where it previously left off.
   * Mutates self to remember where it left off.
   *
   * @returns The next page of the result set.
   */
  async fetchPage(): Promise<A> {
    const resp = await this.fetchNext();
    return this.#combineFn(undefined, resp);
  }

  /**
   * Fetches the next response, from where it previously left off.
   * Mutates self to remember where it left off.
   *
   * @returns The next response.
   * @throws If already done
   */
  async fetchNext(): Promise<U> {
    if (this.#done) {
      throw new Error("Already done.");
    }
    const resp = await this.#listFn({
      "page.size": this.#opts.size,
      "page.start": this.#last,
    });
    this.#last = this.#lastFn(resp);
    this.#done = !this.#last;
    return resp;
  }

  /**
   * Fetches the entire result set starting from where it previously left off
   * by iterating through the pages returned by the remote end.
   *
   * @returns The entire result set.
   */
  async fetchAll(): Promise<A> {
    const first = await this.fetchNext();
    let result = this.#combineFn(undefined, first);
    while (!this.#done) {
      const next = await this.fetchNext();
      result = this.#combineFn(result, next);
    }
    return result;
  }
}
