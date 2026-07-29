var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Paginator_listFn, _Paginator_lastFn, _Paginator_combineFn, _Paginator_opts, _Paginator_last, _Paginator_done;
/** Static constructors for `IPage` */
export class Page {
    /**
     * The default is to fetch the entire result set
     * (by repeatedly calling the remote endpoint until all pages are retrieved).
     *
     * @returns Pagination options.
     */
    static default() {
        return {
            all: true,
        };
    }
}
/**
 * Helper class for fetching paginated results.
 *
 * @template U The type of the response
 * @template A The type of the aggregate result (produced by {@link fetchAll})
 */
export class Paginator {
    /**
     * @param pageOpts Pagination options
     * @param listFn Calls a remote endpoint that returns a paginated response
     * @param lastFn Extracts the last evaluated key from the paginated response
     * @param combineFn Combines the current response with a previous one
     */
    constructor(pageOpts, listFn, lastFn, combineFn) {
        _Paginator_listFn.set(this, void 0);
        _Paginator_lastFn.set(this, void 0);
        _Paginator_combineFn.set(this, void 0);
        _Paginator_opts.set(this, void 0);
        _Paginator_last.set(this, void 0);
        _Paginator_done.set(this, void 0);
        __classPrivateFieldSet(this, _Paginator_listFn, listFn, "f");
        __classPrivateFieldSet(this, _Paginator_combineFn, combineFn, "f");
        __classPrivateFieldSet(this, _Paginator_lastFn, lastFn, "f");
        __classPrivateFieldSet(this, _Paginator_opts, pageOpts, "f");
        __classPrivateFieldSet(this, _Paginator_last, pageOpts.start, "f");
        __classPrivateFieldSet(this, _Paginator_done, false, "f");
    }
    /**
     * @param pageOpts Pagination options
     * @param listFn Calls a remote endpoint that returns a paginated response
     * @param itemsFn Extracts items from the paginated response
     * @param lastFn Extracts the last evaluated key from the paginated response
     * @returns Paginator which combines responses by concatenating their items (as defined by {@link itemsFn}).
     */
    static items(pageOpts, listFn, itemsFn, lastFn) {
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
    isDone() {
        return __classPrivateFieldGet(this, _Paginator_done, "f");
    }
    /**
     * Fetches either a single page or the entire result set, depending on
     * the `all` property of the pagination options.
     *
     * @returns A single page or the entire result set.
     */
    async fetch() {
        return __classPrivateFieldGet(this, _Paginator_opts, "f").all ? await this.fetchAll() : await this.fetchPage();
    }
    /**
     * Fetches a single page of the result set from where it previously left off.
     * Mutates self to remember where it left off.
     *
     * @returns The next page of the result set.
     */
    async fetchPage() {
        const resp = await this.fetchNext();
        return __classPrivateFieldGet(this, _Paginator_combineFn, "f").call(this, undefined, resp);
    }
    /**
     * Fetches the next response, from where it previously left off.
     * Mutates self to remember where it left off.
     *
     * @returns The next response.
     * @throws If already done
     */
    async fetchNext() {
        if (__classPrivateFieldGet(this, _Paginator_done, "f")) {
            throw new Error("Already done.");
        }
        const resp = await __classPrivateFieldGet(this, _Paginator_listFn, "f").call(this, {
            "page.size": __classPrivateFieldGet(this, _Paginator_opts, "f").size,
            "page.start": __classPrivateFieldGet(this, _Paginator_last, "f"),
        });
        __classPrivateFieldSet(this, _Paginator_last, __classPrivateFieldGet(this, _Paginator_lastFn, "f").call(this, resp), "f");
        __classPrivateFieldSet(this, _Paginator_done, !__classPrivateFieldGet(this, _Paginator_last, "f"), "f");
        return resp;
    }
    /**
     * Fetches the entire result set starting from where it previously left off
     * by iterating through the pages returned by the remote end.
     *
     * @returns The entire result set.
     */
    async fetchAll() {
        const first = await this.fetchNext();
        let result = __classPrivateFieldGet(this, _Paginator_combineFn, "f").call(this, undefined, first);
        while (!__classPrivateFieldGet(this, _Paginator_done, "f")) {
            const next = await this.fetchNext();
            result = __classPrivateFieldGet(this, _Paginator_combineFn, "f").call(this, result, next);
        }
        return result;
    }
}
_Paginator_listFn = new WeakMap(), _Paginator_lastFn = new WeakMap(), _Paginator_combineFn = new WeakMap(), _Paginator_opts = new WeakMap(), _Paginator_last = new WeakMap(), _Paginator_done = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5hdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhZ2luYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFhQSxzQ0FBc0M7QUFDdEMsTUFBTSxPQUFPLElBQUk7SUFDZjs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxPQUFPO1FBQ1osT0FBaUI7WUFDZixHQUFHLEVBQUUsSUFBSTtTQUNWLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF5QkQ7Ozs7O0dBS0c7QUFDSCxNQUFNLE9BQU8sU0FBUztJQVFwQjs7Ozs7T0FLRztJQUNILFlBQ0UsUUFBa0IsRUFDbEIsTUFBaUIsRUFDakIsTUFBaUIsRUFDakIsU0FBMEI7UUFqQm5CLG9DQUFtQjtRQUNuQixvQ0FBbUI7UUFDbkIsdUNBQTRCO1FBQ3JDLGtDQUFnQjtRQUNoQixrQ0FBaUM7UUFDakMsa0NBQWU7UUFjYix1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksd0JBQWMsU0FBUyxNQUFBLENBQUM7UUFDNUIsdUJBQUEsSUFBSSxxQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLG1CQUFTLFFBQVEsTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksbUJBQVMsUUFBUSxDQUFDLEtBQUssTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksbUJBQVMsS0FBSyxNQUFBLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILE1BQU0sQ0FBQyxLQUFLLENBQ1YsUUFBa0IsRUFDbEIsTUFBaUIsRUFDakIsT0FBeUIsRUFDekIsTUFBaUI7UUFFakIsT0FBTyxJQUFJLFNBQVMsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRTtZQUMzRCxNQUFNLE1BQU0sR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDO1lBQ3pCLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5QixPQUFPLE1BQU0sQ0FBQztRQUNoQixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNO1FBQ0osT0FBTyx1QkFBQSxJQUFJLHVCQUFNLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxPQUFPLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sdUJBQUEsSUFBSSw0QkFBVyxNQUFmLElBQUksRUFBWSxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSx1QkFBQSxJQUFJLHVCQUFNLEVBQUUsQ0FBQztZQUNmLE1BQU0sSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUNELE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSx5QkFBUSxNQUFaLElBQUksRUFBUztZQUM5QixXQUFXLEVBQUUsdUJBQUEsSUFBSSx1QkFBTSxDQUFDLElBQUk7WUFDNUIsWUFBWSxFQUFFLHVCQUFBLElBQUksdUJBQU07U0FDekIsQ0FBQyxDQUFDO1FBQ0gsdUJBQUEsSUFBSSxtQkFBUyx1QkFBQSxJQUFJLHlCQUFRLE1BQVosSUFBSSxFQUFTLElBQUksQ0FBQyxNQUFBLENBQUM7UUFDaEMsdUJBQUEsSUFBSSxtQkFBUyxDQUFDLHVCQUFBLElBQUksdUJBQU0sTUFBQSxDQUFDO1FBQ3pCLE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNyQyxJQUFJLE1BQU0sR0FBRyx1QkFBQSxJQUFJLDRCQUFXLE1BQWYsSUFBSSxFQUFZLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsdUJBQUEsSUFBSSx1QkFBTSxFQUFFLENBQUM7WUFDbkIsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDcEMsTUFBTSxHQUFHLHVCQUFBLElBQUksNEJBQVcsTUFBZixJQUFJLEVBQVksTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ3pDLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogUGFnaW5hdGlvbiBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYWdlT3B0cyB7XG4gIC8qKiBNYXggbnVtYmVyIG9mIGl0ZW1zIHBlciBwYWdlLiAqL1xuICBzaXplPzogbnVtYmVyO1xuICAvKipcbiAgICogU3RhcnRpbmcgcG9pbnQgKGkuZS4sICdsYXN0X2V2YWx1YXRlZF9rZXknIGZyb20gdGhlIHByZXZpb3VzIHBhZ2UpLlxuICAgKiBPbWl0IHRvIHN0YXJ0IGZyb20gdGhlIGJlZ2lubmluZy5cbiAgICovXG4gIHN0YXJ0Pzogc3RyaW5nO1xuICAvKiogSXRlcmF0ZSB1bnRpbCByZXRyaWV2aW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC4gKi9cbiAgYWxsOiBib29sZWFuO1xufVxuXG4vKiogU3RhdGljIGNvbnN0cnVjdG9ycyBmb3IgYElQYWdlYCAqL1xuZXhwb3J0IGNsYXNzIFBhZ2Uge1xuICAvKipcbiAgICogVGhlIGRlZmF1bHQgaXMgdG8gZmV0Y2ggdGhlIGVudGlyZSByZXN1bHQgc2V0XG4gICAqIChieSByZXBlYXRlZGx5IGNhbGxpbmcgdGhlIHJlbW90ZSBlbmRwb2ludCB1bnRpbCBhbGwgcGFnZXMgYXJlIHJldHJpZXZlZCkuXG4gICAqXG4gICAqIEByZXR1cm5zIFBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0KCk6IFBhZ2VPcHRzIHtcbiAgICByZXR1cm4gPFBhZ2VPcHRzPntcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFnZVF1ZXJ5QXJncyB7XG4gIC8qKlxuICAgKiBNYXggbnVtYmVyIG9mIGl0ZW1zIHRvIHJldHVybiBwZXIgcGFnZS5cbiAgICpcbiAgICogVGhlIGFjdHVhbCBudW1iZXIgb2YgcmV0dXJuZWQgaXRlbXMgbWF5IGJlIGxlc3MgdGhhdCB0aGlzLCBldmVuIGlmIHRoZXJlIGV4aXN0IG1vcmVcbiAgICogZGF0YSBpbiB0aGUgcmVzdWx0IHNldC4gVG8gcmVsaWFibHkgZGV0ZXJtaW5lIGlmIG1vcmUgZGF0YSBpcyBsZWZ0IGluIHRoZSByZXN1bHQgc2V0LFxuICAgKiBpbnNwZWN0IHRoZSBbVW5lbmNyeXB0ZWRMYXN0RXZhbEtleV0gdmFsdWUgaW4gdGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICovXG4gIFwicGFnZS5zaXplXCI/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFydCBvZiB0aGUgcGFnZS5cbiAgICpcbiAgICogT21pdCB0byBzdGFydCBmcm9tIHRoZSBiZWdpbm5pbmc7IG90aGVyd2lzZSwgb25seSBzcGVjaWZ5IHRoZSBleGFjdFxuICAgKiB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGFzICdsYXN0X2V2YWx1YXRlZF9rZXknIGZyb20gdGhlIHNhbWUgZW5kcG9pbnQuXG4gICAqL1xuICBcInBhZ2Uuc3RhcnRcIj86IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIExpc3RGbjxVPiA9IChwYWdlUXVlcnlBcmdzOiBQYWdlUXVlcnlBcmdzKSA9PiBQcm9taXNlPFU+O1xuZXhwb3J0IHR5cGUgTGFzdEZuPFU+ID0gKHJlc3A6IFUpID0+IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG5leHBvcnQgdHlwZSBDb21iaW5lRm48QSwgVT4gPSAoYWNjOiBBIHwgdW5kZWZpbmVkLCBuZXh0OiBVKSA9PiBBO1xuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgZmV0Y2hpbmcgcGFnaW5hdGVkIHJlc3VsdHMuXG4gKlxuICogQHRlbXBsYXRlIFUgVGhlIHR5cGUgb2YgdGhlIHJlc3BvbnNlXG4gKiBAdGVtcGxhdGUgQSBUaGUgdHlwZSBvZiB0aGUgYWdncmVnYXRlIHJlc3VsdCAocHJvZHVjZWQgYnkge0BsaW5rIGZldGNoQWxsfSlcbiAqL1xuZXhwb3J0IGNsYXNzIFBhZ2luYXRvcjxVLCBBPiB7XG4gIHJlYWRvbmx5ICNsaXN0Rm46IExpc3RGbjxVPjtcbiAgcmVhZG9ubHkgI2xhc3RGbjogTGFzdEZuPFU+O1xuICByZWFkb25seSAjY29tYmluZUZuOiBDb21iaW5lRm48QSwgVT47XG4gICNvcHRzOiBQYWdlT3B0cztcbiAgI2xhc3Q6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gICNkb25lOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSBsaXN0Rm4gQ2FsbHMgYSByZW1vdGUgZW5kcG9pbnQgdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqIEBwYXJhbSBsYXN0Rm4gRXh0cmFjdHMgdGhlIGxhc3QgZXZhbHVhdGVkIGtleSBmcm9tIHRoZSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHBhcmFtIGNvbWJpbmVGbiBDb21iaW5lcyB0aGUgY3VycmVudCByZXNwb25zZSB3aXRoIGEgcHJldmlvdXMgb25lXG4gICAqL1xuICBjb25zdHJ1Y3RvcihcbiAgICBwYWdlT3B0czogUGFnZU9wdHMsXG4gICAgbGlzdEZuOiBMaXN0Rm48VT4sXG4gICAgbGFzdEZuOiBMYXN0Rm48VT4sXG4gICAgY29tYmluZUZuOiBDb21iaW5lRm48QSwgVT4sXG4gICkge1xuICAgIHRoaXMuI2xpc3RGbiA9IGxpc3RGbjtcbiAgICB0aGlzLiNjb21iaW5lRm4gPSBjb21iaW5lRm47XG4gICAgdGhpcy4jbGFzdEZuID0gbGFzdEZuO1xuICAgIHRoaXMuI29wdHMgPSBwYWdlT3B0cztcbiAgICB0aGlzLiNsYXN0ID0gcGFnZU9wdHMuc3RhcnQ7XG4gICAgdGhpcy4jZG9uZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIGxpc3RGbiBDYWxscyBhIHJlbW90ZSBlbmRwb2ludCB0aGF0IHJldHVybnMgYSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHBhcmFtIGl0ZW1zRm4gRXh0cmFjdHMgaXRlbXMgZnJvbSB0aGUgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqIEBwYXJhbSBsYXN0Rm4gRXh0cmFjdHMgdGhlIGxhc3QgZXZhbHVhdGVkIGtleSBmcm9tIHRoZSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHJldHVybnMgUGFnaW5hdG9yIHdoaWNoIGNvbWJpbmVzIHJlc3BvbnNlcyBieSBjb25jYXRlbmF0aW5nIHRoZWlyIGl0ZW1zIChhcyBkZWZpbmVkIGJ5IHtAbGluayBpdGVtc0ZufSkuXG4gICAqL1xuICBzdGF0aWMgaXRlbXM8VSwgVD4oXG4gICAgcGFnZU9wdHM6IFBhZ2VPcHRzLFxuICAgIGxpc3RGbjogTGlzdEZuPFU+LFxuICAgIGl0ZW1zRm46IChyZXNwOiBVKSA9PiBUW10sXG4gICAgbGFzdEZuOiBMYXN0Rm48VT4sXG4gICk6IFBhZ2luYXRvcjxVLCBUW10+IHtcbiAgICByZXR1cm4gbmV3IFBhZ2luYXRvcihwYWdlT3B0cywgbGlzdEZuLCBsYXN0Rm4sIChhY2MsIG5leHQpID0+IHtcbiAgICAgIGNvbnN0IHJlc3VsdCA9IGFjYyA/PyBbXTtcbiAgICAgIHJlc3VsdC5wdXNoKC4uLml0ZW1zRm4obmV4dCkpO1xuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcmV0dXJucyBXaGV0aGVyIHRoaXMgcGFnaW5hdG9yIGFscmVhZHkgZmV0Y2hlZCBldmVyeXRoaW5nLiBPbmNlIGRvbmUsIGNhbGxpbmdcbiAgICogIHtAbGluayBmZXRjaE5leHR9LCB7QGxpbmsgZmV0Y2hQYWdlfSwgYW5kIHtAbGluayBmZXRjaEFsbH0gaXMgbm8gbG9uZ2VyIGFsbG93ZWQuXG4gICAqL1xuICBpc0RvbmUoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuI2RvbmU7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBlaXRoZXIgYSBzaW5nbGUgcGFnZSBvciB0aGUgZW50aXJlIHJlc3VsdCBzZXQsIGRlcGVuZGluZyBvblxuICAgKiB0aGUgYGFsbGAgcHJvcGVydHkgb2YgdGhlIHBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgQSBzaW5nbGUgcGFnZSBvciB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPEE+IHtcbiAgICByZXR1cm4gdGhpcy4jb3B0cy5hbGwgPyBhd2FpdCB0aGlzLmZldGNoQWxsKCkgOiBhd2FpdCB0aGlzLmZldGNoUGFnZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYSBzaW5nbGUgcGFnZSBvZiB0aGUgcmVzdWx0IHNldCBmcm9tIHdoZXJlIGl0IHByZXZpb3VzbHkgbGVmdCBvZmYuXG4gICAqIE11dGF0ZXMgc2VsZiB0byByZW1lbWJlciB3aGVyZSBpdCBsZWZ0IG9mZi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5leHQgcGFnZSBvZiB0aGUgcmVzdWx0IHNldC5cbiAgICovXG4gIGFzeW5jIGZldGNoUGFnZSgpOiBQcm9taXNlPEE+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy5mZXRjaE5leHQoKTtcbiAgICByZXR1cm4gdGhpcy4jY29tYmluZUZuKHVuZGVmaW5lZCwgcmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgbmV4dCByZXNwb25zZSwgZnJvbSB3aGVyZSBpdCBwcmV2aW91c2x5IGxlZnQgb2ZmLlxuICAgKiBNdXRhdGVzIHNlbGYgdG8gcmVtZW1iZXIgd2hlcmUgaXQgbGVmdCBvZmYuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBuZXh0IHJlc3BvbnNlLlxuICAgKiBAdGhyb3dzIElmIGFscmVhZHkgZG9uZVxuICAgKi9cbiAgYXN5bmMgZmV0Y2hOZXh0KCk6IFByb21pc2U8VT4ge1xuICAgIGlmICh0aGlzLiNkb25lKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBbHJlYWR5IGRvbmUuXCIpO1xuICAgIH1cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jbGlzdEZuKHtcbiAgICAgIFwicGFnZS5zaXplXCI6IHRoaXMuI29wdHMuc2l6ZSxcbiAgICAgIFwicGFnZS5zdGFydFwiOiB0aGlzLiNsYXN0LFxuICAgIH0pO1xuICAgIHRoaXMuI2xhc3QgPSB0aGlzLiNsYXN0Rm4ocmVzcCk7XG4gICAgdGhpcy4jZG9uZSA9ICF0aGlzLiNsYXN0O1xuICAgIHJldHVybiByZXNwO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGVudGlyZSByZXN1bHQgc2V0IHN0YXJ0aW5nIGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZlxuICAgKiBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgcGFnZXMgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICovXG4gIGFzeW5jIGZldGNoQWxsKCk6IFByb21pc2U8QT4ge1xuICAgIGNvbnN0IGZpcnN0ID0gYXdhaXQgdGhpcy5mZXRjaE5leHQoKTtcbiAgICBsZXQgcmVzdWx0ID0gdGhpcy4jY29tYmluZUZuKHVuZGVmaW5lZCwgZmlyc3QpO1xuICAgIHdoaWxlICghdGhpcy4jZG9uZSkge1xuICAgICAgY29uc3QgbmV4dCA9IGF3YWl0IHRoaXMuZmV0Y2hOZXh0KCk7XG4gICAgICByZXN1bHQgPSB0aGlzLiNjb21iaW5lRm4ocmVzdWx0LCBuZXh0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19