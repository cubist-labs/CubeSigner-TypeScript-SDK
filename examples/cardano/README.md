# Cardano example

This example shows how to creaet a cardano wallet.

## Logging into CubeSigner

Log into your CubeSigner organization using the `cs` command-line tool, e.g.,

```bash
cs login user@example.com --env '<gamma|prod|...>'
```

This creates a management session (e.g., on Linux in `~/.config/cubesigner`).

## Install dependencies and build TypeScript project

```
npm install && npm  run build

```

We can now run our examples.

## Creating Cardano Wallet

To create a wallet, run:

```bash
npm run create-wallet
```

This should output:

```
Loading management session...
Creating wallet...
{
  role: Role {
    id: 'Role#8cb36e31-85e9-4b44-bdc8-18ee27873909',
    name: undefined
  },
  paymentAddress: 'addr_vk1deakjs837zt6xmuwztxxfl95dn5lg80kqg5xwvjcctu8v05lhnyspzfzgc',
  stakingAddress: 'addr_vk1dgw4kv02l2fv52k2wq73xvpsmk774scwas46nppw0lk7enz3ctksfhl3x6'
}
```

For now, you can sign with the keys in the role using `signBlob` much like we
do in the main [README](../../README.md)

## Minting NFTs

This example adapts the [NFT minting
example](https://github.com/Emurgo/cardano-serialization-lib/blob/5c58e5ee75b0d6262840287ba06c9f9d1caf1037/doc/getting-started/minting-nfts.md)
from the `cardano-serialization-lib` repository in two ways:

- Use CubeSigner for both the account and policy witnesses, i.e., it uses
  CubeSigner to sign the transaction hash in secure hardware.
- Use [BlockFrost](https://blockfrost.io/) to query and post to the testnet (based on Petrovich Vlad's port).

### Get BlackFrost API key

To get started, get your BlockFrost API key and set it as an environment variable:

```
export BLOCKFROST_API_KEY=...
```

### Create keys

Then, let's create our account and policy key. We're going to use a mnemonic to
derive the keys from:

```bash
# Create new mnemonic
cs key create --key-type=mnemonic | tee mnemonic.json
# Get the mnemonic id
export MNEMONIC_ID=$(cat mnemonic.json| jq -r '.keys[0].material_id')
# Derive an account and policy key from the original mnemonic
cs key derive --key-type cardano-vk --mnemonic-id $MNEMONIC_ID --derivation-path "m/1852'/1815'/0'/0/0" --derivation-path "m/1852'/1815'/0'/0/1" | tee mnemonic.keys.json
# Set the environment variables (needed for this example):
export ACCOUNT_KEY=$(cat mnemonic.keys.json | jq -r '.keys[0].public_key')
export POLICY_KEY=$(cat mnemonic.keys.json | jq -r '.keys[1].public_key')
```

Here we used the standard derivation path `m/1852'/1815'/0'/0/0` for the
account payment key and (arbitrarily) `m/1852'/1815'/0'/0/1` for the payment
key.

### Create role and token

Now, let's create a role `minting_nfts` and add our keys to it:

```bash
export ROLE_ID=minting_nfts
cs role create --role-name $ROLE_ID
cat mnemonic.keys.json | jq -r '.keys[].key_id' | xargs -I {} cs role add-keys --key-id "{}" --policy='"AllowRawBlobSigning"'
```

To access the keys in the role let's now create a session token:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create --purpose "testing" --output base64)
```

### Mint NFTs

Finally, let's mint some NFTs by running our example app:

```bash
npm run mint-nft
```

This should output something like:

```
ADDR: addr_test1qqm0nfdrt9xenp3cgk22q26ktudqgn4t405pyqx50qae9dfklxj6xk2dnxrrs3v55q44vhc6q382h2lgzgqdg7pmj26s2gf2uh
POLICY_ADDR: addr_test1qqm0nfdrt9xenp3cgk22q26ktudqgn4t405pyqx50qae9dfklxj6xk2dnxrrs3v55q44vhc6q382h2lgzgqdg7pmj26s2gf2uh
UTXO: {
    "address": "addr_test1qqm0nfdrt9xenp3cgk22q26ktudqgn4t405pyqx50qae9dfklxj6xk2dnxrrs3v55q44vhc6q382h2lgzgqdg7pmj26s2gf2uh",
    "tx_hash": "a5d9e425b959c400ecd75db6e7b7a03faaa42480c9142b8fc8b0180c45f39d45",
    "tx_index": 1,
    "output_index": 1,
    "amount": [
        {
            "unit": "lovelace",
            "quantity": "9995977531"
        }
    ],
    "block": "f9ab5302207b8a5ea0323f7821044f6afc96199889365c7601ad9e058ca60f15",
    "data_hash": null,
    "inline_datum": null,
    "reference_script_hash": null
}
POLICY_KEYHASH: 08d116c36ddeb0f468403712a33ead1d55fa9ff8efa282697d77de0a
POLICY_TTL: 30262916
POLICY_ID: e237b3d0050b482956a27b1e83bedb86f1828fbe049d3503df54b1ab
METADATA: {
    "e237b3d0050b482956a27b1e83bedb86f1828fbe049d3503df54b1ab": {
        "cu13157": {
            "name": "cu13157",
            "description": "some descr this is a new nft with same policy",
            "image": "ipfs://QmNhmDPJMgdsFRM9HyiQEJqrKkpsWFshqES8mPaiFRq9Zk",
            "mediaType": "image/jpeg"
        }
    }
}
TX_TTL: 30262916
TX_HASH: a9c8983a15a3a0a6fca9df9020ce4f5aad28b37c2f4d4f6690e76850ac053d61
SUBMIT_RESULT: "a9c8983a15a3a0a6fca9df9020ce4f5aad28b37c2f4d4f6690e76850ac053d61"
```
