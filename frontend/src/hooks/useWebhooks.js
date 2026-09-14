import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getWebhooks,
  getWebhook,
  getWebhookReplays,
  getAllReplays,
  replayWebhook,
} from '../services/webhookApi';
import {
  getComparisonPeriods,
  calculatePercentageChange,
} from '../utils/metrics';

/**
 * Central data hook for the Dashboard.
 *
 * Manages:
 *  - webhook list + count
 *  - selected webhook detail
 *  - replay history for selected webhook
 *  - replay execution
 *  - single-fetch period-based comparison metrics (Total Webhooks, Total Replays, etc.)
 *  - loading / error states
 */
export default function useWebhooks(dateRange = 'Last 7 days') {
  // ---- Webhook list ---------------------------------------------------
  const [webhooks, setWebhooks] = useState([]);
  const [webhookCount, setWebhookCount] = useState(0);
  const [rawComparisonWebhooks, setRawComparisonWebhooks] = useState({
    current: [],
    previous: [],
    hasComparison: false,
  });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // ---- Selected webhook detail ----------------------------------------
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

  // ---- Replay history -------------------------------------------------
  const [replays, setReplays] = useState([]);
  const [replaysLoading, setReplaysLoading] = useState(false);
  const [replaysError, setReplaysError] = useState(null);

  // ---- All replays for the "Recent Replays" table ---------------------
  const [allReplays, setAllReplays] = useState([]);
  const [rawComparisonReplays, setRawComparisonReplays] = useState({
    current: [],
    previous: [],
    hasComparison: false,
  });
  const [allReplaysLoading, setAllReplaysLoading] = useState(false);

  // ---- Replay execution -----------------------------------------------
  const [replaySubmitting, setReplaySubmitting] = useState(false);

  // Guard against state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // =====================================================================
  // Fetch webhook list with comparison period window
  // =====================================================================
  const loadWebhooks = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setListLoading(true);
    setListError(null);

    const periods = getComparisonPeriods(range);

    try {
      // Query covering previous comparison start if available, else standard range
      const fetchOptions = periods.hasComparison && periods.previousStart
        ? { startDate: periods.previousStart, limit: 1000 }
        : { dateRange: range, limit: 1000 };

      const { webhooks: data, count } = await getWebhooks(fetchOptions);
      if (!mountedRef.current) return;

      if (periods.hasComparison && periods.previousStart && periods.currentStart) {
        const cStartMs = periods.currentStart.getTime();
        const cEndMs = periods.currentEnd.getTime();
        const pStartMs = periods.previousStart.getTime();
        const pEndMs = periods.previousEnd ? periods.previousEnd.getTime() : cStartMs;

        const currentItems = [];
        const previousItems = [];

        for (const wh of data) {
          if (!wh.received_at) {
            currentItems.push(wh);
            continue;
          }
          const t = new Date(wh.received_at).getTime();
          if (t >= cStartMs && t <= cEndMs) {
            currentItems.push(wh);
          } else if (t >= pStartMs && t < pEndMs) {
            previousItems.push(wh);
          }
        }

        setWebhooks(currentItems);
        setWebhookCount(currentItems.length);
        setRawComparisonWebhooks({
          current: currentItems,
          previous: previousItems,
          hasComparison: true,
        });
      } else {
        setWebhooks(data);
        setWebhookCount(count);
        setRawComparisonWebhooks({
          current: data,
          previous: [],
          hasComparison: false,
        });
      }
    } catch (err) {
      if (!mountedRef.current) return;
      setListError(err.message);
    } finally {
      if (mountedRef.current) setListLoading(false);
    }
  }, [dateRange]);

  // =====================================================================
  // Load all replays with comparison window
  // =====================================================================
  const loadAllReplays = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setAllReplaysLoading(true);

    const periods = getComparisonPeriods(range);

    try {
      const fetchOptions = periods.hasComparison && periods.previousStart
        ? { startDate: periods.previousStart, limit: 1000 }
        : { dateRange: range, limit: 1000 };

      const replaysData = await getAllReplays(fetchOptions);
      if (!mountedRef.current) return;

      const list = replaysData || [];

      if (periods.hasComparison && periods.previousStart && periods.currentStart) {
        const cStartMs = periods.currentStart.getTime();
        const cEndMs = periods.currentEnd.getTime();
        const pStartMs = periods.previousStart.getTime();
        const pEndMs = periods.previousEnd ? periods.previousEnd.getTime() : cStartMs;

        const currentItems = [];
        const previousItems = [];

        for (const rep of list) {
          if (!rep.created_at) {
            currentItems.push(rep);
            continue;
          }
          const t = new Date(rep.created_at).getTime();
          if (t >= cStartMs && t <= cEndMs) {
            currentItems.push(rep);
          } else if (t >= pStartMs && t < pEndMs) {
            previousItems.push(rep);
          }
        }

        setAllReplays(currentItems);
        setRawComparisonReplays({
          current: currentItems,
          previous: previousItems,
          hasComparison: true,
        });
      } else {
        setAllReplays(list);
        setRawComparisonReplays({
          current: list,
          previous: [],
          hasComparison: false,
        });
      }
    } catch {
      if (mountedRef.current) {
        setAllReplays([]);
        setRawComparisonReplays({
          current: [],
          previous: [],
          hasComparison: false,
        });
      }
    } finally {
      if (mountedRef.current) setAllReplaysLoading(false);
    }
  }, [dateRange]);

  // =====================================================================
  // Derived summary statistics with dynamically computed percentage changes
  // =====================================================================
  const stats = useMemo(() => {
    const totalCurrentWebhooks = rawComparisonWebhooks.current.length || webhookCount || webhooks.length;
    const totalPreviousWebhooks = rawComparisonWebhooks.previous.length;

    const webhooksPercentChange = rawComparisonWebhooks.hasComparison
      ? calculatePercentageChange(totalCurrentWebhooks, totalPreviousWebhooks)
      : null;

    const totalCurrentReplays = rawComparisonReplays.current.length || allReplays.length;
    const totalPreviousReplays = rawComparisonReplays.previous.length;

    const replaysPercentChange = rawComparisonReplays.hasComparison
      ? calculatePercentageChange(totalCurrentReplays, totalPreviousReplays)
      : null;

    return {
      totalWebhooks: totalCurrentWebhooks,
      totalWebhooksChange: webhooksPercentChange,
      totalWebhooksCurrent: totalCurrentWebhooks,
      totalWebhooksPrevious: totalPreviousWebhooks,

      totalReplays: totalCurrentReplays,
      totalReplaysChange: replaysPercentChange,
      totalReplaysCurrent: totalCurrentReplays,
      totalReplaysPrevious: totalPreviousReplays,

      // As per requirement: incoming webhook table does not store response status.
      // Do not invent fake delivery status.
      successful: '—',
      successfulChange: null,
      failed: '—',
      failedChange: null,

      timeRange: dateRange,
    };
  }, [
    rawComparisonWebhooks,
    rawComparisonReplays,
    webhookCount,
    webhooks.length,
    allReplays.length,
    dateRange,
  ]);

  const replayStats = useMemo(() => {
    const current = rawComparisonReplays.current;
    const previous = rawComparisonReplays.previous;
    const hasComp = rawComparisonReplays.hasComparison;

    const totalCurrent = current.length || allReplays.length;
    const totalPrev = previous.length;
    const totalChange = hasComp ? calculatePercentageChange(totalCurrent, totalPrev) : null;

    const successCurrent = current.filter(r => r.status === 'Completed' || r.success === true).length;
    const successPrev = previous.filter(r => r.status === 'Completed' || r.success === true).length;
    const successChange = hasComp ? calculatePercentageChange(successCurrent, successPrev) : null;

    const failedCurrent = current.filter(r => r.status === 'Failed' || r.success === false).length;
    const failedPrev = previous.filter(r => r.status === 'Failed' || r.success === false).length;
    const failedChange = hasComp ? calculatePercentageChange(failedCurrent, failedPrev) : null;

    return {
      totalReplays: totalCurrent,
      totalReplaysChange: totalChange,
      successful: successCurrent,
      successfulChange: successChange,
      failed: failedCurrent,
      failedChange: failedChange,
      totalWebhooks: rawComparisonWebhooks.current.length || webhooks.length,
      totalWebhooksChange: stats.totalWebhooksChange,
      timeRange: dateRange,
    };
  }, [
    rawComparisonReplays,
    allReplays.length,
    rawComparisonWebhooks.current.length,
    webhooks.length,
    stats.totalWebhooksChange,
    dateRange,
  ]);

  // =====================================================================
  // Select a webhook — fetch full detail + its replay history
  // =====================================================================
  const selectWebhook = useCallback(async (webhook) => {
    if (!webhook) {
      setSelectedWebhook(null);
      setReplays([]);
      return;
    }

    setSelectedWebhook(webhook);
    setDetailLoading(true);
    setDetailError(null);
    setReplaysLoading(true);
    setReplaysError(null);

    const numericId = webhook.id;
    const webhookIdString = webhook.webhook_id;

    try {
      const [detail, replayHistory] = await Promise.allSettled([
        getWebhook(numericId),
        getWebhookReplays(webhookIdString),
      ]);

      if (!mountedRef.current) return;

      if (detail.status === 'fulfilled') {
        setSelectedWebhook(detail.value);
        setDetailError(null);
      } else {
        setDetailError(detail.reason?.message || 'Failed to load webhook details');
      }

      if (replayHistory.status === 'fulfilled') {
        setReplays(replayHistory.value);
        setReplaysError(null);
      } else {
        setReplays([]);
        setReplaysError(replayHistory.reason?.message || 'Failed to load replay history');
      }
    } finally {
      if (mountedRef.current) {
        setDetailLoading(false);
        setReplaysLoading(false);
      }
    }
  }, []);

  // =====================================================================
  // Execute a replay
  // =====================================================================
  const executeReplay = useCallback(async (webhookIdString, targetUrl) => {
    setReplaySubmitting(true);
    try {
      const result = await replayWebhook(webhookIdString, targetUrl);

      if (mountedRef.current && selectedWebhook?.webhook_id === webhookIdString) {
        try {
          const updated = await getWebhookReplays(webhookIdString);
          if (mountedRef.current) setReplays(updated);
        } catch {
          // Non-critical
        }
      }

      return result;
    } finally {
      if (mountedRef.current) setReplaySubmitting(false);
    }
  }, [selectedWebhook]);

  // =====================================================================
  // Initial & range-based load
  // =====================================================================
  useEffect(() => {
    loadWebhooks(dateRange);
    loadAllReplays(dateRange);
  }, [dateRange, loadWebhooks, loadAllReplays]);

  return {
    // Webhook list
    webhooks,
    webhookCount,
    listLoading,
    listError,
    loadWebhooks,

    // Selected webhook
    selectedWebhook,
    detailLoading,
    detailError,
    selectWebhook,

    // Replays for selected webhook
    replays,
    replaysLoading,
    replaysError,

    // All replays
    allReplays,
    allReplaysLoading,
    loadAllReplays,

    // Replay execution
    executeReplay,
    replaySubmitting,

    // Summary
    stats,
    replayStats,
  };
}
