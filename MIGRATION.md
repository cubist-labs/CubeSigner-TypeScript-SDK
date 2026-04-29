# Migration Guide

This document provides migration guides between versions which introduced breaking changes.

## `v0.3.*` to `v0.4.*`

### Overview

The CubeSigner TypeScript SDK provides client-side utilities for calling the
remote CubeSigner REST API.

Two clients are provided:

- low-level `ApiClient` (defined in `packages/sdk/src/client/api_client.ts`)
- higher-level `CubeSignerClient` (defined in `packages/sdk/src/client.ts`).

#### `ApiClient`

`ApiClient` is a strongly-typed thin wrapper around the remote CubeSigner API.
As such, it primarily operates on primitive JavaScript values and plain objects, i.e., it takes
plain values as inputs, uses them to construct an HTTP request, calls the
API and returns the response as a plain JSON object.

One notable exception to this rule are the methods that return `CubeSignerResponse<U>`,
which is not a plain JSON object.
Many CubeSigner API requests may require Multi-User or Multi-Factor Authentication (for short MFA), and so,
whenever that's the case the `ApiClient` returns a `CubeSignerResponse<U>` instance
to help you deal with MFAs (e.g., call `requiresMfa()` to see if MFA is required, then
subsequently approve or reject it). When MFA is not required, the underlying JSON
response is accessible via the `data()` method.

The method names in the `ApiClient` class tend to follow the underlying HTTP request route, e.g.,

- `roleGet` for `GET /v0/org/{org_id}/roles/{role_id}`
- `roleKeysRemove` for `DELETE /v0/org/{org_id}/roles/{role_id}/keys/{key_id}`.

The higher-level client, `CubeSignerClient`, does not directly expose the methods
from `ApiClient` and instead provides more structured data types with more friendly
method names.

#### `CubeSignerClient`

The `CubeSignerClient` class is meant to be the starting point of your interactions
with this SDK and the CubeSigner API. It is essentially a representation of a session.

Most of the `CubeSignerMethods` return an instance of a higher-level class like, `Org`,
`Key`, `Role`, `MfaRequest`. Such classes are designed to reflect the object hierarchy (e.g., keys belong to orgs) and provide convenient access to CubeSigner
services, e.g., without having to pass plain string IDs. To achieve that goal, they
embed a low-level client, typically carry some additional state (often hidden in private
fields), implement internal mutations, and sometimes even allow external mutations.
As such, unlike the plain JavaScript objects, they are **not suitable** for
_caching_, _cloning_, and/or _serialization_.

### Summary of changes

- `SessionStorage` interface removed

  - what used to be split between `SessionStorage` and `SignerSessionManager` is now unified
    behind a single `SessionManager` interface; the following concrete implementation are provided:
    - `MemorySessionManager`
    - `JsonFileSessionManager` (by the `@cubist-labs/cubesigner-sdk-fs-storage` package)
    - `BrowserStorageManager` (by the `@cubist-labs/cubesigner-sdk-browser-storage` package)

- `CubeSignerClient` instantiation

  - to instantiate from default default management session, what used to be
    ```ts
    const client = await cs.loadManagementSession();
    ```
    now is
    ```ts
    const mgr = cs.defaultManagementSessionManager();
    const client = await cs.CubeSignerClient.create(mgr);
    ```
  - to instantiate from file, what used to be
    ```ts
    const fileStorage = new cs.JsonFileSessionStorage<cs.SignerSessionData>(
      "management-session.json",
    );
    const mgr = await cs.SignerSessionManager.loadFromStorage(fileStorage);
    const client = new cs.CubeSignerClient(mgr);
    ```
    now is
    ```ts
    const fileStorage = new cs.JsonFileSessionManager("management-session.json");
    const client = await cs.CubeSignerClient.create(fileStorage);
    ```

- `SignerSessionData` renamed to `SessionData`
- `KeyInfoApi` renamed to `KeyInfo`
- `CubeSignerClient` and `Org` do not directly expose the methods from `ApiClient`

  - those methods are **still available** via the `apiClient` readonly property (e.g., `client.apiClient.orgGet()`)
  - examples of removed methods
    - `orgGet`, `orgUserInvite`, `orgUsersList`, `keysCreate`, ...
  - most of the time, the same functionality exists in higher-level classes, e.g.,
    - `await client.org().createUser()`
    - `await client.org().users()`
    - `await client.org().createKey(...)`

- `OidcClient` class deleted

  - the methods from the old `OidcClient` class are now static methods on `CubeSignerClient`

    - `CubeSignerClient.createOidcSession`
    - `CubeSignerClient.proveOidcIdentity`

    For example, what used to be

    ```ts
    const oidcClient = new OidcClient(env, orgId, token);
    const resp = await oidcClient.sessionCreate(["manage:*", "sign:*"]);
    ```

    now is

    ```ts
    const resp = await CubeSignerClient.createOidcSession(env, orgId, token, [
      "manage:*",
      "sign:*",
    ]);
    ```

- `CubeSignerResponse.mfaSessionInfo()` method replaced with `mfaClient()`
  - the new method returns a `CubeSignerClient` instance, so what used to be
    ```ts
    const sessionInfo = resp.mfaSessionInfo();
    const mgr = await SignerSessionManager.createFromSessionInfo(deploy, orgId, sessionInfo);
    const client = new CubeSignerClient(mgr);
    ```
    now is
    ```ts
    const client = await resp.mfaClient();
    ```
