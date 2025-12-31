import type { AddressMap, ApiClient, EditPolicy, JsonValue, UpdateContactRequest } from ".";
import { CubeSignerClient } from ".";
import type { ContactInfo } from "./schema_types";

/**
 * A representation of a contact within an org.
 */
export class Contact {
  /** The CubeSigner instance that this contact is associated with */
  readonly #apiClient: ApiClient;

  /** The id of the contact: "Contact#" followed by a unique identifier. */
  readonly id: string;

  /**
   * Get the cached properties of this contact. The cached properties reflect
   * the state of the contact as of the last fetch or update (e.g. this field
   * will be updated after awaiting `Contact.updateName()`).
   */
  cached: ContactInfo;

  /** @returns The id of the org this contact is in. */
  get orgId(): string {
    return this.#apiClient.sessionMeta.org_id;
  }

  /**
   * Fetches and returns the latest name associated with the contact.
   *
   * @returns The latest name
   */
  async name(): Promise<string> {
    const data = await this.fetch();
    return data.name;
  }

  /**
   * Sets a new name for the contact.
   *
   * @param name The new name for the contact
   */
  async setName(name: string) {
    await this.update({ name });
  }

  /**
   * Fetches and returns the latest addresses associated with the contact.
   *
   * @returns The latest addresses
   */
  async addresses(): Promise<AddressMap> {
    const data = await this.fetch();
    return data.addresses as AddressMap;
  }

  /**
   * Sets a new set of addresses for the contact (overwriting the existing addresses).
   *
   * @param addresses The new addresses to associate with the contact
   */
  async setAddresses(addresses: AddressMap) {
    await this.update({ addresses });
  }

  /**
   * Fetches and returns the latest owner of the contact.
   *
   * @returns The user id of the contact's owner
   * @example User#c3b9379c-4e8c-4216-bd0a-65ace53cf98f
   */
  async owner(): Promise<string> {
    const data = await this.fetch();
    return data.owner;
  }

  /**
   * Sets a new owner for the contact. A contact owner cannot be an alien.
   *
   * @param owner The new owner of the contact
   */
  async setOwner(owner: string) {
    await this.update({ owner });
  }

  /**
   * Fetches and returns the latest metadata value for the contact. This will be null if there is no metadata defined.
   *
   * @returns The latest metadata
   */
  async metadata(): Promise<JsonValue> {
    const data = await this.fetch();
    return data.metadata as JsonValue;
  }

  /**
   * Sets a new metadata value for the contact (overwriting the existing value).
   *
   * @param metadata The new metadata for the contact
   */
  async setMetadata(metadata: JsonValue) {
    await this.update({ metadata });
  }

  /**
   * Fetches and returns the latest edit policy for the contact.
   *
   * @returns The edit policy for the contact, or undefined if there is no edit policy
   */
  async editPolicy(): Promise<EditPolicy | undefined> {
    const data = await this.fetch();
    return data.edit_policy;
  }

  /**
   * Sets a new edit policy for the contact (overwriting any existing policy).
   * To reset the edit policy, set it to {}.
   *
   * @param editPolicy The new edit policy for the contact
   */
  async setEditPolicy(editPolicy: EditPolicy) {
    await this.update({ edit_policy: editPolicy });
  }

  /**
   * Delete this contact.
   */
  async delete() {
    await this.#apiClient.contactDelete(this.id);
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
  constructor(client: ApiClient | CubeSignerClient, data: ContactInfo) {
    this.#apiClient = client instanceof CubeSignerClient ? client.apiClient : client;
    this.id = data.id;
    this.cached = data;
  }

  /**
   * Fetches the latest contact information and updates `this.cached`.
   *
   * @returns The contact information
   * @internal
   */
  private async fetch(): Promise<ContactInfo> {
    this.cached = await this.#apiClient.contactGet(this.id);
    return this.cached;
  }

  /**
   * Updates the contact and updates `this.cached` to the latest contact state.
   *
   * @param request The parameters to update
   * @returns The new contact after the update
   * @internal
   */
  private async update(request: UpdateContactRequest): Promise<ContactInfo> {
    this.cached = await this.#apiClient.contactUpdate(this.id, request);
    return this.cached;
  }
}
