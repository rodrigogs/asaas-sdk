# Rate Limits

This guide covers the Asaas API rate limiting mechanisms and strategies for handling them in your integration.

## Overview

The Asaas API enforces three types of rate limits to ensure platform stability:

1. **Concurrent Requests** - Maximum simultaneous GET requests
2. **Rolling Quota** - Total requests per account over a 12-hour window
3. **Per-Endpoint Limits** - Specific limits on individual endpoints

Exceeding any of these limits results in an `HTTP 429 Too Many Requests` response. Understanding how these limits work and implementing appropriate retry strategies is critical for building resilient integrations.

## Concurrent Requests

The Asaas API allows up to **50 concurrent GET requests** per account.

When this limit is exceeded, the API returns:

```
HTTP 429 Too Many Requests
```

**Key Points:**

- This limit applies only to `GET` requests
- Concurrent means requests that are being processed simultaneously
- The limit is per account, not per API key
- Non-GET requests (POST, PUT, DELETE) have separate concurrency handling

**Example Scenario:**

If your application makes 60 simultaneous `GET` requests to fetch customer data, 10 of those requests will receive a 429 error until some of the initial 50 complete.

**Best Practice:**

Control concurrency in your application using connection pools or semaphores:

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

// Control concurrency with Promise.all and chunking
async function fetchCustomersInBatches(customerIds: string[]) {
  const BATCH_SIZE = 40 // Stay under 50 concurrent limit
  const batches = []

  for (let i = 0; i < customerIds.length; i += BATCH_SIZE) {
    const batch = customerIds.slice(i, i + BATCH_SIZE)
    batches.push(batch)
  }

  const results = []
  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map(id => client.customers.getById(id))
    )
    results.push(...batchResults)
  }

  return results
}
```

## Rolling Quota

Each account has a rolling quota of approximately **25,000 requests per 12-hour window**.

**How the Rolling Window Works:**

- The counter starts on the first request made within a new window
- The window continues for the next 12 hours from that first request
- After 12 hours, a new window begins with the next request
- All HTTP methods (GET, POST, PUT, DELETE) count toward this quota

**When Quota is Exceeded:**

```
HTTP 429 Too Many Requests
```

**Important Limitations:**

- Accounts with polling-heavy usage patterns do **not** receive quota adjustments
- The Asaas team does not increase quotas for applications that rely on frequent polling
- This is an intentional design to encourage webhook-based integrations

**Example Calculation:**

```
First request:    2026-03-13 08:00:00 UTC
Window ends:      2026-03-13 20:00:00 UTC (12 hours later)
Requests made:    24,500 (safe)
Requests made:    25,001 (will trigger 429)
```

**Monitoring Your Usage:**

The SDK does not automatically track quota consumption. To monitor your usage:

1. Track request counts in your application layer
2. Implement request rate monitoring and alerting
3. Review API usage patterns during high-traffic periods

**Best Practice:**

Design your integration to minimize request volume:

```typescript
// Bad: Polling for payment status every 30 seconds
setInterval(async () => {
  const payment = await client.payments.getById(paymentId)
  if (payment.status === 'CONFIRMED') {
    processPayment(payment)
  }
}, 30000) // 2,880 requests per day per payment

// Good: Use webhooks to receive payment status updates
// Configure webhook URL in Asaas dashboard
// Receive webhook notification when payment.status changes
// Result: ~1-3 requests per payment lifecycle
```

## Per-Endpoint Limits

Some endpoints have their own specific rate limits in addition to the account-wide limits. These limits are exposed via HTTP response headers.

**Rate Limit Headers:**

- `RateLimit-Limit` - Maximum requests allowed in the current window
- `RateLimit-Remaining` - Number of requests remaining in the current window
- `RateLimit-Reset` - Seconds until the rate limit window resets

**Example Response:**

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 3600
```

**Interpretation:**

- This endpoint allows 100 requests per window
- You have 45 requests remaining
- The limit resets in 3,600 seconds (1 hour)

**When Limit is Reached:**

When `RateLimit-Remaining` reaches `0`, subsequent requests return:

```
HTTP 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 2847
```

**Accessing Headers in the SDK:**

The SDK currently exposes raw response data. You can access headers through the underlying HTTP response:

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

// Note: Actual header access depends on SDK implementation
// Check SDK documentation for current API
```

**Best Practice:**

Proactively monitor these headers and implement adaptive throttling:

```typescript
interface RateLimitInfo {
  limit: number
  remaining: number
  resetSeconds: number
}

function parseRateLimitHeaders(headers: Headers): RateLimitInfo | null {
  const limit = headers.get('RateLimit-Limit')
  const remaining = headers.get('RateLimit-Remaining')
  const reset = headers.get('RateLimit-Reset')

  if (!limit || !remaining || !reset) {
    return null
  }

  return {
    limit: parseInt(limit, 10),
    remaining: parseInt(remaining, 10),
    resetSeconds: parseInt(reset, 10),
  }
}

async function makeThrottledRequest<T>(
  requestFn: () => Promise<T>
): Promise<T> {
  const result = await requestFn()

  // Access headers from response (implementation-specific)
  // const rateLimitInfo = parseRateLimitHeaders(response.headers)

  // if (rateLimitInfo && rateLimitInfo.remaining < 10) {
  //   console.warn(
  //     `Approaching rate limit: ${rateLimitInfo.remaining} requests remaining`
  //   )
  // }

  return result
}
```

## Detecting Rate Limits in the SDK

The SDK provides an `AsaasApiError` class that includes a convenience property for detecting rate limit errors:

```typescript
import { AsaasClient, AsaasApiError } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

async function fetchPaymentWithRetry(paymentId: string) {
  try {
    return await client.payments.getById(paymentId)
  } catch (error) {
    if (error instanceof AsaasApiError && error.isRateLimit) {
      // Handle 429 specifically
      console.error('Rate limit exceeded:', {
        status: error.status,
        message: error.message,
        // Access response headers if available
      })

      // Implement retry logic (see next section)
      throw error
    }

    // Handle other errors
    throw error
  }
}
```

**AsaasApiError Properties:**

- `error.isRateLimit` - Returns `true` when status code is 429
- `error.status` - HTTP status code (429 for rate limits)
- `error.message` - Error message from the API
- `error.issues` - Detailed error array if provided by the API

**Important:**

`isRateLimit` is a property getter, not a method. Use `error.isRateLimit`, not `error.isRateLimit()`.

**Error Detection Pattern:**

```typescript
try {
  await client.payments.list({ limit: 100 })
} catch (error) {
  if (error instanceof AsaasApiError) {
    if (error.isRateLimit) {
      // HTTP 429 - Rate limit exceeded
      handleRateLimit(error)
    } else if (error.isUnauthorized) {
      // HTTP 401 - Invalid access token
      handleAuthError(error)
    } else if (error.isForbidden) {
      // HTTP 403 - IP whitelist or permission issue
      handleForbidden(error)
    } else {
      // Other API errors
      handleApiError(error)
    }
  } else {
    // Network or unexpected errors
    throw error
  }
}
```

## Retry Pattern

When rate limits are exceeded, implementing exponential backoff retry logic is essential for building resilient integrations.

**Exponential Backoff:**

Exponential backoff progressively increases the delay between retry attempts. This prevents overwhelming the API and gives the rate limit window time to reset.

**Retry Helper Implementation:**

```typescript
/**
 * Configuration options for the retry mechanism
 */
interface RetryOptions {
  /**
   * Maximum number of retry attempts
   * @default 3
   */
  maxRetries?: number

  /**
   * Initial delay in milliseconds before the first retry
   * @default 1000
   */
  initialDelayMs?: number

  /**
   * Maximum delay in milliseconds between retries
   * @default 32000
   */
  maxDelayMs?: number

  /**
   * Multiplier for exponential backoff calculation
   * @default 2
   */
  backoffMultiplier?: number
}

/**
 * Executes an async function with exponential backoff retry logic
 *
 * Retries on:
 * - HTTP 429 (Rate Limit)
 * - HTTP 503 (Service Unavailable)
 * - Network errors (ECONNRESET, ETIMEDOUT, ENOTFOUND)
 *
 * Does NOT retry on:
 * - HTTP 4xx (except 429) - Client errors
 * - HTTP 401 - Authentication errors
 * - HTTP 403 - Authorization errors
 *
 * @param fn - The async function to execute
 * @param options - Retry configuration options
 * @returns The result of the function if successful
 * @throws The last error if all retries are exhausted
 *
 * @example
 * ```typescript
 * const payment = await withRetry(
 *   () => client.payments.getById('pay_123'),
 *   { maxRetries: 5, initialDelayMs: 2000 }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 32000,
    backoffMultiplier = 2,
  } = options

  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Determine if error is retryable
      const shouldRetry = isRetryableError(error)

      if (!shouldRetry) {
        throw error
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt)
      const delayMs = Math.min(exponentialDelay, maxDelayMs)

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delayMs // ±30% jitter
      const finalDelay = delayMs + jitter

      console.warn(
        `Attempt ${attempt + 1}/${maxRetries} failed. ` +
        `Retrying in ${Math.round(finalDelay)}ms...`,
        { error: (error as Error).message }
      )

      await sleep(finalDelay)
    }
  }

  throw lastError!
}

/**
 * Determines if an error should trigger a retry attempt
 */
function isRetryableError(error: unknown): boolean {
  // Handle AsaasApiError instances
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const statusCode = (error as { statusCode: number }).statusCode

    // Retry on rate limits and service unavailable
    if (statusCode === 429 || statusCode === 503) {
      return true
    }

    // Don't retry on client errors (4xx)
    if (statusCode >= 400 && statusCode < 500) {
      return false
    }

    // Retry on server errors (5xx) except 501 (Not Implemented)
    if (statusCode >= 500 && statusCode !== 501) {
      return true
    }
  }

  // Handle network errors
  if (error && typeof error === 'object' && 'code' in error) {
    const networkErrorCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'EHOSTUNREACH',
      'EAI_AGAIN',
    ]

    const errorCode = (error as { code: string }).code
    if (networkErrorCodes.includes(errorCode)) {
      return true
    }
  }

  return false
}

/**
 * Sleep helper for async delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

**Usage Examples:**

**Basic Usage:**

```typescript
import { AsaasClient } from 'asaas-sdk'
import { withRetry } from './utils/retry'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

// Simple retry with defaults (3 retries, 1s initial delay)
async function fetchPayment(paymentId: string) {
  return withRetry(() => client.payments.getById(paymentId))
}
```

**Custom Configuration:**

```typescript
// More aggressive retry for critical operations
async function createPayment(paymentData: CreatePaymentInput) {
  return withRetry(
    () => client.payments.create(paymentData),
    {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 60000,
      backoffMultiplier: 2,
    }
  )
}
```

**Batch Operations:**

```typescript
// Retry individual items in a batch
async function fetchMultiplePayments(paymentIds: string[]) {
  const results = await Promise.allSettled(
    paymentIds.map(id =>
      withRetry(() => client.payments.getById(id))
    )
  )

  const successful = results
    .filter((r): r is PromiseFulfilledResult<Payment> => r.status === 'fulfilled')
    .map(r => r.value)

  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === 'rejected')
    .map(r => r.reason)

  return { successful, failed }
}
```

**With Custom Error Handling:**

```typescript
async function fetchWithFallback(paymentId: string) {
  try {
    return await withRetry(
      () => client.payments.getById(paymentId),
      { maxRetries: 3 }
    )
  } catch (error) {
    if (error instanceof AsaasApiError && error.isRateLimit) {
      // Still rate limited after retries
      console.error('Rate limit exhausted after retries')

      // Fall back to cached data or queue for later
      return getCachedPayment(paymentId)
    }

    throw error
  }
}
```

**Backoff Calculation Example:**

With default settings (`initialDelayMs: 1000`, `backoffMultiplier: 2`):

```
Attempt 1 fails → Wait ~1,000ms  (1s × 2^0 = 1s)
Attempt 2 fails → Wait ~2,000ms  (1s × 2^1 = 2s)
Attempt 3 fails → Wait ~4,000ms  (1s × 2^2 = 4s)
Attempt 4 fails → Throw error
```

With jitter, actual delays will vary by ±30% to prevent synchronized retries across multiple clients.

## Best Practices

### 1. Use Webhooks Instead of Polling

The most effective way to avoid rate limits is to use webhooks for event-driven updates.

**Polling Anti-Pattern:**

```typescript
// Bad: Consumes 2,880 requests per payment per day
async function pollPaymentStatus(paymentId: string) {
  const interval = setInterval(async () => {
    const payment = await client.payments.getById(paymentId)

    if (payment.status === 'CONFIRMED') {
      clearInterval(interval)
      processPayment(payment)
    }
  }, 30000) // Poll every 30 seconds
}
```

**Webhook Pattern:**

```typescript
// Good: 1-2 requests per payment lifecycle
import express from 'express'

const app = express()

app.post('/webhooks/asaas', async (req, res) => {
  const event = req.body

  if (event.event === 'PAYMENT_RECEIVED') {
    const paymentId = event.payment.id

    // Fetch full payment details once
    const payment = await client.payments.getById(paymentId)
    await processPayment(payment)
  }

  res.sendStatus(200)
})
```

**Configure webhooks in your Asaas dashboard:**
- Settings → Webhooks → Add Webhook URL
- Select events: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, etc.

### 2. Cache Responses Where Appropriate

Reduce API calls by caching data that doesn't change frequently.

**Cacheable Data:**

- Customer information
- Payment method configurations
- Installment plans
- Notification preferences

**Example with TTL Cache:**

```typescript
import { LRUCache } from 'lru-cache'

const customerCache = new LRUCache<string, Customer>({
  max: 500, // Maximum entries
  ttl: 1000 * 60 * 15, // 15-minute TTL
})

async function getCustomer(customerId: string): Promise<Customer> {
  // Check cache first
  const cached = customerCache.get(customerId)
  if (cached) {
    return cached
  }

  // Fetch from API with retry
  const customer = await withRetry(() =>
    client.customers.getById(customerId)
  )

  // Store in cache
  customerCache.set(customerId, customer)

  return customer
}
```

### 3. Implement Exponential Backoff

Always use exponential backoff when retrying rate-limited requests. See the [Retry Pattern](#retry-pattern) section for a complete implementation.

**Key Points:**

- Increase delay exponentially between retries
- Add random jitter to prevent thundering herd
- Set reasonable maximum delays (30-60 seconds)
- Limit total retry attempts (3-5 attempts)

### 4. Monitor Rate Limit Headers Proactively

Don't wait for 429 errors. Monitor headers and throttle before hitting limits.

**Proactive Throttling:**

```typescript
class RateLimitAwareClient {
  private remainingRequests: number = Infinity
  private resetTime: Date = new Date()

  async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    // Wait if we're close to the limit
    if (this.remainingRequests < 5) {
      const waitMs = this.resetTime.getTime() - Date.now()
      if (waitMs > 0) {
        console.warn(`Approaching rate limit. Waiting ${waitMs}ms...`)
        await sleep(waitMs)
      }
    }

    try {
      const response = await requestFn()

      // Update rate limit info from headers
      // (Implementation depends on SDK response format)
      // this.updateRateLimitInfo(response.headers)

      return response
    } catch (error) {
      if (error instanceof AsaasApiError && error.isRateLimit) {
        // Extract reset time from error response
        // this.resetTime = extractResetTime(error)
        throw error
      }
      throw error
    }
  }

  private updateRateLimitInfo(headers: Headers): void {
    const remaining = headers.get('RateLimit-Remaining')
    const reset = headers.get('RateLimit-Reset')

    if (remaining) {
      this.remainingRequests = parseInt(remaining, 10)
    }

    if (reset) {
      const resetSeconds = parseInt(reset, 10)
      this.resetTime = new Date(Date.now() + resetSeconds * 1000)
    }
  }
}
```

### 5. Control Concurrency in Application Code

Limit the number of simultaneous requests at the application level.

**Using p-limit:**

```typescript
import pLimit from 'p-limit'

// Limit to 40 concurrent requests (below the 50 limit)
const limit = pLimit(40)

async function fetchAllPayments(paymentIds: string[]) {
  const payments = await Promise.all(
    paymentIds.map(id =>
      limit(() => withRetry(() => client.payments.getById(id)))
    )
  )

  return payments
}
```

### 6. Design for Eventual Consistency

Accept that some operations may be delayed due to rate limits.

**Queue Pattern:**

```typescript
import { Queue } from 'bull'

const paymentQueue = new Queue('payment-processing', {
  redis: { host: 'localhost', port: 6379 },
})

// Add to queue instead of immediate processing
async function schedulePaymentFetch(paymentId: string) {
  await paymentQueue.add(
    { paymentId },
    {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  )
}

// Process queue with controlled concurrency
paymentQueue.process(10, async (job) => {
  const { paymentId } = job.data
  return await withRetry(() => client.payments.getById(paymentId))
})
```

### 7. Log and Monitor Rate Limit Metrics

Track rate limit incidents to identify patterns and optimize your integration.

**Metrics to Track:**

- Number of 429 errors per hour/day
- Time spent waiting due to rate limits
- Which endpoints trigger rate limits most often
- Request volume patterns

**Example Logging:**

```typescript
import { AsaasApiError } from 'asaas-sdk'

async function monitoredRequest<T>(
  name: string,
  requestFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await withRetry(requestFn, {
      maxRetries: 3,
      initialDelayMs: 1000,
    })

    const duration = Date.now() - startTime

    // Log successful request
    console.info('API request succeeded', {
      operation: name,
      durationMs: duration,
    })

    return result
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof AsaasApiError && error.isRateLimit) {
      // Log rate limit error with context
      console.error('Rate limit exceeded', {
        operation: name,
        durationMs: duration,
        status: error.status,
        message: error.message,
      })

      // Send to monitoring system
      // metricsClient.increment('asaas.rate_limit_errors', { operation: name })
    }

    throw error
  }
}
```

### 8. Test Rate Limit Handling

Include rate limit scenarios in your integration tests.

**Test Cases:**

```typescript
import { describe, it, expect, vi } from 'vitest'
import { AsaasClient, AsaasApiError } from 'asaas-sdk'
import { withRetry } from './retry'

describe('Rate Limit Handling', () => {
  it('should retry on 429 and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(
        new AsaasApiError('Rate limit exceeded', 429, [])
      )
      .mockRejectedValueOnce(
        new AsaasApiError('Rate limit exceeded', 429, [])
      )
      .mockResolvedValueOnce({ id: 'pay_123', status: 'CONFIRMED' })

    const result = await withRetry(mockFn, {
      maxRetries: 3,
      initialDelayMs: 10, // Fast for tests
    })

    expect(mockFn).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ id: 'pay_123', status: 'CONFIRMED' })
  })

  it('should throw after exhausting retries', async () => {
    const mockFn = vi.fn()
      .mockRejectedValue(
        new AsaasApiError('Rate limit exceeded', 429, [])
      )

    await expect(
      withRetry(mockFn, { maxRetries: 2, initialDelayMs: 10 })
    ).rejects.toThrow('Rate limit exceeded')

    expect(mockFn).toHaveBeenCalledTimes(3) // Initial + 2 retries
  })
})
```

## Summary

Rate limiting is a critical aspect of building reliable integrations with the Asaas API. By understanding the three types of limits (concurrent, rolling quota, and per-endpoint), implementing exponential backoff retry logic, and following best practices like using webhooks and caching, you can build resilient applications that handle rate limits gracefully.

**Key Takeaways:**

- **Concurrent Limit**: 50 simultaneous GET requests
- **Rolling Quota**: ~25,000 requests per 12-hour window
- **Per-Endpoint**: Monitor `RateLimit-*` headers
- **Detection**: Use `error.isRateLimit` property (not a method)
- **Retry**: Implement exponential backoff with the `withRetry` helper
- **Prevention**: Use webhooks, cache data, control concurrency
- **Monitoring**: Track 429 errors and rate limit metrics

For questions or issues related to rate limits, consult the [official Asaas API documentation](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api) or contact Asaas support.
