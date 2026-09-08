import React, { useState } from 'react';
import { 
  Server, 
  ShieldCheck, 
  Database, 
  Copy, 
  Check, 
  Terminal, 
  Globe, 
  Zap,
  Info
} from 'lucide-react';

export default function SettingsView({ onCopyText }) {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

  const curlCommand = `curl -X POST ${apiUrl}/webhook/my_sample_webhook \\
  -H "Content-Type: application/json" \\
  -d '{"event": "order.completed", "amount": 99.99, "currency": "USD"}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    onCopyText?.(curlCommand, 'cURL command copied to clipboard');
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Overview Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '16px'
      }}>
        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#eef2ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Backend API</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Active & Healthy</div>
            <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '2px' }}>Port 3000 • Express</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Database size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Storage Engine</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>PostgreSQL 17</div>
            <div style={{ fontSize: '11.5px', color: '#10b981', marginTop: '2px' }}>Prisma ORM connected</div>
          </div>
        </div>

        <div className="dashboard-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            backgroundColor: '#f5f3ff',
            color: '#7c3aed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>Security Layer</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>SSRF Protection</div>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>Private IP blocking enabled</div>
          </div>
        </div>
      </div>

      {/* Ingestion Endpoint Section */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Globe size={18} color="#4f46e5" />
          <h2 className="card-title" style={{ margin: 0 }}>Webhook Ingestion Guide</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '14px' }}>
          Send any HTTP POST request with arbitrary JSON body to your unique webhook endpoint. The engine stores headers, payload, and timestamps for replaying.
        </p>

        <div style={{
          position: 'relative',
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          padding: '16px 18px',
          fontFamily: 'monospace',
          color: '#e2e8f0',
          fontSize: '13px',
          lineHeight: '1.6'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>cURL Example</span>
            <button
              onClick={handleCopyCurl}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              {copiedCurl ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copiedCurl ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {curlCommand}
          </pre>
        </div>
      </div>

      {/* Engine Security & Replay Policies */}
      <div className="dashboard-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={18} color="#10b981" />
          <h2 className="card-title" style={{ margin: 0 }}>Engine Parameters & Security</h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '14px',
          marginTop: '14px'
        }}>
          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>SSRF & DNS Validation</div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Replay target URLs are validated against private, internal, and loopback IP ranges (127.0.0.1, 10.0.0.0/8, 192.168.0.0/16, AWS metadata IPs) to prevent SSRF attacks.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>Payload Size Limit</div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Webhook payloads are limited to 20 KB maximum size to maintain optimal throughput and avoid denial-of-service memory exhaustion.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>Header Sanitization</div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Replay requests pass only safe headers (<code>content-type</code>, <code>accept</code>, <code>user-agent</code>) to protect target receivers from host injection.
            </p>
          </div>

          <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>Execution Timeout</div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0 }}>
              Replay requests have a 10-second timeout. If the target server fails to respond within 10 seconds, the engine aborts and records HTTP 504.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
