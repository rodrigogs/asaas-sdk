import { describe, expect, it } from 'vitest'

import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { EscrowService } from './service.js'

function createService(fetch: typeof globalThis.fetch) {
  return new EscrowService(createTestOptions({ fetch }))
}

describe('EscrowService', () => {
  describe('setDefaultConfig', () => {
    it('sends POST /accounts/escrow with config params', async () => {
      const mockConfig = {
        daysToExpire: 30,
        enabled: true,
        isFeePayer: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createService(fetch)

      const result = await service.setDefaultConfig({
        daysToExpire: 30,
        enabled: true,
      })

      expect(result).toEqual(mockConfig)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts/escrow')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.daysToExpire).toBe(30)
      expect(body.enabled).toBe(true)
    })
  })

  describe('getDefaultConfig', () => {
    it('sends GET /accounts/escrow', async () => {
      const mockConfig = {
        daysToExpire: 30,
        enabled: true,
        isFeePayer: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createService(fetch)

      const result = await service.getDefaultConfig()

      expect(result).toEqual(mockConfig)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/accounts/escrow')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('setSubaccountConfig', () => {
    it('sends POST /accounts/{id}/escrow with config params', async () => {
      const mockConfig = {
        daysToExpire: 60,
        enabled: true,
        isFeePayer: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createService(fetch)

      const result = await service.setSubaccountConfig('acc_123', {
        daysToExpire: 60,
        enabled: true,
        isFeePayer: true,
      })

      expect(result.isFeePayer).toBe(true)

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/accounts/acc_123/escrow')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.daysToExpire).toBe(60)
      expect(body.isFeePayer).toBe(true)
    })
  })

  describe('getSubaccountConfig', () => {
    it('sends GET /accounts/{id}/escrow', async () => {
      const mockConfig = {
        daysToExpire: 60,
        enabled: true,
        isFeePayer: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createService(fetch)

      const result = await service.getSubaccountConfig('acc_123')

      expect(result).toEqual(mockConfig)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/accounts/acc_123/escrow')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('getPayment', () => {
    it('sends GET /payments/{id}/escrow', async () => {
      const mockEscrow = {
        id: 'esc_1',
        status: 'ACTIVE',
        value: 500,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockEscrow,
      })
      const service = createService(fetch)

      const result = await service.getPayment('pay_123')

      expect(result).toEqual(mockEscrow)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/payments/pay_123/escrow')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('finish', () => {
    it('sends POST /escrow/{id}/finish', async () => {
      const mockEscrow = {
        id: 'esc_1',
        status: 'FINISHED',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockEscrow,
      })
      const service = createService(fetch)

      const result = await service.finish('esc_1')

      expect(result.status).toBe('FINISHED')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/escrow/esc_1/finish')
      expect(init.method).toBe('POST')
    })
  })
})
