# Pagination

The Asaas SDK provides powerful pagination utilities to help you efficiently work with large datasets from the Asaas API.

## How Pagination Works

The Asaas API uses offset-based pagination. All `.list()` methods in the SDK accept optional `offset` and `limit` parameters and return a `PaginatedList<T>` instance that wraps the API's paginated response.

## PaginatedList<T>

The `PaginatedList<T>` class wraps paginated responses from the API. It implements `AsyncIterable<T>`, enabling automatic page fetching as you iterate through results.

### Properties

- **`data`** (`T[]`) - Items from the current/first page
- **`hasMore`** (`boolean`) - Whether more pages exist
- **`totalCount`** (`number`) - Total number of items across all pages

### Raw Response Shape

Under the hood, the API returns a `PaginatedResponse<T>`:

```ts
interface PaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  offset: number
  limit: number
  data: T[]
}
```

The `PaginatedList` class wraps this response and provides convenient methods for working with paginated data.

## Basic Usage

List resources with default pagination settings:

```ts
const result = await asaas.customers.list()

console.log(result.data)        // Items from the first page
console.log(result.totalCount)  // Total items across all pages
console.log(result.hasMore)     // true if more pages exist
```

## Manual Pagination

Control pagination manually using `offset` and `limit` parameters:

```ts
const page1 = await asaas.customers.list({ limit: 10, offset: 0 })
const page2 = await asaas.customers.list({ limit: 10, offset: 10 })
const page3 = await asaas.customers.list({ limit: 10, offset: 20 })
```

This approach gives you full control over which pages to fetch, but requires manual tracking of offsets.

## Auto-Pagination with for-await

The `PaginatedList` class implements `AsyncIterable<T>`, allowing you to iterate over all items across all pages automatically:

```ts
const customers = await asaas.customers.list({ limit: 50 })

for await (const customer of customers) {
  console.log(customer.name)
  // Automatically fetches next pages as needed
}
```

### How Auto-Pagination Works

- The first page is fetched immediately when `.list()` is called
- Subsequent pages are fetched lazily as you iterate through items
- The same `limit` used in the initial request is applied to all subsequent page fetches
- Pages are only fetched when the previous page's items have been consumed (respects backpressure)

This is the recommended approach for processing large datasets efficiently.

## Collecting All Items with toArray()

Use the `toArray()` method to collect all items from all pages into a single array:

```ts
const allCustomers = await asaas.customers.list().then(r => r.toArray())
```

### Safety Limits

To prevent runaway fetches that could consume excessive memory or API quota, `toArray()` has a built-in safety limit:

```ts
// Default safety limit: 10,000 items
const all = await result.toArray()

// Custom limit
const first500 = await result.toArray({ limit: 500 })
```

If the total number of items exceeds the limit, `toArray()` will throw an error to prevent accidentally fetching more data than intended.

## Filtering with Pagination

List methods accept domain-specific filter parameters alongside pagination parameters. Filters are applied on the API side before pagination.

### Example: Filtering Payments

```ts
const overduePayments = await asaas.payments.list({
  status: 'OVERDUE',
  dueDate: { ge: '2024-01-01', le: '2024-12-31' },
  limit: 100,
})

// Process filtered results with auto-pagination
for await (const payment of overduePayments) {
  console.log(`Overdue: ${payment.id} - ${payment.value}`)
}
```

### Example: Filtering Customers

```ts
const activeCustomers = await asaas.customers.list({
  name: 'Silva',
  email: 'example.com',
  limit: 50,
})
```

Filters are specific to each resource type. Refer to the resource-specific documentation for available filter options.

## Best Practices

### Use Appropriate Page Sizes

Choose a `limit` that balances network efficiency with memory usage:

```ts
// Small page size: more API calls, less memory
const smallPages = await asaas.customers.list({ limit: 10 })

// Large page size: fewer API calls, more memory
const largePages = await asaas.customers.list({ limit: 100 })
```

The API's default `limit` varies by endpoint. Consult the Asaas API documentation for endpoint-specific defaults.

### Prefer for-await Over toArray() for Large Datasets

For large datasets, use `for await...of` instead of `toArray()` to process items as they arrive:

```ts
// Good: processes items as pages are fetched
for await (const customer of customers) {
  await processCustomer(customer)
}

// Avoid: loads all items into memory first
const all = await customers.toArray()
all.forEach(customer => processCustomer(customer))
```

### Respect API Rate Limits

When auto-paginating through large datasets, be aware that each page fetch counts as an API request. The iterator fetches pages sequentially, which naturally provides some rate limiting, but consider implementing additional rate limiting logic if processing very large datasets.

### Handle Errors During Iteration

Wrap auto-pagination in try-catch blocks to handle network errors or API failures:

```ts
try {
  for await (const customer of customers) {
    await processCustomer(customer)
  }
} catch (error) {
  console.error('Error during pagination:', error)
}
```

## Examples

### Example 1: Export All Customers to CSV

```ts
const customers = await asaas.customers.list({ limit: 100 })

const csvRows = ['Name,Email,CPF/CNPJ']

for await (const customer of customers) {
  csvRows.push(`${customer.name},${customer.email},${customer.cpfCnpj}`)
}

await fs.writeFile('customers.csv', csvRows.join('\n'))
```

### Example 2: Find Specific Payment

```ts
const payments = await asaas.payments.list({
  customer: 'cus_123456',
  limit: 50,
})

for await (const payment of payments) {
  if (payment.invoiceNumber === 'INV-2024-001') {
    console.log('Found payment:', payment)
    break // Stop iterating once found
  }
}
```

### Example 3: Process Batches with Manual Pagination

```ts
let offset = 0
const limit = 100

while (true) {
  const batch = await asaas.customers.list({ offset, limit })

  // Process batch
  await processBatch(batch.data)

  if (!batch.hasMore) break

  offset += limit
}
```

## Summary

- Use `offset` and `limit` parameters to control pagination manually
- Use `for await...of` to automatically iterate through all pages
- Use `toArray()` to collect all items (with safety limits)
- Combine filters with pagination parameters for targeted queries
- The iterator respects backpressure and fetches pages lazily
- Choose appropriate page sizes based on your use case
- Handle errors during iteration for robust applications
