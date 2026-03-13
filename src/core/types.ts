/* v8 ignore start -- type-only file, no runtime code */
export type AsaasEnvironment = 'SANDBOX' | 'PRODUCTION'

export interface AsaasClientOptions {
  accessToken: string
  environment?: AsaasEnvironment
  baseUrl?: string
  timeout?: number
  fetch?: typeof globalThis.fetch
  userAgent?: string
}

export interface NormalizedOptions {
  accessToken: string
  baseUrl: string
  timeout: number
  fetch: typeof globalThis.fetch
  userAgent: string
}
