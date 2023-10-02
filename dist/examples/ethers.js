"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cs = __importStar(require("../src/index"));
const ethers_1 = require("ethers");
const WALLET_ADDRESS = env("WALLET_ADDRESS");
const RECIPIENT = env("RECIPIENT");
const RPC_PROVIDER = env("RPC_PROVIDER", "https://rpc.ankr.com/eth_goerli");
const AMOUNT = ethers_1.ethers.parseEther(env("AMOUNT", "0.0000001"));
const CUBE_SIGNER_TOKEN = env("CUBE_SIGNER_TOKEN", null /* load from fs */);
// create like CUBE_SIGNER_TOKEN=$(cs token create ... --output base64)
/** Main entry point */
async function main() {
    // If token is passed via env variable, decode and parse it,
    // otherwise just load token from default filesystem location.
    const memStorage = CUBE_SIGNER_TOKEN
        ? new cs.MemorySessionStorage(JSON.parse(atob(CUBE_SIGNER_TOKEN)))
        : undefined;
    // Load signer session
    const signerSession = await cs.CubeSigner.loadSignerSession(memStorage);
    const provider = new ethers_1.ethers.JsonRpcProvider(RPC_PROVIDER);
    const signer = new EthersCubeSinger(WALLET_ADDRESS, signerSession, provider);
    // get balance
    const addr = await signer.getAddress();
    console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);
    console.log(`Transferring ${AMOUNT} wei from ${addr} to ${RECIPIENT}...`);
    const tx = {
        to: RECIPIENT,
        value: AMOUNT,
    };
    const response = await signer.sendTransaction(tx);
    await response.wait();
    // get new balance
    console.log(`${addr} has ${await provider.getBalance(addr)} gwei`);
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
/**
 * A bare-bones ethers.Signer implementation that uses EthersCubeSinger to sign transactions.
 */
class EthersCubeSinger extends ethers_1.ethers.AbstractSigner {
    /** Create new EthersCubeSinger ethers.Signer instance
     * @param {string} address The address of the account touser.
     * @param {cs.SignerSession<cs.SignerSessionObject>} signerSession The underlying EthersCubeSinger session.
     * @param {null | ethers.Provider} provider The optional provider instance to use.
     */
    constructor(address, signerSession, provider) {
        super(provider);
        this.address = address;
        this.signerSession = signerSession;
    }
    /** Resolves to the signer address. */
    async getAddress() {
        return this.address;
    }
    /**
     *  Returns the signer connected to %%provider%%.
     *  @param {null | ethers.Provider} provider The optional provider instance to use.
     *  @return {EthersCubeSinger} The signer connected to signer.
     */
    connect(provider) {
        return new EthersCubeSinger(this.address, this.signerSession, provider);
    }
    /**
     * Signs a transaction.
     * @param {ethers.TransactionRequest} tx The transaction to sign.
     * @return {Promise<string>} The signature.
     */
    async signTransaction(tx) {
        // get the chain id from the network or tx
        let chainId = tx.chainId;
        if (chainId === undefined) {
            const network = await this.provider?.getNetwork();
            const id = network?.chainId;
            if (id === undefined) {
                throw new Error("Missing chainId");
            }
            chainId = id.toString();
        }
        // Convert the transaction into a JSON-RPC transaction
        const rpcTx = this.provider instanceof ethers_1.JsonRpcApiProvider
            ? this.provider.getRpcTransaction(tx)
            : // We can just call the getRpcTransaction with a
                // null receiver since it doesn't actually use it
                // (and really should be declared static).
                ethers_1.JsonRpcApiProvider.prototype.getRpcTransaction.call(null, tx);
        rpcTx.type = (0, ethers_1.toBeHex)(tx.type ?? 0x02, 1); // we expect 0x0[0-2]
        const req = {
            chain_id: Number(chainId),
            tx: rpcTx,
        };
        const sig = await this.signerSession.signEth1(this.address, req);
        return sig.data().rlp_signed_tx;
    }
    /** Signs arbitrary message. Not yet implemented. */
    async signMessage() {
        throw new Error("Method not implemented.");
    }
    /** Signs typed data. Not yet implemented. */
    signTypedData() {
        throw new Error("Method not implemented.");
    }
}
/**
 * Returns the value of the environment variable.
 * @param {string} name The name of the environment variable.
 * @param {string} fallback The optional fallback value.
 * @return {string} The value of the environment variable, the fallback, or undefined.
 * @throws {Error} If the environment variable is not set and no fallback is provided.
 */
function env(name, fallback) {
    const val = process.env[name] ?? fallback;
    if (val === undefined) {
        throw new Error(`Missing environment variable ${name}`);
    }
    return val;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXRoZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vZXhhbXBsZXMvZXRoZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsbUNBQTZEO0FBRTdELE1BQU0sY0FBYyxHQUFXLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBRSxDQUFDO0FBQ3RELE1BQU0sU0FBUyxHQUFXLEdBQUcsQ0FBQyxXQUFXLENBQUUsQ0FBQztBQUM1QyxNQUFNLFlBQVksR0FBVyxHQUFHLENBQUMsY0FBYyxFQUFFLGlDQUFpQyxDQUFFLENBQUM7QUFDckYsTUFBTSxNQUFNLEdBQVcsZUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLFdBQVcsQ0FBRSxDQUFDLENBQUM7QUFDdEUsTUFBTSxpQkFBaUIsR0FBRyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDNUUsdUVBQXVFO0FBRXZFLHVCQUF1QjtBQUN2QixLQUFLLFVBQVUsSUFBSTtJQUNqQiw0REFBNEQ7SUFDNUQsOERBQThEO0lBQzlELE1BQU0sVUFBVSxHQUFHLGlCQUFpQjtRQUNsQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsb0JBQW9CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUMsQ0FBQyxTQUFTLENBQUM7SUFDZCxzQkFBc0I7SUFDdEIsTUFBTSxhQUFhLEdBQUcsTUFBTSxFQUFFLENBQUMsVUFBVSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBRXhFLE1BQU0sUUFBUSxHQUFHLElBQUksZUFBTSxDQUFDLGVBQWUsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUMxRCxNQUFNLE1BQU0sR0FBRyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsUUFBUSxDQUFD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QUF1QjtZQUM5QixRQUFRLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQztZQUN6QixFQUFFLEVBQUUsS0FBSztTQUNWLENBQUM7UUFDRixNQUFNLEdBQUcsR0FBRyxNQUFNLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDakUsT0FBTyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxDQUFDO0lBQ2xDLENBQUM7SUFFRCxvREFBb0Q7SUFDcEQsS0FBSyxDQUFDLFdBQVc7UUFDZixNQUFNLElBQUksS0FBSyxDQUFDLHlCQUF5QixDQUFDLENBQUM7SUFDN0MsQ0FBQztJQUVELDZDQUE2QztJQUM3QyxhQUFhO1FBQ1gsTUFBTSxJQUFJLEtBQUssQ0FBQyx5QkFBeUIsQ0FBQyxDQUFDO0lBQzdDLENBQUM7Q0FDRjtBQUVEOzs7Ozs7R0FNRztBQUNILFNBQVMsR0FBRyxDQUFDLElBQVksRUFBRSxRQUF3QjtJQUNqRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLFFBQVEsQ0FBQztJQUMxQyxJQUFJLEdBQUcsS0FBSyxTQUFTLEVBQUU7UUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsSUFBSSxFQUFFLENBQUMsQ0FBQztLQUN6RDtJQUNELE9BQU8sR0FBRyxDQUFDO0FBQ2IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNzIGZyb20gXCIuLi9zcmMvaW5kZXhcIjtcbmltcG9ydCB7IEpzb25ScGNBcGlQcm92aWRlciwgZXRoZXJzLCB0b0JlSGV4IH0gZnJvbSBcImV0aGVyc1wiO1xuXG5jb25zdCBXQUxMRVRfQUREUkVTUzogc3RyaW5nID0gZW52KFwiV0FMTEVUX0FERFJFU1NcIikhO1xuY29uc3QgUkVDSVBJRU5UOiBzdHJpbmcgPSBlbnYoXCJSRUNJUElFTlRcIikhO1xuY29uc3QgUlBDX1BST1ZJREVSOiBzdHJpbmcgPSBlbnYoXCJSUENfUFJPVklERVJcIiwgXCJodHRwczovL3JwYy5hbmtyLmNvbS9ldGhfZ29lcmxpXCIpITtcbmNvbnN0IEFNT1VOVDogYmlnaW50ID0gZXRoZXJzLnBhcnNlRXRoZXIoZW52KFwiQU1PVU5UXCIsIFwiMC4wMDAwMDAxXCIpISk7XG5jb25zdCBDVUJFX1NJR05FUl9UT0tFTiA9IGVudihcIkNVQkVfU0lHTkVSX1RPS0VOXCIsIG51bGwgLyogbG9hZCBmcm9tIGZzICovKTtcbi8vIGNyZWF0ZSBsaWtlIENVQkVfU0lHTkVSX1RPS0VOPSQoY3MgdG9rZW4gY3JlYXRlIC4uLiAtLW91dHB1dCBiYXNlNjQpXG5cbi8qKiBNYWluIGVudHJ5IHBvaW50ICovXG5hc3luYyBmdW5jdGlvbiBtYWluKCkge1xuICAvLyBJZiB0b2tlbiBpcyBwYXNzZWQgdmlhIGVudiB2YXJpYWJsZSwgZGVjb2RlIGFuZCBwYXJzZSBpdCxcbiAgLy8gb3RoZXJ3aXNlIGp1c3QgbG9hZCB0b2tlbiBmcm9tIGRlZmF1bHQgZmlsZXN5c3RlbSBsb2NhdGlvbi5cbiAgY29uc3QgbWVtU3RvcmFnZSA9IENVQkVfU0lHTkVSX1RPS0VOXG4gICAgPyBuZXcgY3MuTWVtb3J5U2Vzc2lvblN0b3JhZ2UoSlNPTi5wYXJzZShhdG9iKENVQkVfU0lHTkVSX1RPS0VOKSkpXG4gICAgOiB1bmRlZmluZWQ7XG4gIC8vIExvYWQgc2lnbmVyIHNlc3Npb25cbiAgY29uc3Qgc2lnbmVyU2Vzc2lvbiA9IGF3YWl0IGNzLkN1YmVTaWduZXIubG9hZFNpZ25lclNlc3Npb24obWVtU3RvcmFnZSk7XG5cbiAgY29uc3QgcHJvdmlkZXIgPSBuZXcgZXRoZXJzLkpzb25ScGNQcm92aWRlcihSUENfUFJPVklERVIpO1xuICBjb25zdCBzaWduZXIgPSBuZXcgRXRoZXJzQ3ViZVNpbmdlcihXQUxMRVRfQUREUkVTUywgc2lnbmVyU2Vzc2lvbiwgcHJvdmlkZXIpO1xuXG4gIC8vIGdldCBiYWxhbmNlXG4gIGNvbnN0IGFkZHIgPSBhd2FpdCBzaWduZXIuZ2V0QWRkcmVzcygpO1xuICBjb25zb2xlLmxvZyhgJHthZGRyfSBoYXMgJHthd2FpdCBwcm92aWRlci5nZXRCYWxhbmNlKGFkZHIpfSBnd2VpYCk7XG5cbiAgY29uc29sZS5sb2coYFRyYW5zZmVycmluZyAke0FNT1VOVH0gd2VpIGZyb20gJHthZGRyfSB0byAke1JFQ0lQSUVOVH0uLi5gKTtcblxuICBjb25zdCB0eCA9IHtcbiAgICB0bzogUkVDSVBJRU5ULFxuICAgIHZhbHVlOiBBTU9VTlQsXG4gIH07XG5cbiAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzaWduZXIuc2VuZFRyYW5zYWN0aW9uKHR4KTtcbiAgYXdhaXQgcmVzcG9uc2Uud2FpdCgpO1xuXG4gIC8vIGdldCBuZXcgYmFsYW5jZVxuICBjb25zb2xlLmxvZyhgJHthZGRyfSBoYXMgJHthd2FpdCBwcm92aWRlci5nZXRCYWxhbmNlKGFkZHIpfSBnd2VpYCk7XG59XG5cbm1haW4oKS5jYXRjaCgoZXJyOiBFcnJvcikgPT4ge1xuICBjb25zb2xlLmVycm9yKGVycik7XG4gIHByb2Nlc3MuZXhpdCgxKTtcbn0pO1xuXG4vKipcbiAqIEEgYmFyZS1ib25lcyBldGhlcnMuU2lnbmVyIGltcGxlbWVudGF0aW9uIHRoYXQgdXNlcyBFdGhlcnNDdWJlU2luZ2VyIHRvIHNpZ24gdHJhbnNhY3Rpb25zLlxuICovXG5jbGFzcyBFdGhlcnNDdWJlU2luZ2VyIGV4dGVuZHMgZXRoZXJzLkFic3RyYWN0U2lnbmVyIHtcbiAgLyoqIFRoZSBhZGRyZXNzIG9mIHRoZSBhY2NvdW50ICovXG4gIHJlYWRvbmx5IGFkZHJlc3MhOiBzdHJpbmc7XG5cbiAgLyoqIFRoZSB1bmRlcmx5aW5nIEV0aGVyc0N1YmVTaW5nZXIgc2Vzc2lvbiAqL1xuICByZWFkb25seSBzaWduZXJTZXNzaW9uITogY3MuU2lnbmVyU2Vzc2lvbjtcblxuICAvKiogQ3JlYXRlIG5ldyBFdGhlcnNDdWJlU2luZ2VyIGV0aGVycy5TaWduZXIgaW5zdGFuY2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgVGhlIGFkZHJlc3Mgb2YgdGhlIGFjY291bnQgdG91c2VyLlxuICAgKiBAcGFyYW0ge2NzLlNpZ25lclNlc3Npb248Y3MuU2lnbmVyU2Vzc2lvbk9iamVjdD59IHNpZ25lclNlc3Npb24gVGhlIHVuZGVybHlpbmcgRXRoZXJzQ3ViZVNpbmdlciBzZXNzaW9uLlxuICAgKiBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqL1xuICBjb25zdHJ1Y3RvcihhZGRyZXNzOiBzdHJpbmcsIHNpZ25lclNlc3Npb246IGNzLlNpZ25lclNlc3Npb24sIHByb3ZpZGVyPzogbnVsbCB8IGV0aGVycy5Qcm92aWRlcikge1xuICAgIHN1cGVyKHByb3ZpZGVyKTtcbiAgICB0aGlzLmFkZHJlc3MgPSBhZGRyZXNzO1xuICAgIHRoaXMuc2lnbmVyU2Vzc2lvbiA9IHNpZ25lclNlc3Npb247XG4gIH1cblxuICAvKiogUmVzb2x2ZXMgdG8gdGhlIHNpZ25lciBhZGRyZXNzLiAqL1xuICBhc3luYyBnZXRBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuYWRkcmVzcztcbiAgfVxuXG4gIC8qKlxuICAgKiAgUmV0dXJucyB0aGUgc2lnbmVyIGNvbm5lY3RlZCB0byAlJXByb3ZpZGVyJSUuXG4gICAqICBAcGFyYW0ge251bGwgfCBldGhlcnMuUHJvdmlkZXJ9IHByb3ZpZGVyIFRoZSBvcHRpb25hbCBwcm92aWRlciBpbnN0YW5jZSB0byB1c2UuXG4gICAqICBAcmV0dXJuIHtFdGhlcnNDdWJlU2luZ2VyfSBUaGUgc2lnbmVyIGNvbm5lY3RlZCB0byBzaWduZXIuXG4gICAqL1xuICBjb25uZWN0KHByb3ZpZGVyOiBudWxsIHwgZXRoZXJzLlByb3ZpZGVyKTogRXRoZXJzQ3ViZVNpbmdlciB7XG4gICAgcmV0dXJuIG5ldyBFdGhlcnNDdWJlU2luZ2VyKHRoaXMuYWRkcmVzcywgdGhpcy5zaWduZXJTZXNzaW9uLCBwcm92aWRlcik7XG4gIH1cblxuICAvKipcbiAgICogU2lnbnMgYSB0cmFuc2FjdGlvbi5cbiAgICogQHBhcmFtIHtldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0fSB0eCBUaGUgdHJhbnNhY3Rpb24gdG8gc2lnbi5cbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBUaGUgc2lnbmF0dXJlLlxuICAgKi9cbiAgYXN5bmMgc2lnblRyYW5zYWN0aW9uKHR4OiBldGhlcnMuVHJhbnNhY3Rpb25SZXF1ZXN0KTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICAvLyBnZXQgdGhlIGNoYWluIGlkIGZyb20gdGhlIG5ldHdvcmsgb3IgdHhcbiAgICBsZXQgY2hhaW5JZCA9IHR4LmNoYWluSWQ7XG4gICAgaWYgKGNoYWluSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgbmV0d29yayA9IGF3YWl0IHRoaXMucHJvdmlkZXI/LmdldE5ldHdvcmsoKTtcbiAgICAgIGNvbnN0IGlkID0gbmV0d29yaz8uY2hhaW5JZDtcbiAgICAgIGlmIChpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1pc3NpbmcgY2hhaW5JZFwiKTtcbiAgICAgIH1cbiAgICAgIGNoYWluSWQgPSBpZC50b1N0cmluZygpO1xuICAgIH1cblxuICAgIC8vIENvbnZlcnQgdGhlIHRyYW5zYWN0aW9uIGludG8gYSBKU09OLVJQQyB0cmFuc2FjdGlvblxuICAgIGNvbnN0IHJwY1R4ID1cbiAgICAgIHRoaXMucHJvdmlkZXIgaW5zdGFuY2VvZiBKc29uUnBjQXBpUHJvdmlkZXJcbiAgICAgICAgPyB0aGlzLnByb3ZpZGVyLmdldFJwY1RyYW5zYWN0aW9uKHR4KVxuICAgICAgICA6IC8vIFdlIGNhbiBqdXN0IGNhbGwgdGhlIGdldFJwY1RyYW5zYWN0aW9uIHdpdGggYVxuICAgICAgICAgIC8vIG51bGwgcmVjZWl2ZXIgc2luY2UgaXQgZG9lc24ndCBhY3R1YWxseSB1c2UgaXRcbiAgICAgICAgICAvLyAoYW5kIHJlYWxseSBzaG91bGQgYmUgZGVjbGFyZWQgc3RhdGljKS5cbiAgICAgICAgICBKc29uUnBjQXBpUHJvdmlkZXIucHJvdG90eXBlLmdldFJwY1RyYW5zYWN0aW9uLmNhbGwobnVsbCwgdHgpO1xuICAgIHJwY1R4LnR5cGUgPSB0b0JlSGV4KHR4LnR5cGUgPz8gMHgwMiwgMSk7IC8vIHdlIGV4cGVjdCAweDBbMC0yXVxuXG4gICAgY29uc3QgcmVxID0gPGNzLkV0aDFTaWduUmVxdWVzdD57XG4gICAgICBjaGFpbl9pZDogTnVtYmVyKGNoYWluSWQpLFxuICAgICAgdHg6IHJwY1R4LFxuICAgIH07XG4gICAgY29uc3Qgc2lnID0gYXdhaXQgdGhpcy5zaWduZXJTZXNzaW9uLnNpZ25FdGgxKHRoaXMuYWRkcmVzcywgcmVxKTtcbiAgICByZXR1cm4gc2lnLmRhdGEoKS5ybHBfc2lnbmVkX3R4O1xuICB9XG5cbiAgLyoqIFNpZ25zIGFyYml0cmFyeSBtZXNzYWdlLiBOb3QgeWV0IGltcGxlbWVudGVkLiAqL1xuICBhc3luYyBzaWduTWVzc2FnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCBub3QgaW1wbGVtZW50ZWQuXCIpO1xuICB9XG5cbiAgLyoqIFNpZ25zIHR5cGVkIGRhdGEuIE5vdCB5ZXQgaW1wbGVtZW50ZWQuICovXG4gIHNpZ25UeXBlZERhdGEoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJNZXRob2Qgbm90IGltcGxlbWVudGVkLlwiKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBmYWxsYmFjayBUaGUgb3B0aW9uYWwgZmFsbGJhY2sgdmFsdWUuXG4gKiBAcmV0dXJuIHtzdHJpbmd9IFRoZSB2YWx1ZSBvZiB0aGUgZW52aXJvbm1lbnQgdmFyaWFibGUsIHRoZSBmYWxsYmFjaywgb3IgdW5kZWZpbmVkLlxuICogQHRocm93cyB7RXJyb3J9IElmIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBub3Qgc2V0IGFuZCBubyBmYWxsYmFjayBpcyBwcm92aWRlZC5cbiAqL1xuZnVuY3Rpb24gZW52KG5hbWU6IHN0cmluZywgZmFsbGJhY2s/OiBzdHJpbmcgfCBudWxsKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IHZhbCA9IHByb2Nlc3MuZW52W25hbWVdID8/IGZhbGxiYWNrO1xuICBpZiAodmFsID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE1pc3NpbmcgZW52aXJvbm1lbnQgdmFyaWFibGUgJHtuYW1lfWApO1xuICB9XG4gIHJldHVybiB2YWw7XG59XG4iXX0=