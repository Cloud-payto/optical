import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    console.error('[ERROR BOUNDARY] Caught error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ERROR BOUNDARY] Error details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Log additional diagnostic information
    this.logDiagnostics();

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });
  }

  logDiagnostics = () => {
    console.group('[ERROR BOUNDARY] Diagnostics');
    
    try {
      // Environment info
      console.log('Environment:', {
        mode: import.meta.env?.MODE || 'unknown',
        isDev: import.meta.env?.DEV || false,
        isProd: import.meta.env?.PROD || false,
        baseUrl: import.meta.env?.BASE_URL || 'unknown',
        importMetaDefined: !!import.meta,
        importMetaEnvDefined: !!import.meta?.env,
      });

      // Supabase config diagnostics
      const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;
      
      console.log('Supabase Config:', {
        urlPresent: !!supabaseUrl,
        keyPresent: !!supabaseKey,
        urlPrefix: supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'undefined',
        keyLength: supabaseKey ? supabaseKey.length : 0,
        urlStartsWithHttp: supabaseUrl ? supabaseUrl.startsWith('http') : false,
      });

      // Check if Supabase client is accessible
      try {
        const { supabase, isSupabaseConfigured } = require('../lib/supabase');
        console.log('Supabase Client:', {
          clientDefined: !!supabase,
          isConfigured: isSupabaseConfigured,
          hasAuth: !!supabase?.auth,
        });
      } catch (supabaseError) {
        console.error('Supabase import error:', supabaseError);
      }

      // Browser info
      console.log('Browser:', {
        userAgent: navigator?.userAgent || 'unknown',
        platform: navigator?.platform || 'unknown',
        language: navigator?.language || 'unknown',
        onLine: navigator?.onLine ?? 'unknown',
        windowDefined: typeof window !== 'undefined',
        documentDefined: typeof document !== 'undefined',
        localStorageAvailable: (() => {
          try {
            return typeof localStorage !== 'undefined';
          } catch {
            return false;
          }
        })(),
      });

      // List all VITE_ environment variables
      if (import.meta?.env) {
        const viteVars = Object.keys(import.meta.env)
          .filter(key => key.startsWith('VITE_'))
          .map(key => ({
            name: key,
            present: !!import.meta.env[key],
            length: import.meta.env[key] ? import.meta.env[key].length : 0,
          }));
        console.log('VITE Environment Variables:', viteVars);
      }

      // Memory usage (if available)
      if (typeof performance !== 'undefined' && 'memory' in performance) {
        console.log('Memory:', (performance as any).memory);
      }

      // Runtime checks
      console.log('Runtime Checks:', {
        timestamp: new Date().toISOString(),
        location: window?.location?.href || 'unknown',
        readyState: document?.readyState || 'unknown',
      });

    } catch (diagnosticsError) {
      console.error('Error running diagnostics:', diagnosticsError);
    }

    console.groupEnd();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Something went wrong
                </h1>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  The application encountered an error. This might be due to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Missing or incorrect environment configuration</li>
                  <li>Network connectivity issues</li>
                  <li>Authentication problems</li>
                  <li>Unexpected application state</li>
                </ul>
              </div>

              {error && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-2">Error Details</h2>
                  <div className="bg-red-50 border border-red-200 rounded p-4">
                    <p className="text-sm font-mono text-red-700">
                      {error.toString()}
                    </p>
                  </div>
                </div>
              )}

              <details className="mb-6">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Show technical details
                </summary>
                <div className="mt-2 space-y-4">
                  {error?.stack && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Stack Trace</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  
                  {errorInfo?.componentStack && (
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Component Stack</h3>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-semibold mb-1">Diagnostic Info</h3>
                    <div className="bg-gray-100 p-3 rounded text-xs space-y-1">
                      <p>Error count: {errorCount}</p>
                      <p>Time: {new Date().toISOString()}</p>
                      <p>URL: {window.location.href}</p>
                      <p>Mode: {import.meta.env.MODE}</p>
                      <p>Supabase configured: {!!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Yes' : 'No'}</p>
                    </div>
                  </div>
                </div>
              </details>

              <div className="flex gap-4">
                <Button onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/debug'}
                >
                  Open Debug Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                >
                  Reload Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}