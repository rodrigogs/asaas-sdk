import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import type { PixKey, PixKeyCreateParams, PixKeyRemoveResult } from './keys.js'
import { PixKeysService } from './keys.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PixKeysService(createTestOptions({ fetch }))
}

describe('PixKeysService', () => {
  it('sends POST /pix/addressKeys', async () => {
    const params: PixKeyCreateParams = { type: 'EVP' }
    const mockResponse: PixKey = {
      id: 'key_1',
      type: 'EVP',
      status: 'AWAITING_ACTIVATION',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.create(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/addressKeys')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends GET /pix/addressKeys with pagination', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 1,
        offset: 0,
        limit: 10,
        data: [{ id: 'key_1', type: 'EVP', status: 'ACTIVE' }],
      },
    })
    const service = createService(fetch)

    const result = await service.list({ limit: 10 })

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(1)
    expect(result.data[0]!.id).toBe('key_1')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/pix/addressKeys')
  })

  it('uses default pagination when called without params', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 0,
        offset: 0,
        limit: 20,
        data: [],
      },
    })
    const service = createService(fetch)

    await service.list()

    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('offset=0')
    expect(url).toContain('limit=20')
  })

  it('sends GET /pix/addressKeys/{id}', async () => {
    const mockResponse: PixKey = {
      id: 'key_1',
      key: 'abc-def-123',
      type: 'EVP',
      status: 'ACTIVE',
      canBeDeleted: true,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.get('key_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/addressKeys/key_1')
    expect(init.method).toBe('GET')
  })

  it('sends DELETE /pix/addressKeys/{id}', async () => {
    const mockResponse: PixKeyRemoveResult = { id: 'key_1', deleted: true }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.remove('key_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/pix/addressKeys/key_1')
    expect(init.method).toBe('DELETE')
  })
})
