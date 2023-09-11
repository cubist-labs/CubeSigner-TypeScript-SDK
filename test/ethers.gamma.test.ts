import { expect } from "chai";
import { env } from "./helpers";
import * as cs from "../";
import { TypedDataEncoder, TypedDataField, ethers, verifyMessage, verifyTypedData } from "ethers";
import { TypedDataDomain } from "ethers/src.ts/hash";

// Increase timeout (we're submitting transactions to the blockchain)
jest.setTimeout(60000);

const IMPORTED_MNEMONIC: string = env("IMPORTED_MNEMONIC")!;
const IMPORTED_ADDRESS: string = env("IMPORTED_ADDRESS")!;
const GENERATED_ADDRESS: string = env(
  "GENERATED_ADDRESS",
  "0x96be1e4c198ecb1a55e769f653b1934950294f19",
)!;
const RPC_PROVIDER: string = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_goerli")!;
const AMOUNT: bigint = ethers.parseEther(env("AMOUNT", "0.0000001")!);
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)

describe("sign", () => {
  let signer: cs.ethers.Signer;
  let wallet: ethers.HDNodeWallet;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const storage = CUBE_SIGNER_TOKEN
      ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
      : undefined;
    // Load signer session
    const signerSession = await cs.CubeSigner.loadSignerSession(storage);

    const provider = new ethers.JsonRpcProvider(RPC_PROVIDER);

    signer = new cs.ethers.Signer(IMPORTED_ADDRESS, signerSession, provider);
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
      // last example from https://github.com/ethers-io/testcase-generation-scripts/blob/main/testcases/typed-data.json.gz
      const typedDataJson = {
        domain: {
          name: "Ether Mail",
          version: "1",
          chainId: 1,
          verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
        },
        primaryType: "Mail",
        types: {
          Person: [
            {
              name: "name",
              type: "string",
            },
            {
              name: "wallet",
              type: "address",
            },
          ],
          Mail: [
            {
              name: "from",
              type: "Person",
            },
            {
              name: "to",
              type: "Person",
            },
            {
              name: "contents",
              type: "string",
            },
          ],
        },
        data: {
          from: {
            name: "Cow",
            wallet: "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
          },
          to: {
            name: "Bob",
            wallet: "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
          },
          contents: "Hello, Bob!",
        },
        digest: "0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2",
      };

      const domain: TypedDataDomain = typedDataJson.domain;
      const types: Record<string, Array<TypedDataField>> = typedDataJson.types;
      const value: Record<string, any> = typedDataJson.data; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(TypedDataEncoder.hash(domain, types, value)).to.equal(typedDataJson.digest);

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
  let signer: cs.ethers.Signer;

  beforeAll(async () => {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location (local testing).
    const storage = CUBE_SIGNER_TOKEN
      ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
      : undefined;
    // Load signer session
    const signerSession = await cs.CubeSigner.loadSignerSession(storage);

    provider = new ethers.JsonRpcProvider(RPC_PROVIDER);
    signer = new cs.ethers.Signer(GENERATED_ADDRESS, signerSession, provider);

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
