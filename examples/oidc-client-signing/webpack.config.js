const path = require("path");

module.exports = {
  entry: "../../dist/src/index.js",
  target: "web",
  mode: "production",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "sdk.js",
    library: "cs",
    libraryTarget: "umd",
  },
  externals: {
    "@aws-sdk/client-cognito-identity-provider": "@aws-sdk/client-cognito-identity-provider",
    bufferutil: "bufferutil",
    "utf-8-validate": "utf-8-validate",
  },
  resolve: {
    fallback: {
      path: false,
      assert: false,
      fs: false,
    },
  },
};
