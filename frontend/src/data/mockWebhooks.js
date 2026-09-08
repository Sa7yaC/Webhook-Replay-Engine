// Realistic mock data matching backend schema and reference UI

export const INITIAL_WEBHOOKS = [
  {
    id: 1,
    webhook_id: "wh_682aa1b8d4c21a5e3f1a2b3c",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:31:45Z",
    received_at_formatted: "May 21, 2025 12:31:45",
    headers: {
      "content-type": "application/json",
      "user-agent": "Stripe/1.0",
      "stripe-signature": "t=1716294705,v1=98df8b9a2c1103c...",
      "idempotency-key": "idem-wh-682aa1b8",
      "x-forwarded-for": "104.28.19.42",
      "accept": "application/json",
      "accept-encoding": "gzip, deflate"
    },
    body: {
      "event": "payment.succeeded",
      "order_id": "ORD-12348",
      "amount": 1250.00,
      "currency": "USD",
      "status": "completed",
      "customer": {
        "email": "alex.morgan@example.com",
        "name": "Alex Morgan"
      },
      "payment_method": "pm_card_visa_4242"
    },
    size: "1.45 KB",
    headers_size: "488 B",
    body_size: "1.45 KB",
    response_time: "143 ms"
  },
  {
    id: 2,
    webhook_id: "wh_682aa178d4c21a5e3f1a2b3b",
    method: "POST",
    status: "Failed",
    status_code: 500,
    received_at: "2025-05-21T12:29:32Z",
    received_at_formatted: "May 21, 2025 12:29:32",
    headers: {
      "content-type": "application/json",
      "user-agent": "Stripe/1.0",
      "stripe-signature": "t=1716294572,v1=abc1234ef56789...",
      "idempotency-key": "abc-xyz-123-retry",
      "x-forwarded-for": "117.239.19.12",
      "accept": "application/json",
      "content-length": "2150"
    },
    body: {
      "event": "payment.failed",
      "order_id": "ORD-12344",
      "amount": 499.00,
      "currency": "INR",
      "status": "failed",
      "reason": "Insufficient funds"
    },
    size: "2.10 KB",
    headers_size: "512 B",
    body_size: "2.10 KB",
    response_time: "1.20 s",
    response_data: {
      "error": "Internal Server Error",
      "message": "Payment gateway processing timeout at upstream endpoint",
      "code": 500
    }
  },
  {
    id: 3,
    webhook_id: "wh_682aa0d4d4c21a5e3f1a2b3a",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:28:10Z",
    received_at_formatted: "May 21, 2025 12:28:10",
    headers: {
      "content-type": "application/json",
      "user-agent": "Shopify-Webhooks/2.0",
      "x-shopify-topic": "orders/create",
      "x-shopify-shop-domain": "retail-store.myshopify.com",
      "x-forwarded-for": "35.192.88.10"
    },
    body: {
      "event": "order.created",
      "order_id": "ORD-99182",
      "total": 78.50,
      "currency": "EUR",
      "line_items_count": 3
    },
    size: "980 B",
    headers_size: "420 B",
    body_size: "980 B",
    response_time: "98 ms"
  },
  {
    id: 4,
    webhook_id: "wh_682aa05cd4c21a5e3f1a2b39",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:27:05Z",
    received_at_formatted: "May 21, 2025 12:27:05",
    headers: {
      "content-type": "application/json",
      "user-agent": "GitHub-Hookshot/3.1",
      "x-github-event": "push",
      "x-github-delivery": "3d5f-4e89-b883",
      "x-forwarded-for": "140.82.112.4"
    },
    body: {
      "ref": "refs/heads/main",
      "action": "push",
      "repository": {
        "name": "webhook-replay-engine",
        "full_name": "org/webhook-replay-engine"
      },
      "commits_count": 2
    },
    size: "1.22 KB",
    headers_size: "460 B",
    body_size: "1.22 KB",
    response_time: "156 ms"
  },
  {
    id: 5,
    webhook_id: "wh_682a9fa0d4c21a5e3f1a2b38",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:26:18Z",
    received_at_formatted: "May 21, 2025 12:26:18",
    headers: {
      "content-type": "application/json",
      "user-agent": "Paddle-Webhook/1.0",
      "paddle-signature": "p_sig_882991012",
      "x-forwarded-for": "52.214.19.82"
    },
    body: {
      "event": "subscription.activated",
      "subscription_id": "sub_4481029",
      "plan": "pro_monthly",
      "status": "active"
    },
    size: "1.10 KB",
    headers_size: "390 B",
    body_size: "1.10 KB",
    response_time: "112 ms"
  },
  {
    id: 6,
    webhook_id: "wh_682a9f18d4c21a5e3f1a2b37",
    method: "POST",
    status: "Failed",
    status_code: "-",
    received_at: "2025-05-21T12:25:47Z",
    received_at_formatted: "May 21, 2025 12:25:47",
    headers: {
      "content-type": "application/json",
      "user-agent": "Custom-Webhook-Client/1.2",
      "x-request-id": "req-9910-timeout",
      "x-forwarded-for": "172.56.21.9"
    },
    body: {
      "event": "sync.request",
      "source_id": "src_8831",
      "retry_count": 3,
      "message": "Connection terminated abruptly"
    },
    size: "1.08 KB",
    headers_size: "410 B",
    body_size: "1.08 KB",
    response_time: "10.0 s",
    response_data: {
      "error": "Gateway Timeout",
      "message": "Target server failed to respond within 10000ms"
    }
  },
  {
    id: 7,
    webhook_id: "wh_682a9e88d4c21a5e3f1a2b36",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:25:01Z",
    received_at_formatted: "May 21, 2025 12:25:01",
    headers: {
      "content-type": "application/json",
      "user-agent": "Razorpay/2.0",
      "x-razorpay-signature": "rzp_sig_990182",
      "x-forwarded-for": "103.21.244.1"
    },
    body: {
      "entity": "event",
      "account_id": "acc_88192301",
      "event": "payment.captured",
      "amount": 199900
    },
    size: "890 B",
    headers_size: "380 B",
    body_size: "890 B",
    response_time: "84 ms"
  },
  {
    id: 8,
    webhook_id: "wh_682a9df0d04c21a5e3f1a2b35",
    method: "POST",
    status: "Completed",
    status_code: 200,
    received_at: "2025-05-21T12:24:11Z",
    received_at_formatted: "May 21, 2025 12:24:11",
    headers: {
      "content-type": "application/json",
      "user-agent": "Auth0-Webhook/1.0",
      "x-auth0-delivery": "del_188291039",
      "x-forwarded-for": "54.187.210.88"
    },
    body: {
      "event": "user.signup",
      "user_id": "usr_99812401",
      "connection": "google-oauth2",
      "ip": "172.16.0.4"
    },
    size: "1.01 KB",
    headers_size: "430 B",
    body_size: "1.01 KB",
    response_time: "105 ms"
  }
];

export const INITIAL_REPLAYS = [
  {
    id: 1,
    replay_id: "rep_682aa1f8d4c21a5e3f1a2b99",
    webhook_id: "wh_682aa178d4c21a5e3f1a2b3b",
    target_url: "https://api.test.com/webhook",
    status: "Failed",
    status_code: 500,
    duration: "1.35 s",
    created_at: "2025-05-21T12:35:01Z",
    created_at_formatted: "May 21, 2025 12:35:01",
    success: false,
    response_body: JSON.stringify({
      error: "Internal Server Error",
      code: 500,
      timestamp: "2025-05-21T12:35:02Z",
      message: "Target server threw unhandled rejection while processing ORD-12344"
    }, null, 2)
  },
  {
    id: 2,
    replay_id: "rep_682aa1c7d4c21a5e3f1a2b98",
    webhook_id: "wh_682aa1b8d4c21a5e3f1a2b3c",
    target_url: "https://api.test.com/webhook",
    status: "Completed",
    status_code: 200,
    duration: "143 ms",
    created_at: "2025-05-21T12:34:02Z",
    created_at_formatted: "May 21, 2025 12:34:02",
    success: true,
    response_body: JSON.stringify({
      success: true,
      message: "Webhook processed successfully",
      order_id: "ORD-12348"
    }, null, 2)
  },
  {
    id: 3,
    replay_id: "rep_682a9f18d4c21a5e3f1a2b97",
    webhook_id: "wh_682aa05cd4c21a5e3f1a2b39",
    target_url: "https://api.test.com/webhook",
    status: "Completed",
    status_code: 200,
    duration: "156 ms",
    created_at: "2025-05-21T12:30:22Z",
    created_at_formatted: "May 21, 2025 12:30:22",
    success: true,
    response_body: JSON.stringify({
      acknowledged: true,
      commits_ingested: 2
    }, null, 2)
  },
  {
    id: 4,
    replay_id: "rep_682a9f18d4c21a5e3f1a2b98",
    webhook_id: "wh_682aa178d4c21a5e3f1a2b3b",
    target_url: "https://api.test.com/webhook",
    status: "Completed",
    status_code: 200,
    duration: "143 ms",
    created_at: "2025-05-21T12:30:22Z",
    created_at_formatted: "May 21, 2025 12:30:22",
    success: true,
    response_body: JSON.stringify({
      success: true,
      status: "queued"
    }, null, 2)
  }
];

export const SUMMARY_STATS = {
  totalWebhooks: 124,
  successful: 98,
  successRate: "79.03%",
  failed: 26,
  failureRate: "20.97%",
  totalReplays: 68
};
