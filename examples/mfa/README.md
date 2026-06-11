# MFA Example

In this example we are first going to use the CubeSigner CLI tool (`cs`)
to create a role and add a key to it s.t., multi-factor authentication (MFA)
is required before that key may be used for signing.

Next, we are going to use the CubeSigner TypeScript SDK to implement a
simple Node app that allows different users to:

- initiate signing an EVM transaction with key from the role (which initially requires MFA)
- list pending MFA requests assigned to them
- approve a pending MFA request
- obtain the signed EVM transaction once the MFA request is approved

## Prerequisites

- `cs` (version `v.0.27.0` or later) is installed and in `PATH`
- a user is logged into CubeSigner (i.e., `cs user me` works)

## Demo

Follow the instructions in [demo.sh](./demo.sh).
