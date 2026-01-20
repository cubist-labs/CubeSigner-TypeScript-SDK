import type { AddressMap, ApiClient, CubeSignerResponse, EditPolicy, Empty, JsonValue, MfaReceipts } from ".";
import { CubeSignerClient } from ".";
import type { ContactInfo } from "./schema_types";
/**
 * A representation of a contact within an org.
 */
export declare class Contact {
    #private;
    /** The id of the contact: "Contact#" followed by a unique identifier. */
    readonly id: string;
    /**
     * Get the cached properties of this contact. The cached properties reflect
     * the state of the contact as of the last fetch or update (e.g. this field
     * will be updated after awaiting `Contact.updateName()`).
     */
    cached: ContactInfo;
    /** @returns The id of the org this contact is in. */
    get orgId(): string;
    /**
     * Fetches and returns the latest name associated with the contact.
     *
     * @returns The latest name
     */
    name(): Promise<string>;
    /**
     * Sets a new name for the contact.
     *
     * @param name The new name for the contact
     */
    setName(name: string): Promise<void>;
    /**
     * Fetches and returns the latest addresses associated with the contact.
     *
     * @returns The latest addresses
     */
    addresses(): Promise<AddressMap>;
    /**
     * Sets a new set of addresses for the contact (overwriting the existing addresses).
     *
     * @param addresses The new addresses to associate with the contact
     */
    setAddresses(addresses: AddressMap): Promise<void>;
    /**
     * Fetches and returns the latest owner of the contact.
     *
     * @returns The user id of the contact's owner
     * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
     */
    owner(): Promise<string>;
    /**
     * Sets a new owner for the contact. A contact owner cannot be an alien.
     *
     * @param owner The new owner of the contact
     */
    setOwner(owner: string): Promise<void>;
    /**
     * Fetches and returns the latest metadata value for the contact. This will be null if there is no metadata defined.
     *
     * @returns The latest metadata
     */
    metadata(): Promise<JsonValue>;
    /**
     * Sets a new metadata value for the contact (overwriting the existing value).
     *
     * @param metadata The new metadata for the contact
     */
    setMetadata(metadata: JsonValue): Promise<void>;
    /**
     * Fetches and returns the latest edit policy for the contact.
     *
     * @returns The edit policy for the contact, or undefined if there is no edit policy
     */
    editPolicy(): Promise<EditPolicy | undefined>;
    /**
     * Sets a new edit policy for the contact (overwriting any existing policy).
     * To reset the edit policy, set it to {}.
     *
     * @param editPolicy The new edit policy for the contact
     */
    setEditPolicy(editPolicy: EditPolicy): Promise<void>;
    /**
     * Delete this contact.
     *
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns A response which can be used to approve MFA if needed
     */
    delete(mfaReceipt?: MfaReceipts): Promise<CubeSignerResponse<Empty>>;
    /**
     * Create a Contact from ContactInfo.
     *
     * @param client The CubeSigner instance this contact is associated with.
     * @param data The ContactInfo of the contact.
     */
    constructor(client: ApiClient | CubeSignerClient, data: ContactInfo);
    /**
     * Fetches the latest contact information and updates `this.cached`.
     *
     * @returns The contact information
     * @internal
     */
    private fetch;
    /**
     * Updates the contact and updates `this.cached` to the latest contact state.
     *
     * @param request The parameters to update
     * @param mfaReceipt Optional MFA receipt(s)
     * @returns The new contact after the update
     * @internal
     */
    private update;
}
//# sourceMappingURL=contact.d.ts.map