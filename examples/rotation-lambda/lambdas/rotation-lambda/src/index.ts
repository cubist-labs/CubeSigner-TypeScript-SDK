import * as csSm from "@cubist-labs/cubesigner-sdk-secretsmanager-storage";

/** The type of the event that a rotation lambda receives */
type RotationEvent = {
  Step: string;
  SecretId: string;
  ClientRequestToken: string;
};

/** The type of a lambda handler */
type Handler = (event: RotationEvent, _context: unknown) => Promise<void>;

/**
 * The lambda handler
 *
 * @param event The event being processed
 * @param _context Ignored
 */
export const handler: Handler = async (event: RotationEvent, _context) => {
  // On each rotation, the lambda is called four times. Rotate only on the first call (createSecret).
  if (event.Step != "createSecret") {
    return;
  }

  console.log(`Refreshing for request-token ${event.ClientRequestToken}`);
  await new csSm.AwsSecretManager(event.SecretId).refresh();
  console.log("done");
};
