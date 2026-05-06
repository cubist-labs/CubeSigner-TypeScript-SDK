import { assert, expect } from "chai";
import type {
  CubeSignerResponse,
  CubeSignerClient,
  Org,
  BinanceDryRun,
  JsonRpcResponse,
  ErrorResponse,
  Key,
  schemas,
} from "@cubist-labs/cubesigner-sdk";
import { Ed25519 } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { deleteKeys } from "./helpers";

describe("RPC", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let org: Org;
  let masterAccKey: Key;
  let subAccKey: Key;

  beforeAll(async () => {
    createdKeys = [];
    client = await newCubeSigner();
    org = client.org();
    masterAccKey = await org.createKey(Ed25519.BinanceApi, undefined, {
      policy: ["AllowRawBlobSigning"],
    });
    createdKeys.push(masterAccKey);

    subAccKey = await org.createKey(Ed25519.BinanceApi, undefined, {
      policy: ["AllowRawBlobSigning"],
    });
    createdKeys.push(subAccKey);

    // update keys' properties to set fake API keys
    await Promise.all([
      masterAccKey.setProperties({
        kind: "BinanceApi",
        api_key: "secret",
        is_master: true,
      }),
      subAccKey.setProperties({
        kind: "BinanceApi",
        api_key: "secret",
        is_master: false,
      }),
    ]);
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  /**
   * Assert that a {@link CubeSignerResponse} is a "SignDryRun" 202 response;
   * for all included MFA requests assert that they do not exist.
   *
   * @param resp The response to check
   * @returns The {@link SignDryRun} response
   */
  function assertDryRunResp(resp: CubeSignerResponse<JsonRpcResponse>): BinanceDryRun {
    assert(resp.isSuccess(), "JSON RPC endpoint always returns 200 Ok");
    const data = resp.data();
    expect(data).to.not.be.undefined;
    expect(data.result).to.be.undefined;
    assert(data.error);
    const error = data.error.data as ErrorResponse;
    console.log(error);
    expect(error.error_code).to.eq("BinanceDryRun" satisfies schemas["AcceptedValueCode"]);
    assert(error.accepted);
    assert(error.accepted.BinanceDryRun);
    return error.accepted.BinanceDryRun;
  }

  describe("binance", () => {
    it("account info", async () => {
      const responses = await Promise.all(
        [masterAccKey, subAccKey].map((key) =>
          client.apiClient.rpc({
            method: "cs_binanceAccountInfo",
            params: {
              keyId: key.id,
              dryRun: "NO_SUBMIT",
              omitZeroBalances: true,
            },
          }),
        ),
      );
      responses.forEach(assertDryRunResp);
    });

    it("sub-account-assets", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceSubAccountAssets",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            email: "xyz@cubist.dev",
          },
        })
        .then(assertDryRunResp);
    });

    it("sub-account-assets", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceSubAccountTransferHistory",
          params: {
            keyId: subAccKey.id,
            dryRun: "NO_SUBMIT",
          },
        })
        .then(assertDryRunResp);
    });

    it("sub-to-master", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceSubToMaster",
          params: {
            keyId: subAccKey.id,
            dryRun: "NO_SUBMIT",
            asset: "USDT",
            amount: "1.5",
          },
        })
        .then(assertDryRunResp);
    });

    it("sub-to-sub", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceSubToSub",
          params: {
            keyId: subAccKey.id,
            dryRun: "NO_SUBMIT",
            toEmail: "xyz@cubist.dev",
            asset: "USDT",
            amount: "1.5",
          },
        })
        .then(assertDryRunResp);
    });

    it("universal-transfer", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceUniversalTransfer",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            asset: "USDT",
            amount: "1.5",
            toEmail: "xyz@cubist.dev",
            clientTranId: "ut#1234",
          },
        })
        .then(assertDryRunResp);
    });

    it("universal-transfer-history", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceUniversalTransferHistory",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            clientTranId: "ut#1234",
          },
        })
        .then(assertDryRunResp);
    });

    it("withdraw", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceWithdraw",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            withdrawOrderId: "w#1234",
            coin: "USTD",
            amount: "2.3456",
            address: "0x11111111111111111111111111111111",
          },
        })
        .then(assertDryRunResp);
    });

    it("withdraw-history", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceWithdrawHistory",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            withdrawOrderId: "w#1234",
          },
        })
        .then(assertDryRunResp);
    });
  });
});
