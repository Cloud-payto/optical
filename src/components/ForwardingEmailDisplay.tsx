/**
 * Forwarding Email Display Component
 * Shows the CloudMailin forwarding email with copy functionality
 */

import React, { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';

interface ForwardingEmailDisplayProps {
  accountId: string;
  compact?: boolean;
}

export function ForwardingEmailDisplay({ accountId, compact = false }: ForwardingEmailDisplayProps) {
  const [copied, setCopied] = useState(false);

  // CloudMailin forwarding email format: real-address+UUID@cloudmailin.net
  const forwardingEmail = `a48947dbd077295c13ea+${accountId}@cloudmailin.net`;

  // Hidden version for display (shows dots)
  const displayEmail = '••••••••••••••••+' + accountId.substring(0, 8) + '...@cloudmailin.net';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(forwardingEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs transition-colors group"
        title="Click to copy forwarding email address"
      >
        <Mail className="w-3.5 h-3.5 text-blue-600" />
        <span className="font-mono text-blue-700">{displayEmail}</span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5 text-blue-500 group-hover:text-blue-700" />
        )}
      </button>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Mail className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-blue-900 mb-1">
              Forwarding Email Address (Click to Copy)
            </div>
            <div className="font-mono text-sm text-blue-700 font-medium">
              {displayEmail}
            </div>
          </div>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Email
            </>
          )}
        </button>
      </div>
      <p className="text-xs text-blue-700 mt-3">
        Forward vendor order confirmation emails to this address to automatically import them into your inventory.
      </p>
    </div>
  );
}
