# Getting Started

This guide will help you get up and running with the asaas-sdk, a TypeScript SDK for the Asaas payment platform API.

## Prerequisites

Before you begin, ensure you have:

- **Node.js >= 18** - Required for native fetch, AbortSignal.timeout, FormData, and Blob support
- **An Asaas account** - Sign up at [asaas.com](https://www.asaas.com) for sandbox or production access
- **An API key** - Generate an API key from your Asaas dashboard (Settings > Integrations > API Key)

## Installation

Install the SDK via npm:

```bash
npm install asaas-sdk
```

Or using yarn:

```bash
yarn add asaas-sdk
```

Or using pnpm:

```bash
pnpm add asaas-sdk
```

## Creating a Client

Import and instantiate the `AsaasClient` with your API key:

```typescript
import { AsaasClient } from 'asaas-sdk'

const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX', // or 'PRODUCTION' (default)
})
```

Always store your API key securely in environment variables. Never commit API keys to version control.

## Configuration Options

The `AsaasClient` constructor accepts the following configuration options:

| Option        | Type                            | Required | Default        | Description                                      |
|---------------|---------------------------------|----------|----------------|--------------------------------------------------|
| `accessToken` | `string`                        | Yes      | -              | Your Asaas API key                               |
| `environment` | `'SANDBOX' \| 'PRODUCTION'`     | No       | `'PRODUCTION'` | API environment to use                           |
| `baseUrl`     | `string`                        | No       | Auto-detected  | Override the base URL entirely                   |
| `timeout`     | `number`                        | No       | `30000`        | Request timeout in milliseconds                  |
| `fetch`       | `typeof globalThis.fetch`       | No       | `globalThis.fetch` | Custom fetch implementation                   |
| `userAgent`   | `string`                        | No       | -              | Custom User-Agent header suffix                  |

### Example with Custom Configuration

```typescript
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX',
  timeout: 60000, // 60 seconds
  userAgent: 'my-app/1.0.0',
})
```

## Your First Request

Let's create a customer and then generate a payment for them.

### Step 1: Create a Customer

```typescript
// Create a customer
const customer = await asaas.customers.create({
  name: 'João Silva',
  email: 'joao.silva@example.com',
  phone: '11987654321',
  mobilePhone: '11987654321',
  cpfCnpj: '12345678901', // CPF (11 digits) or CNPJ (14 digits)
  postalCode: '01310-100',
  address: 'Av. Paulista',
  addressNumber: '1578',
  complement: 'Apto 123',
  province: 'Bela Vista',
  notificationDisabled: false,
})

console.log('Customer created:', customer.id)
```

### Step 2: Create a Payment

```typescript
// Create a payment for the customer
const payment = await asaas.payments.create({
  customer: customer.id,
  billingType: 'BOLETO', // Options: BOLETO, CREDIT_CARD, PIX, UNDEFINED
  value: 150.00, // R$ 150.00
  dueDate: '2026-03-20', // Format: YYYY-MM-DD
  description: 'Pagamento de serviços de consultoria',
  externalReference: 'ORDER-12345',
})

console.log('Payment created:', payment.id)
console.log('Invoice URL:', payment.invoiceUrl)
console.log('Bankslip URL:', payment.bankSlipUrl)
```

### Complete Example

```typescript
import { AsaasClient } from 'asaas-sdk'

async function main() {
  const asaas = new AsaasClient({
    accessToken: process.env.ASAAS_API_KEY!,
    environment: 'SANDBOX',
  })

  try {
    // Create customer
    const customer = await asaas.customers.create({
      name: 'Maria Oliveira',
      email: 'maria.oliveira@example.com',
      cpfCnpj: '98765432100',
      mobilePhone: '21987654321',
    })

    // Create payment
    const payment = await asaas.payments.create({
      customer: customer.id,
      billingType: 'PIX',
      value: 250.00,
      dueDate: '2026-03-15',
      description: 'Mensalidade - Março 2026',
    })

    console.log('Payment created successfully!')
    console.log('Payment ID:', payment.id)
    console.log('Status:', payment.status)
  } catch (error) {
    console.error('Error:', error)
  }
}

main()
```

## Environments

The SDK supports two environments:

### Sandbox Environment

- **URL**: `https://api-sandbox.asaas.com/v3`
- **Purpose**: Development and testing
- **Recommended for**: Building and testing your integration without affecting real transactions
- **Configuration**:

```typescript
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_API_KEY!,
  environment: 'SANDBOX',
})
```

### Production Environment

- **URL**: `https://api.asaas.com/v3`
- **Purpose**: Live transactions with real money
- **Configuration**:

```typescript
const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_PRODUCTION_API_KEY!,
  environment: 'PRODUCTION', // or omit this line (default)
})
```

### Best Practices

1. **Always start with SANDBOX** for development and testing
2. Use **separate API keys** for sandbox and production
3. Test thoroughly in sandbox before moving to production
4. Be aware that some features have **sandbox limitations** (refer to the [Asaas documentation](https://docs.asaas.com) for specifics)

## Using a Custom Fetch

You can provide a custom `fetch` implementation for testing, logging, or using alternative HTTP clients like `undici`.

### Example with Undici

```typescript
import { fetch } from 'undici'
import { AsaasClient } from 'asaas-sdk'

const asaas = new AsaasClient({
  accessToken: process.env.ASAAS_API_KEY!,
  environment: 'SANDBOX',
  fetch: fetch as typeof globalThis.fetch,
})
```

### Example with Mock for Testing

```typescript
import { AsaasClient } from 'asaas-sdk'

const mockFetch = jest.fn(async (url, options) => {
  return new Response(JSON.stringify({ id: 'mock-id' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

const asaas = new AsaasClient({
  accessToken: 'test-key',
  environment: 'SANDBOX',
  fetch: mockFetch,
})

// Now all requests will use your mock
const customer = await asaas.customers.create({ name: 'Test' })
```

## Available Services

The SDK provides access to all Asaas API endpoints through dedicated service modules:

- **`customers`** - Customer management (CRUD operations, list, restore)
- **`payments`** - Payment creation, updates, retrieval, and installment management
- **`cards`** - Tokenize and manage credit cards
- **`installments`** - Installment operations (book, refund, retrieve)
- **`chargebacks`** - Chargeback management and disputes
- **`paymentDocuments`** - Upload and manage payment documents
- **`pix`** - PIX payment operations with sub-services:
  - `pix.keys` - Manage PIX keys
  - `pix.staticQrCodes` - Generate static QR codes
  - `pix.qrCodes` - Generate dynamic QR codes
  - `pix.transactions` - PIX transaction operations
  - `pix.automatic` - Automatic PIX configurations
  - `pix.recurring` - Recurring PIX payments
- **`subscriptions`** - Recurring subscription management
- **`transfers`** - Bank transfers and TED operations
- **`subaccounts`** - Subaccount (white-label) management
- **`myAccount`** - Account information and settings
- **`notifications`** - Webhook and notification management
- **`paymentLinks`** - Payment link creation and management
- **`checkouts`** - Checkout session management
- **`checkoutConfig`** - Checkout configuration
- **`splits`** - Payment split operations
- **`anticipations`** - Receivables anticipation
- **`anticipationConfig`** - Anticipation configuration
- **`bill`** - Bill payment operations
- **`escrow`** - Escrow account management
- **`fiscalInfo`** - Fiscal information and tax documents
- **`invoices`** - Invoice (Nota Fiscal) operations

### Example Usage

```typescript
// Customer operations
const customers = await asaas.customers.list({ limit: 10 })

// PIX QR Code generation
const qrCode = await asaas.pix.qrCodes.create({
  value: 100.00,
  description: 'Payment description',
})

// Subscription creation
const subscription = await asaas.subscriptions.create({
  customer: 'cus_000000000000',
  billingType: 'CREDIT_CARD',
  value: 99.90,
  nextDueDate: '2026-04-01',
  cycle: 'MONTHLY',
})
```

## What's Next

Now that you have the SDK set up, explore these guides to learn more:

- [Error Handling](./error-handling.md) - Learn how to handle API errors and exceptions
- [Pagination](./pagination.md) - Work with paginated list endpoints
- [Webhooks](./webhooks.md) - Set up webhook listeners for real-time events

For comprehensive API documentation, visit the [Asaas API Documentation](https://docs.asaas.com).
