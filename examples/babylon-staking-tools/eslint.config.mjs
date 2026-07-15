// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import jsdoc from "eslint-plugin-jsdoc";
import globals from "globals";
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
  jsdoc.configs["flat/recommended-typescript-error"],
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

      // Have one line break between description and tags, instead of zero
      "jsdoc/tag-lines": [
        "error",
        "any",
        {
          startLines: 1,
        },
      ],

      // Enforce no hyphens for consistent look
      "jsdoc/require-hyphen-before-param-description": [
        "error",
        "never",
        { tags: { returns: "never" } },
      ],

      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
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
);
