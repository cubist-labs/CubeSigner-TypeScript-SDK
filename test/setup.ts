import { CubeSigner } from "../src";

/** Create a new CubeSigner instance.
 * @return {CubeSigner} A new CubeSigner instance.
 * */
export async function newCubeSigner(): Promise<CubeSigner> {
  return await CubeSigner.loadManagementSession();
}
