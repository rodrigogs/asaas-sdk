import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { PaymentLinkImagesService } from './images.js'
import { PaymentLinksService } from './service.js'
import type { PaymentLink, PaymentLinkImage } from './types.js'

function createService(fetch: typeof globalThis.fetch) {
  return new PaymentLinksService(createTestOptions({ fetch }))
}

// --- PaymentLinksService ---

describe('PaymentLinksService', () => {
  describe('create', () => {
    it('sends POST /paymentLinks with required and optional fields', async () => {
      const mockResponse: PaymentLink = {
        id: 'pl_1',
        name: 'Troca de óleo',
        url: 'https://sandbox.asaas.com/c/pl_1',
        billingType: 'PIX',
        chargeType: 'DETACHED',
        active: true,
        value: 150,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.create({
        name: 'Troca de óleo',
        billingType: 'PIX',
        chargeType: 'DETACHED',
        value: 150,
        notificationEnabled: true,
        callback: { successUrl: 'https://shop.com/ok' },
      })

      expect(result).toEqual(mockResponse)
      expect(result.url).toBe('https://sandbox.asaas.com/c/pl_1')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.name).toBe('Troca de óleo')
      expect(body.billingType).toBe('PIX')
      expect(body.chargeType).toBe('DETACHED')
      expect(body.callback.successUrl).toBe('https://shop.com/ok')
    })
  })

  describe('list', () => {
    it('sends GET /paymentLinks with filters', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 10,
          data: [{ id: 'pl_1', name: 'Troca de óleo', active: true }],
        },
      })
      const service = createService(fetch)

      const result = await service.list({
        name: 'Troca',
        active: true,
        limit: 10,
      })

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('name=Troca')
      expect(url).toContain('active=true')
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

  describe('get', () => {
    it('sends GET /paymentLinks/{id}', async () => {
      const mockResponse: PaymentLink = {
        id: 'pl_1',
        name: 'Troca de óleo',
        active: true,
        chargeType: 'DETACHED',
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.get('pl_1')

      expect(result).toEqual(mockResponse)
      expect(spy.mock.calls[0][0].toString()).toContain('/paymentLinks/pl_1')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('update', () => {
    it('sends PUT /paymentLinks/{id} with partial fields', async () => {
      const mockResponse: PaymentLink = {
        id: 'pl_1',
        name: 'Revisão completa',
        value: 350,
        active: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.update('pl_1', {
        name: 'Revisão completa',
        value: 350,
      })

      expect(result.name).toBe('Revisão completa')
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks/pl_1')
      expect(init.method).toBe('PUT')
      const body = JSON.parse(init.body as string)
      expect(body.name).toBe('Revisão completa')
      expect(body.value).toBe(350)
    })
  })

  describe('remove', () => {
    it('sends DELETE /paymentLinks/{id}', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'pl_1', deleted: true },
      })
      const service = createService(fetch)

      const result = await service.remove('pl_1')

      expect(result.deleted).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks/pl_1')
      expect(init.method).toBe('DELETE')
    })
  })

  describe('restore', () => {
    it('sends POST /paymentLinks/{id}/restore', async () => {
      const mockResponse: PaymentLink = {
        id: 'pl_1',
        name: 'Troca de óleo',
        active: true,
        deleted: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createService(fetch)

      const result = await service.restore('pl_1')

      expect(result.deleted).toBe(false)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks/pl_1/restore')
      expect(init.method).toBe('POST')
    })
  })

  it('lazily instantiates images sub-service', () => {
    const { fetch } = createMockFetch()
    const service = createService(fetch)
    expect(service.images).toBeInstanceOf(PaymentLinkImagesService)
    expect(service.images).toBe(service.images)
  })
})

// --- PaymentLinkImagesService ---

describe('PaymentLinkImagesService', () => {
  function createImagesService(fetch: typeof globalThis.fetch) {
    return new PaymentLinkImagesService(createTestOptions({ fetch }))
  }

  describe('add', () => {
    it('sends POST /paymentLinks/{id}/images with multipart form data', async () => {
      const mockResponse: PaymentLinkImage = {
        id: 'img_1',
        main: true,
        image: {
          originalName: 'photo.jpg',
          size: 12345,
          extension: 'jpg',
        },
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createImagesService(fetch)
      const blob = new Blob(['fake-image'], { type: 'image/jpeg' })

      const result = await service.add('pl_1', { main: true, image: blob })

      expect(result.id).toBe('img_1')
      expect(result.main).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks/pl_1/images')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
      const formData = init.body as FormData
      expect(formData.get('main')).toBe('true')
    })

    it('omits main from FormData when not provided', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'img_2', main: false },
      })
      const service = createImagesService(fetch)
      const blob = new Blob(['fake-image'], { type: 'image/jpeg' })

      await service.add('pl_1', { image: blob })

      const formData = spy.mock.calls[0][1].body as FormData
      expect(formData.get('main')).toBeNull()
      expect(formData.get('image')).toBeInstanceOf(Blob)
    })
  })

  describe('list', () => {
    it('sends GET /paymentLinks/{id}/images', async () => {
      const mockResponse: PaymentLinkImage[] = [
        { id: 'img_1', main: true },
        { id: 'img_2', main: false },
      ]
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createImagesService(fetch)

      const result = await service.list('pl_1')

      expect(result).toHaveLength(2)
      expect(result[0]!.main).toBe(true)
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/paymentLinks/pl_1/images',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('get', () => {
    it('sends GET /paymentLinks/{linkId}/images/{imageId}', async () => {
      const mockResponse: PaymentLinkImage = {
        id: 'img_1',
        main: true,
        image: { previewUrl: 'https://cdn.asaas.com/img_1' },
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createImagesService(fetch)

      const result = await service.get('pl_1', 'img_1')

      expect(result.image?.previewUrl).toBe('https://cdn.asaas.com/img_1')
      expect(spy.mock.calls[0][0].toString()).toContain(
        '/paymentLinks/pl_1/images/img_1',
      )
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('remove', () => {
    it('sends DELETE /paymentLinks/{linkId}/images/{imageId}', async () => {
      const { fetch, spy } = createMockFetch({ status: 200, body: {} })
      const service = createImagesService(fetch)

      await service.remove('pl_1', 'img_1')

      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/paymentLinks/pl_1/images/img_1')
      expect(init.method).toBe('DELETE')
    })
  })

  describe('setMain', () => {
    it('sends PUT /paymentLinks/{linkId}/images/{imageId}/setAsMain', async () => {
      const mockResponse: PaymentLinkImage = { id: 'img_2', main: true }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockResponse,
      })
      const service = createImagesService(fetch)

      const result = await service.setMain('pl_1', 'img_2')

      expect(result.main).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain(
        '/paymentLinks/pl_1/images/img_2/setAsMain',
      )
      expect(init.method).toBe('PUT')
    })
  })
})
