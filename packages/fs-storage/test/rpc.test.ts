import { assert, expect } from "chai";
import type {
  CubeSignerResponse,
  CubeSignerClient,
  Org,
  BinanceDryRun,
  BybitDryRun,
  CoinbaseDryRun,
  JsonRpcResponse,
  ErrorResponse,
  Key,
  schemas,
} from "@cubist-labs/cubesigner-sdk";
import { Ed25519, HmacSha256 } from "@cubist-labs/cubesigner-sdk";
import { newCubeSigner } from "./setup";
import { deleteKeys } from "./helpers";
import { randomUUID } from "node:crypto";

describe("RPC", () => {
  let createdKeys: Key[];
  let client: CubeSignerClient;
  let org: Org;
  let coinbaseKey: Key;
  let hmacKey: Key;
  let masterAccKey: Key;
  let subAccKey: Key;

  beforeAll(async () => {
    createdKeys = [];
    client = await newCubeSigner();
    org = client.org();

    [masterAccKey, subAccKey, coinbaseKey, hmacKey] = await Promise.all([
      org.createKey(Ed25519.BinanceApi),
      org.createKey(Ed25519.BinanceApi),
      org.createKey(Ed25519.CoinbaseApi),
      org.createKey(HmacSha256),
    ]);
    createdKeys.push(masterAccKey, subAccKey, coinbaseKey, hmacKey);

    // update keys' properties to set fake API keys
    await Promise.all([
      masterAccKey.setProperties({
        kind: "BinanceApi",
        api_key: "secret",
        is_master: true,
        email: "master@example.com",
      }),
      subAccKey.setProperties({
        kind: "BinanceApi",
        api_key: "secret",
        is_master: false,
        sub_of: "master@example.com",
      }),
      coinbaseKey.setProperties({
        kind: "CoinbaseApi",
        api_key_id: "22222222-2222-2222-2222-222222222222",
        portfolio_name: "Main Portfolio",
        portfolio_uuid: "33333333-3333-3333-3333-333333333333",
      }),
      hmacKey.setProperties({
        kind: "BybitApi",
        api_key: "secret",
      }),
    ]);
  });

  afterAll(async () => {
    await deleteKeys(createdKeys);
  });

  /**
   * @param resp The response to check
   * @param code The error code to expect
   * @returns The original error
   */
  function assertDryRunResp(
    resp: CubeSignerResponse<JsonRpcResponse>,
    code: schemas["AcceptedValueCode"],
  ): ErrorResponse {
    assert(resp.isSuccess(), "JSON RPC endpoint always returns 200 Ok");
    const data = resp.data();
    expect(data).to.not.be.undefined;
    expect(data.result).to.be.undefined;
    assert(data.error);
    const error = data.error.data as ErrorResponse;
    console.log(error);
    expect(error.error_code).to.eq(code);
    assert(error.accepted);
    return error;
  }

  /**
   * @param resp The response to assert is a "BinanceDryRun"
   * @returns The "BinanceDryRun" response properties
   */
  function assertBinanceDryRunResp(resp: CubeSignerResponse<JsonRpcResponse>): BinanceDryRun {
    const error = assertDryRunResp(resp, "BinanceDryRun");
    assert(error.accepted);
    assert(error.accepted.BinanceDryRun);
    return error.accepted.BinanceDryRun;
  }

  /**
   * @param resp The response to assert is a "BybitDryRun"
   * @returns The "BybitDryRun" response properties
   */
  function assertBybitDryRunResp(resp: CubeSignerResponse<JsonRpcResponse>): BybitDryRun {
    const error = assertDryRunResp(resp, "BybitDryRun");
    assert(error.accepted);
    assert(error.accepted.BybitDryRun);
    return error.accepted.BybitDryRun;
  }

  /**
   * @param resp The response to assert is a "CoinbaseDryRun"
   * @returns The "CoinbaseDryRun" response properties
   */
  function assertCoinbaseDryRunResp(resp: CubeSignerResponse<JsonRpcResponse>): CoinbaseDryRun {
    const error = assertDryRunResp(resp, "CoinbaseDryRun");
    assert(error.accepted);
    assert(error.accepted.CoinbaseDryRun);
    return error.accepted.CoinbaseDryRun;
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
      responses.forEach(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
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
        .then(assertBinanceDryRunResp);
    });

    it("deposit", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceDeposit",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
            coin: "USDT",
          },
        })
        .then(assertBinanceDryRunResp);
    });

    it("list sub-accounts", async () => {
      await client.apiClient
        .rpc({
          method: "cs_binanceListSubAccounts",
          params: {
            keyId: masterAccKey.id,
            dryRun: "NO_SUBMIT",
          },
        })
        .then(assertBinanceDryRunResp);
    });

    it("coin info", async () => {
      const responses = await Promise.all(
        [masterAccKey, subAccKey].map((key) =>
          client.apiClient.rpc({
            method: "cs_binanceCoinInfo",
            params: {
              keyId: key.id,
              dryRun: "NO_SUBMIT",
            },
          }),
        ),
      );
      responses.forEach(assertBinanceDryRunResp);
    });
  });

  describe("bybit", () => {
    it("user info", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitQueryUser",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("coin balance", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitQueryCoinsBalance",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
          coin: "USDT",
          accountType: "FUND",
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("deposit address", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitQueryDepositAddress",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
          coin: "USDT",
          chainType: "ETH",
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("sub members", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitQuerySubMembers",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("transfer", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitUniversalTransfer",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
          amount: "1.23",
          coin: "USDT",
          fromMemberId: 123,
          toMemberId: 456,
          transferId: randomUUID(),
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("withdraw", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitWithdraw",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
          amount: "1.23",
          coin: "USDT",
          chain: "ETH",
          address: "0x0000000000000000000000000000000000000000",
          requestId: randomUUID(),
        },
      });
      assertBybitDryRunResp(resp);
    });

    it("withdrawals", async () => {
      const resp = await client.apiClient.rpc({
        method: "cs_bybitWithdrawals",
        params: {
          keyId: hmacKey.id,
          dryRun: "NO_SUBMIT",
        },
      });
      assertBybitDryRunResp(resp);
    });
  });

  describe("coinbase", () => {
    it("list accounts", async () => {
      await client.apiClient
        .rpc({
          method: "cs_coinbaseListAccounts",
          params: {
            key_id: coinbaseKey.id,
            dry_run: "NO_SUBMIT",
          },
        })
        .then(assertCoinbaseDryRunResp);
    });

    it("list portfolios", async () => {
      await client.apiClient
        .rpc({
          method: "cs_coinbaseListPortfolios",
          params: {
            key_id: coinbaseKey.id,
            dry_run: "NO_SUBMIT",
            portfolio_type: "DEFAULT",
          },
        })
        .then(assertCoinbaseDryRunResp);
    });

    it("move funds", async () => {
      await client.apiClient
        .rpc({
          method: "cs_coinbaseMoveFunds",
          params: {
            key_id: coinbaseKey.id,
            dry_run: "NO_SUBMIT",
            funds: { currency: "USDT", value: "10" },
            source_portfolio_uuid: "00000000-0000-0000-0000-000000000000",
            target_portfolio_uuid: "11111111-1111-1111-1111-111111111111",
          },
        })
        .then(assertCoinbaseDryRunResp);
    });
  });
});
