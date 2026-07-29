import {
  type Address,
  type TransactionSerializableEIP1559,
  type TransactionSerializableLegacy,
  type TypedDataDefinition,
  isAddress,
  verifyMessage,
  verifyTypedData,
} from "viem";
import {
  AllowRawBlobSigning,
  CubeSignerClient,
  type Key,
  type Role,
  Secp256k1,
} from "@cubist-labs/cubesigner-sdk";
import { type LocalAccount, toAccount } from "viem/accounts";
import { CubeSignerSource } from "../src";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";
import assert from "node:assert/strict";
import { defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { verifyAuthorization } from "viem/utils";

describe("Basic Viem signing", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let role: Role;
  let address: Address;
  let account: LocalAccount;
  let typedData: TypedDataDefinition;

  beforeAll(async () => {
    createdKeys = [];
    client = await CubeSignerClient.create(defaultManagementSessionManager());
    const org = client.org();

    const secp = await org.createKey(Secp256k1.Evm);
    createdKeys.push(secp);

    console.log("Creating a role");
    role = await org.createRole();
    console.log(`Adding key ${secp.materialId} to role`);
    await role.addKey(secp, [AllowRawBlobSigning]);
    console.log("Creating a token");
    const signerClient = await CubeSignerClient.create(
      await role.createSession("viem-signer-test"),
    );

    account = toAccount(new CubeSignerSource(secp.materialId, signerClient));
    address = account.address;
    console.log("Account address:", address);

    // Define our typed data with accurate typing
    // Prove to TypeScript that our primaryType is Mail and that our verifying contract is an address
    assert.strictEqual(TYPED_DATA_JSON.primaryType, "Mail");
    assert.ok(isAddress(TYPED_DATA_JSON.domain.verifyingContract));

    // Create a typed data object with this type information
    typedData = {
      ...TYPED_DATA_JSON,

      message: TYPED_DATA_JSON.data, // a message field must be defined

      // recast these two fields with the type information we proved earlier
      primaryType: TYPED_DATA_JSON.primaryType,
      domain: {
        ...TYPED_DATA_JSON.domain,
        verifyingContract: TYPED_DATA_JSON.domain.verifyingContract,
      },
    } as const;
  });

  afterAll(async () => {
    for (const key of createdKeys) {
      console.log(`Deleting ${key.id}`);
      await key.delete();
    }
    console.log(`Deleting ${role.id}`);
    await role.delete();
  });

  it("signMessage(string)", async () => {
    const message = "Hello, world!";

    const signature = await account.signMessage({ message });
    console.log("CubeSigner signature:", signature);
    console.log("CubeSigner address:", address);

    await expect(verifyMessage({ address, message, signature })).resolves.toBe(true);
  });

  for (const [chainId, nonce] of [
    [1, 1],
    [0, 0],
    [0, 1],
    [1, 0],
  ] as const) {
    it(`signAuthorization(chainId: ${chainId}, nonce: ${nonce})`, async () => {
      const contractAddress = "0x0000000000000000000000000000000000000000";
      const authorization = await account.signAuthorization!({
        chainId,
        nonce,
        contractAddress,
      });
      await expect(
        verifyAuthorization({
          address,
          authorization,
        }),
      ).resolves.toBe(true);
    });
  }

  it("signMessage(Uint8Array)", async () => {
    const message = { raw: new Uint8Array([1, 2, 3, 4, 5]) };

    const signature = await account.signMessage({ message });
    console.log("CubeSigner signature:", signature);
    console.log("CubeSigner address:", address);

    await expect(verifyMessage({ address, message, signature })).resolves.toBe(true);
  });

  it("signTypedData", async () => {
    const signature = await account.signTypedData(typedData);
    console.log("CubeSigner signature:", signature);
    console.log("CubeSigner address:", address);

    await expect(
      verifyTypedData({
        ...typedData,
        address,
        signature,
      }),
    ).resolves.toBe(true);
  });

  it("signTypedData (different chain id)", async () => {
    const typedDataNewChain = structuredClone(typedData);
    // update chainId (from 1)
    assert.ok(typedDataNewChain.domain);
    typedDataNewChain.domain.chainId = 43114;

    const signature = await account.signTypedData(typedDataNewChain);
    console.log("CubeSigner signature:", signature);
    console.log("CubeSigner address:", address);

    await expect(
      verifyTypedData({
        ...typedDataNewChain,
        address,
        signature,
      }),
    ).resolves.toBe(true);
  });

  it("signTypedData (with salt,regression)", async () => {
    const typedDataWithSalt = {
      types: {
        Mail: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
          { name: "content", type: "string" },
        ],
      },

      primaryType: "Mail",

      message: {
        name: "Alice",
        wallet: "0x2111111111111111111111111111111111111111",
        content: "Hello!",
      },

      domain: {
        chainId: 80001,
        name: "Fun Org",
        version: "0.1",
        verifyingContract: "0x283D4582aa4A8d7b1521d74C980A664cCCF145f8",
        salt: "0x0000000000000000000000000000000000000008000000000000000000000000",
      },
    } as const;

    const signature = await account.signTypedData(typedDataWithSalt);
    console.log("CubeSigner signature:", signature);
    console.log("CubeSigner address:", address);

    await expect(
      verifyTypedData({
        ...typedDataWithSalt,
        address,
        signature,
      }),
    ).resolves.toBe(true);
  });

  it("signTransaction (basic legacy example)", async () => {
    const tx: TransactionSerializableLegacy = {
      type: "legacy",
      chainId: 1,
      to: "0x96be1e4c198ecb1a55e769f653b1934950294f19",
      value: 0n,
    };

    const signerSig = await account.signTransaction(tx);
    console.log("CubeSigner signature:", signerSig);
  });

  it("signTransaction (basic EIP1559 example)", async () => {
    const tx: TransactionSerializableEIP1559 = {
      type: "eip1559",
      chainId: 1,
      to: "0x96be1e4c198ecb1a55e769f653b1934950294f19",
      value: 0n,
    };

    const signerSig = await account.signTransaction(tx);
    console.log("CubeSigner signature:", signerSig);
  });
});
