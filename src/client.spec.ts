import { describe, expect, it } from 'vitest'

import { AsaasClient } from './client.js'
import { createMockFetch } from './core/test-helpers.js'
import {
  AnticipationConfigService,
  AnticipationsService,
} from './services/anticipations/index.js'
import { BillService } from './services/bill/index.js'
import { CardsService } from './services/cards/index.js'
import { ChargebacksService } from './services/chargebacks/index.js'
import {
  CheckoutConfigService,
  CheckoutsService,
} from './services/checkouts/index.js'
import { CustomersService } from './services/customers/index.js'
import { EscrowService } from './services/escrow/index.js'
import { InstallmentsService } from './services/installments/index.js'
import {
  FiscalInfoService,
  InvoicesService,
} from './services/invoices/index.js'
import { NotificationsService } from './services/notifications/index.js'
import { PaymentDocumentsService } from './services/payment-documents/index.js'
import { PaymentLinksService } from './services/payment-links/index.js'
import { PaymentsService } from './services/payments/index.js'
import { PixService } from './services/pix/index.js'
import { SplitsService } from './services/splits/index.js'
import {
  MyAccountService,
  SubaccountsService,
} from './services/subaccounts/index.js'
import { SubscriptionsService } from './services/subscriptions/index.js'
import { TransfersService } from './services/transfers/index.js'

describe('AsaasClient', () => {
  it('normalizes options with defaults', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'cus_1' },
    })

    const client = new AsaasClient({
      accessToken: 'sk_test_123',
      environment: 'SANDBOX',
      fetch,
    })

    await client.customers.get('cus_1')

    const [url, init] = spy.mock.calls[0]
    expect(url.toString()).toContain('api-sandbox.asaas.com')
    expect((init.headers as Record<string, string>)['access_token']).toBe(
      'sk_test_123',
    )
  })

  it('defaults to PRODUCTION environment', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'cus_1' },
    })

    const client = new AsaasClient({ accessToken: 'sk_live_123', fetch })

    await client.customers.get('cus_1')

    expect(spy.mock.calls[0][0].toString()).toContain('api.asaas.com')
  })

  it('applies default timeout and empty userAgent when not provided', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: {} })

    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })

    await client.customers.get('cus_1')

    const init = spy.mock.calls[0][1]
    // Timeout is applied via AbortSignal
    expect(init.signal).toBeDefined()
    // No User-Agent header when userAgent is empty
    expect(
      (init.headers as Record<string, string>)['User-Agent'],
    ).toBeUndefined()
  })

  it('allows baseUrl override', async () => {
    const { fetch, spy } = createMockFetch({
      status: 200,
      body: { id: 'cus_1' },
    })

    const client = new AsaasClient({
      accessToken: 'key',
      baseUrl: 'https://proxy.internal/asaas/v3',
      fetch,
    })

    await client.customers.get('cus_1')

    expect(spy.mock.calls[0][0].toString()).toContain('proxy.internal/asaas/v3')
  })

  it('lazily instantiates the customers service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })

    expect(client.customers).toBeInstanceOf(CustomersService)
    // Same instance on repeated access
    expect(client.customers).toBe(client.customers)
  })

  it('passes userAgent through to requests', async () => {
    const { fetch, spy } = createMockFetch({ status: 200, body: {} })

    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
      userAgent: 'pitstop/2.0',
    })

    await client.customers.get('cus_1')

    expect(
      (spy.mock.calls[0][1].headers as Record<string, string>)['User-Agent'],
    ).toBe('pitstop/2.0')
  })

  it('falls back to globalThis.fetch when no fetch option is provided', () => {
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
    })

    // The client should construct without error even without explicit fetch
    expect(client).toBeInstanceOf(AsaasClient)
  })

  describe('low-level request()', () => {
    it('exposes raw request for domains without dedicated services', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: { id: 'inv_1', status: 'AUTHORIZED' },
      })

      const client = new AsaasClient({
        accessToken: 'key',
        environment: 'SANDBOX',
        fetch,
      })

      const result = await client.request<{ id: string; status: string }>({
        method: 'GET',
        path: '/invoices/inv_1',
      })

      expect(result).toEqual({ id: 'inv_1', status: 'AUTHORIZED' })
      expect(spy.mock.calls[0][0].toString()).toContain('/invoices/inv_1')
    })
  })

  describe('low-level requestBinary()', () => {
    it('exposes raw binary download for domains without dedicated services', async () => {
      const pdfBytes = new Uint8Array([37, 80, 68, 70])
      const mockFetch = (async () =>
        new Response(pdfBytes, {
          status: 200,
          headers: { 'content-type': 'application/pdf' },
        })) as unknown as typeof globalThis.fetch

      const client = new AsaasClient({
        accessToken: 'key',
        environment: 'SANDBOX',
        fetch: mockFetch,
      })

      const result = await client.requestBinary({
        method: 'GET',
        path: '/invoices/inv_1/pdf',
      })

      expect(result.contentType).toBe('application/pdf')
    })
  })

  it('lazily instantiates the payments service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.payments).toBeInstanceOf(PaymentsService)
    expect(client.payments).toBe(client.payments)
  })

  it('lazily instantiates the cards service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.cards).toBeInstanceOf(CardsService)
    expect(client.cards).toBe(client.cards)
  })

  it('lazily instantiates the installments service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.installments).toBeInstanceOf(InstallmentsService)
    expect(client.installments).toBe(client.installments)
  })

  it('lazily instantiates the chargebacks service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.chargebacks).toBeInstanceOf(ChargebacksService)
    expect(client.chargebacks).toBe(client.chargebacks)
  })

  it('lazily instantiates the paymentDocuments service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.paymentDocuments).toBeInstanceOf(PaymentDocumentsService)
    expect(client.paymentDocuments).toBe(client.paymentDocuments)
  })

  it('lazily instantiates the pix service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.pix).toBeInstanceOf(PixService)
    expect(client.pix).toBe(client.pix)
  })

  it('lazily instantiates the subscriptions service', () => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    expect(client.subscriptions).toBeInstanceOf(SubscriptionsService)
    expect(client.subscriptions).toBe(client.subscriptions)
  })

  it.each([
    { name: 'transfers', cls: TransfersService },
    { name: 'subaccounts', cls: SubaccountsService },
    { name: 'myAccount', cls: MyAccountService },
    { name: 'notifications', cls: NotificationsService },
    { name: 'paymentLinks', cls: PaymentLinksService },
    { name: 'checkouts', cls: CheckoutsService },
    { name: 'checkoutConfig', cls: CheckoutConfigService },
    { name: 'splits', cls: SplitsService },
    { name: 'anticipations', cls: AnticipationsService },
    { name: 'anticipationConfig', cls: AnticipationConfigService },
    { name: 'bill', cls: BillService },
    { name: 'escrow', cls: EscrowService },
    { name: 'fiscalInfo', cls: FiscalInfoService },
    { name: 'invoices', cls: InvoicesService },
  ] as const)('lazily instantiates the $name service', ({ name, cls }) => {
    const { fetch } = createMockFetch()
    const client = new AsaasClient({
      accessToken: 'key',
      environment: 'SANDBOX',
      fetch,
    })
    const service = client[name]
    expect(service).toBeInstanceOf(cls)
    expect(client[name]).toBe(service)
  })
})
