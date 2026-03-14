# Limites de Taxa

Este guia cobre os mecanismos de limitação de taxa da API Asaas e estratégias para lidar com eles em sua integração.

## Visão Geral

A API Asaas aplica três tipos de limites de taxa para garantir a estabilidade da plataforma:

1. **Requisições Concorrentes** - Máximo de requisições GET simultâneas
2. **Cota Deslizante** - Total de requisições por conta em uma janela de 12 horas
3. **Limites por Endpoint** - Limites específicos em endpoints individuais

Exceder qualquer um desses limites resulta em uma resposta `HTTP 429 Too Many Requests`. Compreender como esses limites funcionam e implementar estratégias de retry apropriadas é crítico para construir integrações resilientes.

## Requisições Concorrentes

A API Asaas permite até **50 requisições GET concorrentes** por conta.

Quando este limite é excedido, a API retorna:

```
HTTP 429 Too Many Requests
```

**Pontos-Chave:**

- Este limite se aplica apenas a requisições `GET`
- Concorrente significa requisições que estão sendo processadas simultaneamente
- O limite é por conta, não por chave de API
- Requisições não-GET (POST, PUT, DELETE) têm tratamento de concorrência separado

**Cenário de Exemplo:**

Se sua aplicação faz 60 requisições `GET` simultâneas para buscar dados de clientes, 10 dessas requisições receberão um erro 429 até que algumas das 50 iniciais sejam concluídas.

**Melhor Prática:**

Controle a concorrência em sua aplicação usando pools de conexão ou semáforos:

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

## Cota Deslizante

Cada conta tem uma cota deslizante de aproximadamente **25.000 requisições por janela de 12 horas**.

**Como a Janela Deslizante Funciona:**

- O contador começa na primeira requisição feita dentro de uma nova janela
- A janela continua pelas próximas 12 horas a partir dessa primeira requisição
- Após 12 horas, uma nova janela começa com a próxima requisição
- Todos os métodos HTTP (GET, POST, PUT, DELETE) contam para esta cota

**Quando a Cota é Excedida:**

```
HTTP 429 Too Many Requests
```

**Limitações Importantes:**

- Contas com padrões de uso baseados em polling **não** recebem ajustes de cota
- A equipe Asaas não aumenta cotas para aplicações que dependem de polling frequente
- Este é um design intencional para encorajar integrações baseadas em webhooks

**Exemplo de Cálculo:**

```
Primeira requisição:    2026-03-13 08:00:00 UTC
Janela termina:         2026-03-13 20:00:00 UTC (12 horas depois)
Requisições feitas:     24.500 (seguro)
Requisições feitas:     25.001 (disparará 429)
```

**Monitorando Seu Uso:**

O SDK não rastreia automaticamente o consumo de cota. Para monitorar seu uso:

1. Rastreie contagens de requisições na camada da sua aplicação
2. Implemente monitoramento e alertas de taxa de requisições
3. Revise padrões de uso da API durante períodos de tráfego alto

**Melhor Prática:**

Projete sua integração para minimizar o volume de requisições:

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

## Limites por Endpoint

Alguns endpoints têm seus próprios limites de taxa específicos além dos limites gerais da conta. Esses limites são expostos via cabeçalhos de resposta HTTP.

**Cabeçalhos de Limite de Taxa:**

- `RateLimit-Limit` - Máximo de requisições permitidas na janela atual
- `RateLimit-Remaining` - Número de requisições restantes na janela atual
- `RateLimit-Reset` - Segundos até a janela de limite de taxa resetar

**Exemplo de Resposta:**

```http
HTTP/1.1 200 OK
RateLimit-Limit: 100
RateLimit-Remaining: 45
RateLimit-Reset: 3600
```

**Interpretação:**

- Este endpoint permite 100 requisições por janela
- Você tem 45 requisições restantes
- O limite reseta em 3.600 segundos (1 hora)

**Quando o Limite é Alcançado:**

Quando `RateLimit-Remaining` chega a `0`, requisições subsequentes retornam:

```
HTTP 429 Too Many Requests
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 2847
```

**Acessando Cabeçalhos no SDK:**

O SDK atualmente expõe dados brutos de resposta. Você pode acessar cabeçalhos através da resposta HTTP subjacente:

```typescript
import { AsaasClient } from 'asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

// Note: Actual header access depends on SDK implementation
// Check SDK documentation for current API
```

**Melhor Prática:**

Monitore proativamente esses cabeçalhos e implemente throttling adaptativo:

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

## Detectando Limites de Taxa no SDK

O SDK fornece uma classe `AsaasApiError` que inclui uma propriedade de conveniência para detectar erros de limite de taxa:

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

**Propriedades do AsaasApiError:**

- `error.isRateLimit` - Retorna `true` quando o código de status é 429
- `error.status` - Código de status HTTP (429 para limites de taxa)
- `error.message` - Mensagem de erro da API
- `error.issues` - Array de erros detalhados se fornecido pela API

**Importante:**

`isRateLimit` é um getter de propriedade, não um método. Use `error.isRateLimit`, não `error.isRateLimit()`.

**Padrão de Detecção de Erro:**

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

## Padrão de Retry

Quando limites de taxa são excedidos, implementar lógica de retry com exponential backoff é essencial para construir integrações resilientes.

**Exponential Backoff:**

Exponential backoff aumenta progressivamente o atraso entre tentativas de retry. Isso previne sobrecarregar a API e dá tempo para a janela de limite de taxa resetar.

**Implementação do Helper de Retry:**

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

**Exemplos de Uso:**

**Uso Básico:**

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

**Configuração Personalizada:**

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

**Operações em Lote:**

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

**Com Tratamento de Erro Personalizado:**

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

**Exemplo de Cálculo de Backoff:**

Com configurações padrão (`initialDelayMs: 1000`, `backoffMultiplier: 2`):

```
Tentativa 1 falha → Espera ~1.000ms  (1s × 2^0 = 1s)
Tentativa 2 falha → Espera ~2.000ms  (1s × 2^1 = 2s)
Tentativa 3 falha → Espera ~4.000ms  (1s × 2^2 = 4s)
Tentativa 4 falha → Lança erro
```

Com jitter, os atrasos reais variarão em ±30% para prevenir retries sincronizados entre múltiplos clientes.

## Melhores Práticas

### 1. Use Webhooks em Vez de Polling

A forma mais efetiva de evitar limites de taxa é usar webhooks para atualizações baseadas em eventos.

**Anti-Padrão de Polling:**

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

**Padrão de Webhook:**

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

**Configure webhooks no seu painel Asaas:**
- Configurações → Webhooks → Adicionar URL de Webhook
- Selecione eventos: `PAYMENT_RECEIVED`, `PAYMENT_CONFIRMED`, etc.

### 2. Cache Respostas Quando Apropriado

Reduza chamadas à API cacheando dados que não mudam frequentemente.

**Dados Cacheáveis:**

- Informações de clientes
- Configurações de métodos de pagamento
- Planos de parcelamento
- Preferências de notificação

**Exemplo com Cache TTL:**

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

### 3. Implemente Exponential Backoff

Sempre use exponential backoff ao tentar novamente requisições com limite de taxa. Veja a seção [Padrão de Retry](#padrão-de-retry) para uma implementação completa.

**Pontos-Chave:**

- Aumente o atraso exponencialmente entre retries
- Adicione jitter aleatório para prevenir thundering herd
- Defina atrasos máximos razoáveis (30-60 segundos)
- Limite o total de tentativas de retry (3-5 tentativas)

### 4. Monitore Cabeçalhos de Limite de Taxa Proativamente

Não espere por erros 429. Monitore cabeçalhos e faça throttling antes de atingir limites.

**Throttling Proativo:**

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

### 5. Controle Concorrência no Código da Aplicação

Limite o número de requisições simultâneas no nível da aplicação.

**Usando p-limit:**

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

### 6. Projete para Consistência Eventual

Aceite que algumas operações podem ser atrasadas devido a limites de taxa.

**Padrão de Fila:**

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

### 7. Registre e Monitore Métricas de Limite de Taxa

Rastreie incidentes de limite de taxa para identificar padrões e otimizar sua integração.

**Métricas para Rastrear:**

- Número de erros 429 por hora/dia
- Tempo gasto esperando devido a limites de taxa
- Quais endpoints disparam limites de taxa com mais frequência
- Padrões de volume de requisições

**Exemplo de Logging:**

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

### 8. Teste o Tratamento de Limite de Taxa

Inclua cenários de limite de taxa em seus testes de integração.

**Casos de Teste:**

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

## Resumo

Limitação de taxa é um aspecto crítico de construir integrações confiáveis com a API Asaas. Ao compreender os três tipos de limites (concorrente, cota deslizante e por endpoint), implementar lógica de retry com exponential backoff, e seguir melhores práticas como usar webhooks e caching, você pode construir aplicações resilientes que lidam com limites de taxa graciosamente.

**Principais Conclusões:**

- **Limite Concorrente**: 50 requisições GET simultâneas
- **Cota Deslizante**: ~25.000 requisições por janela de 12 horas
- **Por Endpoint**: Monitore cabeçalhos `RateLimit-*`
- **Detecção**: Use a propriedade `error.isRateLimit` (não um método)
- **Retry**: Implemente exponential backoff com o helper `withRetry`
- **Prevenção**: Use webhooks, cache dados, controle concorrência
- **Monitoramento**: Rastreie erros 429 e métricas de limite de taxa

Para questões ou problemas relacionados a limites de taxa, consulte a [documentação oficial da API Asaas](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api) ou contate o suporte Asaas.
