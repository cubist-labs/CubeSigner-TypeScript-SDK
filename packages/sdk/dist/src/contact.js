"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _Contact_apiClient;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Contact = void 0;
const _1 = require(".");
/**
 * A representation of a contact within an org.
 */
class Contact {
    /** @returns The id of the org this contact is in. */
    get orgId() {
        return __classPrivateFieldGet(this, _Contact_apiClient, "f").sessionMeta.org_id;
    }
    /**
     * Fetches and returns the latest name associated with the contact.
     *
     * @returns The latest name
     */
    async name() {
        const data = await this.fetch();
        return data.name;
    }
    /**
     * Sets a new name for the contact.
     *
     * @param name The new name for the contact
     */
    async setName(name) {
        await this.update({ name });
    }
    /**
     * Fetches and returns the latest addresses associated with the contact.
     *
     * @returns The latest addresses
     */
    async addresses() {
        const data = await this.fetch();
        return data.addresses;
    }
    /**
     * Sets a new set of addresses for the contact (overwriting the existing addresses).
     *
     * @param addresses The new addresses to associate with the contact
     */
    async setAddresses(addresses) {
        await this.update({ addresses });
    }
    /**
     * Fetches and returns the latest owner of the contact.
     *
     * @returns The user id of the contact's owner
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    async owner() {
        const data = await this.fetch();
        return data.owner;
    }
    /**
     * Sets a new owner for the contact. A contact owner cannot be an alien.
     *
     * @param owner The new owner of the contact
     */
    async setOwner(owner) {
        await this.update({ owner });
    }
    /**
     * @returns The latest labels associated with the contact, if any
     */
    async labels() {
        const data = await this.fetch();
        return data.labels;
    }
    /**
     * @param labels The new labels that the contact should hold
     */
    async setLabels(labels) {
        await this.update({ labels });
    }
    /**
     * Fetches and returns the latest metadata value for the contact. This will be null if there is no metadata defined.
     *
     * @returns The latest metadata
     */
    async metadata() {
        const data = await this.fetch();
        return data.metadata;
    }
    /**
     * Sets a new metadata value for the contact (overwriting the existing value).
     *
     * @param metadata The new metadata for the contact
     */
    async setMetadata(metadata) {
        await this.update({ metadata });
    }
    /**
     * Fetches and returns the latest edit policy for the contact.
     *
     * @returns The edit policy for the contact, or undefined if there is no edit policy
     */
    async editPolicy() {
        const data = await this.fetch();
        return data.edit_policy;
    }
    /**
     * Sets a new edit policy for the contact (overwriting any existing policy).
     * To reset the edit policy, set it to {}.
     *
     * @param editPolicy The new edit policy for the contact
     */
    async setEditPolicy(editPolicy) {
        await this.update({ edit_policy: editPolicy });
    }
    /**
     * Delete this contact.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    async delete(mfaReceipt) {
        return await __classPrivateFieldGet(this, _Contact_apiClient, "f").contactDelete(this.id, mfaReceipt);
    }
    // --------------------------------------------------------------------------
    // -- INTERNAL --------------------------------------------------------------
    // --------------------------------------------------------------------------
    /**
     * Create a Contact from ContactInfo.
     *
     * @param client The CubeSigner instance this contact is associated with.
     * @param data The ContactInfo of the contact.
     */
    constructor(client, data) {
        /** The CubeSigner instance that this contact is associated with */
        _Contact_apiClient.set(this, void 0);
        __classPrivateFieldSet(this, _Contact_apiClient, client instanceof _1.CubeSignerClient ? client.apiClient : client, "f");
        this.id = data.id;
        this.cached = data;
    }
    /**
     * Fetches the latest contact information and updates `this.cached`.
     *
     * @returns The contact information
     * @internal
     */
    async fetch() {
        this.cached = await __classPrivateFieldGet(this, _Contact_apiClient, "f").contactGet(this.id);
        return this.cached;
    }
    /**
     * Updates the contact and updates `this.cached` to the latest contact state.
     *
     * @param request The parameters to update
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The new contact after the update
     * @internal
     */
    async update(request, mfaReceipt) {
        const resp = await __classPrivateFieldGet(this, _Contact_apiClient, "f").contactUpdate(this.id, request, mfaReceipt);
        if (resp.requiresMfa()) {
            throw resp;
        }
        this.cached = resp.data();
        return this.cached;
    }
}
exports.Contact = Contact;
_Contact_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQVVBLHdCQUFxQztBQUdyQzs7R0FFRztBQUNILE1BQWEsT0FBTztJQWNsQixxREFBcUQ7SUFDckQsSUFBSSxLQUFLO1FBQ1AsT0FBTyx1QkFBQSxJQUFJLDBCQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZO1FBQ3hCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFNBQXVCLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQXFCO1FBQ3RDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQWE7UUFDMUIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsTUFBTTtRQUNWLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQ7O09BRUc7SUFDSCxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQXNCO1FBQ3BDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDaEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsUUFBUTtRQUNaLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFFBQXFCLENBQUM7SUFDcEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsV0FBVyxDQUFDLFFBQW1CO1FBQ25DLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7SUFDbEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsVUFBVTtRQUNkLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztJQUMxQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQXNCO1FBQ3hDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO0lBQ2pELENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxNQUFNLENBQUMsVUFBd0I7UUFDbkMsT0FBTyxNQUFNLHVCQUFBLElBQUksMEJBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUNsRSxDQUFDO0lBRUQsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUM3RSw2RUFBNkU7SUFFN0U7Ozs7O09BS0c7SUFDSCxZQUFZLE1BQW9DLEVBQUUsSUFBaUI7UUF0Sm5FLG1FQUFtRTtRQUMxRCxxQ0FBc0I7UUFzSjdCLHVCQUFBLElBQUksc0JBQWMsTUFBTSxZQUFZLG1CQUFnQixDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLE1BQUEsQ0FBQztRQUNqRixJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDbEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0ssS0FBSyxDQUFDLEtBQUs7UUFDakIsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLHVCQUFBLElBQUksMEJBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3hELE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNLLEtBQUssQ0FBQyxNQUFNLENBQ2xCLE9BQTZCLEVBQzdCLFVBQXdCO1FBRXhCLE1BQU0sSUFBSSxHQUFHLE1BQU0sdUJBQUEsSUFBSSwwQkFBVyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUMvRSxJQUFJLElBQUksQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1lBQ3ZCLE1BQU0sSUFBSSxDQUFDO1FBQ2IsQ0FBQztRQUNELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1FBQzFCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUEzTEQsMEJBMkxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHR5cGUge1xuICBBZGRyZXNzTWFwLFxuICBBcGlDbGllbnQsXG4gIEN1YmVTaWduZXJSZXNwb25zZSxcbiAgRWRpdFBvbGljeSxcbiAgRW1wdHksXG4gIEpzb25WYWx1ZSxcbiAgTWZhUmVjZWlwdHMsXG4gIFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxufSBmcm9tIFwiLlwiO1xuaW1wb3J0IHsgQ3ViZVNpZ25lckNsaWVudCB9IGZyb20gXCIuXCI7XG5pbXBvcnQgdHlwZSB7IENvbnRhY3RJbmZvLCBDb250YWN0TGFiZWwgfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgY29udGFjdCB3aXRoaW4gYW4gb3JnLlxuICovXG5leHBvcnQgY2xhc3MgQ29udGFjdCB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMgY29udGFjdCBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKiBUaGUgaWQgb2YgdGhlIGNvbnRhY3Q6IFwiQ29udGFjdCNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyLiAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgY29udGFjdC4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3RcbiAgICogdGhlIHN0YXRlIG9mIHRoZSBjb250YWN0IGFzIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiB0aGlzIGZpZWxkXG4gICAqIHdpbGwgYmUgdXBkYXRlZCBhZnRlciBhd2FpdGluZyBgQ29udGFjdC51cGRhdGVOYW1lKClgKS5cbiAgICovXG4gIGNhY2hlZDogQ29udGFjdEluZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBpZCBvZiB0aGUgb3JnIHRoaXMgY29udGFjdCBpcyBpbi4gKi9cbiAgZ2V0IG9yZ0lkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IG5hbWVcbiAgICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBuYW1lIGZvciB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5ldyBuYW1lIGZvciB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5hbWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgYWRkcmVzc2VzXG4gICAqL1xuICBhc3luYyBhZGRyZXNzZXMoKTogUHJvbWlzZTxBZGRyZXNzTWFwPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hZGRyZXNzZXMgYXMgQWRkcmVzc01hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IHNldCBvZiBhZGRyZXNzZXMgZm9yIHRoZSBjb250YWN0IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgYWRkcmVzc2VzKS5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBUaGUgbmV3IGFkZHJlc3NlcyB0byBhc3NvY2lhdGUgd2l0aCB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0QWRkcmVzc2VzKGFkZHJlc3NlczogQWRkcmVzc01hcCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgYWRkcmVzc2VzIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBvd25lciBvZiB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgb2YgdGhlIGNvbnRhY3QncyBvd25lclxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgb3duZXIgZm9yIHRoZSBjb250YWN0LiBBIGNvbnRhY3Qgb3duZXIgY2Fubm90IGJlIGFuIGFsaWVuLlxuICAgKlxuICAgKiBAcGFyYW0gb3duZXIgVGhlIG5ldyBvd25lciBvZiB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHJldHVybnMgVGhlIGxhdGVzdCBsYWJlbHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LCBpZiBhbnlcbiAgICovXG4gIGFzeW5jIGxhYmVscygpOiBQcm9taXNlPENvbnRhY3RMYWJlbFtdIHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5sYWJlbHM7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIGxhYmVscyBUaGUgbmV3IGxhYmVscyB0aGF0IHRoZSBjb250YWN0IHNob3VsZCBob2xkXG4gICAqL1xuICBhc3luYyBzZXRMYWJlbHMobGFiZWxzOiBDb250YWN0TGFiZWxbXSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbGFiZWxzIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIGNvbnRhY3QuIFRoaXMgd2lsbCBiZSBudWxsIGlmIHRoZXJlIGlzIG5vIG1ldGFkYXRhIGRlZmluZWQuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgbWV0YWRhdGFcbiAgICovXG4gIGFzeW5jIG1ldGFkYXRhKCk6IFByb21pc2U8SnNvblZhbHVlPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5tZXRhZGF0YSBhcyBKc29uVmFsdWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBtZXRhZGF0YSB2YWx1ZSBmb3IgdGhlIGNvbnRhY3QgKG92ZXJ3cml0aW5nIHRoZSBleGlzdGluZyB2YWx1ZSkuXG4gICAqXG4gICAqIEBwYXJhbSBtZXRhZGF0YSBUaGUgbmV3IG1ldGFkYXRhIGZvciB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0TWV0YWRhdGEobWV0YWRhdGE6IEpzb25WYWx1ZSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgbWV0YWRhdGEgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCwgb3IgdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIGVkaXQgcG9saWN5XG4gICAqL1xuICBhc3luYyBlZGl0UG9saWN5KCk6IFByb21pc2U8RWRpdFBvbGljeSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuZWRpdF9wb2xpY3k7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QgKG92ZXJ3cml0aW5nIGFueSBleGlzdGluZyBwb2xpY3kpLlxuICAgKiBUbyByZXNldCB0aGUgZWRpdCBwb2xpY3ksIHNldCBpdCB0byB7fS5cbiAgICpcbiAgICogQHBhcmFtIGVkaXRQb2xpY3kgVGhlIG5ldyBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3RcbiAgICovXG4gIGFzeW5jIHNldEVkaXRQb2xpY3koZWRpdFBvbGljeTogRWRpdFBvbGljeSkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgZWRpdF9wb2xpY3k6IGVkaXRQb2xpY3kgfSk7XG4gIH1cblxuICAvKipcbiAgICogRGVsZXRlIHRoaXMgY29udGFjdC5cbiAgICpcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgQSByZXNwb25zZSB3aGljaCBjYW4gYmUgdXNlZCB0byBhcHByb3ZlIE1GQSBpZiBuZWVkZWRcbiAgICovXG4gIGFzeW5jIGRlbGV0ZShtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMpOiBQcm9taXNlPEN1YmVTaWduZXJSZXNwb25zZTxFbXB0eT4+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3REZWxldGUodGhpcy5pZCwgbWZhUmVjZWlwdCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLSBJTlRFUk5BTCAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBDb250YWN0IGZyb20gQ29udGFjdEluZm8uXG4gICAqXG4gICAqIEBwYXJhbSBjbGllbnQgVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhpcyBjb250YWN0IGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAgICogQHBhcmFtIGRhdGEgVGhlIENvbnRhY3RJbmZvIG9mIHRoZSBjb250YWN0LlxuICAgKi9cbiAgY29uc3RydWN0b3IoY2xpZW50OiBBcGlDbGllbnQgfCBDdWJlU2lnbmVyQ2xpZW50LCBkYXRhOiBDb250YWN0SW5mbykge1xuICAgIHRoaXMuI2FwaUNsaWVudCA9IGNsaWVudCBpbnN0YW5jZW9mIEN1YmVTaWduZXJDbGllbnQgPyBjbGllbnQuYXBpQ2xpZW50IDogY2xpZW50O1xuICAgIHRoaXMuaWQgPSBkYXRhLmlkO1xuICAgIHRoaXMuY2FjaGVkID0gZGF0YTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIHRoZSBsYXRlc3QgY29udGFjdCBpbmZvcm1hdGlvbiBhbmQgdXBkYXRlcyBgdGhpcy5jYWNoZWRgLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgY29udGFjdCBpbmZvcm1hdGlvblxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgZmV0Y2goKTogUHJvbWlzZTxDb250YWN0SW5mbz4ge1xuICAgIHRoaXMuY2FjaGVkID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RHZXQodGhpcy5pZCk7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVkO1xuICB9XG5cbiAgLyoqXG4gICAqIFVwZGF0ZXMgdGhlIGNvbnRhY3QgYW5kIHVwZGF0ZXMgYHRoaXMuY2FjaGVkYCB0byB0aGUgbGF0ZXN0IGNvbnRhY3Qgc3RhdGUuXG4gICAqXG4gICAqIEBwYXJhbSByZXF1ZXN0IFRoZSBwYXJhbWV0ZXJzIHRvIHVwZGF0ZVxuICAgKiBAcGFyYW0gbWZhUmVjZWlwdCBPcHRpb25hbCBNRkEgcmVjZWlwdChzKVxuICAgKiBAcmV0dXJucyBUaGUgbmV3IGNvbnRhY3QgYWZ0ZXIgdGhlIHVwZGF0ZVxuICAgKiBAaW50ZXJuYWxcbiAgICovXG4gIHByaXZhdGUgYXN5bmMgdXBkYXRlKFxuICAgIHJlcXVlc3Q6IFVwZGF0ZUNvbnRhY3RSZXF1ZXN0LFxuICAgIG1mYVJlY2VpcHQ/OiBNZmFSZWNlaXB0cyxcbiAgKTogUHJvbWlzZTxDb250YWN0SW5mbz4ge1xuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCB0aGlzLiNhcGlDbGllbnQuY29udGFjdFVwZGF0ZSh0aGlzLmlkLCByZXF1ZXN0LCBtZmFSZWNlaXB0KTtcbiAgICBpZiAocmVzcC5yZXF1aXJlc01mYSgpKSB7XG4gICAgICB0aHJvdyByZXNwO1xuICAgIH1cbiAgICB0aGlzLmNhY2hlZCA9IHJlc3AuZGF0YSgpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlZDtcbiAgfVxufVxuIl19