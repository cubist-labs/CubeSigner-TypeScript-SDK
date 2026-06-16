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
import { CubeSignerClient } from "./index.js";
/**
 * A representation of a contact within an org.
 */
export class Contact {
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
        __classPrivateFieldSet(this, _Contact_apiClient, client instanceof CubeSignerClient ? client.apiClient : client, "f");
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
_Contact_apiClient = new WeakMap();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGFjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb250YWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLFlBQVksQ0FBQztBQUc5Qzs7R0FFRztBQUNILE1BQU0sT0FBTyxPQUFPO0lBY2xCLHFEQUFxRDtJQUNyRCxJQUFJLEtBQUs7UUFDUCxPQUFPLHVCQUFBLElBQUksMEJBQVcsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDO0lBQzVDLENBQUM7SUFFRDs7OztPQUlHO0lBQ0gsS0FBSyxDQUFDLElBQUk7UUFDUixNQUFNLElBQUksR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztRQUNoQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUM7SUFDbkIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxLQUFLLENBQUMsT0FBTyxDQUFDLElBQVk7UUFDeEIsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUM5QixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxTQUFTO1FBQ2IsTUFBTSxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDaEMsT0FBTyxJQUFJLENBQUMsU0FBdUIsQ0FBQztJQUN0QyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILEtBQUssQ0FBQyxZQUFZLENBQUMsU0FBcUI7UUFDdEMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztJQUNuQyxDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxLQUFLLENBQUMsS0FBSztRQUNULE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO1FBQ2hDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNI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Q2xpZW50LFxuICBDdWJlU2lnbmVyUmVzcG9uc2UsXG4gIEVkaXRQb2xpY3ksXG4gIEVtcHR5LFxuICBKc29uVmFsdWUsXG4gIE1mYVJlY2VpcHRzLFxuICBVcGRhdGVDb250YWN0UmVxdWVzdCxcbn0gZnJvbSBcIi4vaW5kZXgudHNcIjtcbmltcG9ydCB7IEN1YmVTaWduZXJDbGllbnQgfSBmcm9tIFwiLi9pbmRleC50c1wiO1xuaW1wb3J0IHR5cGUgeyBDb250YWN0SW5mbywgQ29udGFjdExhYmVsIH0gZnJvbSBcIi4vc2NoZW1hX3R5cGVzLnRzXCI7XG5cbi8qKlxuICogQSByZXByZXNlbnRhdGlvbiBvZiBhIGNvbnRhY3Qgd2l0aGluIGFuIG9yZy5cbiAqL1xuZXhwb3J0IGNsYXNzIENvbnRhY3Qge1xuICAvKiogVGhlIEN1YmVTaWduZXIgaW5zdGFuY2UgdGhhdCB0aGlzIGNvbnRhY3QgaXMgYXNzb2NpYXRlZCB3aXRoICovXG4gIHJlYWRvbmx5ICNhcGlDbGllbnQ6IEFwaUNsaWVudDtcblxuICAvKiogVGhlIGlkIG9mIHRoZSBjb250YWN0OiBcIkNvbnRhY3QjXCIgZm9sbG93ZWQgYnkgYSB1bmlxdWUgaWRlbnRpZmllci4gKi9cbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcblxuICAvKipcbiAgICogR2V0IHRoZSBjYWNoZWQgcHJvcGVydGllcyBvZiB0aGlzIGNvbnRhY3QuIFRoZSBjYWNoZWQgcHJvcGVydGllcyByZWZsZWN0XG4gICAqIHRoZSBzdGF0ZSBvZiB0aGUgY29udGFjdCBhcyBvZiB0aGUgbGFzdCBmZXRjaCBvciB1cGRhdGUgKGUuZy4gdGhpcyBmaWVsZFxuICAgKiB3aWxsIGJlIHVwZGF0ZWQgYWZ0ZXIgYXdhaXRpbmcgYENvbnRhY3QudXBkYXRlTmFtZSgpYCkuXG4gICAqL1xuICBjYWNoZWQ6IENvbnRhY3RJbmZvO1xuXG4gIC8qKiBAcmV0dXJucyBUaGUgaWQgb2YgdGhlIG9yZyB0aGlzIGNvbnRhY3QgaXMgaW4uICovXG4gIGdldCBvcmdJZCgpOiBzdHJpbmcge1xuICAgIHJldHVybiB0aGlzLiNhcGlDbGllbnQuc2Vzc2lvbk1ldGEub3JnX2lkO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBuYW1lIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGxhdGVzdCBuYW1lXG4gICAqL1xuICBhc3luYyBuYW1lKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5uYW1lO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgbmFtZSBmb3IgdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuZXcgbmFtZSBmb3IgdGhlIGNvbnRhY3RcbiAgICovXG4gIGFzeW5jIHNldE5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgYXdhaXQgdGhpcy51cGRhdGUoeyBuYW1lIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBhZGRyZXNzZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjb250YWN0LlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IGFkZHJlc3Nlc1xuICAgKi9cbiAgYXN5bmMgYWRkcmVzc2VzKCk6IFByb21pc2U8QWRkcmVzc01hcD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEuYWRkcmVzc2VzIGFzIEFkZHJlc3NNYXA7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIG5ldyBzZXQgb2YgYWRkcmVzc2VzIGZvciB0aGUgY29udGFjdCAob3ZlcndyaXRpbmcgdGhlIGV4aXN0aW5nIGFkZHJlc3NlcykuXG4gICAqXG4gICAqIEBwYXJhbSBhZGRyZXNzZXMgVGhlIG5ldyBhZGRyZXNzZXMgdG8gYXNzb2NpYXRlIHdpdGggdGhlIGNvbnRhY3RcbiAgICovXG4gIGFzeW5jIHNldEFkZHJlc3NlcyhhZGRyZXNzZXM6IEFkZHJlc3NNYXApIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGFkZHJlc3NlcyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGFuZCByZXR1cm5zIHRoZSBsYXRlc3Qgb3duZXIgb2YgdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSB1c2VyIGlkIG9mIHRoZSBjb250YWN0J3Mgb3duZXJcbiAgICogQGV4YW1wbGUgVXNlciNjM2I5Mzc5Yy00ZThjLTQyMTYtYmQwYS02NWFjZTUzY2Y5OGZcbiAgICovXG4gIGFzeW5jIG93bmVyKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHRoaXMuZmV0Y2goKTtcbiAgICByZXR1cm4gZGF0YS5vd25lcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgbmV3IG93bmVyIGZvciB0aGUgY29udGFjdC4gQSBjb250YWN0IG93bmVyIGNhbm5vdCBiZSBhbiBhbGllbi5cbiAgICpcbiAgICogQHBhcmFtIG93bmVyIFRoZSBuZXcgb3duZXIgb2YgdGhlIGNvbnRhY3RcbiAgICovXG4gIGFzeW5jIHNldE93bmVyKG93bmVyOiBzdHJpbmcpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG93bmVyIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEByZXR1cm5zIFRoZSBsYXRlc3QgbGFiZWxzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY29udGFjdCwgaWYgYW55XG4gICAqL1xuICBhc3luYyBsYWJlbHMoKTogUHJvbWlzZTxDb250YWN0TGFiZWxbXSB8IHVuZGVmaW5lZD4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubGFiZWxzO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSBsYWJlbHMgVGhlIG5ldyBsYWJlbHMgdGhhdCB0aGUgY29udGFjdCBzaG91bGQgaG9sZFxuICAgKi9cbiAgYXN5bmMgc2V0TGFiZWxzKGxhYmVsczogQ29udGFjdExhYmVsW10pIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGxhYmVscyB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGZXRjaGVzIGFuZCByZXR1cm5zIHRoZSBsYXRlc3QgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBjb250YWN0LiBUaGlzIHdpbGwgYmUgbnVsbCBpZiB0aGVyZSBpcyBubyBtZXRhZGF0YSBkZWZpbmVkLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgbGF0ZXN0IG1ldGFkYXRhXG4gICAqL1xuICBhc3luYyBtZXRhZGF0YSgpOiBQcm9taXNlPEpzb25WYWx1ZT4ge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuIGRhdGEubWV0YWRhdGEgYXMgSnNvblZhbHVlO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgbWV0YWRhdGEgdmFsdWUgZm9yIHRoZSBjb250YWN0IChvdmVyd3JpdGluZyB0aGUgZXhpc3RpbmcgdmFsdWUpLlxuICAgKlxuICAgKiBAcGFyYW0gbWV0YWRhdGEgVGhlIG5ldyBtZXRhZGF0YSBmb3IgdGhlIGNvbnRhY3RcbiAgICovXG4gIGFzeW5jIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBKc29uVmFsdWUpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IG1ldGFkYXRhIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEZldGNoZXMgYW5kIHJldHVybnMgdGhlIGxhdGVzdCBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QuXG4gICAqXG4gICAqIEByZXR1cm5zIFRoZSBlZGl0IHBvbGljeSBmb3IgdGhlIGNvbnRhY3QsIG9yIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyBlZGl0IHBvbGljeVxuICAgKi9cbiAgYXN5bmMgZWRpdFBvbGljeSgpOiBQcm9taXNlPEVkaXRQb2xpY3kgfCB1bmRlZmluZWQ+IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgdGhpcy5mZXRjaCgpO1xuICAgIHJldHVybiBkYXRhLmVkaXRfcG9saWN5O1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBuZXcgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0IChvdmVyd3JpdGluZyBhbnkgZXhpc3RpbmcgcG9saWN5KS5cbiAgICogVG8gcmVzZXQgdGhlIGVkaXQgcG9saWN5LCBzZXQgaXQgdG8ge30uXG4gICAqXG4gICAqIEBwYXJhbSBlZGl0UG9saWN5IFRoZSBuZXcgZWRpdCBwb2xpY3kgZm9yIHRoZSBjb250YWN0XG4gICAqL1xuICBhc3luYyBzZXRFZGl0UG9saWN5KGVkaXRQb2xpY3k6IEVkaXRQb2xpY3kpIHtcbiAgICBhd2FpdCB0aGlzLnVwZGF0ZSh7IGVkaXRfcG9saWN5OiBlZGl0UG9saWN5IH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIERlbGV0ZSB0aGlzIGNvbnRhY3QuXG4gICAqXG4gICAqIEBwYXJhbSBtZmFSZWNlaXB0IE9wdGlvbmFsIE1GQSByZWNlaXB0KHMpXG4gICAqIEByZXR1cm5zIEEgcmVzcG9uc2Ugd2hpY2ggY2FuIGJlIHVzZWQgdG8gYXBwcm92ZSBNRkEgaWYgbmVlZGVkXG4gICAqL1xuICBhc3luYyBkZWxldGUobWZhUmVjZWlwdD86IE1mYVJlY2VpcHRzKTogUHJvbWlzZTxDdWJlU2lnbmVyUmVzcG9uc2U8RW1wdHk+PiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0RGVsZXRlKHRoaXMuaWQsIG1mYVJlY2VpcHQpO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0gSU5URVJOQUwgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQ3JlYXRlIGEgQ29udGFjdCBmcm9tIENvbnRhY3RJbmZvLlxuICAgKlxuICAgKiBAcGFyYW0gY2xpZW50IFRoZSBDdWJlU2lnbmVyIGluc3RhbmNlIHRoaXMgY29udGFjdCBpcyBhc3NvY2lhdGVkIHdpdGguXG4gICAqIEBwYXJhbSBkYXRhIFRoZSBDb250YWN0SW5mbyBvZiB0aGUgY29udGFjdC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNsaWVudDogQXBpQ2xpZW50IHwgQ3ViZVNpZ25lckNsaWVudCwgZGF0YTogQ29udGFjdEluZm8pIHtcbiAgICB0aGlzLiNhcGlDbGllbnQgPSBjbGllbnQgaW5zdGFuY2VvZiBDdWJlU2lnbmVyQ2xpZW50ID8gY2xpZW50LmFwaUNsaWVudCA6IGNsaWVudDtcbiAgICB0aGlzLmlkID0gZGF0YS5pZDtcbiAgICB0aGlzLmNhY2hlZCA9IGRhdGE7XG4gIH1cblxuICAvKipcbiAgICogRmV0Y2hlcyB0aGUgbGF0ZXN0IGNvbnRhY3QgaW5mb3JtYXRpb24gYW5kIHVwZGF0ZXMgYHRoaXMuY2FjaGVkYC5cbiAgICpcbiAgICogQHJldHVybnMgVGhlIGNvbnRhY3QgaW5mb3JtYXRpb25cbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIGZldGNoKCk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICB0aGlzLmNhY2hlZCA9IGF3YWl0IHRoaXMuI2FwaUNsaWVudC5jb250YWN0R2V0KHRoaXMuaWQpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlZDtcbiAgfVxuXG4gIC8qKlxuICAgKiBVcGRhdGVzIHRoZSBjb250YWN0IGFuZCB1cGRhdGVzIGB0aGlzLmNhY2hlZGAgdG8gdGhlIGxhdGVzdCBjb250YWN0IHN0YXRlLlxuICAgKlxuICAgKiBAcGFyYW0gcmVxdWVzdCBUaGUgcGFyYW1ldGVycyB0byB1cGRhdGVcbiAgICogQHBhcmFtIG1mYVJlY2VpcHQgT3B0aW9uYWwgTUZBIHJlY2VpcHQocylcbiAgICogQHJldHVybnMgVGhlIG5ldyBjb250YWN0IGFmdGVyIHRoZSB1cGRhdGVcbiAgICogQGludGVybmFsXG4gICAqL1xuICBwcml2YXRlIGFzeW5jIHVwZGF0ZShcbiAgICByZXF1ZXN0OiBVcGRhdGVDb250YWN0UmVxdWVzdCxcbiAgICBtZmFSZWNlaXB0PzogTWZhUmVjZWlwdHMsXG4gICk6IFByb21pc2U8Q29udGFjdEluZm8+IHtcbiAgICBjb25zdCByZXNwID0gYXdhaXQgdGhpcy4jYXBpQ2xpZW50LmNvbnRhY3RVcGRhdGUodGhpcy5pZCwgcmVxdWVzdCwgbWZhUmVjZWlwdCk7XG4gICAgaWYgKHJlc3AucmVxdWlyZXNNZmEoKSkge1xuICAgICAgdGhyb3cgcmVzcDtcbiAgICB9XG4gICAgdGhpcy5jYWNoZWQgPSByZXNwLmRhdGEoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZWQ7XG4gIH1cbn1cbiJdfQ==