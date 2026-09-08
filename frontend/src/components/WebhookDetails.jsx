import React, { useState } from 'react';
import { Copy, X, RotateCw, Check, AlertCircle } from 'lucide-react';

export default function WebhookDetails({
  webhook,
  replays = [],
  isLoading,
  error,
  replaysLoading,
  replaysError,
  onClose,
  onReplayClick,
  onCopyText
}) {
  const [activeTab, setActiveTab] = useState('Body');
  const [formatMode, setFormatMode] = useState('Pretty');
  const [copiedCode, setCopiedCode] = useState(false);

  // Empty state
  if (!webhook) {
    return (
      <div className="dashboard-card details-card">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          Select a webhook from the table to inspect details.
        </div>
      </div>
    );
  }

  // Determine status display from available data
  const hasStatus = webhook.status && webhook.status !== '—';
  const isCompleted = webhook.status === 'Completed';

  // Filter replays belonging to this webhook
  const webhookReplays = replays.filter(r => r.webhook_id === webhook.webhook_id);

  // Safe JSON stringification
  const safeStringify = (obj, pretty = true) => {
    if (obj == null) return '—';
    try {
      if (typeof obj === 'string') {
        // Try to parse and re-format if it's a JSON string
        const parsed = JSON.parse(obj);
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      }
      if (typeof obj === 'object') {
        return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      }
      return String(obj);
    } catch {
      return String(obj);
    }
  };

  // Prepare tab content
  let currentContent = '';
  if (activeTab === 'Headers') {
    currentContent = webhook.headers
      ? safeStringify(webhook.headers, formatMode === 'Pretty')
      : isLoading ? 'Loading...' : 'Headers not loaded. Click to fetch full details.';
  } else if (activeTab === 'Body') {
    currentContent = webhook.body
      ? safeStringify(webhook.body, formatMode === 'Pretty')
      : isLoading ? 'Loading...' : 'Body not loaded. Click to fetch full details.';
  } else if (activeTab === 'Response') {
    // Show replay response data if available
    if (webhookReplays.length > 0 && webhookReplays[0].response_body) {
      currentContent = safeStringify(webhookReplays[0].response_body, formatMode === 'Pretty');
    } else {
      currentContent = replaysLoading
        ? 'Loading replay data...'
        : 'No replay response available yet.';
    }
  }

  const lines = currentContent.split('\n');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentContent);
    setCopiedCode(true);
    if (onCopyText) onCopyText(currentContent, `${activeTab} copied`);
    setTimeout(() => setCopiedCode(false), 1500);
  };

  // Syntax highlighting for JSON
  const renderHighlightedLine = (line) => {
    const keyRegex = /"([^"]+)":/g;
    const strRegex = /: "([^"]*)"/g;
    const numRegex = /: ([0-9.]+)/g;
    const boolRegex = /: (true|false|null)/g;

    let html = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    html = html.replace(keyRegex, '<span class="json-key">"$1"</span>:');
    html = html.replace(strRegex, ': <span class="json-string">"$1"</span>');
    html = html.replace(numRegex, ': <span class="json-number">$1</span>');
    html = html.replace(boolRegex, ': <span class="json-boolean">$1</span>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="dashboard-card details-card">
      {/* Header */}
      <div className="details-header">
        <h2 className="card-title">Webhook Details</h2>
        <button
          className="icon-btn"
          onClick={onClose}
          title="Close details"
        >
          <X size={16} />
        </button>
      </div>

      {/* Webhook ID Bar */}
      <div className="details-id-bar">
        <span className="details-id-text">{webhook.webhook_id}</span>
        <button
          className="copy-icon-btn"
          onClick={() => onCopyText(webhook.webhook_id, 'Webhook ID copied')}
          title="Copy Webhook ID"
        >
          <Copy size={13} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 10px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#b91c1c'
        }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading indicator for detail fetch */}
      {isLoading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 10px',
          fontSize: '12px',
          color: '#6366f1'
        }}>
          <RotateCw size={12} className="spinning" />
          <span>Loading full details...</span>
        </div>
      )}

      {/* Metadata Key-Value List */}
      <div className="metadata-grid">
        {hasStatus && (
          <div className="meta-row">
            <span className="meta-key">Status</span>
            <span className={isCompleted ? 'badge-completed' : 'badge-failed'}>
              {webhook.status}
            </span>
          </div>
        )}
        {webhook.status_code && webhook.status_code !== '—' && (
          <div className="meta-row">
            <span className="meta-key">HTTP Status</span>
            <span className="meta-val">{webhook.status_code}</span>
          </div>
        )}
        <div className="meta-row">
          <span className="meta-key">Method</span>
          <span className="meta-val">{webhook.method || '—'}</span>
        </div>
        <div className="meta-row">
          <span className="meta-key">Received At</span>
          <span className="meta-val">{webhook.received_at_formatted || webhook.received_at || '—'}</span>
        </div>
        {webhook.headers_count != null && (
          <div className="meta-row">
            <span className="meta-key">Headers</span>
            <span className="meta-val">{webhook.headers_count}</span>
          </div>
        )}
        {webhook.headers_size && (
          <div className="meta-row">
            <span className="meta-key">Headers Size</span>
            <span className="meta-val">{webhook.headers_size}</span>
          </div>
        )}
        {webhook.body_size && (
          <div className="meta-row">
            <span className="meta-key">Body Size</span>
            <span className="meta-val">{webhook.body_size}</span>
          </div>
        )}
      </div>

      {/* Detail Tabs */}
      <div className="details-tabs">
        {['Headers', 'Body', 'Response'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Code Viewer Panel */}
      <div className="code-viewer-container">
        <div className="code-viewer-toolbar">
          <button
            className="icon-btn"
            style={{ width: '22px', height: '22px' }}
            onClick={handleCopyCode}
            title="Copy code"
          >
            {copiedCode ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
          </button>
          <select
            className="viewer-select"
            value={formatMode}
            onChange={(e) => setFormatMode(e.target.value)}
          >
            <option value="Pretty">Pretty</option>
            <option value="Raw">Raw</option>
          </select>
        </div>

        <div className="code-content-wrapper">
          <div className="line-numbers">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="code-body">
            {lines.map((line, i) => (
              <div key={i}>{renderHighlightedLine(line)}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Replays List inside Details */}
      <div className="details-replays-section">
        <div className="details-replays-header">
          <span className="details-replays-title">Recent Replays</span>
          <button className="view-all-link">View all</button>
        </div>

        {replaysLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 0', fontSize: '12px', color: '#6366f1' }}>
            <RotateCw size={12} className="spinning" />
            <span>Loading replays...</span>
          </div>
        ) : replaysError ? (
          <div style={{ fontSize: '12px', color: '#b91c1c', padding: '8px 0' }}>
            {replaysError}
          </div>
        ) : webhookReplays.length === 0 ? (
          <div style={{ fontSize: '12.5px', color: '#94a3b8', padding: '10px 0' }}>
            No replays recorded for this webhook.
          </div>
        ) : (
          <div className="mini-replay-list">
            {webhookReplays.slice(0, 3).map((rep, idx) => {
              const isRepCompleted = rep.status === 'Completed';
              return (
                <div key={rep.id || idx} className="mini-replay-item">
                  <div className="mini-replay-top">
                    <span className="mono-link" style={{ fontSize: '11.5px' }}>
                      Replay #{rep.id || idx + 1}
                    </span>
                    <span className={isRepCompleted ? 'badge-completed' : 'badge-failed'}>
                      {rep.status}
                    </span>
                  </div>
                  <div className="mini-replay-bottom">
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rep.target_url || '—'}
                    </span>
                    <span>{rep.status_code} • {rep.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Full-width Replay Webhook Button */}
      <button
        className="btn-replay-action"
        onClick={() => onReplayClick(webhook)}
      >
        <RotateCw size={15} strokeWidth={2.2} />
        <span>Replay Webhook</span>
      </button>
    </div>
  );
}
