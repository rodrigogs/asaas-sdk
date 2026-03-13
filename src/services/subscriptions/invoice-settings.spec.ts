import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { SubscriptionInvoiceSettingsService } from './invoice-settings.js'
import type { InvoiceSettings, InvoiceSettingsCreateParams } from './types.js'

function createService(body: unknown) {
  const { fetch, spy } = createMockFetch({ status: 200, body })
  return {
    service: new SubscriptionInvoiceSettingsService(
      createTestOptions({ fetch }),
    ),
    spy,
  }
}

const TAXES_PARAMS = {
  retainIss: true,
  iss: 5,
  pis: 0.65,
  cofins: 3,
  csll: 1,
  inss: 0,
  ir: 1.5,
}

const MOCK_SETTINGS: InvoiceSettings = {
  municipalServiceId: null,
  municipalServiceCode: '1.01',
  municipalServiceName: null,
  deductions: 55,
  invoiceCreationPeriod: 'ON_PAYMENT_CONFIRMATION',
  daysBeforeDueDate: null,
  receivedOnly: null,
  observations: 'Regarding March work',
  taxes: {
    retainIss: true,
    iss: 5,
    pis: 0.65,
    cofins: 3,
    csll: 1,
    inss: 0,
    ir: 1.5,
  },
}

describe('SubscriptionInvoiceSettingsService', () => {
  describe('create', () => {
    it('sends POST to /subscriptions/{id}/invoiceSettings with body', async () => {
      const params: InvoiceSettingsCreateParams = {
        taxes: TAXES_PARAMS,
        municipalServiceCode: '1.01',
        effectiveDatePeriod: 'ON_PAYMENT_CONFIRMATION',
        observations: 'Regarding March work',
      }
      const { service, spy } = createService(MOCK_SETTINGS)

      const result = await service.create('sub_123', params)

      expect(result).toEqual(MOCK_SETTINGS)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('POST')
      expect(url.toString()).toContain('/subscriptions/sub_123/invoiceSettings')
      expect(JSON.parse(init.body as string)).toEqual(params)
    })
  })

  describe('get', () => {
    it('sends GET to /subscriptions/{id}/invoiceSettings', async () => {
      const { service, spy } = createService(MOCK_SETTINGS)

      const result = await service.get('sub_123')

      expect(result).toEqual(MOCK_SETTINGS)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('GET')
      expect(url.toString()).toContain('/subscriptions/sub_123/invoiceSettings')
    })
  })

  describe('update', () => {
    it('sends PUT to /subscriptions/{id}/invoiceSettings with body', async () => {
      const params: InvoiceSettingsCreateParams = {
        taxes: TAXES_PARAMS,
        deductions: 100,
      }
      const { service, spy } = createService(MOCK_SETTINGS)

      const result = await service.update('sub_123', params)

      expect(result).toEqual(MOCK_SETTINGS)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('PUT')
      expect(url.toString()).toContain('/subscriptions/sub_123/invoiceSettings')
      expect(JSON.parse(init.body as string)).toEqual(params)
    })
  })

  describe('remove', () => {
    it('sends DELETE to /subscriptions/{id}/invoiceSettings', async () => {
      const response = { id: 'sub_123', deleted: true }
      const { service, spy } = createService(response)

      const result = await service.remove('sub_123')

      expect(result).toEqual(response)
      const [url, init] = spy.mock.calls[0]
      expect(init.method).toBe('DELETE')
      expect(url.toString()).toContain('/subscriptions/sub_123/invoiceSettings')
    })
  })
})
