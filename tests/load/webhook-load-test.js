import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const WEBHOOK_ID = __ENV.WEBHOOK_ID || "test1234";
const TARGET_URL = __ENV.TARGET_URL || "";

export const options = {
  scenarios: {

    // 1. Webhook ingestion
    ingestion: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "30s", target: 200 },
        { duration: "10s", target: 0 },
      ],
      exec: "webhookIngestion",
    },

    // 2. Webhook retrieval
    retrieval: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "30s", target: 200 },
        { duration: "10s", target: 0 },
      ],
      startTime: "2m",
      exec: "webhookRetrieval",
    },

    // 3. Webhook replay
    replay: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: 5 },
        { duration: "30s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "10s", target: 0 },
      ],
      startTime: "4m",
      exec: "webhookReplay",
    },
  },

  thresholds: {
    "http_req_failed": ["rate<0.05"],
    "http_req_duration": ["p(95)<2000", "p(99)<5000"],
    "checks": ["rate>0.95"],
  },
};


export function webhookIngestion() {

  const payload = JSON.stringify({
    event: "payment.success",
    order_id: `ORD-${__VU}-${__ITER}`,
    amount: 999,
    currency: "INR",
    status: "success",
  });

  const response = http.post(
    `${BASE_URL}/api/v1/webhook/${WEBHOOK_ID}`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(response, {
    "ingestion: status is 2xx": (r) =>
      r.status >= 200 && r.status < 300,
  });
}


export function webhookRetrieval() {

  const response = http.get(
    `${BASE_URL}/api/v1/webhook`
  );

  check(response, {
    "retrieval: status is 200": (r) =>
      r.status === 200,
  });
}

export function webhookReplay() {

  if (!TARGET_URL) {
    return;
  }

  const payload = JSON.stringify({
    targetUrl: TARGET_URL,
  });

  const response = http.post(
    `${BASE_URL}/api/v1/webhook/${WEBHOOK_ID}/replay`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: "10s",
    }
  );

  check(response, {
    "replay: request completed": (r) =>
      r.status >= 200 && r.status < 500,

    "replay: response received": (r) =>
      r.body !== undefined,
  });
}