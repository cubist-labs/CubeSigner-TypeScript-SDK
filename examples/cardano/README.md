# Cardano example

This example shows how to creaet a cardano wallet.

## Logging into CubeSigner

Log into your CubeSigner organization using the `cs` command-line tool, e.g.,

```bash
cs login user@example.com --env '<gamma|prod|...>'
```

## Creating Cardano Wallet

This creates a management session (e.g., on Linux in `~/.config/cubesigner`).

Then create a wallet by running:

```bash
$ npm run create-wallet
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
do in the main [README][../../README.md]
