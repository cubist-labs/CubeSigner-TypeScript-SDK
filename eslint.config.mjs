// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
import pluginChaiFriendly from "eslint-plugin-chai-friendly";
import { FlatCompat } from "@eslint/eslintrc";

export default tseslint.config(
  {
    ignores: [
      "**/*.config.*",
      "**/*.js",
      "**/dist",
      "**/node_modules",
      "**/jest.config.ts",
      "packages/sdk/src/schema.ts",
      "scripts/readme_test_template/**/*",
    ],
  },
  eslint.configs.recommended,
  // NOTE: we're installing eslint-config-google from the latest git hash
  // because the npm release is outdated and missing a fix to work on eslint 9
  ...new FlatCompat().extends("eslint-config-google"),
  {
    plugins: {
      jsdoc,
    },
    rules: {
      "jsdoc/require-jsdoc": "error",
    },
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-non-null-assertion": "off",
      camelcase: "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "@typescript-eslint/no-floating-promises": ["error"],

      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
    },

    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },

      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["packages/*/test/**/*", "examples/cardano/test/**/*"],
    // TODO: test files don't have typed lints because they are not included in our TypeScript projects
    //
    // This is beneficial because they don't get included in the builds submitted to NPM, but bad
    // because typescript-eslint needs them to be associated with a project
    //
    // If we want to lint them, we should associate them with a project and
    // figure out a different way for the build process to ignore them
    extends: [tseslint.configs.disableTypeChecked],
    plugins: { "chai-friendly": pluginChaiFriendly },
    rules: {
      // Allow for chai expect statements
      "@typescript-eslint/no-unused-expressions": "off",
      "chai-friendly/no-unused-expressions": "error",
    },
  },
);
