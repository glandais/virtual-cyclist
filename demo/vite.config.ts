import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { defineConfig } from 'vite';

function manualChunks(id) {
    if (id.includes('node_modules/primevue')) {
        return 'primevue1';
    }
    if (id.includes('node_modules/@primevue')) {
        return 'primevue2';
    }
    if (id.includes('node_modules/@primeuix')) {
        return 'primeuix';
    }
    if (id.includes('node_modules/leaflet')) {
        return 'leaflet';
    }
    if (id.includes('node_modules/chart.js')) {
        return 'chartjs';
    }
    if (id.includes('node_modules')) {
        // console.log(id);
        return 'vendor';
    }
    return null;
}

export default defineConfig({
    plugins: [vue(), tailwindcss()],
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
            output: {
                manualChunks: manualChunks,
            }
        },
    },
    server: {
        port: 3000,
    },
    optimizeDeps: {
        include: ['@glandais/elevation', 'chart.js', 'chartjs-plugin-zoom'],
    },
});
