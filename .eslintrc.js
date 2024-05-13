module.exports = {
  extends: ["universe/native"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "prettier/prettier": [
      "error",
      {
        endOfLine: "auto", // Match Prettier's line endings
      },
    ],
    "linebreak-style": ["error", "windows"],
    semi: ["error", "always"],
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        "prettier/prettier": "warn", // Treat Prettier violations as warnings
      },
    },
  ],
};
