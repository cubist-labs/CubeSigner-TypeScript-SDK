/** Used to declare the type of an event emitter. See {@link EventEmitter} */
export type EventMap = {
    [key: string]: (...args: never[]) => void;
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
export declare class EventEmitter<Events extends EventMap> {
    #private;
    /**
     * Add a listener for an event (the same listener cannot be registered twice)
     *
     * @param event The event to listen to
     * @param listener The function to be invoked on that event
     * @returns This EventEmitter with the new event listener
     */
    addEventListener<E extends keyof Events & string>(event: E, listener: Events[E]): this;
    /**
     * Remove a listener for an event
     *
     * @param event The event to remove the listener from
     * @param listener The listener to be removed
     * @returns This EventEmitter with the event listener removed
     */
    removeEventListener<E extends keyof Events & string>(event: E, listener: Events[E]): this;
    /**
     * Emit an event, invoking all the listeners
     *
     * @param event The event to invoke
     * @param args The associated event data
     */
    emit<E extends keyof Events & string>(event: E, ...args: Parameters<Events[E]>): void;
}
//# sourceMappingURL=events.d.ts.map