import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { PaymentDocumentsService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PaymentDocumentsService(createTestOptions({ fetch }))
}

describe('PaymentDocumentsService', () => {
  describe('upload', () => {
    it('sends POST /payments/{id}/documents as multipart FormData', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'doc_new',
          type: 'INVOICE',
          availableAfterPayment: true,
        },
      })
      const service = createService(fetch)

      const file = new Blob(['pdf-content'], { type: 'application/pdf' })
      const result = await service.upload('pay_123', {
        availableAfterPayment: true,
        type: 'INVOICE',
        file,
      })

      expect(result.id).toBe('doc_new')
      expect(result.type).toBe('INVOICE')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/payments/pay_123/documents')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
      expect(init.headers).not.toHaveProperty('Content-Type')

      const formData = init.body as FormData
      expect(formData.get('type')).toBe('INVOICE')
      expect(formData.get('availableAfterPayment')).toBe('true')
      expect(formData.get('file')).toBeInstanceOf(Blob)
    })
  })

  describe('list', () => {
    it('sends GET /payments/{id}/documents as PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 2,
          offset: 0,
          limit: 20,
          data: [
            {
              id: 'doc_123',
              type: 'INVOICE',
              availableAfterPayment: true,
            },
            {
              id: 'doc_456',
              type: 'CONTRACT',
              availableAfterPayment: false,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list('pay_123')

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]!.id).toBe('doc_123')
      expect(result.data[0]!.type).toBe('INVOICE')
      expect(result.data[1]!.id).toBe('doc_456')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/documents',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('get', () => {
    it('sends GET /payments/{paymentId}/documents/{documentId}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'doc_123',
          type: 'INVOICE',
          availableAfterPayment: true,
        },
      })
      const service = createService(fetch)

      const result = await service.get('pay_123', 'doc_123')

      expect(result.id).toBe('doc_123')
      expect(result.type).toBe('INVOICE')
      expect(result.availableAfterPayment).toBe(true)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/documents/doc_123',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('update', () => {
    it('sends PUT /payments/{paymentId}/documents/{documentId} with body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'doc_123',
          type: 'CONTRACT',
          availableAfterPayment: false,
        },
      })
      const service = createService(fetch)

      const result = await service.update('pay_123', 'doc_123', {
        availableAfterPayment: false,
        type: 'CONTRACT',
      })

      expect(result.id).toBe('doc_123')
      expect(result.type).toBe('CONTRACT')
      expect(result.availableAfterPayment).toBe(false)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/documents/doc_123',
      )
      expect(spy.mock.calls[0][1].method).toBe('PUT')
      expect(JSON.parse(spy.mock.calls[0][1].body as string)).toEqual({
        availableAfterPayment: false,
        type: 'CONTRACT',
      })
    })
  })

  describe('remove', () => {
    it('sends DELETE /payments/{paymentId}/documents/{documentId}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'doc_123', deleted: true },
      })
      const service = createService(fetch)

      const result = await service.remove('pay_123', 'doc_123')

      expect(result).toEqual({ id: 'doc_123', deleted: true })
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/documents/doc_123',
      )
      expect(spy.mock.calls[0][1].method).toBe('DELETE')
    })
  })
})
