// @ts-check
import tseslint from "typescript-eslint";
import jsdoc from "eslint-plugin-jsdoc";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/public/**", "**/node_modules/**"] },
  ...tseslint.configs.recommended,
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    plugins: { jsdoc, "@stylistic": stylistic },
    rules: {
      // ---- TSDoc: public なものには必ず、かつ複数行ブロックで書く ----
      "jsdoc/require-jsdoc": ["error", {
        publicOnly: true,
        require: { ClassDeclaration: true, MethodDefinition: true, FunctionDeclaration: true, ArrowFunctionExpression: false },
        contexts: [
          "TSInterfaceDeclaration", "TSTypeAliasDeclaration", "TSEnumDeclaration",
          "ExportNamedDeclaration > VariableDeclaration",
          "MethodDefinition[accessibility!='private'][accessibility!='protected'][kind!='constructor']",
          "TSMethodSignature", "TSPropertySignature",
        ],
        checkGetters: true,
        checkSetters: true,
        checkConstructors: false,
      }],
      "jsdoc/multiline-blocks": ["error", { noSingleLineBlocks: true, noZeroLineText: true, minimumLengthForMultiline: 0 }],
      "jsdoc/require-description": ["error", { contexts: ["any"] }],
      "jsdoc/check-alignment": "error",
      "jsdoc/no-types": "off",
      "jsdoc/require-param": ["error", { checkDestructured: false }],
      "jsdoc/require-param-description": "error",
      "jsdoc/check-param-names": ["error", { checkDestructured: false }],
      "jsdoc/require-returns": ["error", { checkGetters: false }],
      "jsdoc/require-returns-description": "error",
      "jsdoc/require-throws": "error",
      "jsdoc/tag-lines": ["error", "any", { startLines: 1 }],
      // ---- 空行: クラスメンバー間・宣言間 ----
      "@stylistic/lines-between-class-members": ["error", "always", { exceptAfterSingleLine: false }],
      "@stylistic/padding-line-between-statements": ["error",
        { blankLine: "always", prev: "*", next: ["class", "function", "export"] },
        { blankLine: "always", prev: ["class", "function"], next: "*" },
        { blankLine: "always", prev: "import", next: "*" },
        { blankLine: "any", prev: "import", next: "import" },
      ],
      // ---- 緩和 ----
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  // web は React コンポーネント中心なので TSDoc 必須ルールは緩和（書く場合の書式ルールは維持）
  { files: ["packages/web/src/**/*.{ts,tsx}"], rules: { "jsdoc/require-jsdoc": "off", "jsdoc/require-param": "off", "jsdoc/require-param-description": "off", "jsdoc/require-returns": "off", "jsdoc/require-throws": "off" } },
  // index.ts は re-export の羅列なので空行ルールは適用しない
  { files: ["**/index.ts"], rules: { "@stylistic/padding-line-between-statements": "off" } },
);
