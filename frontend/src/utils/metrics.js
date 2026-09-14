/**
 * Metrics & Period Calculation Helpers
 *
 * Provides pure utility functions for:
 * 1. Deriving current and previous comparison periods based on date range
 * 2. Calculating percentage change without division by zero
 * 3. Constructing structured metric models for cards
 */

/**
 * Given a dateRange name (e.g. 'Last 7 days', 'Today', 'Last 24 hours', 'Last 30 days', 'All time')
 * or a number of days, returns the current and previous comparison time windows.
 *
 * @param {string|number} range
 * @returns {{
 *   currentStart: Date|null,
 *   currentEnd: Date,
 *   previousStart: Date|null,
 *   previousEnd: Date|null,
 *   hasComparison: boolean
 * }}
 */
export function getComparisonPeriods(range = 'Last 7 days') {
  const now = new Date();

  // If passed a raw number of days
  if (typeof range === 'number') {
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - range * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - range * 24 * 60 * 60 * 1000);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      hasComparison: true,
    };
  }

  const r = (range || '').toLowerCase().trim();

  if (r === 'today') {
    // Current period: Start of today (00:00:00) until now
    const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const currentEnd = now;

    // Previous period: Same window yesterday
    const elapsedToday = currentEnd.getTime() - currentStart.getTime();
    const previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);
    const previousEnd = new Date(previousStart.getTime() + elapsedToday);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      hasComparison: true,
    };
  }

  if (r === 'last 24 hours' || r === '24h') {
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      hasComparison: true,
    };
  }

  if (r === 'last 7 days' || r === '7d') {
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      hasComparison: true,
    };
  }

  if (r === 'last 30 days' || r === '30d') {
    const currentEnd = now;
    const currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const previousEnd = currentStart;
    const previousStart = new Date(currentStart.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
      hasComparison: true,
    };
  }

  // 'All time' or unknown range: No finite previous period exists for comparison
  return {
    currentStart: null,
    currentEnd: now,
    previousStart: null,
    previousEnd: null,
    hasComparison: false,
  };
}

/**
 * Calculates percentage change between current and previous values.
 *
 * Rules:
 * - If previousValue === 0:
 *   - If currentValue > 0: return null (cannot calculate meaningful percentage without historical base)
 *   - If currentValue === 0: return 0
 * - Avoids division by zero.
 * - Rounds to one decimal place.
 *
 * @param {number} currentValue
 * @param {number} previousValue
 * @returns {number|null}
 */
export function calculatePercentageChange(currentValue, previousValue) {
  if (currentValue == null || previousValue == null) {
    return null;
  }

  const current = Number(currentValue);
  const previous = Number(previousValue);

  if (isNaN(current) || isNaN(previous)) {
    return null;
  }

  if (previous === 0) {
    if (current === 0) return 0;
    return null; // Cannot divide by zero; return unavailable
  }

  const change = ((current - previous) / previous) * 100;
  return Number(change.toFixed(1));
}

/**
 * Formats percentage change and determines visual direction.
 *
 * @param {number|null} percentage
 * @returns {{
 *   direction: 'up'|'down'|'neutral'|'none',
 *   formattedText: string
 * }}
 */
export function getMetricDirection(percentage) {
  if (percentage == null || isNaN(percentage)) {
    return {
      direction: 'none',
      formattedText: '—',
    };
  }

  if (percentage > 0) {
    return {
      direction: 'up',
      formattedText: `+${percentage.toFixed(1)}% ↑`,
    };
  }

  if (percentage < 0) {
    return {
      direction: 'down',
      formattedText: `${percentage.toFixed(1)}% ↓`,
    };
  }

  return {
    direction: 'neutral',
    formattedText: '→ 0.0%',
  };
}
