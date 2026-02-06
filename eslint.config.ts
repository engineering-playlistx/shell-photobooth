import js from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default tseslint.config(
  {
    ignores: ["**/.vite/"],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/electron",
    "plugin:import/typescript"
  ),
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    plugins: {
      js,
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",

      globals: {
        console: "readonly",
        window: "readonly",
        document: "readonly",
        MAIN_WINDOW_VITE_DEV_SERVER_URL: "readonly",
        MAIN_WINDOW_VITE_NAME: "readonly",
      },

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    settings: {
      react: {
        version: "detect",
      },
    },

    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/only-throw-error": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  {
    files: ["eslint.config.ts", "vite*.config.ts"],
    rules: {
      "import/no-unresolved": "off",
    },
  }
);
