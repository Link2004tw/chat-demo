import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals"),
  {
    // Build output, dependencies and tooling artifacts — lint source only.
    // (Raw `eslint .` used to scan `.next/` chunks and report ~980 false
    // problems from minified code.)
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      ".claude/**",
      "next.config.mjs",
      "postcss.config.mjs",
    ],
  },
];

export default eslintConfig;
