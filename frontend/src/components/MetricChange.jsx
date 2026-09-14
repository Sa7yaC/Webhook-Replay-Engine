import React from 'react';

/**
 * Reusable MetricChange Badge Component
 *
 * Renders small, compact percentage-change indicator positioned
 * near the top-right of the metric card title, matching the reference design.
 *
 * Props:
 *  - percentage: number | null (e.g. 21.2)
 *  - direction: 'up' | 'down' | 'neutral' | 'none' (optional, auto-derived if omitted)
 *  - value: any (optional raw value)
 *  - label: string (optional accessibility/tooltip label)
 */
export default function MetricChange({ percentage, direction, value, label }) {
  // If percentage is not available or cannot be computed
  if (percentage == null || isNaN(percentage)) {
    return (
      <span
        className="metric-change-badge none"
        title={label || 'Historical comparison not available'}
        aria-label={label || 'Historical comparison not available'}
      >
        —
      </span>
    );
  }

  const num = Number(percentage);
  const dir = direction || (num > 0 ? 'up' : num < 0 ? 'down' : 'neutral');

  let text = '';
  let className = 'metric-change-badge';

  if (dir === 'up') {
    text = `+${Math.abs(num).toFixed(1)}% ↑`;
    className += ' up';
  } else if (dir === 'down') {
    text = `-${Math.abs(num).toFixed(1)}% ↓`;
    className += ' down';
  } else {
    text = '→ 0.0%';
    className += ' neutral';
  }

  return (
    <span
      className={className}
      title={label || `Change from previous period: ${text}`}
      aria-label={label || `Change from previous period: ${text}`}
    >
      {text}
    </span>
  );
}
