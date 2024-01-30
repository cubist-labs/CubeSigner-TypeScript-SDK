import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as ethers from "ethers";
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v5";

import { NFT, NFTCollection, NFTContractDeployMetadata, ThirdwebSDK } from "@thirdweb-dev/sdk";
import { Holesky, Localhost, AvalancheFuji } from "@thirdweb-dev/chains";

import { airdrop, env } from "./utils";
import assert from "assert";

// CubeSigner token (base64 encoded)
// You can create it, e.g., like:
// export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

// Address of the NTF collection owner (and ethers Signer)
const SIGNER_ADDRESS: string = ethers.utils.getAddress(env("SIGNER_ADDRESS")!);
// Address of an NFT recipient
const RECIPIENT_ADDRESS: string = ethers.utils.getAddress(env("RECIPIENT_ADDRESS")!);

// Network to use "localhost", "fuji", or "holesky"
const NETWORK: string = env("NETWORK", "localhost")!;

// NFT metadata
const NFT_NAME = "Cool NFT";
const NFT_DESCRIPTION = "This is a cool NFT";
const NFT_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/NFT_diagram.svg/2880px-NFT_diagram.svg.png";

// ThirdWeb API credentials
const THIRDWEB_CLIENT_ID = env("THIRDWEB_CLIENT_ID")!;
const THIRDWEB_SECRET_KEY = env("THIRDWEB_SECRET_KEY")!;

/**
 * Simple example showing how to managing NFT collections and items, using
 * CubeSigner to safeguard the owner key in secure hardware.
 * */
async function main() {
  // 1. Load signer session

  // If token is passed via env variable, decode and parse it,
  // otherwise just load token from default filesystem location.
  const storage = CUBE_SIGNER_TOKEN
    ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
    : csFs.defaultSignerSessionStorage();
  // Load signer session
  const signerSession = await cs.SignerSession.loadSignerSession(storage);

  // 2. Create signer instance backed by CubeSigner
  const signer = new Signer(SIGNER_ADDRESS, signerSession);

  // 3. Air drop ETH to signer address if running locally

  if (NETWORK === "localhost") {
    // Fund the signer address with 100 ETH
    const provider = new ethers.providers.JsonRpcProvider(Localhost.rpc[0]);
    [SIGNER_ADDRESS, RECIPIENT_ADDRESS].forEach(async (addr) => {
      console.log(`Funding ${addr} with 100 ETH`);
      await airdrop(provider, addr);
    });
  }

  const network = NETWORK === "holesky" ? Holesky : NETWORK === "fuji" ? AvalancheFuji : Localhost;
  console.log(`Using network ${network.name}`);

  // 4. Create Thirdweb SDK using the secure signer

  const twSdk = ThirdwebSDK.fromSigner(signer, network, {
    clientId: THIRDWEB_CLIENT_ID,
    secretKey: THIRDWEB_SECRET_KEY,
  });

  const nftApp = new NFTApp(twSdk);

  // A. Create NFT collection
  const collection = await nftApp.newCollection({
    name: `${NFT_NAME} Collection`,
    description: `${NFT_DESCRIPTION} Collection`,
    primary_sale_recipient: SIGNER_ADDRESS,
  });
  const collectionAddress = collection.getAddress();
  console.log(
    `Deployed new collection: ${collectionAddress} (owned by ${await collection.owner.get()})`,
  );

  // B. Create one NFT
  const nftMetadata = {
    name: NFT_NAME,
    description: NFT_DESCRIPTION,
    image: NFT_URL,
  };
  const item0 = await nftApp.createItem(collectionAddress, nftMetadata);
  console.log(item0);

  // C. Create 10 NFTs
  const bulkNftMetadata = [];
  for (let i = 0; i < 10; i++) {
    bulkNftMetadata.push({
      name: `${NFT_NAME} #${i}`,
      description: NFT_DESCRIPTION,
      image: `${NFT_URL}?id=${i}`,
    });
  }
  const items = await nftApp.createItemsInBulk(collectionAddress, bulkNftMetadata);

  // D. Get NFTs
  {
    const nft0 = await nftApp.getItem(collectionAddress, ethers.BigNumber.from(item0.metadata.id));
    console.log(nft0);
    assert(nft0.metadata.name === "Cool NFT");
    assert(nft0.metadata.id === item0.metadata.id);

    const nft10 = await nftApp.getItem(collectionAddress, items[9]);
    console.log(nft10);
    assert(ethers.BigNumber.from(nft10.metadata.id).eq(items[9]));
    assert(nft10.metadata.name === "Cool NFT #9");
  }

  // E. Transfer ownership of NFT
  {
    const itemId = items[8];
    let nft = await nftApp.getItem(collectionAddress, itemId);
    assert(nft.owner == SIGNER_ADDRESS);

    // Transfer item
    await nftApp.transferItem(collectionAddress, RECIPIENT_ADDRESS, itemId);

    // Get item again
    nft = await nftApp.getItem(collectionAddress, itemId);
    assert(nft.owner === RECIPIENT_ADDRESS);

    // Transfer item should fail now since we're no longer the owner
    try {
      await nftApp.transferItem(collectionAddress, SIGNER_ADDRESS, itemId);
      throw new Error("Expected transfer to fail");
    } catch (err) {
      if ((err as Error).message === "Expected transfer to fail") {
        throw err;
      }
    }
  }

  // F. Get all NFTs
  {
    const nfts = await nftApp.getAllItems(collectionAddress);
    console.log(
      nfts.map((nft) => {
        return { name: nft.metadata.name, owner: nft.owner };
      }),
    );
    assert(nfts.length === 11);
  }

  // G. Delete an NFT
  {
    const itemId = items[0];
    await nftApp.deleteItem(collectionAddress, itemId);

    try {
      await collection.ownerOf(itemId);
      throw new Error("Expected ownerOf to fail");
    } catch (err) {
      if ((err as Error).message === "Expected ownerOf to fail") {
        throw err;
      }
    }
  }
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});

/** Simple NFT app that demonstrates the usage of the thirdweb SDK with CubeSigner.  */
class NFTApp {
  /** The thirdweb SDK instance. */
  private twSdk: ThirdwebSDK;

  /**
   * Creates a new NFTApp instance.
   * @param {ThirdwebSDK} sdk - The thirdweb SDK instance.
   */
  constructor(sdk: ThirdwebSDK) {
    this.twSdk = sdk;
  }

  /**
   * Deploys a new NFT collection.
   *
   * @param {NFTContractDeployMetadata} metadata - The metadata of the NFT collection.
   * @return {Promise<NFTCollection>} A promise that resolves to the newly deployed NFT collection.
   */
  async newCollection(metadata: NFTContractDeployMetadata): Promise<NFTCollection> {
    // deploy new collection
    const collectionAddress = await this.twSdk.deployer.deployNFTCollection(metadata);
    // get the collection
    return await this.getCollection(collectionAddress);
  }

  /**
   * Get the NFT collection.
   *
   * @param {string} collectionAddress - The address of the NFT collection.
   * @return {Promise<NFTCollection>} A promise that resolves to the NFT collection.
   */
  async getCollection(collectionAddress: string): Promise<NFTCollection> {
    // getContract returns a NFTCollection instance given the address
    // and "nft-collection" as the contract type.
    return await this.twSdk.getContract(collectionAddress, "nft-collection");
  }

  /**
   * Creates a new NFT item.
   *
   * @param {string} collectionAddress - The address of the NFT collection contract.
   * @param {NFTItemMetadata} metadata - The metadata of the NFT item.
   * @param {string?} walletAddress - (Optional) The address of the wallet to mint the NFT to.
   * @return {Promise<NFT>} A promise that resolves to the newly created NFT.
   */
  async createItem(
    collectionAddress: string,
    metadata: NFTItemMetadata,
    walletAddress?: string,
  ): Promise<NFT> {
    const nftCollection = await this.getCollection(collectionAddress);
    const tx = walletAddress
      ? await nftCollection.mintTo(walletAddress, metadata)
      : await nftCollection.mint(metadata);
    console.log(`Minted new NFT ${tx.id}, receipt transaction hash: ${tx.receipt.transactionHash}`);
    return await tx.data();
  }

  /**
   * Creates multiple NFTs in bulk for a given NFT collection.
   *
   * @param {string} collectionAddress - The address of the NFT collection.
   * @param {NFTItemMetadata[]} metadata - The metadata of the NFT item.
   * @param {string?} walletAddress - (Optional) The address of the wallet to receive the created items.
   * @return {Promise<ethers.BigNumber[]>} A promise that resolves to an array of BigNumber representing the IDs of the created NFTs.
   */
  async createItemsInBulk(
    collectionAddress: string,
    metadata: NFTItemMetadata[],
    walletAddress?: string,
  ): Promise<ethers.BigNumber[]> {
    const nftCollection = await this.getCollection(collectionAddress);
    const tx = walletAddress
      ? await nftCollection.mintBatchTo(walletAddress, metadata)
      : await nftCollection.mintBatch(metadata);
    console.log(
      `Minted ${tx.length} new NFTs (${tx[0].id} - ${
        tx[tx.length - 1].id
      }), receipt transaction hash: ${tx[0].receipt.transactionHash}`,
    );
    return tx.map((nft) => nft.id);
  }

  /**
   * Retrieves an NFT item from a given collection.
   *
   * @param {string} collectionAddress - The address of the NFT collection.
   * @param {ethers.BigNumber} id - The ID of the NFT item to retrieve.
   * @return {Promise<NFT>} A Promise that resolves to the retrieved NFT item.
   */
  async getItem(collectionAddress: string, id: ethers.BigNumber): Promise<NFT> {
    const nftCollection = await this.getCollection(collectionAddress);
    const nft = await nftCollection.get(id);
    console.log(`Got NFT ${id}...`);
    return nft;
  }

  /**
   * Retrieves all NFT items from a given collection.
   *
   * @param {string} collectionAddress The address of the NFT collection.
   * @return {Promise<NFT[]>} A promise that resolves to an array of NFT items.
   */
  async getAllItems(collectionAddress: string): Promise<NFT[]> {
    const nftCollection = await this.getCollection(collectionAddress);
    const nfts = await nftCollection.getAll();
    console.log(`Got all (${nfts.length}) NFTs...`);
    return nfts;
  }

  /**
   * Transfers an item from a collection to a recipient address.
   *
   * @param {string} collectionAddress The address of the NFT collection.
   * @param {string} recipientAddress The address of the recipient.
   * @param {ethers.BigNumber} itemId The ID of the item to be transferred.
   */
  async transferItem(
    collectionAddress: string,
    recipientAddress: string,
    itemId: ethers.BigNumber,
  ) {
    const nftCollection = await this.getCollection(collectionAddress);
    const tx = await nftCollection.transfer(recipientAddress, itemId);
    console.log(
      `Transferred NFT ${itemId} to ${recipientAddress}, receipt transaction hash: ${tx.receipt.transactionHash}`,
    );
  }

  /**
   * Deletes an item from the NFT collection.
   *
   * @param {string} collectionAddress The address of the NFT collection.
   * @param {ethers.BigNumber} itemId The ID of the item to be deleted.
   */
  async deleteItem(collectionAddress: string, itemId: ethers.BigNumber) {
    const nftCollection = await this.getCollection(collectionAddress);
    const tx = await nftCollection.burn(itemId);
    console.log(`Burned NFT ${itemId}, receipt transaction hash: ${tx.receipt.transactionHash}`);
  }
}

/** The metadata of an NFT item. */
type NFTItemMetadata = {
  /** The name of the NFT item.  */
  name: string;
  /** The description of the NFT item.  */
  description: string;
  /** The image or URL of the image of the NFT item.  */
  image: string;
};
