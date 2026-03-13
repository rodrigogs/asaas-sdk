import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { InstallmentsService } from './service.js'
import type {
  Installment,
  InstallmentCreateParams,
  InstallmentListParams,
  InstallmentRemoveResult,
} from './types.js'

function createService(fetch: typeof globalThis.fetch) {
  return new InstallmentsService(createTestOptions({ fetch }))
}

describe('InstallmentsService', () => {
  it('sends POST /installments', async () => {
    const params: InstallmentCreateParams = {
      installmentCount: 3,
      customer: 'cus_123',
      value: 100.0,
      billingType: 'BOLETO',
      dueDate: '2026-04-01',
    }
    const mockResponse: Installment = {
      id: 'inst_1',
      value: 100.0,
      installmentCount: 3,
      customer: 'cus_123',
      billingType: 'BOLETO',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.create(params)

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/installments')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends GET /installments/{id}', async () => {
    const mockResponse: Installment = {
      id: 'inst_1',
      value: 100.0,
      installmentCount: 3,
      customer: 'cus_123',
      billingType: 'BOLETO',
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.get('inst_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/installments/inst_1')
    expect(init.method).toBe('GET')
  })

  it('sends GET /installments with filters', async () => {
    const params: InstallmentListParams = {
      customer: 'cus_123',
      offset: 0,
      limit: 10,
    }
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 2,
        offset: 0,
        limit: 10,
        data: [
          { id: 'inst_1', value: 100.0, customer: 'cus_123' },
          { id: 'inst_2', value: 200.0, customer: 'cus_123' },
        ],
      },
    })
    const service = createService(fetch)

    const result = await service.list(params)

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]!.id).toBe('inst_1')
    expect(result.data[1]!.id).toBe('inst_2')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/installments')
    expect(url).toContain('customer=cus_123')
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

  it('sends DELETE /installments/{id}', async () => {
    const mockResponse: InstallmentRemoveResult = {
      id: 'inst_1',
      deleted: true,
    }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.remove('inst_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/installments/inst_1')
    expect(init.method).toBe('DELETE')
  })

  it('sends GET /installments/{id}/payments', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: {
        object: 'list',
        hasMore: false,
        totalCount: 2,
        offset: 0,
        limit: 10,
        data: [
          {
            id: 'pay_1',
            customer: 'cus_123',
            billingType: 'BOLETO',
            value: 100.0,
            netValue: 95.0,
            status: 'PENDING',
            dueDate: '2026-04-01',
          },
          {
            id: 'pay_2',
            customer: 'cus_123',
            billingType: 'BOLETO',
            value: 100.0,
            netValue: 95.0,
            status: 'PENDING',
            dueDate: '2026-05-01',
          },
        ],
      },
    })
    const service = createService(fetch)

    const result = await service.listPayments('inst_1')

    expect(result).toBeInstanceOf(PaginatedList)
    expect(result.data).toHaveLength(2)
    expect(result.data[0]!.id).toBe('pay_1')
    expect(result.data[1]!.id).toBe('pay_2')
    const url = spy.mock.calls[0][0].toString()
    expect(url).toContain('/installments/inst_1/payments')
  })

  it('sends DELETE /installments/{id}/payments', async () => {
    const mockResponse = { success: true }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.cancelPendingCharges('inst_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/installments/inst_1/payments')
    expect(init.method).toBe('DELETE')
  })

  it('sends POST /installments/{id}/refund without params', async () => {
    const mockResponse = { success: true, refundId: 'ref_1' }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const result = await service.refund('inst_1')

    expect(result).toEqual(mockResponse)
    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('/installments/inst_1/refund')
    expect(init.method).toBe('POST')
  })

  it('sends POST /installments/{id}/refund with params', async () => {
    const mockResponse = { success: true, refundId: 'ref_2' }
    const { fetch, spy } = createMockFetch({ status: 200, body: mockResponse })
    const service = createService(fetch)

    const params = {
      value: 50.0,
      description: 'Partial refund',
      splitRefunds: [{ walletId: 'wal_1', value: 25.0 }],
    }
    const result = await service.refund('inst_1', params)

    expect(result).toEqual(mockResponse)
    const [, init] = spy.mock.calls[0]
    expect(JSON.parse(init.body as string)).toEqual(params)
  })

  it('sends GET /installments/{id}/paymentBook as binary', async () => {
    const pdfBytes = new Uint8Array([37, 80, 68, 70])
    const mockFetch = (async () =>
      new Response(pdfBytes, {
        status: 200,
        headers: { 'content-type': 'application/pdf' },
      })) as unknown as typeof globalThis.fetch

    const service = new InstallmentsService(
      createTestOptions({ fetch: mockFetch }),
    )
    const result = await service.downloadPaymentBook('inst_1')
    expect(result.contentType).toBe('application/pdf')
  })
})
