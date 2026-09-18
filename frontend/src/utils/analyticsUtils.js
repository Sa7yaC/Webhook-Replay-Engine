/**
 * Analytics Utility Service
 *
 * Handles:
 *  - Time bucketing (1 Day, 7 Days, 30 Days)
 *  - Grouping backend timeline aggregation or real webhook/replay timestamps
 *  - Monotonic cubic Bézier spline calculation (guaranteed zero-clamped, no negative curves)
 *  - Number and label formatting
 */

/**
 * Normalizes a timeframe string into a canonical key.
 */
export function normalizeTimeframe(tf = '7 Days') {
  const s = String(tf).toLowerCase().trim();
  if (s.includes('1') || s.includes('24') || s.includes('today')) return '1 Day';
  if (s.includes('30') || s.includes('month')) return '30 Days';
  return '7 Days';
}

/**
 * Format raw numbers with thousands separators (e.g. 58137 -> 58,137).
 */
export function formatCount(value) {
  if (value == null || isNaN(value)) return '0';
  return new Intl.NumberFormat('en-US').format(Number(value));
}

/**
 * Formats Y-axis numeric ticks cleanly (e.g. 1000 -> 1K, 58000 -> 58K).
 */
export function formatAxisNumber(num) {
  if (num == null || isNaN(num) || num === 0) return '0';
  const abs = Math.abs(num);
  if (abs >= 1_000_000) {
    const val = num / 1_000_000;
    return (val % 1 === 0 ? val : val.toFixed(1)) + 'M';
  }
  if (abs >= 1_000) {
    const val = num / 1_000;
    return (val % 1 === 0 ? val : val.toFixed(1)) + 'K';
  }
  return String(Math.round(num));
}

/**
 * Reusable data transformation function.
 * Accepts aggregated timeline data from backend if available, or falls back to raw item arrays.
 *
 * @param {Array} webhooks - Array of webhook items with `received_at`
 * @param {Array} replays - Array of replay items with `created_at`
 * @param {string} timeframe - '1 Day' | '7 Days' | '30 Days'
 * @param {Object} timeline - Optional backend aggregated timeline { webhooks: [], replays: [] }
 * @returns {Object} { points, hasWebhookData, hasReplayData, hasReplayTimestamps, maxVal }
 */
export function getChartData(webhooks = [], replays = [], timeframe = '7 Days', timeline = null) {
  const tf = normalizeTimeframe(timeframe);
  const now = new Date();

  // Validate replay timestamp support in actual records
  let validReplayTimestamps = 0;
  for (let i = 0; i < Math.min(replays.length, 50); i++) {
    if (replays[i]?.created_at && !isNaN(new Date(replays[i].created_at).getTime())) {
      validReplayTimestamps++;
    }
  }
  const hasReplayTimestamps = replays.length === 0 || validReplayTimestamps > 0;

  const buckets = [];

  if (tf === '1 Day') {
    // 24 hourly buckets over the last 24 hours
    const startHour = new Date(now.getTime() - 23 * 60 * 60 * 1000);
    startHour.setMinutes(0, 0, 0);

    for (let i = 0; i < 24; i++) {
      const bStart = new Date(startHour.getTime() + i * 60 * 60 * 1000);
      const bEnd = new Date(bStart.getTime() + 60 * 60 * 1000);

      const hours = bStart.getHours();
      const formattedHour = String(hours).padStart(2, '0') + ':00';
      const showLabel = i % 4 === 0 || i === 23;

      const dateStr = bStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });

      buckets.push({
        label: formattedHour,
        showLabel,
        fullDate: `${dateStr}, ${formattedHour}`,
        startTime: bStart.getTime(),
        endTime: bEnd.getTime(),
        webhooks: 0,
        replays: 0,
      });
    }
  } else if (tf === '7 Days') {
    // 7 daily buckets (today and past 6 days)
    for (let i = 6; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const bStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
      const bEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

      const shortMonth = bStart.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = bStart.getDate();
      const label = `${shortMonth} ${dayNum}`;

      buckets.push({
        label,
        showLabel: true,
        fullDate: bStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        startTime: bStart.getTime(),
        endTime: bEnd.getTime(),
        webhooks: 0,
        replays: 0,
      });
    }
  } else {
    // 30 Days daily buckets
    for (let i = 29; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const bStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 0, 0, 0, 0);
      const bEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

      const shortMonth = bStart.toLocaleDateString('en-US', { month: 'short' });
      const dayNum = bStart.getDate();
      const label = `${shortMonth} ${dayNum}`;
      const showLabel = i % 5 === 0 || i === 0;

      buckets.push({
        label,
        showLabel,
        fullDate: bStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        startTime: bStart.getTime(),
        endTime: bEnd.getTime(),
        webhooks: 0,
        replays: 0,
      });
    }
  }

  let totalWebhooksCounted = 0;
  let totalReplaysCounted = 0;

  // 1. Check if backend aggregated timeline is available (contains true counts e.g. 58k)
  const hasBackendTimeline =
    timeline &&
    (Array.isArray(timeline.webhooks) || Array.isArray(timeline.replays)) &&
    ((timeline.webhooks && timeline.webhooks.length > 0) || (timeline.replays && timeline.replays.length > 0));

  if (hasBackendTimeline) {
    if (Array.isArray(timeline.webhooks)) {
      for (const item of timeline.webhooks) {
        if (!item?.period) continue;
        const count = Number(item.count || 0);
        const t = new Date(item.period).getTime();
        if (isNaN(t)) continue;

        if (tf === '1 Day') {
          const itemHour = new Date(t).getHours();
          const itemDate = new Date(t).getDate();
          for (const b of buckets) {
            const bDate = new Date(b.startTime);
            if (bDate.getDate() === itemDate && bDate.getHours() === itemHour) {
              b.webhooks += count;
              totalWebhooksCounted += count;
              break;
            }
          }
        } else {
          const itemDateStr = new Date(t).toDateString();
          for (const b of buckets) {
            const bDateStr = new Date(b.startTime).toDateString();
            if (bDateStr === itemDateStr) {
              b.webhooks += count;
              totalWebhooksCounted += count;
              break;
            }
          }
        }
      }
    }

    if (Array.isArray(timeline.replays)) {
      for (const item of timeline.replays) {
        if (!item?.period) continue;
        const count = Number(item.count || 0);
        const t = new Date(item.period).getTime();
        if (isNaN(t)) continue;

        if (tf === '1 Day') {
          const itemHour = new Date(t).getHours();
          const itemDate = new Date(t).getDate();
          for (const b of buckets) {
            const bDate = new Date(b.startTime);
            if (bDate.getDate() === itemDate && bDate.getHours() === itemHour) {
              b.replays += count;
              totalReplaysCounted += count;
              break;
            }
          }
        } else {
          const itemDateStr = new Date(t).toDateString();
          for (const b of buckets) {
            const bDateStr = new Date(b.startTime).toDateString();
            if (bDateStr === itemDateStr) {
              b.replays += count;
              totalReplaysCounted += count;
              break;
            }
          }
        }
      }
    }
  } else {
    // Fallback: Populate counts from individual raw item arrays
    if (Array.isArray(webhooks)) {
      for (const wh of webhooks) {
        if (!wh?.received_at) continue;
        const t = new Date(wh.received_at).getTime();
        if (isNaN(t)) continue;

        for (const b of buckets) {
          if (t >= b.startTime && t <= b.endTime) {
            b.webhooks += 1;
            totalWebhooksCounted += 1;
            break;
          }
        }
      }
    }

    if (Array.isArray(replays) && hasReplayTimestamps) {
      for (const rep of replays) {
        if (!rep?.created_at) continue;
        const t = new Date(rep.created_at).getTime();
        if (isNaN(t)) continue;

        for (const b of buckets) {
          if (t >= b.startTime && t <= b.endTime) {
            b.replays += 1;
            totalReplaysCounted += 1;
            break;
          }
        }
      }
    }
  }

  // Calculate highest data value for clean scale
  let maxVal = 0;
  for (const b of buckets) {
    if (b.webhooks > maxVal) maxVal = b.webhooks;
    if (b.replays > maxVal) maxVal = b.replays;
  }

  const hasWebhookData = totalWebhooksCounted > 0;
  const hasReplayData = totalReplaysCounted > 0;

  return {
    points: buckets,
    hasWebhookData,
    hasReplayData,
    hasReplayTimestamps,
    totalWebhooksCounted,
    totalReplaysCounted,
    maxVal,
  };
}

/**
 * Calculates smooth monotonic cubic Bézier spline paths through SVG points.
 * Uses Fritsch-Carlson monotone cubic interpolation to prevent any overshoot
 * and strictly ensures the curve NEVER dips below the baseline (zero value).
 *
 * @param {Array} pts - Array of { x, y, val } points
 * @param {number} baseline - Baseline Y coordinate in SVG (y of value 0)
 * @returns {string} SVG path 'd' string
 */
export function generateBezierSpline(pts, baseline = null) {
  if (!pts || pts.length === 0) return '';
  if (pts.length === 1) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  if (pts.length === 2) return `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)} L ${pts[1].x.toFixed(1)} ${pts[1].y.toFixed(1)}`;

  const n = pts.length;
  const base = baseline != null ? baseline : pts[0].y;

  // 1. Calculate secant slopes between consecutive points
  const dxs = [];
  const dys = [];
  const ms = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    dxs.push(dx);
    dys.push(dy);
    ms.push(dx === 0 ? 0 : dy / dx);
  }

  // 2. Compute monotonic tangents
  const tangents = new Array(n);
  tangents[0] = ms[0];
  tangents[n - 1] = ms[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const mPrev = ms[i - 1];
    const mNext = ms[i];

    if (mPrev * mNext <= 0) {
      // Local peak or flat plateau: tangent must be 0 to prevent overshoot
      tangents[i] = 0;
    } else {
      // Harmonic mean of secants
      tangents[i] = (2 * mPrev * mNext) / (mPrev + mNext);
    }
  }

  // Zero-value rule: if a point has value 0 (at baseline), tangent is 0
  for (let i = 0; i < n; i++) {
    if (pts[i].val === 0 || pts[i].y >= base - 0.5) {
      if ((i > 0 && pts[i - 1].val === 0) || (i < n - 1 && pts[i + 1].val === 0)) {
        tangents[i] = 0;
      }
    }
  }

  // 3. Build cubic Bézier path with strict baseline clamping
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;

  for (let i = 0; i < n - 1; i++) {
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const dx = dxs[i];

    // If both points are at zero baseline, draw flat line
    if (p1.val === 0 && p2.val === 0) {
      d += ` L ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
      continue;
    }

    // Bézier control points
    const cp1x = p1.x + dx / 3;
    let cp1y = p1.y + (tangents[i] * dx) / 3;

    const cp2x = p2.x - dx / 3;
    let cp2y = p2.y - (tangents[i + 1] * dx) / 3;

    // Strict clamping: control points can NEVER dip below baseline into negative space
    if (base != null) {
      cp1y = Math.min(cp1y, base);
      cp2y = Math.min(cp2y, base);
    }

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return d;
}

export function computeYAxisTicks(maxVal = 4, tickCount = 4) {
  if (maxVal <= 0) return [0, 1, 2, 3];
  const step = maxVal / (tickCount - 1);
  return Array.from({ length: tickCount }, (_, i) => Math.round(i * step));
}

