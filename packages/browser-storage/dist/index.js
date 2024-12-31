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
     * @param key The storage key to use
     * @param storage The storage object to use (defaults to localStorage)
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
        __classPrivateFieldSet(this, _BrowserStorageManager_lock, `CS_SDK_STORAGE_LOCK_${key}`, "f");
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
     *
     * @returns The session metadata
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
     *
     * @returns The access token
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
     *
     * @param session The new session
     */
    async setSession(session) {
        await navigator.locks.request(__classPrivateFieldGet(this, _BrowserStorageManager_lock, "f"), {
            mode: "exclusive",
        }, async () => {
            const oldValue = __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").getItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"));
            const newValue = session ? JSON.stringify(session) : null;
            // Unlike during refresh, we don't preempt the read locks
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0VBUXFDO0FBQ3JDLG1DQUF5QztBQU96Qzs7R0FFRztBQUNILE1BQWEscUJBQ1gsU0FBUSw2QkFBa0M7SUFRMUM7Ozs7T0FJRztJQUNILFlBQVksR0FBVyxFQUFFLFVBQW1CLFVBQVUsQ0FBQyxZQUFZO1FBQ2pFLEtBQUssRUFBRSxDQUFDOztRQVhWLDJDQUEyQztRQUMzQyw2Q0FBYTtRQUNiLGlEQUFrQjtRQUNsQiw4Q0FBYztRQVNaLHVCQUFBLElBQUksOEJBQVEsR0FBRyxNQUFBLENBQUM7UUFDaEIsdUJBQUEsSUFBSSxrQ0FBWSxPQUFPLE1BQUEsQ0FBQztRQUN4Qix1QkFBQSxJQUFJLCtCQUFTLHVCQUF1QixHQUFHLEVBQUUsTUFBQSxDQUFDO1FBQzFDLCtEQUErRDtRQUMvRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDeEMsaUVBQWlFO1lBQ2pFLElBQUksRUFBRSxDQUFDLFdBQVcsS0FBSyxPQUFPLElBQUksRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHO2dCQUFFLE9BQU87WUFDekQsdUJBQUEsSUFBSSxnRkFBaUIsTUFBckIsSUFBSSxFQUFrQixFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFpQ0Q7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osTUFBTSxJQUFJLEdBQUcsdUJBQUEsSUFBSSw0RUFBYSxNQUFqQixJQUFJLENBQWUsQ0FBQztRQUNqQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixNQUFNLElBQUksb0NBQW1CLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsT0FBTyxJQUFBLHlCQUFRLEVBQUMs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QUFDO1FBQzVDLENBQUMsQ0FDRixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBdklELHNEQXVJQztvUkF0R2tCLFFBQXVCLEVBQUUsUUFBdUI7SUFDL0QsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCx1REFBdUQ7U0FDbEQsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JCLENBQUM7QUFDSCxDQUFDO0lBUUMsTUFBTSxNQUFNLEdBQUcsdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLENBQUMsQ0FBQztJQUNoRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQixPQUFPO0lBQ1QsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7XG4gIEV2ZW50RW1pdHRlcixcbiAgTm9TZXNzaW9uRm91bmRFcnJvcixcbiAgaXNTdGFsZSxcbiAgaXNSZWZyZXNoYWJsZSxcbiAgbWV0YWRhdGEsXG4gIHJlZnJlc2gsXG4gIEVyclJlc3BvbnNlLFxufSBmcm9tIFwiQGN1YmlzdC1sYWJzL2N1YmVzaWduZXItc2RrXCI7XG5pbXBvcnQgeyByZWFkVGVzdEFuZFNldCB9IGZyb20gXCIuL2xvY2tzXCI7XG5cbnR5cGUgQnJvd3NlclN0b3JhZ2VFdmVudHMgPSB7XG4gIGxvZ291dCgpOiB2b2lkO1xuICBsb2dpbigpOiB2b2lkO1xufTtcblxuLyoqXG4gKiBBIG1hbmFnZXIgdGhhdCBwZXJzaXN0cyBpbnRvIGJyb3dzZXIgc3RvcmFnZSBhbmQgdXNlcyB3ZWJsb2NrcyB0byBzYWZlbHkgcGVyZm9ybSByZWZyZXNoZXNcbiAqL1xuZXhwb3J0IGNsYXNzIEJyb3dzZXJTdG9yYWdlTWFuYWdlclxuICBleHRlbmRzIEV2ZW50RW1pdHRlcjxCcm93c2VyU3RvcmFnZUV2ZW50cz5cbiAgaW1wbGVtZW50cyBTZXNzaW9uTWFuYWdlclxue1xuICAvKiogVGhlIHN0b3JhZ2Uga2V5IGZvciB0aGUgc2Vzc2lvbiBkYXRhICovXG4gICNrZXk6IHN0cmluZztcbiAgI3N0b3JhZ2U6IFN0b3JhZ2U7XG4gICNsb2NrOiBzdHJpbmc7XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSBrZXkgVGhlIHN0b3JhZ2Uga2V5IHRvIHVzZVxuICAgKiBAcGFyYW0gc3RvcmFnZSBUaGUgc3RvcmFnZSBvYmplY3QgdG8gdXNlIChkZWZhdWx0cyB0byBsb2NhbFN0b3JhZ2UpXG4gICAqL1xuICBjb25zdHJ1Y3RvcihrZXk6IHN0cmluZywgc3RvcmFnZTogU3RvcmFnZSA9IGdsb2JhbFRoaXMubG9jYWxTdG9yYWdlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLiNrZXkgPSBrZXk7XG4gICAgdGhpcy4jc3RvcmFnZSA9IHN0b3JhZ2U7XG4gICAgdGhpcy4jbG9jayA9IGBDU19TREtfU1RPUkFHRV9MT0NLXyR7a2V5fWA7XG4gICAgLy8gU2V0IHVwIGxpc3RlbmVycyB0byBlbWl0IGV2ZW50cyB3aGVuIHVzZXJzIGxvZyBpbiBvciBsb2cgb3V0XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJzdG9yYWdlXCIsIChldikgPT4ge1xuICAgICAgLy8gV2Ugb25seSBjYXJlIGFib3V0IGV2ZW50cyBvbiBvdXIgc3RvcmFnZSBvYmplY3QsIHVzaW5nIG91ciBrZXlcbiAgICAgIGlmIChldi5zdG9yYWdlQXJlYSAhPT0gc3RvcmFnZSB8fCBldi5rZXkgIT09IGtleSkgcmV0dXJuO1xuICAgICAgdGhpcy4jZW1pdElmTmVjZXNzYXJ5KGV2Lm9sZFZhbHVlLCBldi5uZXdWYWx1ZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogRW1pdHMgYSBgbG9naW5gIG9yIGBsb2dvdXRgIGV2ZW50IGlmIG5lY2Vzc2FyeVxuICAgKlxuICAgKiBAcGFyYW0gb2xkVmFsdWUgVGhlIHByZXZpb3VzbHkgc3RvcmVkIHZhbHVlXG4gICAqIEBwYXJhbSBuZXdWYWx1ZSBUaGUgbmV3bHkgc3RvcmVkIHZhbHVlXG4gICAqL1xuICAjZW1pdElmTmVjZXNzYXJ5KG9sZFZhbHVlOiBudWxsIHwgc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nIHwgbnVsbCkge1xuICAgIGlmIChuZXdWYWx1ZSA9PT0gbnVsbCAmJiBvbGRWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5lbWl0KFwibG9nb3V0XCIpO1xuICAgIH1cblxuICAgIC8vIFRoZXJlIGlzIG5vdyBhIHNlc3Npb24gd2hlbiB0aGVyZSBkaWRuJ3QgdXNlZCB0byBiZS5cbiAgICBlbHNlIGlmIChvbGRWYWx1ZSA9PT0gbnVsbCAmJiBuZXdWYWx1ZSAhPT0gbnVsbCkge1xuICAgICAgdGhpcy5lbWl0KFwibG9naW5cIik7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIGEgc2Vzc2lvbiBmcm9tIHRoZSBjb25maWd1cmVkIHN0b3JhZ2UgYXQgdGhlIGNvbmZpZ3VyZWQga2V5XG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzdG9yZWQgZGF0YSBvciB1bmRlZmluZWQgaWYgbm90IHByZXNlbnRcbiAgICovXG4gICNsb2FkU2Vzc2lvbigpOiBTZXNzaW9uRGF0YSB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc3RvcmVkID0gdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSk7XG4gICAgaWYgKHN0b3JlZCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHJldHVybiBKU09OLnBhcnNlKHN0b3JlZCk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIG1ldGFkYXRhIGZvciBhIHNlc3Npb24gZnJvbSBzdG9yYWdlXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBzZXNzaW9uIG1ldGFkYXRhXG4gICAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPFNlc3Npb25NZXRhZGF0YT4ge1xuICAgIGNvbnN0IHNlc3MgPSB0aGlzLiNsb2FkU2Vzc2lvbigpO1xuICAgIGlmICghc2Vzcykge1xuICAgICAgdGhyb3cgbmV3IE5vU2Vzc2lvbkZvdW5kRXJyb3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIG1ldGFkYXRhKHNlc3MpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBjdXJyZW50IGFjY2VzcyB0b2tlbiBmcm9tIHN0b3JhZ2VcbiAgICpcbiAgICogQHJldHVybnMgVGhlIGFjY2VzcyB0b2tlblxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzID0gYXdhaXQgcmVhZFRlc3RBbmRTZXQ8U2Vzc2lvbkRhdGEgfCB1bmRlZmluZWQ+KHRoaXMuI2xvY2ssIHtcbiAgICAgIHJlYWQ6ICgpID0+IHRoaXMuI2xvYWRTZXNzaW9uKCksXG4gICAgICB0ZXN0OiAodikgPT4gdiAhPT0gdW5kZWZpbmVkICYmIGlzU3RhbGUodiksXG4gICAgICBzZXQ6IGFzeW5jIChvbGRTZXNzaW9uOiBTZXNzaW9uRGF0YSkgPT4ge1xuICAgICAgICBpZiAoaXNSZWZyZXNoYWJsZShvbGRTZXNzaW9uKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTZXNzaW9uID0gYXdhaXQgcmVmcmVzaChvbGRTZXNzaW9uKTtcbiAgICAgICAgICAgIHRoaXMuI3N0b3JhZ2Uuc2V0SXRlbSh0aGlzLiNrZXksIEpTT04uc3RyaW5naWZ5KG5ld1Nlc3Npb24pKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3VjY2Vzc2Z1bGx5IHJlZnJlc2hlZFwiKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEVyclJlc3BvbnNlICYmIGUuc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICAgdGhpcy4jc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHRoZSBzZXNzaW9uIGlzIG5vdCByZWZyZXNoYWJsZSwgd2Ugc2hvdWxkIHJlbW92ZSBpdFxuICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90aWZ5IHRoYXQgdGhlIHNlc3Npb24gaGFzIGNoYW5nZWRcbiAgICAgICAgdGhpcy4jZW1pdElmTmVjZXNzYXJ5KFwiXCIsIHRoaXMuI3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLiNrZXkpKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFzZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgTm9TZXNzaW9uRm91bmRFcnJvcigpO1xuICAgIH1cbiAgICByZXR1cm4gc2Vzcy50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXJlY3RseSBzZXQgdGhlIHNlc3Npb24gKHVwZGF0aW5nIGFsbCBjb25zdW1lcnMgb2YgdGhlIHNlc3Npb24gc3RvcmFnZSlcbiAgICpcbiAgICogQHBhcmFtIHNlc3Npb24gVGhlIG5ldyBzZXNzaW9uXG4gICAqL1xuICBhc3luYyBzZXRTZXNzaW9uKHNlc3Npb24/OiBTZXNzaW9uRGF0YSkge1xuICAgIGF3YWl0IG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KFxuICAgICAgdGhpcy4jbG9jayxcbiAgICAgIHtcbiAgICAgICAgbW9kZTogXCJleGNsdXNpdmVcIixcbiAgICAgIH0sXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gc2Vzc2lvbiA/IEpTT04uc3RyaW5naWZ5KHNlc3Npb24pIDogbnVsbDtcblxuICAgICAgICAvLyBVbmxpa2UgZHVyaW5nIHJlZnJlc2gsIHdlIGRvbid0IHByZWVtcHQgdGhlIHJlYWQgbG9ja3NcbiAgICAgICAgLy8gYmVjYXVzZSB0aGlzIG9wZXJhdGlvbiBpcyBzeW5jaHJvbm91c1xuICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiNzdG9yYWdlLnNldEl0ZW0odGhpcy4ja2V5LCBuZXdWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdG9yYWdlIGV2ZW50cyBkb24ndCBmaXJlIGlmIHRoZSBzdG9yZSBvY2N1cnJlZCBvbiB0aGUgc2FtZSBwYWdlLFxuICAgICAgICAvLyBzbyB3ZSBoYXZlIHRvIG1hbnVhbGx5IGludm9rZSBvdXIgZW1pdCBsb2dpY1xuICAgICAgICB0aGlzLiNlbWl0SWZOZWNlc3Nhcnkob2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIl19