import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from './test-helpers.js'

describe('createMockFetch', () => {
  it('falls back to default response when queue is empty', async () => {
    const { fetch } = createMockFetch()

    const response = await fetch('https://example.com')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({})
  })

  it('returns null body when body is undefined', async () => {
    const { fetch } = createMockFetch({ status: 204 })

    const response = await fetch('https://example.com')

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
  })

  it('defaults status to 200 when not provided', async () => {
    const { fetch } = createMockFetch({ body: { ok: true } })

    const response = await fetch('https://example.com')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})

describe('createTestOptions', () => {
  it('returns normalized defaults without overrides', () => {
    const options = createTestOptions()

    expect(options.accessToken).toBe('test_key_123')
    expect(options.baseUrl).toContain('sandbox')
    expect(options.userAgent).toBe('asaas-sdk-test')
    expect(typeof options.fetch).toBe('function')
  })
})
