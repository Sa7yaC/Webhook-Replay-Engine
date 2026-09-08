import React, { useState } from 'react';
import { X, Play, RotateCw, CheckCircle2, XCircle } from 'lucide-react';

export default function ReplayModal({
  webhook,
  isOpen,
  onClose,
  onReplaySuccess,
  executeReplay,
  isSubmitting
}) {
  const [targetUrl, setTargetUrl] = useState('https://api.test.com/webhook');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen || !webhook) return null;

  const handleReplay = async () => {
    if (!targetUrl.trim() || isSubmitting) return;
    setResult(null);
    setError(null);

    try {
      const replayRes = await executeReplay(webhook.webhook_id, targetUrl);
      setResult(replayRes);
      if (onReplaySuccess) {
        onReplaySuccess(replayRes);
      }
    } catch (err) {
      setError(err.message || 'Replay request failed. Please try again.');
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    onClose();
  };

  // Safe JSON render
  const safeStringify = (obj) => {
    if (obj == null) return '—';
    try {
      return typeof obj === 'object' ? JSON.stringify(obj, null, 2) : String(obj);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">Replay Webhook</h3>
          <button className="icon-btn" onClick={handleClose} title="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Target URL Input */}
          <div className="form-group">
            <label className="form-label">Target URL</label>
            <input
              type="url"
              className="form-input"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://api.example.com/webhook"
              disabled={isSubmitting}
            />
          </div>

          {/* Original Webhook Specs */}
          <div className="modal-details-box">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Webhook ID:</span>
              <span className="mono-link">{webhook.webhook_id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>HTTP Method:</span>
              <span style={{ fontWeight: 600, color: '#334155' }}>{webhook.method || 'POST'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Received At:</span>
              <span>{webhook.received_at_formatted || webhook.received_at || '—'}</span>
            </div>
          </div>

          {/* Headers Preview — only shown if loaded */}
          {webhook.headers && (
            <div className="form-group">
              <label className="form-label">Headers</label>
              <pre
                style={{
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '110px',
                  overflowY: 'auto'
                }}
              >
                {safeStringify(webhook.headers)}
              </pre>
            </div>
          )}

          {/* Body Preview — only shown if loaded */}
          {webhook.body && (
            <div className="form-group">
              <label className="form-label">Body</label>
              <pre
                style={{
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '11.5px',
                  fontFamily: 'var(--font-mono)',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {safeStringify(webhook.body)}
              </pre>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div
              style={{
                border: '1px solid #fecaca',
                backgroundColor: '#fef2f2',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '13px',
                color: '#b91c1c'
              }}
            >
              <XCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Execution Result */}
          {result && (
            <div
              style={{
                border: `1px solid ${result.success ? '#bbf7d0' : '#fecaca'}`,
                backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {result.success ? (
                    <CheckCircle2 size={16} color="#16a34a" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                  <span style={{ fontWeight: 600, fontSize: '13px', color: result.success ? '#15803d' : '#b91c1c' }}>
                    {result.success ? 'Replay Succeeded' : 'Replay Failed'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Status: <strong>{result.status_code}</strong> • Duration: <strong>{result.duration}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={handleReplay}
            disabled={isSubmitting || !targetUrl.trim()}
          >
            {isSubmitting ? (
              <>
                <RotateCw size={14} className="spinning" />
                <span>Replaying...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Replay Webhook</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
