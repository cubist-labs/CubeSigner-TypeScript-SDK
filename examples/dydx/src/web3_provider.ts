import { ethers } from "ethers";
import type { CubeSignerClient, Key} from "@cubist-labs/cubesigner-sdk";
import { Signer } from "@cubist-labs/cubesigner-sdk-ethers-v6";
import type { AbstractProvider, RequestArguments } from "web3-core";
import type { JsonRpcPayload, JsonRpcResponse } from "web3-core-helpers";

/**
 * Implements web3's `AbstractProvider` by delegating the following eth calls to CubeSigner:
 * - `eth_signTypedData`
 * - `eth_sign`
 */
export class Web3Provider implements AbstractProvider {
  readonly #provider: ethers.JsonRpcProvider;
  readonly #client: CubeSignerClient;
  readonly #key: Key;

  /**
   * Constructor
   * @param {CubeSignerClient} client Client to use for signing
   * @param {Key} key Key to use for signing
   * @param {string} rpcUrl Json RPC node HTTP url to use as fallback
   */
  constructor(client: CubeSignerClient, key: Key, rpcUrl: string) {
    this.#client = client;
    this.#provider = new ethers.JsonRpcProvider(rpcUrl);
    this.#key = key;
  }

  /** @inheritdoc */
  sendAsync(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse | undefined) => void,
  ): void {
    this.request({ method: payload.method, params: payload.params })
      .then((result) => {
        callback(null, {
          id: payload.id as number,
          jsonrpc: payload.jsonrpc,
          result,
        });
      })
      .catch(callback);
  }

  /** @inheritdoc */
  send?(
    payload: JsonRpcPayload,
    callback: (error: Error | null, result?: JsonRpcResponse | undefined) => void,
  ): void {
    this.sendAsync(payload, callback);
  }

  /** @inheritdoc */
  async request(
    args: RequestArguments,
  ): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Promise<any> {
    const timeTag = `cs(${args.method})`;
    console.time(timeTag);
    try {
      if (args.method === "eth_signTypedData") {
        const address = args.params[0] as string;
        const domain = args.params[1].domain as ethers.TypedDataDomain;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const types = args.params[1].types as any;
        delete types.EIP712Domain;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = args.params[1].message as any;
        return await this.#newSigner(address).signTypedData(domain, types, value);
      } else if (args.method === "eth_sign") {
        const address = args.params[0] as string;
        const message = args.params[1] as string;
        const buffer = Buffer.from(message.startsWith("0x") ? message.slice(2) : message, "hex");
        return await this.#newSigner(address).signMessage(buffer);
      } else {
        return await this.#provider.send(args.method, args.params);
      }
    } finally {
      console.timeEnd(timeTag);
    }
  }

  /** @inheritdoc */
  get connected() {
    return true;
  }

  /**
   * @param {string} address Eth address
   * @return {Signer} Signer for that address
   */
  #newSigner(address: string): Signer {
    address = address.toLowerCase();
    return new Signer(
      address === this.#key.materialId ? this.#key : address,
      this.#client,
      { provider: this.#provider },
    );
  }
}
