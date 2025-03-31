# CubeSigner TypeScript SDK: bitcoinjs-lib BTC staking Example

This example shows how the CubeSigner TypeScript SDK can be used to sign BTC
staking transactions with
[bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib).

## Running the Example

To run the example, you need to first create a BtcTaproot or BtcTaprootTest key
and add it to a role like we did in the [top-level README](../../README.md).

After you do this, generate a session token for the role (or use a user session); you can either save
the token (`cs token create ... --save`) or export as base64:

```bash
export CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
```

Then, set the the staker adress to the key's address:

```bash
export STAKER_ADDERSS=tb1... # this is your btc key material id
```

For this example to work you need to have some funds in your account.

Finally, configure the finality provider's public key (not address!):

```bash
export FINALITY_PROVIDER_PK=0x...
```
