import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, RotateCw, MoreVertical, Play, Eye, Copy, AlertCircle } from 'lucide-react';

export default function WebhookTable({
  title = 'Recent Webhooks',
  webhooks = [],
  dateRange,
  selectedWebhook,
  onSelectWebhook,
  onReplayClick,
  onRefresh,
  isRefreshing,
  isLoading,
  error,
  onCopyText
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  // Reset to page 1 whenever filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, webhooks.length]);

  // Filter webhooks based on search query and status filter
  const filteredWebhooks = useMemo(() => {
    return webhooks.filter((wh) => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !searchLower ||
        (wh.webhook_id && wh.webhook_id.toLowerCase().includes(searchLower)) ||
        (wh.method && wh.method.toLowerCase().includes(searchLower));

      const matchesStatus =
        statusFilter === 'All Status' ||
        (wh.status && wh.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [webhooks, searchQuery, statusFilter]);

  // Client-side pagination
  const totalPages = Math.max(1, Math.ceil(filteredWebhooks.length / pageSize));
  const paginatedWebhooks = filteredWebhooks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Generate page numbers for display
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

  // Format received_at for display
  const formatTime = (wh) => {
    return wh.received_at_formatted || wh.received_at || '—';
  };

  return (
    <div className="dashboard-card">
      <h2 className="card-title">{title}</h2>

      {/* Filter and Action Toolbar */}
      <div className="table-toolbar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search by webhook ID..."
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
            title="Refresh webhooks list"
          >
            <RotateCw size={14} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          marginBottom: '14px',
          fontSize: '13px',
          color: '#b91c1c'
        }}>
          <AlertCircle size={16} />
          <span>Unable to load webhooks. {error}</span>
          <button
            onClick={onRefresh}
            style={{
              marginLeft: 'auto',
              fontSize: '12px',
              fontWeight: 600,
              color: '#b91c1c',
              textDecoration: 'underline',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Table Structure */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>HTTP Status</th>
              <th>Method</th>
              <th>Received At</th>
              <th>Size</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {/* Loading State */}
            {isLoading && webhooks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <RotateCw size={20} className="spinning" style={{ color: '#6366f1' }} />
                    <span>Loading webhooks...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedWebhooks.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  {searchQuery || statusFilter !== 'All Status'
                    ? 'No webhooks found matching your criteria.'
                    : `No webhooks received for ${dateRange || 'this timeline'}. Send a webhook or select a different timeline.`}
                </td>
              </tr>
            ) : (
              paginatedWebhooks.map((wh) => {
                const isSelected = selectedWebhook?.webhook_id === wh.webhook_id;
                const statusText = wh.status || '—';
                const isCompleted = statusText === 'Completed';
                const isFailed = statusText === 'Failed';

                return (
                  <tr
                    key={wh.id || wh.webhook_id}
                    className={`table-row ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectWebhook(wh)}
                  >
                    <td>
                      <span className="mono-link">{wh.webhook_id}</span>
                    </td>
                    <td>
                      {isCompleted ? (
                        <span className="badge-completed">{statusText}</span>
                      ) : isFailed ? (
                        <span className="badge-failed">{statusText}</span>
                      ) : (
                        <span style={{ color: '#64748b', fontSize: '12.5px' }}>{statusText}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {wh.status_code || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="method-tag">{wh.method || '—'}</span>
                    </td>
                    <td>
                      <span>{formatTime(wh)}</span>
                    </td>
                    <td>
                      <span>{wh.size || '—'}</span>
                    </td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="icon-btn"
                        onClick={() => setActiveMenuId(activeMenuId === wh.webhook_id ? null : wh.webhook_id)}
                        title="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === wh.webhook_id && (
                        <div className="action-dropdown" ref={menuRef}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onSelectWebhook(wh);
                              setActiveMenuId(null);
                            }}
                          >
                            <Eye size={14} />
                            <span>View Details</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onReplayClick(wh);
                              setActiveMenuId(null);
                            }}
                          >
                            <Play size={14} />
                            <span>Replay</span>
                          </button>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              onCopyText(wh.webhook_id, 'Webhook ID copied');
                              setActiveMenuId(null);
                            }}
                          >
                            <Copy size={14} />
                            <span>Copy ID</span>
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

      {/* Pagination Bar — driven by actual data */}
      {filteredWebhooks.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-pages">
            <button
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              &lt;
            </button>
            {pageNumbers.map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} style={{ color: '#94a3b8', padding: '0 4px', fontSize: '13px' }}>...</span>
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
    </div>
  );
}
