# BTC staking tools

This directory contains tools for Babylon staking-related functionality.

For more information on Babylon, see [Babylon's stake
registration documentation][stake-registration]
and the [Babylon API swagger docs][babylon-api].

## Overview

The following tools are provided:

- `prove-inclusion-bbn` generates an inclusion proof for a Bitcoin staking
  transaction (i.e., a `MsgAddBTCDelegationInclusionProof`), then posts it to
  the Babylon chain. This can be used to add an inclusion proof for a deposit
  that has not yet been picked up by Babylon's
  [vigilante reporter][babylon-vigilante].

- `register-bbn` implements the phase2 "pre-registration" deposit flow: it
  reports the stake to the Babylon chain, waits for it to be verified, and
  then posts the deposit transaction to the corresponding Bitcoin chain.

- `unbond-bbn-phase1` handles unbonding of Babylon phase1 deposits via the
  phase1 staking API. This flow can only be used for old stakes; new stakes
  should use the phase2 unbonding flow (see immediately below).

- `unbond-bbn` implements the phase2 unbonding flow, i.e., retrieves the
  covenant signatures from the Babylon API, signs the unbonding request,
  and posts the finalized transaction to the Bitcoin chain.

- `withdraw-bbn` creates transactions that withdraw from various
  Babylon-related taproot scripts. This can be used to take funds out
  of a deposit after the deposit time lock has expired; to take funds
  out of an early unbond once the unbonding period has expired; or to
  extract the unslashed portion of a slashed deposit.

## Usage

Please consult comments in the code in each tool's subdirectory for usage
notes. You will need to set environment variables and/or create an input
file specifying the action to take.

## Notes

- To use these tools, you will need to first create a role session with
  access to a Cosmos key and/or a Taproot key, depending on the tool.
  See the CubeSigner documentation for more information on creating
  keys and roles.

- The Cosmos key must have the `AllowRawBlobSigning` policy. Note that
  the code in this directory does not handle the case where the Cosmos
  key has an MFA policy; extending the Cosmos signer interface to handle
  this case is not hard, but is out of scope.

- The Taproot key may have a Babylon policy and/or an MFA policy, and
  must be of an appropriate type for the Babylon network in use (i.e.,
  TaprootBtcTest for testnets, TaprootBtc for mainnet).

[stake-registration]: https://github.com/babylonlabs-io/babylon/blob/eab0f83302ff0438eee875631cb1e29e4c59c8ea/docs/register-bitcoin-stake.md
[babylon0-api]: https://staking-api.testnet.babylonlabs.io/swagger/doc.json
[babylon-vigilante]: https://docs.babylonlabs.io/guides/architecture/vigilantes/reporter/
