module.exports = {
    env: {
      es2021: true,
      node: true,
    },
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 13,
      sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/ban-types": "off",
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/prefer-const": "off",
      '@typescript-eslint/no-floating-promises': 'error',
      // "@typescript-eslint/prefer-const": "off",
      // "@typescript-eslint/no-inner-declarations": "off"
    },
  }