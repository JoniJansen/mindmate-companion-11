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

      // Elite-Audit #9: prevent new inline `language === "de" ? "..." : "..."`
      // ternaries from being added. Existing 395 occurrences are being migrated
      // to t("key") — see audit/I18N_MIGRATION_PLAN.md.
      // Currently `warn` so the migration in-flight doesn't block CI; upgrade
      // to `error` once the plan's Batches A-G are done and grep returns 0.
      "no-restricted-syntax": [
        "warn",
        {
          selector: "ConditionalExpression[test.type='BinaryExpression'][test.operator='==='][test.left.name='language'][test.right.value='de']",
          message: "Use t('key') from useTranslation instead of inline `language === \"de\" ? ... : ...` ternaries. See audit/I18N_MIGRATION_PLAN.md.",
        },
      ],
    },
  },
);
