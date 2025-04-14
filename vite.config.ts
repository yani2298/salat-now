import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Vérifier si on doit optimiser les polices
const optimizeFonts = process.env.OPTIMIZE_FONTS === 'true'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: {
      plugins: [require('tailwindcss'), require('autoprefixer')],
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.trace'],
      },
      mangle: {
        safari10: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'framer-motion'],
          ui: ['@headlessui/react', '@heroicons/react', 'clsx'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // Si optimizeFonts est actif, on filtre certaines polices
          if (optimizeFonts && assetInfo.name && /\.(woff2?|ttf|otf)$/.test(assetInfo.name)) {
            // Ne garder que les polices arabes principales
            if (assetInfo.name.includes('-arabic-') && 
               (assetInfo.name.includes('-400-') || assetInfo.name.includes('-700-'))) {
              return 'assets/fonts/[name][extname]';
            }
            // Ignorer les autres variantes de polices
            return '';
          }
          
          // Comportement normal pour les autres fichiers
          if (assetInfo.name && /\.(woff2?|ttf|otf)$/.test(assetInfo.name)) {
            return 'assets/fonts/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  server: {
    hmr: {
      overlay: true,
    },
    watch: {
      ignored: ['**/tsconfig.json']
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: [],
  },
  base: './', // Utiliser des chemins relatifs
})
