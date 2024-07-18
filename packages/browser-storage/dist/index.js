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
var _BrowserStorageManager_instances, _BrowserStorageManager_key, _BrowserStorageManager_storage, _BrowserStorageManager_lock, _BrowserStorageManager_emitIfNecessary, _BrowserStorageManager_loadSession;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserStorageManager = void 0;
const cubesigner_sdk_1 = require("@cubist-labs/cubesigner-sdk");
const locks_1 = require("./locks");
/**
 * A manager that persists into browser storage and uses weblocks to safely perform refreshes
 */
class BrowserStorageManager extends cubesigner_sdk_1.EventEmitter {
    /**
     *
     * @param {string} key The storage key to use
     * @param {Storage} [storage] The storage object to use (defaults to localStorage)
     */
    constructor(key, storage = globalThis.localStorage) {
        super();
        _BrowserStorageManager_instances.add(this);
        /** The storage key for the session data */
        _BrowserStorageManager_key.set(this, void 0);
        _BrowserStorageManager_storage.set(this, void 0);
        _BrowserStorageManager_lock.set(this, void 0);
        __classPrivateFieldSet(this, _BrowserStorageManager_key, key, "f");
        __classPrivateFieldSet(this, _BrowserStorageManager_storage, storage, "f");
        (__classPrivateFieldSet(this, _BrowserStorageManager_lock, `CS_SDK_STORAGE_LOCK_${key}`, "f")),
            // Set up listeners to emit events when users log in or log out
            window.addEventListener("storage", (ev) => {
                // We only care about events on our storage object, using our key
                if (ev.storageArea !== storage || ev.key !== key)
                    return;
                __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_emitIfNecessary).call(this, ev.oldValue, ev.newValue);
            });
    }
    /**
     * Loads the metadata for a session from storage
     * @return {SessionMetadata} The session metadata
     */
    async metadata() {
        const sess = __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_loadSession).call(this);
        if (!sess) {
            throw new cubesigner_sdk_1.NoSessionFoundError();
        }
        return (0, cubesigner_sdk_1.metadata)(sess);
    }
    /**
     * Loads the current access token from storage
     * @return {string} The access token
     */
    async token() {
        const sess = await (0, locks_1.readTestAndSet)(__classPrivateFieldGet(this, _BrowserStorageManager_lock, "f"), {
            read: () => __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_loadSession).call(this),
            test: (v) => v !== undefined && (0, cubesigner_sdk_1.isStale)(v),
            set: async (oldSession) => {
                if ((0, cubesigner_sdk_1.isRefreshable)(oldSession)) {
                    try {
                        const newSession = await (0, cubesigner_sdk_1.refresh)(oldSession);
                        __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").setItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"), JSON.stringify(newSession));
                        console.log("Successfully refreshed");
                    }
                    catch (e) {
                        if (e instanceof cubesigner_sdk_1.ErrResponse && e.status === 403) {
                            __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").removeItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
                        }
                    }
                }
                else {
                    // If the session is not refreshable, we should remove it
                    __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").removeItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
                }
                // Notify that the session has changed
                __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_emitIfNecessary).call(this, "", __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").getItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f")));
            },
        });
        if (!sess) {
            throw new cubesigner_sdk_1.NoSessionFoundError();
        }
        return sess.token;
    }
    /**
     * Directly set the session (updating all consumers of the session storage)
     * @param {SessionData} [session] The new session
     */
    async setSession(session) {
        return await navigator.locks.request(__classPrivateFieldGet(this, _BrowserStorageManager_lock, "f"), {
            mode: "exclusive",
        }, async () => {
            const oldValue = __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").getItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
            const newValue = session ? JSON.stringify(session) : null;
            // Unlike during refresh, we don't pre-empt the read locks
            // because this operation is synchronous
            if (newValue) {
                __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").setItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"), newValue);
            }
            else {
                __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").removeItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
            }
            // Storage events don't fire if the store occurred on the same page,
            // so we have to manually invoke our emit logic
            __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_emitIfNecessary).call(this, oldValue, newValue);
        });
    }
}
exports.BrowserStorageManager = BrowserStorageManager;
_BrowserStorageManager_key = new WeakMap(), _BrowserStorageManager_storage = new WeakMap(), _BrowserStorageManager_lock = new WeakMap(), _BrowserStorageManager_instances = new WeakSet(), _BrowserStorageManager_emitIfNecessary = function _BrowserStorageManager_emitIfNecessary(oldValue, newValue) {
    if (newValue === null && oldValue !== null) {
        this.emit("logout");
    }
    // There is now a session when there didn't used to be.
    else if (oldValue === null && newValue !== null) {
        this.emit("login");
    }
}, _BrowserStorageManager_loadSession = function _BrowserStorageManager_loadSession() {
    const stored = __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").getItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
    if (stored === null) {
        return;
    }
    return JSON.parse(stored);
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0VBUXFDO0FBQ3JDLG1DQUF5QztBQU96Qzs7R0FFRztBQUNILE1BQWEscUJBQ1gsU0FBUSw2QkFBa0M7SUFRMUM7Ozs7T0FJRztJQUNILFlBQVksR0FBVyxFQUFFLFVBQW1CLFVBQVUsQ0FBQyxZQUFZO1FBQ2pFLEtBQUssRUFBRSxDQUFDOztRQVhWLDJDQUEyQztRQUMzQyw2Q0FBYTtRQUNiLGlEQUFrQjtRQUNsQiw4Q0FBYztRQVNaLHVCQUFBLElBQUksOEJBQVEsR0FBRyxNQUFBLENBQUM7UUFDaEIsdUJBQUEsSUFBSSxrQ0FBWSxPQUFPLE1BQUEsQ0FBQztRQUN4QixDQUFDLHVCQUFBLElBQUksK0JBQVMsdUJBQXVCLEdBQUcsRUFBRSxNQUFBLENBQUM7WUFDekMsK0RBQStEO1lBQy9ELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtnQkFDeEMsaUVBQWlFO2dCQUNqRSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEtBQUssT0FBTyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEtBQUssR0FBRztvQkFBRSxPQUFPO2dCQUN6RCx1QkFBQSxJQUFJLGdGQUFpQixNQUFyQixJQUFJLEVBQWtCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQStCRDs7O09BR0c7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE1BQU0sSUFBSSxHQUFHLHVCQUFBLElBQUksNEVBQWEsTUFBakIsSUFBSSxDQUFlLENBQUM7UUFDakMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ1YsTUFBTSxJQUFJLG9DQUFtQixFQUFFLENBQUM7UUFDbEMsQ0FBQztRQUNELE9BQU8sSUFBQSx5QkFB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QUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWxJRCxzREFrSUM7b1JBbEdrQixRQUF1QixFQUFFLFFBQXVCO0lBQy9ELElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDM0MsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUN0QixDQUFDO0lBRUQsdURBQXVEO1NBQ2xELElBQUksUUFBUSxLQUFLLElBQUksSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUNyQixDQUFDO0FBQ0gsQ0FBQztJQU9DLE1BQU0sTUFBTSxHQUFHLHVCQUFBLElBQUksc0NBQVMsQ0FBQyxPQUFPLENBQUMsdUJBQUEsSUFBSSxrQ0FBSyxDQUFDLENBQUM7SUFDaEQsSUFBSSxNQUFNLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDcEIsT0FBTztJQUNULENBQUM7SUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDNUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgU2Vzc2lvbkRhdGEsIFNlc3Npb25NYW5hZ2VyLCBTZXNzaW9uTWV0YWRhdGEgfSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQge1xuICBFdmVudEVtaXR0ZXIsXG4gIE5vU2Vzc2lvbkZvdW5kRXJyb3IsXG4gIGlzU3RhbGUsXG4gIGlzUmVmcmVzaGFibGUsXG4gIG1ldGFkYXRhLFxuICByZWZyZXNoLFxuICBFcnJSZXNwb25zZSxcbn0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgcmVhZFRlc3RBbmRTZXQgfSBmcm9tIFwiLi9sb2Nrc1wiO1xuXG50eXBlIEJyb3dzZXJTdG9yYWdlRXZlbnRzID0ge1xuICBsb2dvdXQoKTogdm9pZDtcbiAgbG9naW4oKTogdm9pZDtcbn07XG5cbi8qKlxuICogQSBtYW5hZ2VyIHRoYXQgcGVyc2lzdHMgaW50byBicm93c2VyIHN0b3JhZ2UgYW5kIHVzZXMgd2VibG9ja3MgdG8gc2FmZWx5IHBlcmZvcm0gcmVmcmVzaGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBCcm93c2VyU3RvcmFnZU1hbmFnZXJcbiAgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8QnJvd3NlclN0b3JhZ2VFdmVudHM+XG4gIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXJcbntcbiAgLyoqIFRoZSBzdG9yYWdlIGtleSBmb3IgdGhlIHNlc3Npb24gZGF0YSAqL1xuICAja2V5OiBzdHJpbmc7XG4gICNzdG9yYWdlOiBTdG9yYWdlO1xuICAjbG9jazogc3RyaW5nO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IFRoZSBzdG9yYWdlIGtleSB0byB1c2VcbiAgICogQHBhcmFtIHtTdG9yYWdlfSBbc3RvcmFnZV0gVGhlIHN0b3JhZ2Ugb2JqZWN0IHRvIHVzZSAoZGVmYXVsdHMgdG8gbG9jYWxTdG9yYWdlKVxuICAgKi9cbiAgY29uc3RydWN0b3Ioa2V5OiBzdHJpbmcsIHN0b3JhZ2U6IFN0b3JhZ2UgPSBnbG9iYWxUaGlzLmxvY2FsU3RvcmFnZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIHRoaXMuI3N0b3JhZ2UgPSBzdG9yYWdlO1xuICAgICh0aGlzLiNsb2NrID0gYENTX1NES19TVE9SQUdFX0xPQ0tfJHtrZXl9YCksXG4gICAgICAvLyBTZXQgdXAgbGlzdGVuZXJzIHRvIGVtaXQgZXZlbnRzIHdoZW4gdXNlcnMgbG9nIGluIG9yIGxvZyBvdXRcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic3RvcmFnZVwiLCAoZXYpID0+IHtcbiAgICAgICAgLy8gV2Ugb25seSBjYXJlIGFib3V0IGV2ZW50cyBvbiBvdXIgc3RvcmFnZSBvYmplY3QsIHVzaW5nIG91ciBrZXlcbiAgICAgICAgaWYgKGV2LnN0b3JhZ2VBcmVhICE9PSBzdG9yYWdlIHx8IGV2LmtleSAhPT0ga2V5KSByZXR1cm47XG4gICAgICAgIHRoaXMuI2VtaXRJZk5lY2Vzc2FyeShldi5vbGRWYWx1ZSwgZXYubmV3VmFsdWUpO1xuICAgICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYSBgbG9naW5gIG9yIGBsb2dvdXRgIGV2ZW50IGlmIG5lY2Vzc2FyeVxuICAgKiBAcGFyYW0ge251bGwgfCBzdHJpbmd9IG9sZFZhbHVlIFRoZSBwcmV2aW91c2x5IHN0b3JlZCB2YWx1ZVxuICAgKiBAcGFyYW0ge251bGwgfCBzdHJpbmd9IG5ld1ZhbHVlIFRoZSBuZXdseSBzdG9yZWQgdmFsdWVcbiAgICovXG4gICNlbWl0SWZOZWNlc3Nhcnkob2xkVmFsdWU6IG51bGwgfCBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgaWYgKG5ld1ZhbHVlID09PSBudWxsICYmIG9sZFZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmVtaXQoXCJsb2dvdXRcIik7XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgaXMgbm93IGEgc2Vzc2lvbiB3aGVuIHRoZXJlIGRpZG4ndCB1c2VkIHRvIGJlLlxuICAgIGVsc2UgaWYgKG9sZFZhbHVlID09PSBudWxsICYmIG5ld1ZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmVtaXQoXCJsb2dpblwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ3VyZWQgc3RvcmFnZSBhdCB0aGUgY29uZmlndXJlZCBrZXlcbiAgICogQHJldHVybiB7U2Vzc2lvbkRhdGEgfCB1bmRlZmluZWR9IFRoZSBzdG9yZWQgZGF0YSBvciB1bmRlZmluZWQgaWYgbm90IHByZXNlbnRcbiAgICovXG4gICNsb2FkU2Vzc2lvbigpOiBTZXNzaW9uRGF0YSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc3RvcmVkID0gdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSk7XG4gICAgaWYgKHN0b3JlZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBKU09OLnBhcnNlKHN0b3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIG1ldGFkYXRhIGZvciBhIHNlc3Npb24gZnJvbSBzdG9yYWdlXG4gICAqIEByZXR1cm4ge1Nlc3Npb25NZXRhZGF0YX0gVGhlIHNlc3Npb24gbWV0YWRhdGFcbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgY29uc3Qgc2VzcyA9IHRoaXMuI2xvYWRTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgTm9TZXNzaW9uRm91bmRFcnJvcigpO1xuICAgIH1cbiAgICByZXR1cm4gbWV0YWRhdGEoc2Vzcyk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIGN1cnJlbnQgYWNjZXNzIHRva2VuIGZyb20gc3RvcmFnZVxuICAgKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSBhY2Nlc3MgdG9rZW5cbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2VzcyA9IGF3YWl0IHJlYWRUZXN0QW5kU2V0PFNlc3Npb25EYXRhIHwgdW5kZWZpbmVkPih0aGlzLiNsb2NrLCB7XG4gICAgICByZWFkOiAoKSA9PiB0aGlzLiNsb2FkU2Vzc2lvbigpLFxuICAgICAgdGVzdDogKHYpID0+IHYgIT09IHVuZGVmaW5lZCAmJiBpc1N0YWxlKHYpLFxuICAgICAgc2V0OiBhc3luYyAob2xkU2Vzc2lvbjogU2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgaWYgKGlzUmVmcmVzaGFibGUob2xkU2Vzc2lvbikpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbmV3U2Vzc2lvbiA9IGF3YWl0IHJlZnJlc2gob2xkU2Vzc2lvbik7XG4gICAgICAgICAgICB0aGlzLiNzdG9yYWdlLnNldEl0ZW0odGhpcy4ja2V5LCBKU09OLnN0cmluZ2lmeShuZXdTZXNzaW9uKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3NmdWxseSByZWZyZXNoZWRcIik7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSAmJiBlLnN0YXR1cyA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiB0aGUgc2Vzc2lvbiBpcyBub3QgcmVmcmVzaGFibGUsIHdlIHNob3VsZCByZW1vdmUgaXRcbiAgICAgICAgICB0aGlzLiNzdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy4ja2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdGlmeSB0aGF0IHRoZSBzZXNzaW9uIGhhcyBjaGFuZ2VkXG4gICAgICAgIHRoaXMuI2VtaXRJZk5lY2Vzc2FyeShcIlwiLCB0aGlzLiNzdG9yYWdlLmdldEl0ZW0odGhpcy4ja2V5KSk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGlmICghc2Vzcykge1xuICAgICAgdGhyb3cgbmV3IE5vU2Vzc2lvbkZvdW5kRXJyb3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlc3MudG9rZW47XG4gIH1cblxuICAvKipcbiAgICogRGlyZWN0bHkgc2V0IHRoZSBzZXNzaW9uICh1cGRhdGluZyBhbGwgY29uc3VtZXJzIG9mIHRoZSBzZXNzaW9uIHN0b3JhZ2UpXG4gICAqIEBwYXJhbSB7U2Vzc2lvbkRhdGF9IFtzZXNzaW9uXSBUaGUgbmV3IHNlc3Npb25cbiAgICovXG4gIGFzeW5jIHNldFNlc3Npb24oc2Vzc2lvbj86IFNlc3Npb25EYXRhKSB7XG4gICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KFxuICAgICAgdGhpcy4jbG9jayxcbiAgICAgIHtcbiAgICAgICAgbW9kZTogXCJleGNsdXNpdmVcIixcbiAgICAgIH0sXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gc2Vzc2lvbiA/IEpTT04uc3RyaW5naWZ5KHNlc3Npb24pIDogbnVsbDtcblxuICAgICAgICAvLyBVbmxpa2UgZHVyaW5nIHJlZnJlc2gsIHdlIGRvbid0IHByZS1lbXB0IHRoZSByZWFkIGxvY2tzXG4gICAgICAgIC8vIGJlY2F1c2UgdGhpcyBvcGVyYXRpb24gaXMgc3luY2hyb25vdXNcbiAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgdGhpcy4jc3RvcmFnZS5zZXRJdGVtKHRoaXMuI2tleSwgbmV3VmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmFnZSBldmVudHMgZG9uJ3QgZmlyZSBpZiB0aGUgc3RvcmUgb2NjdXJyZWQgb24gdGhlIHNhbWUgcGFnZSxcbiAgICAgICAgLy8gc28gd2UgaGF2ZSB0byBtYW51YWxseSBpbnZva2Ugb3VyIGVtaXQgbG9naWNcbiAgICAgICAgdGhpcy4jZW1pdElmTmVjZXNzYXJ5KG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cbiJdfQ==