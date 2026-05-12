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
     * @return {PageOpts} Pagination options.
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
     * @param {PageOpts} pageOpts Pagination options
     * @param {ListFn<U>} listFn Calls a remote endpoint that returns a paginated response
     * @param {ItemsFn<U, T>} itemsFn Extracts items from the paginated response
     * @param {LastFn<U>} lastFn Extracts the last evaluated key from the paginated response
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
     * @return {Promise<T[]>} A single page or the entire result set.
     */
    async fetch() {
        return __classPrivateFieldGet(this, _Paginator_opts, "f").all ? await this.fetchAll() : await this.fetchPage();
    }
    /**
     * Fetches a single page of the result set from where it previously left off.
     * Mutates self to remember where it left off.
     *
     * @return {Promise<T[]>} The next page of the result set.
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
     * @return {Promise<T[]>} The entire result set.
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5hdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3BhZ2luYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFhQSxzQ0FBc0M7QUFDdEMsTUFBYSxJQUFJO0lBQ2Y7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsT0FBTztRQUNaLE9BQWlCO1lBQ2YsR0FBRyxFQUFFLElBQUk7U0FDVixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBWkQsb0JBWUM7QUF5QkQ7O0dBRUc7QUFDSCxNQUFhLFNBQVM7SUFRcEI7Ozs7O09BS0c7SUFDSCxZQUFZLFFBQWtCLEVBQUUsTUFBaUIsRUFBRSxPQUFzQixFQUFFLE1BQWlCO1FBYm5GLG9DQUFtQjtRQUNuQixxQ0FBd0I7UUFDeEIsb0NBQW1CO1FBQzVCLGtDQUFnQjtRQUNoQixrQ0FBaUM7UUFDakMsa0NBQWU7UUFTYix1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksc0JBQVksT0FBTyxNQUFBLENBQUM7UUFDeEIsdUJBQUEsSUFBSSxxQkFBVyxNQUFNLE1BQUEsQ0FBQztRQUN0Qix1QkFBQSxJQUFJLG1CQUFTLFFBQVEsTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksbUJBQVMsUUFBUSxDQUFDLEtBQUssTUFBQSxDQUFDO1FBQzVCLHVCQUFBLElBQUksbUJBQVMsS0FBSyxNQUFBLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxPQUFPLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztJQUN6RSxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLElBQUksdUJBQUEsSUFBSSx1QkFBTSxFQUFFLENBQUM7WUFDZixPQUFPLEVBQUUsQ0FBQztRQUNaLENBQUM7UUFFRCxNQUFNLElBQUksR0FBRyxNQUFNLHVCQUFBLElBQUkseUJBQVEsTUFBWixJQUFJLEVBQVM7WUFDOUIsV0FBVyxFQUFFLHVCQUFBLElBQUksdUJBQU0sQ0FBQyxJQUFJO1lBQzVCLFlBQVksRUFBRSx1QkFBQSxJQUFJLHVCQUFNO1NBQ3pCLENBQUMsQ0FBQztRQUNILHVCQUFBLElBQUksbUJBQVMsdUJBQUEsSUFBSSx5QkFBUSxNQUFaLElBQUksRUFBUyxJQUFJLENBQUMsTUFBQSxDQUFDO1FBQ2hDLHVCQUFBLElBQUksbUJBQVMsQ0FBQyx1QkFBQSxJQUFJLHVCQUFNLE1BQUEsQ0FBQztRQUN6QixPQUFPLHVCQUFBLElBQUksMEJBQVMsTUFBYixJQUFJLEVBQVUsSUFBSSxDQUFDLENBQUM7SUFDN0IsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDbEIsT0FBTyxDQUFDLHVCQUFBLElBQUksdUJBQU0sRUFBRSxDQUFDO1lBQ25CLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUMsQ0FBQztRQUN4QixDQUFDO1FBQ0QsT0FBTyxNQUFNLENBQUM7SUFDaEIsQ0FBQztDQUNGO0FBbkVELDhCQW1FQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBQYWdpbmF0aW9uIG9wdGlvbnMuICovXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VPcHRzIHtcbiAgLyoqIE1heCBudW1iZXIgb2YgaXRlbXMgcGVyIHBhZ2UuICovXG4gIHNpemU/OiBudW1iZXI7XG4gIC8qKlxuICAgKiBTdGFydGluZyBwb2ludCAoaS5lLiwgJ2xhc3RfZXZhbHVhdGVkX2tleScgZnJvbSB0aGUgcHJldmlvdXMgcGFnZSkuXG4gICAqIE9taXQgdG8gc3RhcnQgZnJvbSB0aGUgYmVnaW5uaW5nLlxuICAgKi9cbiAgc3RhcnQ/OiBzdHJpbmc7XG4gIC8qKiBJdGVyYXRlIHVudGlsIHJldHJpZXZpbmcgdGhlIGVudGlyZSByZXN1bHQgc2V0LiAqL1xuICBhbGw6IGJvb2xlYW47XG59XG5cbi8qKiBTdGF0aWMgY29uc3RydWN0b3JzIGZvciBgSVBhZ2VgICovXG5leHBvcnQgY2xhc3MgUGFnZSB7XG4gIC8qKlxuICAgKiBUaGUgZGVmYXVsdCBpcyB0byBmZXRjaCB0aGUgZW50aXJlIHJlc3VsdCBzZXRcbiAgICogKGJ5IHJlcGVhdGVkbHkgY2FsbGluZyB0aGUgcmVtb3RlIGVuZHBvaW50IHVudGlsIGFsbCBwYWdlcyBhcmUgcmV0cmlldmVkKS5cbiAgICpcbiAgICogQHJldHVybiB7UGFnZU9wdHN9IFBhZ2luYXRpb24gb3B0aW9ucy5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0KCk6IFBhZ2VPcHRzIHtcbiAgICByZXR1cm4gPFBhZ2VPcHRzPntcbiAgICAgIGFsbDogdHJ1ZSxcbiAgICB9O1xuICB9XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFnZVF1ZXJ5QXJncyB7XG4gIC8qKlxuICAgKiBNYXggbnVtYmVyIG9mIGl0ZW1zIHRvIHJldHVybiBwZXIgcGFnZS5cbiAgICpcbiAgICogVGhlIGFjdHVhbCBudW1iZXIgb2YgcmV0dXJuZWQgaXRlbXMgbWF5IGJlIGxlc3MgdGhhdCB0aGlzLCBldmVuIGlmIHRoZXJlIGV4aXN0IG1vcmVcbiAgICogZGF0YSBpbiB0aGUgcmVzdWx0IHNldC4gVG8gcmVsaWFibHkgZGV0ZXJtaW5lIGlmIG1vcmUgZGF0YSBpcyBsZWZ0IGluIHRoZSByZXN1bHQgc2V0LFxuICAgKiBpbnNwZWN0IHRoZSBbVW5lbmNyeXB0ZWRMYXN0RXZhbEtleV0gdmFsdWUgaW4gdGhlIHJlc3BvbnNlIG9iamVjdC5cbiAgICovXG4gIFwicGFnZS5zaXplXCI/OiBudW1iZXI7XG5cbiAgLyoqXG4gICAqIFRoZSBzdGFydCBvZiB0aGUgcGFnZS5cbiAgICpcbiAgICogT21pdCB0byBzdGFydCBmcm9tIHRoZSBiZWdpbm5pbmc7IG90aGVyd2lzZSwgb25seSBzcGVjaWZ5IHRoZSBleGFjdFxuICAgKiB2YWx1ZSBwcmV2aW91c2x5IHJldHVybmVkIGFzICdsYXN0X2V2YWx1YXRlZF9rZXknIGZyb20gdGhlIHNhbWUgZW5kcG9pbnQuXG4gICAqL1xuICBcInBhZ2Uuc3RhcnRcIj86IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCB0eXBlIExpc3RGbjxVPiA9IChwYWdlUXVlcnlBcmdzOiBQYWdlUXVlcnlBcmdzKSA9PiBQcm9taXNlPFU+O1xuZXhwb3J0IHR5cGUgSXRlbXNGbjxVLCBUPiA9IChyZXNwOiBVKSA9PiBUW107XG5leHBvcnQgdHlwZSBMYXN0Rm48VT4gPSAocmVzcDogVSkgPT4gc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBIZWxwZXIgY2xhc3MgZm9yIGZldGNoaW5nIHBhZ2luYXRlZCByZXN1bHRzLlxuICovXG5leHBvcnQgY2xhc3MgUGFnaW5hdG9yPFUsIFQ+IHtcbiAgcmVhZG9ubHkgI2xpc3RGbjogTGlzdEZuPFU+O1xuICByZWFkb25seSAjaXRlbXNGbjogSXRlbXNGbjxVLCBUPjtcbiAgcmVhZG9ubHkgI2xhc3RGbjogTGFzdEZuPFU+O1xuICAjb3B0czogUGFnZU9wdHM7XG4gICNsYXN0OiBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkO1xuICAjZG9uZTogYm9vbGVhbjtcblxuICAvKipcbiAgICogQHBhcmFtIHtQYWdlT3B0c30gcGFnZU9wdHMgUGFnaW5hdGlvbiBvcHRpb25zXG4gICAqIEBwYXJhbSB7TGlzdEZuPFU+fSBsaXN0Rm4gQ2FsbHMgYSByZW1vdGUgZW5kcG9pbnQgdGhhdCByZXR1cm5zIGEgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7SXRlbXNGbjxVLCBUPn0gaXRlbXNGbiBFeHRyYWN0cyBpdGVtcyBmcm9tIHRoZSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICogQHBhcmFtIHtMYXN0Rm48VT59IGxhc3RGbiBFeHRyYWN0cyB0aGUgbGFzdCBldmFsdWF0ZWQga2V5IGZyb20gdGhlIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKi9cbiAgY29uc3RydWN0b3IocGFnZU9wdHM6IFBhZ2VPcHRzLCBsaXN0Rm46IExpc3RGbjxVPiwgaXRlbXNGbjogSXRlbXNGbjxVLCBUPiwgbGFzdEZuOiBMYXN0Rm48VT4pIHtcbiAgICB0aGlzLiNsaXN0Rm4gPSBsaXN0Rm47XG4gICAgdGhpcy4jaXRlbXNGbiA9IGl0ZW1zRm47XG4gICAgdGhpcy4jbGFzdEZuID0gbGFzdEZuO1xuICAgIHRoaXMuI29wdHMgPSBwYWdlT3B0cztcbiAgICB0aGlzLiNsYXN0ID0gcGFnZU9wdHMuc3RhcnQ7XG4gICAgdGhpcy4jZG9uZSA9IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgZWl0aGVyIGEgc2luZ2xlIHBhZ2Ugb3IgdGhlIGVudGlyZSByZXN1bHQgc2V0LCBkZXBlbmRpbmcgb25cbiAgICogdGhlIGBhbGxgIHByb3BlcnR5IG9mIHRoZSBwYWdpbmF0aW9uIG9wdGlvbnMuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VFtdPn0gQSBzaW5nbGUgcGFnZSBvciB0aGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqL1xuICBhc3luYyBmZXRjaCgpOiBQcm9taXNlPFRbXT4ge1xuICAgIHJldHVybiB0aGlzLiNvcHRzLmFsbCA/IGF3YWl0IHRoaXMuZmV0Y2hBbGwoKSA6IGF3YWl0IHRoaXMuZmV0Y2hQYWdlKCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhIHNpbmdsZSBwYWdlIG9mIHRoZSByZXN1bHQgc2V0IGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZi5cbiAgICogTXV0YXRlcyBzZWxmIHRvIHJlbWVtYmVyIHdoZXJlIGl0IGxlZnQgb2ZmLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFRbXT59IFRoZSBuZXh0IHBhZ2Ugb2YgdGhlIHJlc3VsdCBzZXQuXG4gICAqL1xuICBhc3luYyBmZXRjaFBhZ2UoKTogUHJvbWlzZTxUW10+IHtcbiAgICBpZiAodGhpcy4jZG9uZSkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNsaXN0Rm4oe1xuICAgICAgXCJwYWdlLnNpemVcIjogdGhpcy4jb3B0cy5zaXplLFxuICAgICAgXCJwYWdlLnN0YXJ0XCI6IHRoaXMuI2xhc3QsXG4gICAgfSk7XG4gICAgdGhpcy4jbGFzdCA9IHRoaXMuI2xhc3RGbihyZXNwKTtcbiAgICB0aGlzLiNkb25lID0gIXRoaXMuI2xhc3Q7XG4gICAgcmV0dXJuIHRoaXMuI2l0ZW1zRm4ocmVzcCk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgZW50aXJlIHJlc3VsdCBzZXQgc3RhcnRpbmcgZnJvbSB3aGVyZSBpdCBwcmV2aW91c2x5IGxlZnQgb2ZmXG4gICAqIGJ5IGl0ZXJhdGluZyB0aHJvdWdoIHRoZSBwYWdlcyByZXR1cm5lZCBieSB0aGUgcmVtb3RlIGVuZC5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxUW10+fSBUaGUgZW50aXJlIHJlc3VsdCBzZXQuXG4gICAqL1xuICBhc3luYyBmZXRjaEFsbCgpOiBQcm9taXNlPFRbXT4ge1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIHdoaWxlICghdGhpcy4jZG9uZSkge1xuICAgICAgY29uc3QgaXRlbXMgPSBhd2FpdCB0aGlzLmZldGNoUGFnZSgpO1xuICAgICAgcmVzdWx0LnB1c2goLi4uaXRlbXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG59XG4iXX0=