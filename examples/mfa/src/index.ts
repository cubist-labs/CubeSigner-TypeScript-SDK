import {
  CubeSigner,
  EvmSignRequest,
  MemorySessionStorage,
  MfaReceipt,
  MfaRequestInfo,
  SignerSession,
  SignerSessionManager,
} from "@cubist-labs/cubesigner-sdk";
import assert from "assert";
import clc from "cli-color";
import { program as cli } from "commander";
import * as dotenv from "dotenv";

dotenv.config();

const ORG_ID = env("CUBE_SIGNER_ORG_ID");

/** Use this for all signing operations */
async function loadRoleSession(): Promise<SignerSession> {
  const token = env("CUBE_SIGNER_ROLE_TOKEN")!;
  const storage = new MemorySessionStorage(JSON.parse(atob(token)));
  const sessionMgr = await SignerSessionManager.loadFromStorage(storage);
  return new SignerSession(sessionMgr);
}

/** Use this for all management operations, e.g., listing/approving MFA requests */
async function loadUserSession(): Promise<CubeSigner> {
  const token = env("CUBE_SIGNER_USER_TOKEN")!;
  const storage = new MemorySessionStorage(JSON.parse(atob(token)));
  const sessionMgr = await SignerSessionManager.loadFromStorage(storage);
  return new CubeSigner({ sessionMgr });
}

/**
 * List all pending MFA requests accessible to the current user
 * @param {CubeSigner} cs CubeSigner management session
 * @return {Promise<MfaRequestInfo[]>} Pending MFA requests
 */
async function mfaList(cs: CubeSigner): Promise<MfaRequestInfo[]> {
  return await cs.mfaList(ORG_ID);
}

/**
 * Finds a pending MFA request by its id.
 *
 * @param {CubeSigner} cs CubeSigner management session
 * @param {string} mfaId MFA request id
 * @return {Promise<MfaRequestInfo>} The MFA request
 */
async function mfaFind(cs: CubeSigner, mfaId: string): Promise<MfaRequestInfo> {
  const mfaRequests = await mfaList(cs);
  const req = mfaRequests.find((m) => m.id === mfaId);
  if (!req) {
    throw new Error(`No MFA request '${mfaId}' found`);
  }
  return req;
}

/** Script entry point. */
async function main() {
  cli
    .name("mfa-cs")
    .version("0.0.1")
    .description("MFA demo using CubeSigner")
    .addHelpText(
      "after",
      () => `
${clc.bold.blue("Required Environment")}:
  CUBE_SIGNER_USER_TOKEN:       base64-encoded CubeSigner management token
  CUBE_SIGNER_ROLE_TOKEN:       base64-encoded CubeSigner role token
`,
    );

  cli
    .command("keys")
    .description("list keys in the current role")
    .action(async () => {
      const ss = await loadRoleSession();
      const keys = await ss.keys();
      const keyIds = keys.map((k) => k.materialId);
      console.log(JSON.stringify(keyIds, undefined, 2));
    });

  cli
    .command("sign-tx")
    .description("Sign an EVM transaction (MFA may be required)")
    .option("-k, --key <KEY_ID>", "key to use")
    .action(async (args) => {
      const ss = await loadRoleSession();
      assert(args.key);
      const resp = await ss.signEvm(args.key, {
        chain_id: 5,
        tx: {
          type: "0x00",
          gas: "0x61a80",
          gasPrice: "0x77359400",
          nonce: "0",
        },
      } as unknown as EvmSignRequest);

      if (resp.requiresMfa()) {
        console.log(resp.mfaId());
      } else {
        console.log(resp.data());
      }
    });

  cli
    .command("mfa-list")
    .description("print pending MFA requests")
    .action(async () => {
      const cs = await loadUserSession();
      const mfaRequests = await cs.mfaList(ORG_ID);
      console.log(JSON.stringify(mfaRequests, undefined, 2));
    });

  cli
    .command("mfa-approve <mfa-id>")
    .description("approve pending MFA request")
    .action(async (mfaId) => {
      const cs = await loadUserSession();
      const requestToApprove = await mfaFind(cs, mfaId);
      mfaId = requestToApprove.id;
      console.log(`Approving '${mfaId}'`);
      const mfa = await cs.mfaApprove(ORG_ID, mfaId);
      console.log(JSON.stringify(mfa, undefined, 2));
    });

  cli
    .command("mfa-resume <mfa-id>")
    .description("Resume previous 'sign-tx' request that has been approved since")
    .action(async (mfaId) => {
      const cs = await loadUserSession();
      const mfaRequest = await mfaFind(cs, mfaId);
      if (!mfaRequest.receipt) {
        throw new Error(`MFA request '${mfaRequest.id}' has not been approved yet`);
      }
      const ss = await loadRoleSession();
      const key = mfaRequest.request.path.split("/").at(-1)!;
      const tx = mfaRequest.request.body as unknown as EvmSignRequest;
      const mfaReceipt = <MfaReceipt>{
        mfaId: mfaRequest.id,
        mfaOrgId: ORG_ID,
        mfaConf: mfaRequest.receipt?.confirmation,
      };
      console.log("Signing tx", tx);
      const resp = await ss.signEvm(key, tx, mfaReceipt);
      if (resp.requiresMfa()) {
        console.log(`MFA required: ${resp.mfaId()}`);
      } else {
        console.log(resp.data());
      }
    });

  await cli.parseAsync();
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});

/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string): string {
  const val = process.env[name];
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
