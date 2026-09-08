import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Search, 
  RotateCw, 
  MoreVertical, 
  Play, 
  Eye, 
  Copy, 
  AlertCircle,
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  XCircle,
  X
} from 'lucide-react';

export default function ReplaysTable({
  replays = [],
  dateRange = 'Today',
  isLoading = false,
  isRefreshing = false,
  onRefresh,
  onSelectWebhookById,
  onReplayClick,
  onCopyText
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [inspectReplay, setInspectReplay] = useState(null);

  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, replays.length]);

  // Filter replays based on search query and status
  const filteredReplays = useMemo(() => {
    return replays.filter((rep) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (rep.webhook_id && rep.webhook_id.toLowerCase().includes(searchLower)) ||
        (rep.target_url && rep.target_url.toLowerCase().includes(searchLower)) ||
        (String(rep.id).includes(searchLower)) ||
        (String(rep.status_code).includes(searchLower));

      const matchesStatus =
        statusFilter === 'All Status' ||
        (rep.status && rep.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [replays, searchQuery, statusFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredReplays.length / pageSize));
  const paginatedReplays = filteredReplays.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (totalPages > 4) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages]);

  const formatTime = (rep) => {
    return rep.created_at_formatted || rep.created_at || '—';
  };

  return (
    <div className="dashboard-card">
      <h2 className="card-title">All Replays</h2>

      {/* Filter and Action Toolbar */}
      <div className="table-toolbar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by webhook ID, URL, status code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="toolbar-actions">
          <select
            className="status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All Status">All Status</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>

          <button
            className={`refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh replays list"
          >
            <RotateCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Structure */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Webhook ID</th>
              <th>Status</th>
              <th>HTTP Status</th>
              <th>Target URL</th>
              <th>Duration</th>
              <th>Created At</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && replays.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RotateCw size={20} className="spinning" style={{ color: '#6366f1' }} />
                    <span>Loading replays...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedReplays.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  {searchQuery || statusFilter !== 'All Status'
                    ? 'No replays found matching your criteria.'
                    : `No replays found for ${dateRange || 'this timeline'}. Trigger a replay or select a different timeline.`}
                </td>
              </tr>
            ) : (
              paginatedReplays.map((rep) => {
                const isCompleted = rep.status === 'Completed';
                const isFailed = rep.status === 'Failed';
                const replayKey = rep.id || rep.replay_id || `${rep.webhook_id}_${rep.created_at}`;

                return (
                  <tr
                    key={replayKey}
                    className="table-row"
                    onClick={() => setInspectReplay(rep)}
                  >
                    <td>
                      <span className="mono-link">
                        {rep.id ? `rep_${rep.id}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        className="mono-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWebhookById?.(rep.webhook_id);
                        }}
                        title="View webhook details"
                      >
                        {rep.webhook_id}
                      </span>
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className="badge-completed">Completed</span>
                      ) : (
                        <span className="badge-failed">Failed</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500, color: isCompleted ? '#16a34a' : '#dc2626' }}>
                        {rep.status_code || '—'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <span
                        style={{
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12.5px',
                          color: '#475569'
                        }}
                        title={rep.target_url}
                      >
                        {rep.target_url || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                        {rep.duration || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {formatTime(rep)}
                      </span>
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="icon-btn"
                        onClick={() => setActiveMenuId(activeMenuId === replayKey ? null : replayKey)}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === replayKey && (
                        <div className="action-dropdown" ref={menuRef}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              setInspectReplay(rep);
                              setActiveMenuId(null);
                            }}
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onReplayClick?.({ webhook_id: rep.webhook_id, target_url: rep.target_url });
                              setActiveMenuId(null);
                            }}
                          >
                            <Play size={14} />
                            <span>Replay Again</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onCopyText?.(rep.target_url, 'Target URL copied');
                              setActiveMenuId(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copy URL</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onCopyText?.(rep.webhook_id, 'Webhook ID copied');
                              setActiveMenuId(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copy Webhook ID</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {filteredReplays.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-pages">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            >
              &lt;
            </button>
            {pageNumbers.map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} style={{ color: '#94a3b8', padding: '0 4px', fontSize: '13px' }}>
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  className={`page-btn ${currentPage === p ? 'active' : ''}`}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              )
            )}
            <button
              className="page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            >
              &gt;
            </button>
          </div>

          <div>
            <select
              className="page-size-select"
              value={`${pageSize} / page`}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
            </select>
          </div>
        </div>
      )}

      {/* Replay Details Inspection Modal */}
      {inspectReplay && (
        <div className="modal-backdrop" onClick={() => setInspectReplay(null)}>
          <div 
            className="modal-container" 
            style={{ maxWidth: '640px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Replay Execution Details</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Execution result for webhook <strong>{inspectReplay.webhook_id}</strong>
                </p>
              </div>
              <button 
                className="icon-btn" 
                onClick={() => setInspectReplay(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Quick Summary Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                background: '#f8fafc',
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Status</span>
                  <div style={{ marginTop: '4px' }}>
                    {inspectReplay.status === 'Completed' ? (
                      <span className="badge-completed">Completed ({inspectReplay.status_code})</span>
                    ) : (
                      <span className="badge-failed">Failed ({inspectReplay.status_code})</span>
                    )}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Duration</span>
                  <div style={{ marginTop: '4px', fontWeight: 600, color: '#334155', fontSize: '13px' }}>
                    {inspectReplay.duration || '—'}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Executed At</span>
                  <div style={{ marginTop: '4px', fontSize: '12px', color: '#334155' }}>
                    {formatTime(inspectReplay)}
                  </div>
                </div>
              </div>

              {/* Target URL */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Target URL</label>
                  <button
                    className="icon-btn"
                    style={{ height: '22px', width: '22px' }}
                    onClick={() => onCopyText?.(inspectReplay.target_url, 'Target URL copied')}
                    title="Copy URL"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <div style={{
                  padding: '9px 12px',
                  background: '#f1f5f9',
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  wordBreak: 'break-all',
                  color: '#1e293b'
                }}>
                  {inspectReplay.target_url}
                </div>
              </div>

              {/* Response Body */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>Response Body</label>
                  <button
                    className="icon-btn"
                    style={{ height: '22px', width: '22px' }}
                    onClick={() => onCopyText?.(inspectReplay.response_body, 'Response body copied')}
                    title="Copy Response"
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {inspectReplay.response_body || 'No response body recorded'}
                </pre>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                className="btn-secondary"
                onClick={() => setInspectReplay(null)}
              >
                Close
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  const target = inspectReplay;
                  setInspectReplay(null);
                  onReplayClick?.({ webhook_id: target.webhook_id, target_url: target.target_url });
                }}
              >
                <Play size={14} />
                <span>Replay Again</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
