import commonjs from "@rollup/plugin-commonjs";

export default {
  root: "app",
  plugins: [commonjs()],
  optimizeDeps: {
    include: ["@cubist-labs/cubesigner-sdk", "@cubist-labs/cubesigner-sdk-browser-storage"],
  },
  build: {
    commonjsOptions: {
      include: ["@cubist-labs/cubesigner-sdk", "@cubist-labs/cubesigner-sdk-browser-storage"],
    },
  },
};
