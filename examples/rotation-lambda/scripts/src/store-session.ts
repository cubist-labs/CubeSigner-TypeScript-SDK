import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as csSm from "@cubist-labs/cubesigner-sdk-secretsmanager-storage";
import outputs from "../../cdk/outputs.json";
import assert from "node:assert";

/**
 * Loads a session file, asserts it has the minimum lifetimes necessary, and
 * stores it in the secret created by CDK
 */
async function main() {
  const secretId = outputs.RotationLambdaStack.CubeSignerSessionArn;

  // NOTE: make sure the session in 'session.json' has only the strictly necessary scopes
  const manager = new csFs.JsonFileSessionManager("../session.json");
  const client = await cs.CubeSignerClient.create(manager);

  // The shortest AWS secret rotation period is 4 hours, so the stored
  // session's auth and refresh lifetimes must be at minimum 4 hours.
  // (Otherwise, the session can expire before AWS refreshes it!)
  const lifetimes = await client.getSession().then((s) => s.lifetimes);
  assert(
    lifetimes?.auth_lifetime !== undefined && lifetimes.refresh_lifetime !== undefined,
    "Could not retrieve session lifetime information",
  );
  const FOUR_HOURS_SEC = 4 * 60 * 60;

  assert(
    lifetimes.auth_lifetime >= FOUR_HOURS_SEC,
    `Authentication lifetime must be at minimum 4 hours due to AWS Secrets Manager's minimum rotation period (got ${lifetimes.auth_lifetime}s)`,
  );
  assert(
    lifetimes.refresh_lifetime >= FOUR_HOURS_SEC,
    `Refresh lifetime must be at minimum 4 hours due to AWS Secrets Manager's minimum rotation period (got ${lifetimes.refresh_lifetime}s)`,
  );

  // Write session to AWS Secrets Manager
  const sessionData = await manager.retrieve();
  await new csSm.AwsSecretManager(secretId).update(sessionData);
  console.log(`Session stored in secret '${secretId}'`);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
