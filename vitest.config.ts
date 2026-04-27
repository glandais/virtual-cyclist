import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    define: {
        __DEV__: JSON.stringify(true),
    },
    resolve: {
        alias: {
            '@glandais/elevation': path.resolve(__dirname, 'test/__mocks__/@glandais/elevation.ts'),
            '@': path.resolve(__dirname, 'src'),
            '#': path.resolve(__dirname, 'test'),
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        testTimeout: 30000,
        include: ['test/**/*.test.ts'],
        exclude: ['node_modules/**', 'test/browser/**', 'dist/**'],
        setupFiles: ['test/setup.ts'],
        coverage: {
            provider: 'v8',
            reportsDirectory: 'coverage',
            reporter: ['text', 'lcov', 'html'],
            include: ['src/**/*.ts'],
            exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/utils/Logger.ts', 'src/codegen/**'],
            thresholds: {
                branches: 80,
                functions: 80,
                lines: 80,
                statements: 80,
            },
        },
    },
});
