import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: [
            { find: '@lib', replacement: path.resolve(__dirname, '../src') },
            { find: /^@\/(.*)$/, replacement: path.resolve(__dirname, '../src/$1') },
            { find: /^~\/(.*)$/, replacement: path.resolve(__dirname, './src/$1') },
        ],
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    define: {
        __DEV__: JSON.stringify(true), // Enable development mode for library
    },
    base: './',
    build: {
        sourcemap: true,
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            external: [],
        },
    },
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['@glandais/elevation', 'chart.js', 'chartjs-plugin-zoom'],
    },
});
