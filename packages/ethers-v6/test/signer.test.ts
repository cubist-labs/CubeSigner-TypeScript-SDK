import { expect } from "chai";
import { env } from "../../fs-storage/test/helpers";
import { Signer as CsEthersSigner } from "../src/index";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { TypedDataEncoder, TypedDataField, ethers, verifyMessage, verifyTypedData } from "ethers";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";

const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_holesky")!;

describe("ethers.Signer", () => {
  let createdKeys: cs.Key[];
  let org: cs.Org;
  let role: cs.Role;
  let session: cs.SignerSession;
  let address: string;
  let signer: CsEthersSigner;

  beforeAll(async () => {
    createdKeys = [];
    org = new cs.Org(await csFs.loadManagementSession());
    const aboutMe = await org.aboutMe();
    expect(aboutMe.org_ids.length).to.eq(1);

    const secp = await org.createKey(cs.Secp256k1.Evm);
    createdKeys.push(secp);

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Adding key to role");
    await role.addKey(secp, [cs.AllowEip712Signing, cs.AllowEip191Signing]);
    console.log("Creating a token");
    session = await role.createSession(new cs.MemorySessionStorage(), "ethers-sign-test");

    const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);

    address = secp.materialId;
    signer = new CsEthersSigner(address, session, provider);
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
    expect(TypedDataEncoder.hash(domain, types, value)).to.equal(TYPED_DATA_JSON.digest);

    const signerSig = await signer.signTypedData(domain, types, value);
    console.log("CubeSigner signature:", signerSig);

    const signerAddress = verifyTypedData(domain, types, value, signerSig);
    console.log("CubeSigner address:", signerAddress);
    expect(signerAddress.toLowerCase()).to.equal(address);
  });
});
