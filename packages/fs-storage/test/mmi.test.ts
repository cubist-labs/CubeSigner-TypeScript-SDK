import { expect } from "chai";
import TYPED_DATA_JSON from "../../../assets/typed_data_example.json";
import type {
  Key,
  Org,
  MmiJrpcMethod,
  PendingMessageInfo,
  JsonArray,
} from "@cubist-labs/cubesigner-sdk";
import {
  AllowEip191Signing,
  AllowEip712Signing,
  CubeSignerClient,
  Secp256k1,
} from "@cubist-labs/cubesigner-sdk";
import { loadCognitoOidcToken, newCubeSigner } from "./setup";

// NOTE: this env var name has to be the same as the one used in 'test-ts-sdk' GH action in the CubeSigner repo
const ANKR_RPC_API_KEY = process.env.ANKR_RPC_API_KEY ?? "";

/**
 * Makes an MMI JSON RPC call and checks that it succeeded before returning the result.
 *
 * @param client The CubeSigner client.
 * @param method The name of the method to call.
 * @param params The method parameters.
 * @returns The result.
 */
async function mmiJsonRpcCall(
  client: CubeSignerClient,
  method: MmiJrpcMethod,
  params: JsonArray,
): Promise<unknown> {
  const resp = await client.apiClient.mmi(method, params);
  expect(resp).to.exist;
  expect(resp.id).to.eq(1);
  expect(resp.jsonrpc).to.eq("2.0");
  expect(resp.error).to.be.undefined;
  expect(resp.result).to.exist;
  return resp.result;
}

/**
 * Assert that a message with the given id exists and is in "Pending" status.
 *
 * @param client The CubeSigner client.
 * @param messageId the id of the message to check.
 * @returns the pending message info.
 */
async function assertPendingMessage(
  client: CubeSignerClient,
  messageId: string,
): Promise<PendingMessageInfo> {
  const messages = await client.apiClient.mmiList();
  expect(messages.length).to.be.greaterThanOrEqual(1);
  let message = messages.find(
    (msg) => msg.signedMessage?.id === messageId || msg.transaction?.id === messageId,
  );
  expect(message).to.exist;
  message = message!;
  let status = message.signedMessage?.status ?? message.transaction?.status;
  expect(status).to.exist;
  status = status!;
  expect(status.finished).to.be.false;
  expect(status.signed).to.be.false;
  expect(status.submitted).to.be.false;
  expect(status.success).to.be.false;
  expect(status.displayText).to.eq("Pending");
  return message;
}

/**
 * Reject the given message and assert that it was rejected.
 *
 * @param client the CubeSigner client
 * @param messageId the ID of the message to check
 */
async function assertRejectingMessage(client: CubeSignerClient, messageId: string) {
  // Reject it
  let message = await client.apiClient.mmiReject(messageId);
  expect(message.signedMessage ?? message.transaction).to.exist;
  let status = message.signedMessage?.status ?? message.transaction?.status;
  expect(status).to.exist;
  expect(status!.displayText).to.eq("Rejected");

  // Check that it was rejected
  message = await client.apiClient.mmiGet(messageId);
  expect(message.signedMessage ?? message.transaction).to.exist;
  status = message.signedMessage?.status ?? message.transaction?.status;
  expect(status).to.exist;
  const { displayText, finished, signed, submitted, success } = status!;
  expect(finished).to.be.true;
  expect(signed).to.be.false;
  expect(submitted).to.be.false;
  expect(success).to.be.false;
  expect(displayText).to.eq("Rejected");
}

describe("Mmi/CubeSignerClient", () => {
  let org: Org;
  let client: CubeSignerClient;
  const keys: Key[] = [];
  const createdMessages: string[] = [];

  beforeAll(async () => {
    // just to get 'env' and 'orgId'
    const cs = await newCubeSigner();

    // create a new almighty session with all the scopes
    const oidcToken = await loadCognitoOidcToken();
    const sessionData = await CubeSignerClient.createOidcSession(cs.env, cs.orgId, oidcToken, [
      "mmi:*",
      "sign:*",
      "manage:*",
    ]);
    client = await CubeSignerClient.create(sessionData.data());
    org = client.org();

    keys.push(
      await org.createKey(Secp256k1.Evm, undefined, {
        metadata: "MMI Test Key #1",
        policy: [AllowEip191Signing, AllowEip712Signing] as unknown as Record<string, never>[],
      }),
    );
    keys.push(
      await org.createKey(Secp256k1.Evm, undefined, {
        metadata: "MMI Test Key #2",
      }),
    );
  });

  afterAll(async () => {
    for (const key of keys) {
      console.log(`Deleting ${key.id}`);
      await key.delete();
    }

    for (const msg of createdMessages) {
      console.log(`Deleting ${msg}`);
      await client.apiClient.mmiDelete(msg);
    }

    await client.revokeSession();
  });

  it("sign message", async () => {
    // First, we need a pending message to sign
    const messageId = await mkMessage();

    // Next, list the messages to check that it exists and is not signed
    const message = await assertPendingMessage(client, messageId);

    // Finally, sign the message and check that it is signed
    const data = (await client.apiClient.signMmi(message)).data();
    expect(data.signedMessage).to.exist;
    const signedMessage = data.signedMessage!;
    expect(signedMessage.status.signed).to.be.true;
  });

  it("sign typed data", async () => {
    // First, we need a pending message to sign
    const messageId = await mkTypedData();

    // Next, list the messages to check that it exists and is not signed
    const message = await assertPendingMessage(client, messageId);

    // Finally, sign the message and check that it is signed
    const data = (await client.apiClient.signMmi(message)).data();
    expect(data.signedMessage).to.exist;
    const signedMessage = data.signedMessage!;
    expect(signedMessage.status.signed).to.be.true;
  });

  it("sign transaction", async () => {
    if (!ANKR_RPC_API_KEY) return;

    // First, we need a transaction to sign
    const messageId = await mkTransaction();

    // Next, list the messages to check that it exists and is not signed
    const message = await assertPendingMessage(client, messageId);

    // Finally, sign the message and check that it is signed
    const data = (await client.apiClient.signMmi(message)).data();
    expect(data.transaction).to.exist;
    const tx = data.transaction!;
    expect(tx.status.signed).to.be.true;
  });

  it("reject transaction", async () => {
    // Create the transaction
    const messageId = await mkTransaction();
    await assertPendingMessage(client, messageId);
    await assertRejectingMessage(client, messageId);
  });

  it("reject message", async () => {
    // Create the transaction
    const messageId = await mkMessage();
    await assertPendingMessage(client, messageId);
    await assertRejectingMessage(client, messageId);
  });

  it("reject typed data", async () => {
    // Create the transaction
    const messageId = await mkTypedData();
    await assertPendingMessage(client, messageId);
    await assertRejectingMessage(client, messageId);
  });

  const mkTransaction = async () => {
    const messageId = (await mmiJsonRpcCall(client, "custodian_createTransaction", [
      {
        from: keys[0].materialId,
        to: keys[1].materialId,
        type: "0x2",
        value: "0x1",
        gas: "0x5208",
        maxFeePerGas: "0x59682f0e",
        maxPriorityFeePerGas: "0x59682f0e",
      },
      {
        chainId: "0xA869",
        originUrl: "https://www.example.com",
        note: "This is a note to trader",
        transactionCategory: "simpleTransfer",
        custodianPublishesTransaction: false,
        rpcUrl: `https://rpc.ankr.com/avalanche_fuji/${ANKR_RPC_API_KEY}`,
      },
    ])) as string;
    console.log(`Created message with ID ${messageId}`);
    createdMessages.push(messageId);
    return messageId;
  };

  const mkTypedData = async () => {
    const messageId = (await mmiJsonRpcCall(client, "custodian_signTypedData", [
      {
        address: keys[0].materialId,
        data: {
          message: TYPED_DATA_JSON.data,
          ...TYPED_DATA_JSON,
        },
        version: "v4",
      },
      {
        chainId: "0x1",
        originUrl: "https://www.example.com",
        note: "sign typed data for testing",
      },
    ])) as string;
    console.log(`Created message with ID ${messageId}`);
    createdMessages.push(messageId);

    return messageId;
  };

  const mkMessage = async () => {
    const messageId = (await mmiJsonRpcCall(client, "custodian_sign", [
      {
        address: keys[0].materialId,
        message: "0x48656c6c6f20776f726c64",
      },
      {
        chainId: "0x4",
        originUrl: "https://www.example.com",
        note: "personal_sign message",
      },
    ])) as string;
    console.log(`Created message with ID ${messageId}`);
    createdMessages.push(messageId);

    return messageId;
  };
});
