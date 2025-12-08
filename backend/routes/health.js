const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabase');

/**
 * Health check endpoint for debugging Supabase connectivity
 * GET /api/health
 */
router.get('/', async (req, res) => {
  console.log('[HEALTH] Health check requested');
  
  const healthInfo = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      mode: process.env.NODE_ENV || 'development',
    },
    supabase: {
      server: {
        urlConfigured: false,
        serviceKeyConfigured: false,
        clientHealthy: false,
        testResult: null,
        error: null,
      },
      frontend: {
        viteUrlPresent: !!process.env.VITE_SUPABASE_URL,
        viteKeyPresent: !!process.env.VITE_SUPABASE_ANON_KEY,
        viteUrlPrefix: process.env.VITE_SUPABASE_URL ? 
          process.env.VITE_SUPABASE_URL.substring(0, 20) + '...' : 'not set',
        viteKeyLength: process.env.VITE_SUPABASE_ANON_KEY ? 
          process.env.VITE_SUPABASE_ANON_KEY.length : 0,
      }
    },
    server: {
      memoryUsage: process.memoryUsage(),
      port: process.env.PORT || 3001,
    }
  };

  // Check server-side Supabase configuration
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  healthInfo.supabase.server.urlConfigured = !!supabaseUrl;
  healthInfo.supabase.server.serviceKeyConfigured = !!supabaseServiceKey;

  if (supabaseUrl) {
    healthInfo.supabase.server.urlPrefix = supabaseUrl.substring(0, 30) + '...';
  }

  // Test server-side Supabase connectivity
  if (supabase) {
    healthInfo.supabase.server.clientHealthy = true;
    
    try {
      // Simple query to test connectivity
      console.log('[HEALTH CHECK] Testing server-side Supabase connectivity...');
      const { error } = await supabase
        .from('_health_check')
        .select('*')
        .limit(1);
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 means table doesn't exist, which is fine for health check
        healthInfo.supabase.server.testResult = 'error';
        healthInfo.supabase.server.error = error.message;
        healthInfo.status = 'degraded';
        console.error('[HEALTH CHECK] Supabase test failed:', error);
      } else {
        healthInfo.supabase.server.testResult = 'success';
        console.log('[HEALTH CHECK] Server-side Supabase connectivity verified');
      }
    } catch (err) {
      healthInfo.supabase.server.testResult = 'exception';
      healthInfo.supabase.server.error = err.message;
      healthInfo.status = 'degraded';
      console.error('[HEALTH CHECK] Supabase test exception:', err);
    }
  } else {
    healthInfo.supabase.server.clientHealthy = false;
    healthInfo.status = 'degraded';
  }

  // Add warnings for missing frontend env vars
  const warnings = [];
  if (!process.env.VITE_SUPABASE_URL) {
    warnings.push('VITE_SUPABASE_URL is not set (frontend will fail)');
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY) {
    warnings.push('VITE_SUPABASE_ANON_KEY is not set (frontend will fail)');
  }

  if (warnings.length > 0) {
    healthInfo.warnings = warnings;
    if (healthInfo.status === 'ok') {
      healthInfo.status = 'warning';
    }
  }

  console.log('[HEALTH] Health check result:', {
    status: healthInfo.status,
    warnings: warnings.length,
    frontendConfigured: healthInfo.supabase.frontend.viteUrlPresent && healthInfo.supabase.frontend.viteKeyPresent,
    serverConfigured: healthInfo.supabase.server.urlConfigured && healthInfo.supabase.server.serviceKeyConfigured
  });

  // Set appropriate status code
  const statusCode = healthInfo.status === 'ok' ? 200 : 
                     healthInfo.status === 'warning' ? 200 :
                     healthInfo.status === 'degraded' ? 206 : 503;

  res.status(statusCode).json(healthInfo);
});

/**
 * Detailed debug endpoint
 * GET /api/health/debug
 */
router.get('/debug', async (req, res) => {
  // Only allow in development or with debug header
  if (process.env.NODE_ENV === 'production' && 
      req.headers['x-debug-token'] !== process.env.DEBUG_TOKEN) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    headers: req.headers,
    env: {
      // List all environment variables (redacted)
      ...Object.keys(process.env).reduce((acc, key) => {
        if (key.includes('KEY') || key.includes('SECRET') || key.includes('PASSWORD')) {
          acc[key] = '[REDACTED]';
        } else if (key.includes('URL')) {
          acc[key] = process.env[key] ? process.env[key].substring(0, 30) + '...' : 'not set';
        } else {
          acc[key] = process.env[key] || 'not set';
        }
        return acc;
      }, {})
    },
    supabase: {
      configured: !!supabase,
      url: process.env.SUPABASE_URL ? 'set' : 'not set',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'not set',
    },
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
      versions: process.versions,
    }
  };

  res.json(debugInfo);
});

module.exports = router;