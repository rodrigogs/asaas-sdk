# Copilot instructions for `asaas-sdk`

## Build, test, and lint

- Use Node.js 20+ locally. `package.json` sets `engines.node` to `>=20`, and the SDK depends on native `fetch` and `AbortSignal.timeout`.
- Install dependencies with `npm ci`.
- Build with `npm run build`.
- Lint with `npm run lint`.
- Run all tests with `npm run test`.
- Run only unit tests (`*.spec.ts`) with `npm run test:unit`.
- Run only integration tests (`*.test.ts`) with `npm run test:integration`.
- Run a single unit test file with `npm run test:unit -- src/client.spec.ts`.
- Run a single named test with `npm run test:unit -- src/client.spec.ts -t "normalizes options with defaults"`.
- CI runs unit coverage with `npm run test:unit -- --coverage`.

## High-level architecture

- `src/client.ts` is the main entry point. `AsaasClient` normalizes options once, exposes low-level `request()` / `requestBinary()` escape hatches, and lazily instantiates one service per API domain.
- `src/core/` holds the shared infrastructure:
  - `http.ts` builds URLs, headers, JSON/multipart/binary requests, and wraps failures in the SDK error types.
  - `base-service.ts` is the common superclass for domain services and provides `_request`, `_list`, `_requestMultipart`, and `_requestBinary`.
  - `pagination.ts` implements `PaginatedList`, which exposes both first-page metadata and async iteration across further pages.
  - `errors.ts`, `constants.ts`, and `types.ts` define the shared runtime/types layer used by all services.
- `src/services/` is organized by Asaas API domain. Most domains follow a `service.ts` + `types.ts` + `index.ts` layout. More complex domains can expose nested service groups; `pix` is the main example, with sub-services for keys, QR codes, automatic flows, transactions, and recurring operations.
- `src/index.ts` is the curated public runtime API. It re-exports `AsaasClient`, the error classes, pagination types, and the webhook auth header constant.
- `src/types.ts` is the curated public type barrel. When adding or changing a domain, keep the runtime exports in `src/index.ts` and the type exports in `src/types.ts` aligned.
- The package is ESM-only and publishes only `dist/`.

## Key conventions

- Keep source imports ESM-compatible by using `.js` specifiers inside TypeScript files (`import { X } from './file.js'`). This is required by the `nodenext` TypeScript setup and current source style.
- Do not add default exports. ESLint forbids them except in `vitest.config.ts`.
- New API surface usually requires changes in several places, not just one file:
  - add/update the domain implementation under `src/services/<domain>/`
  - expose the service from `src/client.ts` if it should be reachable from `AsaasClient`
  - expose public runtime exports from `src/index.ts` when needed
  - expose public types from `src/types.ts`
- Prefer extending `BaseService` and using its helpers instead of calling `fetch` directly:
  - `_request` for JSON endpoints
  - `_list` for paginated endpoints
  - `_requestMultipart` for file uploads such as payment documents
  - `_requestBinary` for downloads
- `list()` methods are expected to return `PaginatedList<T>`, not raw arrays, and they normally forward `offset`/`limit` plus any defined filters to `_list`.
- Tests are colocated with source:
  - unit tests use `*.spec.ts`
  - integration tests use `*.test.ts`
  - shared fetch fixtures live in `src/core/test-helpers.ts`
- Existing tests validate HTTP details directly (path, method, query string, and serialized body) using `createMockFetch()`. Follow that pattern when adding service coverage.
- Public API curation matters: `src/index.spec.ts` asserts that internals such as `request`, `requestBinary`, `BaseService`, and `normalizeOptions` stay private.
