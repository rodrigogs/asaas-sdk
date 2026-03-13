import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { InvoicesService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new InvoicesService(createTestOptions({ fetch }))
}

const mockInvoice = {
  id: 'inv_1',
  status: 'SCHEDULED',
  customer: 'cus_123',
  payment: 'pay_456',
  serviceDescription: 'Desenvolvimento de software',
  value: 1000,
  deductions: 0,
  effectiveDate: '2026-03-20',
  pdfUrl: null,
  xmlUrl: null,
  taxes: {
    retainIss: false,
    iss: 2,
    pis: 0.65,
    cofins: 3,
    csll: 1,
    inss: 0,
    ir: 1.5,
  },
}

describe('InvoicesService', () => {
  describe('create', () => {
    it('sends POST /invoices with required fields', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInvoice,
      })
      const service = createService(fetch)

      const result = await service.create({
        serviceDescription: 'Desenvolvimento de software',
        observations: 'Nota referente ao projeto X',
        value: 1000,
        deductions: 0,
        effectiveDate: '2026-03-20',
        municipalServiceName: 'Desenvolvimento de software',
        taxes: {
          retainIss: false,
          iss: 2,
          pis: 0.65,
          cofins: 3,
          csll: 1,
          inss: 0,
          ir: 1.5,
        },
        payment: 'pay_456',
      })

      expect(result).toEqual(mockInvoice)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/invoices')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.serviceDescription).toBe('Desenvolvimento de software')
      expect(body.taxes.iss).toBe(2)
      expect(body.payment).toBe('pay_456')
    })

    it('includes optional municipal service fields', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInvoice,
      })
      const service = createService(fetch)

      await service.create({
        serviceDescription: 'Consultoria',
        observations: 'Servico mensal',
        value: 500,
        deductions: 0,
        effectiveDate: '2026-04-01',
        municipalServiceName: 'Consultoria',
        taxes: {
          retainIss: false,
          iss: 5,
          pis: 0,
          cofins: 0,
          csll: 0,
          inss: 0,
          ir: 0,
        },
        customer: 'cus_789',
        municipalServiceId: 'svc_1',
        municipalServiceCode: '1.01',
        externalReference: 'ref_abc',
      })

      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.customer).toBe('cus_789')
      expect(body.municipalServiceId).toBe('svc_1')
      expect(body.municipalServiceCode).toBe('1.01')
      expect(body.externalReference).toBe('ref_abc')
    })
  })

  describe('list', () => {
    it('sends GET /invoices and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 20,
          data: [mockInvoice],
        },
      })
      const service = createService(fetch)

      const result = await service.list()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.status).toBe('SCHEDULED')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/invoices')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })

    it('passes date range and status filters', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 0,
          offset: 0,
          limit: 10,
          data: [],
        },
      })
      const service = createService(fetch)

      await service.list({
        'limit': 10,
        'effectiveDate[ge]': '2026-03-01',
        'effectiveDate[le]': '2026-03-31',
        'status': 'AUTHORIZED',
        'customer': 'cus_123',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('effectiveDate%5Bge%5D=2026-03-01')
      expect(url).toContain('effectiveDate%5Ble%5D=2026-03-31')
      expect(url).toContain('status=AUTHORIZED')
      expect(url).toContain('customer=cus_123')
    })
  })

  describe('get', () => {
    it('sends GET /invoices/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInvoice,
      })
      const service = createService(fetch)

      const result = await service.get('inv_1')

      expect(result).toEqual(mockInvoice)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/invoices/inv_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('update', () => {
    it('sends PUT /invoices/{id} with update fields', async () => {
      const updatedInvoice = { ...mockInvoice, value: 1500 }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: updatedInvoice,
      })
      const service = createService(fetch)

      const result = await service.update('inv_1', {
        value: 1500,
        observations: 'Valor atualizado',
      })

      expect(result.value).toBe(1500)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/invoices/inv_1')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.value).toBe(1500)
      expect(body.observations).toBe('Valor atualizado')
    })
  })

  describe('authorize', () => {
    it('sends POST /invoices/{id}/authorize', async () => {
      const authorizedInvoice = { ...mockInvoice, status: 'AUTHORIZED' }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: authorizedInvoice,
      })
      const service = createService(fetch)

      const result = await service.authorize('inv_1')

      expect(result.status).toBe('AUTHORIZED')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/invoices/inv_1/authorize')
      expect(init.method).toBe('POST')
    })
  })

  describe('cancel', () => {
    it('sends POST /invoices/{id}/cancel without params', async () => {
      const canceledInvoice = {
        ...mockInvoice,
        status: 'PROCESSING_CANCELLATION',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: canceledInvoice,
      })
      const service = createService(fetch)

      const result = await service.cancel('inv_1')

      expect(result.status).toBe('PROCESSING_CANCELLATION')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/invoices/inv_1/cancel')
      expect(init.method).toBe('POST')
    })

    it('sends POST /invoices/{id}/cancel with cancelOnlyOnAsaas', async () => {
      const canceledInvoice = { ...mockInvoice, status: 'CANCELED' }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: canceledInvoice,
      })
      const service = createService(fetch)

      const result = await service.cancel('inv_1', {
        cancelOnlyOnAsaas: true,
      })

      expect(result.status).toBe('CANCELED')
      const body = JSON.parse(spy.mock.calls[0][1].body as string)
      expect(body.cancelOnlyOnAsaas).toBe(true)
    })
  })
})
