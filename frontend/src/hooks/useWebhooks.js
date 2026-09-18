import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getWebhooks,
  getWebhook,
  getWebhookReplays,
  getAllReplays,
  replayWebhook,
  getDashboardMetrics,
} from '../services/webhookApi';
import {
  getComparisonPeriods,
  calculatePercentageChange,
} from '../utils/metrics';

/**
 * Central data hook for the Dashboard.
 *
 * Manages:
 *  - webhook list (latest 100 for table display)
 *  - selected webhook detail
 *  - replay history for selected webhook
 *  - replay execution
 *  - high-scale backend aggregate metrics (Total Webhooks, Total Replays, etc.)
 *  - loading / error states
 */
export default function useWebhooks(dateRange = '7 Days') {
  // ---- Webhook list (paginated table) ---------------------------------
  const [webhooks, setWebhooks] = useState([]);
  const [webhookCount, setWebhookCount] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(null);

  // ---- Metrics state (accurate aggregate counts from database) ---------
  const [metricsData, setMetricsData] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

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
  // Load aggregate metrics from backend COUNT queries
  // =====================================================================
  const loadMetrics = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setMetricsLoading(true);

    try {
      const data = await getDashboardMetrics({ dateRange: range });
      if (!mountedRef.current) return;
      setMetricsData(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      if (mountedRef.current) setMetricsLoading(false);
    }
  }, [dateRange]);

  // =====================================================================
  // Fetch webhook list
  // =====================================================================
  const loadWebhooks = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setListLoading(true);
    setListError(null);

    try {
      const fetchOptions = { dateRange: range, limit: 500 };
      const { webhooks: data, count } = await getWebhooks(fetchOptions);
      if (!mountedRef.current) return;

      setWebhooks(data);
      setWebhookCount(count);
    } catch (err) {
      if (!mountedRef.current) return;
      setListError(err.message);
    } finally {
      if (mountedRef.current) setListLoading(false);
    }
  }, [dateRange]);

  // =====================================================================
  // Load all replays
  // =====================================================================
  const loadAllReplays = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setAllReplaysLoading(true);

    try {
      const fetchOptions = { dateRange: range, limit: 500 };
      const replaysData = await getAllReplays(fetchOptions);
      if (!mountedRef.current) return;

      setAllReplays(replaysData || []);
    } catch {
      if (mountedRef.current) {
        setAllReplays([]);
      }
    } finally {
      if (mountedRef.current) setAllReplaysLoading(false);
    }
  }, [dateRange]);

  // =====================================================================
  // Derived summary statistics with dynamically computed percentage changes
  // =====================================================================
  const stats = useMemo(() => {
    if (metricsData) {
      return {
        totalWebhooks: metricsData.webhooks?.current ?? 0,
        totalWebhooksChange: null,
        totalWebhooksCurrent: metricsData.webhooks?.current ?? 0,
        totalWebhooksPrevious: metricsData.webhooks?.previous ?? 0,

        totalReplays: metricsData.replays?.current ?? 0,
        totalReplaysChange: null,
        totalReplaysCurrent: metricsData.replays?.current ?? 0,
        totalReplaysPrevious: metricsData.replays?.previous ?? 0,

        successful: metricsData.successful?.current ?? 0,
        successfulChange: null,
        successfulSubtext: 'Successful replays',

        failed: metricsData.failed?.current ?? 0,
        failedChange: null,
        failedSubtext: 'Failed replays',

        timeRange: metricsData.timeRange || dateRange,
        timeline: metricsData.timeline || null,
      };
    }

    return {
      totalWebhooks: webhookCount || webhooks.length,
      totalWebhooksChange: null,
      totalWebhooksCurrent: webhookCount || webhooks.length,
      totalWebhooksPrevious: 0,

      totalReplays: allReplays.length,
      totalReplaysChange: null,
      totalReplaysCurrent: allReplays.length,
      totalReplaysPrevious: 0,

      successful: 0,
      successfulChange: null,
      successfulSubtext: 'Successful replays',

      failed: 0,
      failedChange: null,
      failedSubtext: 'Failed replays',

      timeRange: dateRange,
    };
  }, [metricsData, webhookCount, webhooks.length, allReplays.length, dateRange]);

  const replayStats = useMemo(() => {
    if (metricsData) {
      return {
        totalReplays: metricsData.replays?.current ?? 0,
        totalReplaysChange: null,
        successful: metricsData.successful?.current ?? 0,
        successfulChange: null,
        failed: metricsData.failed?.current ?? 0,
        failedChange: null,
        totalWebhooks: metricsData.webhooks?.current ?? 0,
        totalWebhooksChange: null,
        timeRange: metricsData.timeRange || dateRange,
      };
    }

    return {
      totalReplays: allReplays.length,
      totalReplaysChange: null,
      successful: 0,
      successfulChange: null,
      failed: 0,
      failedChange: null,
      totalWebhooks: webhooks.length,
      totalWebhooksChange: null,
      timeRange: dateRange,
    };
  }, [metricsData, allReplays.length, webhooks.length, dateRange]);

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

      // Refresh metrics after a replay execution
      loadMetrics(dateRange);

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
  }, [selectedWebhook, loadMetrics, dateRange]);

  // =====================================================================
  // Initial & range-based load
  // =====================================================================
  useEffect(() => {
    loadMetrics(dateRange);
    loadWebhooks(dateRange);
    loadAllReplays(dateRange);
  }, [dateRange, loadMetrics, loadWebhooks, loadAllReplays]);

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

    // Aggregate metrics
    metricsLoading,
    loadMetrics,
    stats,
    replayStats,
  };
}
