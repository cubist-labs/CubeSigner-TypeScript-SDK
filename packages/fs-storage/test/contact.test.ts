import type { CubeSignerClient, Contact, Org, AddressMap } from "@cubist-labs/cubesigner-sdk";
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
    const evm_address = "0x372df14129efef558a7acbdcca3d8b2b6167c1dc";
    const contact = await org.createContact(name, { evm: [{ address: evm_address }] });
    createdContacts.push(contact);

    // depth 4 is required for addresses to be printed
    const inspected = inspect(contact, { depth: 4 });
    expect(inspected).toContain(name);
    expect(inspected).toContain(evm_address);
  });

  it("supports several address types", async () => {
    const evmAddresses: AddressMap["evm"] = [
      {
        address: "0xed50de15ccd49cf7d0424289e4c4047b77b1bb4f",
      },
    ];

    const bitcoinAddresses: AddressMap["btc"] = [
      {
        address: "tb1qg3t98n0fp0dcf4hc9s6w0xngxme60axcx9d9ea",
        chain: "signet",
      },
    ];

    const solanaAddresses: AddressMap["sol"] = [
      {
        address: "61MBuFMCS18teZeprMVEHZ2cZs2ExTn1tyHqG6RFhaN9",
        cluster: "devnet",
      },
    ];

    const suiAddresses: AddressMap["sui"] = [
      {
        address: "0x4b944f47036500162387374855a60b9004a27474b3dbdcb2a72f653c85689fe7",
        chain: "devnet",
      },
    ];

    const cantonAddresses: AddressMap["canton"] = [
      {
        address: "cubist::12201a7877b3d6446c937d3eee5bff285edafe9122c67d972a2b97518f30d92196e9",
        chain: "mainnet",
      },
    ];

    const contact = await org.createContact(randomContactName("Multiple addresses"), {
      evm: evmAddresses,
      btc: bitcoinAddresses,
      sol: solanaAddresses,
      sui: suiAddresses,
      canton: cantonAddresses,
    });
    createdContacts.push(contact);

    expect(contact.cached.addresses.evm).toEqual(evmAddresses);
    expect(contact.cached.addresses.btc).toEqual(bitcoinAddresses);
    expect(contact.cached.addresses.sol).toEqual(solanaAddresses);
    expect(contact.cached.addresses.sui).toEqual(suiAddresses);
    expect(contact.cached.addresses.canton).toEqual(cantonAddresses);

    // You can't update a contact to have invalid addresses

    // can't set an EVM address to a bitcoin address, etc
    await expect(
      contact.setAddresses({
        evm: [{ address: "tb1qg3t98n0fp0dcf4hc9s6w0xngxme60axcx9d9ea" }],
      }),
    ).rejects.toThrow();

    // can't use a signet bitcoin address on mainnet
    await expect(
      contact.setAddresses({
        btc: [{ address: "tb1qg3t98n0fp0dcf4hc9s6w0xngxme60axcx9d9ea", chain: "mainnet" }],
      }),
    ).rejects.toThrow();
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
    const addresses = { evm: [{ address: "0x372df14129efef558a7acbdcca3d8b2b6167c1dc" }] };
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

    const addresses = { evm: [{ address: "0x372df14129efef558a7acbdcca3d8b2b6167c1dc" }] };
    await contact.setAddresses(addresses);
    expect(contact.cached.addresses).toEqual(addresses);

    const metadata = "new metadata!";
    await contact.setMetadata(metadata);
    expect(contact.cached.metadata).toEqual(metadata);

    // avoiding setting owner and edit policy, to avoid a situation where we can't edit the contact anymore
  });

  it("searches contacts by address or label", async () => {
    // Create a contact with the zero address and a label
    const zeroAddress = "0x0000000000000000000000000000000000000000";
    const labelledZeroAddressContact = await org.createContact(
      randomContactName("Test search"),
      {
        evm: [
          {
            address: zeroAddress,
            chain: "0x01",
          },
        ],
      },
      undefined,
      undefined,
      ["cubist:erc20_token"],
    );
    createdContacts.push(labelledZeroAddressContact);

    const oneAddressContact = await org.createContact(randomContactName("Test search"), {
      evm: [
        {
          address: "0x0000000000000000000000000000000000000001",
        },
      ],
    });
    createdContacts.push(oneAddressContact);

    // Listing contacts with the zero address will have expected results
    let search_results = (await org.contacts(zeroAddress)).map((contact) => contact.id);
    expect(search_results).toContain(labelledZeroAddressContact.id);
    expect(search_results).not.toContain(oneAddressContact.id);

    // Can also search by address prefix - this should contain both contacts,
    // as both addresses start with this prefix
    search_results = (await org.contacts("0x00")).map((contact) => contact.id);
    expect(search_results).toContain(labelledZeroAddressContact.id);
    expect(search_results).toContain(oneAddressContact.id);

    // We can also look up by exact address/chain - our contact won't show up if we look for the zero address on chain 0x02
    search_results = (
      await org.contacts({ network: "Evm", address: zeroAddress, chain: "0x02" })
    ).map((contact) => contact.id);
    expect(search_results).not.toContain(labelledZeroAddressContact.id);
    expect(search_results).not.toContain(oneAddressContact.id);

    // But when we search for it on chain 0x01, we'll find our contact.
    search_results = (
      await org.contacts({ network: "Evm", address: zeroAddress, chain: "0x01" })
    ).map((contact) => contact.id);
    expect(search_results).toContain(labelledZeroAddressContact.id);
    expect(search_results).not.toContain(oneAddressContact.id);

    // We can also search by label
    search_results = (await org.contacts("label:cubist:erc20_token")).map((contact) => contact.id);
    expect(search_results).toContain(labelledZeroAddressContact.id);
    expect(search_results).not.toContain(oneAddressContact.id);
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
