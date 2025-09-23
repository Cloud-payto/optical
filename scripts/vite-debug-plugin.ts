import { Plugin } from 'vite';

export function debugPlugin(): Plugin {
  return {
    name: 'vite-debug-plugin',
    
    configResolved(config) {
      console.log('[VITE DEBUG] Build configuration resolved');
      console.log('[VITE DEBUG] Mode:', config.mode);
      console.log('[VITE DEBUG] Command:', config.command);
      console.log('[VITE DEBUG] Base:', config.base);
      
      // Log environment variables
      console.log('[VITE DEBUG] Environment variables:');
      Object.keys(config.env).forEach(key => {
        if (key.startsWith('VITE_')) {
          const value = config.env[key];
          const displayValue = key.includes('KEY') || key.includes('SECRET') 
            ? '[REDACTED]' 
            : value?.substring(0, 50) + (value?.length > 50 ? '...' : '');
          console.log(`[VITE DEBUG]   ${key}: ${displayValue}`);
        }
      });
    },
    
    buildStart() {
      console.log('[VITE DEBUG] Build started at:', new Date().toISOString());
    },
    
    buildEnd() {
      console.log('[VITE DEBUG] Build completed at:', new Date().toISOString());
    },
    
    transformIndexHtml(html) {
      // Inject debug info as meta tags
      const debugInfo = `
    <!-- Debug Information - Build Time: ${new Date().toISOString()} -->
    <meta name="build-mode" content="${process.env.NODE_ENV || 'unknown'}">
    <meta name="build-time" content="${new Date().toISOString()}">
    <meta name="vite-configured" content="${process.env.VITE_SUPABASE_URL ? 'yes' : 'no'}">
`;
      return html.replace('</head>', `${debugInfo}</head>`);
    }
  };
}