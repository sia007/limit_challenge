import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const eslintConfig = defineConfig([
  globalIgnores(['dist/**', 'node_modules/**']),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: 'react-hooks',
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules },
  },
  prettierConfig,
  {
    name: 'prettier-plugin',
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
]);

export default eslintConfig;
