import { expect } from "chai";
import { env } from "../../fs-storage/test/helpers";
import { Signer as CsEthersSigner } from "../src/index";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import type { TypedDataField } from "ethers";
import { ethers } from "ethers";
import { _TypedDataEncoder, verifyMessage, verifyTypedData } from "ethers/lib/utils";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";

const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_holesky")!;

describe("ethers.Signer", () => {
  let createdKeys: cs.Key[];
  let client: cs.CubeSignerClient;
  let role: cs.Role;
  let address: string;
  let signer: CsEthersSigner;

  beforeAll(async () => {
    createdKeys = [];
    client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    const org = await client.org();
    const aboutMe = await client.user();
    expect(aboutMe.org_ids.length).to.eq(1);

    const secp = await org.createKey(cs.Secp256k1.Evm);
    createdKeys.push(secp);

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Adding key to role");
    await role.addKey(secp, [cs.AllowEip712Signing, cs.AllowEip191Signing]);
    console.log("Creating a token");
    const roleClient = await cs.CubeSignerClient.create(
      await role.createSession("ethers-sign-test"),
    );

    const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);

    address = secp.materialId;
    signer = new CsEthersSigner(address, roleClient, { provider });
    console.log("Signer address:", await signer.getAddress());
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

    const signerSig = await signer.signMessage(message);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyMessage(message, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });

  it("signMessage(Uint8Array)", async () => {
    const message = new Uint8Array([1, 2, 3, 4, 5]);

    const signerSig = await signer.signMessage(message);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyMessage(message, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });

  it("signTypedData", async () => {
    const domain = TYPED_DATA_JSON.domain;
    const types: Record<string, Array<TypedDataField>> = TYPED_DATA_JSON.types;
    const value: Record<string, any> = TYPED_DATA_JSON.data; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(_TypedDataEncoder.hash(domain, types, value)).to.equal(TYPED_DATA_JSON.digest);

    const signerSig = await signer._signTypedData(domain, types, value);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyTypedData(domain, types, value, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });

  it("signTypedData", async () => {
    const typedData = Object.assign({}, TYPED_DATA_JSON);
    // update chainId (from 1)
    typedData.domain.chainId = 43114;

    const domain = typedData.domain;
    const types: Record<string, Array<TypedDataField>> = typedData.types;
    const value: Record<string, any> = typedData.data; // eslint-disable-line @typescript-eslint/no-explicit-any

    const signerSig = await signer._signTypedData(domain, types, value);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyTypedData(domain, types, value, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });

  it("signTypedData(with salt,regression)", async () => {
    const types = {
      Mail: [
        { name: "name", type: "string" },
        { name: "wallet", type: "address" },
        { name: "content", type: "string" },
      ],
    };
    const value = {
      name: "Alice",
      wallet: "0x2111111111111111111111111111111111111111",
      content: "Hello!",
    };
    const domain = {
      chainId: 80001,
      name: "Fun Org",
      version: "0.1",
      verifyingContract: "0x283D4582aa4A8d7b1521d74C980A664cCCF145f8",
      salt: "0x0000000000000000000000000000000000000008000000000000000000000000",
    };
    const signerSig = await signer._signTypedData(domain, types, value);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyTypedData(domain, types, value, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });
});
