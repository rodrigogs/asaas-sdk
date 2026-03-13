import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { ChargebacksService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new ChargebacksService(createTestOptions({ fetch }))
}

describe('ChargebacksService', () => {
  describe('get', () => {
    it('sends GET /chargebacks/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'chb_123',
          payment: 'pay_456',
          status: 'REQUESTED',
          reason: 'Fraud',
          value: 100.0,
        },
      })
      const service = createService(fetch)

      const result = await service.get('chb_123')

      expect(result.id).toBe('chb_123')
      expect(result.status).toBe('REQUESTED')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/chargebacks/chb_123')
      expect(init.method).toBe('GET')
    })
  })

  describe('list', () => {
    it('sends GET /chargebacks with status filter and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 10,
          data: [
            {
              id: 'chb_123',
              payment: 'pay_456',
              status: 'REQUESTED',
              reason: 'Fraud',
              value: 100.0,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list({
        status: 'REQUESTED',
        limit: 10,
      })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.id).toBe('chb_123')
      expect(result.data[0]!.status).toBe('REQUESTED')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('status=REQUESTED')
      expect(url).toContain('limit=10')
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
  })

  describe('dispute', () => {
    it('sends POST /chargebacks/{id}/dispute with files as multipart FormData', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'chb_123',
          status: 'IN_DISPUTE',
          disputeStatus: 'SUBMITTED',
        },
      })
      const service = createService(fetch)

      const files = [
        new Blob(['evidence-1'], { type: 'application/pdf' }),
        new Blob(['evidence-2'], { type: 'image/png' }),
      ]
      const result = await service.dispute('chb_123', files)

      expect(result.id).toBe('chb_123')
      expect(result.status).toBe('IN_DISPUTE')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/chargebacks/chb_123/dispute')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
      expect(init.headers).not.toHaveProperty('Content-Type')

      const formData = init.body as FormData
      expect(formData.getAll('files')).toHaveLength(2)
    })
  })
})
