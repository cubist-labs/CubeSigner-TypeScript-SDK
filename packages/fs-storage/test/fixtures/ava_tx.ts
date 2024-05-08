import type { AvaTx } from "@cubist-labs/cubesigner-sdk";

const p_add_permissionless_validator: AvaTx = {
  P: {
    AddPermissionlessValidator: {
      baseTx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 5678,
              signatureIndices: [0],
            },
            outputIndex: 2,
            stakeable_lock_in: null,
            txID: "tJ4rZfd5dnsPpWPVYU3skNW8uYNpaS6bmpto3sXMMqFMVpR1f",
          },
        ],
        networkID: 1000000,
        outputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            output: {
              addresses: ["Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf"],
              amount: 199996000000000000,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      creds: [],
      delegatorRewardsOwner: {
        addresses: ["Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf"],
        locktime: 0,
        threshold: 1,
      },
      shares: 1000000,
      signer: {
        proofOfPossession:
          "0x86a3ab4c45cfe31cae34c1d06f212434ac71b1be6cfe046c80c162e057614a94a5bc9f1ded1a7029deb0ba4ca7c9b71411e293438691be79c2dbf19d1ca7c3eadb9c756246fc5de5b7b89511c7d7302ae051d9e03d7991138299b5ed6a570a98",
        publicKey:
          "0x8f95423f7142d00a48e1014a3de8d28907d420dc33b3052a6dee03a3f2941a393c2351e354704ca66a3fc29870282e15",
      },
      stake: [
        {
          assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
          output: null,
          stakeable_lock_out: {
            locktime: 0,
            transfer_output: {
              addresses: ["Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf"],
              amount: 2023,
              locktime: 0,
              threshold: 1,
            },
          },
        },
      ],
      subnetID: "2u5EYNkXMDFNi4pL9eGBt2F5DnXLGriecu7Ctje8jK155FFkPx",
      validator: {
        end: 1674121314,
        node_id: "NodeID-FJJpDJwtTn8Ycx9R3PPHK9JuZequRvhr7",
        start: 1648194151,
        weight: 2023,
      },
      validatorRewardsOwner: {
        addresses: ["Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf"],
        locktime: 0,
        threshold: 1,
      },
    },
  },
};
const p_add_subnet_validator: AvaTx = {
  P: {
    AddSubnetValidator: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 199995999797000000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "2gafJ6qhw4dastVU3XZmte5C2SsooL4avkPr1qMfc3rhJgBkty",
          },
        ],
        networkID: 1000000,
        outputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            output: {
              addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
              amount: 199995999796000000,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      creds: [],
      subnet_auth: {
        sig_indices: [0],
      },
      validator: {
        subnet_id: "2gafJ6qhw4dastVU3XZmte5C2SsooL4avkPr1qMfc3rhJgBkty",
        validator: {
          end: 1679713873,
          node_id: "NodeID-KV7DxGubnRdyQtpkwZ2oRJRckgzdU3dWR",
          start: 1648181835,
          weight: 1000,
        },
      },
    },
  },
};
const p_add_validator: AvaTx = {
  P: {
    AddValidator: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 199998000000000000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "ux96KXuSwvmja5fHCfNSyTvW566gRkbG6TKP3UkxddpRmW4zx",
          },
        ],
        networkID: 1000000,
        outputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            output: {
              addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
              amount: 199996000000000000,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      creds: [],
      rewards_owner: {
        addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
        locktime: 0,
        threshold: 1,
      },
      shares: 20000,
      stake_transferable_outputs: [
        {
          assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
          output: {
            addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
            amount: 2000000000000,
            locktime: 0,
            threshold: 1,
          },
          stakeable_lock_out: null,
        },
      ],
      validator: {
        end: 1674121314,
        node_id: "NodeID-FJJpDJwtTn8Ycx9R3PPHK9JuZequRvhr7",
        start: 1648194151,
        weight: 2000000000000,
      },
    },
  },
};
const p_create_chain: AvaTx = {
  P: {
    CreateChain: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 199995999896000000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "bMeLC7baNSU5rav3ZvYnKtA11Yi47F69cRCwEWunyR8FeCGBm",
          },
        ],
        networkID: 1000000,
        outputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            output: {
              addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
              amount: 199995999796000000,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      chain_name: "subnetevm",
      creds: [],
      fx_ids: null,
      genesis_data: [
        123, 34, 99, 111, 110, 102, 105, 103, 34, 58, 123, 34, 99, 104, 97, 105, 110, 73, 100, 34,
        58, 50, 48, 48, 48, 55, 55, 55, 44, 34, 104, 111, 109, 101, 115, 116, 101, 97, 100, 66, 108,
        111, 99, 107, 34, 58, 48, 44, 34, 101, 105, 112, 49, 53, 48, 66, 108, 111, 99, 107, 34, 58,
        48, 44, 34, 101, 105, 112, 49, 53, 48, 72, 97, 115, 104, 34, 58, 34, 48, 120, 50, 48, 56,
        54, 55, 57, 57, 97, 101, 101, 98, 101, 97, 101, 49, 51, 53, 99, 50, 52, 54, 99, 54, 53, 48,
        50, 49, 99, 56, 50, 98, 52, 101, 49, 53, 97, 50, 99, 52, 53, 49, 51, 52, 48, 57, 57, 51, 97,
        97, 99, 102, 100, 50, 55, 53, 49, 56, 56, 54, 53, 49, 52, 102, 48, 34, 44, 34, 101, 105,
        112, 49, 53, 53, 66, 108, 111, 99, 107, 34, 58, 48, 44, 34, 101, 105, 112, 49, 53, 56, 66,
        108, 111, 99, 107, 34, 58, 48, 44, 34, 98, 121, 122, 97, 110, 116, 105, 117, 109, 66, 108,
        111, 99, 107, 34, 58, 48, 44, 34, 99, 111, 110, 115, 116, 97, 110, 116, 105, 110, 111, 112,
        108, 101, 66, 108, 111, 99, 107, 34, 58, 48, 44, 34, 112, 101, 116, 101, 114, 115, 98, 117,
        114, 103, 66, 108, 111, 99, 107, 34, 58, 48, 44, 34, 105, 115, 116, 97, 110, 98, 117, 108,
        66, 108, 111, 99, 107, 34, 58, 48, 44, 34, 109, 117, 105, 114, 71, 108, 97, 99, 105, 101,
        114, 66, 108, 111, 99, 107, 34, 58, 48, 44, 34, 115, 117, 98, 110, 101, 116, 69, 86, 77, 84,
        105, 109, 101, 115, 116, 97, 109, 112, 34, 58, 48, 44, 34, 102, 101, 101, 67, 111, 110, 102,
        105, 103, 34, 58, 123, 34, 103, 97, 115, 76, 105, 109, 105, 116, 34, 58, 50, 48, 48, 48, 48,
        48, 48, 48, 44, 34, 116, 97, 114, 103, 101, 116, 66, 108, 111, 99, 107, 82, 97, 116, 101,
        34, 58, 50, 44, 34, 109, 105, 110, 66, 97, 115, 101, 70, 101, 101, 34, 58, 49, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 44, 34, 116, 97, 114, 103, 101, 116, 71, 97, 115, 34, 58, 49, 48,
        48, 48, 48, 48, 48, 48, 48, 44, 34, 98, 97, 115, 101, 70, 101, 101, 67, 104, 97, 110, 103,
        101, 68, 101, 110, 111, 109, 105, 110, 97, 116, 111, 114, 34, 58, 52, 56, 44, 34, 109, 105,
        110, 66, 108, 111, 99, 107, 71, 97, 115, 67, 111, 115, 116, 34, 58, 48, 44, 34, 109, 97,
        120, 66, 108, 111, 99, 107, 71, 97, 115, 67, 111, 115, 116, 34, 58, 49, 48, 48, 48, 48, 48,
        48, 48, 44, 34, 98, 108, 111, 99, 107, 71, 97, 115, 67, 111, 115, 116, 83, 116, 101, 112,
        34, 58, 53, 48, 48, 48, 48, 48, 125, 44, 34, 99, 111, 110, 116, 114, 97, 99, 116, 68, 101,
        112, 108, 111, 121, 101, 114, 65, 108, 108, 111, 119, 76, 105, 115, 116, 67, 111, 110, 102,
        105, 103, 34, 58, 123, 34, 98, 108, 111, 99, 107, 84, 105, 109, 101, 115, 116, 97, 109, 112,
        34, 58, 48, 44, 34, 97, 100, 109, 105, 110, 65, 100, 100, 114, 101, 115, 115, 101, 115, 34,
        58, 91, 34, 48, 120, 56, 100, 98, 57, 55, 67, 55, 99, 69, 99, 69, 50, 52, 57, 99, 50, 98,
        57, 56, 98, 68, 67, 48, 50, 50, 54, 67, 99, 52, 67, 50, 65, 53, 55, 66, 70, 53, 50, 70, 67,
        34, 44, 34, 48, 120, 54, 49, 51, 48, 52, 48, 97, 50, 51, 57, 66, 68, 102, 67, 70, 49, 49,
        48, 57, 54, 57, 102, 101, 99, 66, 52, 49, 99, 54, 102, 57, 50, 69, 65, 51, 53, 49, 53, 67,
        48, 34, 44, 34, 48, 120, 48, 97, 54, 51, 97, 67, 67, 51, 55, 51, 53, 101, 56, 50, 53, 68,
        55, 68, 49, 51, 50, 52, 51, 70, 68, 55, 54, 98, 65, 100, 52, 57, 51, 51, 49, 98, 97, 69, 48,
        69, 34, 44, 34, 48, 120, 50, 102, 99, 57, 50, 50, 66, 101, 101, 57, 48, 50, 53, 50, 48, 99,
        52, 54, 56, 49, 99, 53, 98, 98, 100, 57, 55, 57, 48, 56, 67, 55, 50, 55, 54, 54, 52, 101,
        53, 54, 34, 44, 34, 48, 120, 48, 67, 56, 53, 102, 50, 55, 53, 53, 48, 99, 97, 98, 51, 49,
        50, 55, 70, 66, 54, 68, 97, 56, 52, 69, 54, 68, 68, 99, 101, 67, 102, 51, 52, 50, 55, 50,
        102, 68, 48, 34, 93, 125, 125, 44, 34, 110, 111, 110, 99, 101, 34, 58, 34, 48, 120, 48, 34,
        44, 34, 116, 105, 109, 101, 115, 116, 97, 109, 112, 34, 58, 34, 48, 120, 48, 34, 44, 34,
        101, 120, 116, 114, 97, 68, 97, 116, 97, 34, 58, 34, 48, 120, 48, 48, 34, 44, 34, 103, 97,
        115, 76, 105, 109, 105, 116, 34, 58, 34, 48, 120, 49, 51, 49, 50, 100, 48, 48, 34, 44, 34,
        100, 105, 102, 102, 105, 99, 117, 108, 116, 121, 34, 58, 34, 48, 120, 48, 34, 44, 34, 109,
        105, 120, 72, 97, 115, 104, 34, 58, 34, 48, 120, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 34, 44, 34, 99, 111, 105, 110, 98, 97, 115, 101, 34, 58, 34, 48,
        120, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 34, 44, 34, 97, 108,
        108, 111, 99, 34, 58, 123, 34, 48, 67, 56, 53, 102, 50, 55, 53, 53, 48, 99, 97, 98, 51, 49,
        50, 55, 70, 66, 54, 68, 97, 56, 52, 69, 54, 68, 68, 99, 101, 67, 102, 51, 52, 50, 55, 50,
        102, 68, 48, 34, 58, 123, 34, 98, 97, 108, 97, 110, 99, 101, 34, 58, 34, 48, 120, 53, 50,
        98, 55, 100, 50, 100, 99, 99, 56, 48, 99, 100, 50, 101, 52, 48, 48, 48, 48, 48, 48, 34, 125,
        44, 34, 48, 97, 54, 51, 97, 67, 67, 51, 55, 51, 53, 101, 56, 50, 53, 68, 55, 68, 49, 51, 50,
        52, 51, 70, 68, 55, 54, 98, 65, 100, 52, 57, 51, 51, 49, 98, 97, 69, 48, 69, 34, 58, 123,
        34, 98, 97, 108, 97, 110, 99, 101, 34, 58, 34, 48, 120, 53, 50, 98, 55, 100, 50, 100, 99,
        99, 56, 48, 99, 100, 50, 101, 52, 48, 48, 48, 48, 48, 48, 34, 125, 44, 34, 50, 102, 99, 57,
        50, 50, 66, 101, 101, 57, 48, 50, 53, 50, 48, 99, 52, 54, 56, 49, 99, 53, 98, 98, 100, 57,
        55, 57, 48, 56, 67, 55, 50, 55, 54, 54, 52, 101, 53, 54, 34, 58, 123, 34, 98, 97, 108, 97,
        110, 99, 101, 34, 58, 34, 48, 120, 53, 50, 98, 55, 100, 50, 100, 99, 99, 56, 48, 99, 100,
        50, 101, 52, 48, 48, 48, 48, 48, 48, 34, 125, 44, 34, 54, 49, 51, 48, 52, 48, 97, 50, 51,
        57, 66, 68, 102, 67, 70, 49, 49, 48, 57, 54, 57, 102, 101, 99, 66, 52, 49, 99, 54, 102, 57,
        50, 69, 65, 51, 53, 49, 53, 67, 48, 34, 58, 123, 34, 98, 97, 108, 97, 110, 99, 101, 34, 58,
        34, 48, 120, 53, 50, 98, 55, 100, 50, 100, 99, 99, 56, 48, 99, 100, 50, 101, 52, 48, 48, 48,
        48, 48, 48, 34, 125, 44, 34, 56, 100, 98, 57, 55, 67, 55, 99, 69, 99, 69, 50, 52, 57, 99,
        50, 98, 57, 56, 98, 68, 67, 48, 50, 50, 54, 67, 99, 52, 67, 50, 65, 53, 55, 66, 70, 53, 50,
        70, 67, 34, 58, 123, 34, 98, 97, 108, 97, 110, 99, 101, 34, 58, 34, 48, 120, 53, 50, 98, 55,
        100, 50, 100, 99, 99, 56, 48, 99, 100, 50, 101, 52, 48, 48, 48, 48, 48, 48, 34, 125, 125,
        44, 34, 110, 117, 109, 98, 101, 114, 34, 58, 34, 48, 120, 48, 34, 44, 34, 103, 97, 115, 85,
        115, 101, 100, 34, 58, 34, 48, 120, 48, 34, 44, 34, 112, 97, 114, 101, 110, 116, 72, 97,
        115, 104, 34, 58, 34, 48, 120, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48,
        48, 48, 48, 34, 125,
      ],
      subnet_auth: {
        sig_indices: [0],
      },
      subnet_id: "2fDS6xuByYrwvsz5LWVwcWTGekq6rYAnDW5t95swJUtbH1y4Wv",
      vm_id: "srEXiWaHuhNyGwPUi444Tu47ZEDwxTWrbQiuD7FmgSAQ6X7Dy",
    },
  },
};
const p_create_subnet: AvaTx = {
  P: {
    CreateSubnet: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 199995999897000000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "wnKrqWQB7WCDndqeT3vc74u7x33Cu3PXwKoW7b56qicHr9BCB",
          },
        ],
        networkID: 1000000,
        outputs: [
          {
            assetID: "23Jm99vRyu47E28g8isXrPKJtHtWzTfSLB49TehKEmg5vzWzzu",
            output: {
              addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
              amount: 199995999797000000,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      creds: [],
      owner: {
        addresses: ["AFmizAhcFuJm3u3Jih8TQ7ACCJnUY3yTK"],
        locktime: 0,
        threshold: 1,
      },
    },
  },
};
const p_export: AvaTx = {
  P: {
    Export: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: [
          {
            assetID: "vTuCKDSPV9thCMycgWVntk4WrY14ssr8FNinrbvYZaZabcr1W",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 500000000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "11111111111111111111111111111111LpoYY",
          },
        ],
        networkID: 10,
        outputs: null,
      },
      creds: [],
      destination_chain_id: "LUC1cmcxnfNR9LdkACS2ccGKLEK7SYqB4gLLTycQfg1koyfSq",
      destination_chain_transferable_outputs: [
        {
          assetID: "vTuCKDSPV9thCMycgWVntk4WrY14ssr8FNinrbvYZaZabcr1W",
          output: {
            addresses: ["6ZmBHXTqjknJoZtXbnJ6x7af863rXDTwx"],
            amount: 499999900,
            locktime: 0,
            threshold: 1,
          },
          stakeable_lock_out: null,
        },
      ],
    },
  },
};
const p_import: AvaTx = {
  P: {
    Import: {
      base_tx: {
        blockchainID: "11111111111111111111111111111111LpoYY",
        inputs: null,
        networkID: 10,
        outputs: null,
      },
      creds: [],
      source_chain_id: "LUC1cmcxnfNR9LdkACS2ccGKLEK7SYqB4gLLTycQfg1koyfSq",
      source_chain_transferable_inputs: [
        {
          assetID: "vTuCKDSPV9thCMycgWVntk4WrY14ssr8FNinrbvYZaZabcr1W",
          fxID: "11111111111111111111111111111111LpoYY",
          input: {
            amount: 100,
            signatureIndices: [0],
          },
          outputIndex: 1,
          stakeable_lock_in: null,
          txID: "TtF4d2QWbk5vzQGTEPrN48x6vwgAoAmKQ9cbp79inpQmcRKES",
        },
      ],
    },
  },
};
const x_base: AvaTx = {
  X: {
    Base: {
      base_tx: {
        blockchainID: "3D7sudhzUKTYFkYj4Zoe7GgSKhuyP9bYwXunHwhZsmQe1z9Mp",
        inputs: [
          {
            assetID: "SkB7qHwfMsyF2PgrjhMvtFxJKhuR5ZfVoW9VATWRV4P9jV7J",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 54321,
              signatureIndices: [2],
            },
            outputIndex: 1,
            stakeable_lock_in: null,
            txID: "2wk5Q9nM5KwsrXkgxHE2qwoK6BdPrLT6Lh3Eroyn7NQLywJPBs",
          },
        ],
        memo: "0x00010203",
        networkID: 10,
        outputs: [
          {
            assetID: "SkB7qHwfMsyF2PgrjhMvtFxJKhuR5ZfVoW9VATWRV4P9jV7J",
            output: {
              addresses: ["Q4MzFZZDPHRPAHFeDs3NiyyaZDvxHKivf"],
              amount: 12345,
              locktime: 0,
              threshold: 1,
            },
            stakeable_lock_out: null,
          },
        ],
      },
      fx_creds: [],
    },
  },
};
const x_export: AvaTx = {
  X: {
    Export: {
      base_tx: {
        blockchainID: "2wkBET1hoeo1jE9q5Mh3tivX7WF4haVKFNtJh6hYpwsSuwBPDm",
        inputs: [
          {
            assetID: "EmBFb5SpxgjA3hAqWTyQq3vsU1YcPciewSgQKFb5q9HKtMUFg",
            fxID: "11111111111111111111111111111111LpoYY",
            input: {
              amount: 1000,
              signatureIndices: [0],
            },
            outputIndex: 0,
            stakeable_lock_in: null,
            txID: "7gsn8emLM1vGPQxSUSA3RG86UGg2STr2ViD8Xm5Y73Kbj8dfV",
          },
        ],
        memo: "0x00010203",
        networkID: 2,
        outputs: null,
      },
      destination_chain_id: "EuBfhQDfCEzzbopoiJ9pBfeME5RagYpA8SENG8KbCbjzeKtuL",
      destination_chain_transferable_outputs: null,
      fx_creds: [],
    },
  },
};
const x_import: AvaTx = {
  X: {
    Import: {
      base_tx: {
        blockchainID: "2wkBET1hoeo1jE9q5Mh3tivX7WF4haVKFNtJh6hYpwsSuwBPDm",
        inputs: null,
        memo: "0x00010203",
        networkID: 2,
        outputs: null,
      },
      fx_creds: [],
      source_chain_id: "EuBfhQDfCEzzbopoiJ9pBfeME5RagYpA8SENG8KbCbjzeKtuL",
      source_chain_transferable_inputs: [
        {
          assetID: "EmBFb5SpxgjA3hAqWTyQq3vsU1YcPciewSgQKFb5q9HKtMUFg",
          fxID: "11111111111111111111111111111111LpoYY",
          input: {
            amount: 1000,
            signatureIndices: [0],
          },
          outputIndex: 0,
          stakeable_lock_in: null,
          txID: "7gsn8emLM1vGPQxSUSA3RG86UGg2STr2ViD8Xm5Y73Kbj8dfV",
        },
      ],
    },
  },
};

export const all: AvaTx[] = [
  p_add_permissionless_validator,
  p_add_subnet_validator,
  p_add_validator,
  p_create_chain,
  p_create_subnet,
  p_export,
  p_import,
  x_base,
  x_export,
  x_import,
];
