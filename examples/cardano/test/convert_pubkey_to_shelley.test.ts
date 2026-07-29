import { expect } from "chai";
import { AppWallet } from "@meshsdk/core";
import { bech32 } from "bech32";
import * as csl from "@emurgo/cardano-serialization-lib-nodejs";
import { blake2bHex } from "blakejs";

const MNEMONIC =
  "output claim gown trust daring idea twenty laundry gas tilt hole gentle gasp fitness goose peasant song crush scan cancel pilot three jazz conduct";
// derive from mnemonic @ "m/1852'/1815'/0'/0/0",
const PAYMENT_PUBKEY = "0x69ce2fd9b63cc5a8ba6c48dcce8eb0b31749b54ad0d99a5be1da8ad887c95857";
// derive from mnemonic @ "m/1852'/1815'/0'/2/0",
const STAKING_PUBKEY = "0xac9960ee663248e26bf40d19cb4f6d578eff1427238b2a769859fc12c19c4103";

// Create a wallet using AppWallet
const wallet = new AppWallet({
  networkId: 0,
  fetcher: null,
  submitter: null,
  key: {
    type: "mnemonic",
    words: MNEMONIC.split(" "),
  },
});

describe("convert pubkey", () => {
  // Convert the public keys to buffers
  const paymentPubKey_hash = pubKeyToBuf(PAYMENT_PUBKEY);
  const stakingPubKey_hash = pubKeyToBuf(STAKING_PUBKEY);

  it("works with csl", () => {
    const paymentAddr = csl.EnterpriseAddress.new(
      csl.NetworkInfo.testnet_preview().network_id(),
      csl.StakeCredential.from_keyhash(csl.Ed25519KeyHash.from_bytes(paymentPubKey_hash)),
    );
    const stakingAddr = csl.RewardAddress.new(
      csl.NetworkInfo.testnet_preview().network_id(),
      csl.StakeCredential.from_keyhash(csl.Ed25519KeyHash.from_bytes(stakingPubKey_hash)),
    );
    const pAddr = paymentAddr.to_address().to_bech32();
    const sAddr = stakingAddr.to_address().to_bech32();
    console.log(`====== Cardano Serialization Lib ======`);
    console.log(`payment address: ${pAddr}`);
    console.log(`staking address: ${sAddr}`);
    expect(pAddr).to.equal(wallet.getPaymentAddress());
    expect(sAddr).to.equal(wallet.getRewardAddress());
  });

  it("works manually", () => {
    const mkAddr = (ty: string, header: number, h: Buffer) => {
      const header_payload = Buffer.concat([Buffer.from([header]), h]);
      return bech32.encode(ty, bech32.toWords(header_payload));
    };
    const pAddr = mkAddr("addr_test", 0b0110_0000, paymentPubKey_hash);
    const sAddr = mkAddr("stake_test", 0b1110_0000, stakingPubKey_hash);
    console.log(`====== Manual Encoding ======`);
    console.log(`payment address: ${pAddr}`);
    console.log(`staking address: ${sAddr}`);
    expect(pAddr).to.equal(wallet.getPaymentAddress());
    expect(sAddr).to.equal(wallet.getRewardAddress());
  });
});

/**
 * Take the blake2b-224 of a Ed25519 public key.
 *
 * @param pubKey Ed25519 public key
 * @returns blake2b-224 hash of the public key
 */
function pubKeyToBuf(pubKey: string): Buffer {
  // if pubKey start with 0x strip it
  if (pubKey.startsWith("0x")) {
    pubKey = pubKey.slice(2);
  }
  const buf = Buffer.from(pubKey, "hex");
  return Buffer.from(blake2bHex(buf, undefined, 28), "hex");
}
