import * as ethers from "ethers";

/**
 * Airdrop a specified amount of Ether to the given address.
 *
 * @param {ethers.providers.JsonRpcProvider} provider - The JSON-RPC provider used to send the transaction.
 * @param {string} addr - The address to which the Ether will be airdropped.
 * @param {string?} amount - The amount of Ether to airdrop. Defaults to 100 ETH.
 */
export async function airdrop(
  provider: ethers.providers.JsonRpcProvider,
  addr: string,
  amount?: string,
) {
  const signer = provider.getSigner(0);
  await signer.sendTransaction({
    to: addr,
    value: ethers.utils.parseEther(amount ?? "100"),
  });
}

/**
 * Return the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
export function env(name: string, fallback?: string | null): string | null {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return val;
}
