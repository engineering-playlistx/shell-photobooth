import eslintPluginBetterTailwindcss from "eslint-plugin-better-tailwindcss";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";
import workspaceConfig from "../../eslint.config";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default tseslint.config(
  ...workspaceConfig,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],

    plugins: {
      "better-tailwindcss": eslintPluginBetterTailwindcss,
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
      "better-tailwindcss": {
        entryPoint: "src/index.css",
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
  },
);
