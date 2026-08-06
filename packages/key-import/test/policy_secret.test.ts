import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";

import { assert } from "chai";
import { encryptPolicySecret } from "../src/index";

describe("Policy Secrets", () => {
  let client: cs.CubeSignerClient;
  let org: cs.Org;
  let user: cs.UserInfo;
  const secretName = `test_secret_${Math.floor(Math.random() * 10000000)}`;

  beforeAll(async () => {
    const session = csFs.defaultManagementSessionManager();
    client = await cs.CubeSignerClient.create(session);
    org = client.org();
    user = await client.user();
  });

  it("encrypt and set a policy secret with MFA", async () => {
    const editPolicy: cs.EditPolicy = {
      applies_to_scopes: {
        AllOf: ["manage:policy:secrets:update:values"] satisfies cs.ExplicitScope[],
      },
      mfa: {
        allowed_approvers: [user.user_id],
        allowed_mfa_types: ["CubeSigner"],
      },
    };
    const respUpdate = await client.apiClient.policySecretsUpdate({
      edit_policy: editPolicy,
    });
    expect(respUpdate.isSuccess()).toBe(true);

    // Try setting the secret and get MFA required response
    const { value, importKey } = await encryptPolicySecret(client.apiClient, "test_value");
    const setReq = {
      value,
      import_key: importKey,
    };
    const mfaResp = await client.apiClient.policySecretSet(secretName, setReq);
    expect(mfaResp.requiresMfa()).toBe(true);

    // Approve the MFA request
    const mfaId = mfaResp.mfaId();
    assert(mfaId !== undefined);
    const mfaReceipt = await org
      .getMfaRequest(mfaId)
      .approve()
      .then((x) => x.receipt());

    // Set the secret value with the MFA receipt
    const resp = await client.apiClient.policySecretSet(secretName, setReq, mfaReceipt);
    expect(resp.isSuccess()).toBe(true);

    // Check that the secret is now listed
    const { secrets } = await client.apiClient.policySecretsGet();
    expect(secrets.map((s: { name: string }) => s.name)).toContain(secretName);
  });

  afterAll(async () => {
    // Remove the edit policy *before* deleting the secret, so we don't get an MFA prompt on cleanup
    const respUpdate = await client.apiClient.policySecretsUpdate({
      edit_policy: {},
    });
    expect(respUpdate.isSuccess()).toBe(true);

    const { secrets } = await client.apiClient.policySecretsGet();
    if (secrets.some((s) => s.name === secretName)) {
      const resp = await client.apiClient.policySecretDelete(secretName);
      expect(resp.isSuccess()).toBe(true);
    }
  });
});
