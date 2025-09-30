const js = require('@eslint/js');
const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const prettier = require('eslint-config-prettier');
const prettierPlugin = require('eslint-plugin-prettier');
const importPlugin = require('eslint-plugin-import');

// ============================================================================
// SHARED GLOBALS
// ============================================================================

const commonGlobals = {
    __DEV__: 'readonly',
};

const nodeGlobals = {
    module: 'readonly',
    require: 'readonly',
    process: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    global: 'readonly',
};

const browserGlobals = {
    window: 'readonly',
    document: 'readonly',
    console: 'readonly',
    DOMException: 'readonly',
};

const domXmlGlobals = {
    Document: 'readonly',
    Element: 'readonly',
    NodeListOf: 'readonly',
    DOMParser: 'readonly',
    XMLSerializer: 'readonly',
};

const jestGlobals = {
    describe: 'readonly',
    it: 'readonly',
    test: 'readonly',
    expect: 'readonly',
    beforeAll: 'readonly',
    beforeEach: 'readonly',
    afterAll: 'readonly',
    afterEach: 'readonly',
    jest: 'readonly',
};

// ============================================================================
// SHARED RULES
// ============================================================================

const commonRules = {
    'prettier/prettier': 'error',
    'no-console': 'off',
    'no-var': 'error',
    'prefer-const': 'error',
    eqeqeq: ['error', 'always'],
    curly: ['error', 'all'],
    'brace-style': ['error', '1tbs'],
};

// ============================================================================
// CONFIGURATIONS
// ============================================================================

module.exports = [
    js.configs.recommended,
    prettier,
    {
        ignores: ['node_modules/', 'coverage/', 'dist/', 'build/', '.github/', '*.min.js'],
    },
    {
        files: ['*.js'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'script',
            globals: {
                ...commonGlobals,
                ...nodeGlobals,
                ...browserGlobals,
                ...domXmlGlobals,
                ...jestGlobals,
            },
        },
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            ...commonRules,
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    {
        files: ['src/**/*.ts', 'test/**/*.ts'],
        languageOptions: {
            ecmaVersion: 2021,
            sourceType: 'module',
            parser: tsparser,
            globals: {
                ...commonGlobals,
                ...nodeGlobals,
                ...browserGlobals,
                ...domXmlGlobals,
                ...jestGlobals,
                performance: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tseslint,
            prettier: prettierPlugin,
            import: importPlugin,
        },
        rules: {
            ...commonRules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            'no-unused-vars': 'off',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-inferrable-types': 'off',
            //'import/no-relative-parent-imports': 'error',
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: '^@$',
                            message:
                                'Importing from @ is not allowed. Use specific module paths like @/types/ or @/utils/ instead.',
                        },
                        {
                            regex: '^@/(?!.*/$)',
                            message:
                                'Imports from @/ must end with a trailing slash (e.g., @/module/ not @/module)',
                        },
                        {
                            regex: '^\\./.*/.*',
                            message:
                                'Relative imports (starting with .) are not allowed. Use @/ alias instead.',
                        },
                    ],
                },
            ],
            'import/no-duplicates': 'error',
        },
        settings: {
            'import/resolver': {
                typescript: {
                    project: './tsconfig.json',
                },
            },
        },
    },
    {
        files: ['**/index.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: '^(?!\\./[a-zA-Z0-9]+$.*)',
                            message:
                                'index.ts files can only import from sibling files using ./[a-zA-Z]+ pattern',
                        },
                    ],
                },
            ],
        },
    },
];
