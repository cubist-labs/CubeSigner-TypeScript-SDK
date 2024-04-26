import type {
  ApiOrder,
  AccountResponseObject,
  UserResponseObject} from "@dydxprotocol/v3-client";
import {
  DydxClient,
  OrderSide,
  OrderType,
  TimeInForce
} from "@dydxprotocol/v3-client";
import type { StarkSignable} from "@dydxprotocol/starkex-lib";
import { SignableOrder, asEcKeyPairPublic } from "@dydxprotocol/starkex-lib";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import { default as Web3 } from "web3";
import { program as cli } from "commander";
import type { curve } from "elliptic";
import clc from "cli-color";
import * as util from "node:util";
import { Web3Provider } from "./web3_provider";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);

const STARK_ADDR = env("STARK_ADDR")!.trim();
const ETH_ADDR = env("ETH_ADDR")!.trim();

const DYDX_HOST = "https://api.stage.dydx.exchange";
const NETWORK_ID = 11155111;

/**
 * @return {string} Random decimal number as a string.
 */
function randomClientId(): string {
  return Math.random().toString().slice(2).replace(/^0+/, "");
}

/**
 * Converts the public key of `Key` object to a `BasePoint`
 * @param {cs.Key} key CubeSigner key whose public key to convert
 * @return {curve.base.BasePoint} Corresponding base point
 */
function toBasePoint(key: cs.Key): curve.base.BasePoint {
  const pk = key.publicKey.slice(2); // skip '0x'
  const yCoordinateIsOdd = pk.slice(0, 2) === "03";
  return asEcKeyPairPublic(pk.slice(2), yCoordinateIsOdd).getPublic();
}

/**
 * Finds the dYdX account for a given stark key.
 * @param {AccountResponseObject[]} accounts All dYdX accounts
 * @param {cs.Key} key Stark key to search for
 * @return {AccountResponseObject} dYdX account for a given stark key.
 */
function findAccount(
  accounts: AccountResponseObject[],
  key: cs.Key,
): AccountResponseObject | undefined {
  const xCoord = toBasePoint(key).getX().toString("hex").padStart(64, "0");
  return accounts.find((a) => a.starkKey === xCoord);
}

/**
 * @return {cs.SignerSession} CubeSigner signer session loaded from env var or disk
 */
async function loadSignerSession(): Promise<cs.CubeSignerClient> {
  const storage = CUBE_SIGNER_TOKEN ?? csFs.defaultSignerSessionManager();
  return cs.CubeSignerClient.create(storage);
}

/** Program */
class Program {
  /** dYdX client */
  readonly dydx: DydxClient;
  /** CubeSigner client */
  readonly cubesigner: cs.CubeSignerClient;
  /** Stark key */
  readonly starkKey: cs.Key;
  /** Eth key */
  readonly ethKey: cs.Key;

  /** Material id of the Eth key (which is its eth address) */
  get ethAddr() {
    return this.ethKey.materialId;
  }

  /** Material id of the Stark key (which is its hex-encoded public key) */
  get starkAddr() {
    return this.starkKey.materialId;
  }

  /**
   * @return {Promise<Boolean>} Whether a dYdX user associated with the Eth key exists.
   */
  async doesUserExistWithAddress(): Promise<boolean> {
    const resp = await this.dydx.public.doesUserExistWithAddress(this.ethAddr);
    return resp.exists;
  }

  /** Ensures that the dYdX client has an ApiKey set (if it doesn't, it creates a new one). */
  async ensureApiKey() {
    if (!this.dydx.apiKeyCredentials) {
      const createApiKeyTag = "dydx(createApiKey)";
      console.group(createApiKeyTag);
      console.time(createApiKeyTag);
      const resp = await this.dydx.ethPrivate.createApiKey(this.ethAddr);
      this.dydx.apiKeyCredentials = resp.apiKey;
      console.timeEnd(createApiKeyTag);
      console.groupEnd();
    }
  }

  /** Deletes the current dydx api key (if any is set) */
  async deleteApiKey() {
    const currentApiKey = this.dydx.apiKeyCredentials?.key;
    if (currentApiKey) {
      const delApiKeyTag = "dydx(deleteApiKey)";
      console.group(delApiKeyTag);
      console.time(delApiKeyTag);
      await this.dydx.ethPrivate.deleteApiKey(currentApiKey, this.ethAddr);
      console.timeEnd(delApiKeyTag);
      console.groupEnd();
    }
  }

  /**
   * Creates a dYdX user for `ETH_ADDR` if no such user already exists.
   */
  async createUserIfNeeded(): Promise<void> {
    const userExists = await this.doesUserExistWithAddress();
    if (!userExists) {
      console.group("Creating new dYdX user");
      const starkPk = toBasePoint(this.starkKey);

      const createUserTag = "dydx(createUser)";
      console.time(createUserTag);
      const user = await this.dydx.onboarding.createUser(
        {
          starkKey: starkPk.getX().toString("hex"),
          starkKeyYCoordinate: starkPk.getY().toString("hex"),
        },
        ETH_ADDR,
      );
      console.timeEnd(createUserTag);
      console.log("Created user", user.user);
    }
  }

  /**
   * Requests some testnet tokens if the current balance is under 1000
   * @return {Promise<AccountResponseObject>} Account object.
   */
  async ensureTopUp(): Promise<AccountResponseObject> {
    let acc = await this.getAccount();
    const equity = parseFloat(acc.equity);
    console.log(`Current equity: ${equity}`);
    if (equity < 10000) {
      await this.requestTestnetTokens();
      acc = await this.getAccount();
    }
    return acc;
  }

  /**
   * Requests testnet tokens
   */
  async requestTestnetTokens(): Promise<void> {
    const requestTokensTag = `dydx(requestTestnetTokens)`;
    console.group(requestTokensTag);
    console.time(requestTokensTag);
    const tokens = await this.dydx.private.requestTestnetTokens();
    console.log("Got testnet tokens", tokens);
    console.timeEnd(requestTokensTag);
  }

  /**
   * Create a market order.
   * @param {string} marketName Market name.
   * @param {OrderSide} side Buy or sell.
   * @param {number} size Order quantity.
   */
  async trade(marketName: string, side: OrderSide, size: number) {
    await this.ensureApiKey();
    const acc = await this.getAccount();
    const positionId = acc.positionId;

    // get market
    const markets = await this.dydx.public.getMarkets();
    const market = markets.markets[marketName];
    if (!market) {
      throw new Error(`Market '${marketName}' not found`);
    }

    const indexPrice = parseFloat(market.indexPrice);

    const tradeTag = `Trade: ${side} ${size} ${marketName}`;
    console.group(tradeTag);
    console.time(tradeTag);

    // create an order
    const price =
      side === OrderSide.BUY ? Math.ceil(1.03 * indexPrice) : Math.floor(0.97 * indexPrice);
    const now = new Date().getTime(); // milliseconds since unix epoch
    const params = <ApiOrder>{
      market: market.market,
      type: OrderType.MARKET,
      side,
      timeInForce: TimeInForce.FOK,
      postOnly: false,
      size: `${size}`,
      price: `${price}`,
      limitFee: "0.1",
      expiration: util.format(new Date(now + 600000)), // 10 minutes from now
      clientId: randomClientId(), // client ID must be different every time
    };

    // sign it
    const signature = await this.starkSign(
      SignableOrder.fromOrder(
        {
          humanSize: params.size,
          humanPrice: params.price,
          limitFee: params.limitFee,
          market: params.market,
          side: params.side,
          expirationIsoTimestamp: params.expiration,
          clientId: params.clientId,
          positionId,
        },
        NETWORK_ID,
      ),
    );

    // post it
    const createOrderTag = "dydx(createOrder)";
    console.time(createOrderTag);
    const order = await this.dydx.private.createOrder(
      {
        ...params,
        signature,
      },
      positionId,
    );
    console.timeEnd(createOrderTag);
    console.timeEnd(tradeTag);

    // get status
    const ord = await this.dydx.private.getOrderById(order.order.id);
    console.info("Order", ord.order);
    console.groupEnd();
  }

  /**
   * Signs anything 'StarkSignable' with the current stark key.
   * @param {StarkSignable<T>} signable The object to sign.
   * @return {string} The 64-byte signature, hex-encoded, without the leading '0x'
   */
  async starkSign<T>(signable: StarkSignable<T>): Promise<string> {
    const computeHashTag = "local(calculateHash)";
    console.time(computeHashTag);
    const hash = await signable.getHashBN();
    console.timeEnd(computeHashTag);

    const message_base64 = hash.toBuffer().toString("base64");
    const starkSignTag = "cs(starkSign)";
    console.time(starkSignTag);
    const sig = await this.starkKey.signBlob({ message_base64 });
    console.timeEnd(starkSignTag);

    return sig
      .data()
      .signature.slice(2) // strip '0x'
      .slice(0, 128); // take first 64 bytes only
  }

  /**
   * Get the account that corresponds to this stark key.
   */
  async getAccount(): Promise<AccountResponseObject> {
    const accounts = await this.getAccounts();
    const acc = findAccount(accounts, this.starkKey);
    if (!acc) {
      throw new Error(`No account found for key ${this.starkAddr}`);
    }
    return acc;
  }

  /**
   * Get accounts information.
   */
  async getAccounts(): Promise<AccountResponseObject[]> {
    await this.ensureApiKey();
    const tag = "dydx(getAccounts)";
    console.time(tag);
    const resp = await this.dydx.private.getAccounts();
    console.timeEnd(tag);
    return resp.accounts;
  }

  /**
   * Print out accounts information.
   */
  async printAccounts(): Promise<void> {
    const acc = await this.getAccounts();
    console.table(
      acc.map((a) => {
        return {
          starkKey: a.starkKey,
          positionId: a.positionId,
          equity: parseFloat(a.equity),
          quoteBalance: parseFloat(a.quoteBalance),
        };
      }),
    );
  }

  /**
   * Gets user information.
   */
  async getUser(): Promise<UserResponseObject> {
    await this.ensureApiKey();
    const tag = "dydx(getUser)";
    console.time(tag);
    const resp = await this.dydx.private.getUser();
    console.timeEnd(tag);
    return resp.user;
  }

  /**
   * Print out user information.
   */
  async printUser(): Promise<void> {
    console.log("User", await this.getUser());
  }

  /**
   * Print out positions.
   */
  async printPositions(): Promise<void> {
    await this.ensureApiKey();
    const tag = "dydx(getPositions)";
    console.time(tag);
    const resp = await this.dydx.private.getPositions({});
    console.timeEnd(tag);
    console.table(
      resp.positions.map((p) => {
        return {
          market: p.market,
          status: p.status,
          side: p.side,
          size: parseFloat(p.size),
          entryPrice: parseFloat(p.entryPrice),
        };
      }),
    );
  }

  /**
   * @return {Promise<Program>} Static factory for `Program`
   */
  static async init(): Promise<Program> {
    const signerSession = await loadSignerSession();

    const initTag = "Initialize";
    console.time(initTag);
    const keys = await signerSession.sessionKeys();
    const starkKey = keys.find((k) => k.materialId === STARK_ADDR)!;
    const ethKey = keys.find((k) => k.materialId === ETH_ADDR)!;
    [starkKey, ethKey].forEach((key) => {
      if (!key) {
        throw new Error(`No key ${STARK_ADDR} accessible in current signer session`);
      }
    });

    const csProvider = new Web3Provider(signerSession, ethKey, "http://localhost:30000/not-needed");
    const web3 = new Web3(csProvider);
    const dydx = new DydxClient(DYDX_HOST, { web3, networkId: NETWORK_ID });
    console.timeEnd(initTag);

    return new Program(dydx, signerSession, starkKey, ethKey);
  }

  /**
   * Constructor
   * @param {DydxClient} dydx Dydx client
   * @param {cs.CubeSignerClient} client CubeSigner signer session
   * @param {cs.Key} starkKey CubeSigner stark key
   * @param {cs.Key} ethKey CubeSigner eth key
   */
  constructor(
    dydx: DydxClient,
    client: cs.CubeSignerClient,
    starkKey: cs.Key,
    ethKey: cs.Key,
  ) {
    this.dydx = dydx;
    this.cubesigner = client;
    this.starkKey = starkKey;
    this.ethKey = ethKey;
  }
}

/** Script entry point. */
async function main() {
  let prog: Program | undefined;

  cli
    .name("dydx-cs")
    .version("0.0.1")
    .description("dYdX demo using CubeSigner")
    .addHelpText(
      "after",
      () => `
${clc.bold.blue("Required Environment")}:
  ETH_ADDR:                     hex-encoded ethereum address
  STARK_ADDR:                   hex-encoded stark public key
`,
    );
  cli
    .command("keys")
    .description("print information about CubeSigner keys")
    .action(async () => {
      prog = await Program.init();

      const sessionStarkKeys = (await prog.cubesigner.sessionKeys()).filter((k) => k.cached.key_type === "Stark");

      const userExists = await prog.doesUserExistWithAddress();
      let dydxUser = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      let dydxAccounts: AccountResponseObject[] = [];
      if (userExists) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dydxUser = { publicId: ((await prog.getUser()) as any).publicId };
        dydxAccounts = await prog.getAccounts();
      }

      const table = [{ key: "ETH", address: prog.ethAddr, dydx: dydxUser }];
      for (const stark of sessionStarkKeys) {
        const positionId = findAccount(dydxAccounts, stark)?.positionId;
        const dydxAcc = positionId ? { positionId } : {};
        table.push({ key: "STARK", address: stark.materialId, dydx: dydxAcc });
      }
      console.table(table);
    });
  cli
    .command("create-user")
    .description("create dYdX user for ETH address")
    .action(async () => {
      prog = await Program.init();
      await prog.createUserIfNeeded();
    });
  cli
    .command("user")
    .description("print dYdX user information")
    .action(async () => {
      prog = await Program.init();
      await prog.printUser();
    });
  cli
    .command("accounts")
    .description("print dYdX accounts information")
    .action(async () => {
      prog = await Program.init();
      await prog.printAccounts();
    });

  cli
    .command("positions")
    .description("print dYdX positions information")
    .action(async () => {
      prog = await Program.init();
      await prog.printPositions();
    });
  cli
    .command("faucet")
    .description("request testnet tokens")
    .action(async () => {
      prog = await Program.init();
      await prog.ensureApiKey();
      await prog.requestTestnetTokens();
    });
  cli
    .command("trade <market> <side> <size>")
    .description("place a market order")
    .action(async (market, side, size) => {
      prog = await Program.init();
      side = side === "buy" ? OrderSide.BUY : side === "sell" ? OrderSide.SELL : undefined;
      if (!side) {
        throw new Error("side must be either 'buy' or 'sell'");
      }
      await prog.trade(market, side, size);
    });
  cli
    .command("ci", { hidden: true })
    .description("run CI validation stuff")
    .action(async () => {
      prog = await Program.init();
      await prog.createUserIfNeeded();
      await prog.ensureTopUp();
      await prog.trade("ETH-USD", OrderSide.BUY, 0.2);
      await prog.printPositions();
      await prog.printAccounts();
    });

  try {
    await cli.parseAsync();
  } finally {
    if (prog) {
      await prog.deleteApiKey();
    }
  }
}

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}

const oldConsoleTime = console.time;
const oldConsoleTimeEnd = console.timeEnd;
const oldConsoleGroup = console.group;

const style = clc.xterm(245);
console.time = (s?: string) => oldConsoleTime(style(s));
console.timeEnd = (s?: string) => oldConsoleTimeEnd(style(s));
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.group = (...data: any[]) => oldConsoleGroup(...data.map((d) => style(d)));

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
