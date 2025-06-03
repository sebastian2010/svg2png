import globals from "globals";
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';

export default [
  js.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-duplicate-imports': 'error',
      'no-useless-computed-key': 'error',
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      curly: 'off',
      'object-shorthand': ['warn', 'always'],
      camelcase: ['warn', { properties: 'always' }],
      'no-extend-native': 'error',
      'no-loop-func': 'error',
      'no-implied-eval': 'error',
      'no-iterator': 'error',
      'no-label-var': 'error',
      'no-multi-str': 'error',
      'no-script-url': 'error',
      'no-shadow-restricted-names': 'error',
      'no-spaced-func': 'error',
      'no-sparse-arrays': 'warn',
      'no-fallthrough': 'warn',
      'no-caller': 'error',
      'no-eval': 'error',
      'no-negated-in-lhs': 'error',
      'no-new-require': 'error',
      'block-scoped-var': 'error',
      'no-use-before-define': 'warn',
      'no-proto': 'error',
      complexity: ['warn', 50],
      'new-parens': 'error',
      yoda: ['error', 'never'],
      'no-useless-assignment': 'error',
    },
  },
];