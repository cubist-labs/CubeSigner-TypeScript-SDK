import { expect } from "chai";
import { env } from "../../fs-storage/test/helpers";
import { Signer } from "../src/index";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { TypedDataField, ethers } from "ethers";
import { _TypedDataEncoder, verifyMessage, verifyTypedData } from "ethers/lib/utils";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";

// Increase timeout (we're submitting transactions to the blockchain)
jest.setTimeout(60000);

const IMPORTED_MNEMONIC: string = env("IMPORTED_MNEMONIC")!;
const IMPORTED_ADDRESS: string = env("IMPORTED_ADDRESS")!;
const GENERATED_ADDRESS: string = env(
  "GENERATED_ADDRESS",
  "0x96be1e4c198ecb1a55e769f653b1934950294f19",
)!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_holesky")!;
const AMOUNT = ethers.utils.parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
const CUBE_SIGNER_MANAGEMENT_TOKEN = env("CUBE_SIGNER_MANAGEMENT_TOKEN")!;
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

describe("sign", () => {
  let signer: Signer;
  let wallet: ethers.Wallet;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const storage = CUBE_SIGNER_TOKEN
      ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
      : csFs.defaultSignerSessionStorage();
    // Load signer session
    const signerSession = await cs.SignerSession.loadSignerSession(storage);

    const provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);

    signer = new Signer(IMPORTED_ADDRESS, signerSession, { provider });
    wallet = ethers.Wallet.fromMnemonic(IMPORTED_MNEMONIC);

    console.log("Wallet address:", await wallet.getAddress());
    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.utils.getAddress(await wallet.getAddress())).to.equal(
      ethers.utils.getAddress(await signer.getAddress()),
    );
  });

  describe("signTransaction", () => {
    it("produces valid signature", async () => {
      // populate the transaction with gas price, nonce, etc.
      const tx = await signer.populateTransaction({
        to: GENERATED_ADDRESS, // any address will do
        value: AMOUNT,
      });

      const signerSig = await signer.signTransaction(tx);
      console.log("CubeSigner signature:", signerSig);

      const walletSig = await wallet.signTransaction(tx);
      console.log("ethers.js Wallet signature:", walletSig);

      // create Transaction from signature
      const walletTx = ethers.utils.parseTransaction(walletSig);
      const signerTx = ethers.utils.parseTransaction(signerSig);

      // recover the addresses from transactions and check them:
      expect(walletTx.from).to.not.be.null;
      expect(walletTx.from).to.equal(signerTx.from);

      // make sure the address matches the wallet address
      expect(walletTx.from).to.equal(ethers.utils.getAddress(IMPORTED_ADDRESS));
    });
  });

  describe("signMessage", () => {
    it("produces valid signature", async () => {
      const message = "Hello, world!";

      const signerSig = await signer.signMessage(message);
      console.log("CubeSigner signature:", signerSig);

      const walletSig = await wallet.signMessage(message);
      console.log("ethers.js Wallet signature:", walletSig);

      const signerAddress = verifyMessage(message, signerSig);
      console.log("CubeSigner address:", signerAddress);
      const walletAddress = verifyMessage(message, walletSig);
      console.log("ethers.js Wallet address:", walletAddress);

      expect(signerAddress).to.equal(walletAddress);
      expect(signerAddress).to.equal(ethers.utils.getAddress(IMPORTED_ADDRESS));
    });
  });

  describe("_signTypedData", () => {
    it("produces valid signature", async () => {
      const domain = TYPED_DATA_JSON.domain;
      const types: Record<string, Array<TypedDataField>> = TYPED_DATA_JSON.types;
      const value: Record<string, any> = TYPED_DATA_JSON.data; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(_TypedDataEncoder.hash(domain, types, value)).to.equal(TYPED_DATA_JSON.digest);

      const signerSig = await signer._signTypedData(domain, types, value);
      console.log("CubeSigner signature:", signerSig);

      const walletSig = await wallet._signTypedData(domain, types, value);
      console.log("ethers.js Wallet signature:", walletSig);

      const signerAddress = verifyTypedData(domain, types, value, signerSig);
      console.log("CubeSigner address:", signerAddress);
      const walletAddress = verifyTypedData(domain, types, value, walletSig);
      console.log("ethers.js Wallet address:", walletAddress);

      expect(signerAddress).to.equal(walletAddress);
      expect(signerAddress).to.equal(ethers.utils.getAddress(IMPORTED_ADDRESS));
    });
  });
});

describe("sendTransaction", () => {
  // Send funds from our generated address (which has more funds) to the imported address.

  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const storage = CUBE_SIGNER_TOKEN
      ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
      : csFs.defaultSignerSessionStorage();
    // Load signer session
    const signerSession = await cs.SignerSession.loadSignerSession(storage);

    provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
    signer = new Signer(GENERATED_ADDRESS, signerSession, { provider });

    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.utils.getAddress(await signer.getAddress())).to.equal(
      ethers.utils.getAddress(GENERATED_ADDRESS),
    );
  });

  it("sends funds", async () => {
    const fromAddr = await signer.getAddress();
    console.log(`from (${fromAddr}) has ${await provider.getBalance(fromAddr)} gwei`);

    const toAddr = IMPORTED_ADDRESS;
    const toBalanceBefore = await provider.getBalance(toAddr);
    console.log(`to (${toAddr}) has ${toBalanceBefore} gwei`);

    const tx = {
      to: toAddr,
      value: AMOUNT,
    };

    console.log(`Transferring ${AMOUNT} wei...`);
    const response = await signer.sendTransaction(tx);
    await response.wait();

    const toBalanceAfter = await provider.getBalance(toAddr);
    console.log(`to (${toAddr}) has ${toBalanceAfter} gwei`);

    expect(toBalanceAfter.eq(toBalanceBefore.add(AMOUNT))).to.be.true;
  });
});

describe("sendMfaTransaction", () => {
  // Tests signing that requires MFA
  let org: cs.Org;
  let role: cs.Role;
  let session: cs.SignerSession;
  let key: cs.Key;
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Signer;

  beforeAll(async () => {
    const storage = new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_MANAGEMENT_TOKEN)));
    org = await cs.Org.retrieveFromStorage(storage);

    const orgKeys = await org.keys();
    key = orgKeys.find((k: cs.Key) => {
      return k.materialId === GENERATED_ADDRESS;
    })!;

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Creating a session");
    session = await role.createSession(new cs.MemorySessionStorage(), "ethers-mfa-test");
    console.log("Adding key to role and require MFA");
    await role.addKey(key, [{ RequireMfa: {} }]);

    provider = new ethers.providers.JsonRpcProvider(RPC_PROVIDER);
    signer = new Signer(GENERATED_ADDRESS, session, { provider });

    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.utils.getAddress(await signer.getAddress())).to.equal(
      ethers.utils.getAddress(GENERATED_ADDRESS),
    );
  });

  afterAll(async () => {
    await role.delete();
  });

  it("approve MFA request and send transaction", async () => {
    // Submit transaction for signing
    const tx = {
      to: IMPORTED_ADDRESS,
      value: AMOUNT,
    };
    const mfaId = await signer.sendTransactionMfaInit(tx);

    // Approve and submit transaction. This can be done by a different entity
    // than the one initiating the signing. We simulate this here, by
    // retrieving the list of MFA requests instead of using the MFA info
    // returned by `sendTransactionMfa()` above.
    console.log("Getting MFA info");
    const mfaInfos = await org.listMfaInfos();
    const mfaInfo = mfaInfos.find((m: cs.MfaRequestInfo) => {
      return m.id === mfaId;
    })!;

    console.log(`Approving transaction`);
    const mfa = await org.mfaApprove(mfaInfo.id);

    console.log("Signing transaction");
    const receipt = await signer.sendTransactionMfaApproved(mfa);
    await receipt.wait();
  });
});
