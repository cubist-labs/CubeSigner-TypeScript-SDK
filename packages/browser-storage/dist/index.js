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
import { EventEmitter, NoSessionFoundError, isStale, isRefreshable, metadata, refresh, ErrResponse, } from "@cubist-labs/cubesigner-sdk";
import { readTestAndSet } from "./locks.js";
/**
 * A manager that persists into browser storage and uses weblocks to safely perform refreshes
 */
export class BrowserStorageManager extends EventEmitter {
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
            throw new NoSessionFoundError();
        }
        return metadata(sess);
    }
    /**
     * Loads the current access token from storage
     *
     * @returns The access token
     */
    async token() {
        const sess = await readTestAndSet(__classPrivateFieldGet(this, _BrowserStorageManager_lock, "f"), {
            read: () => __classPrivateFieldGet(this, _BrowserStorageManager_instances, "m", _BrowserStorageManager_loadSession).call(this),
            test: (v) => v !== undefined && isStale(v),
            set: async (oldSession) => {
                if (isRefreshable(oldSession)) {
                    try {
                        const newSession = await refresh(oldSession);
                        __classPrivateFieldGet(this, _BrowserStorageManager_storage, "f").setItem(__classPrivateFieldGet(this, _BrowserStorageManager_key, "f"), JSON.stringify(newSession));
                        console.log("Successfully refreshed");
                    }
                    catch (e) {
                        if (e instanceof ErrResponse && e.status === 403) {
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
            throw new NoSessionFoundError();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBQ0EsT0FBTyxFQUNMLFlBQVksRUFDWixtQkFBbUIsRUFDbkIsT0FBTyxFQUNQLGFBQWEsRUFDYixRQUFRLEVBQ1IsT0FBTyxFQUNQLFdBQVcsR0FDWixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBRSxjQUFjLEVBQUUsTUFBTSxZQUFZLENBQUM7QUFPNUM7O0dBRUc7QUFDSCxNQUFNLE9BQU8scUJBQ1gsU0FBUSxZQUFrQztJQVExQzs7OztPQUlHO0lBQ0gsWUFBWSxHQUFXLEVBQUUsVUFBbUIsVUFBVSxDQUFDLFlBQVk7UUFDakUsS0FBSyxFQUFFLENBQUM7O1FBWFYsMkNBQTJDO1FBQzNDLDZDQUFhO1FBQ2IsaURBQWtCO1FBQ2xCLDhDQUFjO1FBU1osdUJBQUEsSUFBSSw4QkFBUSxHQUFHLE1BQUEsQ0FBQztRQUNoQix1QkFBQSxJQUFJLGtDQUFZLE9BQU8sTUFBQSxDQUFDO1FBQ3hCLHVCQUFBLElBQUksK0JBQVMsdUJBQXVCLEdBQUcsRUFBRSxNQUFBLENBQUM7UUFDMUMsK0RBQStEO1FBQy9ELE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRTtZQUN4QyxpRUFBaUU7WUFDakUsSUFBSSxFQUFFLENBQUMsV0FBVyxLQUFLLE9BQU8sSUFBSSxFQUFFLENBQUMsR0FBRyxLQUFLLEdBQUc7Z0JBQUUsT0FBTztZQUN6RCx1QkFBQSxJQUFJLGdGQUFpQixNQUFyQixJQUFJLEVBQWtCLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQWlDRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLFFBQVE7UUFDWixNQUFNLElBQUksR0FBRyx1QkFBQSxJQUFJLDRFQUFhLE1BQWpCLElBQUksQ0FBZSxDQUFDO1FBQ2pDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxLQUFLO1FBQ1QsTUFBTSxJQUFJLEdBQUcsTUFBTSxjQUFjLENBQTBCLHVCQUFBLElBQUksbUNBQU0sRUFBRTtZQUNyRSxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsdUJBQUEsSUFBSSw0RUFBYSxNQUFqQixJQUFJLENBQWU7WUFDL0IsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUyxJQUFJLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDMUMsR0FBRyxFQUFFLEtBQUssRUFBRSxVQUF1QixFQUFFLEVBQUU7Z0JBQ3JDLElBQUksYUFBYSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7b0JBQzlCLElBQUksQ0FBQzt3QkFDSCxNQUFNLFVBQVUsR0FBRyxNQUFNLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDN0MsdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO3dCQUM3RCxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUM7b0JBQ3hDLENBQUM7b0JBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQzt3QkFDWCxJQUFJLENBQUMsWUFBWSxXQUFXLElBQUksQ0FBQyxDQUFDLE1BQU0sS0FBSyxHQUFHLEVBQUUsQ0FBQzs0QkFDakQsdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLENBQUMsQ0FBQzt3QkFDdEMsQ0FBQztvQkFDSCxDQUFDO2dCQUNILENBQUM7cUJBQU0sQ0FBQztvQkFDTix5REFBeUQ7b0JBQ3pELHVCQUFBLElBQUksc0NBQVMsQ0FBQyxVQUFVLENBQUMsdUJBQUEsSUFBSSxrQ0FBSyxDQUFDLENBQUM7Z0JBQ3RDLENBQUM7Z0JBRUQsc0NBQXNDO2dCQUN0Qyx1QkFBQSxJQUFJLGdGQUFpQixNQUFyQixJQUFJLEVBQWtCLEVBQUUsRUFBRSx1QkFBQSxJQUFJLHNDQUFTLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksa0NBQUssQ0FBQyxDQUFDLENBQUM7WUFDOUQsQ0FBQztTQUNGLENBQUMsQ0FBQztRQUNILElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNWLE1BQU0sSUFBSSxtQkFBbUIsRUFBRSxDQUFDO1FBQ2xDLENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsVUFBVSxDQUFDLE9BQXFCO1FBQ3BDLE1BQU0sU0FBUyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQzNCLHVCQUFBLElBQUksbUNBQU0sRUFDVjtZQUNFLElBQUksRUFBRSxXQUFXO1NBQ2xCLEVBQ0QsS0FBSyxJQUFJLEVBQUU7WUFDVCxNQUFNLFFBQVEsR0FBRyx1QkFBQSxJQUFJLHNDQUFTLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksa0NBQUssQ0FBQyxDQUFDO1lBQ2xELE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBRTFELHlEQUF5RDtZQUN6RCx3Q0FBd0M7WUFDeEMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDYix1QkFBQSxJQUFJLHNDQUFTLENBQUMsT0FBTyxDQUFDLHVCQUFBLElBQUksa0NBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztZQUM3QyxDQUFDO2lCQUFNLENBQUM7Z0JBQ04sdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLFVBQVUsQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLENBQUMsQ0FBQztZQUN0QyxDQUFDO1lBRUQsb0VBQW9FO1lBQ3BFLCtDQUErQztZQUMvQyx1QkFBQSxJQUFJLGdGQUFpQixNQUFyQixJQUFJLEVBQWtCLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztRQUM1QyxDQUFDLENBQ0YsQ0FBQztJQUNKLENBQUM7Q0FDRjtvUkF0R2tCLFFBQXVCLEVBQUUsUUFBdUI7SUFDL0QsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUMzQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RCLENBQUM7SUFFRCx1REFBdUQ7U0FDbEQsSUFBSSxRQUFRLEtBQUssSUFBSSxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNoRCxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JCLENBQUM7QUFDSCxDQUFDO0lBUUMsTUFBTSxNQUFNLEdBQUcsdUJBQUEsSUFBSSxzQ0FBUyxDQUFDLE9BQU8sQ0FBQyx1QkFBQSxJQUFJLGtDQUFLLENBQUMsQ0FBQztJQUNoRCxJQUFJLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUNwQixPQUFPO0lBQ1QsQ0FBQztJQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUgeyBTZXNzaW9uRGF0YSwgU2Vzc2lvbk1hbmFnZXIsIFNlc3Npb25NZXRhZGF0YSB9IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHtcbiAgRXZlbnRFbWl0dGVyLFxuICBOb1Nlc3Npb25Gb3VuZEVycm9yLFxuICBpc1N0YWxlLFxuICBpc1JlZnJlc2hhYmxlLFxuICBtZXRhZGF0YSxcbiAgcmVmcmVzaCxcbiAgRXJyUmVzcG9uc2UsXG59IGZyb20gXCJAY3ViaXN0LWRldi9jdWJlc2lnbmVyLXNka1wiO1xuaW1wb3J0IHsgcmVhZFRlc3RBbmRTZXQgfSBmcm9tIFwiLi9sb2Nrcy50c1wiO1xuXG50eXBlIEJyb3dzZXJTdG9yYWdlRXZlbnRzID0ge1xuICBsb2dvdXQoKTogdm9pZDtcbiAgbG9naW4oKTogdm9pZDtcbn07XG5cbi8qKlxuICogQSBtYW5hZ2VyIHRoYXQgcGVyc2lzdHMgaW50byBicm93c2VyIHN0b3JhZ2UgYW5kIHVzZXMgd2VibG9ja3MgdG8gc2FmZWx5IHBlcmZvcm0gcmVmcmVzaGVzXG4gKi9cbmV4cG9ydCBjbGFzcyBCcm93c2VyU3RvcmFnZU1hbmFnZXJcbiAgZXh0ZW5kcyBFdmVudEVtaXR0ZXI8QnJvd3NlclN0b3JhZ2VFdmVudHM+XG4gIGltcGxlbWVudHMgU2Vzc2lvbk1hbmFnZXJcbntcbiAgLyoqIFRoZSBzdG9yYWdlIGtleSBmb3IgdGhlIHNlc3Npb24gZGF0YSAqL1xuICAja2V5OiBzdHJpbmc7XG4gICNzdG9yYWdlOiBTdG9yYWdlO1xuICAjbG9jazogc3RyaW5nO1xuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0ga2V5IFRoZSBzdG9yYWdlIGtleSB0byB1c2VcbiAgICogQHBhcmFtIHN0b3JhZ2UgVGhlIHN0b3JhZ2Ugb2JqZWN0IHRvIHVzZSAoZGVmYXVsdHMgdG8gbG9jYWxTdG9yYWdlKVxuICAgKi9cbiAgY29uc3RydWN0b3Ioa2V5OiBzdHJpbmcsIHN0b3JhZ2U6IFN0b3JhZ2UgPSBnbG9iYWxUaGlzLmxvY2FsU3RvcmFnZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy4ja2V5ID0ga2V5O1xuICAgIHRoaXMuI3N0b3JhZ2UgPSBzdG9yYWdlO1xuICAgIHRoaXMuI2xvY2sgPSBgQ1NfU0RLX1NUT1JBR0VfTE9DS18ke2tleX1gO1xuICAgIC8vIFNldCB1cCBsaXN0ZW5lcnMgdG8gZW1pdCBldmVudHMgd2hlbiB1c2VycyBsb2cgaW4gb3IgbG9nIG91dFxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwic3RvcmFnZVwiLCAoZXYpID0+IHtcbiAgICAgIC8vIFdlIG9ubHkgY2FyZSBhYm91dCBldmVudHMgb24gb3VyIHN0b3JhZ2Ugb2JqZWN0LCB1c2luZyBvdXIga2V5XG4gICAgICBpZiAoZXYuc3RvcmFnZUFyZWEgIT09IHN0b3JhZ2UgfHwgZXYua2V5ICE9PSBrZXkpIHJldHVybjtcbiAgICAgIHRoaXMuI2VtaXRJZk5lY2Vzc2FyeShldi5vbGRWYWx1ZSwgZXYubmV3VmFsdWUpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGEgYGxvZ2luYCBvciBgbG9nb3V0YCBldmVudCBpZiBuZWNlc3NhcnlcbiAgICpcbiAgICogQHBhcmFtIG9sZFZhbHVlIFRoZSBwcmV2aW91c2x5IHN0b3JlZCB2YWx1ZVxuICAgKiBAcGFyYW0gbmV3VmFsdWUgVGhlIG5ld2x5IHN0b3JlZCB2YWx1ZVxuICAgKi9cbiAgI2VtaXRJZk5lY2Vzc2FyeShvbGRWYWx1ZTogbnVsbCB8IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyB8IG51bGwpIHtcbiAgICBpZiAobmV3VmFsdWUgPT09IG51bGwgJiYgb2xkVmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZW1pdChcImxvZ291dFwiKTtcbiAgICB9XG5cbiAgICAvLyBUaGVyZSBpcyBub3cgYSBzZXNzaW9uIHdoZW4gdGhlcmUgZGlkbid0IHVzZWQgdG8gYmUuXG4gICAgZWxzZSBpZiAob2xkVmFsdWUgPT09IG51bGwgJiYgbmV3VmFsdWUgIT09IG51bGwpIHtcbiAgICAgIHRoaXMuZW1pdChcImxvZ2luXCIpO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyBhIHNlc3Npb24gZnJvbSB0aGUgY29uZmlndXJlZCBzdG9yYWdlIGF0IHRoZSBjb25maWd1cmVkIGtleVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc3RvcmVkIGRhdGEgb3IgdW5kZWZpbmVkIGlmIG5vdCBwcmVzZW50XG4gICAqL1xuICAjbG9hZFNlc3Npb24oKTogU2Vzc2lvbkRhdGEgfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IHN0b3JlZCA9IHRoaXMuI3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLiNrZXkpO1xuICAgIGlmIChzdG9yZWQgPT09IG51bGwpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICByZXR1cm4gSlNPTi5wYXJzZShzdG9yZWQpO1xuICB9XG5cbiAgLyoqXG4gICAqIExvYWRzIHRoZSBtZXRhZGF0YSBmb3IgYSBzZXNzaW9uIGZyb20gc3RvcmFnZVxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgc2Vzc2lvbiBtZXRhZGF0YVxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxTZXNzaW9uTWV0YWRhdGE+IHtcbiAgICBjb25zdCBzZXNzID0gdGhpcy4jbG9hZFNlc3Npb24oKTtcbiAgICBpZiAoIXNlc3MpIHtcbiAgICAgIHRocm93IG5ldyBOb1Nlc3Npb25Gb3VuZEVycm9yKCk7XG4gICAgfVxuICAgIHJldHVybiBtZXRhZGF0YShzZXNzKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBMb2FkcyB0aGUgY3VycmVudCBhY2Nlc3MgdG9rZW4gZnJvbSBzdG9yYWdlXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBhY2Nlc3MgdG9rZW5cbiAgICovXG4gIGFzeW5jIHRva2VuKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3Qgc2VzcyA9IGF3YWl0IHJlYWRUZXN0QW5kU2V0PFNlc3Npb25EYXRhIHwgdW5kZWZpbmVkPih0aGlzLiNsb2NrLCB7XG4gICAgICByZWFkOiAoKSA9PiB0aGlzLiNsb2FkU2Vzc2lvbigpLFxuICAgICAgdGVzdDogKHYpID0+IHYgIT09IHVuZGVmaW5lZCAmJiBpc1N0YWxlKHYpLFxuICAgICAgc2V0OiBhc3luYyAob2xkU2Vzc2lvbjogU2Vzc2lvbkRhdGEpID0+IHtcbiAgICAgICAgaWYgKGlzUmVmcmVzaGFibGUob2xkU2Vzc2lvbikpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgY29uc3QgbmV3U2Vzc2lvbiA9IGF3YWl0IHJlZnJlc2gob2xkU2Vzc2lvbik7XG4gICAgICAgICAgICB0aGlzLiNzdG9yYWdlLnNldEl0ZW0odGhpcy4ja2V5LCBKU09OLnN0cmluZ2lmeShuZXdTZXNzaW9uKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1Y2Nlc3NmdWxseSByZWZyZXNoZWRcIik7XG4gICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJSZXNwb25zZSAmJiBlLnN0YXR1cyA9PT0gNDAzKSB7XG4gICAgICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiB0aGUgc2Vzc2lvbiBpcyBub3QgcmVmcmVzaGFibGUsIHdlIHNob3VsZCByZW1vdmUgaXRcbiAgICAgICAgICB0aGlzLiNzdG9yYWdlLnJlbW92ZUl0ZW0odGhpcy4ja2V5KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5vdGlmeSB0aGF0IHRoZSBzZXNzaW9uIGhhcyBjaGFuZ2VkXG4gICAgICAgIHRoaXMuI2VtaXRJZk5lY2Vzc2FyeShcIlwiLCB0aGlzLiNzdG9yYWdlLmdldEl0ZW0odGhpcy4ja2V5KSk7XG4gICAgICB9LFxuICAgIH0pO1xuICAgIGlmICghc2Vzcykge1xuICAgICAgdGhyb3cgbmV3IE5vU2Vzc2lvbkZvdW5kRXJyb3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlc3MudG9rZW47XG4gIH1cblxuICAvKipcbiAgICogRGlyZWN0bHkgc2V0IHRoZSBzZXNzaW9uICh1cGRhdGluZyBhbGwgY29uc3VtZXJzIG9mIHRoZSBzZXNzaW9uIHN0b3JhZ2UpXG4gICAqXG4gICAqIEBwYXJhbSBzZXNzaW9uIFRoZSBuZXcgc2Vzc2lvblxuICAgKi9cbiAgYXN5bmMgc2V0U2Vzc2lvbihzZXNzaW9uPzogU2Vzc2lvbkRhdGEpIHtcbiAgICBhd2FpdCBuYXZpZ2F0b3IubG9ja3MucmVxdWVzdChcbiAgICAgIHRoaXMuI2xvY2ssXG4gICAgICB7XG4gICAgICAgIG1vZGU6IFwiZXhjbHVzaXZlXCIsXG4gICAgICB9LFxuICAgICAgYXN5bmMgKCkgPT4ge1xuICAgICAgICBjb25zdCBvbGRWYWx1ZSA9IHRoaXMuI3N0b3JhZ2UuZ2V0SXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IHNlc3Npb24gPyBKU09OLnN0cmluZ2lmeShzZXNzaW9uKSA6IG51bGw7XG5cbiAgICAgICAgLy8gVW5saWtlIGR1cmluZyByZWZyZXNoLCB3ZSBkb24ndCBwcmVlbXB0IHRoZSByZWFkIGxvY2tzXG4gICAgICAgIC8vIGJlY2F1c2UgdGhpcyBvcGVyYXRpb24gaXMgc3luY2hyb25vdXNcbiAgICAgICAgaWYgKG5ld1ZhbHVlKSB7XG4gICAgICAgICAgdGhpcy4jc3RvcmFnZS5zZXRJdGVtKHRoaXMuI2tleSwgbmV3VmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuI3N0b3JhZ2UucmVtb3ZlSXRlbSh0aGlzLiNrZXkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gU3RvcmFnZSBldmVudHMgZG9uJ3QgZmlyZSBpZiB0aGUgc3RvcmUgb2NjdXJyZWQgb24gdGhlIHNhbWUgcGFnZSxcbiAgICAgICAgLy8gc28gd2UgaGF2ZSB0byBtYW51YWxseSBpbnZva2Ugb3VyIGVtaXQgbG9naWNcbiAgICAgICAgdGhpcy4jZW1pdElmTmVjZXNzYXJ5KG9sZFZhbHVlLCBuZXdWYWx1ZSk7XG4gICAgICB9LFxuICAgICk7XG4gIH1cbn1cbiJdfQ==