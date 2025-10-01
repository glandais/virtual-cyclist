const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const vuePlugin = require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');

module.exports = [
    js.configs.recommended,
    ...vuePlugin.configs['flat/essential'],
    prettier,
    {
        ignores: ['node_modules/', 'dist/', 'build/'],
    },
    {
        files: ['**/*.vue', '**/*.ts', '**/*.tsx'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            parser: vueParser,
            parserOptions: {
                parser: tsparser,
                ecmaVersion: 2021,
                sourceType: 'module',
            },
            globals: {
                __DEV__: 'readonly',
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                fetch: 'readonly',
                alert: 'readonly',
                File: 'readonly',
                Event: 'readonly',
                HTMLElement: 'readonly',
                HTMLCanvasElement: 'readonly',
                HTMLInputElement: 'readonly',
                HTMLSelectElement: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            vue: vuePlugin,
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-console': 'off',
            'no-var': 'error',
            'prefer-const': 'error',
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'brace-style': ['error', '1tbs'],
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-unused-vars': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            'vue/multi-word-component-names': 'off',
            'vue/require-default-prop': 'off',
        },
    },
    {
        files: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.ts'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            globals: {
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
            },
        },
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': 'error',
            'no-console': 'off',
        },
    },
];
