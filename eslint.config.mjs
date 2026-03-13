import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import-x'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tseslint from 'typescript-eslint'

/** @type {import("eslint").Linter.Config} */
export default [
  {
    files: ['*.js', '*.cjs', '*.mjs', '*.ts', '*.tsx', '*.jsx'],
  },
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  ...tseslint.config({
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  }),
  {
    plugins: {
      'import': importPlugin,
      'simple-import-sort': simpleImportSort,
      'prettier': eslintPluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/.vscode/**',
      '**/.history/**',
      '**/eslint.config.{js,cjs,mjs,ts}',
    ],
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx',
      '**/*.mjs',
      '**/*.cjs',
    ],
    rules: {
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
      'semi': ['error', 'never'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',
      'import/no-default-export': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['**/vitest.config.mjs'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
]
