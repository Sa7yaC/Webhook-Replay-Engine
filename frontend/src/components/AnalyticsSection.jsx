import React, { useMemo } from 'react';
import LineChart from './LineChart';
import DonutChart from './DonutChart';
import { getChartData } from '../utils/analyticsUtils';

/**
 * AnalyticsSection Container
 *
 * Hosts the two analytics cards side-by-side:
 *  - Left (approx 65%): Webhook Activity line chart + shared time range selector
 *  - Right (approx 35%): Event Overview donut chart
 *
 * Features:
 *  - Responsive grid layout
 *  - Memoized chart data calculations
 *  - Loading skeleton placeholders
 *  - Error state with retry action
 */
export default function AnalyticsSection({
  webhooks = [],
  replays = [],
  stats,
  dateRange = '7 Days',
  onDateRangeChange,
  loading = false,
  error = null,
  onRetry,
}) {
  const timeframeOptions = ['1 Day', '7 Days', '30 Days'];

  // Memoize data bucketing for the line chart
  const chartData = useMemo(() => {
    return getChartData(webhooks, replays, dateRange, stats?.timeline);
  }, [webhooks, replays, dateRange, stats?.timeline]);

  return (
    <section className="analytics-section">
      <div className="analytics-grid">
        {/* ==================================================
            1. WEBHOOK ACTIVITY LINE CHART CARD (65%)
        ================================================== */}
        <div className="analytics-card analytics-card-line">
          <div className="analytics-card-header">
            <div>
              <h2 className="analytics-card-title">WEBHOOK ACTIVITY</h2>
              <p className="analytics-card-subtitle">
                Webhook and replay activity over time
              </p>
            </div>

            <div className="analytics-card-controls">
              {/* Minimal Legend */}
              <div className="line-chart-legend">
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#002FFF' }} />
                  <span className="legend-label">Webhooks</span>
                </span>
                <span className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#111111' }} />
                  <span className="legend-label">Replays</span>
                </span>
              </div>

              {/* Shared Time Range Segmented Control */}
              <div className="time-range-segmented" role="group" aria-label="Analytics Time Range">
                {timeframeOptions.map((option) => {
                  const isSelected = dateRange === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`time-range-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => onDateRangeChange?.(option)}
                      aria-pressed={isSelected}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="analytics-card-body">
            {error ? (
              <div className="analytics-error-state">
                <p className="error-text">Unable to load analytics</p>
                {onRetry && (
                  <button type="button" className="btn-retry" onClick={onRetry}>
                    Retry
                  </button>
                )}
              </div>
            ) : loading ? (
              <div className="analytics-skeleton-line">
                <div className="skeleton-grid-lines">
                  <div className="skeleton-line-bar" />
                  <div className="skeleton-line-bar" />
                  <div className="skeleton-line-bar" />
                </div>
                <div className="skeleton-line-curve" />
              </div>
            ) : (
              <LineChart
                chartData={chartData}
                timeframe={dateRange}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* ==================================================
            2. EVENT OVERVIEW DONUT CHART CARD (35%)
        ================================================== */}
        <div className="analytics-card analytics-card-donut">
          <div className="analytics-card-header">
            <div>
              <h2 className="analytics-card-title">EVENT OVERVIEW</h2>
              <p className="analytics-card-subtitle">Metric Overview</p>
            </div>
          </div>

          <div className="analytics-card-body">
            {error ? (
              <div className="analytics-error-state">
                <p className="error-text">Unable to load analytics</p>
                {onRetry && (
                  <button type="button" className="btn-retry" onClick={onRetry}>
                    Retry
                  </button>
                )}
              </div>
            ) : loading ? (
              <div className="analytics-skeleton-donut">
                <div className="skeleton-donut-circle" />
                <div className="skeleton-donut-legend">
                  <div className="skeleton-legend-row" />
                  <div className="skeleton-legend-row" />
                  <div className="skeleton-legend-row" />
                  <div className="skeleton-legend-row" />
                </div>
              </div>
            ) : (
              <DonutChart
                stats={stats}
                timeframe={dateRange}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
