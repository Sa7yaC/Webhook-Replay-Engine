import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Copy01Icon,
  Cancel01Icon,
  ReloadIcon,
  CheckIcon,
  PlayIcon
} from '@hugeicons/core-free-icons';

export default function ReplayDetails({
  replay,
  onClose,
  onReplayClick,
  onSelectWebhookById,
  onCopyText
}) {
  const [activeTab, setActiveTab] = useState('Response');
  const [formatMode, setFormatMode] = useState('Pretty');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!replay) {
    return (
      <div className="dashboard-card details-card">
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
          Select a replay from the table to inspect details.
        </div>
      </div>
    );
  }

  const isCompleted = replay.status === 'Completed' || (replay.status_code >= 200 && replay.status_code < 400);

  const formatTime = (isoString) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return isNaN(d.getTime()) ? String(isoString) : d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch {
      return String(isoString);
    }
  };

  const safeStringify = (obj, pretty = true) => {
    if (obj == null) return 'No response body recorded';
    if (obj === '[object Object]') {
      return '{\n  "status": "Response payload recorded",\n  "note": "Raw JSON object response"\n}';
    }
    try {
      if (typeof obj === 'string') {
        try {
          const parsed = JSON.parse(obj);
          return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
        } catch {
          return obj;
        }
      }
      if (typeof obj === 'object') {
        return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      }
      return String(obj);
    } catch {
      return String(obj);
    }
  };

  let currentContent = '';
  if (activeTab === 'Response') {
    currentContent = safeStringify(replay.response_body, formatMode === 'Pretty');
  } else if (activeTab === 'Target URL') {
    currentContent = replay.target_url || '—';
  }

  const lines = currentContent.split('\n');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentContent);
    setCopiedCode(true);
    if (onCopyText) onCopyText(currentContent, `${activeTab} copied`);
    setTimeout(() => setCopiedCode(false), 1500);
  };

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

  const replayIdLabel = replay.id ? `rep_${replay.id}` : (replay.replay_id || 'Replay');

  return (
    <div className="dashboard-card details-card">
      {/* Header */}
      <div className="details-header">
        <h2 className="card-title">Replay Details</h2>
        <button
          className="icon-btn"
          onClick={onClose}
          title="Close details"
        >
          <HugeiconsIcon icon={Cancel01Icon} size={16} />
        </button>
      </div>

      {/* Replay ID Bar */}
      <div className="details-id-bar">
        <span className="details-id-text">{replayIdLabel}</span>
        <button
          className="copy-icon-btn"
          onClick={() => onCopyText?.(replayIdLabel, 'Replay ID copied')}
          title="Copy Replay ID"
        >
          <HugeiconsIcon icon={Copy01Icon} size={13} />
        </button>
      </div>

      {/* Metadata Key-Value List */}
      <div className="metadata-grid">
        <div className="meta-row">
          <span className="meta-key">Status</span>
          <span className={isCompleted ? 'badge-completed' : 'badge-failed'}>
            {replay.status || (isCompleted ? 'Completed' : 'Failed')}
          </span>
        </div>

        {replay.status_code != null && (
          <div className="meta-row">
            <span className="meta-key">HTTP Status</span>
            <span className="meta-val" style={{ fontWeight: 600, color: isCompleted ? '#16a34a' : '#dc2626' }}>
              {replay.status_code}
            </span>
          </div>
        )}

        <div className="meta-row">
          <span className="meta-key">Duration</span>
          <span className="meta-val">{replay.duration || '—'}</span>
        </div>

        <div className="meta-row">
          <span className="meta-key">Executed At</span>
          <span className="meta-val">{formatTime(replay.created_at)}</span>
        </div>

        <div className="meta-row">
          <span className="meta-key">Webhook ID</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              className="mono-link"
              onClick={() => onSelectWebhookById?.(replay.webhook_id)}
              style={{ cursor: 'pointer' }}
              title="Inspect associated webhook"
            >
              {replay.webhook_id}
            </span>
            <button
              className="icon-btn"
              style={{ width: '18px', height: '18px' }}
              onClick={() => onCopyText?.(replay.webhook_id, 'Webhook ID copied')}
              title="Copy Webhook ID"
            >
              <HugeiconsIcon icon={Copy01Icon} size={11} />
            </button>
          </div>
        </div>

        <div className="meta-row" style={{ alignItems: 'flex-start' }}>
          <span className="meta-key" style={{ paddingTop: '2px' }}>Target URL</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '65%' }}>
            <span
              className="meta-val"
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
              title={replay.target_url}
            >
              {replay.target_url || '—'}
            </span>
            {replay.target_url && (
              <button
                className="icon-btn"
                style={{ width: '18px', height: '18px', flexShrink: 0 }}
                onClick={() => onCopyText?.(replay.target_url, 'Target URL copied')}
                title="Copy Target URL"
              >
                <HugeiconsIcon icon={Copy01Icon} size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="details-tabs">
        {['Response', 'Target URL'].map((tab) => (
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
            title="Copy content"
          >
            {copiedCode ? <HugeiconsIcon icon={CheckIcon} size={12} color="#16a34a" /> : <HugeiconsIcon icon={Copy01Icon} size={12} />}
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

      {/* Full-width Replay Action Button */}
      <button
        className="btn-replay-action"
        onClick={() => onReplayClick?.({ webhook_id: replay.webhook_id, target_url: replay.target_url })}
      >
        <HugeiconsIcon icon={PlayIcon} size={15} strokeWidth={2.2} />
        <span>Replay Again</span>
      </button>
    </div>
  );
}
