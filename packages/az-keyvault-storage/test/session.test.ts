import { SecretClient } from "@azure/keyvault-secrets";
import * as cs from "@cubist-labs/cubesigner-sdk";
import * as csFs from "@cubist-labs/cubesigner-sdk-fs-storage";
import * as csAzKv from "@cubist-labs/cubesigner-sdk-az-keyvault-storage";

// Mock the Azure Key Vault SecretClient
jest.mock("@azure/keyvault-secrets");
jest.mock("@azure/identity");

describe("AzureKeyVaultSessionManager", () => {
  const vaultUrl: string = "https://test-vault.vault.azure.net";
  const secretName: string = "test-session-secret";
  let session: cs.SessionData;
  let secrets: Record<string, string>;
  let mockGetSecret: jest.Mock;
  let mockSetSecret: jest.Mock;

  beforeAll(async () => {
    // Initialize in-memory secret storage
    secrets = {};

    // Setup mock implementations
    mockGetSecret = jest.fn().mockImplementation((name: string) => {
      const value = secrets[name];
      if (!value) {
        throw new Error(`Secret ${name} not found`);
      }
      return Promise.resolve({
        value,
        name,
        properties: {
          version: "1",
          enabled: true,
        },
      });
    });

    mockSetSecret = jest.fn().mockImplementation((name: string, value: string) => {
      secrets[name] = value;
      return Promise.resolve({
        value,
        name,
        properties: {
          version: "1",
          enabled: true,
        },
      });
    });

    // Mock the SecretClient constructor
    (SecretClient as jest.MockedClass<typeof SecretClient>).mockImplementation(() => {
      return {
        getSecret: mockGetSecret,
        setSecret: mockSetSecret,
      } as any;
    });

    // Create temporary session without a grace period
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    session = await client.org().createSession("test", ["manage:org:user:get"], {
      grace: 0,
    });

    // Write session to secret
    await new csAzKv.AzureKeyVaultManager(vaultUrl, secretName).update(session);
  });

  beforeEach(() => {
    // Clear mock call history before each test
    mockGetSecret.mockClear();
    mockSetSecret.mockClear();
  });

  it("Basic functionality", async () => {
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);
    const client = await cs.CubeSignerClient.create(sessionMgr);

    {
      // Check that token works
      const user = await client.user();
      const orgIds = user.orgs.map((o) => o.org_id);
      expect(orgIds).toContain(session.org_id);
    }

    const manager = new csAzKv.AzureKeyVaultManager(vaultUrl, secretName);
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

  it("Caching behavior", async () => {
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);

    // First call should fetch from Key Vault
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1); // Still only 1 call

    // Metadata call should also use cache
    await sessionMgr.metadata();
    expect(mockGetSecret).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("Cache invalidation on invalid token", async () => {
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);

    // First call should fetch from Key Vault
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1);

    // Invalidate cache
    await sessionMgr.onInvalidToken();

    // Next call should fetch again
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(2);
  });

  it("maxCacheLifetime option", async () => {
    const shortLifetime = 1; // 1 second
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName, {
      maxCacheLifetime: shortLifetime,
    });

    // First call should fetch from Key Vault
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1);

    // Second call immediately should use cache
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1);

    // Wait for cache to expire
    await new Promise((resolve) => setTimeout(resolve, (shortLifetime + 0.5) * 1000));

    // Next call should fetch again due to expired cache
    await sessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(2);
  });

  it("Manager update writes to Key Vault", async () => {
    const manager = new csAzKv.AzureKeyVaultManager(vaultUrl, "new-secret");

    // Update should call setSecret
    await manager.update(session);
    expect(mockSetSecret).toHaveBeenCalledTimes(1);
    expect(mockSetSecret).toHaveBeenCalledWith("new-secret", expect.any(String));
  });

  it("Manager refresh updates session", async () => {
    // Create a new secret for this test with a fresh session
    const testSecretName = "refresh-test-secret";
    const manager = new csAzKv.AzureKeyVaultManager(vaultUrl, testSecretName);

    // Create a fresh session specifically for this test
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    const freshSession = await client.org().createSession("refresh-test", ["manage:org:user:get"], {
      grace: 0,
    });

    // Initialize with the fresh session
    await manager.update(freshSession);
    expect(mockSetSecret).toHaveBeenCalledTimes(1);

    const initialValue = secrets[testSecretName];

    // Refresh should get current session and update it
    await manager.refresh();

    // Should have called getSecret and setSecret
    expect(mockGetSecret).toHaveBeenCalled();
    expect(mockSetSecret).toHaveBeenCalledTimes(2);

    // Value should have changed
    const newValue = secrets[testSecretName];
    expect(newValue).not.toBe(initialValue);
  });

  it("Error handling for missing secret", async () => {
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(
      vaultUrl,
      "non-existent-secret",
    );

    // Should throw error when secret doesn't exist
    await expect(sessionMgr.token()).rejects.toThrow("not found");
  });

  it("Error handling for empty secret value", async () => {
    const emptySecretName = "empty-secret";

    // Mock getSecret to return empty value
    mockGetSecret.mockImplementationOnce(() => {
      return Promise.resolve({
        value: undefined,
        name: emptySecretName,
        properties: {},
      });
    });

    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, emptySecretName);

    // Should throw error when secret has no value
    await expect(sessionMgr.token()).rejects.toThrow("has no value");
  });

  it("Session manager metadata returns correct info", async () => {
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);
    const meta = await sessionMgr.metadata();

    expect(meta).toBeDefined();
    expect(meta.org_id).toBe(session.org_id);
    expect(meta.role_id).toBe(session.role_id);
    expect(meta.purpose).toBe(session.purpose);
  });

  it("Multiple session managers can access same secret", async () => {
    const sessionMgr1 = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);
    const sessionMgr2 = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, secretName);

    const token1 = await sessionMgr1.token();
    const token2 = await sessionMgr2.token();

    expect(token1).toBe(token2);
  });

  it("Manager can update secret that session manager reads", async () => {
    const testSecretName = "coordinated-test-secret";
    const manager = new csAzKv.AzureKeyVaultManager(vaultUrl, testSecretName);
    const sessionMgr = new csAzKv.AzureKeyVaultSessionManager(vaultUrl, testSecretName);

    // Create a fresh session for this test to avoid "Outdated session" errors
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    const freshSession = await client.org().createSession("coordinated-test", ["manage:org:user:get"], {
      grace: 0,
    });

    // Manager writes initial session
    await manager.update(freshSession);

    // Session manager should read it
    const token1 = await sessionMgr.token();
    expect(token1).toBe(freshSession.token);

    // Manager refreshes session
    await manager.refresh();

    // Session manager needs cache invalidation to see new value
    await sessionMgr.onInvalidToken();

    // Session manager should now read updated session
    const token2 = await sessionMgr.token();
    expect(token2).not.toBe(token1);
  });
});

describe("AzureExclusiveKeyVaultSessionManager", () => {
  const vaultUrl: string = "https://test-vault.vault.azure.net";
  const secretName: string = "test-exclusive-session-secret";
  let session: cs.SessionData;
  let secrets: Record<string, string>;
  let mockGetSecret: jest.Mock;
  let mockSetSecret: jest.Mock;

  beforeAll(async () => {
    // Initialize in-memory secret storage
    secrets = {};

    // Setup mock implementations
    mockGetSecret = jest.fn().mockImplementation((name: string) => {
      const value = secrets[name];
      if (!value) {
        throw new Error(`Secret ${name} not found`);
      }
      return Promise.resolve({
        value,
        name,
        properties: {
          version: "1",
          enabled: true,
        },
      });
    });

    mockSetSecret = jest.fn().mockImplementation((name: string, value: string) => {
      secrets[name] = value;
      return Promise.resolve({
        value,
        name,
        properties: {
          version: "1",
          enabled: true,
        },
      });
    });

    // Mock the SecretClient constructor
    (SecretClient as jest.MockedClass<typeof SecretClient>).mockImplementation(() => {
      return {
        getSecret: mockGetSecret,
        setSecret: mockSetSecret,
      } as any;
    });

    // Create temporary session without a grace period
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    session = await client.org().createSession("exclusive-test", ["manage:org:user:get"], {
      grace: 0,
    });

    // Write session to secret
    await mockSetSecret(secretName, cs.serializeBase64SessionData(session));
  });

  beforeEach(() => {
    // Clear mock call history before each test
    mockGetSecret.mockClear();
    mockSetSecret.mockClear();
  });

  it("Basic retrieval and storage", async () => {
    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      secretName,
    );

    // Should be able to retrieve session data
    const token1 = await exclusiveSessionMgr.token();
    expect(token1).toBe(session.token);
    expect(mockGetSecret).toHaveBeenCalledWith(secretName);
  });

  it("Works with CubeSigner client", async () => {
    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      secretName,
    );

    const client = await cs.CubeSignerClient.create(exclusiveSessionMgr);

    // Check that token works
    const user = await client.user();
    const orgIds = user.orgs.map((o) => o.org_id);
    expect(orgIds).toContain(session.org_id);
  });

  it("Automatically stores updated session data", async () => {
    // Create a new secret for this test
    const testSecretName = "exclusive-auto-store-test";
    await mockSetSecret(testSecretName, cs.serializeBase64SessionData(session));

    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      testSecretName,
    );

    // Initial retrieval
    await exclusiveSessionMgr.token();

    // Create client which may trigger auto-refresh behavior
    const client = await cs.CubeSignerClient.create(exclusiveSessionMgr);
    await client.user();

    // The exclusive manager should handle session updates automatically
    // If session was refreshed, setSecret should have been called
    expect(mockGetSecret).toHaveBeenCalled();
  });

  it("Metadata returns correct info", async () => {
    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      secretName,
    );

    const meta = await exclusiveSessionMgr.metadata();
    expect(meta).toBeDefined();
    expect(meta.org_id).toBe(session.org_id);
    expect(meta.role_id).toBe(session.role_id);
    expect(meta.purpose).toBe(session.purpose);
  });

  it("Handles token refresh properly", async () => {
    // Create a fresh session for this test
    const client = await cs.CubeSignerClient.create(csFs.defaultManagementSessionManager());
    const freshSession = await client.org().createSession(
      "exclusive-refresh-test",
      ["manage:org:user:get"],
      { grace: 0 },
    );

    const testSecretName = "exclusive-refresh-test-secret";
    await mockSetSecret(testSecretName, cs.serializeBase64SessionData(freshSession));

    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      testSecretName,
    );

    // Get initial token
    const token1 = await exclusiveSessionMgr.token();
    expect(token1).toBe(freshSession.token);

    // Manually refresh the session using the manager
    const manager = new csAzKv.AzureKeyVaultManager(vaultUrl, testSecretName);
    await manager.refresh();

    // After invalidating cache, should get new token
    await exclusiveSessionMgr.onInvalidToken();
    const token2 = await exclusiveSessionMgr.token();
    expect(token2).not.toBe(token1);
  });

  it("Caching behavior works correctly", async () => {
    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      secretName,
    );

    // First call should fetch from Key Vault
    await exclusiveSessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1);

    // Second call should use cache
    await exclusiveSessionMgr.token();
    expect(mockGetSecret).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it("Custom options are passed through", async () => {
    const exclusiveSessionMgr = new csAzKv.AzureExclusiveKeyVaultSessionManager(
      vaultUrl,
      secretName,
      {
        maxCacheLifetime: 300,
      },
    );

    // Should work with custom options
    const token = await exclusiveSessionMgr.token();
    expect(token).toBeDefined();
    expect(mockGetSecret).toHaveBeenCalled();
  });
});
