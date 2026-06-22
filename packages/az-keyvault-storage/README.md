# CubeSigner SDK session manager backed by Azure Key Vault

This package provides an Azure Key Vault-backed implementation of the
`SessionManager` interface from the CubeSigner SDK.

For more information, check out the
[@cubist-labs/cubesigner-sdk](https://www.npmjs.com/package/@cubist-labs/cubesigner-sdk)
NPM package.

## Installation

```bash
npm install @cubist-labs/cubesigner-sdk-az-keyvault-storage
```

## Prerequisites

Before using this package, you need:

1. **Azure Key Vault**: Create a Key Vault in Azure Portal or using Azure CLI:
   ```bash
   az keyvault create --name my-vault --resource-group my-rg --location eastus
   ```

2. **Permissions**: Ensure your application has the necessary permissions:
   - **Get** permission to read secrets
   - **Set** permission to create/update secrets

   You can assign the "Key Vault Secrets Officer" or "Key Vault Secrets User" role:
   ```bash
   az role assignment create --role "Key Vault Secrets Officer" \
     --assignee <your-app-id> \
     --scope /subscriptions/<subscription-id>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/<vault-name>
   ```

3. **Authentication**: Configure Azure authentication using one of these methods:
   - **Local Development**: Use Azure CLI login (`az login`)
   - **Production**: Use Managed Identity (recommended) or Service Principal
   - **Environment Variables**: Set `AZURE_TENANT_ID`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`

## Usage

### Basic Usage

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import { AzureKeyVaultSessionManager } from "@cubist-labs/cubesigner-sdk-az-keyvault-storage";

// Create a session manager
const vaultUrl = "https://my-vault.vault.azure.net";
const secretName = "cubesigner-session";

const sessionMgr = new AzureKeyVaultSessionManager(vaultUrl, secretName);

// Use it to create a CubeSigner client
const client = await cs.CubeSignerClient.create(sessionMgr);

// Use the client as normal
const user = await client.user();
console.log("User:", user.email);
```

### Storing a Session

To initially store a CubeSigner session in Azure Key Vault:

```typescript
import * as cs from "@cubist-labs/cubesigner-sdk";
import { defaultManagementSessionManager } from "@cubist-labs/cubesigner-sdk-fs-storage";
import { AzureKeyVaultManager } from "@cubist-labs/cubesigner-sdk-az-keyvault-storage";

// Create a session using your management credentials
const managementClient = await cs.CubeSignerClient.create(
  defaultManagementSessionManager()
);

// Create a new session for your application
const sessionData = await managementClient.org().createSession(
  "my-app-session",
  ["sign:*"]
);

// Store it in Azure Key Vault
const vaultUrl = "https://my-vault.vault.azure.net";
const secretName = "cubesigner-session";

const manager = new AzureKeyVaultManager(vaultUrl, secretName);
await manager.update(sessionData);

console.log("Session stored in Azure Key Vault!");
```

### Custom Authentication

By default, the package uses `DefaultAzureCredential` which automatically detects
credentials from your environment. You can provide a custom credential:

```typescript
import { ClientSecretCredential } from "@azure/identity";
import { AzureKeyVaultSessionManager } from "@cubist-labs/cubesigner-sdk-az-keyvault-storage";

const credential = new ClientSecretCredential(
  process.env.AZURE_TENANT_ID!,
  process.env.AZURE_CLIENT_ID!,
  process.env.AZURE_CLIENT_SECRET!
);

const sessionMgr = new AzureKeyVaultSessionManager(
  "https://my-vault.vault.azure.net",
  "cubesigner-session",
  { credential }
);
```

### Cache Configuration

Control how long session data is cached:

```typescript
const sessionMgr = new AzureKeyVaultSessionManager(
  "https://my-vault.vault.azure.net",
  "cubesigner-session",
  {
    // Cache session data for at most 5 minutes (300 seconds)
    maxCacheLifetime: 300,
  }
);
```

Without `maxCacheLifetime`, the cache expires based on the session token's
expiration time.

### Refreshing Sessions

Use `AzureKeyVaultManager` to refresh sessions stored in Azure Key Vault:

```typescript
import { AzureKeyVaultManager } from "@cubist-labs/cubesigner-sdk-az-keyvault-storage";

const manager = new AzureKeyVaultManager(
  "https://my-vault.vault.azure.net",
  "cubesigner-session"
);

// Refresh the session (extends token lifetime)
await manager.refresh();
```

You can set up a periodic refresh using a cron job, Azure Function, or similar:

```typescript
// Refresh every hour
setInterval(async () => {
  try {
    await manager.refresh();
    console.log("Session refreshed successfully");
  } catch (error) {
    console.error("Failed to refresh session:", error);
  }
}, 60 * 60 * 1000); // 1 hour
```

## API Reference

### `AzureKeyVaultSessionManager`

Session manager that reads CubeSigner session tokens from Azure Key Vault.

**Constructor:**
```typescript
new AzureKeyVaultSessionManager(
  vaultUrl: string,
  secretName: string,
  opts?: AzureKeyVaultSessionManagerOpts
)
```

- `vaultUrl`: Azure Key Vault URL (e.g., "https://my-vault.vault.azure.net")
- `secretName`: Name of the secret containing the session data
- `opts`: Optional configuration
  - `credential`: Custom Azure credential (default: `DefaultAzureCredential`)
  - `maxCacheLifetime`: Maximum cache lifetime in seconds
  - `clientOptions`: Options passed to Azure `SecretClient`

**Methods:**
- `token()`: Returns the current session token
- `metadata()`: Returns session metadata
- `onInvalidToken()`: Clears the cache (called automatically by SDK)

### `AzureKeyVaultManager`

Manager for updating and refreshing CubeSigner sessions in Azure Key Vault.

**Constructor:**
```typescript
new AzureKeyVaultManager(
  vaultUrl: string,
  secretName: string,
  credential?: TokenCredential,
  clientOptions?: SecretClientOptions
)
```

**Methods:**
- `update(session: SessionData)`: Writes session data to the secret
- `refresh()`: Refreshes the stored session and updates the secret

## Differences from AWS Secrets Manager Implementation

- **No rotation schedule checking**: Azure Key Vault doesn't have the same automatic
  rotation scheduling as AWS Secrets Manager, so there's no `checkScheduledRotation` option
- **Vault URL instead of ARN**: Azure uses HTTPS URLs while AWS uses ARNs
- **DefaultAzureCredential**: Uses Azure Identity instead of AWS SDK credential chain

## Best Practices

1. **Use Managed Identity in production**: Avoid storing credentials in environment
   variables when running in Azure (VM, App Service, Function, etc.)

2. **Enable soft-delete**: Configure your Key Vault with soft-delete enabled to
   prevent accidental secret deletion

3. **Set appropriate cache lifetime**: Balance between reducing Key Vault API calls
   and ensuring fresh session data

4. **Implement session refresh**: Set up automated session refresh to avoid
   session expiration

5. **Use separate secrets for different environments**: Don't reuse the same
   secret for dev, staging, and production

## Troubleshooting

### Authentication Errors

If you get authentication errors, verify:
- You're logged in with `az login` (for local development)
- Your application has the necessary Key Vault permissions
- Environment variables are set correctly (for Service Principal auth)

### Permission Errors

Ensure your identity has these permissions on the Key Vault:
- `Get` permission (to read secrets)
- `Set` permission (to create/update secrets)

You can check with:
```bash
az keyvault show --name my-vault --query properties.accessPolicies
```

### Cache Issues

If you're not seeing updated session data:
```typescript
// Force cache invalidation
await sessionMgr.onInvalidToken();
```

## License

See the [NOTICE](/NOTICE) file for licensing information.