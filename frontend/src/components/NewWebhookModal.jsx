import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Send } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export default function NewWebhookModal({ isOpen, onClose, onTestWebhookCreated }) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [newId] = useState(() => `test_${Math.random().toString(36).slice(2, 10)}`);

  if (!isOpen) return null;

  const endpointUrl = `${API_BASE_URL.replace('/api/v1', '')}/api/v1/webhook/${newId}`;
  const curlCommand = `curl -X POST "${endpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "User-Agent: Stripe/1.0" \\
  -d '{"event":"payment.captured","amount":2500,"currency":"USD"}'`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 1500);
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      // Send a real POST to the backend to ingest a test webhook
      await fetch(`${API_BASE_URL}/webhook/${newId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WebhookReplay-Dashboard/1.0',
        },
        body: JSON.stringify({
          event: 'test.webhook',
          source: 'dashboard',
          timestamp: new Date().toISOString(),
        }),
      });
    } catch {
      // Non-critical — the refresh below will show whether it worked
    }

    // Tell the parent to refresh webhook list
    if (onTestWebhookCreated) {
      onTestWebhookCreated();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New Webhook Endpoint</h3>
          <button className="icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '13px', color: '#64748b' }}>
            Send HTTP POST requests to this endpoint. The Webhook Replay Engine will capture and store all headers and payloads for inspection and replay.
          </p>

          <div className="form-group">
            <label className="form-label">Endpoint URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                readOnly
                className="form-input"
                style={{ flex: 1, backgroundColor: '#f8fafc', fontFamily: 'var(--font-mono)' }}
                value={endpointUrl}
              />
              <button
                className="btn-secondary"
                onClick={() => copyToClipboard(endpointUrl, 'url')}
                title="Copy URL"
              >
                {copiedUrl ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} />
                <span>Example cURL Request</span>
              </label>
              <button
                className="btn-secondary"
                style={{ padding: '3px 8px', fontSize: '11.5px' }}
                onClick={() => copyToClipboard(curlCommand, 'curl')}
              >
                {copiedCurl ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                <span>{copiedCurl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <pre
              style={{
                background: '#0f172a',
                color: '#e2e8f0',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                lineHeight: 1.5
              }}
            >
              {curlCommand}
            </pre>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={handleSimulateWebhook}>
            <Send size={14} />
            <span>Send Test Webhook</span>
          </button>
        </div>
      </div>
    </div>
  );
}
