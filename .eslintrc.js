module.exports = {
  extends: ["universe/native"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    "prettier/prettier": "off",
    "linebreak-style": "off",
    "import/no-duplicates": "off",
    semi: ["error", "always"],
  },
};
