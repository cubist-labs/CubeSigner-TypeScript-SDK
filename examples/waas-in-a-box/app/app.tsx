/** This module implements a small UI on top of CubeSigner using react */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loginUser } from "./login_user.js";
import { BrowserStorageManager } from "@cubist-labs/cubesigner-sdk-browser-storage";
import { getOidcToken, handleOauthRedirect } from "./oauth.js";
import { registerUser } from "./register_user.js";
import { createRoot } from "react-dom/client";
import { CubeSignerClient } from "@cubist-labs/cubesigner-sdk";

// If the page was opened as part of an oauth redirect, handle it
void handleOauthRedirect();

// Render the app
const root = createRoot(document.getElementById("root"));
root.render(<App />);

/** The root react component for our app */
function App() {
  const { manager, client } = useClient();

  const loginOrRegisterCb = useCallback(async () => {
    const sessionData = await loginOrRegister();
    manager.setSession(sessionData!);
  }, [manager]);

  const logoutCb = useCallback(() => {
    manager.setSession();
  }, [manager]);

  if (client === undefined) return <div>Loading...</div>;
  if (client === null) return <button onClick={loginOrRegisterCb}>Login</button>;
  return (
    <>
      <button onClick={logoutCb}>Logout</button>
      <Wallet />
    </>
  );
}

/** A super minimal wallet UI that allows selecting a key and signing a test transaction */
function Wallet() {
  const { client } = useClient();
  const [signature, setSignature] = useState<string | null>(null);

  // Typically, you'd use a caching library like react-query to avoid fetching on every load
  const [keys, setKeys] = useState([]);
  useEffect(() => {
    client?.sessionKeys().then(setKeys);
  }, [client]);

  const keySelect = useRef<HTMLSelectElement>();

  const signTestTransaction = useCallback(async () => {
    const address = keySelect.current?.value;
    if (!address) return;

    const resp = await client?.apiClient.signEvm(address, {
      chain_id: 2, // Ethereum mainnet
      tx: {
        // EIP-2718 typed transaction (in this case a legacy transaction)
        type: "0x00",
        gas: "0x61a80",
        gasPrice: "0x77359400",
        nonce: "0",
        to: address, // send it to ourselves
        value: "0x0",
      },
    });

    setSignature(resp.data().rlp_signed_tx);
  }, [client]);

  return (
    <>
      <select ref={keySelect}>
        $
        {keys.map((key) => (
          <option key={key.materialId}>{key.materialId}</option>
        ))}
      </select>
      <button onClick={signTestTransaction}>Sign Test Transaction</button>
      {signature && <pre>{signature}</pre>}
    </>
  );
}

/**
 * A simple react hook that provides a CubeSignerClient.
 *
 * This hook persists the session data to a local storage key called "CURRENT_SESSION",
 * and syncs across all open tabs.
 */
function useClient() {
  // Create a new BrowserStorageManager instance (this handles persistence & cross-tab syncing)
  const manager = useMemo(() => new BrowserStorageManager("CURRENT_SESSION"), []);

  // Create a state variable to hold the client.
  // undefined means loading
  // null means logged out
  // CubeSignerClient means logged in
  const [client, setClient] = useState<CubeSignerClient | undefined | null>(undefined);

  // Set up the callbacks on login/logout
  useEffect(() => {
    const login = async () => {
      setClient(undefined);
      setClient(await CubeSignerClient.create(manager).catch(() => null));
    };
    const logout = () => setClient(null);

    // Update the client when the session changes
    manager.addEventListener("login", login);
    manager.addEventListener("logout", logout);

    void login(); // explicitly attempt to login with stored credentials

    return () => {
      manager.removeEventListener("login", login);
      manager.removeEventListener("logout", logout);
    };
  }, []);

  return { client, manager };
}

/** Attempts to login or, if the user does not have an account, register them */
async function loginOrRegister() {
  // Steps 1-2 of Login and Registration flows
  const id_token = await getOidcToken();

  // Right now, we don't know if the user is already registered,
  // so we'll attempt the login flow, and if that fails, we'll register the user
  const sessionData = await loginUser(id_token).catch(async (e) => {
    if (e.errorCode === "OidcUserNotFound") {
        console.debug("Failed to login, attempting to register");
        await registerUser(id_token);
        return loginUser(id_token);
    } else {
        throw e;
    }
  });

  return sessionData;
}
