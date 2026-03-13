import { describe, expect, it } from 'vitest'

import {
  AsaasApiError,
  AsaasConnectionError,
  AsaasError,
  AsaasTimeoutError,
} from './errors.js'

describe('AsaasError', () => {
  it('is an instance of Error with the correct name', () => {
    const error = new AsaasError('something broke')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('AsaasError')
    expect(error.message).toBe('something broke')
  })
})

describe('AsaasApiError', () => {
  it('formats message from issue descriptions', () => {
    const error = new AsaasApiError({
      status: 422,
      issues: [
        { description: ' Invalid customer ' },
        { description: 'Missing email' },
      ],
    })

    expect(error).toBeInstanceOf(AsaasError)
    expect(error.name).toBe('AsaasApiError')
    expect(error.status).toBe(422)
    expect(error.message).toBe('Invalid customer; Missing email')
    expect(error.issues).toHaveLength(2)
  })

  it('falls back to HTTP status when no issues are provided', () => {
    const error = new AsaasApiError({ status: 503 })

    expect(error.message).toBe('HTTP 503')
    expect(error.issues).toEqual([])
  })

  it('preserves the raw response body', () => {
    const body = { errors: [{ code: 'invalid' }], extra: 'data' }
    const error = new AsaasApiError({ status: 400, body })

    expect(error.body).toBe(body)
  })

  it.each([
    {
      status: 401,
      expected: {
        isAuth: true,
        isRateLimit: false,
        isServer: false,
        isRetryable: false,
      },
    },
    {
      status: 403,
      expected: {
        isAuth: true,
        isRateLimit: false,
        isServer: false,
        isRetryable: false,
      },
    },
    {
      status: 429,
      expected: {
        isAuth: false,
        isRateLimit: true,
        isServer: false,
        isRetryable: true,
      },
    },
    {
      status: 500,
      expected: {
        isAuth: false,
        isRateLimit: false,
        isServer: true,
        isRetryable: true,
      },
    },
    {
      status: 502,
      expected: {
        isAuth: false,
        isRateLimit: false,
        isServer: true,
        isRetryable: true,
      },
    },
    {
      status: 422,
      expected: {
        isAuth: false,
        isRateLimit: false,
        isServer: false,
        isRetryable: false,
      },
    },
  ] as const)('computed getters for HTTP $status', ({ status, expected }) => {
    const error = new AsaasApiError({ status })

    expect(error.isAuth).toBe(expected.isAuth)
    expect(error.isRateLimit).toBe(expected.isRateLimit)
    expect(error.isServer).toBe(expected.isServer)
    expect(error.isRetryable).toBe(expected.isRetryable)
  })
})

describe('AsaasTimeoutError', () => {
  it('carries the timeout duration', () => {
    const error = new AsaasTimeoutError(30_000)

    expect(error).toBeInstanceOf(AsaasError)
    expect(error.name).toBe('AsaasTimeoutError')
    expect(error.message).toBe('Request timed out after 30000ms')
    expect(error.timeoutMs).toBe(30_000)
  })
})

describe('AsaasConnectionError', () => {
  it('wraps network failures', () => {
    const cause = new TypeError('fetch failed')
    const error = new AsaasConnectionError('Network unreachable', { cause })

    expect(error).toBeInstanceOf(AsaasError)
    expect(error.name).toBe('AsaasConnectionError')
    expect(error.message).toBe('Network unreachable')
    expect(error.cause).toBe(cause)
  })
})
