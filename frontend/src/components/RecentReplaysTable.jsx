import React from 'react';
import { RotateCw } from 'lucide-react';

export default function RecentReplaysTable({ replays = [], isLoading, onSelectWebhookById, onSelectReplay }) {
  return (
    <div className="dashboard-card">
      <h2 className="card-title" style={{ marginBottom: '14px' }}>Recent Replays</h2>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Webhook ID</th>
              <th>Status</th>
              <th>HTTP Status</th>
              <th>Duration</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && replays.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <RotateCw size={14} className="spinning" style={{ color: '#6366f1' }} />
                    <span>Loading replays...</span>
                  </div>
                </td>
              </tr>
            ) : replays.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                  No recent replays recorded.
                </td>
              </tr>
            ) : (
              replays.slice(0, 5).map((rep) => {
                const isCompleted = rep.status === 'Completed';

                return (
                  <tr
                    key={rep.id || rep.replay_id}
                    className="table-row"
                    onClick={() => onSelectReplay && onSelectReplay(rep)}
                  >
                    <td>
                      <span className="mono-link">
                        {rep.id ? `rep_${rep.id}` : (rep.replay_id || '—')}
                      </span>
                    </td>
                    <td>
                      <span
                        className="mono-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectWebhookById(rep.webhook_id);
                        }}
                      >
                        {rep.webhook_id}
                      </span>
                    </td>
                    <td>
                      <span className={isCompleted ? 'badge-completed' : 'badge-failed'}>
                        {rep.status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {rep.status_code}
                      </span>
                    </td>
                    <td>
                      <span>{rep.duration}</span>
                    </td>
                    <td>
                      <span>{rep.created_at_formatted || rep.created_at || '—'}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
