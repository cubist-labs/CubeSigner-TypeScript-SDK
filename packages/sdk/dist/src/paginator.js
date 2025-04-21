"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Paginator = exports.Page = void 0;
/** Static constructors for `IPage` */
class Page {
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
exports.Page = Page;
/**
 * Helper class for fetching paginated results.
 *
 * @template U The type of the response
 * @template A The type of the aggregate result (produced by {@link fetchAll})
 */
class Paginator {
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
exports.Paginator = Paginator;
_Paginator_listFn = new WeakMap(), _Paginator_lastFn = new WeakMap(), _Paginator_combineFn = new WeakMap(), _Paginator_opts = new WeakMap(), _Paginator_last = new WeakMap(), _Paginator_done = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5hdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhZ2luYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFhQSxzQ0FBc0M7QUFDdEMsTUFBYSxJQUFJO0lBQ2Y7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsT0FBTztRQUNaLE9BQWlCO1lBQ2YsR0FBRyxFQUFFLElBQUk7U0FDVixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBWkQsb0JBWUM7QUF5QkQ7Ozs7O0dBS0c7QUFDSCxNQUFhLFNBQVM7SUFRcEI7Ozs7O09BS0c7SUFDSCxZQUNFLFFBQWtCLEVBQ2xCLE1BQWlCLEVBQ2pCLE1BQWlCLEVBQ2pCLFNBQTBCO1FBakJuQixvQ0FBbUI7UUFDbkIsb0NBQW1CO1FBQ25CLHVDQUE0QjtRQUNyQyxrQ0FBZ0I7UUFDaEIsa0NBQWlDO1FBQ2pDLGtDQUFlO1FBY2IsdUJBQUEsSUFBSSxxQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLHdCQUFjLFNBQVMsTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxtQkFBUyxRQUFRLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLG1CQUFTLFFBQVEsQ0FBQyxLQUFLLE1BQUEsQ0FBQztRQUM1Qix1QkFBQSxJQUFJLG1CQUFTLEtBQUssTUFBQSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsS0FBSyxDQUNWLFFBQWtCLEVBQ2xCLE1BQWlCLEVBQ2pCLE9BQXlCLEVBQ3pCLE1BQWlCO1FBRWpCLE9BQU8sSUFBSSxTQUFTLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLEVBQUU7WUFDM0QsTUFBTSxNQUFNLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQztZQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUIsT0FBTyxNQUFNLENBQUM7UUFDaEIsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsTUFBTTtRQUNKLE9BQU8sdUJBQUEsSUFBSSx1QkFBTSxDQUFDO0lBQ3BCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsT0FBTyx1QkFBQSxJQUFJLHVCQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7SUFDekUsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFNBQVM7UUFDYixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztRQUNwQyxPQUFPLHVCQUFBLElBQUksNEJBQVcsTUFBZixJQUFJLEVBQVksU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLElBQUksdUJBQUEsSUFBSSx1QkFBTSxFQUFFLENBQUM7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBQ25DLENBQUM7UUFDRCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUkseUJBQVEsTUFBWixJQUFJLEVBQVM7WUFDOUIsV0FBVyxFQUFFLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxJQUFJO1lBQzVCLFlBQVksRUFBRSx1QkFBQSxJQUFJLHVCQUFNO1NBQ3pCLENBQUMsQ0FBQztRQUNILHVCQUFBLElBQUksbUJBQVMsdUJBQUEsSUFBSSx5QkFBUSxNQUFaLElBQUksRUFBUyxJQUFJLENBQUMsTUFBQSxDQUFDO1FBQ2hDLHVCQUFBLElBQUksbUJBQVMsQ0FBQyx1QkFBQSxJQUFJLHVCQUFNLE1BQUEsQ0FBQztRQUN6QixPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7UUFDckMsSUFBSSxNQUFNLEdBQUcsdUJBQUEsSUFBSSw0QkFBVyxNQUFmLElBQUksRUFBWSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0MsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQU0sRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3BDLE1BQU0sR0FBRyx1QkFBQSxJQUFJLDRCQUFXLE1BQWYsSUFBSSxFQUFZLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUN6QyxDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBaEhELDhCQWdIQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBQYWdpbmF0aW9uIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VPcHRzIHtcbiAgLyoqIE1heCBudW1iZXIgb2YgaXRlbXMgcGVyIHBhZ2UuICovXG4gIHNpemU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBTdGFydGluZyBwb2ludCAoaS5lLiwgJ2xhc3RfZXZhbHVhdGVkX2tleScgZnJvbSB0aGUgcHJldmlvdXMgcGFnZSkuXG4gICAqIE9taXQgdG8gc3RhcnQgZnJvbSB0aGUgYmVnaW5uaW5nLlxuICAgKi9cbiAgc3RhcnQ/OiBzdHJpbmc7XG4gIC8qKiBJdGVyYXRlIHVudGlsIHJldHJpZXZpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LiAqL1xuICBhbGw6IGJvb2xlYW47XG59XG5cbi8qKiBTdGF0aWMgY29uc3RydWN0b3JzIGZvciBgSVBhZ2VgICovXG5leHBvcnQgY2xhc3MgUGFnZSB7XG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBpcyB0byBmZXRjaCB0aGUgZW50aXJlIHJlc3VsdCBzZXRcbiAgICogKGJ5IHJlcGVhdGVkbHkgY2FsbGluZyB0aGUgcmVtb3RlIGVuZHBvaW50IHVudGlsIGFsbCBwYWdlcyBhcmUgcmV0cmlldmVkKS5cbiAgICpcbiAgICogQHJldHVybnMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgc3RhdGljIGRlZmF1bHQoKTogUGFnZU9wdHMge1xuICAgIHJldHVybiA8UGFnZU9wdHM+e1xuICAgICAgYWxsOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlUXVlcnlBcmdzIHtcbiAgLyoqXG4gICAqIE1heCBudW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIHBlciBwYWdlLlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIG51bWJlciBvZiByZXR1cm5lZCBpdGVtcyBtYXkgYmUgbGVzcyB0aGF0IHRoaXMsIGV2ZW4gaWYgdGhlcmUgZXhpc3QgbW9yZVxuICAgKiBkYXRhIGluIHRoZSByZXN1bHQgc2V0LiBUbyByZWxpYWJseSBkZXRlcm1pbmUgaWYgbW9yZSBkYXRhIGlzIGxlZnQgaW4gdGhlIHJlc3VsdCBzZXQsXG4gICAqIGluc3BlY3QgdGhlIFtVbmVuY3J5cHRlZExhc3RFdmFsS2V5XSB2YWx1ZSBpbiB0aGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgKi9cbiAgXCJwYWdlLnNpemVcIj86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIHN0YXJ0IG9mIHRoZSBwYWdlLlxuICAgKlxuICAgKiBPbWl0IHRvIHN0YXJ0IGZyb20gdGhlIGJlZ2lubmluZzsgb3RoZXJ3aXNlLCBvbmx5IHNwZWNpZnkgdGhlIGV4YWN0XG4gICAqIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgYXMgJ2xhc3RfZXZhbHVhdGVkX2tleScgZnJvbSB0aGUgc2FtZSBlbmRwb2ludC5cbiAgICovXG4gIFwicGFnZS5zdGFydFwiPzogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgTGlzdEZuPFU+ID0gKHBhZ2VRdWVyeUFyZ3M6IFBhZ2VRdWVyeUFyZ3MpID0+IFByb21pc2U8VT47XG5leHBvcnQgdHlwZSBMYXN0Rm48VT4gPSAocmVzcDogVSkgPT4gc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbmV4cG9ydCB0eXBlIENvbWJpbmVGbjxBLCBVPiA9IChhY2M6IEEgfCB1bmRlZmluZWQsIG5leHQ6IFUpID0+IEE7XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBmZXRjaGluZyBwYWdpbmF0ZWQgcmVzdWx0cy5cbiAqXG4gKiBAdGVtcGxhdGUgVSBUaGUgdHlwZSBvZiB0aGUgcmVzcG9uc2VcbiAqIEB0ZW1wbGF0ZSBBIFRoZSB0eXBlIG9mIHRoZSBhZ2dyZWdhdGUgcmVzdWx0IChwcm9kdWNlZCBieSB7QGxpbmsgZmV0Y2hBbGx9KVxuICovXG5leHBvcnQgY2xhc3MgUGFnaW5hdG9yPFUsIEE+IHtcbiAgcmVhZG9ubHkgI2xpc3RGbjogTGlzdEZuPFU+O1xuICByZWFkb25seSAjbGFzdEZuOiBMYXN0Rm48VT47XG4gIHJlYWRvbmx5ICNjb21iaW5lRm46IENvbWJpbmVGbjxBLCBVPjtcbiAgI29wdHM6IFBhZ2VPcHRzO1xuICAjbGFzdDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgI2RvbmU6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBwYWdlT3B0cyBQYWdpbmF0aW9uIG9wdGlvbnNcbiAgICogQHBhcmFtIGxpc3RGbiBDYWxscyBhIHJlbW90ZSBlbmRwb2ludCB0aGF0IHJldHVybnMgYSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHBhcmFtIGxhc3RGbiBFeHRyYWN0cyB0aGUgbGFzdCBldmFsdWF0ZWQga2V5IGZyb20gdGhlIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKiBAcGFyYW0gY29tYmluZUZuIENvbWJpbmVzIHRoZSBjdXJyZW50IHJlc3BvbnNlIHdpdGggYSBwcmV2aW91cyBvbmVcbiAgICovXG4gIGNvbnN0cnVjdG9yKFxuICAgIHBhZ2VPcHRzOiBQYWdlT3B0cyxcbiAgICBsaXN0Rm46IExpc3RGbjxVPixcbiAgICBsYXN0Rm46IExhc3RGbjxVPixcbiAgICBjb21iaW5lRm46IENvbWJpbmVGbjxBLCBVPixcbiAgKSB7XG4gICAgdGhpcy4jbGlzdEZuID0gbGlzdEZuO1xuICAgIHRoaXMuI2NvbWJpbmVGbiA9IGNvbWJpbmVGbjtcbiAgICB0aGlzLiNsYXN0Rm4gPSBsYXN0Rm47XG4gICAgdGhpcy4jb3B0cyA9IHBhZ2VPcHRzO1xuICAgIHRoaXMuI2xhc3QgPSBwYWdlT3B0cy5zdGFydDtcbiAgICB0aGlzLiNkb25lID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHBhZ2VPcHRzIFBhZ2luYXRpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0gbGlzdEZuIENhbGxzIGEgcmVtb3RlIGVuZHBvaW50IHRoYXQgcmV0dXJucyBhIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKiBAcGFyYW0gaXRlbXNGbiBFeHRyYWN0cyBpdGVtcyBmcm9tIHRoZSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHBhcmFtIGxhc3RGbiBFeHRyYWN0cyB0aGUgbGFzdCBldmFsdWF0ZWQga2V5IGZyb20gdGhlIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKiBAcmV0dXJucyBQYWdpbmF0b3Igd2hpY2ggY29tYmluZXMgcmVzcG9uc2VzIGJ5IGNvbmNhdGVuYXRpbmcgdGhlaXIgaXRlbXMgKGFzIGRlZmluZWQgYnkge0BsaW5rIGl0ZW1zRm59KS5cbiAgICovXG4gIHN0YXRpYyBpdGVtczxVLCBUPihcbiAgICBwYWdlT3B0czogUGFnZU9wdHMsXG4gICAgbGlzdEZuOiBMaXN0Rm48VT4sXG4gICAgaXRlbXNGbjogKHJlc3A6IFUpID0+IFRbXSxcbiAgICBsYXN0Rm46IExhc3RGbjxVPixcbiAgKTogUGFnaW5hdG9yPFUsIFRbXT4ge1xuICAgIHJldHVybiBuZXcgUGFnaW5hdG9yKHBhZ2VPcHRzLCBsaXN0Rm4sIGxhc3RGbiwgKGFjYywgbmV4dCkgPT4ge1xuICAgICAgY29uc3QgcmVzdWx0ID0gYWNjID8/IFtdO1xuICAgICAgcmVzdWx0LnB1c2goLi4uaXRlbXNGbihuZXh0KSk7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFdoZXRoZXIgdGhpcyBwYWdpbmF0b3IgYWxyZWFkeSBmZXRjaGVkIGV2ZXJ5dGhpbmcuIE9uY2UgZG9uZSwgY2FsbGluZ1xuICAgKiAge0BsaW5rIGZldGNoTmV4dH0sIHtAbGluayBmZXRjaFBhZ2V9LCBhbmQge0BsaW5rIGZldGNoQWxsfSBpcyBubyBsb25nZXIgYWxsb3dlZC5cbiAgICovXG4gIGlzRG9uZSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jZG9uZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGVpdGhlciBhIHNpbmdsZSBwYWdlIG9yIHRoZSBlbnRpcmUgcmVzdWx0IHNldCwgZGVwZW5kaW5nIG9uXG4gICAqIHRoZSBgYWxsYCBwcm9wZXJ0eSBvZiB0aGUgcGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJucyBBIHNpbmdsZSBwYWdlIG9yIHRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICovXG4gIGFzeW5jIGZldGNoKCk6IFByb21pc2U8QT4ge1xuICAgIHJldHVybiB0aGlzLiNvcHRzLmFsbCA/IGF3YWl0IHRoaXMuZmV0Y2hBbGwoKSA6IGF3YWl0IHRoaXMuZmV0Y2hQYWdlKCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhIHNpbmdsZSBwYWdlIG9mIHRoZSByZXN1bHQgc2V0IGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZi5cbiAgICogTXV0YXRlcyBzZWxmIHRvIHJlbWVtYmVyIHdoZXJlIGl0IGxlZnQgb2ZmLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV4dCBwYWdlIG9mIHRoZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2hQYWdlKCk6IFByb21pc2U8QT4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLmZldGNoTmV4dCgpO1xuICAgIHJldHVybiB0aGlzLiNjb21iaW5lRm4odW5kZWZpbmVkLCByZXNwKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBuZXh0IHJlc3BvbnNlLCBmcm9tIHdoZXJlIGl0IHByZXZpb3VzbHkgbGVmdCBvZmYuXG4gICAqIE11dGF0ZXMgc2VsZiB0byByZW1lbWJlciB3aGVyZSBpdCBsZWZ0IG9mZi5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIG5leHQgcmVzcG9uc2UuXG4gICAqIEB0aHJvd3MgSWYgYWxyZWFkeSBkb25lXG4gICAqL1xuICBhc3luYyBmZXRjaE5leHQoKTogUHJvbWlzZTxVPiB7XG4gICAgaWYgKHRoaXMuI2RvbmUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFscmVhZHkgZG9uZS5cIik7XG4gICAgfVxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNsaXN0Rm4oe1xuICAgICAgXCJwYWdlLnNpemVcIjogdGhpcy4jb3B0cy5zaXplLFxuICAgICAgXCJwYWdlLnN0YXJ0XCI6IHRoaXMuI2xhc3QsXG4gICAgfSk7XG4gICAgdGhpcy4jbGFzdCA9IHRoaXMuI2xhc3RGbihyZXNwKTtcbiAgICB0aGlzLiNkb25lID0gIXRoaXMuI2xhc3Q7XG4gICAgcmV0dXJuIHJlc3A7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgZW50aXJlIHJlc3VsdCBzZXQgc3RhcnRpbmcgZnJvbSB3aGVyZSBpdCBwcmV2aW91c2x5IGxlZnQgb2ZmXG4gICAqIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIHRoZSBwYWdlcyByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2hBbGwoKTogUHJvbWlzZTxBPiB7XG4gICAgY29uc3QgZmlyc3QgPSBhd2FpdCB0aGlzLmZldGNoTmV4dCgpO1xuICAgIGxldCByZXN1bHQgPSB0aGlzLiNjb21iaW5lRm4odW5kZWZpbmVkLCBmaXJzdCk7XG4gICAgd2hpbGUgKCF0aGlzLiNkb25lKSB7XG4gICAgICBjb25zdCBuZXh0ID0gYXdhaXQgdGhpcy5mZXRjaE5leHQoKTtcbiAgICAgIHJlc3VsdCA9IHRoaXMuI2NvbWJpbmVGbihyZXN1bHQsIG5leHQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXX0=