import {
  GetSecretValueCommand,
  SecretsManager,
  UpdateSecretCommand,
} from "@aws-sdk/client-secrets-manager";
import { mockClient } from "aws-sdk-client-mock";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as csSm from "@cubist-labs/cubesigner-sdk-secretsmanager-storage";

describe("AwsSecretsSessionManager", () => {
  const secretArn: string = "MockSecret";
  let session: cs.SessionData;

  beforeAll(async () => {
    // Simple mock implementation of AWS Secrets Manager
    const smMock = mockClient(SecretsManager);
    const secrets: Record<string, string> = {};
    smMock.on(GetSecretValueCommand).callsFake((input) => {
      return {
        SecretString: secrets[input.SecretId],
      };
    });
    smMock.on(UpdateSecretCommand).callsFake((input) => {
      secrets[input.SecretId] = input.SecretString;
    });

    // Create temporary session without a grace period
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    session = await client.org().createSession("test", ["manage:org:user:get"], {
      grace: 0,
    });

    // Write session to secret
    await new csSm.AwsSecretManager(secretArn).update(session);
  });

  it("Basic functionality", async () => {
    const sessionMgr = new csSm.AwsSecretSessionManager(secretArn, {
      checkScheduledRotation: false,
    });
    const client = await cs.CubeSignerClient.create(sessionMgr);

    {
      // Check that token works
      const user = await client.user();
      const orgIds = user.orgs.map((o) => o.org_id);
      expect(orgIds).toContain(session.org_id);
    }

    const manager = new csSm.AwsSecretManager(secretArn);
    // Change the secret
    await manager.refresh();
    // Refresh again to advance ratchet
    await manager.refresh();

    {
      // Check that the new secret is retrieved
      const user = await client.user();
      const orgIds = user.orgs.map((o) => o.org_id);
      expect(orgIds).toContain(session.org_id);
    }

    // Refresh changes session data
    const tokenBefore = await sessionMgr.token();
    await manager.refresh();
    sessionMgr.onInvalidToken();
    const tokenAfter = await sessionMgr.token();
    expect(tokenBefore).not.toBe(tokenAfter);
  });
});
