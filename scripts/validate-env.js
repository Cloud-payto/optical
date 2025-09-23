#!/usr/bin/env node

/**
 * Build-time environment variable validation script
 * Run this before building to ensure all required env vars are present
 */

console.log('🔍 Validating environment variables...\n');

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_API_URL'
];

const optionalEnvVars = [
  'VITE_APP_NAME',
  'VITE_VERSION',
  'VITE_BASE_URL',
  'VITE_ENABLE_DEBUG',
  'VITE_ENABLE_ANALYTICS'
];

let hasErrors = false;

console.log('📋 Build Environment:');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   CI: ${process.env.CI || 'false'}`);
console.log(`   Platform: ${process.platform}`);
console.log(`   Node Version: ${process.version}`);
console.log('');

console.log('✅ Required Environment Variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    // Safely display partial values
    let displayValue = value;
    if (varName.includes('KEY') || varName.includes('SECRET')) {
      displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 10);
    } else if (varName.includes('URL')) {
      displayValue = value.substring(0, 30) + '...';
    }
    console.log(`   ${varName}: ${displayValue} (${value.length} chars)`);
  } else {
    console.error(`   ❌ ${varName}: NOT SET`);
    hasErrors = true;
  }
});

console.log('\n📦 Optional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`   ${varName}: ${value}`);
  } else {
    console.log(`   ${varName}: not set (optional)`);
  }
});

// Check for common mistakes
console.log('\n🔍 Common Issues Check:');

// Check if any env vars are literally "undefined" or "null"
const allEnvVars = [...requiredEnvVars, ...optionalEnvVars];
allEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value === 'undefined' || value === 'null' || value === '${' + varName + '}') {
    console.error(`   ⚠️  ${varName} is set to "${value}" - this looks like a placeholder!`);
    hasErrors = true;
  }
});

// Check Supabase URL format
const supabaseUrl = process.env.VITE_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.includes('.supabase.co')) {
  console.error('   ⚠️  VITE_SUPABASE_URL doesn\'t contain ".supabase.co" - is this correct?');
}

// Check API URL format
const apiUrl = process.env.VITE_API_URL;
if (apiUrl && !apiUrl.startsWith('http')) {
  console.error('   ⚠️  VITE_API_URL doesn\'t start with "http" - should be a full URL');
}

// Check for Vercel/deployment environment
console.log('\n🚀 Deployment Environment:');
if (process.env.VERCEL) {
  console.log('   Running on Vercel');
  console.log(`   VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`);
  console.log(`   VERCEL_URL: ${process.env.VERCEL_URL || 'not set'}`);
} else if (process.env.NETLIFY) {
  console.log('   Running on Netlify');
  console.log(`   CONTEXT: ${process.env.CONTEXT || 'not set'}`);
  console.log(`   URL: ${process.env.URL || 'not set'}`);
} else if (process.env.CI) {
  console.log('   Running in CI environment');
} else {
  console.log('   Running locally');
}

// Create a .env.validation file with results
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validationResults = {
  timestamp: new Date().toISOString(),
  platform: process.platform,
  nodeVersion: process.version,
  environment: process.env.NODE_ENV || 'development',
  required: {},
  optional: {},
  errors: []
};

requiredEnvVars.forEach(varName => {
  validationResults.required[varName] = !!process.env[varName];
});

optionalEnvVars.forEach(varName => {
  validationResults.optional[varName] = !!process.env[varName];
});

// Write validation results
const outputPath = path.join(__dirname, '..', 'env-validation.json');
fs.writeFileSync(outputPath, JSON.stringify(validationResults, null, 2));
console.log(`\n📄 Validation results written to: ${outputPath}`);

// Exit with error code if validation failed
if (hasErrors) {
  console.error('\n❌ Environment validation failed!');
  console.error('Please ensure all required environment variables are set.');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!');
  process.exit(0);
}