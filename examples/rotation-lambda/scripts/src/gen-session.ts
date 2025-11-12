import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as csSm from "@cubist-labs/cubesigner-sdk-secretsmanager-storage";
import outputs from '../../cdk/outputs.json';

/**
 * Creates a new session and stores it in the secret created by CDK
 */
async function main() {
  const secretId = outputs.RotationLambdaStack.CubeSignerSessionArn;
  const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
  // NOTE: When adapting this example to your code base, create a session with only the strictly
  // necessary scopes
  const session = await client.org().createSession(
    "Secrets Manager example",
    ["manage:*"],
    {
      auth: 8 * 60 * 60, // 8 hours
    }
  );

  // Write session to AWS Secret Manager
  await new csSm.AwsSecretManager(secretId).update(session);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
