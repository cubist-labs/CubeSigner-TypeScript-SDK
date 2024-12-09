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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsZ0VBUXFDO0FBQ3JDLG1DQUF5QztBQU96Qzs7R0FFRztBQUNILE1BQWEscUJBQ1gsU0FBUSw2QkFBa0M7SUFRMUM7Ozs7T0FJRztJQUNILFlBQVksR0FBVyxFQUFFLFVBQW1CLFVBQVUsQ0FBQyxZQUFZO1FBQ2pFLEtBQUssRUFBRSxDQUFDOztRQVhWLDJDQUEyQztRQUMzQyw2Q0FBYTtRQUNiLGlEQUFrQjtRQUNsQiw4Q0FBYztRQVNaLHVCQUFBLElBQUksOEJBQVEsR0FBRyxNQUFBLENBQUM7UUFDaEIsdUJBQUEsSUFBSSxrQ0FBWSxPQUFPLE1BQUEsQ0FBQztRQUN4Qix1QkFBQSxJQUFJLCtCQUFTLHVCQUF1QixHQUFHLEVBQUUsTUFBQSxDQUFDO1FBQzFDLCtEQUErRDtRQUMvRCxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7WUFDeEMsaUVBQWlFO1lBQ2pFLElBQUksRUFBRSxDQUFDLFdBQVcsS0FBSyxPQUFPLElBQUksRUFBRSxDQUFDLEdBQUcsS0FBSyxHQUFHO2dCQUFFLE9BQU87WUFDekQsdUJBQUEsSUFBSSxnRkFBaUIsTUFBckIsSUFBSSxFQUFrQixFQUFFLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNsRCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7SUFpQ0Q7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osTUFBTSxJQUFJLEdBQUcsdUJBQUEsSUFBSSw0RUFBYSxNQUFqQixJQUFJLENBQWUsQ0FBQztRQUNqQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDVixNQUFNLElBQUksb0NBQW1CLEVBQUUsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsT0FBTyxJQUFBLHlCQUFRLEVBQUMs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QUFDLENBQUM7UUFDNUMsQ0FBQyxDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF2SUQsc0RBdUlDO29SQXRHa0IsUUFBdUIsRUFBRSxRQUF1QjtJQUMvRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQzNDLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDdEIsQ0FBQztJQUVELHVEQUF1RDtTQUNsRCxJQUFJLFFBQVEsS0FBSyxJQUFJLElBQUksUUFBUSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ2hELElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDckIsQ0FBQztBQUNILENBQUM7SUFRQyxNQUFNLE1BQU0sR0FBRyx1QkFBQSxJQUFJLHNDQUFTLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksa0NBQUssQ0FBQyxDQUFDO0lBQ2hELElBQUksTUFBTSxLQUFLLElBQUksRUFBRSxDQUFDO1FBQ3BCLE9BQU87SUFDVCxDQUFDO0lBRUQsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IFNlc3Npb25EYXRhLCBTZXNzaW9uTWFuYWdlciwgU2Vzc2lvbk1ldGFkYXRhIH0gZnJvbSBcIkBjdWJpc3QtbGFicy9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHtcbiAgRXZlbnRFbWl0dGVyLFxuICBOb1Nlc3Npb25Gb3VuZEVycm9yLFxuICBpc1N0YWxlLFxuICBpc1JlZnJlc2hhYmxlLFxuICBtZXRhZGF0YSxcbiAgcmVmcmVzaCxcbiAgRXJyUmVzcG9uc2UsXG59IGZyb20gXCJAY3ViaXN0LWxhYnMvY3ViZXNpZ25lci1zZGtcIjtcbmltcG9ydCB7IHJlYWRUZXN0QW5kU2V0IH0gZnJvbSBcIi4vbG9ja3NcIjtcblxudHlwZSBCcm93c2VyU3RvcmFnZUV2ZW50cyA9IHtcbiAgbG9nb3V0KCk6IHZvaWQ7XG4gIGxvZ2luKCk6IHZvaWQ7XG59O1xuXG4vKipcbiAqIEEgbWFuYWdlciB0aGF0IHBlcnNpc3RzIGludG8gYnJvd3NlciBzdG9yYWdlIGFuZCB1c2VzIHdlYmxvY2tzIHRvIHNhZmVseSBwZXJmb3JtIHJlZnJlc2hlc1xuICovXG5leHBvcnQgY2xhc3MgQnJvd3NlclN0b3JhZ2VNYW5hZ2VyXG4gIGV4dGVuZHMgRXZlbnRFbWl0dGVyPEJyb3dzZXJTdG9yYWdlRXZlbnRzPlxuICBpbXBsZW1lbnRzIFNlc3Npb25NYW5hZ2VyXG57XG4gIC8qKiBUaGUgc3RvcmFnZSBrZXkgZm9yIHRoZSBzZXNzaW9uIGRhdGEgKi9cbiAgI2tleTogc3RyaW5nO1xuICAjc3RvcmFnZTogU3RvcmFnZTtcbiAgI2xvY2s6IHN0cmluZztcblxuICAvKipcbiAgICpcbiAgICogQHBhcmFtIGtleSBUaGUgc3RvcmFnZSBrZXkgdG8gdXNlXG4gICAqIEBwYXJhbSBzdG9yYWdlIFRoZSBzdG9yYWdlIG9iamVjdCB0byB1c2UgKGRlZmF1bHRzIHRvIGxvY2FsU3RvcmFnZSlcbiAgICovXG4gIGNvbnN0cnVjdG9yKGtleTogc3RyaW5nLCBzdG9yYWdlOiBTdG9yYWdlID0gZ2xvYmFsVGhpcy5sb2NhbFN0b3JhZ2UpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuI2tleSA9IGtleTtcbiAgICB0aGlzLiNzdG9yYWdlID0gc3RvcmFnZTtcbiAgICB0aGlzLiNsb2NrID0gYENTX1NES19TVE9SQUdFX0xPQ0tfJHtrZXl9YDtcbiAgICAvLyBTZXQgdXAgbGlzdGVuZXJzIHRvIGVtaXQgZXZlbnRzIHdoZW4gdXNlcnMgbG9nIGluIG9yIGxvZyBvdXRcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInN0b3JhZ2VcIiwgKGV2KSA9PiB7XG4gICAgICAvLyBXZSBvbmx5IGNhcmUgYWJvdXQgZXZlbnRzIG9uIG91ciBzdG9yYWdlIG9iamVjdCwgdXNpbmcgb3VyIGtleVxuICAgICAgaWYgKGV2LnN0b3JhZ2VBcmVhICE9PSBzdG9yYWdlIHx8IGV2LmtleSAhPT0ga2V5KSByZXR1cm47XG4gICAgICB0aGlzLiNlbWl0SWZOZWNlc3NhcnkoZXYub2xkVmFsdWUsIGV2Lm5ld1ZhbHVlKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBFbWl0cyBhIGBsb2dpbmAgb3IgYGxvZ291dGAgZXZlbnQgaWYgbmVjZXNzYXJ5XG4gICAqXG4gICAqIEBwYXJhbSBvbGRWYWx1ZSBUaGUgcHJldmlvdXNseSBzdG9yZWQgdmFsdWVcbiAgICogQHBhcmFtIG5ld1ZhbHVlIFRoZSBuZXdseSBzdG9yZWQgdmFsdWVcbiAgICovXG4gICNlbWl0SWZOZWNlc3Nhcnkob2xkVmFsdWU6IG51bGwgfCBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcgfCBudWxsKSB7XG4gICAgaWYgKG5ld1ZhbHVlID09PSBudWxsICYmIG9sZFZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmVtaXQoXCJsb2dvdXRcIik7XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgaXMgbm93IGEgc2Vzc2lvbiB3aGVuIHRoZXJlIGRpZG4ndCB1c2VkIHRvIGJlLlxuICAgIGVsc2UgaWYgKG9sZFZhbHVlID09PSBudWxsICYmIG5ld1ZhbHVlICE9PSBudWxsKSB7XG4gICAgICB0aGlzLmVtaXQoXCJsb2dpblwiKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgYSBzZXNzaW9uIGZyb20gdGhlIGNvbmZpZ3VyZWQgc3RvcmFnZSBhdCB0aGUgY29uZmlndXJlZCBrZXlcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHN0b3JlZCBkYXRhIG9yIHVuZGVmaW5lZCBpZiBub3QgcHJlc2VudFxuICAgKi9cbiAgI2xvYWRTZXNzaW9uKCk6IFNlc3Npb25EYXRhIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBzdG9yZWQgPSB0aGlzLiNzdG9yYWdlLmdldEl0ZW0odGhpcy4ja2V5KTtcbiAgICBpZiAoc3RvcmVkID09PSBudWxsKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIEpTT04ucGFyc2Uoc3RvcmVkKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgbWV0YWRhdGEgZm9yIGEgc2Vzc2lvbiBmcm9tIHN0b3JhZ2VcbiAgICpcbiAgICogQHJldHVybnMgVGhlIHNlc3Npb24gbWV0YWRhdGFcbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8U2Vzc2lvbk1ldGFkYXRhPiB7XG4gICAgY29uc3Qgc2VzcyA9IHRoaXMuI2xvYWRTZXNzaW9uKCk7XG4gICAgaWYgKCFzZXNzKSB7XG4gICAgICB0aHJvdyBuZXcgTm9TZXNzaW9uRm91bmRFcnJvcigpO1xuICAgIH1cbiAgICByZXR1cm4gbWV0YWRhdGEoc2Vzcyk7XG4gIH1cblxuICAvKipcbiAgICogTG9hZHMgdGhlIGN1cnJlbnQgYWNjZXNzIHRva2VuIGZyb20gc3RvcmFnZVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgYWNjZXNzIHRva2VuXG4gICAqL1xuICBhc3luYyB0b2tlbigpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIGNvbnN0IHNlc3MgPSBhd2FpdCByZWFkVGVzdEFuZFNldDxTZXNzaW9uRGF0YSB8IHVuZGVmaW5lZD4odGhpcy4jbG9jaywge1xuICAgICAgcmVhZDogKCkgPT4gdGhpcy4jbG9hZFNlc3Npb24oKSxcbiAgICAgIHRlc3Q6ICh2KSA9PiB2ICE9PSB1bmRlZmluZWQgJiYgaXNTdGFsZSh2KSxcbiAgICAgIHNldDogYXN5bmMgKG9sZFNlc3Npb246IFNlc3Npb25EYXRhKSA9PiB7XG4gICAgICAgIGlmIChpc1JlZnJlc2hhYmxlKG9sZFNlc3Npb24pKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGNvbnN0IG5ld1Nlc3Npb24gPSBhd2FpdCByZWZyZXNoKG9sZFNlc3Npb24pO1xuICAgICAgICAgICAgdGhpcy4jc3RvcmFnZS5zZXRJdGVtKHRoaXMuI2tleSwgSlNPTi5zdHJpbmdpZnkobmV3U2Vzc2lvbikpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJTdWNjZXNzZnVsbHkgcmVmcmVzaGVkXCIpO1xuICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIGlmIChlIGluc3RhbmNlb2YgRXJyUmVzcG9uc2UgJiYgZS5zdGF0dXMgPT09IDQwMykge1xuICAgICAgICAgICAgICB0aGlzLiNzdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy4ja2V5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgdGhlIHNlc3Npb24gaXMgbm90IHJlZnJlc2hhYmxlLCB3ZSBzaG91bGQgcmVtb3ZlIGl0XG4gICAgICAgICAgdGhpcy4jc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBOb3RpZnkgdGhhdCB0aGUgc2Vzc2lvbiBoYXMgY2hhbmdlZFxuICAgICAgICB0aGlzLiNlbWl0SWZOZWNlc3NhcnkoXCJcIiwgdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSkpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgICBpZiAoIXNlc3MpIHtcbiAgICAgIHRocm93IG5ldyBOb1Nlc3Npb25Gb3VuZEVycm9yKCk7XG4gICAgfVxuICAgIHJldHVybiBzZXNzLnRva2VuO1xuICB9XG5cbiAgLyoqXG4gICAqIERpcmVjdGx5IHNldCB0aGUgc2Vzc2lvbiAodXBkYXRpbmcgYWxsIGNvbnN1bWVycyBvZiB0aGUgc2Vzc2lvbiBzdG9yYWdlKVxuICAgKlxuICAgKiBAcGFyYW0gc2Vzc2lvbiBUaGUgbmV3IHNlc3Npb25cbiAgICovXG4gIGFzeW5jIHNldFNlc3Npb24oc2Vzc2lvbj86IFNlc3Npb25EYXRhKSB7XG4gICAgcmV0dXJuIGF3YWl0IG5hdmlnYXRvci5sb2Nrcy5yZXF1ZXN0KFxuICAgICAgdGhpcy4jbG9jayxcbiAgICAgIHtcbiAgICAgICAgbW9kZTogXCJleGNsdXNpdmVcIixcbiAgICAgIH0sXG4gICAgICBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy4jc3RvcmFnZS5nZXRJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIGNvbnN0IG5ld1ZhbHVlID0gc2Vzc2lvbiA/IEpTT04uc3RyaW5naWZ5KHNlc3Npb24pIDogbnVsbDtcblxuICAgICAgICAvLyBVbmxpa2UgZHVyaW5nIHJlZnJlc2gsIHdlIGRvbid0IHByZWVtcHQgdGhlIHJlYWQgbG9ja3NcbiAgICAgICAgLy8gYmVjYXVzZSB0aGlzIG9wZXJhdGlvbiBpcyBzeW5jaHJvbm91c1xuICAgICAgICBpZiAobmV3VmFsdWUpIHtcbiAgICAgICAgICB0aGlzLiNzdG9yYWdlLnNldEl0ZW0odGhpcy4ja2V5LCBuZXdWYWx1ZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy4jc3RvcmFnZS5yZW1vdmVJdGVtKHRoaXMuI2tleSk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTdG9yYWdlIGV2ZW50cyBkb24ndCBmaXJlIGlmIHRoZSBzdG9yZSBvY2N1cnJlZCBvbiB0aGUgc2FtZSBwYWdlLFxuICAgICAgICAvLyBzbyB3ZSBoYXZlIHRvIG1hbnVhbGx5IGludm9rZSBvdXIgZW1pdCBsb2dpY1xuICAgICAgICB0aGlzLiNlbWl0SWZOZWNlc3Nhcnkob2xkVmFsdWUsIG5ld1ZhbHVlKTtcbiAgICAgIH0sXG4gICAgKTtcbiAgfVxufVxuIl19