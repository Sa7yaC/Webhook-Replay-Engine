import React from 'react';
import MetricChange from './MetricChange';

export default function SummaryCard({ stats, type = 'webhooks' }) {
  const isReplays = type === 'replays';

  const cards = isReplays
    ? [
        {
          id: 'total-replays',
          title: 'Total Replays',
          value: stats?.totalReplays ?? '—',
          percentageChange: stats?.totalReplaysChange,
          subtext: stats?.timeRange || 'All time',
        },
        {
          id: 'successful-replays',
          title: 'Successful',
          value: stats?.successful ?? '—',
          percentageChange: stats?.successfulChange,
          subtext: 'Completed replays',
        },
        {
          id: 'failed-replays',
          title: 'Failed',
          value: stats?.failed ?? '—',
          percentageChange: stats?.failedChange,
          subtext: 'Failed replays',
        },
        {
          id: 'total-webhooks-ref',
          title: 'Webhooks In DB',
          value: stats?.totalWebhooks ?? '—',
          percentageChange: stats?.totalWebhooksChange,
          subtext: 'Available to replay',
        }
      ]
    : [
        {
          id: 'webhooks',
          title: 'Total Webhooks',
          value: stats?.totalWebhooks ?? '—',
          percentageChange: stats?.totalWebhooksChange,
          subtext: stats?.timeRange || 'All time',
        },
        {
          id: 'replays',
          title: 'Total Replays',
          value: stats?.totalReplays ?? '—',
          percentageChange: stats?.totalReplaysChange,
          subtext: stats?.timeRange || 'All time',
        },
        {
          id: 'successful',
          title: 'Successful',
          value: stats?.successful ?? '—',
          percentageChange: stats?.successfulChange ?? null,
          subtext: 'Delivery status not stored',
        },
        {
          id: 'failed',
          title: 'Failed',
          value: stats?.failed ?? '—',
          percentageChange: stats?.failedChange ?? null,
          subtext: 'Delivery status not stored',
        }
      ];

  return (
    <div className="summary-grid">
      {cards.map((card) => (
        <div key={card.id} className="summary-card">
          <div className="summary-card-header">
            <h2 className="summary-label">{card.title}</h2>
            <MetricChange percentage={card.percentageChange} />
          </div>
          <div className="summary-value">{card.value}</div>
          {card.subtext && <div className="summary-subtext">{card.subtext}</div>}
        </div>
      ))}
    </div>
  );
}
