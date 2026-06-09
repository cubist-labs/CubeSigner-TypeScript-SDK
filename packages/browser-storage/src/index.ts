import type { SessionData, SessionManager, SessionMetadata } from "@cubist-labs/cubesigner-sdk";
import {
  EventEmitter,
  NoSessionFoundError,
  isStale,
  isRefreshable,
  metadata,
  refresh,
  ErrResponse,
} from "@cubist-labs/cubesigner-sdk";
import { readTestAndSet } from "./locks";

type BrowserStorageEvents = {
  logout(): void;
  login(): void;
};

/**
 * A manager that persists into browser storage and uses weblocks to safely perform refreshes
 */
export class BrowserStorageManager
  extends EventEmitter<BrowserStorageEvents>
  implements SessionManager
{
  /** The storage key for the session data */
  #key: string;
  #storage: Storage;
  #lock: string;

  /**
   *
   * @param key The storage key to use
   * @param storage The storage object to use (defaults to localStorage)
   */
  constructor(key: string, storage: Storage = globalThis.localStorage) {
    super();
    this.#key = key;
    this.#storage = storage;
    this.#lock = `CS_SDK_STORAGE_LOCK_${key}`;
    // Set up listeners to emit events when users log in or log out
    window.addEventListener("storage", (ev) => {
      // We only care about events on our storage object, using our key
      if (ev.storageArea !== storage || ev.key !== key) return;
      this.#emitIfNecessary(ev.oldValue, ev.newValue);
    });
  }

  /**
   * Emits a `login` or `logout` event if necessary
   *
   * @param oldValue The previously stored value
   * @param newValue The newly stored value
   */
  #emitIfNecessary(oldValue: null | string, newValue: string | null) {
    if (newValue === null && oldValue !== null) {
      this.emit("logout");
    }

    // There is now a session when there didn't used to be.
    else if (oldValue === null && newValue !== null) {
      this.emit("login");
    }
  }

  /**
   * Loads a session from the configured storage at the configured key
   *
   * @returns The stored data or undefined if not present
   */
  #loadSession(): SessionData | undefined {
    const stored = this.#storage.getItem(this.#key);
    if (stored === null) {
      return;
    }

    return JSON.parse(stored);
  }

  /**
   * Loads the metadata for a session from storage
   *
   * @returns The session metadata
   */
  async metadata(): Promise<SessionMetadata> {
    const sess = this.#loadSession();
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
  async token(): Promise<string> {
    const sess = await readTestAndSet<SessionData | undefined>(this.#lock, {
      read: () => this.#loadSession(),
      test: (v) => v !== undefined && isStale(v),
      set: async (oldSession: SessionData) => {
        if (isRefreshable(oldSession)) {
          try {
            const newSession = await refresh(oldSession);
            this.#storage.setItem(this.#key, JSON.stringify(newSession));
            console.log("Successfully refreshed");
          } catch (e) {
            if (e instanceof ErrResponse && e.status === 403) {
              this.#storage.removeItem(this.#key);
            }
          }
        } else {
          // If the session is not refreshable, we should remove it
          this.#storage.removeItem(this.#key);
        }

        // Notify that the session has changed
        this.#emitIfNecessary("", this.#storage.getItem(this.#key));
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
  async setSession(session?: SessionData) {
    await navigator.locks.request(
      this.#lock,
      {
        mode: "exclusive",
      },
      async () => {
        const oldValue = this.#storage.getItem(this.#key);
        const newValue = session ? JSON.stringify(session) : null;

        // Unlike during refresh, we don't preempt the read locks
        // because this operation is synchronous
        if (newValue) {
          this.#storage.setItem(this.#key, newValue);
        } else {
          this.#storage.removeItem(this.#key);
        }

        // Storage events don't fire if the store occurred on the same page,
        // so we have to manually invoke our emit logic
        this.#emitIfNecessary(oldValue, newValue);
      },
    );
  }
}
