import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csSm from "@cubist-labs/cubesigner-sdk-secretsmanager-storage";
import outputs from '../../cdk/outputs.json';

/**
 * Uses the session stored in the secret created by CDK
 */
async function main() {
  const secretId = outputs.RotationLambdaStack.CubeSignerSessionArn;
  const client = await cs.CubeSignerClient.create(new csSm.AwsSecretSessionManager(secretId));
  const user = await client.user();
  console.log(user.orgs);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
