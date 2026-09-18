import React, { useState, useMemo } from 'react';
import { formatCount } from '../utils/analyticsUtils';

/**
 * HookPal Event Overview Donut Chart
 *
 * Visual style:
 *  - Thick, elegant ring with subtle gaps and soft rounded caps
 *  - 4 distinct metric segments:
 *      Total Webhooks:     #002FFF
 *      Total Replays:      #111111
 *      Successful Replays: #19A463
 *      Failed Replays:     #E53935
 *  - Center displays "TOTAL WEBHOOKS" + Bruno Ace number
 *  - Hovering segment highlights the slice, mutes others, and reveals the specific count
 *  - External clean legend underneath with raw counts
 */
export default function DonutChart({
  stats,
  timeframe = '7 Days',
  loading = false,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);

  // Extract the 4 headline metrics from stats
  const totalWebhooks = Number(stats?.totalWebhooks ?? 0);
  const totalReplays = Number(stats?.totalReplays ?? 0);
  const successful = Number(stats?.successful ?? 0);
  const failed = Number(stats?.failed ?? 0);

  const metrics = useMemo(() => [
    {
      id: 'webhooks',
      label: 'Total Webhooks',
      shortLabel: 'Webhooks',
      value: totalWebhooks,
      color: '#002FFF',
    },
    {
      id: 'replays',
      label: 'Total Replays',
      shortLabel: 'Replays',
      value: totalReplays,
      color: '#111111',
    },
    {
      id: 'successful',
      label: 'Successful Replays',
      shortLabel: 'Successful',
      value: successful,
      color: '#4ae54a',
    },
    {
      id: 'failed',
      label: 'Failed Replays',
      shortLabel: 'Failed',
      value: failed,
      color: '#ef3b2c',
    },
  ], [totalWebhooks, totalReplays, successful, failed]);

  // Total sum for visual comparison of dashboard headline counts
  const totalSum = useMemo(() => {
    return metrics.reduce((acc, m) => acc + m.value, 0);
  }, [metrics]);

  // SVG Geometry constants
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute segment strokeDasharray and strokeDashoffset
  const segments = useMemo(() => {
    if (totalSum <= 0) return [];

    // Filter out 0 value items for gap calculations
    const activeMetrics = metrics.filter(m => m.value > 0);
    const gapTotal = activeMetrics.length > 1 ? activeMetrics.length * 5 : 0;
    const availableCircumference = Math.max(circumference - gapTotal, 0);

    let cumulativeOffset = 0;

    return metrics.map((m) => {
      if (m.value <= 0) {
        return {
          ...m,
          arcLength: 0,
          dasharray: `0 ${circumference}`,
          dashoffset: 0,
        };
      }

      const proportion = m.value / totalSum;
      const arcLength = Math.max(proportion * availableCircumference, 3);
      const dasharray = `${arcLength} ${circumference - arcLength}`;
      const dashoffset = -cumulativeOffset;

      cumulativeOffset += arcLength + (activeMetrics.length > 1 ? 5 : 0);

      return {
        ...m,
        arcLength,
        dasharray,
        dashoffset,
      };
    });
  }, [metrics, totalSum, circumference]);

  // Center display values: defaults to Total Webhooks, switches to hovered metric on interaction
  const activeMetric = hoveredSegment
    ? metrics.find(m => m.id === hoveredSegment)
    : null;

  const centerTitle = activeMetric ? activeMetric.label.toUpperCase() : 'TOTAL WEBHOOKS';
  const centerValue = activeMetric ? formatCount(activeMetric.value) : formatCount(totalWebhooks);
  const centerColor = activeMetric ? activeMetric.color : '#002FFF';

  return (
    <div className="donut-chart-container">
      <div className="donut-visual-area">
        <svg
          className="donut-svg"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background neutral ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#F0F0F2"
            strokeWidth={strokeWidth - 4}
          />

          {/* Metric segments */}
          {totalSum > 0 ? (
            <g transform={`rotate(-90 ${center} ${center})`}>
              {segments.map((seg) => {
                if (seg.value <= 0) return null;
                const isHovered = hoveredSegment === seg.id;
                const isAnyHovered = hoveredSegment != null;

                return (
                  <circle
                    key={seg.id}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={seg.dasharray}
                    strokeDashoffset={seg.dashoffset}
                    strokeLinecap="round"
                    className="donut-segment"
                    style={{
                      opacity: isAnyHovered && !isHovered ? 0.35 : 1,
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => setHoveredSegment(seg.id)}
                    onMouseLeave={() => setHoveredSegment(null)}
                  />
                );
              })}
            </g>
          ) : (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#E6E6E6"
              strokeWidth={strokeWidth}
              strokeDasharray="4 4"
            />
          )}
        </svg>

        {/* Center Text */}
        <div className="donut-center-content">
          <span className="donut-center-label">{centerTitle}</span>
          <span className="donut-center-value font-metric" style={{ color: centerColor }}>
            {loading ? '—' : centerValue}
          </span>
          <span className="donut-center-subtext">
            {activeMetric ? 'Selected Metric' : `${timeframe} Total`}
          </span>
        </div>
      </div>

      {/* External Clean Legend with Raw Counts */}
      <div className="donut-legend-grid">
        {metrics.map((m) => {
          const isHovered = hoveredSegment === m.id;
          const isAnyHovered = hoveredSegment != null;

          return (
            <div
              key={m.id}
              className={`donut-legend-item ${isHovered ? 'active' : ''}`}
              style={{
                opacity: isAnyHovered && !isHovered ? 0.45 : 1,
              }}
              onMouseEnter={() => setHoveredSegment(m.id)}
              onMouseLeave={() => setHoveredSegment(null)}
            >
              <div className="donut-legend-left">
                <span
                  className="donut-legend-dot"
                  style={{ backgroundColor: m.color }}
                />
                <span className="donut-legend-title">{m.shortLabel}</span>
              </div>
              <span className="donut-legend-count font-metric">
                {loading ? '—' : formatCount(m.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
