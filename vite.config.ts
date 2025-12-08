import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// @ts-ignore - TypeScript file in scripts
import { debugPlugin } from './scripts/vite-debug-plugin.ts';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log environment variables during build
  console.log('[VITE CONFIG] Building in mode:', mode);
  console.log('[VITE CONFIG] Environment variables loaded:', Object.keys(env).filter(k => k.startsWith('VITE_')).length);
  
  return {
    plugins: [
      react(),
      // Add debug plugin in all modes for troubleshooting
      debugPlugin()
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './frontend'),
      },
    },
    // Ensure environment variables are properly exposed
    define: {
      // Explicitly define global constants if needed
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    // Add build options for better debugging
    build: {
      sourcemap: true, // Enable source maps for debugging
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          // Add build timestamp to file names for cache busting
          entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
        }
      }
    },
    // Server options for development
    server: {
      port: 5173,
      strictPort: false,
      open: false,
    }
  };
});
