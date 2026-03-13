import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { PaymentsService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PaymentsService(createTestOptions({ fetch }))
}

describe('PaymentsService', () => {
  describe('create', () => {
    it('sends POST /payments with payment data', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'pay_123',
          customer: 'cus_1',
          billingType: 'BOLETO',
          value: 100.0,
          dueDate: '2026-03-20',
          status: 'PENDING',
        },
      })
      const service = createService(fetch)

      const result = await service.create({
        customer: 'cus_1',
        billingType: 'BOLETO',
        value: 100.0,
        dueDate: '2026-03-20',
      })

      expect(result.id).toBe('pay_123')
      expect(result.status).toBe('PENDING')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/payments')
      expect(init.method).toBe('POST')
      expect(JSON.parse(init.body as string)).toEqual({
        customer: 'cus_1',
        billingType: 'BOLETO',
        value: 100.0,
        dueDate: '2026-03-20',
      })
    })
  })

  describe('get', () => {
    it('sends GET /payments/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'pay_123',
          customer: 'cus_1',
          value: 100.0,
          status: 'PENDING',
        },
      })
      const service = createService(fetch)

      const result = await service.get('pay_123')

      expect(result.id).toBe('pay_123')
      expect(spy.mock.calls[0][0].toString()).toContain('/payments/pay_123')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('list', () => {
    it('sends GET /payments with filters and returns PaginatedList', async () => {
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
              id: 'pay_123',
              customer: 'cus_1',
              status: 'PENDING',
              value: 100.0,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list({
        customer: 'cus_1',
        status: 'PENDING',
        limit: 10,
      })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.id).toBe('pay_123')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('customer=cus_1')
      expect(url).toContain('status=PENDING')
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

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=0')
      expect(url).toContain('limit=20')
    })
  })

  describe('update', () => {
    it('sends PUT /payments/{id} with update data', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'pay_123',
          value: 150.0,
          description: 'Updated payment',
        },
      })
      const service = createService(fetch)

      const result = await service.update('pay_123', {
        value: 150.0,
        description: 'Updated payment',
      })

      expect(result.value).toBe(150.0)
      expect(result.description).toBe('Updated payment')
      expect(spy.mock.calls[0][0].toString()).toContain('/payments/pay_123')
      expect(spy.mock.calls[0][1].method).toBe('PUT')
    })
  })

  describe('remove', () => {
    it('sends DELETE /payments/{id} and returns deletion result', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', deleted: true },
      })
      const service = createService(fetch)

      const result = await service.remove('pay_123')

      expect(result).toEqual({ id: 'pay_123', deleted: true })
      expect(spy.mock.calls[0][0].toString()).toContain('/payments/pay_123')
      expect(spy.mock.calls[0][1].method).toBe('DELETE')
    })
  })

  describe('restore', () => {
    it('sends POST /payments/{id}/restore and returns payment', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', deleted: false, status: 'PENDING' },
      })
      const service = createService(fetch)

      const result = await service.restore('pay_123')

      expect(result.id).toBe('pay_123')
      expect(result.deleted).toBe(false)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/restore',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('getStatus', () => {
    it('sends GET /payments/{id}/status', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { status: 'RECEIVED' },
      })
      const service = createService(fetch)

      const result = await service.getStatus('pay_123')

      expect(result.status).toBe('RECEIVED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/status',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getBillingInfo', () => {
    it('sends GET /payments/{id}/billingInfo', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { bankSlipUrl: 'https://example.com/slip.pdf' },
      })
      const service = createService(fetch)

      const result = await service.getBillingInfo('pay_123')

      expect(result.bankSlipUrl).toBe('https://example.com/slip.pdf')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/billingInfo',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getIdentificationField', () => {
    it('sends GET /payments/{id}/identificationField', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          identificationField: '12345678901234567890',
          nossoNumero: '00000001',
        },
      })
      const service = createService(fetch)

      const result = await service.getIdentificationField('pay_123')

      expect(result.identificationField).toBe('12345678901234567890')
      expect(result.nossoNumero).toBe('00000001')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/identificationField',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getViewingInfo', () => {
    it('sends GET /payments/{id}/viewingInfo', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { viewCount: 3, lastViewed: '2026-03-10' },
      })
      const service = createService(fetch)

      const result = await service.getViewingInfo('pay_123')

      expect(result.viewCount).toBe(3)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/viewingInfo',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('confirmCashReceipt', () => {
    it('sends POST /payments/{id}/receiveInCash with body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          id: 'pay_123',
          status: 'RECEIVED_IN_CASH',
          paymentDate: '2026-03-13',
        },
      })
      const service = createService(fetch)

      const result = await service.confirmCashReceipt('pay_123', {
        paymentDate: '2026-03-13',
        value: 100.0,
      })

      expect(result.status).toBe('RECEIVED_IN_CASH')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/receiveInCash',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
      expect(JSON.parse(spy.mock.calls[0][1].body as string)).toEqual({
        paymentDate: '2026-03-13',
        value: 100.0,
      })
    })
  })

  describe('undoCashReceipt', () => {
    it('sends POST /payments/{id}/undoReceivedInCash', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', status: 'PENDING' },
      })
      const service = createService(fetch)

      const result = await service.undoCashReceipt('pay_123')

      expect(result.status).toBe('PENDING')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/undoReceivedInCash',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('refund', () => {
    it('sends POST /payments/{id}/refund with body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pay_123', status: 'REFUNDED', value: 50.0 },
      })
      const service = createService(fetch)

      const result = await service.refund('pay_123', {
        value: 50.0,
        description: 'Partial refund',
      })

      expect(result.status).toBe('REFUNDED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/refund',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
      expect(JSON.parse(spy.mock.calls[0][1].body as string)).toEqual({
        value: 50.0,
        description: 'Partial refund',
      })
    })
  })

  describe('refundBankSlip', () => {
    it('sends POST /payments/{id}/bankSlip/refund', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { success: true, refundId: 'ref_456' },
      })
      const service = createService(fetch)

      const result = await service.refundBankSlip('pay_123')

      expect(result.success).toBe(true)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/bankSlip/refund',
      )
      expect(spy.mock.calls[0][1].method).toBe('POST')
    })
  })

  describe('listRefunds', () => {
    it('sends GET /payments/{id}/refunds as PaginatedList', async () => {
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
              dateCreated: '2026-03-13',
              status: 'DONE',
              value: 50.0,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listRefunds('pay_123')

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.value).toBe(50.0)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/refunds',
      )
    })
  })

  describe('getChargeback', () => {
    it('sends GET /payments/{id}/chargeback', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { status: 'REQUESTED', reason: 'Fraud' },
      })
      const service = createService(fetch)

      const result = await service.getChargeback('pay_123')

      expect(result.status).toBe('REQUESTED')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/payments/pay_123/chargeback',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('simulate', () => {
    it('sends POST /payments/simulate with body', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          creditCard: { total: 110.0 },
          bankSlip: { total: 100.0 },
        },
      })
      const service = createService(fetch)

      const result = await service.simulate({
        value: 100.0,
        installmentCount: 3,
      })

      expect(result.creditCard).toBeDefined()
      expect(spy.mock.calls[0][0].toString()).toContain('/payments/simulate')
      expect(spy.mock.calls[0][1].method).toBe('POST')
      expect(JSON.parse(spy.mock.calls[0][1].body as string)).toEqual({
        value: 100.0,
        installmentCount: 3,
      })
    })
  })

  describe('getLimits', () => {
    it('sends GET /payments/limits', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { maxValue: 100000.0, maxInstallments: 12 },
      })
      const service = createService(fetch)

      const result = await service.getLimits()

      expect(result.maxValue).toBe(100000.0)
      expect(spy.mock.calls[0][0].toString()).toContain('/payments/limits')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })
})
