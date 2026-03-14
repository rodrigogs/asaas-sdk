# asaas-sdk

A TypeScript SDK for the Asaas payment platform API, the leading Brazilian fintech solution for payment processing, subscriptions, and financial services.

[Versão em Português](./README.pt.md)

## Features

- **Zero runtime dependencies** - Minimal footprint using Node.js native APIs
- **TypeScript-first** - Full type safety with comprehensive type definitions
- **ESM-only** - Modern module system for optimal tree-shaking
- **Auto-pagination** - Seamless iteration over paginated results with `AsyncIterable`
- **Error handling** - Structured error types with retry detection
- **Lazy-loaded services** - Efficient resource initialization
- **Configurable environments** - Easy switching between SANDBOX and PRODUCTION
- **Native fetch** - No external HTTP client dependencies

## Installation

```bash
npm install asaas-sdk
```

**Requirements:** Node.js >= 18

## Quick Start

```typescript
import { AsaasClient } from 'asaas-sdk'

// Create client (defaults to PRODUCTION)
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX', // Optional: SANDBOX or PRODUCTION
})

// Create a customer
const customer = await asaas.customers.create({
  name: 'João Silva',
  cpfCnpj: '12345678901',
  email: 'joao.silva@example.com',
  phone: '11987654321',
})

// Create a payment
const payment = await asaas.payments.create({
  customer: customer.id,
  billingType: 'PIX',
  value: 150.0,
  dueDate: '2026-03-20',
  description: 'Serviço de consultoria',
})

console.log('Payment created:', payment.id)
console.log('Pix QR Code:', payment.pixQrCodeId)
```

## Configuration

```typescript
const asaas = new AsaasClient({
  accessToken: 'your_api_key', // Required
  environment: 'PRODUCTION', // Optional: SANDBOX | PRODUCTION (default: PRODUCTION)
  timeout: 30000, // Optional: Request timeout in ms (default: 30000)
  baseUrl: 'https://custom.api.url', // Optional: Override base URL
  userAgent: 'MyApp/1.0.0', // Optional: Custom user agent
  fetch: customFetch, // Optional: Custom fetch implementation
})
```

### Environment URLs

- **SANDBOX**: `https://api-sandbox.asaas.com/v3`
- **PRODUCTION**: `https://api.asaas.com/v3`

## Services Overview

| Service | Description | Example |
|---------|-------------|---------|
| `customers` | Customer management | `asaas.customers.create(...)` |
| `payments` | Payment operations | `asaas.payments.create(...)` |
| `cards` | Credit card tokenization & processing | `asaas.cards.tokenize(...)` |
| `installments` | Installment plans | `asaas.installments.create(...)` |
| `chargebacks` | Chargeback management | `asaas.chargebacks.list()` |
| `paymentDocuments` | Document upload & management | `asaas.paymentDocuments.upload(...)` |
| `pix` | Pix operations (keys, QR codes, transactions) | `asaas.pix.keys.create(...)` |
| `subscriptions` | Recurring subscriptions | `asaas.subscriptions.create(...)` |
| `transfers` | Bank & account transfers | `asaas.transfers.toBank(...)` |
| `subaccounts` | Subaccount management | `asaas.subaccounts.create(...)` |
| `myAccount` | Current account settings | `asaas.myAccount.getCommercialInfo()` |
| `notifications` | Customer notifications | `asaas.notifications.update(...)` |
| `paymentLinks` | Payment link generation | `asaas.paymentLinks.create(...)` |
| `checkouts` | Checkout creation | `asaas.checkouts.create(...)` |
| `checkoutConfig` | Checkout personalization | `asaas.checkoutConfig.update(...)` |
| `splits` | Split payment queries | `asaas.splits.listPaidSplits()` |
| `anticipations` | Payment anticipation | `asaas.anticipations.simulate(...)` |
| `anticipationConfig` | Automatic anticipation settings | `asaas.anticipationConfig.get()` |
| `bill` | Bill payments | `asaas.bill.create(...)` |
| `escrow` | Escrow account configuration | `asaas.escrow.getConfig()` |
| `fiscalInfo` | Fiscal information & invoices | `asaas.fiscalInfo.getInfo()` |
| `invoices` | Invoice scheduling & issuing | `asaas.invoices.schedule(...)` |

## Error Handling

All errors extend `AsaasError` with specific error types for different scenarios:

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from 'asaas-sdk'

try {
  const payment = await asaas.payments.create({
    customer: 'cus_123',
    billingType: 'BOLETO',
    value: 250.0,
    dueDate: '2026-03-25',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error('API Error:', error.status, error.message)
    console.error('Issues:', error.issues)

    if (error.isAuth) {
      console.error('Authentication failed')
    } else if (error.isRateLimit) {
      console.error('Rate limit exceeded')
    } else if (error.isRetryable) {
      console.error('Retryable error, try again')
    }
  } else if (error instanceof AsaasTimeoutError) {
    console.error('Request timeout:', error.timeoutMs)
  } else if (error instanceof AsaasConnectionError) {
    console.error('Network connection error')
  }
}
```

## Pagination

All `.list()` methods return paginated results with auto-pagination support:

```typescript
// Auto-pagination with for-await-of
const payments = await asaas.payments.list({ limit: 100 })
for await (const payment of payments) {
  console.log('Payment:', payment.id, payment.value)
}

// Convert to array (use carefully with large datasets)
const result = await asaas.payments.list({ limit: 100 })
const allPayments = await result.toArray()

// Limit auto-pagination
const first500 = await result.toArray({ limit: 500 })

// Manual pagination
const page1 = await asaas.payments.list({ limit: 10, offset: 0 })
console.log('Total:', page1.totalCount)
console.log('Has more:', page1.hasMore)
console.log('Data:', page1.data)
```

## Webhook Verification

Verify webhook authenticity using the access token header:

```typescript
import { ASAAS_WEBHOOK_AUTH_HEADER } from 'asaas-sdk'

// Express example
app.post('/webhooks/asaas', (req, res) => {
  const webhookToken = req.headers[ASAAS_WEBHOOK_AUTH_HEADER]

  if (webhookToken !== process.env.ASAAS_ACCESS_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const event = req.body
  console.log('Webhook event:', event.event, event.payment?.id)

  res.status(200).json({ received: true })
})
```

## Documentation

### Guides
- [Getting Started](./docs/en/getting-started.md)
- [Error Handling](./docs/en/error-handling.md)
- [Pagination](./docs/en/pagination.md)
- [Webhooks](./docs/en/webhooks.md)
- [Rate Limits](./docs/en/rate-limits.md)
- [Sandbox](./docs/en/sandbox.md)
- [Security](./docs/en/security.md)

### Services
- [Payments, Cards, Installments & Chargebacks](./docs/en/services/payments.md)
- [Pix](./docs/en/services/pix.md)
- [Subscriptions](./docs/en/services/subscriptions.md)
- [Transfers, Bills, Escrow, Splits & Anticipations](./docs/en/services/financial.md)
- [Customers, Subaccounts & Notifications](./docs/en/services/accounts.md)
- [Payment Links, Checkouts & Invoices](./docs/en/services/commerce.md)

- [Official Asaas API Docs](https://docs.asaas.com/)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

MIT
