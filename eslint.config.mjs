import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    rules: {
      // Disable unescaped quotes error in JSX
      "react/no-unescaped-entities": "off",

      // Temporarily disable no-unused-vars (or warn instead of error)
      "@typescript-eslint/no-unused-vars": "warn",

      // Temporarily allow `any` type
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;
