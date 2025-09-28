import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
    // By default, 'npm run build' runs in production mode
    // To build with logging enabled, use: 'npm run build -- --mode development'
    const isDev = mode === 'development';

    return {
        plugins: [
            dts({
                insertTypesEntry: true,
                rollupTypes: false,
                copyDtsFiles: false,
                entryRoot: 'src',
                outDir: 'dist',
                exclude: ['test/**/*', '**/*.test.*'],
            }),
        ],
        define: {
            // Define __DEV__ based on build mode
            // Production build (default): __DEV__ = false, all logging code removed
            // Development build: __DEV__ = true, logging enabled
            __DEV__: JSON.stringify(isDev),
        },
        build: {
            sourcemap: true,
            outDir: 'dist',
            emptyOutDir: true,
            lib: {
                entry: resolve(__dirname, 'src/index.ts'),
                name: 'virtualcyclist',
                formats: ['es', 'umd', 'iife'],
                fileName: format => {
                    switch (format) {
                        case 'es':
                            return 'index.esm.js';
                        case 'umd':
                            return 'index.umd.js';
                        case 'iife':
                            return 'index.min.js';
                        default:
                            return `index.${format}.js`;
                    }
                },
            },
        },
    };
});
