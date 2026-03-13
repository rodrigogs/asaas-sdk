export interface PaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  offset: number
  limit: number
  data: T[]
}

export interface PaginationParams {
  offset?: number
  limit?: number
}

type FetchPage<T> = (params: PaginationParams) => Promise<PaginatedResponse<T>>

class PageIterator<T> implements AsyncIterator<T> {
  private currentPage: PaginatedResponse<T> | null
  private index = 0
  private nextOffset: number

  constructor(
    firstPage: PaginatedResponse<T>,
    private readonly limit: number,
    private readonly fetchPage: FetchPage<T>,
  ) {
    this.currentPage = firstPage
    this.nextOffset = firstPage.offset + firstPage.data.length
  }

  async next(): Promise<IteratorResult<T>> {
    if (!this.currentPage) {
      return { done: true, value: undefined }
    }

    if (this.index < this.currentPage.data.length) {
      const value = this.currentPage.data[this.index]!
      this.index++
      return { done: false, value }
    }

    if (this.currentPage.hasMore) {
      this.currentPage = await this.fetchPage({
        offset: this.nextOffset,
        limit: this.limit,
      })
      this.nextOffset += this.currentPage.data.length
      this.index = 0
      return this.next()
    }

    this.currentPage = null
    return { done: true, value: undefined }
  }
}

export class PaginatedList<T> implements AsyncIterable<T> {
  readonly data: T[]
  readonly hasMore: boolean
  readonly totalCount: number

  private readonly response: PaginatedResponse<T>
  private readonly limit: number
  private readonly fetchPage: FetchPage<T>

  constructor(
    response: PaginatedResponse<T>,
    limit: number,
    fetchPage: FetchPage<T>,
  ) {
    this.data = response.data
    this.hasMore = response.hasMore
    this.totalCount = response.totalCount
    this.response = response
    this.limit = limit
    this.fetchPage = fetchPage
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return new PageIterator(this.response, this.limit, this.fetchPage)
  }

  async toArray(options?: { limit?: number }): Promise<T[]> {
    const max = options?.limit ?? 10_000
    const items: T[] = []

    for await (const item of this) {
      items.push(item)
      if (items.length >= max) break
    }

    return items
  }
}
