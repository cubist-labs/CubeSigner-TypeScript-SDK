import type { CubeSignerClient, Contact, Org } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { deleteContacts, randomInt } from "./helpers";
import { inspect } from "node:util";

describe("Contact", () => {
  let createdContacts: Contact[];
  let client: CubeSignerClient;
  let org: Org;

  beforeAll(async () => {
    createdContacts = [];
    client = await newCubeSigner();
    org = client.org();
  });

  afterAll(async () => {
    await deleteContacts(createdContacts);
  });

  it("has an informative print value", async () => {
    const name = randomContactName("Test print");
    const evm = "0x372df14129efef558a7acbdcca3d8b2b6167c1dc";
    const contact = await org.createContact(name, { evm });
    createdContacts.push(contact);

    const inspected = inspect(contact);
    expect(inspected).toContain(name);
    expect(inspected).toContain(evm);
  });

  it("lists contacts", async () => {
    const existingContactIds = (await org.contacts()).map((c) => c.id);

    const newContact = await org.createContact(randomContactName("Test list"));
    createdContacts.push(newContact);

    const listNewContacts = (await org.contacts()).filter(
      (c) => !existingContactIds.includes(c.id),
    );
    expect(listNewContacts).toEqual([newContact]);
  });

  it("creates contact with properties", async () => {
    const name = randomContactName("Test props");
    const addresses = { evm: "0x372df14129efef558a7acbdcca3d8b2b6167c1dc" };
    const metadata = "A contact description";
    const contact = await org.createContact(name, addresses, metadata);
    createdContacts.push(contact);

    expect(contact.cached.name).toEqual(name);
    expect(contact.cached.addresses).toEqual(addresses);
    expect(contact.cached.metadata).toEqual(metadata);
  });

  it("updates a contact", async () => {
    const name = randomContactName("Test update");
    const contact = await org.createContact(name);
    createdContacts.push(contact);

    const newName = randomContactName("Updated name");
    await contact.setName(newName);
    expect(contact.cached.name).toEqual(newName);

    const addresses = { evm: "0x372df14129efef558a7acbdcca3d8b2b6167c1dc" };
    await contact.setAddresses(addresses);
    expect(contact.cached.addresses).toEqual(addresses);

    const metadata = "new metadata!";
    await contact.setMetadata(metadata);
    expect(contact.cached.metadata).toEqual(metadata);

    // avoiding setting owner and edit policy, to avoid a situation where we can't edit the contact anymore
  });
});

/**
 * Generate a random prefix before a contact name, so if tests fail
 * and contacts don't get deleted the next run of tests won't
 * immediately fail.
 *
 * @param name A name to go after the random prefix
 * @returns A random prefix followed by the given name
 */
function randomContactName(name: string): string {
  return `${randomInt(99999999999)} ${name}`;
}
