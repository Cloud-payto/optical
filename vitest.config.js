import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Test environment
    environment: 'node',

    // Global test timeout
    testTimeout: 30000,

    // Include test files
    include: [
      'server/**/*.test.js',
      'server/**/*.spec.js',
      'src/**/*.test.{ts,tsx}',
      'src/**/*.spec.{ts,tsx}'
    ],

    // Coverage settings (optional but recommended)
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'dist/',
        'server/tests/',
        '**/*.config.js',
        '**/*.d.ts'
      ]
    },

    // Show test output
    reporters: ['verbose'],

    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      SUPABASE_URL: process.env.SUPABASE_URL || 'http://localhost:54321',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
