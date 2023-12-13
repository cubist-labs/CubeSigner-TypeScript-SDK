const path = require("path");
const webpack = require("webpack");

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
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: [require.resolve("buffer/"), "Buffer"],
    }),
  ],
  resolve: {
    fallback: {
      path: false,
      assert: false,
      fs: false,
      crypto: false,
    },
  },
};
