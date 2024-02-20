import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337,
      accounts: {
        accountsBalance: "10000000000000000000000",
      },
    },
  },
};
export default config;
