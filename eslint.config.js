import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",

      // Elite-Audit #9: forbid inline `language === "de" ? "..." : "..."`
      // ternaries. Migration is complete (grep returns 0). Rule is at `error`
      // so any regression is caught in CI. If you legitimately need to branch
      // on language for a config value (locale strings, date-fns Locale
      // objects), use `language === "en"` instead — that pattern is not
      // caught by this rule and is the correct escape hatch.
      "no-restricted-syntax": [
        "error",
        {
          selector: "ConditionalExpression[test.type='BinaryExpression'][test.operator='==='][test.left.name='language'][test.right.value='de']",
          message: "Use t('key') from useTranslation instead of inline `language === \"de\" ? ... : ...` ternaries. Rule at `error` — Elite-Audit #9 migration is complete. See audit/I18N_MIGRATION_PLAN.md.",
        },
      ],
    },
  },
);
