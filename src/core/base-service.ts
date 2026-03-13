import {
  type BinaryResponse,
  type MultipartConfig,
  request,
  requestBinary,
  type RequestConfig,
  requestMultipart,
} from './http.js'
import {
  PaginatedList,
  type PaginatedResponse,
  type PaginationParams,
} from './pagination.js'
import type { NormalizedOptions } from './types.js'

const DEFAULT_PAGE_LIMIT = 20

export class BaseService {
  constructor(protected readonly options: NormalizedOptions) {}

  protected _request<T>(config: RequestConfig): Promise<T> {
    return request<T>(this.options, config)
  }

  protected async _list<T>(
    path: string,
    params?: PaginationParams & Record<string, unknown>,
  ): Promise<PaginatedList<T>> {
    const { offset: rawOffset, limit: rawLimit, ...filters } = params ?? {}
    const limit = rawLimit ?? DEFAULT_PAGE_LIMIT
    const offset = rawOffset ?? 0

    const queryFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined),
    ) as Record<string, string | number | boolean>

    const fetchPage = (p: PaginationParams) =>
      request<PaginatedResponse<T>>(this.options, {
        method: 'GET',
        path,
        query: { ...queryFilters, offset: p.offset, limit: p.limit },
      })

    const firstPage = await fetchPage({ offset, limit })
    return new PaginatedList(firstPage, limit, fetchPage)
  }

  protected _requestMultipart<T>(config: MultipartConfig): Promise<T> {
    return requestMultipart<T>(this.options, config)
  }

  protected _requestBinary(config: RequestConfig): Promise<BinaryResponse> {
    return requestBinary(this.options, config)
  }
}
