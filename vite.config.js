import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
    ],
    base: './', // Utiliser des chemins relatifs
});

// Updated: 2025-07-29T19:15:40.642Z

// Updated: 2025-07-29T19:15:41.440Z
