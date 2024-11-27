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
   * @return {PageOpts} Pagination options.
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
export type ItemsFn<U, T> = (resp: U) => T[];
export type LastFn<U> = (resp: U) => string | null | undefined;

/**
 * Helper class for fetching paginated results.
 */
export class Paginator<U, T> {
  readonly #listFn: ListFn<U>;
  readonly #itemsFn: ItemsFn<U, T>;
  readonly #lastFn: LastFn<U>;
  #opts: PageOpts;
  #last: string | null | undefined;
  #done: boolean;

  /**
   * @param {PageOpts} pageOpts Pagination options
   * @param {ListFn<U>} listFn Calls a remote endpoint that returns a paginated response
   * @param {ItemsFn<U, T>} itemsFn Extracts items from the paginated response
   * @param {LastFn<U>} lastFn Extracts the last evaluated key from the paginated response
   */
  constructor(pageOpts: PageOpts, listFn: ListFn<U>, itemsFn: ItemsFn<U, T>, lastFn: LastFn<U>) {
    this.#listFn = listFn;
    this.#itemsFn = itemsFn;
    this.#lastFn = lastFn;
    this.#opts = pageOpts;
    this.#last = pageOpts.start;
    this.#done = false;
  }

  /**
   * Fetches either a single page or the entire result set, depending on
   * the `all` property of the pagination options.
   *
   * @return {Promise<T[]>} A single page or the entire result set.
   */
  async fetch(): Promise<T[]> {
    return this.#opts.all ? await this.fetchAll() : await this.fetchPage();
  }

  /**
   * Fetches a single page of the result set from where it previously left off.
   * Mutates self to remember where it left off.
   *
   * @return {Promise<T[]>} The next page of the result set.
   */
  async fetchPage(): Promise<T[]> {
    if (this.#done) {
      return [];
    }

    const resp = await this.#listFn({
      "page.size": this.#opts.size,
      "page.start": this.#last,
    });
    this.#last = this.#lastFn(resp);
    this.#done = !this.#last;
    return this.#itemsFn(resp);
  }

  /**
   * Fetches the entire result set starting from where it previously left off
   * by iterating through the pages returned by the remote end.
   *
   * @return {Promise<T[]>} The entire result set.
   */
  async fetchAll(): Promise<T[]> {
    const result = [];
    while (!this.#done) {
      const items = await this.fetchPage();
      result.push(...items);
    }
    return result;
  }
}
