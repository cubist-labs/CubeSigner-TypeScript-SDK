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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0VBUXFDO0FBQ3JDLG1DQUF5QztBQU96Qzs7R0FFRztBQUNILE1BQWEscUJBQ1gsU0FBUSw2QkFBa0M7SUFRMUM7Ozs7T0FJRztJQUNILFlBQVksR0FBVyxFQUFFLFVBQW1CLFVBQVUsQ0FBQyxZQUFZO1FBQ2pFLEtBQUssRUFBRSxDQUFDOztRQVhWLDJDQUEyQztRQUMzQyw2Q0FBYTtRQUNiLGlEQUFrQjtRQUNsQiw4Q0FBYztRQVNaLHVCQUFBLElBQUksOEJBQVEsR0FBRyxNQUFBLENBQUM7UUFDaEIsdUJBQUEsSUFBSSxrQ0FBWSxPQUFPLE1BQUEsQ0FBQztRQUN4Qix1QkFBQSxJQUFJLCtCQUFTLHVCQUF1QixHQUFHLEVBQUUsTUFBQSxDQUFDO1FBQzFDLCtEQUErRDtRQUMvRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDeEMsaUVBQWlFO1lBQ2pFLElBQUksRUFBRSxDQUFDLFdBQVcsS0FBSyxPQUFPLElBQUksRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHO2dCQUFFLE9BQU87WUFDekQsdUJBQUEsSUFBSSxnRkFBaUIsTUFBckIsSUFBSSxFQUFrQixFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUErQkQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyx1QkFBQSxJQUFJLDRFQUFhLE1BQWpCLElBQUksQ0FBZSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxvQ0FBbUIsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFDRCxPQUFPLElBQUEseUJBQVEsRUFBQyxJ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LENBQUM7UUFDNUMsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFsSUQsc0RBa0lDO29SQWxHa0IsUUFBdUIsRUFBRSxRQUF1QjtJQUMvRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELHVEQUF1RDtTQUNsRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckIsQ0FBQztBQUNILENBQUM7SUFPQyxNQUFNLE1BQU0sR0FBRyx1QkFBQSxJQUFJLHNDQUFTLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksa0NBQUssQ0FBQyxDQUFDO0lBQ2hELElBQUksTUFBTSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLE9BQU87SUFDVCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHtcbiAgRXZlbnRFbWl0dGVyLFxuICBOb1Nlc3Npb25Gb3VuZEVycm9yLFxuICBpc1N0YWxlLFxuICBpc1JlZnJlc2hhYmxlLFxuICBtZXRhZGF0YSxcbiAgcmVmcmVzaCxcbiAgRXJyUmVzcG9uc2UsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHJlYWRUZXN0QW5kU2V0IH0gZnJvbSBcIi4vbG9ja3NcIjtcblxudHlwZSBCcm93c2VyU3RvcmFnZUV2ZW50cyA9IHtcbiAgbG9nb3V0KCk6IHZvaWQ7XG4gIGxvZ2luKCk6IHZvaWQ7XG59O1xuXG4vKipcbiAqIEEgbWFuYWdlciB0aGF0IHBlcnNpc3RzIGludG8gYnJvd3NlciBzdG9yYWdlIGFuZCB1c2VzIHdlYmxvY2tzIHRvIHNhZmVseSBwZXJmb3JtIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQnJvd3NlclN0b3JhZ2VNYW5hZ2VyXG4gIGV4dGVuZHMgRXZlbnRFbWl0dGVyPEJyb3dzZXJTdG9yYWdlRXZlbnRzPlxuICBpbXBsZW1lbnRzIFNlc3Npb25NYW5hZ2VyXG57XG4gIC8qKiBUaGUgc3RvcmFnZSBrZXkgZm9yIHRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgI2tleTogc3RyaW5nO1xuICAjc3RvcmFnZTogU3RvcmFnZTtcbiAgI2xvY2s6IHN0cmluZztcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSBUaGUgc3RvcmFnZSBrZXkgdG8gdXNlXG4gICAqIEBwYXJhbSB7U3RvcmFnZX0gW3N0b3JhZ2VdIFRoZSBzdG9yYWdlIG9iamVjdCB0byB1c2UgKGRlZmF1bHRzIHRvIGxvY2FsU3RvcmFnZSlcbiAgICovXG4gIGNvbnN0cnVjdG9yKGtleTogc3RyaW5nLCBzdG9yYWdlOiBTdG9yYWdlID0gZ2xvYmFsVGhpcy5sb2NhbFN0b3JhZ2UpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2tleSA9IGtleTtcbiAgICB0aGlzLiNzdG9yYWdlID0gc3RvcmFnZTtcbiAgICB0aGlzLiNsb2NrID0gYENTX1NES19TVE9SQUdFX0xPQ0tfJHtrZXl9YDtcbiAgICAvLyBTZXQgdXAgbGlzdGVuZXJzIHRvIGVtaXQgZXZlbnRzIHdoZW4gdXNlcnMgbG9nIGluIG9yIGxvZyBvdXRcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInN0b3JhZ2VcIiwgKGV2KSA9PiB7XG4gICAgICAvLyBXZSBvbmx5IGNhcmUgYWJvdXQgZXZlbnRzIG9uIG91ciBzdG9yYWdlIG9iamVjdCwgdXNpbmcgb3VyIGtleVxuICAgICAgaWYgKGV2LnN0b3JhZ2VBcmVhICE9PSBzdG9yYWdlIHx8IGV2LmtleSAhPT0ga2V5KSByZXR1cm47XG4gICAgICB0aGlzLiNlbWl0SWZOZWNlc3NhcnkoZXYub2xkVmFsdWUsIGV2Lm5ld1ZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhIGBsb2dpbmAgb3IgYGxvZ291dGAgZXZlbnQgaWYgbmVjZXNzYXJ5XG4gICAqIEBwYXJhbSB7bnVsbCB8IHN0cmluZ30gb2xkVmFsdWUgVGhlIHByZXZpb3VzbHkgc3RvcmVkIHZhbHVlXG4gICAqIEBwYXJhbSB7bnVsbCB8IHN0cmluZ30gbmV3VmFsdWUgVGhlIG5ld2x5IHN0b3JlZCB2YWx1ZVxuICAgKi9cbiAgI2VtaXRJZk5lY2Vzc2FyeShvbGRWYWx1ZTogbnVsbCB8IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgPT09IG51bGwgJiYgb2xkVmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZW1pdChcImxvZ291dFwiKTtcbiAgICB9XG5cbiAgICAvLyBUaGVyZSBpcyBub3cgYSBzZXNzaW9uIHdoZW4gdGhlcmUgZGlkbid0IHVzZWQgdG8gYmUuXG4gICAgZWxzZSBpZiAob2xkVmFsdWUgPT09IG51bGwgJiYgbmV3VmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZW1pdChcImxvZ2luXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNlc3Npb24gZnJvbSB0aGUgY29uZmlndXJlZCBzdG9yYWdlIGF0IHRoZSBjb25maWd1cmVkIGtleVxuICAgKiBAcmV0dXJuIHtTZXNzaW9uRGF0YSB8IHVuZGVmaW5lZH0gVGhlIHN0b3JlZCBkYXRhIG9yIHVuZGVmaW5lZCBpZiBub3QgcHJlc2VudFxuICAgKi9cbiAgI2xvYWRTZXNzaW9uKCk6IFNlc3Npb25EYXRhIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzdG9yZWQgPSB0aGlzLiNzdG9yYWdlLmdldEl0ZW0odGhpcy4ja2V5KTtcbiAgICBpZiAoc3RvcmVkID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RvcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgbWV0YWRhdGEgZm9yIGEgc2Vzc2lvbiBmcm9tIHN0b3JhZ2VcbiAgICogQHJldHVybiB7U2Vzc2lvbk1ldGFkYXRhfSBUaGUgc2Vzc2lvbiBtZXRhZGF0YVxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICBjb25zdCBzZXNzID0gdGhpcy4jbG9hZFNlc3Npb24oKTtcbiAgICBpZiAoIXNlc3MpIHtcbiAgICAgIHRocm93IG5ldyBOb1Nlc3Npb25Gb3VuZEVycm9yKCk7XG4gICAgfVxuICAgIHJldHVybiBtZXRhZGF0YShzZXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgY3VycmVudCBhY2Nlc3MgdG9rZW4gZnJvbSBzdG9yYWdlXG4gICAqIEByZXR1cm4ge3N0cmluZ30gVGhlIGFjY2VzcyB0b2tlblxuICAgKi9cbiAgYXN5bmMgdG9rZW4oKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBzZXNzID0gYXdhaXQgcmVhZFRlc3RBbmRTZXQ8U2Vzc2lvbkRhdGEgfCB1bmRlZmluZWQ+KHRoaXMuI2xvY2ssIHtcbiAgICAgIHJlYWQ6ICgpID0+IHRoaXMuI2xvYWRTZXNzaW9uKCksXG4gICAgICB0ZXN0OiAodikgPT4gdiAhPT0gdW5kZWZpbmVkICYmIGlzU3RhbGUodiksXG4gICAgICBzZXQ6IGFzeW5jIChvbGRTZXNzaW9uOiBTZXNzaW9uRGF0YSkgPT4ge1xuICAgICAgICBpZiAoaXNSZWZyZXNoYWJsZShvbGRTZXNzaW9uKSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBuZXdTZXNzaW9uID0gYXdhaXQgcmVmcmVzaChvbGRTZXNzaW9uKTtcbiAgICAgICAgICAgIHRoaXMuI3N0b3JhZ2Uuc2V0SXRlbSh0aGlzLiNrZXksIEpTT04uc3RyaW5naWZ5KG5ld1Nlc3Npb24pKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiU3VjY2Vzc2Z1bGx5IHJlZnJlc2hlZFwiKTtcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICBpZiAoZSBpbnN0YW5jZW9mIEVyclJlc3BvbnNlICYmIGUuc3RhdHVzID09PSA0MDMpIHtcbiAgICAgICAgICAgICAgdGhpcy4jc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHRoZSBzZXNzaW9uIGlzIG5vdCByZWZyZXNoYWJsZSwgd2Ugc2hvdWxkIHJlbW92ZSBpdFxuICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90aWZ5IHRoYXQgdGhlIHNlc3Npb24gaGFzIGNoYW5nZWRcbiAgICAgICAgdGhpcy4jZW1pdElmTmVjZXNzYXJ5KFwiXCIsIHRoaXMuI3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLiNrZXkpKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgaWYgKCFzZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgTm9TZXNzaW9uRm91bmRFcnJvcigpO1xuICAgIH1cbiAgICByZXR1cm4gc2Vzcy50b2tlbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBEaXJlY3RseSBzZXQgdGhlIHNlc3Npb24gKHVwZGF0aW5nIGFsbCBjb25zdW1lcnMgb2YgdGhlIHNlc3Npb24gc3RvcmFnZSlcbiAgICogQHBhcmFtIHtTZXNzaW9uRGF0YX0gW3Nlc3Npb25dIFRoZSBuZXcgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgc2V0U2Vzc2lvbihzZXNzaW9uPzogU2Vzc2lvbkRhdGEpIHtcbiAgICByZXR1cm4gYXdhaXQgbmF2aWdhdG9yLmxvY2tzLnJlcXVlc3QoXG4gICAgICB0aGlzLiNsb2NrLFxuICAgICAge1xuICAgICAgICBtb2RlOiBcImV4Y2x1c2l2ZVwiLFxuICAgICAgfSxcbiAgICAgIGFzeW5jICgpID0+IHtcbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSB0aGlzLiNzdG9yYWdlLmdldEl0ZW0odGhpcy4ja2V5KTtcbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBzZXNzaW9uID8gSlNPTi5zdHJpbmdpZnkoc2Vzc2lvbikgOiBudWxsO1xuXG4gICAgICAgIC8vIFVubGlrZSBkdXJpbmcgcmVmcmVzaCwgd2UgZG9uJ3QgcHJlZW1wdCB0aGUgcmVhZCBsb2Nrc1xuICAgICAgICAvLyBiZWNhdXNlIHRoaXMgb3BlcmF0aW9uIGlzIHN5bmNocm9ub3VzXG4gICAgICAgIGlmIChuZXdWYWx1ZSkge1xuICAgICAgICAgIHRoaXMuI3N0b3JhZ2Uuc2V0SXRlbSh0aGlzLiNrZXksIG5ld1ZhbHVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLiNzdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy4ja2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFN0b3JhZ2UgZXZlbnRzIGRvbid0IGZpcmUgaWYgdGhlIHN0b3JlIG9jY3VycmVkIG9uIHRoZSBzYW1lIHBhZ2UsXG4gICAgICAgIC8vIHNvIHdlIGhhdmUgdG8gbWFudWFsbHkgaW52b2tlIG91ciBlbWl0IGxvZ2ljXG4gICAgICAgIHRoaXMuI2VtaXRJZk5lY2Vzc2FyeShvbGRWYWx1ZSwgbmV3VmFsdWUpO1xuICAgICAgfSxcbiAgICApO1xuICB9XG59XG4iXX0=