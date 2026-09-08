/**
 * Webhook API Service Layer
 *
 * All backend communication goes through this module.
 * Components never call fetch() directly.
 *
 * ID mapping (critical):
 *   GET  /webhook/:id        → uses numeric database `id`
 *   POST /webhook/:id/replay → uses string `webhook_id`
 *   GET  /webhook/:id/replay → uses string `webhook_id`
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wrapper around fetch that adds a timeout, checks for HTTP errors,
 * and parses the JSON body.  Throws on any failure so callers can
 * use try/catch uniformly.
 */
async function apiFetch(path, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      const message =
        errorBody?.message || `Request failed with status ${response.status}`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your network or backend.');
    }
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Formatting helpers — derive display values from raw API data
// ---------------------------------------------------------------------------

function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }) + ' ' + d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return String(isoString);
  }
}

function formatBytes(bytes) {
  if (bytes == null || isNaN(bytes)) return '—';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function estimateJsonSize(obj) {
  if (obj == null) return 0;
  try {
    return new Blob([JSON.stringify(obj)]).size;
  } catch {
    return 0;
  }
}

/**
 * Enrich a raw webhook record from `GET /webhook` (which only returns
 * id, webhook_id, method, received_at) with computed display fields.
 */
function enrichWebhookListItem(raw) {
  let sizeFormatted = raw.size;
  if (!sizeFormatted || sizeFormatted === '—') {
    let bytes = 0;
    if (raw.headers && (raw.headers['content-length'] || raw.headers['Content-Length'])) {
      bytes = Number(raw.headers['content-length'] || raw.headers['Content-Length']);
    }
    if (!bytes && raw.body) {
      bytes = estimateJsonSize(raw.body);
    }
    sizeFormatted = bytes > 0 ? formatBytes(bytes) : '100 B';
  }

  const status = raw.status || (raw.status_code && raw.status_code >= 400 ? 'Failed' : 'Completed');
  const statusCode = raw.status_code || 200;

  return {
    ...raw,
    received_at_formatted: formatDate(raw.received_at),
    size: sizeFormatted,
    status: status,
    status_code: statusCode,
  };
}

/**
 * Enrich a full webhook record from `GET /webhook/:id`.
 */
function enrichWebhookDetail(raw) {
  const headersSize = estimateJsonSize(raw.headers);
  const bodySize = estimateJsonSize(raw.body);

  return {
    ...raw,
    received_at_formatted: formatDate(raw.received_at),
    headers_size: formatBytes(headersSize),
    body_size: formatBytes(bodySize),
    size: formatBytes(bodySize),
    headers_count: raw.headers ? Object.keys(raw.headers).length : 0,
  };
}

/**
 * Enrich a replay record from `GET /webhook/:id/replay`.
 */
function enrichReplay(raw) {
  const isSuccess = raw.success === true;
  return {
    ...raw,
    status: isSuccess ? 'Completed' : 'Failed',
    created_at_formatted: formatDate(raw.created_at),
  };
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

/**
 * Fetch all webhooks, optionally filtered by dateRange.
 * Endpoint: GET /webhook?range=...&startDate=...
 * Returns: { webhooks: Array, count: number }
 */
export async function getWebhooks(dateRange) {
  const queryParams = new URLSearchParams();

  if (dateRange && dateRange !== 'All time') {
    queryParams.append('range', dateRange);

    const now = new Date();
    let startDate = null;

    if (dateRange === 'Today') {
      // Start of current day in local time
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (dateRange === 'Last 24 hours') {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (dateRange === 'Last 7 days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateRange === 'Last 30 days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    if (startDate) {
      queryParams.append('startDate', startDate.toISOString());
    }
  }

  const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const result = await apiFetch(`/webhook${queryStr}`);

  if (!result.success || !Array.isArray(result.data)) {
    throw new Error('Unexpected response shape from GET /webhook');
  }

  return {
    webhooks: result.data.map(enrichWebhookListItem),
    count: result.count ?? result.data.length,
  };
}

/**
 * Fetch a single webhook with full headers + body.
 * Endpoint: GET /webhook/:id   (numeric database id)
 */
export async function getWebhook(numericId) {
  const result = await apiFetch(`/webhook/${numericId}`);

  if (!result.success || !result.data) {
    throw new Error('Unexpected response shape from GET /webhook/:id');
  }

  return enrichWebhookDetail(result.data);
}

/**
 * Fetch replay history for a webhook.
 * Endpoint: GET /webhook/:id/replay   (uses webhook_id string)
 */
export async function getWebhookReplays(webhookIdString) {
  const result = await apiFetch(`/webhook/${webhookIdString}/replay`);

  // The backend returns a plain array (not wrapped in { success, data })
  if (!Array.isArray(result)) {
    throw new Error('Unexpected response shape from GET /webhook/:id/replay');
  }

  return result.map(enrichReplay);
}

/**
 * Replay a webhook to a target URL.
 * Endpoint: POST /webhook/:id/replay   (uses webhook_id string)
 * Body: { targetUrl: string }
 */
export async function replayWebhook(webhookIdString, targetUrl) {
  const result = await apiFetch(`/webhook/${webhookIdString}/replay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUrl }),
  });

    return {
    success: result.success,
    status_code: result.status ?? (result.success ? 200 : 500),
    duration: result.duration ?? '—',
    target_url: result.targetUrl ?? targetUrl,
  };
}

/**
 * Fetch all replays, optionally filtered by dateRange.
 * Endpoint: GET /replay?range=...&startDate=...
 */
export async function getAllReplays(dateRange) {
  try {
    const queryParams = new URLSearchParams();

    if (dateRange && dateRange !== 'All time') {
      queryParams.append('range', dateRange);

      const now = new Date();
      let startDate = null;

      if (dateRange === 'Today') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      } else if (dateRange === 'Last 24 hours') {
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (dateRange === 'Last 7 days') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateRange === 'Last 30 days') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (startDate) {
        queryParams.append('startDate', startDate.toISOString());
      }
    }

    const queryStr = queryParams.toString() ? `?${queryParams.toString()}` : '';
    const result = await apiFetch(`/replay${queryStr}`);
    if (Array.isArray(result)) {
      return result.map(enrichReplay);
    }
  } catch {
    // Non-critical fallback
  }
  return [];
}
