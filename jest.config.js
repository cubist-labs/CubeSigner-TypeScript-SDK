/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testTimeout: 15000,
  testEnvironment: 'node',
  testMatch: ["**/test/**/*.test.[jt]s"],
};
