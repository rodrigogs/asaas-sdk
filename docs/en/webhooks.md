# Webhooks

## Overview

Asaas sends webhook notifications to your endpoint when events occur (payment received, subscription renewed, transfer completed, etc.). The SDK provides a constant for the webhook authentication header and the ability to manage webhooks via the API.

Webhooks enable you to build event-driven integrations that react to changes in your Asaas account in real-time, without the need for constant polling.

## Webhook Authentication

Asaas authenticates webhook requests using a token sent in a custom header.

The SDK exports the header name as a constant:

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'
// Value: 'asaas-access-token'
```

When you create a webhook in Asaas (via dashboard or API), you configure an auth token. Asaas sends this token in the `asaas-access-token` header with every webhook request.

### Express

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

app.post('/webhooks/asaas', (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  const event = req.body
  // Handle event...

  res.status(200).send('OK')
})
```

### Next.js Route Handler

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

export async function POST(request: Request) {
  const token = request.headers.get(ASAAS_WEBHOOK_AUTH_HEADER)

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }

  const event = await request.json()
  // Handle event...

  return new Response('OK', { status: 200 })
}
```

### Fastify

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from '@rodrigogs/asaas-sdk'

fastify.post('/webhooks/asaas', async (request, reply) => {
  const token = request.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return reply.status(401).send('Unauthorized')
  }

  const event = request.body
  // Handle event...

  return reply.status(200).send('OK')
})
```

## Configuring Webhooks

Webhook endpoints are configured through the Asaas dashboard or during subaccount creation. When creating a subaccount via the SDK, you can include webhook configuration in the creation request:

```typescript
const subaccount = await client.subaccounts.create({
  name: 'Loja Exemplo',
  email: 'loja@example.com',
  cpfCnpj: '12345678901',
  mobilePhone: '11987654321',
  incomeValue: 5000,
  address: 'Av. Paulista',
  addressNumber: '1000',
  province: 'Bela Vista',
  postalCode: '01310-100',
  webhooks: [
    {
      url: 'https://yourapp.com/webhooks/subaccount',
      email: 'alerts@yourapp.com',
      apiVersion: 3,
      enabled: true,
      authToken: 'your-secret-token',
      sendType: 'SEQUENTIALLY',
    },
  ],
})
```

For the main account, configure webhooks directly in the [Asaas dashboard](https://www.asaas.com).

Asaas sends notifications for events across different resource types. The table below summarizes the main events by domain:

| Domain | Event | Description |
|--------|-------|-------------|
| **Payments** | `PAYMENT_CREATED` | New payment created |
| | `PAYMENT_UPDATED` | Payment details updated |
| | `PAYMENT_CONFIRMED` | Payment confirmed (credit card) |
| | `PAYMENT_RECEIVED` | Payment received and cleared |
| | `PAYMENT_OVERDUE` | Payment past due date |
| | `PAYMENT_REFUNDED` | Payment refunded |
| | `PAYMENT_DELETED` | Payment deleted |
| | `PAYMENT_RESTORED` | Deleted payment restored |
| | `PAYMENT_AWAITING_RISK_ANALYSIS` | Under risk analysis |
| | `PAYMENT_APPROVED_BY_RISK_ANALYSIS` | Approved after risk analysis |
| | `PAYMENT_REPROVED_BY_RISK_ANALYSIS` | Rejected by risk analysis |
| **Subscriptions** | `SUBSCRIPTION_CREATED` | New subscription created |
| | `SUBSCRIPTION_UPDATED` | Subscription updated |
| | `SUBSCRIPTION_DELETED` | Subscription deleted |
| **Transfers** | `TRANSFER_CREATED` | New transfer created |
| | `TRANSFER_PENDING` | Transfer pending processing |
| | `TRANSFER_DONE` | Transfer completed |
| | `TRANSFER_FAILED` | Transfer failed |
| **Invoices** | `INVOICE_CREATED` | New invoice (NF-e) created |
| | `INVOICE_UPDATED` | Invoice updated |
| | `INVOICE_AUTHORIZED` | Invoice authorized by tax authority |
| | `INVOICE_CANCELED` | Invoice canceled |
| **Bill Payments** | `BILL_PAYMENT_CREATED` | New bill payment created |
| | `BILL_PAYMENT_CONFIRMED` | Bill payment confirmed |
| | `BILL_PAYMENT_FAILED` | Bill payment failed |
| **Anticipations** | `ANTICIPATION_CREATED` | Anticipation requested |
| | `ANTICIPATION_APPROVED` | Anticipation approved |
| | `ANTICIPATION_DENIED` | Anticipation denied |
| **Accounts** | `ACCOUNT_STATUS_UPDATED` | Account status changed |
| | `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRING_SOON` | Commercial info expiring in 40 days |
| | `ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED` | Commercial info expired |
| **Checkouts** | `CHECKOUT_VIEWED` | Checkout page viewed |
| **Pix Automatic** | `PIX_AUTOMATIC_AUTHORIZATION_CREATED` | Automatic Pix authorization created |
| | `PIX_AUTOMATIC_AUTHORIZATION_CANCELLED` | Authorization cancelled |
| **API Keys** | `API_KEY_CREATED` | New API key created |
| | `API_KEY_ENABLED` | API key enabled |
| | `API_KEY_DISABLED` | API key disabled |
| | `API_KEY_DELETED` | API key deleted |

For the full and most up-to-date list, see the [Official Asaas Webhook Documentation](https://docs.asaas.com/docs/webhook-para-cobrancas).

## Webhook Payload Structure

Each webhook request contains a JSON payload with the following structure:

```typescript
{
  "event": "PAYMENT_RECEIVED",
  "payment": {
    "id": "pay_abc123",
    "customer": "cus_xyz789",
    "value": 100.00,
    "netValue": 97.50,
    "billingType": "BOLETO",
    "status": "RECEIVED",
    // ... additional payment fields
  }
}
```

The payload structure varies depending on the event type. The root object always contains an `event` field with the event name, plus additional fields specific to the event type (e.g., `payment`, `subscription`, `transfer`, etc.).

## Best Practices

### Security

- **Always verify the auth token** before processing events. Never trust webhook data without authentication.
- Store your webhook auth token securely as an environment variable, never in code.
- Use HTTPS endpoints only for production webhooks.

### Performance

- **Return HTTP 200 quickly** - Asaas expects a fast response. Process events asynchronously if your business logic is time-consuming.
- Consider using a queue (Redis, SQS, etc.) to handle webhook processing:

```typescript
app.post('/webhooks/asaas', async (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  // Queue the event for async processing
  await queue.add('asaas-webhook', req.body)

  // Return immediately
  res.status(200).send('OK')
})
```

### Reliability

- **Implement idempotency** using a unique event identifier to handle duplicate deliveries. Asaas may send the same event multiple times if your endpoint doesn't respond successfully. Use the combination of event type + resource ID + timestamp as a deduplication key — not just the resource ID, since a payment can trigger multiple different events.

```typescript
// Use a persistent store (database, Redis) in production — not an in-memory Set
const processedEvents = new Set<string>()

app.post('/webhooks/asaas', async (req, res) => {
  const event = req.body

  // Build a deduplication key from the event data
  const eventKey = `${event.event}:${event.payment?.id ?? event.transfer?.id}`

  if (processedEvents.has(eventKey)) {
    return res.status(200).send('OK')
  }

  // Process event...
  processedEvents.add(eventKey)

  res.status(200).send('OK')
})
```

- **Monitor webhook queue health** - Asaas may pause your webhook queue after repeated failures. Set up alerts for webhook failures.
- Log all incoming webhooks for debugging and audit purposes.

### Webhook Queue Management

Asaas manages a delivery queue for each webhook endpoint. Key behaviors:

- **Penalty system**: If your endpoint returns non-2xx responses repeatedly, Asaas applies increasing delays between retries.
- **Queue pause**: After sustained failures, Asaas may pause the webhook queue entirely. You'll receive an email notification when this happens.
- **Reactivation**: Paused queues can be reactivated from the Asaas dashboard after fixing the endpoint issue.
- **Delivery order**: Use `SEQUENTIALLY` send type when event order matters (e.g., payment state machine transitions). Use `NON_SEQUENTIALLY` for higher throughput when order doesn't matter.

### Configuration

- Use `SEQUENTIALLY` send type for order-dependent workflows (e.g., payment state transitions), `NON_SEQUENTIALLY` for better throughput when event order doesn't matter.
- Set up email notifications in your webhook configuration to receive alerts about webhook issues.
- Test your webhook endpoint thoroughly before going live. Use the Asaas sandbox environment for testing.

### Error Handling

```typescript
app.post('/webhooks/asaas', async (req, res) => {
  const token = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized')
  }

  try {
    const event = req.body

    // Validate event structure
    if (!event.event || !event.payment) {
      logger.error('Invalid webhook payload', { body: req.body })
      return res.status(400).send('Invalid payload')
    }

    // Process event
    await handleAsaasEvent(event)

    res.status(200).send('OK')
  } catch (error) {
    logger.error('Webhook processing failed', { error, body: req.body })
    // Return 500 so Asaas retries
    res.status(500).send('Internal Server Error')
  }
})
```

## Testing Webhooks Locally

For local development, you can use tools like ngrok or localtunnel to expose your local server to the internet:

```bash
# Using ngrok
ngrok http 3000

# Using localtunnel
npx localtunnel --port 3000
```

Then configure your webhook URL in Asaas to point to the generated public URL (e.g., `https://abc123.ngrok.io/webhooks/asaas`).

Alternatively, use the Asaas sandbox environment to test without exposing your local machine.
