import { describe, expect, it } from 'vitest'

import { AsaasConnectionError } from './errors.js'
import { request, requestBinary, requestMultipart } from './http.js'
import { createMockFetch, createTestOptions } from './test-helpers.js'

describe('request', () => {
  it('sends an authenticated GET with correct headers', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'cus_1' },
    })
    const options = createTestOptions({ fetch })

    const result = await request<{ id: string }>(options, {
      method: 'GET',
      path: '/customers/cus_1',
    })

    expect(result).toEqual({ id: 'cus_1' })
    expect(spy).toHaveBeenCalledTimes(1)

    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toBe(
      'https://api-sandbox.asaas.com/v3/customers/cus_1',
    )
    expect(init.method).toBe('GET')
    expect(init.headers).toMatchObject({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'access_token': 'test_key_123',
    })
    expect(init.body).toBeUndefined()
  })

  it('sends a POST with JSON-serialized body', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'cus_new', name: 'PitStop' },
    })
    const options = createTestOptions({ fetch })

    await request(options, {
      method: 'POST',
      path: '/customers',
      body: { name: 'PitStop', cpfCnpj: '12345678000100' },
    })

    const [, init] = spy.mock.calls[0]
    expect(JSON.parse(init.body as string)).toEqual({
      name: 'PitStop',
      cpfCnpj: '12345678000100',
    })
  })

  it('normalizes leading slashes in path', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: {} })
    const options = createTestOptions({ fetch })

    await request(options, { method: 'GET', path: '///customers' })

    expect(spy.mock.calls[0][0].toString()).toBe(
      'https://api-sandbox.asaas.com/v3/customers',
    )
  })

  it('builds query string filtering out undefined values', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: { data: [] } })
    const options = createTestOptions({ fetch })

    await request(options, {
      method: 'GET',
      path: '/customers',
      query: { name: 'PitStop', email: undefined, limit: 10 },
    })

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('name=PitStop')
    expect(url).toContain('limit=10')
    expect(url).not.toContain('email')
  })

  it('throws AsaasApiError on 422 with issues', async () => {
    const { fetch } = createMockFetch({
      status: 422,
      body: { errors: [{ code: 'invalid', description: 'CPF invalido' }] },
    })
    const options = createTestOptions({ fetch })

    await expect(
      request(options, { method: 'GET', path: '/customers/bad' }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'AsaasApiError',
        status: 422,
        message: 'CPF invalido',
        issues: [{ code: 'invalid', description: 'CPF invalido' }],
      }),
    )
  })

  it('throws AsaasApiError with HTTP status fallback on non-JSON error', async () => {
    const { fetch } = createMockFetch()
    const options = createTestOptions({ fetch })

    // Override mock to return non-JSON error
    const badFetch = (async () => ({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token')
      },
    })) as unknown as typeof globalThis.fetch
    options.fetch = badFetch

    await expect(
      request(options, { method: 'GET', path: '/customers' }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'AsaasApiError',
        status: 502,
        message: 'HTTP 502',
        issues: [],
      }),
    )
  })

  it('throws AsaasConnectionError on network failure', async () => {
    const networkError = new TypeError('fetch failed')
    const badFetch = (async () => {
      throw networkError
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      request(options, { method: 'GET', path: '/customers' }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).cause).toBe(networkError)
      return true
    })
  })

  it('includes User-Agent header when userAgent is set', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: {} })
    const options = createTestOptions({ fetch, userAgent: 'pitstop/1.0' })

    await request(options, { method: 'GET', path: '/customers' })

    expect(spy.mock.calls[0][1].headers).toMatchObject({
      'User-Agent': 'pitstop/1.0',
    })
  })
})

describe('requestBinary', () => {
  it('downloads binary content preserving content-type', async () => {
    const pdfBytes = new Uint8Array([37, 80, 68, 70]) // %PDF

    const mockFetch = (async () =>
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })) as unknown as typeof globalThis.fetch

    const options = createTestOptions({ fetch: mockFetch })

    const result = await requestBinary(options, {
      method: 'GET',
      path: '/invoices/inv_1/pdf',
    })

    expect(result.contentType).toBe('application/pdf')
    expect(Buffer.from(result.content).equals(Buffer.from(pdfBytes))).toBe(true)
  })

  it('falls back to octet-stream when content-type is missing', async () => {
    const mockFetch = (async () =>
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
      })) as unknown as typeof globalThis.fetch

    const options = createTestOptions({ fetch: mockFetch })

    const result = await requestBinary(options, {
      method: 'GET',
      path: '/invoices/inv_1/xml',
    })

    expect(result.contentType).toBe('application/octet-stream')
  })

  it('throws AsaasApiError on failure', async () => {
    const { fetch } = createMockFetch({
      status: 410,
      body: { errors: [{ description: 'File unavailable' }] },
    })
    const options = createTestOptions({ fetch })

    await expect(
      requestBinary(options, { method: 'GET', path: '/invoices/inv_1/pdf' }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'AsaasApiError',
        status: 410,
      }),
    )
  })

  it('throws AsaasConnectionError on network failure during binary download', async () => {
    const networkError = new TypeError('fetch failed')
    const badFetch = (async () => {
      throw networkError
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      requestBinary(options, { method: 'GET', path: '/invoices/inv_1/pdf' }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).cause).toBe(networkError)
      return true
    })
  })
})

describe('requestMultipart', () => {
  it('sends FormData body without Content-Type header', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'doc_1', type: 'INVOICE' },
    })
    const options = createTestOptions({ fetch, userAgent: '' })

    const formData = new FormData()
    formData.append('type', 'INVOICE')
    formData.append('availableAfterPayment', 'true')

    const result = await requestMultipart<{ id: string }>(options, {
      method: 'POST',
      path: '/payments/pay_1/documents',
      formData,
    })

    expect(result.id).toBe('doc_1')

    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/payments/pay_1/documents')
    expect(init.method).toBe('POST')
    expect(init.headers).not.toHaveProperty('Content-Type')
    expect(init.headers).toMatchObject({
      Accept: 'application/json',
      access_token: 'test_key_123',
    })
    expect(init.body).toBeInstanceOf(FormData)
  })

  it('throws AsaasApiError on failure', async () => {
    const { fetch } = createMockFetch({
      status: 400,
      body: { errors: [{ description: 'Invalid file' }] },
    })
    const options = createTestOptions({ fetch })

    await expect(
      requestMultipart(options, {
        method: 'POST',
        path: '/chargebacks/chb_1/dispute',
        formData: new FormData(),
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        name: 'AsaasApiError',
        status: 400,
      }),
    )
  })

  it('throws AsaasConnectionError on network failure', async () => {
    const networkError = new TypeError('fetch failed')
    const badFetch = (async () => {
      throw networkError
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      requestMultipart(options, {
        method: 'POST',
        path: '/chargebacks/chb_1/dispute',
        formData: new FormData(),
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).cause).toBe(networkError)
      return true
    })
  })
})

describe('request - non-Error thrown', () => {
  it('wraps non-Error thrown values in AsaasConnectionError', async () => {
    const badFetch = (async () => {
      throw 'string error'
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      request(options, { method: 'GET', path: '/customers' }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).message).toBe(
        'Unknown network error',
      )
      return true
    })
  })
})

describe('requestMultipart - non-Error thrown', () => {
  it('wraps non-Error thrown values in AsaasConnectionError', async () => {
    const badFetch = (async () => {
      throw 'string error'
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      requestMultipart(options, {
        method: 'POST',
        path: '/chargebacks/chb_1/dispute',
        formData: new FormData(),
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).message).toBe(
        'Unknown network error',
      )
      return true
    })
  })
})

describe('requestMultipart - User-Agent', () => {
  it('includes User-Agent header when userAgent is set', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: {} })
    const options = createTestOptions({ fetch, userAgent: 'pitstop/1.0' })

    await requestMultipart(options, {
      method: 'POST',
      path: '/fiscalInfo',
      formData: new FormData(),
    })

    expect(spy.mock.calls[0][1].headers).toMatchObject({
      'User-Agent': 'pitstop/1.0',
    })
  })
})

describe('requestBinary - non-Error thrown', () => {
  it('wraps non-Error thrown values in AsaasConnectionError', async () => {
    const badFetch = (async () => {
      throw 42
    }) as unknown as typeof globalThis.fetch
    const options = createTestOptions({ fetch: badFetch })

    await expect(
      requestBinary(options, { method: 'GET', path: '/invoices/inv_1/pdf' }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toBeInstanceOf(AsaasConnectionError)
      expect((error as AsaasConnectionError).message).toBe(
        'Unknown network error',
      )
      return true
    })
  })
})
