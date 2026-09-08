import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getWebhooks,
  getWebhook,
  getWebhookReplays,
  getAllReplays,
  replayWebhook,
} from '../services/webhookApi';

/**
 * Central data hook for the Dashboard.
 *
 * Manages:
 *  - webhook list + count (from GET /webhook)
 *  - selected webhook detail (from GET /webhook/:id — numeric id)
 *  - replay history for selected webhook (from GET /webhook/:id/replay — webhook_id string)
 *  - replay execution (POST /webhook/:id/replay — webhook_id string)
 *  - derived summary statistics
 *  - loading / error states for every async operation
 */
export default function useWebhooks(dateRange = 'Today') {
  // ---- Webhook list ---------------------------------------------------
  const [webhooks, setWebhooks] = useState([]);
  const [webhookCount, setWebhookCount] = useState(0);
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

  // ---- Derived summary stats ------------------------------------------
  const totalCount = webhookCount || webhooks.length;
  const successfulCount = webhooks.filter(w => w.status === 'Completed').length;
  const failedCount = webhooks.filter(w => w.status === 'Failed').length;

  const successPercent = totalCount > 0
    ? `${Math.round((successfulCount / (successfulCount + failedCount || 1)) * 100)}%`
    : '100%';
  const failurePercent = totalCount > 0
    ? `${Math.round((failedCount / (successfulCount + failedCount || 1)) * 100)}%`
    : '0%';

  const totalReplaysCount = allReplays.length;
  const successfulReplaysCount = allReplays.filter(r => r.status === 'Completed' || r.success === true).length;
  const failedReplaysCount = allReplays.filter(r => r.status === 'Failed' || r.success === false).length;
  const replaySuccessPercent = totalReplaysCount > 0
    ? `${Math.round((successfulReplaysCount / totalReplaysCount) * 100)}%`
    : '100%';
  const replayFailurePercent = totalReplaysCount > 0
    ? `${Math.round((failedReplaysCount / totalReplaysCount) * 100)}%`
    : '0%';

  const stats = {
    totalWebhooks: totalCount,
    successful: successfulCount,
    successRate: totalCount > 0 ? `${successPercent} rate` : '100% rate',
    failed: failedCount,
    failureRate: totalCount > 0 ? `${failurePercent} rate` : '0% rate',
    totalReplays: allReplays.length,
    timeRange: dateRange,
  };

  const replayStats = {
    totalReplays: totalReplaysCount,
    successful: successfulReplaysCount,
    successRate: totalReplaysCount > 0 ? `${replaySuccessPercent} rate` : '100% rate',
    failed: failedReplaysCount,
    failureRate: totalReplaysCount > 0 ? `${replayFailurePercent} rate` : '0% rate',
    timeRange: dateRange,
  };

  // =====================================================================
  // Fetch webhook list
  // =====================================================================
  const loadWebhooks = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setListLoading(true);
    setListError(null);
    try {
      const { webhooks: data, count } = await getWebhooks(range);
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
  // Select a webhook — fetch full detail + its replay history
  // =====================================================================
  const selectWebhook = useCallback(async (webhook) => {
    if (!webhook) {
      setSelectedWebhook(null);
      setReplays([]);
      return;
    }

    // Immediately show the list-level data so the panel is not blank
    setSelectedWebhook(webhook);
    setDetailLoading(true);
    setDetailError(null);
    setReplaysLoading(true);
    setReplaysError(null);

    // Fetch full detail (uses numeric id) and replay history (uses webhook_id) concurrently
    const numericId = webhook.id;
    const webhookIdString = webhook.webhook_id;

    try {
      const [detail, replayHistory] = await Promise.allSettled([
        getWebhook(numericId),
        getWebhookReplays(webhookIdString),
      ]);

      if (!mountedRef.current) return;

      // Detail result
      if (detail.status === 'fulfilled') {
        setSelectedWebhook(detail.value);
        setDetailError(null);
      } else {
        setDetailError(detail.reason?.message || 'Failed to load webhook details');
      }

      // Replay history result
      if (replayHistory.status === 'fulfilled') {
        setReplays(replayHistory.value);
        setReplaysError(null);
      } else {
        setReplays([]);
        setReplaysError(replayHistory.reason?.message || 'Failed to load replay history');
      }
    } finally {
      setDetailLoading(false);
      setReplaysLoading(false);
    }
  }, []);

  // =====================================================================
  // Execute a replay
  // =====================================================================
  const executeReplay = useCallback(async (webhookIdString, targetUrl) => {
    setReplaySubmitting(true);
    try {
      const result = await replayWebhook(webhookIdString, targetUrl);

      // After successful replay, refresh replay history for the selected webhook
      if (mountedRef.current && selectedWebhook?.webhook_id === webhookIdString) {
        try {
          const updated = await getWebhookReplays(webhookIdString);
          if (mountedRef.current) setReplays(updated);
        } catch {
          // Non-critical: the replay succeeded but refresh failed
        }
      }

      return result;
    } finally {
      if (mountedRef.current) setReplaySubmitting(false);
    }
  }, [selectedWebhook]);

  // =====================================================================
  // Load all replays for the "Recent Replays" table
  // =====================================================================
  const loadAllReplays = useCallback(async (rangeToUse) => {
    const range = rangeToUse !== undefined ? rangeToUse : dateRange;
    setAllReplaysLoading(true);

    try {
      const replaysData = await getAllReplays(range);
      if (mountedRef.current) {
        setAllReplays(replaysData || []);
      }
    } catch {
      if (mountedRef.current) {
        setAllReplays([]);
      }
    } finally {
      if (mountedRef.current) setAllReplaysLoading(false);
    }
  }, [dateRange]);

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

    // All replays (for Replays views)
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
