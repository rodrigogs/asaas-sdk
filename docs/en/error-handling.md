# Error Handling

The `@rodrigogs/asaas-sdk` package provides a structured error hierarchy to help you handle different failure scenarios when interacting with the Asaas API.

## Error Hierarchy

```
AsaasError (base)
├── AsaasApiError      (HTTP errors from the API)
├── AsaasTimeoutError  (request timeout)
└── AsaasConnectionError (network failures)
```

All errors extend the native `Error` class and are exported from the main package:

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from '@rodrigogs/asaas-sdk'
```

## AsaasApiError

The most common error type. Thrown when the Asaas API returns an HTTP error response (4xx or 5xx status codes).

### Properties

- `status` (number) - HTTP status code
- `body` (unknown) - Raw response body from the API
- `issues` (AsaasErrorIssue[]) - Array of error details from the API
  - Each issue has optional `code` and `description` fields
- `message` (string) - Joined descriptions from issues, or "HTTP {status}" as fallback

### Convenience Getters

- `isAuth` - Returns `true` when status is 401 or 403
- `isRateLimit` - Returns `true` when status is 429
- `isServer` - Returns `true` when status >= 500
- `isRetryable` - Returns `true` when `isRateLimit` or `isServer`

### Examples

#### Basic Try/Catch

```typescript
import { AsaasClient, AsaasApiError } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({ accessToken: process.env.ASAAS_ACCESS_TOKEN! })

try {
  const customer = await client.customers.create({
    name: 'João Silva',
    cpfCnpj: '12345678901',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error(`API Error (${error.status}):`, error.message)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

#### Checking Error Type

```typescript
try {
  const payment = await client.payments.create({
    customer: 'cus_000000000000',
    billingType: 'BOLETO',
    value: 100.00,
    dueDate: '2026-03-20',
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    if (error.isAuth) {
      console.error('Authentication failed. Check your API key.')
    } else if (error.isRateLimit) {
      console.error('Rate limit exceeded. Please retry after a delay.')
    } else if (error.isServer) {
      console.error('Asaas server error. Please retry later.')
    } else {
      console.error('Client error:', error.message)
    }
  }
}
```

#### Using Convenience Getters for Retry Logic

```typescript
async function createPaymentWithRetry(paymentData: any, maxRetries = 3) {
  let attempt = 0

  while (attempt < maxRetries) {
    try {
      return await client.payments.create(paymentData)
    } catch (error) {
      if (error instanceof AsaasApiError && error.isRetryable) {
        attempt++
        if (attempt >= maxRetries) {
          throw error
        }

        const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
        console.log(`Retrying in ${delay}ms (attempt ${attempt}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      } else {
        throw error // Not retryable, fail immediately
      }
    }
  }
}
```

#### Accessing Individual Issues for Validation Errors

When creating or updating resources, the API may return multiple validation errors in the `issues` array:

```typescript
try {
  const customer = await client.customers.create({
    name: 'João Silva',
    cpfCnpj: '111.111.111-11', // Invalid CPF
    email: 'invalid-email', // Invalid email format
  })
} catch (error) {
  if (error instanceof AsaasApiError) {
    console.error(`Validation failed (${error.status}):`)

    error.issues.forEach((issue, index) => {
      console.error(`  ${index + 1}. [${issue.code || 'N/A'}] ${issue.description}`)
    })

    // Example output:
    // Validation failed (400):
    //   1. [invalid_cpf_cnpj] CPF/CNPJ inválido
    //   2. [invalid_email] Email inválido
  }
}
```

## AsaasTimeoutError

Thrown when a request exceeds the configured timeout. The default timeout is 30 seconds, but Asaas recommends 60 seconds for credit card operations.

### Properties

- `timeoutMs` (number) - The timeout value that was exceeded

### Example

```typescript
import { AsaasClient, AsaasTimeoutError } from '@rodrigogs/asaas-sdk'

// Configure a longer timeout for credit card operations
const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  timeout: 60000, // 60 seconds
})

try {
  const payment = await client.payments.create({
    customer: 'cus_000000000000',
    billingType: 'CREDIT_CARD',
    value: 100.00,
    creditCard: {
      holderName: 'João Silva',
      number: '5162306219378829',
      expiryMonth: '12',
      expiryYear: '2028',
      ccv: '123',
    },
    creditCardHolderInfo: {
      name: 'João Silva',
      cpfCnpj: '12345678901',
      postalCode: '01310-100',
      addressNumber: '123',
      phone: '11999999999',
    },
  })
} catch (error) {
  if (error instanceof AsaasTimeoutError) {
    console.error(`Request timed out after ${error.timeoutMs}ms`)
    console.error('Consider increasing the timeout for credit card operations')
  }
}
```

## AsaasConnectionError

Thrown when the request fails due to network issues such as DNS resolution failures, connection refused, or other transport-level errors. The original error is available via the standard `cause` property.

### Example

```typescript
import { AsaasClient, AsaasConnectionError } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({ accessToken: process.env.ASAAS_ACCESS_TOKEN! })

try {
  const customers = await client.customers.list()
} catch (error) {
  if (error instanceof AsaasConnectionError) {
    console.error('Network connection failed:', error.message)

    // Access the underlying error for more details
    if (error.cause) {
      console.error('Underlying cause:', error.cause)
    }

    // This might indicate:
    // - No internet connection
    // - DNS resolution failure
    // - Firewall blocking the request
    // - Asaas API is unreachable
  }
}
```

## Rate Limit Errors

When you exceed Asaas rate limits, the API returns HTTP 429. The SDK exposes this via the `isRateLimit` getter:

```typescript
try {
  const payment = await client.payments.create({ /* ... */ })
} catch (error) {
  if (error instanceof AsaasApiError && error.isRateLimit) {
    console.error('Rate limit exceeded, retry after a delay')
  }
}
```

Some endpoints include rate limit headers in the response. When available, use them to implement proactive throttling:

- `RateLimit-Limit` — Maximum requests allowed in the window
- `RateLimit-Remaining` — Requests remaining before limit
- `RateLimit-Reset` — Seconds until the window resets

For a complete retry helper with exponential backoff, see the [Rate Limits](./rate-limits.md) guide.

## Distinguishing 403 Errors

A 403 status can mean two different things:

1. **IP Whitelist block** — Your request came from an IP not in the allowed list. Configure your IP whitelist in the Asaas dashboard.
2. **Permission denied** — Your API key lacks the required permission for the endpoint.

Both return 403, but the `issues` array may contain different error descriptions. Check the error details to distinguish:

```typescript
if (error instanceof AsaasApiError && error.status === 403) {
  const message = error.issues[0]?.description ?? error.message
  console.error('Access denied:', message)
  // Check if it's an IP whitelist issue or a permission issue
}
```

See the [Security](./security.md) guide for details on IP whitelisting.

## Retry Pattern

The SDK does not include built-in retry logic. For a complete `withRetry` helper with exponential backoff, see the [Rate Limits](./rate-limits.md#retry-pattern) guide.

## Error Handling Best Practices

1. **Always handle AsaasApiError at minimum** - This is the most common error type and contains detailed information about what went wrong.

2. **Check the `issues` array for detailed validation errors** - When creating or updating resources, the API may return multiple validation issues. Inspect them individually for better error messages.

3. **Use `isRetryable` for automatic retry decisions** - The convenience getter helps you quickly determine if an error is transient and worth retrying.

4. **Set appropriate timeouts for credit card operations** - Asaas recommends 60 seconds for credit card transactions, as they may involve 3DS authentication flows.

5. **Log the full `body` for debugging API errors** - The raw response body may contain additional context not available in the structured `issues` array.

6. **Handle authentication errors gracefully** - Use `error.isAuth` to detect invalid API keys and provide clear instructions to users.

7. **Respect rate limits** - When encountering 429 errors, implement exponential backoff and consider caching responses where appropriate.

8. **Monitor server errors** - If you encounter frequent 500+ errors, check the [Asaas status page](https://status.asaas.com) or contact support.

### Example: Comprehensive Error Handler

```typescript
import { AsaasApiError, AsaasTimeoutError, AsaasConnectionError } from '@rodrigogs/asaas-sdk'

async function handleAsaasOperation<T>(
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (error instanceof AsaasApiError) {
      // Log full error details for debugging
      console.error('Asaas API Error:', {
        status: error.status,
        message: error.message,
        issues: error.issues,
        body: error.body,
      })

      // Handle specific cases
      if (error.isAuth) {
        throw new Error('Invalid API key. Please check your credentials.')
      }

      if (error.isRateLimit) {
        throw new Error('Rate limit exceeded. Please try again later.')
      }

      if (error.isServer) {
        throw new Error('Asaas service temporarily unavailable. Please retry.')
      }

      // Client errors (4xx) - show detailed validation messages
      if (error.issues.length > 0) {
        const messages = error.issues
          .map(issue => issue.description)
          .join('; ')
        throw new Error(`Validation failed: ${messages}`)
      }

      throw new Error(`API error: ${error.message}`)
    } else if (error instanceof AsaasTimeoutError) {
      console.error(`Request timed out after ${error.timeoutMs}ms`)
      throw new Error('Request took too long. Please try again.')
    } else if (error instanceof AsaasConnectionError) {
      console.error('Connection error:', error.message, error.cause)
      throw new Error('Network connection failed. Please check your internet.')
    } else {
      // Unexpected error
      console.error('Unexpected error:', error)
      throw error
    }
  }
}

// Usage
const customer = await handleAsaasOperation(() =>
  client.customers.create({
    name: 'João Silva',
    cpfCnpj: '12345678901',
  })
)
```
