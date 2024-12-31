import { expect } from "chai";
import { env } from "../../fs-storage/test/helpers";
import { Signer } from "../src/index";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import type { TypedDataField } from "ethers";
import { TypedDataEncoder, ethers, verifyMessage, verifyTypedData } from "ethers";
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
const AMOUNT: bigint = ethers.parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
const CUBE_SIGNER_MANAGEMENT_TOKEN = env("CUBE_SIGNER_MANAGEMENT_TOKEN")!;
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

describe("sign", () => {
  let signer: Signer;
  let wallet: ethers.HDNodeWallet;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
    // Load signer session
    const client = await cs.CubeSignerClient.create(session);

    const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);

    signer = new Signer(IMPORTED_ADDRESS, client, { provider });
    wallet = ethers.Wallet.fromPhrase(IMPORTED_MNEMONIC, provider);

    console.log("Wallet address:", await wallet.getAddress());
    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.getAddress(await wallet.getAddress())).to.equal(
      ethers.getAddress(await signer.getAddress()),
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
      const walletTx = ethers.Transaction.from(walletSig);
      const signerTx = ethers.Transaction.from(signerSig);

      // recover the public key from transactions and check them:
      expect(walletTx.fromPublicKey).to.not.be.null;
      expect(walletTx.fromPublicKey).to.equal(signerTx.fromPublicKey);

      // make sure the address matches the wallet address
      expect(ethers.computeAddress(walletTx.fromPublicKey!)).to.equal(
        ethers.getAddress(IMPORTED_ADDRESS),
      );
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
      expect(signerAddress).to.equal(ethers.getAddress(IMPORTED_ADDRESS));
    });
  });

  describe("signTypedData", () => {
    it("produces valid signature", async () => {
      const domain = TYPED_DATA_JSON.domain;
      const types: Record<string, Array<TypedDataField>> = TYPED_DATA_JSON.types;
      const value: Record<string, any> = TYPED_DATA_JSON.data; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(TypedDataEncoder.hash(domain, types, value)).to.equal(TYPED_DATA_JSON.digest);

      const signerSig = await signer.signTypedData(domain, types, value);
      console.log("CubeSigner signature:", signerSig);

      const walletSig = await wallet.signTypedData(domain, types, value);
      console.log("ethers.js Wallet signature:", walletSig);

      const signerAddress = verifyTypedData(domain, types, value, signerSig);
      console.log("CubeSigner address:", signerAddress);
      const walletAddress = verifyTypedData(domain, types, value, walletSig);
      console.log("ethers.js Wallet address:", walletAddress);

      expect(signerAddress).to.equal(walletAddress);
      expect(signerAddress).to.equal(ethers.getAddress(IMPORTED_ADDRESS));
    });
  });
});

describe("sendTransaction", () => {
  // Send funds from our generated address (which has more funds) to the imported address.

  let provider: ethers.JsonRpcProvider;
  let signer: Signer;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const session = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();

    // Load signer session
    const signerSession = await cs.CubeSignerClient.create(session);

    provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
    signer = new Signer(GENERATED_ADDRESS, signerSession, { provider });

    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.getAddress(await signer.getAddress())).to.equal(
      ethers.getAddress(GENERATED_ADDRESS),
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

    expect(toBalanceAfter).to.equal(toBalanceBefore + AMOUNT);
  });
});

describe("sendMfaTransaction", () => {
  // Tests signing that requires MFA
  let client: cs.CubeSignerClient;
  let role: cs.Role;
  let key: cs.Key;
  let provider: ethers.JsonRpcProvider;
  let signer: Signer;

  beforeAll(async () => {
    const session = CUBE_SIGNER_MANAGEMENT_TOKEN ?? csFs.defaultSignerSessionManager();
    client = await cs.CubeSignerClient.create(session);
    const org = client.org();

    const orgKeys = await org.keys();
    key = orgKeys.find((k: cs.Key) => {
      return k.materialId === GENERATED_ADDRESS;
    })!;

    console.log("Creating a role");
    role = await org.createRole();
    console.log("Creating a session");
    const signerClient = await cs.CubeSignerClient.create(
      await role.createSession("ethers-mfa-test"),
    );
    console.log("Adding key to role and require MFA");
    await role.addKey(key, [{ RequireMfa: {} }]);

    provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
    signer = new Signer(GENERATED_ADDRESS, signerClient, { provider });

    console.log("Signer address:", await signer.getAddress());

    // make sure the addresses match
    expect(ethers.getAddress(await signer.getAddress())).to.equal(
      ethers.getAddress(GENERATED_ADDRESS),
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
    console.log(`Approving transaction`);
    const mfa = await client.org().getMfaRequest(mfaId).approve();

    console.log("Signing transaction");
    const receipt = await signer.sendTransactionMfaApproved(mfa);
    await receipt.wait();
  });
});
