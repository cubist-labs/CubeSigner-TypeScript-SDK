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
     */
    async delete() {
        await __classPrivateFieldGet(this, _Contact_apiClient, "f").contactDelete(this.id);
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
     * @returns The new contact after the update
     * @internal
     */
    async update(request) {
        this.cached = await __classPrivateFieldGet(this, _Contact_apiClient, "f").contactUpdate(this.id, request);
        return this.cached;
    }
}
exports.Contact = Contact;
_Contact_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHdCQUFxQztBQUdyQzs7R0FFRztBQUNILE1BQWEsT0FBTztJQWNsQixxREFBcUQ7SUFDckQsSUFBSSxLQUFLO1FBQ1AsT0FBTyx1QkFBQSxJQUFJLDBCQUFXLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQztJQUM1QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxJQUFJO1FBQ1IsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFZO1FBQ3hCLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsU0FBUztRQUNiLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLFNBQXVCLENBQUM7SUFDdEMsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsWUFBWSxDQUFDLFNBQXFCO1FBQ3RDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0gsS0FBSyxDQUFDLEtBQUs7UUFDVCxNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQWE7UUFDMUIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUMvQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxRQUFRO1FBQ1osTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsUUFBcUIsQ0FBQztJQUNwQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxXQUFXLENBQUMsUUFBbUI7UUFDbkMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztJQUNsQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxVQUFVO1FBQ2QsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzFCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBc0I7UUFDeEMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7SUFDakQsQ0FBQztJQUVEOztPQUVHO0lBQ0gsS0FBSyxDQUFDLE1BQU07UUFDVixNQUFNLHVCQUFBLElBQUksMEJBQVcsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQy9DLENBQUM7SUFFRCw2RUFBNkU7SUFDN0UsNkVBQTZFO0lBQzdFLDZFQUE2RTtJQUU3RTs7Ozs7T0FLRztJQUNILFlBQVksTUFBb0MsRUFBRSxJQUFpQjtRQXBJbkUsbUVBQW1FO1FBQzFELHFDQUFzQjtRQW9JN0IsdUJBQUEsSUFBSSxzQkFBYyxNQUFNLFlBQVksbUJBQWdCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sTUFBQSxDQUFDO1FBQ2pGLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNsQixJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztJQUNyQixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSyxLQUFLLENBQUMsS0FBSztRQUNqQixJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sdUJBQUEsSUFBSSwwQkFBVyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDeEQsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSyxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQTZCO1FBQ2hELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSx1QkFBQSxJQUFJLDBCQUFXLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEUsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3JCLENBQUM7Q0FDRjtBQWpLRCwwQkFpS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgdHlwZSB7IEFkZHJlc3NNYXAsIEFwaUNsaWVudCwgRWRpdFBvbGljeSwgSnNvblZhbHVlLCBVcGRhdGVDb250YWN0UmVxdWVzdCB9IGZyb20gXCIuXCI7XG5pbXBvcnQgeyBDdWJlU2lnbmVyQ2xpZW50IH0gZnJvbSBcIi5cIjtcbmltcG9ydCB0eXBlIHsgQ29udGFjdEluZm8gfSBmcm9tIFwiLi9zY2hlbWFfdHlwZXNcIjtcblxuLyoqXG4gKiBBIHJlcHJlc2VudGF0aW9uIG9mIGEgY29udGFjdCB3aXRoaW4gYW4gb3JnLlxuICovXG5leHBvcnQgY2xhc3MgQ29udGFjdCB7XG4gIC8qKiBUaGUgQ3ViZVNpZ25lciBpbnN0YW5jZSB0aGF0IHRoaXMgY29udGFjdCBpcyBhc3NvY2lhdGVkIHdpdGggKi9cbiAgcmVhZG9ubHkgI2FwaUNsaWVudDogQXBpQ2xpZW50O1xuXG4gIC8qKiBUaGUgaWQgb2YgdGhlIGNvbnRhY3Q6IFwiQ29udGFjdCNcIiBmb2xsb3dlZCBieSBhIHVuaXF1ZSBpZGVudGlmaWVyLiAqL1xuICByZWFkb25seSBpZDogc3RyaW5nO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGNhY2hlZCBwcm9wZXJ0aWVzIG9mIHRoaXMgY29udGFjdC4gVGhlIGNhY2hlZCBwcm9wZXJ0aWVzIHJlZmxlY3RcbiAgICogdGhlIHN0YXRlIG9mIHRoZSBjb250YWN0IGFzIG9mIHRoZSBsYXN0IGZldGNoIG9yIHVwZGF0ZSAoZS5nLiB0aGlzIGZpZWxkXG4gICAqIHdpbGwgYmUgdXBkYXRlZCBhZnRlciBhd2FpdGluZyBgQ29udGFjdC51cGRhdGVOYW1lKClgKS5cbiAgICovXG4gIGNhY2hlZDogQ29udGFjdEluZm87XG5cbiAgLyoqIEByZXR1cm5zIFRoZSBpZCBvZiB0aGUgb3JnIHRoaXMgY29udGFjdCBpcyBpbi4gKi9cbiAgZ2V0IG9yZ0lkKCk6IHN0cmluZyB7XG4gICAgcmV0dXJuIHRoaXMuI2FwaUNsaWVudC5zZXNzaW9uTWV0YS5vcmdfaWQ7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IG5hbWUgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IG5hbWVcbiAgICovXG4gIGFzeW5jIG5hbWUoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm5hbWU7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBuYW1lIGZvciB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5ldyBuYW1lIGZvciB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0TmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG5hbWUgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IGFkZHJlc3NlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgYWRkcmVzc2VzXG4gICAqL1xuICBhc3luYyBhZGRyZXNzZXMoKTogUHJvbWlzZTxBZGRyZXNzTWFwPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5hZGRyZXNzZXMgYXMgQWRkcmVzc01hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IHNldCBvZiBhZGRyZXNzZXMgZm9yIHRoZSBjb250YWN0IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgYWRkcmVzc2VzKS5cbiAgICpcbiAgICogQHBhcmFtIGFkZHJlc3NlcyBUaGUgbmV3IGFkZHJlc3NlcyB0byBhc3NvY2lhdGUgd2l0aCB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0QWRkcmVzc2VzKGFkZHJlc3NlczogQWRkcmVzc01hcCkge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgYWRkcmVzc2VzIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBvd25lciBvZiB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIHVzZXIgaWQgb2YgdGhlIGNvbnRhY3QncyBvd25lclxuICAgKiBAZXhhbXBsZSBVc2VyI2MzYjkzNzljLTRlOGMtNDIxNi1iZDBhLTY1YWNlNTNjZjk4ZlxuICAgKi9cbiAgYXN5bmMgb3duZXIoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm93bmVyO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgb3duZXIgZm9yIHRoZSBjb250YWN0LiBBIGNvbnRhY3Qgb3duZXIgY2Fubm90IGJlIGFuIGFsaWVuLlxuICAgKlxuICAgKiBAcGFyYW0gb3duZXIgVGhlIG5ldyBvd25lciBvZiB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0T3duZXIob3duZXI6IHN0cmluZykge1xuICAgIGF3YWl0IHRoaXMudXBkYXRlKHsgb3duZXIgfSk7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyBhbmQgcmV0dXJucyB0aGUgbGF0ZXN0IG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgY29udGFjdC4gVGhpcyB3aWxsIGJlIG51bGwgaWYgdGhlcmUgaXMgbm8gbWV0YWRhdGEgZGVmaW5lZC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxhdGVzdCBtZXRhZGF0YVxuICAgKi9cbiAgYXN5bmMgbWV0YWRhdGEoKTogUHJvbWlzZTxKc29uVmFsdWU+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLm1ldGFkYXRhIGFzIEpzb25WYWx1ZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IG1ldGFkYXRhIHZhbHVlIGZvciB0aGUgY29udGFjdCAob3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIHZhbHVlKS5cbiAgICpcbiAgICogQHBhcmFtIG1ldGFkYXRhIFRoZSBuZXcgbWV0YWRhdGEgZm9yIHRoZSBjb250YWN0XG4gICAqL1xuICBhc3luYyBzZXRNZXRhZGF0YShtZXRhZGF0YTogSnNvblZhbHVlKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBtZXRhZGF0YSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGFuZCByZXR1cm5zIHRoZSBsYXRlc3QgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0LCBvciB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gZWRpdCBwb2xpY3lcbiAgICovXG4gIGFzeW5jIGVkaXRQb2xpY3koKTogUHJvbWlzZTxFZGl0UG9saWN5IHwgdW5kZWZpbmVkPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5lZGl0X3BvbGljeTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdCAob3ZlcndyaXRpbmcgYW55IGV4aXN0aW5nIHBvbGljeSkuXG4gICAqIFRvIHJlc2V0IHRoZSBlZGl0IHBvbGljeSwgc2V0IGl0IHRvIHt9LlxuICAgKlxuICAgKiBAcGFyYW0gZWRpdFBvbGljeSBUaGUgbmV3IGVkaXQgcG9saWN5IGZvciB0aGUgY29udGFjdFxuICAgKi9cbiAgYXN5bmMgc2V0RWRpdFBvbGljeShlZGl0UG9saWN5OiBFZGl0UG9saWN5KSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBlZGl0X3BvbGljeTogZWRpdFBvbGljeSB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBEZWxldGUgdGhpcyBjb250YWN0LlxuICAgKi9cbiAgYXN5bmMgZGVsZXRlKCkge1xuICAgIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0RGVsZXRlKHRoaXMuaWQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgQ29udGFjdCBmcm9tIENvbnRhY3RJbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoaXMgY29udGFjdCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBDb250YWN0SW5mbyBvZiB0aGUgY29udGFjdC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNsaWVudDogQXBpQ2xpZW50IHwgQ3ViZVNpZ25lckNsaWVudCwgZGF0YTogQ29udGFjdEluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBjbGllbnQgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY2xpZW50LmFwaUNsaWVudCA6IGNsaWVudDtcbiAgICB0aGlzLmlkID0gZGF0YS5pZDtcbiAgICB0aGlzLmNhY2hlZCA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgbGF0ZXN0IGNvbnRhY3QgaW5mb3JtYXRpb24gYW5kIHVwZGF0ZXMgYHRoaXMuY2FjaGVkYC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbnRhY3QgaW5mb3JtYXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICB0aGlzLmNhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0R2V0KHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb250YWN0IGFuZCB1cGRhdGVzIGB0aGlzLmNhY2hlZGAgdG8gdGhlIGxhdGVzdCBjb250YWN0IHN0YXRlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgcGFyYW1ldGVycyB0byB1cGRhdGVcbiAgICogQHJldHVybnMgVGhlIG5ldyBjb250YWN0IGFmdGVyIHRoZSB1cGRhdGVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShyZXF1ZXN0OiBVcGRhdGVDb250YWN0UmVxdWVzdCk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICB0aGlzLmNhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0VXBkYXRlKHRoaXMuaWQsIHJlcXVlc3QpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlZDtcbiAgfVxufVxuIl19