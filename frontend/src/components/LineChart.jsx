import React, { useState, useRef, useMemo } from 'react';
import {
  generateBezierSpline,
  formatCount,
} from '../utils/analyticsUtils';

/**
 * HookPal Webhook Activity Line Chart
 *
 * Visual style:
 *  - Minimal grid with soft horizontal guide lines (no Y-axis text labels)
 *  - Smooth monotonic Bézier curve for Webhooks (#002FFF) with soft area fill
 *  - Guaranteed zero-clamping (no negative dip or overshoot)
 *  - Contrasting dashed line for Replays (#111111)
 *  - Small circular data points with interactive hover crosshair & floating tooltip
 *  - Hovering any point shows the exact timestamp and true event count (e.g. 58k)
 */
export default function LineChart({
  chartData,
  timeframe = '7 Days',
  loading = false,
}) {
  const containerRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  const points = chartData?.points || [];
  const hasWebhookData = chartData?.hasWebhookData;
  const hasReplayData = chartData?.hasReplayData;
  const hasReplayTimestamps = chartData?.hasReplayTimestamps;

  // SVG dimensions & padding (balanced left/right margins without Y-axis text)
  const svgWidth = 700;
  const svgHeight = 280;
  const padLeft = 25;
  const padRight = 25;
  const padTop = 25;
  const padBottom = 35;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;
  const baseline = padTop + chartHeight;

  // Compute maximum value for scaling the curve
  const rawMax = chartData?.maxVal || 0;
  // Use a slight headroom (10%) so peak points don't clip the top
  const maxY = rawMax > 0 ? rawMax * 1.08 : 10;

  // Map data points to SVG coordinates
  const { webhookPoints, replayPoints, xCoords } = useMemo(() => {
    if (!points.length) {
      return { webhookPoints: [], replayPoints: [], xCoords: [] };
    }

    const n = points.length;
    const stepX = n > 1 ? chartWidth / (n - 1) : chartWidth / 2;

    const wPts = [];
    const rPts = [];
    const xs = [];

    points.forEach((p, idx) => {
      const x = padLeft + idx * stepX;
      // Invert Y for SVG coordinates: 0 is at baseline, maxY is at padTop
      const yW = p.webhooks > 0 ? padTop + chartHeight - (p.webhooks / maxY) * chartHeight : baseline;
      const yR = p.replays > 0 ? padTop + chartHeight - (p.replays / maxY) * chartHeight : baseline;

      wPts.push({ x, y: yW, val: p.webhooks, point: p });
      rPts.push({ x, y: yR, val: p.replays, point: p });
      xs.push(x);
    });

    return { webhookPoints: wPts, replayPoints: rPts, xCoords: xs };
  }, [points, chartWidth, chartHeight, padLeft, padTop, baseline, maxY]);

  // Generate smooth monotonic Bézier paths strictly clamped to baseline
  const webhookLinePath = useMemo(() => {
    return generateBezierSpline(webhookPoints, baseline);
  }, [webhookPoints, baseline]);

  const replayLinePath = useMemo(() => {
    return generateBezierSpline(replayPoints, baseline);
  }, [replayPoints, baseline]);

  // Area path underneath Webhook line
  const webhookAreaPath = useMemo(() => {
    if (!webhookPoints.length || !webhookLinePath) return '';
    const first = webhookPoints[0];
    const last = webhookPoints[webhookPoints.length - 1];

    return `${webhookLinePath} L ${last.x.toFixed(1)} ${baseline} L ${first.x.toFixed(1)} ${baseline} Z`;
  }, [webhookPoints, webhookLinePath, baseline]);

  // Mouse hover interaction
  const handleMouseMove = (e) => {
    if (!containerRef.current || !xCoords.length) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scale = svgWidth / rect.width;
    const svgX = clientX * scale;

    let closestIdx = 0;
    let minDiff = Infinity;
    xCoords.forEach((x, idx) => {
      const diff = Math.abs(x - svgX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activePoint = hoverIndex != null ? points[hoverIndex] : null;
  const activeW = hoverIndex != null ? webhookPoints[hoverIndex] : null;
  const activeR = hoverIndex != null ? replayPoints[hoverIndex] : null;

  // Empty state check
  const isCompletelyEmpty = !hasWebhookData && !hasReplayData;

  // Horizontal guide lines (pure subtle reference lines without Y-axis text)
  const guideLineLevels = [0, 0.33, 0.66, 1];

  return (
    <div
      className="line-chart-container"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {isCompletelyEmpty && !loading && (
        <div className="chart-empty-overlay">
          <div className="empty-state-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <p className="empty-state-title">No activity in this period</p>
          <p className="empty-state-desc">Switch the timeframe or start sending webhooks.</p>
        </div>
      )}

      <svg
        className="line-chart-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          {/* Subtle gradient fill for Webhook area */}
          <linearGradient id="hookpal-webhook-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#002FFF" stopOpacity="0.22" />
            <stop offset="60%" stopColor="#002FFF" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#002FFF" stopOpacity="0.0" />
          </linearGradient>

          {/* Glow filter for hover dots */}
          <filter id="hookpal-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#002FFF" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Soft horizontal guide lines (No Y-axis text labels) */}
        {guideLineLevels.map((frac, idx) => {
          const yPos = baseline - frac * chartHeight;
          return (
            <line
              key={`guideline-${idx}`}
              x1={padLeft}
              y1={yPos}
              x2={svgWidth - padRight}
              y2={yPos}
              stroke="#EFEFEF"
              strokeWidth="1"
              strokeDasharray={idx === 0 ? 'none' : '4 4'}
            />
          );
        })}

        {/* Webhook Area Fill */}
        {webhookAreaPath && hasWebhookData && (
          <path
            d={webhookAreaPath}
            fill="url(#hookpal-webhook-gradient)"
            className="chart-area-fade"
          />
        )}

        {/* Replay Line (#111111 with subtle dots/dash) */}
        {replayLinePath && hasReplayTimestamps && (
          <path
            d={replayLinePath}
            fill="none"
            stroke="#1D1D1D"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line-replay"
          />
        )}

        {/* Webhook Line (#002FFF bold smooth curve) */}
        {webhookLinePath && (
          <path
            d={webhookLinePath}
            fill="none"
            stroke="#002FFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="chart-line-webhook"
          />
        )}

        {/* Data points along Webhook line */}
        {webhookPoints.map((pt, idx) => {
          if (!hasWebhookData) return null;
          const isHovered = hoverIndex === idx;
          return (
            <circle
              key={`w-dot-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={isHovered ? 5.5 : 3.5}
              fill="#FFFFFF"
              stroke="#002FFF"
              strokeWidth={isHovered ? 2.5 : 2}
              className="chart-dot"
              filter={isHovered ? 'url(#hookpal-glow)' : undefined}
            />
          );
        })}

        {/* Data points along Replay line */}
        {replayPoints.map((pt, idx) => {
          if (!hasReplayData || !hasReplayTimestamps) return null;
          const isHovered = hoverIndex === idx;
          return (
            <circle
              key={`r-dot-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={isHovered ? 4.5 : 2.5}
              fill="#FFFFFF"
              stroke="#1D1D1D"
              strokeWidth="2"
              className="chart-dot"
            />
          );
        })}

        {/* Vertical crosshair on hover */}
        {hoverIndex != null && activeW && (
          <line
            x1={activeW.x}
            y1={padTop}
            x2={activeW.x}
            y2={baseline}
            stroke="#002FFF"
            strokeWidth="1"
            strokeDasharray="2 2"
            opacity="0.6"
          />
        )}

        {/* X-axis tick labels */}
        {points.map((p, idx) => {
          if (!p.showLabel) return null;
          const x = padLeft + (idx * chartWidth) / (points.length - 1 || 1);
          return (
            <text
              key={`xlabel-${idx}`}
              x={x}
              y={svgHeight - 10}
              textAnchor="middle"
              className="chart-axis-label x-axis-label"
            >
              {p.label}
            </text>
          );
        })}
      </svg>

      {/* Floating Interactive Tooltip */}
      {hoverIndex != null && activePoint && activeW && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(activeW.x / svgWidth) * 100}%`,
            top: `${(Math.min(activeW.y, activeR?.y || activeW.y) / svgHeight) * 100}%`,
            transform: `translate(${activeW.x > svgWidth * 0.75 ? '-105%' : activeW.x < svgWidth * 0.25 ? '5%' : '-50%'}, -115%)`,
          }}
        >
          <div className="tooltip-header">{activePoint.fullDate}</div>
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#002FFF' }} />
            <span className="tooltip-label">Webhooks</span>
            <span className="tooltip-value font-mono">{formatCount(activePoint.webhooks)}</span>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-dot" style={{ backgroundColor: '#111111' }} />
            <span className="tooltip-label">Replays</span>
            <span className="tooltip-value font-mono">
              {hasReplayTimestamps ? formatCount(activePoint.replays) : '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
