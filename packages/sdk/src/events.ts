/** Used to declare the type of an event emitter. See {@link EventEmitter} */
export type EventMap = {
  [key: string]: (...args: never[]) => void;
};

/** The type of the internal storage of listeners */
type ListenerMap<T> = {
  [K in keyof T]?: Set<T[K]>;
};

/**
 * Type-safe event emitter.
 *
 * Use it like this:
 *
 * ```typescript
 * type MyEvents = {
 *   error: (error: Error) => void;
 *   message: (from: string, content: string) => void;
 * }
 *
 * const myEmitter = new EventEmitter<MyEvents>();
 *
 * myEmitter.emit("error", "x")  // <- Will catch this type error;
 * ```
 */
export class EventEmitter<Events extends EventMap> {
  /** The store of currently registered listeners */
  #listeners: ListenerMap<Events> = {};

  /**
   * Get the set of listeners for a given event (constructing the Set if necessary)
   *
   * @param event The event to get the listeners for
   * @returns The listeners for the given event
   */
  #getOrInitListeners<E extends keyof Events & string>(event: E): Set<Events[E]> {
    return this.#listeners[event] ?? (this.#listeners[event] = new Set());
  }

  /**
   * Add a listener for an event (the same listener cannot be registered twice)
   *
   * @param event The event to listen to
   * @param listener The function to be invoked on that event
   * @returns This EventEmitter with the new event listener
   */
  addEventListener<E extends keyof Events & string>(event: E, listener: Events[E]): this {
    this.#getOrInitListeners(event).add(listener);
    return this;
  }

  /**
   * Remove a listener for an event
   *
   * @param event The event to remove the listener from
   * @param listener The listener to be removed
   * @returns This EventEmitter with the event listener removed
   */
  removeEventListener<E extends keyof Events & string>(event: E, listener: Events[E]): this {
    this.#getOrInitListeners(event).delete(listener);
    return this;
  }

  /**
   * Emit an event, invoking all the listeners
   *
   * @param event The event to invoke
   * @param args The associated event data
   */
  emit<E extends keyof Events & string>(event: E, ...args: Parameters<Events[E]>): void {
    for (const listener of this.#getOrInitListeners(event)) {
      listener(...args);
    }
  }
}
