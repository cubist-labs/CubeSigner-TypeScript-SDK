/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testTimeout: 30000,
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/*.test.[jt]s"],
  verbose: true,
};
