# Webhook Replay Engine

A backend platform for capturing, storing, inspecting, and replaying HTTP webhook events.

## About the Project

Webhooks allow one application to notify another application when an event occurs. For example, a payment service can send a webhook to an e-commerce backend when a payment succeeds.

When a webhook fails, developers often need to search through server logs, inspect the original request, and manually recreate the request to test the issue.

The **Webhook Replay Engine** simplifies this workflow by capturing and storing webhook requests and allowing developers to inspect and replay them when debugging failed events.

```text
Webhook Received
       ↓
Store Request
       ↓
Inspect Webhook
       ↓
Replay Webhook
       ↓
Receive Response
       ↓
Store Replay Result
```

## Core Concepts

### 1. Webhook Capture

A webhook is received through a unique endpoint:

```http
POST /api/v1/webhook/:id
```

The system stores important request information such as:

- Webhook ID
- HTTP method
- Request headers
- Request body
- Received timestamp

This creates a persistent record of the original event.

### 2. Webhook Inspection

Stored webhooks can be retrieved through the API.

Developers can inspect:

- HTTP method
- Request headers
- Request body
- Webhook ID
- Received timestamp

This helps identify exactly what was received when an event occurred.

### 3. Webhook Replay

A stored webhook can be sent again to a specified target endpoint.

Example:

```http
POST /api/v1/webhook/:id/replay
```

Request body:

```json
{
  "targetUrl": "https://webhook.site/your-webhook-id"
}
```

The engine retrieves the stored webhook body and sends it to the target URL.

The replay also measures how long the target endpoint takes to respond.

### 4. Replay Tracking

Every replay is stored with information such as:

- Webhook ID
- Target URL
- HTTP status code
- Response body
- Response duration
- Success/failure status

This allows developers to determine whether a previously failed webhook can be successfully processed after fixing the underlying issue.

### 5. Request Security

Because the replay endpoint makes outbound HTTP requests, the target URL cannot be blindly trusted.

The replay engine currently applies several protections:

- Only `http` and `https` URLs are accepted.
- Invalid URLs are rejected.
- Localhost addresses are blocked.
- Private IP addresses are blocked.
- Hostnames are resolved and their IP addresses are checked.
- Sensitive headers are not blindly forwarded.
- Outbound requests have a 10-second timeout.
- Automatic redirects are disabled.
- JSON request bodies are limited to 20 KB.

These controls help reduce SSRF and request-abuse risks.

## API Endpoints

Base URL:

```text
/api/v1
```

### Store Webhook

```http
POST /api/v1/webhook/:id
```

Receives and stores a webhook event.

Example:

```bash
curl -X POST http://localhost:3000/api/v1/webhook/test1234 \
  -H "Content-Type: application/json" \
  -d '{"event":"payment.success","order_id":"ORD-12345"}'
```

### Get All Webhooks

```http
GET /api/v1/webhook
```

Returns the stored webhook list.

Example response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "webhook_id": "test1234",
      "method": "POST",
      "received_at": "2026-08-18T12:00:00.000Z"
    }
  ]
}
```

### Get a Specific Webhook

```http
GET /api/v1/webhook/:id
```

Returns the details of a specific stored webhook, including its headers and body.

### Replay a Webhook

```http
POST /api/v1/webhook/:id/replay
```

Request body:

```json
{
  "targetUrl": "https://webhook.site/your-webhook-id"
}
```

Example response:

```json
{
  "success": true,
  "status": 200,
  "duration": "143.52ms",
  "targetUrl": "https://webhook.site/your-webhook-id"
}
```

### Get Replay History

```http
GET /api/v1/webhook/:id/replay
```

Returns the replay history associated with a webhook.

Example response:

```json
[
  {
    "id": 1,
    "target_url": "https://webhook.site/your-webhook-id",
    "status_code": 200,
    "duration": "143.52ms",
    "success": true
  }
]
```

## Technology

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- Axios

## Project Structure

```text
backend/
├── src/
│   ├── controllers/
│   │   ├── webhook.controller.js
│   │   └── replay.controller.js
│   │
│   ├── routes/
│   │   ├── webhook.routes.js
│   │   └── replay.routes.js
│   │
│   └── utils/
│       └── urlSecurity.js
│
├── prisma/
│   └── schema.prisma
│
├── app.js
└── server.js
```

## Current Status

The core backend functionality for webhook capture, storage, inspection, replay, replay tracking, and basic replay security has been implemented.

The project is currently being extended with a React dashboard and additional production-level security features.