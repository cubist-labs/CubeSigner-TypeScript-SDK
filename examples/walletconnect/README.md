# CubeSigner TypeScript SDK: WalletConnect Example

This example shows how to use WalletConnect's WalletKit with CubeSigner to sign
transactions without exposing secret keys to the browser memory.

The example implements a basic embedded wallet with WalletKit, which asks
the user to (1) link their wallet to the dapp (in this case, [WalletConnect's
example dapp](https://react-app.walletconnect.com/)), and (2) sign Ethereum
`personal_sign` or `eth_sendTransaction` requests initiated by the dapp, which
can be cryptographically verified to have been signed by the wallet. This
example can be expanded to handle [additional Ethereum
actions](https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc)
from dapps, such as signing EIP-712 typed data.

## Background

[WalletConnect](https://walletconnect.com/) connects distributed apps (dapps) to
wallets, by allowing dapps to make [remote procedure calls
(RPCs)](https://en.wikipedia.org/wiki/Remote_procedure_call) to a given wallet.
Dapps implement [AppKit](https://walletconnect.com/appkit) to make RPC calls
while wallets implement [WalletKit](https://walletconnect.com/walletkit) to
receive and return results to the RPC calls. You can read [the full
WalletKit documentation
here](https://docs.walletconnect.com/walletkit/overview).

Each chain that WalletConnect supports has its own individual RPCs. In this
example, we will implement [Ethereum's `personal_sign` and `eth_sendtransaction`
RPCs](https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc),
which are the required RPCs to support the Ethereum namespace. You can see all
the Ethereum RPCs supported by WalletKit [in WalletKit's
documentation](https://docs.walletconnect.com/advanced/multichain/rpc-reference/ethereum-rpc).

## Install

### Login to Services

- Create a WalletConnect account at <https://cloud.walletconnect.com>. Create a
  project for the Wallet and add the project ID to `WALLETCONNECT_PROJECT_ID` in a
  `.env` file (see `.env.template` for the expected format) or define it in your
  terminal environment.

- Log in to CubeSigner with the `cs` CLI tool.

- Create a new default signer session with the "sign:evm:*" scope to sign
  EVM transactions:

  ```bash
  cs token create --role-id <ROLE_ID> --scope "sign:evm:*" --save
  ```

  Alternatively, you can use a session token at a different file location.
  If so, define the `CUBESIGNER_SIGNER_TOKEN_FILE` environment variable with the
  path to the token file.

- Set `RPC_PROVIDER` in the `.env` file or in your terminal environment to
  [a JSON-RPC API provider for your desired chain.](https://ethereum-json-rpc.com/providers)

- Set `CUBESIGNER_KEY_ID` in the `.env` file or in your terminal environment to
  the key you want to use.
  - If you intend to test the `personal_sign` RPC, ensure your key has the
    `AllowEip191Signing` policy with `cs key set-policy`. Alternatively, you can
    create a new key with this policy:

    ```bash
    export CUBESIGNER_KEY_ID=$(cs key create --key-type secp --policy '"AllowEip191Signing"' | jq -r '.keys[0].key_id')
    ```

  - If you intend to test the `eth_sendTransaction` RPC, ensure your key has
    some Sepolia ETH to pay the gas fee.

### Install Dependencies

- Run `npm run build` at the root of the Typescript SDK repo
  to build the SDK, which is used in this example.

- Run `npm run build` in this example to install dependencies
  and build the script.

## Usage

- Open <https://react-app.walletconnect.com>. This is [WalletConnect's example
  dapp](https://github.com/WalletConnect/web-examples/tree/main/advanced/wallets/react-wallet-v2),
  which we will use to connect to our script.

- Run `node ./dist/index.js` to run the script. To terminate the script, use
  Ctrl-C or disconnect the connection from the dapp.
    - `npm start` is not supported because [`npm` will catch SIGINT
       signals](https://lisk.com/blog/posts/why-we-stopped-using-npm-start-child-processes),
       which causes the script to not exit cleanly.

