# Sandbox Testing Environment

The Asaas Sandbox is a separate testing environment designed for integration development, testing, and validation before deploying to production. It provides a safe space to experiment with the API without affecting real financial transactions or customer data.

## Overview

The Sandbox environment operates independently from production with its own infrastructure, URLs, and API keys. Changes made in Sandbox are never replicated to production, and vice versa. This isolation ensures that development and testing activities cannot impact live operations.

**Key Characteristics:**

- Separate URL endpoint from production
- Independent API keys with distinct prefixes
- Dedicated test accounts and credentials
- Safe environment for webhook testing
- No financial risk or real transactions

## Configuration

To configure the SDK for Sandbox, specify the `'SANDBOX'` environment during client initialization:

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
  environment: 'SANDBOX',
})
```

### Environment URLs

The SDK automatically routes requests to the appropriate base URL based on the environment configuration:

| Environment | Base URL |
|-------------|----------|
| `SANDBOX` | `https://api-sandbox.asaas.com/v3` |
| `PRODUCTION` | `https://api.asaas.com/v3` |

**Important:** Do not manually construct URLs. Always rely on the SDK's environment configuration to ensure requests are sent to the correct endpoint.

## API Key Format and Authentication

API keys have distinct prefixes that identify which environment they belong to:

| Environment | Key Prefix | Example |
|-------------|------------|---------|
| Sandbox | `$aact_hmlg_` | `$aact_hmlg_abc123...` |
| Production | `$aact_prod_` | `$aact_prod_xyz789...` |

### Authentication Errors

Using an API key from the wrong environment will result in an `HTTP 401 Unauthorized` error. The SDK validates environment configuration, but common mistakes include:

- Using a production key with `environment: 'SANDBOX'`
- Using a sandbox key with `environment: 'PRODUCTION'`
- Forgetting to switch keys when deploying to production

**Best Practice:** Use environment variables to manage API keys and never hardcode them in your application:

```typescript
// .env.development
ASAAS_SANDBOX_TOKEN=$aact_hmlg_your_sandbox_key

// .env.production
ASAAS_PRODUCTION_TOKEN=$aact_prod_your_production_key
```

## Setting Up Sandbox Access

### Creating a Sandbox Account

1. Visit [sandbox.asaas.com](https://sandbox.asaas.com) to create a test account
2. Complete the registration process (no real documents required)
3. Log in to the Sandbox dashboard
4. Navigate to **Settings** → **API Keys** → **Generate New Key**
5. Copy the generated key immediately (it cannot be retrieved later)
6. Store the key securely in your environment configuration

### Generating API Keys

Only administrator users can generate API keys. Keys are generated through the web interface (not via the mobile app) and follow these operational rules:

- Keys are **irrecoverable** after generation
- Each account supports up to **10 active keys**
- Keys can be named and have optional expiration dates
- Keys can be enabled/disabled without deletion
- Deleted keys **cannot be restored**

For detailed setup instructions, refer to the official Asaas documentation: [How to set up your account in the Sandbox](https://docs.asaas.com/docs/how-to-set-up-your-account-in-the-sandbox-1).

## Testability Matrix

Not all features behave identically in Sandbox compared to production. The following matrix outlines what can and cannot be tested:

| Domain | Testable | Limitations / Notes |
|--------|----------|---------------------|
| **Customers** | ✅ Full | Complete CRUD operations, no restrictions |
| **Payments (Boleto)** | ⚠️ Partial | QR Code layout works; discounts, interest, and fine calculation **not available** |
| **Payments (Credit Card)** | ✅ Full | Use test card numbers (see below) |
| **Payments (PIX)** | ✅ Full | Requires Pix key registration first |
| **Subscriptions** | ✅ Full | Generate payment book to trigger new charges |
| **Installments** | ✅ Full | Create, list, retrieve, refund, and cancel operations |
| **Transfers (PIX)** | ✅ Full | Transfers to fictitious BACEN keys complete instantly |
| **Transfers (TED)** | ⚠️ Partial | Success/failure simulated via Asaas dashboard, **not controllable via API** |
| **Subaccounts** | ⚠️ Limited | Max **20 subaccounts per day**; names must use **letters and spaces only** (no numbers or special characters) |
| **Notifications** | ⚠️ Partial | Email and SMS sent for real; **WhatsApp cannot be tested** |
| **Invoices (Notas Fiscais)** | ⚠️ Partial | Limited fiscal authority simulation; full validation requires production |
| **Payment Links** | ✅ Full | Create, update, list, and delete operations |
| **Checkouts** | ✅ Full | Create and manage checkout sessions |
| **Webhooks** | ✅ Full | Configure and receive test webhook events |
| **Chargebacks** | ✅ Full | List and dispute operations available |
| **Refunds** | ✅ Full | Payment and installment refunds |
| **Documents** | ✅ Full | Upload, list, update, and delete payment documents |

### Test Credit Card Numbers

For testing credit card payments in Sandbox, use the following test card numbers:

| Card Brand | Card Number | CVV | Expiration | Expected Result |
|------------|-------------|-----|------------|-----------------|
| Visa | `4000000000000010` | Any 3 digits | Any future date | Success |
| Mastercard | `5500000000000004` | Any 3 digits | Any future date | Success |
| Amex | `340000000000009` | Any 4 digits | Any future date | Success |
| Declined | `4000000000000002` | Any 3 digits | Any future date | Declined (insufficient funds) |

**Note:** Use any valid name for the cardholder and any future expiration date (e.g., `12/2030`).

## Known Sandbox Quirks

While the Sandbox environment strives to mirror production behavior, several important quirks and limitations exist:

### 1. Pix QR Code Requires Registered Key

Attempting to create a Pix QR Code payment returns `HTTP 404` if your Sandbox account has no registered Pix key. You must:

1. Register at least one Pix key in the Sandbox dashboard
2. Wait for key activation (usually instant in Sandbox)
3. Then create Pix payments via the API

### 2. Subaccount Name Restrictions

Subaccount names in Sandbox must contain **only letters and spaces**. The following characters are not allowed:

- Numbers (`0-9`)
- Special characters (`@`, `#`, `$`, etc.)
- Hyphens or underscores

**Example:**

```typescript
// ✅ Valid
await client.accounts.create({
  name: 'Test Account Alpha',
  // ...
})

// ❌ Invalid - Contains numbers
await client.accounts.create({
  name: 'Test Account 123',
  // ...
})
```

### 3. Email and SMS Are Sent For Real

Unlike many sandbox environments, Asaas Sandbox **actually sends email and SMS notifications**. This means:

- Test emails arrive in real inboxes
- SMS messages are delivered to real phone numbers
- You will receive actual notifications for payment events

**Best Practice:** Use dedicated test email addresses and phone numbers. Never use customer or third-party contact information in Sandbox tests.

### 4. WhatsApp Notifications Unavailable

WhatsApp notifications cannot be tested in Sandbox. Attempts to configure or trigger WhatsApp notifications will fail silently or return errors. WhatsApp testing requires production environment access and prior support team alignment.

### 5. White-Label Sandbox Limitations

White-label subaccounts have additional restrictions in Sandbox:

- Require prior support team alignment for enablement
- May have different approval workflows than production
- Visual customization options may be limited

If you plan to use white-label features, contact Asaas support before beginning development.

### 6. TED Transfer Status Control

For TED (bank transfer) operations, Sandbox does not provide API-level control over success or failure outcomes. Instead:

- TED transfers are initiated normally via the API
- The final status (success/failure) is manually controlled via the Asaas Sandbox dashboard
- This simulates the real-world asynchronous nature of bank transfers

**Workflow:**

1. Create a TED transfer via API
2. Log in to Sandbox dashboard
3. Navigate to the transfer management section
4. Manually approve or reject the pending transfer

### 7. Subscription Charge Generation

Subscriptions in Sandbox do not automatically generate charges on their schedule. To test subscription behavior:

1. Create a subscription via API
2. Navigate to the subscription in the Sandbox dashboard
3. Use the **"Generate Payment Book"** action to manually trigger charge creation

This limitation prevents accidental accumulation of test charges during development.

### 8. Boleto Interest and Fine Calculation

While boleto creation works in Sandbox, the following features cannot be fully tested:

- Interest calculation (`interest` field)
- Fine application (`fine` field)
- Discount logic (`discount` field)

These calculations are visible in production but return simplified or placeholder values in Sandbox. Final validation of these features requires production testing.

### 9. Daily Subaccount Creation Limit

Sandbox enforces a limit of **20 new subaccounts per day**. This prevents abuse but can be restrictive for extensive integration testing. Plan your test scenarios accordingly and clean up unused test subaccounts regularly.

## Best Practices

### Separate API Keys

Always maintain separate API keys for Sandbox and production environments:

```typescript
// Configuration factory pattern
function createAsaasClient(env: 'sandbox' | 'production') {
  const config = {
    sandbox: {
      accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
      environment: 'SANDBOX' as const,
    },
    production: {
      accessToken: process.env.ASAAS_PRODUCTION_TOKEN!,
      environment: 'PRODUCTION' as const,
    },
  }

  return new AsaasClient(config[env])
}

// Usage
const sandboxClient = createAsaasClient('sandbox')
const productionClient = createAsaasClient('production')
```

### Never Use Real Customer Data

Sandbox is a testing environment that does not provide the same data protection guarantees as production. **Never** use:

- Real customer CPF/CNPJ documents
- Real customer email addresses (except dedicated test addresses)
- Real customer phone numbers
- Production database records

Instead, create fictional but realistic test data:

```typescript
const testCustomer = {
  name: 'João Silva Teste',
  cpfCnpj: '12345678901', // Fictional CPF
  email: 'joao.teste@example.com', // Test domain
  mobilePhone: '5511999999999', // Fictional number
}
```

### Test Webhooks Before Production

Webhooks are fully functional in Sandbox. Use this to your advantage:

1. Configure webhook endpoints in Sandbox
2. Verify your server receives and processes events correctly
3. Test error scenarios (timeouts, retries, signature validation)
4. Monitor webhook delivery logs in the Sandbox dashboard
5. Only deploy to production after comprehensive webhook testing

**Example webhook configuration:**

```typescript
await sandboxClient.accounts.create({
  name: 'Test Subaccount',
  email: 'test@example.com',
  cpfCnpj: '12345678901',
  // ... other required fields
  webhooks: [
    {
      url: 'https://your-test-server.com/webhooks/asaas',
      email: 'alerts@example.com',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
      authToken: 'your-webhook-secret',
      events: [
        'PAYMENT_CREATED',
        'PAYMENT_RECEIVED',
        'PAYMENT_CONFIRMED',
      ],
    },
  ],
})
```

### Be Aware of Real Notifications

Since email and SMS are sent for real in Sandbox:

- Use dedicated test email addresses for all test customers
- Configure email filters to organize Sandbox notifications
- Use test phone numbers that you control (or disable SMS notifications)
- Disable customer notifications when appropriate:

```typescript
await sandboxClient.customers.create({
  name: 'Test Customer',
  cpfCnpj: '12345678901',
  email: 'test@example.com',
  notificationDisabled: true, // Disable automatic notifications
})
```

### Test Rate Limits and Error Handling

Sandbox follows the same rate limiting rules as production:

- **50 concurrent GET requests** maximum
- **25,000 requests per 12-hour window**
- `HTTP 429` responses when limits exceeded

Use Sandbox to test your application's rate limiting and retry logic:

```typescript
import { AsaasApiError } from 'asaas-sdk'

try {
  const payment = await sandboxClient.payments.create(paymentData)
} catch (error) {
  if (error instanceof AsaasApiError && error.isRateLimit) {
    // Handle rate limit error
    console.log('Rate limited. Implement exponential backoff.')
  }
}
```

### Validate Integration Before Production

Use Sandbox as the final validation step before production deployment:

1. **Complete Integration Test Suite:** Run all integration tests against Sandbox
2. **End-to-End User Flows:** Test complete user journeys (signup → payment → fulfillment)
3. **Error Scenarios:** Verify handling of failed payments, declined cards, and timeouts
4. **Webhook Processing:** Confirm all webhook events are processed correctly
5. **Security Validation:** Test IP whitelist restrictions and webhook signature validation
6. **Performance Testing:** Verify your application handles API latency gracefully

Only deploy to production after all Sandbox validation passes successfully.

### Clean Up Test Data Regularly

Sandbox accounts can accumulate test data over time. Regularly clean up:

- Test customers and subscriptions
- Canceled or expired payments
- Inactive subaccounts (mindful of the 20/day creation limit)
- Old API keys

This keeps your Sandbox environment organized and prevents confusion during development.

## Transitioning to Production

When you're ready to move from Sandbox to production:

### 1. Update Environment Configuration

```typescript
// Before (Sandbox)
const client = new AsaasClient({
  accessToken: process.env.ASAAS_SANDBOX_TOKEN!,
  environment: 'SANDBOX',
})

// After (Production)
const client = new AsaasClient({
  accessToken: process.env.ASAAS_PRODUCTION_TOKEN!,
  environment: 'PRODUCTION',
})
```

### 2. Generate Production API Keys

1. Log in to your production Asaas account at [app.asaas.com](https://app.asaas.com)
2. Navigate to **Settings** → **API Keys** → **Generate New Key**
3. Store the production key securely (use a secrets management service)
4. Update your production environment variables

### 3. Configure IP Whitelist (Recommended)

For additional security, configure an IP whitelist for your production API keys:

1. Navigate to **Settings** → **API Keys** → **IP Whitelist**
2. Add your production server IP addresses
3. Save the configuration
4. Verify API requests succeed from whitelisted IPs

Requests from non-whitelisted IPs will receive `HTTP 403 Forbidden`.

### 4. Update Webhook URLs

Ensure webhook URLs point to your production endpoints:

```typescript
// Sandbox webhook
url: 'https://staging.yourapp.com/webhooks/asaas'

// Production webhook
url: 'https://api.yourapp.com/webhooks/asaas'
```

### 5. Enable Transfer Validation Webhook (Optional)

For enhanced security on withdrawals and transfers, configure the transfer validation webhook:

1. Navigate to **Settings** → **Transfers** → **Validation Webhook**
2. Enter your production webhook URL
3. Provide an access token for Asaas to include in requests
4. Test the webhook with a small transfer

This webhook allows you to programmatically approve or reject transfers in real-time.

### 6. Verify Production Features

Some features may require manual enablement in production:

- **Credit card tokenization:** May need activation by Asaas support
- **White-label subaccounts:** Requires contract alignment
- **Higher transaction limits:** May need account verification
- **Custom branding:** Requires configuration in production dashboard

Contact Asaas support to confirm all required features are enabled before going live.

### 7. Monitor Initial Production Transactions

After deployment:

1. Monitor the first few production transactions closely
2. Verify webhook delivery and processing
3. Check for unexpected `401`, `403`, or `429` errors
4. Confirm payment confirmations and refunds work as expected
5. Review Asaas dashboard for any alerts or warnings

## Additional Resources

- [Official Asaas Sandbox Documentation](https://docs.asaas.com/docs/sandbox)
- [Authentication Guide](https://docs.asaas.com/docs/authentication-2)
- [API Key Management](https://docs.asaas.com/docs/chaves-de-api)
- [What Can Be Tested in Sandbox](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [API Rate Limits](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api)
- [Additional Security Mechanisms](https://docs.asaas.com/docs/additional-security-mechanisms)

## Support

If you encounter issues specific to Sandbox that are not documented here:

1. Check the official Asaas documentation for updates
2. Review the SDK repository issues for known problems
3. Contact Asaas support for environment-specific questions
4. Report SDK bugs to the GitHub repository

---

**Remember:** Sandbox is a powerful tool for development and testing, but it's not a perfect replica of production. Always perform final validation in production with small, monitored transactions before scaling up.
