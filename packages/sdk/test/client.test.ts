import { expect } from "chai";
import { CubeSignerClient } from "../src/client";
import type { EnvInterface } from "../src/env";
import type { SessionData } from "../src/client/session";

const primaryEnv: EnvInterface = {
  Region: "us-east-1",
  SignerApiRoot: "https://legitimate.cubesigner.invalid",
  OrgEventsTopicArn: "arn:aws:sns:us-east-1:123456789012:OrgEvents",
};

const regionalEnv: EnvInterface = {
  Region: "eu-west-1",
  SignerApiRoot: "https://eu-west-1.legitimate.cubesigner.invalid",
  OrgEventsTopicArn: "arn:aws:sns:eu-west-1:123456789012:OrgEvents",
};

const session: SessionData = {
  org_id: "org-test",
  token: "test-session-token",
  refresh_token: "test-refresh-token",
  session_info: {
    auth_token: "test-session-token",
    auth_token_exp: 4_102_444_800,
    epoch: 0,
    epoch_token: "test-epoch-token",
    refresh_token: "test-refresh-token",
    refresh_token_exp: 4_102_444_800,
    session_id: "session-test",
  },
  session_exp: 4_102_444_800,
  env: {
    "Dev-CubeSignerStack": primaryEnv,
  },
  other_envs: {
    "eu-west-1": regionalEnv,
  },
};

describe("CubeSignerClient preferred environment validation", () => {
  it("accepts preferred environments from session metadata", async () => {
    const client = await CubeSignerClient.create(session);
    const preferred = { ...regionalEnv };

    const regionalClient = client.withPreferredEnv(preferred);

    expect(regionalClient.env).to.deep.eq(preferred);
  });

  it("rejects preferred environments absent from session metadata", async () => {
    const client = await CubeSignerClient.create(session);
    const attackerEnv: EnvInterface = {
      Region: "us-east-1",
      SignerApiRoot: "https://attacker.invalid",
      OrgEventsTopicArn: primaryEnv.OrgEventsTopicArn,
    };

    expect(() => client.withPreferredEnv(attackerEnv)).to.throw(
      "The current session does not allow the 'https://attacker.invalid' environment",
    );
  });
});
