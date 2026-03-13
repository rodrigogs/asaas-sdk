# Documentation Gaps Resolution

> Date: 2026-03-13

## Problem

The asaas-sdk open-source documentation covers infrastructure well (setup, errors, pagination, webhooks) but has zero service-specific guidance. The original internal design docs contain ~8,700 lines of domain knowledge across 14 files. Developers using the SDK must currently leave to the official Asaas docs for any service-specific context.

## Goals

- Provide hybrid documentation (conceptual intro + method reference + examples) for all 22 SDK services
- Cover cross-cutting concerns: rate limits, sandbox limitations, security best practices
- Enhance existing docs (error-handling, webhooks) with missing details
- Maintain bilingual parity (English + Portuguese)
- Target 400 lines per file, hard max 500 lines for complex domains (payments)

## Approach

Grouped service docs by business domain (6 files) plus 3 standalone cross-cutting guides, plus edits to 2 existing files. All mirrored in both languages.

## File Structure

```
docs/
  en/
    getting-started.md        (existing, no changes)
    error-handling.md          (existing, enhance)
    pagination.md              (existing, no changes)
    webhooks.md                (existing, enhance)
    rate-limits.md             (NEW)
    sandbox.md                 (NEW)
    security.md                (NEW)
    services/
      payments.md              (NEW)
      pix.md                   (NEW)
      subscriptions.md         (NEW)
      financial.md             (NEW)
      accounts.md              (NEW)
      commerce.md              (NEW)
  pt/
    (mirror of en/)
```

Total: 9 new files + 2 edits per language = 22 file operations.

## Service Doc Template

Each service doc follows this structure:

```markdown
# {Domain Title}

Brief intro (2-3 sentences).

## Key Concepts
- Status lifecycles (state list)
- Business rules
- Enum tolerance notes

## {ServiceName}

Brief description.

### Methods

| Method | Description |
|--------|-------------|
| `create(params)` | Creates a ... |
| `list(params?)` | Lists ... (paginated) |

### Examples
1-2 realistic code examples.

### Sandbox Limitations
What works / doesn't in sandbox.

(Repeat per service in the group)

## Related
Links to other docs (always include [Pagination](../pagination.md)) and official Asaas docs.
```

Template rules:
- Sub-service sections must show the full accessor chain in the first example (e.g., `client.pix.keys.create(...)`, not just `keys.create(...)`)
- Methods returning `BinaryResponse` (e.g., `downloadPaymentBook`) must include a file-save example
- Write EN first, then translate to PT. Code examples are identical in both languages (only prose and comments change)

## Service Groupings

### services/payments.md
Services: payments, cards, installments, chargebacks, paymentDocuments

Content from: `03-cobrancas.md`

Key concepts:
- Payment CRUD with soft delete/restore
- billingType enums (create vs read differ)
- Boleto flow (bankSlipUrl, identificationField, nossoNumero)
- Credit card flow (direct capture, redirect to invoiceUrl, 60s timeout)
- Tokenization (POST /creditCard/tokenizeCreditCard)
- Pre-authorization (authorizedOnly: true, 3-day capture window)
- Pre-authorization config endpoints
- Installments as separate resource (CRUD + paymentBook + refund)
- Refunds (payment-level, bank slip-specific, installment-level)
- Chargebacks (list, dispute with multipart file upload, max 11 files)
- Payment documents (multipart upload, CRUD)
- Cash receipt confirmation/undo
- Simulate and limits endpoints
- Status enum: PENDING, RECEIVED, CONFIRMED, OVERDUE, REFUNDED, etc.

### services/pix.md
Services: pix (with sub-services: keys, staticQrCodes, qrCodes, transactions, automatic, recurring)

Content from: `04-pix.md`

Key concepts:
- Pix key types and registration
- Dynamic QR Code (tied to payment) vs Static QR Code (standalone)
- Transaction lifecycle and statuses
- Automatic Pix (pre-authorized recurring)
- Recurring Pix (SDK-managed recurrence)
- Difference between Automatic Pix, Recurring Pix, and Subscriptions
- QR Code decode and pay
- Sandbox: must register a key before testing QR Code payment

### services/subscriptions.md
Services: subscriptions (with invoice settings sub-service)

Content from: `05-assinaturas.md`

Key concepts:
- Cycle types (WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, SEMIANNUALLY, YEARLY)
- Credit card subscription (create with card data)
- Update credit card without charging
- Charge generation rules
- Invoice settings for automatic NF-e issuance
- Subscription payment listing and booklet generation (downloadPaymentBook returns BinaryResponse — include file-save example)
- Split handling on recurring charges
- Status lifecycle

### services/financial.md
Services: transfers, bill, escrow, splits, anticipations, anticipationConfig

Content from: `08-transferencias.md`, `11-split-e-antecipacoes.md`, `13-pague-contas-e-escrow.md`

Key concepts:
- Transfers: bank account vs Asaas account vs Pix key
- Transfer validation webhook for compliance
- Wallet ID retrieval
- Bill payments: create, simulate, cancel (barcode-based)
- Escrow: default config, per-subaccount config, payment escrow finish
- Splits: paid vs received queries, statistics
- Anticipations: request, simulate, limits, cancel
- Anticipation config: automatic anticipation enable/disable
- TED cutoff rules (after 15h scheduled for next day)

### services/accounts.md
Services: customers, subaccounts, myAccount, notifications

Content from: `02-clientes.md`, `09-subcontas.md`, `12-notificacoes.md`

Key concepts:
- Customer CRUD with soft delete/restore
- Customer notifications (per-event enable/disable, batch update)
- Subaccount creation (regular vs white-label)
- Subaccount API key management
- Document submission for approval
- Registration status checking
- Commercial info (business data) management
- MyAccount: registration status, document management, commercial info, white-label deletion (note: webhook CRUD does not exist on myAccount/subaccounts yet — remove incorrect examples from existing webhooks.md)
- Notification events and default behavior

### services/commerce.md
Services: paymentLinks, checkouts, checkoutConfig, invoices, fiscalInfo

Content from: `10-links-de-pagamento-e-checkout.md`, `07-notas-fiscais.md`

Key concepts:
- Payment links: CRUD with restore, image sub-service (paymentLinks.images: add, list, get, remove, setMain)
- Checkout: creation, cancellation, customer data handling
- Checkout config: personalization (colors, logo, etc.)
- Fiscal info: upsert, municipal services lookup, tax situation codes
- National portal configuration
- Invoices: schedule, list, update, issue (authorize), cancel
- Invoice taxes and municipal service codes
- Subscription-linked invoice auto-issuance (covered in subscriptions.md, cross-linked)

## Standalone Guides

### rate-limits.md
Content from: `01-fundacoes-http-seguranca-e-ambientes.md`

Sections:
- Three types of limits: concurrent requests, 12-hour rolling quota (~25,000), per-endpoint
- RateLimit-* response headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset
- How AsaasApiError.isRateLimit ties in
- Backoff strategy example
- Polling avoidance (use webhooks instead)

### sandbox.md
Content from: `01-fundacoes-http-seguranca-e-ambientes.md` + sandbox sections across all domain docs

Sections:
- API key format: $aact_hmlg_ (sandbox) vs $aact_prod_ (production)
- Testability matrix table (domain x testable)
- Known sandbox quirks per domain
- Setting up sandbox account
- Link to official sandbox docs

### security.md
Content from: `01-fundacoes-http-seguranca-e-ambientes.md`, `08-transferencias.md`

Sections:
- API key management (separate keys, rotation)
- IP whitelist setup
- Official Asaas IPs for webhook verification
- Transfer validation webhook pattern
- HTTPS requirement for credit card capture
- PCI-DSS note for direct card data handling

## Enhancements to Existing Files

### error-handling.md (both languages)
Add:
- Rate limit error section with header parsing example
- Distinction between IP whitelist 403 vs permission 403
- Link to rate-limits.md for full details

### webhooks.md (both languages)
Add:
- Complete event catalog organized by domain (payments, subscriptions, transfers, invoices, bills, anticipations, account status, checkout, Pix automatic, API keys, balance blocks, internal movements)
- Webhook queue management: penalty system, queue pause conditions, reactivation
- Idempotency guidance: use event ID field, not payment ID
- Sequential vs non-sequential delivery semantics (expanded from current brief mention)

## README Updates

Both README.md and README.pt.md get expanded Documentation sections:

```markdown
## Documentation

### Guides
- [Getting Started](./docs/en/getting-started.md)
- [Error Handling](./docs/en/error-handling.md)
- [Pagination](./docs/en/pagination.md)
- [Webhooks](./docs/en/webhooks.md)
- [Rate Limits](./docs/en/rate-limits.md)
- [Sandbox](./docs/en/sandbox.md)
- [Security](./docs/en/security.md)

### Services
- [Payments, Cards, Installments & Chargebacks](./docs/en/services/payments.md)
- [Pix](./docs/en/services/pix.md)
- [Subscriptions](./docs/en/services/subscriptions.md)
- [Transfers, Bills, Escrow, Splits & Anticipations](./docs/en/services/financial.md)
- [Customers, Subaccounts & Notifications](./docs/en/services/accounts.md)
- [Payment Links, Checkouts & Invoices](./docs/en/services/commerce.md)

- [Official Asaas API Docs](https://docs.asaas.com/)
```

## Source Material Mapping

| New file | Old doc sources |
|----------|----------------|
| services/payments.md | 03-cobrancas.md |
| services/pix.md | 04-pix.md |
| services/subscriptions.md | 05-assinaturas.md |
| services/financial.md | 08-transferencias.md, 11-split-e-antecipacoes.md, 13-pague-contas-e-escrow.md |
| services/accounts.md | 02-clientes.md, 09-subcontas.md, 12-notificacoes.md |
| services/commerce.md | 10-links-de-pagamento-e-checkout.md, 07-notas-fiscais.md |
| rate-limits.md | 01-fundacoes-http-seguranca-e-ambientes.md |
| sandbox.md | 01-fundacoes + sandbox sections from all domain docs |
| security.md | 01-fundacoes, 08-transferencias.md |
| error-handling.md (edit) | 01-fundacoes |
| webhooks.md (edit) | 06-webhooks.md |
| (excluded) 00-visao-geral.md | Internal planning doc — not applicable to SDK user docs |
| (excluded) 99-fontes-e-referencias.md | Internal audit trail — official URLs used as cross-references in Related sections |

## Enhancements to Existing Files — Mitigation for Size

The enhanced files (error-handling.md at 370 lines, webhooks.md at 320 lines) will exceed the 400-line target. Mitigations:

- **error-handling.md**: Move the existing "Retry Pattern" section (full `withRetry` helper, ~70 lines) into the new `rate-limits.md` guide. Replace with a brief cross-reference. This frees ~70 lines for the new rate limit error content.
- **webhooks.md**: Keep the event catalog as a summary table (event name + description, one line each) rather than expanded sections. Link to official Asaas event docs for full payloads. This keeps the addition under ~80 lines.

## Implementation Notes

- All new files created in both en/ and pt/ simultaneously
- Service docs use actual method names from the SDK source code
- Code examples use realistic Brazilian data (CPF, BRL, Sao Paulo addresses)
- Each service section includes sandbox limitations inline (not just in sandbox.md)
- Pagination patterns in examples use the correct `await` + `for await` pattern
- Error getter examples use property access (not method calls): `error.isAuth` not `error.isAuth()`
- Document `client.request<T>(config)` and `client.requestBinary(config)` escape hatches in getting-started.md (brief section for unsupported endpoints)
