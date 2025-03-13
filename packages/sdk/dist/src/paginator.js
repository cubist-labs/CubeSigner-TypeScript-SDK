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
var _Paginator_listFn, _Paginator_itemsFn, _Paginator_lastFn, _Paginator_opts, _Paginator_last, _Paginator_done;
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
 */
class Paginator {
    /**
     * @param pageOpts Pagination options
     * @param listFn Calls a remote endpoint that returns a paginated response
     * @param itemsFn Extracts items from the paginated response
     * @param lastFn Extracts the last evaluated key from the paginated response
     */
    constructor(pageOpts, listFn, itemsFn, lastFn) {
        _Paginator_listFn.set(this, void 0);
        _Paginator_itemsFn.set(this, void 0);
        _Paginator_lastFn.set(this, void 0);
        _Paginator_opts.set(this, void 0);
        _Paginator_last.set(this, void 0);
        _Paginator_done.set(this, void 0);
        __classPrivateFieldSet(this, _Paginator_listFn, listFn, "f");
        __classPrivateFieldSet(this, _Paginator_itemsFn, itemsFn, "f");
        __classPrivateFieldSet(this, _Paginator_lastFn, lastFn, "f");
        __classPrivateFieldSet(this, _Paginator_opts, pageOpts, "f");
        __classPrivateFieldSet(this, _Paginator_last, pageOpts.start, "f");
        __classPrivateFieldSet(this, _Paginator_done, false, "f");
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
        if (__classPrivateFieldGet(this, _Paginator_done, "f")) {
            return [];
        }
        const resp = await __classPrivateFieldGet(this, _Paginator_listFn, "f").call(this, {
            "page.size": __classPrivateFieldGet(this, _Paginator_opts, "f").size,
            "page.start": __classPrivateFieldGet(this, _Paginator_last, "f"),
        });
        __classPrivateFieldSet(this, _Paginator_last, __classPrivateFieldGet(this, _Paginator_lastFn, "f").call(this, resp), "f");
        __classPrivateFieldSet(this, _Paginator_done, !__classPrivateFieldGet(this, _Paginator_last, "f"), "f");
        return __classPrivateFieldGet(this, _Paginator_itemsFn, "f").call(this, resp);
    }
    /**
     * Fetches the entire result set starting from where it previously left off
     * by iterating through the pages returned by the remote end.
     *
     * @returns The entire result set.
     */
    async fetchAll() {
        const result = [];
        while (!__classPrivateFieldGet(this, _Paginator_done, "f")) {
            const items = await this.fetchPage();
            result.push(...items);
        }
        return result;
    }
}
exports.Paginator = Paginator;
_Paginator_listFn = new WeakMap(), _Paginator_itemsFn = new WeakMap(), _Paginator_lastFn = new WeakMap(), _Paginator_opts = new WeakMap(), _Paginator_last = new WeakMap(), _Paginator_done = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5hdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3BhZ2luYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFhQSxzQ0FBc0M7QUFDdEMsTUFBYSxJQUFJO0lBQ2Y7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsT0FBTztRQUNaLE9BQWlCO1lBQ2YsR0FBRyxFQUFFLElBQUk7U0FDVixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBWkQsb0JBWUM7QUF5QkQ7O0dBRUc7QUFDSCxNQUFhLFNBQVM7SUFRcEI7Ozs7O09BS0c7SUFDSCxZQUFZLFFBQWtCLEVBQUUsTUFBaUIsRUFBRSxPQUFzQixFQUFFLE1BQWlCO1FBYm5GLG9DQUFtQjtRQUNuQixxQ0FBd0I7UUFDeEIsb0NBQW1CO1FBQzVCLGtDQUFnQjtRQUNoQixrQ0FBaUM7UUFDakMsa0NBQWU7UUFTYix1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksc0JBQVksT0FBTyxNQUFBLENBQUM7UUFDeEIsdUJBQUEsSUFBSSxxQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLG1CQUFTLFFBQVEsTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksbUJBQVMsUUFBUSxDQUFDLEtBQUssTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksbUJBQVMsS0FBSyxNQUFBLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxPQUFPLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLElBQUksdUJBQUEsSUFBSSx1QkFBTSxFQUFFLENBQUM7WUFDZixPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUkseUJBQVEsTUFBWixJQUFJLEVBQVM7WUFDOUIsV0FBVyxFQUFFLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxJQUFJO1lBQzVCLFlBQVksRUFBRSx1QkFBQSxJQUFJLHVCQUFNO1NBQ3pCLENBQUMsQ0FBQztRQUNILHVCQUFBLElBQUksbUJBQVMsdUJBQUEsSUFBSSx5QkFBUSxNQUFaLElBQUksRUFBUyxJQUFJLENBQUMsTUFBQSxDQUFDO1FBQ2hDLHVCQUFBLElBQUksbUJBQVMsQ0FBQyx1QkFBQSxJQUFJLHVCQUFNLE1BQUEsQ0FBQztRQUN6QixPQUFPLHVCQUFBLElBQUksMEJBQVMsTUFBYixJQUFJLEVBQVUsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQU0sRUFBRSxDQUFDO1lBQ25CLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBbkVELDhCQW1FQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBQYWdpbmF0aW9uIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VPcHRzIHtcbiAgLyoqIE1heCBudW1iZXIgb2YgaXRlbXMgcGVyIHBhZ2UuICovXG4gIHNpemU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBTdGFydGluZyBwb2ludCAoaS5lLiwgJ2xhc3RfZXZhbHVhdGVkX2tleScgZnJvbSB0aGUgcHJldmlvdXMgcGFnZSkuXG4gICAqIE9taXQgdG8gc3RhcnQgZnJvbSB0aGUgYmVnaW5uaW5nLlxuICAgKi9cbiAgc3RhcnQ/OiBzdHJpbmc7XG4gIC8qKiBJdGVyYXRlIHVudGlsIHJldHJpZXZpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LiAqL1xuICBhbGw6IGJvb2xlYW47XG59XG5cbi8qKiBTdGF0aWMgY29uc3RydWN0b3JzIGZvciBgSVBhZ2VgICovXG5leHBvcnQgY2xhc3MgUGFnZSB7XG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBpcyB0byBmZXRjaCB0aGUgZW50aXJlIHJlc3VsdCBzZXRcbiAgICogKGJ5IHJlcGVhdGVkbHkgY2FsbGluZyB0aGUgcmVtb3RlIGVuZHBvaW50IHVudGlsIGFsbCBwYWdlcyBhcmUgcmV0cmlldmVkKS5cbiAgICpcbiAgICogQHJldHVybnMgUGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKi9cbiAgc3RhdGljIGRlZmF1bHQoKTogUGFnZU9wdHMge1xuICAgIHJldHVybiA8UGFnZU9wdHM+e1xuICAgICAgYWxsOiB0cnVlLFxuICAgIH07XG4gIH1cbn1cblxuZXhwb3J0IGludGVyZmFjZSBQYWdlUXVlcnlBcmdzIHtcbiAgLyoqXG4gICAqIE1heCBudW1iZXIgb2YgaXRlbXMgdG8gcmV0dXJuIHBlciBwYWdlLlxuICAgKlxuICAgKiBUaGUgYWN0dWFsIG51bWJlciBvZiByZXR1cm5lZCBpdGVtcyBtYXkgYmUgbGVzcyB0aGF0IHRoaXMsIGV2ZW4gaWYgdGhlcmUgZXhpc3QgbW9yZVxuICAgKiBkYXRhIGluIHRoZSByZXN1bHQgc2V0LiBUbyByZWxpYWJseSBkZXRlcm1pbmUgaWYgbW9yZSBkYXRhIGlzIGxlZnQgaW4gdGhlIHJlc3VsdCBzZXQsXG4gICAqIGluc3BlY3QgdGhlIFtVbmVuY3J5cHRlZExhc3RFdmFsS2V5XSB2YWx1ZSBpbiB0aGUgcmVzcG9uc2Ugb2JqZWN0LlxuICAgKi9cbiAgXCJwYWdlLnNpemVcIj86IG51bWJlcjtcblxuICAvKipcbiAgICogVGhlIHN0YXJ0IG9mIHRoZSBwYWdlLlxuICAgKlxuICAgKiBPbWl0IHRvIHN0YXJ0IGZyb20gdGhlIGJlZ2lubmluZzsgb3RoZXJ3aXNlLCBvbmx5IHNwZWNpZnkgdGhlIGV4YWN0XG4gICAqIHZhbHVlIHByZXZpb3VzbHkgcmV0dXJuZWQgYXMgJ2xhc3RfZXZhbHVhdGVkX2tleScgZnJvbSB0aGUgc2FtZSBlbmRwb2ludC5cbiAgICovXG4gIFwicGFnZS5zdGFydFwiPzogc3RyaW5nIHwgbnVsbDtcbn1cblxuZXhwb3J0IHR5cGUgTGlzdEZuPFU+ID0gKHBhZ2VRdWVyeUFyZ3M6IFBhZ2VRdWVyeUFyZ3MpID0+IFByb21pc2U8VT47XG5leHBvcnQgdHlwZSBJdGVtc0ZuPFUsIFQ+ID0gKHJlc3A6IFUpID0+IFRbXTtcbmV4cG9ydCB0eXBlIExhc3RGbjxVPiA9IChyZXNwOiBVKSA9PiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIEhlbHBlciBjbGFzcyBmb3IgZmV0Y2hpbmcgcGFnaW5hdGVkIHJlc3VsdHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBQYWdpbmF0b3I8VSwgVD4ge1xuICByZWFkb25seSAjbGlzdEZuOiBMaXN0Rm48VT47XG4gIHJlYWRvbmx5ICNpdGVtc0ZuOiBJdGVtc0ZuPFUsIFQ+O1xuICByZWFkb25seSAjbGFzdEZuOiBMYXN0Rm48VT47XG4gICNvcHRzOiBQYWdlT3B0cztcbiAgI2xhc3Q6IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG4gICNkb25lOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSBsaXN0Rm4gQ2FsbHMgYSByZW1vdGUgZW5kcG9pbnQgdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqIEBwYXJhbSBpdGVtc0ZuIEV4dHJhY3RzIGl0ZW1zIGZyb20gdGhlIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKiBAcGFyYW0gbGFzdEZuIEV4dHJhY3RzIHRoZSBsYXN0IGV2YWx1YXRlZCBrZXkgZnJvbSB0aGUgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqL1xuICBjb25zdHJ1Y3RvcihwYWdlT3B0czogUGFnZU9wdHMsIGxpc3RGbjogTGlzdEZuPFU+LCBpdGVtc0ZuOiBJdGVtc0ZuPFUsIFQ+LCBsYXN0Rm46IExhc3RGbjxVPikge1xuICAgIHRoaXMuI2xpc3RGbiA9IGxpc3RGbjtcbiAgICB0aGlzLiNpdGVtc0ZuID0gaXRlbXNGbjtcbiAgICB0aGlzLiNsYXN0Rm4gPSBsYXN0Rm47XG4gICAgdGhpcy4jb3B0cyA9IHBhZ2VPcHRzO1xuICAgIHRoaXMuI2xhc3QgPSBwYWdlT3B0cy5zdGFydDtcbiAgICB0aGlzLiNkb25lID0gZmFsc2U7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBlaXRoZXIgYSBzaW5nbGUgcGFnZSBvciB0aGUgZW50aXJlIHJlc3VsdCBzZXQsIGRlcGVuZGluZyBvblxuICAgKiB0aGUgYGFsbGAgcHJvcGVydHkgb2YgdGhlIHBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICpcbiAgICogQHJldHVybnMgQSBzaW5nbGUgcGFnZSBvciB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFRbXT4ge1xuICAgIHJldHVybiB0aGlzLiNvcHRzLmFsbCA/IGF3YWl0IHRoaXMuZmV0Y2hBbGwoKSA6IGF3YWl0IHRoaXMuZmV0Y2hQYWdlKCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhIHNpbmdsZSBwYWdlIG9mIHRoZSByZXN1bHQgc2V0IGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZi5cbiAgICogTXV0YXRlcyBzZWxmIHRvIHJlbWVtYmVyIHdoZXJlIGl0IGxlZnQgb2ZmLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbmV4dCBwYWdlIG9mIHRoZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2hQYWdlKCk6IFByb21pc2U8VFtdPiB7XG4gICAgaWYgKHRoaXMuI2RvbmUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jbGlzdEZuKHtcbiAgICAgIFwicGFnZS5zaXplXCI6IHRoaXMuI29wdHMuc2l6ZSxcbiAgICAgIFwicGFnZS5zdGFydFwiOiB0aGlzLiNsYXN0LFxuICAgIH0pO1xuICAgIHRoaXMuI2xhc3QgPSB0aGlzLiNsYXN0Rm4ocmVzcCk7XG4gICAgdGhpcy4jZG9uZSA9ICF0aGlzLiNsYXN0O1xuICAgIHJldHVybiB0aGlzLiNpdGVtc0ZuKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGVudGlyZSByZXN1bHQgc2V0IHN0YXJ0aW5nIGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZlxuICAgKiBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgcGFnZXMgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlbnRpcmUgcmVzdWx0IHNldC5cbiAgICovXG4gIGFzeW5jIGZldGNoQWxsKCk6IFByb21pc2U8VFtdPiB7XG4gICAgY29uc3QgcmVzdWx0ID0gW107XG4gICAgd2hpbGUgKCF0aGlzLiNkb25lKSB7XG4gICAgICBjb25zdCBpdGVtcyA9IGF3YWl0IHRoaXMuZmV0Y2hQYWdlKCk7XG4gICAgICByZXN1bHQucHVzaCguLi5pdGVtcyk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cbn1cbiJdfQ==