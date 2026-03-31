import type {
  EvmSignRequest
} from "@cubist-labs/cubesigner-sdk";
import {
  CubeSignerClient
} from "@cubist-labs/cubesigner-sdk";
import assert from "assert";
import clc from "cli-color";
import { program as cli } from "commander";
import * as dotenv from "dotenv";

dotenv.config();

/** @returns A client to use for all signing operations */
async function loadRoleClient(): Promise<CubeSignerClient> {
  const token = env("CUBE_SIGNER_ROLE_TOKEN")!;
  return CubeSignerClient.create(token);
}

/** @returns A client to use for all management operations, e.g., listing/approving MFA requests */
async function loadUserClient(): Promise<CubeSignerClient> {
  const token = env("CUBE_SIGNER_USER_TOKEN")!;
  return CubeSignerClient.create(token);
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
      const ss = await loadRoleClient();
      const keys = await ss.sessionKeys();
      const keyIds = keys.map((k) => k.materialId);
      console.log(JSON.stringify(keyIds, undefined, 2));
    });

  cli
    .command("sign-tx")
    .description("Sign an EVM transaction (MFA may be required)")
    .option("-k, --key <MATERIAL_ID>", "key to use")
    .action(async (args) => {
      const ss = await loadRoleClient();
      assert(args.key);
      const resp = await ss.apiClient.signEvm(args.key, {
        chain_id: 5,
        tx: {
          type: "0x00",
          gas: "0x61a80",
          gasPrice: "0x77359400",
          nonce: "0",
        },
      });

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
      const client = await loadUserClient();
      const mfaRequests = await client.org().mfaRequests();
      const mfaInfos = await Promise.all(mfaRequests.map((m) => m.fetch()));
      console.log(JSON.stringify(mfaInfos, undefined, 2));
    });

  cli
    .command("mfa-approve <mfa-id>")
    .description("approve pending MFA request")
    .action(async (mfaId) => {
      const client = await loadUserClient();
      console.log(`Approving '${mfaId}'`);
      const mfa = await client.org().getMfaRequest(mfaId).approve();
      console.log(JSON.stringify(mfa, undefined, 2));
    });

  cli
    .command("mfa-resume <mfa-id>")
    .description("Resume previous 'sign-tx' request that has been approved since")
    .action(async (mfaId) => {
      const client = await loadUserClient();
      const mfaRequest = client.org().getMfaRequest(mfaId);
      const ss = await loadRoleClient();
      const request = await mfaRequest.request();
      const materialId = request.path.split("/").at(-1)!;
      const tx = request.body as unknown as EvmSignRequest;
      const mfaReceipt = await mfaRequest.receipt();
      console.log("Signing tx", tx);
      const resp = await ss.apiClient.signEvm(materialId, tx, mfaReceipt);
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
 *
 * @param name The name of the environment variable.
 * @returns The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name: string): string {
  const val = process.env[name];
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
