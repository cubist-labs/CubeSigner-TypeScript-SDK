/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testTimeout: 15000,
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/*.test.[jt]s"],
  reporters: [
    "default",
    ["jest-summary-reporter", {"failuresOnly": false}]
  ]
};
