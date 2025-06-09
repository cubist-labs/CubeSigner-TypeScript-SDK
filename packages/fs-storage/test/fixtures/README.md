# Ava Test Fixtures

The transactions in [ava_tx.ts](./ava_tx.ts) were obtained by running the following unit tests
from the [avalanche-types](https://github.com/ava-labs/avalanche-rs/tree/avalanche-types-v0.1.3/crates/avalanche-types) crate:

```bash
cargo test --package avalanche-types --lib -- --exact --show-output \
  platformvm::txs::add_permissionless_validator::test_add_permissionless_validator_tx_serialization_with_one_signer \
  platformvm::txs::add_subnet_validator::test_add_subnet_validator_tx_serialization_with_one_signer \
  platformvm::txs::add_validator::test_add_validator_tx_serialization_with_one_signer \
  platformvm::txs::create_chain::test_create_chain_tx_serialization_with_one_signer \
  platformvm::txs::create_subnet::test_create_subnet_tx_serialization_with_one_signer \
  platformvm::txs::export::test_export_tx_serialization_with_one_signer \
  platformvm::txs::import::test_import_tx_serialization_with_one_signer \
  avm::txs::test_tx_serialization_with_two_signers \
  avm::txs::export::test_export_tx_serialization_with_two_signers \
  avm::txs::import::test_import_tx_serialization_with_two_signers
```

after updating each to serialize to Json and print out the transaction before signing it.

# Wasm Policy Fixtures

The `.wasm` policies were built from the [cubist-policy-sdk](https://github.com/cubist-labs/cubist-policy-sdk/tree/a045fac71093a1ae2b39609788a5279cf9a66919) examples, using the `--release` flag for the `wasm32-wasip2` target.

```bash
cargo build --all --target wasm32-wasip2 --release
```
