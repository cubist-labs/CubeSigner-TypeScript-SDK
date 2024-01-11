import * as cs from "@cubist-labs/cubesigner-sdk";

/** Cardano wallet details */
interface CardanoWalletDetails {
  role: string;
  paymentAddress: string;
  stakingAddress: string;
}

/**
 * Create a new Cardano wallet.
 * @param {cs.Org} org the CubeSigner org
 * @return {Promise<CardanoWalletDetails>} the wallet details.
 */
async function createCardanoWallet(org: cs.Org): Promise<CardanoWalletDetails> {
  // Create wallet
  const baseKey = await org.createKey(cs.Mnemonic);
  const role = await org.createRole();

  // Using the derivation paths from CIP 1852
  // https://developers.cardano.org/docs/governance/cardano-improvement-proposals/cip-1852/
  // Derive payment key
  const paymentKey: cs.Key = (await org.deriveKey(
    cs.Ed25519.Cardano,
    "m/1852'/1815'/0'/0/0",
    baseKey.materialId,
  ))!;
  // Derive staking key
  const stakingKey: cs.Key = (await org.deriveKey(
    cs.Ed25519.Cardano,
    "m/1852'/1815'/0'/2/0",
    baseKey.materialId,
  ))!;

  // Add the keys to the role with policy for signing raw blobs
  await role.addKeys([paymentKey, stakingKey], ["AllowRawBlobSigning"]);
  return {
    role: role.id,
    paymentAddress: paymentKey.materialId,
    stakingAddress: stakingKey.materialId,
  };
}

/** Example main entry point */
async function main() {
  console.log("Loading management session...");
  // Load management session from
  const cubesigner = await cs.CubeSignerClient.loadManagementSession();
  // Get your org
  const org = new cs.Org(cubesigner);

  // Create wallet
  console.log("Creating wallet...");
  const wallet = await createCardanoWallet(org);
  console.log(wallet);
}

main().catch((err: Error) => {
  console.error(err);
  process.exit(1);
});
