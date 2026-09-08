import React from 'react';
import {
  CheckCircle2,
  XCircle,
  FastForward,
  Network
} from 'lucide-react';

export default function SummaryCard({ stats, type = 'webhooks' }) {
  const isReplays = type === 'replays';

  const cards = isReplays
    ? [
        {
          id: 'total-replays',
          title: 'Total Replays',
          value: stats?.totalReplays ?? '—',
          subtext: stats?.timeRange || 'All time',
          icon: FastForward,
          theme: 'indigo'
        },
        {
          id: 'successful-replays',
          title: 'Successful',
          value: stats?.successful ?? '—',
          subtext: stats?.successRate ?? '—',
          icon: CheckCircle2,
          theme: 'green'
        },
        {
          id: 'failed-replays',
          title: 'Failed',
          value: stats?.failed ?? '—',
          subtext: stats?.failureRate ?? '—',
          icon: XCircle,
          theme: 'red'
        },
        {
          id: 'total-webhooks-ref',
          title: 'Webhooks In DB',
          value: stats?.totalWebhooks ?? '—',
          subtext: 'Available to replay',
          icon: Network,
          theme: 'purple'
        }
      ]
    : [
        {
          id: 'webhooks',
          title: 'Total Webhooks',
          value: stats?.totalWebhooks ?? '—',
          subtext: stats?.timeRange || 'All time',
          icon: Network,
          theme: 'purple'
        },
        {
          id: 'successful',
          title: 'Successful',
          value: stats?.successful ?? '—',
          subtext: stats?.successRate ?? '—',
          icon: CheckCircle2,
          theme: 'green'
        },
        {
          id: 'failed',
          title: 'Failed',
          value: stats?.failed ?? '—',
          subtext: stats?.failureRate ?? '—',
          icon: XCircle,
          theme: 'red'
        },
        {
          id: 'replays',
          title: 'Total Replays',
          value: stats?.totalReplays ?? '—',
          subtext: 'All time',
          icon: FastForward,
          theme: 'indigo'
        }
      ];

  return (
    <div className="summary-grid">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div key={card.id} className="summary-card">
            <div className={`summary-icon-container ${card.theme}`}>
              <IconComponent size={22} strokeWidth={2} />
            </div>
            <div className="summary-content">
              <span className="summary-label">{card.title}</span>
              <span className="summary-value">{card.value}</span>
              <span className="summary-subtext">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
