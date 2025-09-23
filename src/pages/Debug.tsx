import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DebugInfo {
  environment: {
    mode: string;
    isDev: boolean;
    isProd: boolean;
    baseUrl: string;
  };
  supabase: {
    urlPresent: boolean;
    urlPrefix: string;
    keyPresent: boolean;
    keyLength: number;
    isConfigured: boolean;
    clientDefined: boolean;
  };
  browser: {
    userAgent: string;
    platform: string;
    windowDefined: boolean;
    documentDefined: boolean;
    importMetaDefined: boolean;
    importMetaEnvDefined: boolean;
  };
  auth: {
    sessionCheckResult: string | null;
    sessionError: string | null;
    currentUser: string | null;
  };
  errors: string[];
  timestamp: string;
}

export default function Debug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [testing, setTesting] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Capture console logs
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      if (message.includes('[SUPABASE') || message.includes('[AUTH') || message.includes('[DEBUG')) {
        setLogs(prev => [...prev, `[LOG] ${new Date().toISOString()}: ${message}`]);
      }
    };

    console.error = (...args) => {
      originalError(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[ERROR] ${new Date().toISOString()}: ${message}`]);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      setLogs(prev => [...prev, `[WARN] ${new Date().toISOString()}: ${message}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Gather debug information
  const gatherDebugInfo = async (): Promise<DebugInfo> => {
    const errors: string[] = [];
    const info: DebugInfo = {
      environment: {
        mode: import.meta.env.MODE || 'unknown',
        isDev: import.meta.env.DEV || false,
        isProd: import.meta.env.PROD || false,
        baseUrl: import.meta.env.BASE_URL || 'unknown',
      },
      supabase: {
        urlPresent: false,
        urlPrefix: 'not set',
        keyPresent: false,
        keyLength: 0,
        isConfigured: false,
        clientDefined: false,
      },
      browser: {
        userAgent: 'unknown',
        platform: 'unknown',
        windowDefined: false,
        documentDefined: false,
        importMetaDefined: false,
        importMetaEnvDefined: false,
      },
      auth: {
        sessionCheckResult: null,
        sessionError: null,
        currentUser: null,
      },
      errors,
      timestamp: new Date().toISOString(),
    };

    try {
      // Environment checks
      try {
        // @ts-ignore - import.meta might not exist in some environments
        if (import.meta) {
          info.browser.importMetaDefined = true;
          if (import.meta.env) {
            info.browser.importMetaEnvDefined = true;
          } else {
            errors.push('import.meta.env is undefined');
          }
        }
      } catch (e) {
        errors.push('import.meta is not available');
        info.browser.importMetaDefined = false;
      }

      // Browser environment
      if (typeof window !== 'undefined') {
        info.browser.windowDefined = true;
        info.browser.userAgent = window.navigator?.userAgent || 'unknown';
        info.browser.platform = window.navigator?.platform || 'unknown';
      } else {
        errors.push('window is undefined (SSR issue?)');
      }

      if (typeof document !== 'undefined') {
        info.browser.documentDefined = true;
      } else {
        errors.push('document is undefined (SSR issue?)');
      }

      // Supabase configuration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      info.supabase.urlPresent = !!supabaseUrl;
      info.supabase.keyPresent = !!supabaseKey;

      if (supabaseUrl) {
        info.supabase.urlPrefix = supabaseUrl.substring(0, 20) + '...';
      } else {
        errors.push('VITE_SUPABASE_URL is not defined in import.meta.env');
      }

      if (supabaseKey) {
        info.supabase.keyLength = supabaseKey.length;
      } else {
        errors.push('VITE_SUPABASE_ANON_KEY is not defined in import.meta.env');
      }

      info.supabase.isConfigured = isSupabaseConfigured;
      info.supabase.clientDefined = typeof supabase !== 'undefined';

      if (!info.supabase.clientDefined) {
        errors.push('Supabase client is undefined');
      }

      // Test auth functionality
      if (info.supabase.clientDefined && info.supabase.isConfigured) {
        try {
          console.log('[DEBUG] Testing Supabase session...');
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            info.auth.sessionError = error.message;
            errors.push(`Session check failed: ${error.message}`);
          } else {
            info.auth.sessionCheckResult = 'success';
            info.auth.currentUser = data.session?.user?.email || 'no session';
          }
        } catch (e) {
          const error = e as Error;
          info.auth.sessionError = error.message;
          errors.push(`Session check exception: ${error.message}`);
        }
      }

    } catch (e) {
      const error = e as Error;
      errors.push(`Debug info gathering failed: ${error.message}`);
    }

    return info;
  };

  // Load debug info on mount
  useEffect(() => {
    gatherDebugInfo().then(setDebugInfo);
  }, []);

  // Test Supabase connection
  const testConnection = async () => {
    setTesting(true);
    setConnectionTestResult(null);

    try {
      console.log('[DEBUG] Starting connection test...');
      
      // Step 1: Check if client exists
      if (!supabase) {
        setConnectionTestResult('❌ Supabase client is undefined');
        setTesting(false);
        return;
      }

      // Step 2: Test basic functionality
      console.log('[DEBUG] Testing auth.getSession()...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        setConnectionTestResult(`❌ Session check failed: ${sessionError.message}`);
      } else {
        console.log('[DEBUG] Session check successful');
        
        // Step 3: Test API health
        console.log('[DEBUG] Testing Supabase health...');
        const { data: healthData, error: healthError } = await supabase
          .from('_supabase_health_check')
          .select('*')
          .limit(1);

        if (healthError && healthError.code !== 'PGRST116') {
          // PGRST116 means table doesn't exist, which is fine
          setConnectionTestResult(`⚠️ Health check warning: ${healthError.message}`);
        } else {
          setConnectionTestResult(`✅ Connection successful! ${sessionData.session ? 'Authenticated as: ' + sessionData.session.user.email : 'Not authenticated'}`);
        }
      }
    } catch (e) {
      const error = e as Error;
      console.error('[DEBUG] Connection test failed:', error);
      setConnectionTestResult(`❌ Connection test failed: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  // Refresh debug info
  const refreshDebugInfo = async () => {
    const info = await gatherDebugInfo();
    setDebugInfo(info);
  };

  const StatusIcon = ({ status }: { status: boolean }) => {
    return status ? (
      <CheckCircle className="w-5 h-5 text-green-500" />
    ) : (
      <XCircle className="w-5 h-5 text-red-500" />
    );
  };

  if (!debugInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Debug Information</h1>
          <p className="text-gray-600 mt-2">
            Generated at: {new Date(debugInfo.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Critical Errors */}
        {debugInfo.errors.length > 0 && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-4 flex items-center">
                <AlertCircle className="w-6 h-6 mr-2" />
                Critical Errors
              </h2>
              <ul className="space-y-2">
                {debugInfo.errors.map((error, index) => (
                  <li key={index} className="text-red-700">• {error}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Environment</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Mode:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.environment.mode}</code>
                </div>
                <div className="flex justify-between items-center">
                  <span>Development:</span>
                  <StatusIcon status={debugInfo.environment.isDev} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Production:</span>
                  <StatusIcon status={debugInfo.environment.isProd} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Base URL:</span>
                  <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.environment.baseUrl}</code>
                </div>
              </div>
            </div>
          </Card>

          {/* Browser Info */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Browser Environment</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Window defined:</span>
                  <StatusIcon status={debugInfo.browser.windowDefined} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Document defined:</span>
                  <StatusIcon status={debugInfo.browser.documentDefined} />
                </div>
                <div className="flex justify-between items-center">
                  <span>import.meta defined:</span>
                  <StatusIcon status={debugInfo.browser.importMetaDefined} />
                </div>
                <div className="flex justify-between items-center">
                  <span>import.meta.env defined:</span>
                  <StatusIcon status={debugInfo.browser.importMetaEnvDefined} />
                </div>
              </div>
            </div>
          </Card>

          {/* Supabase Configuration */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Supabase Configuration</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>URL present:</span>
                  <StatusIcon status={debugInfo.supabase.urlPresent} />
                </div>
                {debugInfo.supabase.urlPresent && (
                  <div className="flex justify-between items-center">
                    <span>URL prefix:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{debugInfo.supabase.urlPrefix}</code>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Anon key present:</span>
                  <StatusIcon status={debugInfo.supabase.keyPresent} />
                </div>
                {debugInfo.supabase.keyPresent && (
                  <div className="flex justify-between items-center">
                    <span>Key length:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded">{debugInfo.supabase.keyLength}</code>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span>Client configured:</span>
                  <StatusIcon status={debugInfo.supabase.isConfigured} />
                </div>
                <div className="flex justify-between items-center">
                  <span>Client defined:</span>
                  <StatusIcon status={debugInfo.supabase.clientDefined} />
                </div>
              </div>
            </div>
          </Card>

          {/* Auth Status */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Session check:</span>
                  <span className={debugInfo.auth.sessionCheckResult === 'success' ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.auth.sessionCheckResult || 'not tested'}
                  </span>
                </div>
                {debugInfo.auth.sessionError && (
                  <div className="mt-2">
                    <span className="text-red-600 text-sm">Error: {debugInfo.auth.sessionError}</span>
                  </div>
                )}
                {debugInfo.auth.currentUser && (
                  <div className="flex justify-between items-center">
                    <span>Current user:</span>
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">{debugInfo.auth.currentUser}</code>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Connection Test */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Connection Test</h2>
            <div className="space-y-4">
              <Button
                onClick={testConnection}
                disabled={testing}
                className="w-full sm:w-auto"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  'Test Supabase Connection'
                )}
              </Button>
              {connectionTestResult && (
                <div className="mt-4 p-4 bg-gray-100 rounded">
                  <pre className="whitespace-pre-wrap">{connectionTestResult}</pre>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Console Logs */}
        <Card className="mt-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Console Logs</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogs([])}
              >
                Clear Logs
              </Button>
            </div>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500">No relevant logs captured yet...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">{log}</div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Actions */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={refreshDebugInfo}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Debug Info
              </Button>
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Hard Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const debugData = JSON.stringify(debugInfo, null, 2);
                  const blob = new Blob([debugData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `debug-info-${Date.now()}.json`;
                  a.click();
                }}
              >
                Download Debug Info
              </Button>
            </div>
          </div>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Instructions</h2>
            <ol className="space-y-2 list-decimal list-inside">
              <li>Check if environment variables are present (should show green checkmarks)</li>
              <li>Verify browser environment is properly detected</li>
              <li>Run the connection test to verify Supabase connectivity</li>
              <li>Check console logs for any error messages</li>
              <li>Download debug info and share with support if needed</li>
            </ol>
            <div className="mt-4 p-4 bg-yellow-50 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This page does not display actual API keys or sensitive data.
                It only shows whether configuration values are present.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}