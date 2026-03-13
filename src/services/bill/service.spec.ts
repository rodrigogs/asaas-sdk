import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { BillService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new BillService(createTestOptions({ fetch }))
}

describe('BillService', () => {
  describe('simulate', () => {
    it('sends POST /bill/simulate with identificationField', async () => {
      const mockBill = {
        id: 'bill_sim',
        status: 'PENDING',
        identificationField:
          '23793.38128 60000.000003 00000.000400 1 84340000012050',
        value: 120.5,
        dueDate: '2026-04-15',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockBill,
      })
      const service = createService(fetch)

      const result = await service.simulate({
        identificationField:
          '23793.38128 60000.000003 00000.000400 1 84340000012050',
      })

      expect(result.value).toBe(120.5)
      expect(result.dueDate).toBe('2026-04-15')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/bill/simulate')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.identificationField).toContain('23793')
    })
  })

  describe('create', () => {
    it('sends POST /bill with identificationField and optional fields', async () => {
      const mockBill = {
        id: 'bill_1',
        status: 'PENDING',
        identificationField:
          '23793.38128 60000.000003 00000.000400 1 84340000012050',
        value: 120.5,
        scheduleDate: '2026-04-10',
        description: 'Electricity bill',
        canBeCancelled: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockBill,
      })
      const service = createService(fetch)

      const result = await service.create({
        identificationField:
          '23793.38128 60000.000003 00000.000400 1 84340000012050',
        scheduleDate: '2026-04-10',
        description: 'Electricity bill',
      })

      expect(result).toEqual(mockBill)
      expect(result.canBeCancelled).toBe(true)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/bill')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.identificationField).toContain('23793')
      expect(body.scheduleDate).toBe('2026-04-10')
      expect(body.description).toBe('Electricity bill')
    })

    it('sends POST /bill with dueDate, value, and financial adjustments', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'bill_2', status: 'PENDING' },
      })
      const service = createService(fetch)

      await service.create({
        identificationField: '12345.67890',
        dueDate: '2026-05-01',
        value: 250,
        discount: 10,
        interest: 2.5,
        fine: 5,
      })

      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.dueDate).toBe('2026-05-01')
      expect(body.value).toBe(250)
      expect(body.discount).toBe(10)
      expect(body.interest).toBe(2.5)
      expect(body.fine).toBe(5)
    })
  })

  describe('list', () => {
    it('sends GET /bill and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 2,
          offset: 0,
          limit: 20,
          data: [
            { id: 'bill_1', status: 'PAID', value: 120.5 },
            { id: 'bill_2', status: 'PENDING', value: 250 },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]!.status).toBe('PAID')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/bill')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })

    it('passes pagination params', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: true,
          totalCount: 50,
          offset: 10,
          limit: 5,
          data: [],
        },
      })
      const service = createService(fetch)

      await service.list({ offset: 10, limit: 5 })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('offset=10')
      expect(url).toContain('limit=5')
    })
  })

  describe('get', () => {
    it('sends GET /bill/{id}', async () => {
      const mockBill = {
        id: 'bill_1',
        status: 'PAID',
        identificationField: '23793.38128',
        value: 120.5,
        canBeCancelled: false,
        transactionReceiptUrl: 'https://sandbox.asaas.com/receipt/bill_1',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockBill,
      })
      const service = createService(fetch)

      const result = await service.get('bill_1')

      expect(result).toEqual(mockBill)
      expect(result.canBeCancelled).toBe(false)
      expect(result.transactionReceiptUrl).toContain('receipt')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/bill/bill_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('cancel', () => {
    it('sends POST /bill/{id}/cancel', async () => {
      const mockBill = {
        id: 'bill_1',
        status: 'CANCELLED',
        canBeCancelled: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockBill,
      })
      const service = createService(fetch)

      const result = await service.cancel('bill_1')

      expect(result.status).toBe('CANCELLED')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/bill/bill_1/cancel')
      expect(init.method).toBe('POST')
    })
  })
})
