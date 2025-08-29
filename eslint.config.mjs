import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    files: ["**/*.{ts,mts,cts}"],
    extends: [...tseslint.configs.recommended, eslintConfigPrettier],
    languageOptions: { globals: globals.browser },
  },
]);
