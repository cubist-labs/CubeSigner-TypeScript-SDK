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
/** Static constructors for `IPage` */
export class Page {
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
/**
 * Helper class for fetching paginated results.
 */
export class Paginator {
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
_Paginator_listFn = new WeakMap(), _Paginator_itemsFn = new WeakMap(), _Paginator_lastFn = new WeakMap(), _Paginator_opts = new WeakMap(), _Paginator_last = new WeakMap(), _Paginator_done = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnaW5hdG9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL3BhZ2luYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFhQSxzQ0FBc0M7QUFDdEMsTUFBTSxPQUFPLElBQUk7SUFDZjs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxPQUFPO1FBQ1osT0FBaUI7WUFDZixHQUFHLEVBQUUsSUFBSTtTQUNWLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF5QkQ7O0dBRUc7QUFDSCxNQUFNLE9BQU8sU0FBUztJQVFwQjs7Ozs7T0FLRztJQUNILFlBQVksUUFBa0IsRUFBRSxNQUFpQixFQUFFLE9BQXNCLEVBQUUsTUFBaUI7UUFibkYsb0NBQW1CO1FBQ25CLHFDQUF3QjtRQUN4QixvQ0FBbUI7UUFDNUIsa0NBQWdCO1FBQ2hCLGtDQUFpQztRQUNqQyxrQ0FBZTtRQVNiLHVCQUFBLElBQUkscUJBQVcsTUFBTSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxzQkFBWSxPQUFPLE1BQUEsQ0FBQztRQUN4Qix1QkFBQSxJQUFJLHFCQUFXLE1BQU0sTUFBQSxDQUFDO1FBQ3RCLHVCQUFBLElBQUksbUJBQVMsUUFBUSxNQUFBLENBQUM7UUFDdEIsdUJBQUEsSUFBSSxtQkFBUyxRQUFRLENBQUMsS0FBSyxNQUFBLENBQUM7UUFDNUIsdUJBQUEsSUFBSSxtQkFBUyxLQUFLLE1BQUEsQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sdUJBQUEsSUFBSSx1QkFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO0lBQ3pFLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxTQUFTO1FBQ2IsSUFBSSx1QkFBQSxJQUFJLHVCQUFNLEVBQUUsQ0FBQztZQUNmLE9BQU8sRUFBRSxDQUFDO1FBQ1osQ0FBQztRQUVELE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSx5QkFBUSxNQUFaLElBQUksRUFBUztZQUM5QixXQUFXLEVBQUUsdUJBQUEsSUFBSSx1QkFBTSxDQUFDLElBQUk7WUFDNUIsWUFBWSxFQUFFLHVCQUFBLElBQUksdUJBQU07U0FDekIsQ0FBQyxDQUFDO1FBQ0gsdUJBQUEsSUFBSSxtQkFBUyx1QkFBQSxJQUFJLHlCQUFRLE1BQVosSUFBSSxFQUFTLElBQUksQ0FBQyxNQUFBLENBQUM7UUFDaEMsdUJBQUEsSUFBSSxtQkFBUyxDQUFDLHVCQUFBLElBQUksdUJBQU0sTUFBQSxDQUFDO1FBQ3pCLE9BQU8sdUJBQUEsSUFBSSwwQkFBUyxNQUFiLElBQUksRUFBVSxJQUFJLENBQUMsQ0FBQztJQUM3QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE1BQU0sTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNsQixPQUFPLENBQUMsdUJBQUEsSUFBSSx1QkFBTSxFQUFFLENBQUM7WUFDbkIsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO1FBQ3hCLENBQUM7UUFDRCxPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogUGFnaW5hdGlvbiBvcHRpb25zLiAqL1xuZXhwb3J0IGludGVyZmFjZSBQYWdlT3B0cyB7XG4gIC8qKiBNYXggbnVtYmVyIG9mIGl0ZW1zIHBlciBwYWdlLiAqL1xuICBzaXplPzogbnVtYmVyO1xuICAvKipcbiAgICogU3RhcnRpbmcgcG9pbnQgKGkuZS4sICdsYXN0X2V2YWx1YXRlZF9rZXknIGZyb20gdGhlIHByZXZpb3VzIHBhZ2UpLlxuICAgKiBPbWl0IHRvIHN0YXJ0IGZyb20gdGhlIGJlZ2lubmluZy5cbiAgICovXG4gIHN0YXJ0Pzogc3RyaW5nO1xuICAvKiogSXRlcmF0ZSB1bnRpbCByZXRyaWV2aW5nIHRoZSBlbnRpcmUgcmVzdWx0IHNldC4gKi9cbiAgYWxsOiBib29sZWFuO1xufVxuXG4vKiogU3RhdGljIGNvbnN0cnVjdG9ycyBmb3IgYElQYWdlYCAqL1xuZXhwb3J0IGNsYXNzIFBhZ2Uge1xuICAvKipcbiAgICogVGhlIGRlZmF1bHQgaXMgdG8gZmV0Y2ggdGhlIGVudGlyZSByZXN1bHQgc2V0XG4gICAqIChieSByZXBlYXRlZGx5IGNhbGxpbmcgdGhlIHJlbW90ZSBlbmRwb2ludCB1bnRpbCBhbGwgcGFnZXMgYXJlIHJldHJpZXZlZCkuXG4gICAqXG4gICAqIEByZXR1cm4ge1BhZ2VPcHRzfSBQYWdpbmF0aW9uIG9wdGlvbnMuXG4gICAqL1xuICBzdGF0aWMgZGVmYXVsdCgpOiBQYWdlT3B0cyB7XG4gICAgcmV0dXJuIDxQYWdlT3B0cz57XG4gICAgICBhbGw6IHRydWUsXG4gICAgfTtcbiAgfVxufVxuXG5leHBvcnQgaW50ZXJmYWNlIFBhZ2VRdWVyeUFyZ3Mge1xuICAvKipcbiAgICogTWF4IG51bWJlciBvZiBpdGVtcyB0byByZXR1cm4gcGVyIHBhZ2UuXG4gICAqXG4gICAqIFRoZSBhY3R1YWwgbnVtYmVyIG9mIHJldHVybmVkIGl0ZW1zIG1heSBiZSBsZXNzIHRoYXQgdGhpcywgZXZlbiBpZiB0aGVyZSBleGlzdCBtb3JlXG4gICAqIGRhdGEgaW4gdGhlIHJlc3VsdCBzZXQuIFRvIHJlbGlhYmx5IGRldGVybWluZSBpZiBtb3JlIGRhdGEgaXMgbGVmdCBpbiB0aGUgcmVzdWx0IHNldCxcbiAgICogaW5zcGVjdCB0aGUgW1VuZW5jcnlwdGVkTGFzdEV2YWxLZXldIHZhbHVlIGluIHRoZSByZXNwb25zZSBvYmplY3QuXG4gICAqL1xuICBcInBhZ2Uuc2l6ZVwiPzogbnVtYmVyO1xuXG4gIC8qKlxuICAgKiBUaGUgc3RhcnQgb2YgdGhlIHBhZ2UuXG4gICAqXG4gICAqIE9taXQgdG8gc3RhcnQgZnJvbSB0aGUgYmVnaW5uaW5nOyBvdGhlcndpc2UsIG9ubHkgc3BlY2lmeSB0aGUgZXhhY3RcbiAgICogdmFsdWUgcHJldmlvdXNseSByZXR1cm5lZCBhcyAnbGFzdF9ldmFsdWF0ZWRfa2V5JyBmcm9tIHRoZSBzYW1lIGVuZHBvaW50LlxuICAgKi9cbiAgXCJwYWdlLnN0YXJ0XCI/OiBzdHJpbmcgfCBudWxsO1xufVxuXG5leHBvcnQgdHlwZSBMaXN0Rm48VT4gPSAocGFnZVF1ZXJ5QXJnczogUGFnZVF1ZXJ5QXJncykgPT4gUHJvbWlzZTxVPjtcbmV4cG9ydCB0eXBlIEl0ZW1zRm48VSwgVD4gPSAocmVzcDogVSkgPT4gVFtdO1xuZXhwb3J0IHR5cGUgTGFzdEZuPFU+ID0gKHJlc3A6IFUpID0+IHN0cmluZyB8IG51bGwgfCB1bmRlZmluZWQ7XG5cbi8qKlxuICogSGVscGVyIGNsYXNzIGZvciBmZXRjaGluZyBwYWdpbmF0ZWQgcmVzdWx0cy5cbiAqL1xuZXhwb3J0IGNsYXNzIFBhZ2luYXRvcjxVLCBUPiB7XG4gIHJlYWRvbmx5ICNsaXN0Rm46IExpc3RGbjxVPjtcbiAgcmVhZG9ubHkgI2l0ZW1zRm46IEl0ZW1zRm48VSwgVD47XG4gIHJlYWRvbmx5ICNsYXN0Rm46IExhc3RGbjxVPjtcbiAgI29wdHM6IFBhZ2VPcHRzO1xuICAjbGFzdDogc3RyaW5nIHwgbnVsbCB8IHVuZGVmaW5lZDtcbiAgI2RvbmU6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7UGFnZU9wdHN9IHBhZ2VPcHRzIFBhZ2luYXRpb24gb3B0aW9uc1xuICAgKiBAcGFyYW0ge0xpc3RGbjxVPn0gbGlzdEZuIENhbGxzIGEgcmVtb3RlIGVuZHBvaW50IHRoYXQgcmV0dXJucyBhIHBhZ2luYXRlZCByZXNwb25zZVxuICAgKiBAcGFyYW0ge0l0ZW1zRm48VSwgVD59IGl0ZW1zRm4gRXh0cmFjdHMgaXRlbXMgZnJvbSB0aGUgcGFnaW5hdGVkIHJlc3BvbnNlXG4gICAqIEBwYXJhbSB7TGFzdEZuPFU+fSBsYXN0Rm4gRXh0cmFjdHMgdGhlIGxhc3QgZXZhbHVhdGVkIGtleSBmcm9tIHRoZSBwYWdpbmF0ZWQgcmVzcG9uc2VcbiAgICovXG4gIGNvbnN0cnVjdG9yKHBhZ2VPcHRzOiBQYWdlT3B0cywgbGlzdEZuOiBMaXN0Rm48VT4sIGl0ZW1zRm46IEl0ZW1zRm48VSwgVD4sIGxhc3RGbjogTGFzdEZuPFU+KSB7XG4gICAgdGhpcy4jbGlzdEZuID0gbGlzdEZuO1xuICAgIHRoaXMuI2l0ZW1zRm4gPSBpdGVtc0ZuO1xuICAgIHRoaXMuI2xhc3RGbiA9IGxhc3RGbjtcbiAgICB0aGlzLiNvcHRzID0gcGFnZU9wdHM7XG4gICAgdGhpcy4jbGFzdCA9IHBhZ2VPcHRzLnN0YXJ0O1xuICAgIHRoaXMuI2RvbmUgPSBmYWxzZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGVpdGhlciBhIHNpbmdsZSBwYWdlIG9yIHRoZSBlbnRpcmUgcmVzdWx0IHNldCwgZGVwZW5kaW5nIG9uXG4gICAqIHRoZSBgYWxsYCBwcm9wZXJ0eSBvZiB0aGUgcGFnaW5hdGlvbiBvcHRpb25zLlxuICAgKlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPFRbXT59IEEgc2luZ2xlIHBhZ2Ugb3IgdGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxUW10+IHtcbiAgICByZXR1cm4gdGhpcy4jb3B0cy5hbGwgPyBhd2FpdCB0aGlzLmZldGNoQWxsKCkgOiBhd2FpdCB0aGlzLmZldGNoUGFnZSgpO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYSBzaW5nbGUgcGFnZSBvZiB0aGUgcmVzdWx0IHNldCBmcm9tIHdoZXJlIGl0IHByZXZpb3VzbHkgbGVmdCBvZmYuXG4gICAqIE11dGF0ZXMgc2VsZiB0byByZW1lbWJlciB3aGVyZSBpdCBsZWZ0IG9mZi5cbiAgICpcbiAgICogQHJldHVybiB7UHJvbWlzZTxUW10+fSBUaGUgbmV4dCBwYWdlIG9mIHRoZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2hQYWdlKCk6IFByb21pc2U8VFtdPiB7XG4gICAgaWYgKHRoaXMuI2RvbmUpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jbGlzdEZuKHtcbiAgICAgIFwicGFnZS5zaXplXCI6IHRoaXMuI29wdHMuc2l6ZSxcbiAgICAgIFwicGFnZS5zdGFydFwiOiB0aGlzLiNsYXN0LFxuICAgIH0pO1xuICAgIHRoaXMuI2xhc3QgPSB0aGlzLiNsYXN0Rm4ocmVzcCk7XG4gICAgdGhpcy4jZG9uZSA9ICF0aGlzLiNsYXN0O1xuICAgIHJldHVybiB0aGlzLiNpdGVtc0ZuKHJlc3ApO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgdGhlIGVudGlyZSByZXN1bHQgc2V0IHN0YXJ0aW5nIGZyb20gd2hlcmUgaXQgcHJldmlvdXNseSBsZWZ0IG9mZlxuICAgKiBieSBpdGVyYXRpbmcgdGhyb3VnaCB0aGUgcGFnZXMgcmV0dXJuZWQgYnkgdGhlIHJlbW90ZSBlbmQuXG4gICAqXG4gICAqIEByZXR1cm4ge1Byb21pc2U8VFtdPn0gVGhlIGVudGlyZSByZXN1bHQgc2V0LlxuICAgKi9cbiAgYXN5bmMgZmV0Y2hBbGwoKTogUHJvbWlzZTxUW10+IHtcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICB3aGlsZSAoIXRoaXMuI2RvbmUpIHtcbiAgICAgIGNvbnN0IGl0ZW1zID0gYXdhaXQgdGhpcy5mZXRjaFBhZ2UoKTtcbiAgICAgIHJlc3VsdC5wdXNoKC4uLml0ZW1zKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIl19