import { describe, expect, it } from 'vitest'

import { PaginatedList } from '../../core/pagination.js'
import { createMockFetch, createTestOptions } from '../../core/test-helpers.js'
import { FiscalInfoService } from './fiscal-info.js'

function createService(fetch: typeof globalThis.fetch) {
  return new FiscalInfoService(createTestOptions({ fetch }))
}

describe('FiscalInfoService', () => {
  describe('getMunicipalOptions', () => {
    it('sends GET /fiscalInfo/municipalOptions', async () => {
      const mockOptions = {
        authenticationType: 'CERTIFICATE',
        supportsCancellation: true,
        usesSpecialTaxRegimes: false,
        usesServiceListItem: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockOptions,
      })
      const service = createService(fetch)

      const result = await service.getMunicipalOptions()

      expect(result).toEqual(mockOptions)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/fiscalInfo/municipalOptions')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('upsert', () => {
    it('sends POST /fiscalInfo as multipart with required fields', async () => {
      const mockInfo = {
        email: 'test@example.com',
        simplesNacional: true,
        passwordSent: false,
        accessTokenSent: false,
        certificateSent: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInfo,
      })
      const service = createService(fetch)

      const result = await service.upsert({
        email: 'test@example.com',
        simplesNacional: true,
      })

      expect(result).toEqual(mockInfo)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/fiscalInfo')
      expect(init.method).toBe('POST')
      expect(init.body).toBeInstanceOf(FormData)
      const formData = init.body as FormData
      expect(formData.get('email')).toBe('test@example.com')
      expect(formData.get('simplesNacional')).toBe('true')
    })

    it('includes optional fields and certificate in multipart', async () => {
      const mockInfo = {
        email: 'test@example.com',
        simplesNacional: false,
        municipalInscription: '12345',
        certificateSent: true,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInfo,
      })
      const service = createService(fetch)

      const cert = new Blob(['cert content'], {
        type: 'application/x-pkcs12',
      })
      await service.upsert({
        email: 'test@example.com',
        simplesNacional: false,
        municipalInscription: '12345',
        culturalProjectsPromoter: true,
        cnae: '6201-5/01',
        specialTaxRegime: 'MICROEMPRESA_MUNICIPAL',
        serviceListItem: '01.01',
        nbsCode: '1.0101',
        rpsSerie: 'A1',
        rpsNumber: 100,
        loteNumber: 50,
        username: 'nfe-user',
        password: 'nfe-pass',
        accessToken: 'tok_123',
        certificateFile: cert,
        certificatePassword: 'secret',
        nationalPortalTaxCalculationRegime: 'NATIONWIDE',
      })

      const formData = spy.mock.calls[0][1].body as FormData
      expect(formData.get('municipalInscription')).toBe('12345')
      expect(formData.get('culturalProjectsPromoter')).toBe('true')
      expect(formData.get('cnae')).toBe('6201-5/01')
      expect(formData.get('specialTaxRegime')).toBe('MICROEMPRESA_MUNICIPAL')
      expect(formData.get('serviceListItem')).toBe('01.01')
      expect(formData.get('nbsCode')).toBe('1.0101')
      expect(formData.get('rpsSerie')).toBe('A1')
      expect(formData.get('rpsNumber')).toBe('100')
      expect(formData.get('loteNumber')).toBe('50')
      expect(formData.get('username')).toBe('nfe-user')
      expect(formData.get('password')).toBe('nfe-pass')
      expect(formData.get('accessToken')).toBe('tok_123')
      expect(formData.get('certificateFile')).toBeInstanceOf(Blob)
      expect(formData.get('certificatePassword')).toBe('secret')
      expect(formData.get('nationalPortalTaxCalculationRegime')).toBe(
        'NATIONWIDE',
      )
    })
  })

  describe('get', () => {
    it('sends GET /fiscalInfo', async () => {
      const mockInfo = {
        email: 'test@example.com',
        simplesNacional: true,
        passwordSent: false,
        accessTokenSent: true,
        certificateSent: false,
      }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockInfo,
      })
      const service = createService(fetch)

      const result = await service.get()

      expect(result).toEqual(mockInfo)
      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/fiscalInfo')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })
  })

  describe('configureNationalPortal', () => {
    it('sends POST /fiscalInfo/nationalPortal with enabled flag', async () => {
      const mockConfig = { enabled: true }
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: mockConfig,
      })
      const service = createService(fetch)

      const result = await service.configureNationalPortal({ enabled: true })

      expect(result.enabled).toBe(true)
      const [url, init] = spy.mock.calls[0]
      expect(url.toString()).toContain('/fiscalInfo/nationalPortal')
      expect(init.method).toBe('POST')
      const body = JSON.parse(init.body as string)
      expect(body.enabled).toBe(true)
    })
  })

  describe('listMunicipalServices', () => {
    it('sends GET /fiscalInfo/services and returns PaginatedList', async () => {
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
              id: 'svc_1',
              description: 'Desenvolvimento de software',
              issTax: 2.0,
            },
            { id: 'svc_2', description: 'Consultoria', issTax: 5.0 },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listMunicipalServices()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(2)
      expect(result.data[0]!.description).toBe('Desenvolvimento de software')

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/fiscalInfo/services')
      expect(spy.mock.calls[0][1].method).toBe('GET')
    })

    it('passes description filter', async () => {
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

      await service.listMunicipalServices({
        limit: 10,
        description: 'software',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('description=software')
    })
  })

  describe('listTaxSituationCodes', () => {
    it('sends GET /fiscalInfo/taxSituationCodes and returns PaginatedList', async () => {
      const { fetch, spy } = createMockFetch({
        status: 200,
        body: {
          object: 'list',
          hasMore: false,
          totalCount: 1,
          offset: 0,
          limit: 20,
          data: [
            {
              code: '01',
              description: 'Tributacao normal',
              isSubjectToIbsCbsTaxation: true,
              isBaseReductionPercentApplicable: false,
              isDefermentApplicable: false,
            },
          ],
        },
      })
      const service = createService(fetch)

      const result = await service.listTaxSituationCodes()

      expect(result).toBeInstanceOf(PaginatedList)
      expect(result.data).toHaveLength(1)
      expect(result.data[0]!.code).toBe('01')
      expect(result.data[0]!.isSubjectToIbsCbsTaxation).toBe(true)

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('/fiscalInfo/taxSituationCodes')
    })

    it('passes code and description filters', async () => {
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

      await service.listTaxSituationCodes({
        limit: 10,
        code: '01',
        description: 'Tributacao',
      })

      const url = spy.mock.calls[0][0].toString()
      expect(url).toContain('code=01')
      expect(url).toContain('description=Tributacao')
    })
  })
})
