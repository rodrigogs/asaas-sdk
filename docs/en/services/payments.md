# Payments Domain

This guide covers the five services that compose the Payments domain in the Asaas SDK: Payments, Cards, Installments, Chargebacks, and Payment Documents.

## Table of Contents

- [Payments Service](#payments-service)
- [Cards Service](#cards-service)
- [Installments Service](#installments-service)
- [Chargebacks Service](#chargebacks-service)
- [Payment Documents Service](#payment-documents-service)
- [Related Resources](#related-resources)

## Payments Service

The Payments service (`client.payments`) handles the complete lifecycle of payment charges, including creation, updates, soft deletion, restoration, and various payment-specific operations.

### Key Concepts

**Billing Types**

When creating a payment, you can specify:
- `UNDEFINED` - Customer chooses payment method
- `BOLETO` - Bank slip (boleto bancario)
- `CREDIT_CARD` - Credit card
- `PIX` - Instant payment

When reading payment data, additional types may be returned:
- `DEBIT_CARD` - Debit card
- `TRANSFER` - Bank transfer
- `DEPOSIT` - Deposit

**Payment Status**

Payments progress through various statuses. Note that this is a string union, not a closed enum, as Asaas may introduce new statuses:

- `PENDING` - Awaiting payment
- `RECEIVED` - Payment received
- `CONFIRMED` - Payment confirmed
- `OVERDUE` - Payment overdue
- `REFUNDED` - Payment refunded
- `RECEIVED_IN_CASH` - Cash payment received
- `REFUND_REQUESTED` - Refund requested
- `REFUND_IN_PROGRESS` - Refund in progress
- `CHARGEBACK_REQUESTED` - Chargeback requested
- `CHARGEBACK_DISPUTE` - Chargeback under dispute
- `AWAITING_CHARGEBACK_REVERSAL` - Awaiting chargeback reversal
- `DUNNING_REQUESTED` - Dunning requested
- `DUNNING_RECEIVED` - Dunning received
- `AWAITING_RISK_ANALYSIS` - Under risk analysis

**Boleto Flow**

When creating a boleto payment, the response includes:
- `bankSlipUrl` - URL to view/download the boleto PDF
- `identificationField` - Barcode/digitable line for payment
- `nossoNumero` - Bank identification number

**Credit Card Flow**

Two ways to process credit card payments:

1. **Direct capture**: Include `creditCard`, `creditCardHolderInfo`, and `remoteIp` in the creation request for immediate processing. Recommend a 60-second timeout.
2. **Redirect**: Use the `invoiceUrl` returned in the response to redirect the customer to Asaas's payment page.

**Soft Delete**

Payments use soft deletion. Use `remove()` to mark as deleted and `restore()` to reactivate.

### Methods Reference

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new payment charge |
| `get(id)` | Retrieve a payment by ID |
| `list(params?)` | List payments with optional filters (paginated) |
| `update(id, params)` | Update an existing payment |
| `remove(id)` | Soft-delete a payment |
| `restore(id)` | Restore a previously deleted payment |
| `getStatus(id)` | Get the current status of a payment |
| `getBillingInfo(id)` | Retrieve billing information |
| `getIdentificationField(id)` | Get boleto barcode/digitable line |
| `getViewingInfo(id)` | Get viewing information for the payment |
| `confirmCashReceipt(id, params)` | Confirm a cash payment receipt |
| `undoCashReceipt(id)` | Undo a cash receipt confirmation |
| `refund(id, params?)` | Refund a payment (full or partial) |
| `refundBankSlip(id)` | Refund a boleto payment specifically |
| `listRefunds(id)` | List all refunds for a payment (paginated) |
| `getChargeback(id)` | Get chargeback information for a payment |
| `simulate(params)` | Simulate payment fees before creation |
| `getLimits()` | Get current payment creation limits |

### Examples

#### Create a Boleto Payment

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
});

const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 150.00,
  dueDate: '2026-04-15',
  description: 'Monthly service fee',
  externalReference: 'ORDER-12345',
});

console.log('Boleto URL:', payment.bankSlipUrl);
console.log('Barcode:', payment.identificationField);
console.log('Nosso Número:', payment.nossoNumero);
```

#### Create a PIX Payment

```typescript
const pixPayment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'PIX',
  value: 250.00,
  dueDate: '2026-03-20',
  description: 'Product purchase',
});

// Get PIX QR Code information
const pixQrCode = await client.pix.getQrCode(pixPayment.id);
console.log('PIX QR Code:', pixQrCode.payload);
console.log('QR Code Image:', pixQrCode.encodedImage);
```

#### Create Credit Card Payment with Direct Capture

```typescript
const creditCardPayment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 500.00,
  dueDate: '2026-03-25',
  description: 'Premium subscription',
  creditCard: {
    holderName: 'João Silva',
    number: '5162306219378829',
    expiryMonth: '12',
    expiryYear: '2028',
    ccv: '318',
  },
  creditCardHolderInfo: {
    name: 'João Silva',
    email: 'joao@example.com',
    cpfCnpj: '12345678901',
    postalCode: '01310-100',
    addressNumber: '123',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
});

console.log('Payment status:', creditCardPayment.status);
```

#### Refund a Payment

```typescript
// Full refund
await client.payments.refund(payment.id);

// Partial refund
await client.payments.refund(payment.id, {
  value: 50.00,
  description: 'Partial refund for cancelled item',
});

// List all refunds for a payment
const refunds = await client.payments.listRefunds(payment.id);
for (const refund of refunds.data) {
  console.log(`Refund: ${refund.value} - Status: ${refund.status}`);
}
```

#### Update Payment Details

```typescript
const updated = await client.payments.update(payment.id, {
  value: 175.00,
  dueDate: '2026-04-20',
  description: 'Updated monthly service fee',
});
```

#### Confirm Cash Receipt

```typescript
await client.payments.confirmCashReceipt(payment.id, {
  paymentDate: '2026-03-13',
  value: 150.00,
  notifyCustomer: true,
});

// If needed, undo the confirmation
await client.payments.undoCashReceipt(payment.id);
```

#### Simulate Payment Fees

```typescript
const simulation = await client.payments.simulate({
  billingType: 'CREDIT_CARD',
  value: 1000.00,
  installmentCount: 3,
});

console.log('Net value:', simulation.netValue);
console.log('Fee:', simulation.fee);
console.log('Installments:', simulation.installments);
```

#### Check Payment Limits

```typescript
const limits = await client.payments.getLimits();
console.log('Daily limit:', limits.dailyLimit);
console.log('Used today:', limits.dailyUsed);
console.log('Available:', limits.dailyAvailable);
```

### Sandbox Testing

Most payment operations are fully testable in the sandbox environment. However, the following features are NOT available for testing:

- Boleto QR Code layout
- Discount configurations on boleto
- Interest and fine calculations on boleto
- Interest and fine calculations on PIX

## Cards Service

The Cards service (`client.cards`) handles credit card tokenization, payment processing, and pre-authorization flows.

### Key Concepts

**Card Tokenization**

Store card data securely for future use. Tokenized cards are tied to a specific customer and cannot be reused across different customers.

**Pre-Authorization**

Create a payment with `authorizedOnly: true` to pre-authorize the amount without capturing. You must capture within 3 days or the authorization expires.

**Security Requirements**

When capturing card data through your own interface (not Asaas's hosted page), you MUST use HTTPS to ensure secure transmission of sensitive payment information.

### Methods Reference

| Method | Description |
|--------|-------------|
| `payWithCreditCard(paymentId, params)` | Pay an existing payment using credit card |
| `tokenize(params)` | Tokenize a credit card for future use |
| `captureAuthorizedPayment(paymentId)` | Capture a pre-authorized payment |
| `getPreAuthorizationConfig()` | Get pre-authorization configuration |
| `updatePreAuthorizationConfig(params)` | Update pre-authorization settings |

### Examples

#### Tokenize a Credit Card

```typescript
const tokenizedCard = await client.cards.tokenize({
  customer: 'cus_000005836142',
  creditCard: {
    holderName: 'Maria Santos',
    number: '5162306219378829',
    expiryMonth: '06',
    expiryYear: '2027',
    ccv: '123',
  },
  creditCardHolderInfo: {
    name: 'Maria Santos',
    email: 'maria@example.com',
    cpfCnpj: '98765432100',
    postalCode: '04567-890',
    addressNumber: '456',
    phone: '11912345678',
  },
  remoteIp: '192.168.1.50',
});

console.log('Card token:', tokenizedCard.creditCardToken);
```

#### Use Tokenized Card in Payment

```typescript
// Create payment with tokenized card
const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 300.00,
  dueDate: '2026-03-20',
  creditCardToken: tokenizedCard.creditCardToken,
  remoteIp: '192.168.1.50',
});
```

#### Pay Existing Payment with Credit Card

```typescript
// First create a payment without payment method
const payment = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'UNDEFINED',
  value: 200.00,
  dueDate: '2026-03-25',
});

// Then pay with credit card
await client.cards.payWithCreditCard(payment.id, {
  creditCard: {
    holderName: 'Carlos Oliveira',
    number: '5162306219378829',
    expiryMonth: '09',
    expiryYear: '2026',
    ccv: '456',
  },
  creditCardHolderInfo: {
    name: 'Carlos Oliveira',
    email: 'carlos@example.com',
    cpfCnpj: '11122233344',
    postalCode: '05678-123',
    addressNumber: '789',
    phone: '11998765432',
  },
  remoteIp: '192.168.1.75',
});
```

#### Pre-Authorization Flow

```typescript
// 1. Create pre-authorized payment
const preAuth = await client.payments.create({
  customer: 'cus_000005836142',
  billingType: 'CREDIT_CARD',
  value: 500.00,
  dueDate: '2026-03-20',
  creditCard: {
    holderName: 'Ana Costa',
    number: '5162306219378829',
    expiryMonth: '03',
    expiryYear: '2027',
    ccv: '789',
  },
  creditCardHolderInfo: {
    name: 'Ana Costa',
    email: 'ana@example.com',
    cpfCnpj: '55566677788',
    postalCode: '06789-456',
    addressNumber: '321',
    phone: '11987654321',
  },
  remoteIp: '192.168.1.100',
  authorizedOnly: true,
});

console.log('Pre-authorized:', preAuth.id);

// 2. Capture within 3 days
await client.cards.captureAuthorizedPayment(preAuth.id);
console.log('Payment captured');
```

#### Configure Pre-Authorization Settings

```typescript
// Get current configuration
const config = await client.cards.getPreAuthorizationConfig();
console.log('Pre-auth enabled:', config.enabled);

// Update configuration
await client.cards.updatePreAuthorizationConfig({
  enabled: true,
  captureAutomatically: false,
  daysToCapture: 2,
});
```

## Installments Service

The Installments service (`client.installments`) manages installment plans, which are separate resources from individual payments.

### Key Concepts

Installments represent a series of recurring charges. Each installment generates individual payment objects that can be managed independently.

**Required Fields**

- `installmentCount` - Number of installments
- `customer` - Customer ID
- `value` - Total value (split across installments)
- `billingType` - Payment method
- `dueDate` - First due date

**Payment Book**

The `downloadPaymentBook()` method returns a `BinaryResponse` containing the PDF file data. You must handle file saving manually.

### Methods Reference

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new installment plan |
| `get(id)` | Retrieve an installment by ID |
| `list(params?)` | List installments with filters (paginated) |
| `remove(id)` | Remove an installment plan |
| `listPayments(id)` | List all payments in an installment (paginated) |
| `cancelPendingCharges(id)` | Cancel pending charges in the plan |
| `refund(id, params?)` | Refund an installment plan |
| `downloadPaymentBook(id)` | Download installment payment book PDF |

### Examples

#### Create an Installment Plan

```typescript
const installment = await client.installments.create({
  customer: 'cus_000005836142',
  billingType: 'BOLETO',
  value: 1200.00,
  dueDate: '2026-04-01',
  installmentCount: 12,
  installmentValue: 100.00,
  description: 'Annual subscription - 12x',
  externalReference: 'SUB-2026-001',
});

console.log('Installment ID:', installment.id);
console.log('Total installments:', installment.installmentCount);
```

#### List Payments in an Installment

```typescript
const payments = await client.installments.listPayments(installment.id);

for (const payment of payments.data) {
  console.log(`Payment ${payment.installmentNumber}/${installment.installmentCount}`);
  console.log(`  Due: ${payment.dueDate}`);
  console.log(`  Value: ${payment.value}`);
  console.log(`  Status: ${payment.status}`);
}
```

#### Cancel Pending Charges

```typescript
// Cancel all remaining unpaid installments
await client.installments.cancelPendingCharges(installment.id);
console.log('Pending charges cancelled');
```

#### Download Payment Book

```typescript
import { writeFile } from 'fs/promises';

const paymentBook = await client.installments.downloadPaymentBook(installment.id);

// BinaryResponse contains: data (Buffer), filename, contentType
await writeFile(
  paymentBook.filename || 'payment-book.pdf',
  paymentBook.data
);

console.log('Payment book downloaded:', paymentBook.filename);
console.log('Content type:', paymentBook.contentType);
console.log('File size:', paymentBook.data.length, 'bytes');
```

#### Refund an Installment

```typescript
// Refund the entire installment plan
await client.installments.refund(installment.id);

// Partial refund
await client.installments.refund(installment.id, {
  value: 300.00,
  description: 'Partial refund for early cancellation',
});
```

## Chargebacks Service

The Chargebacks service (`client.chargebacks`) handles chargeback management and dispute resolution.

### Key Concepts

**Chargeback Status**

Chargebacks progress through the following statuses:

- `REQUESTED` - Chargeback initiated by the customer
- `IN_DISPUTE` - Under dispute with documentation provided
- `DISPUTE_LOST` - Dispute lost, chargeback confirmed
- `REVERSED` - Chargeback reversed in your favor
- `DONE` - Process completed

**Dispute Documentation**

When submitting a dispute, you can upload up to 11 files as evidence. Files must be provided as Blob objects (or File objects in browsers).

### Methods Reference

| Method | Description |
|--------|-------------|
| `get(id)` | Retrieve a chargeback by ID |
| `list(params?)` | List chargebacks with filters (paginated) |
| `dispute(id, files)` | Submit dispute with file uploads (max 11 Blobs) |

### Examples

#### List Chargebacks

```typescript
const chargebacks = await client.chargebacks.list({
  status: 'REQUESTED',
  dateCreatedGe: '2026-01-01',
  dateCreatedLe: '2026-03-31',
});

for (const chargeback of chargebacks.data) {
  console.log('Chargeback:', chargeback.id);
  console.log('  Payment:', chargeback.payment);
  console.log('  Status:', chargeback.status);
  console.log('  Value:', chargeback.value);
  console.log('  Reason:', chargeback.reason);
}
```

#### Get Chargeback Details

```typescript
const chargeback = await client.chargebacks.get('chb_000001234567');

console.log('Chargeback ID:', chargeback.id);
console.log('Status:', chargeback.status);
console.log('Disputed:', chargeback.disputed);
console.log('Created:', chargeback.dateCreated);
```

#### Submit Dispute with Files

```typescript
import { readFile } from 'fs/promises';

// Load evidence files
const invoice = await readFile('./evidence/invoice.pdf');
const deliveryProof = await readFile('./evidence/delivery.pdf');
const contractSigned = await readFile('./evidence/contract.pdf');

// Create Blobs (Node.js v18+ or browser)
const files = [
  new Blob([invoice], { type: 'application/pdf' }),
  new Blob([deliveryProof], { type: 'application/pdf' }),
  new Blob([contractSigned], { type: 'application/pdf' }),
];

// Submit dispute
await client.chargebacks.dispute('chb_000001234567', files);
console.log('Dispute submitted with 3 documents');
```

#### Browser File Upload Example

```typescript
// In a browser environment with file input
const handleDisputeSubmit = async (chargebackId: string, fileList: FileList) => {
  const files = Array.from(fileList).slice(0, 11); // Max 11 files

  await client.chargebacks.dispute(chargebackId, files);
  console.log(`Dispute submitted with ${files.length} files`);
};
```

## Payment Documents Service

The Payment Documents service (`client.paymentDocuments`) manages document attachments for payments.

### Key Concepts

Documents are uploaded via multipart/form-data and attached to specific payments. This is useful for supporting documentation like invoices, receipts, or contracts.

### Methods Reference

| Method | Description |
|--------|-------------|
| `upload(paymentId, params)` | Upload a document (multipart) |
| `list(paymentId)` | List all documents for a payment (paginated) |
| `get(paymentId, documentId)` | Get a specific document |
| `update(paymentId, documentId, params)` | Update document settings |
| `remove(paymentId, documentId)` | Remove a document |

### Examples

#### Upload a Document

```typescript
import { readFile } from 'fs/promises';

const fileData = await readFile('./invoice.pdf');
const fileBlob = new Blob([fileData], { type: 'application/pdf' });

const document = await client.paymentDocuments.upload('pay_000001234567', {
  file: fileBlob,
  type: 'INVOICE',
  description: 'Service invoice',
  availableAfterPayment: true,
});

console.log('Document ID:', document.id);
console.log('Document URL:', document.publicUrl);
```

#### List Payment Documents

```typescript
const documents = await client.paymentDocuments.list('pay_000001234567');

for (const doc of documents.data) {
  console.log('Document:', doc.id);
  console.log('  Type:', doc.type);
  console.log('  Description:', doc.description);
  console.log('  URL:', doc.publicUrl);
}
```

#### Update Document Settings

```typescript
await client.paymentDocuments.update(
  'pay_000001234567',
  'doc_000001234567',
  {
    description: 'Updated service invoice',
    availableAfterPayment: false,
  }
);
```

#### Remove a Document

```typescript
await client.paymentDocuments.remove(
  'pay_000001234567',
  'doc_000001234567'
);
console.log('Document removed');
```

## Related Resources

- [Pagination Guide](../pagination.md) - Learn how to handle paginated responses
- [Error Handling](../error-handling.md) - Understand error handling patterns
- [PIX Service](./pix.md) - Generate PIX QR codes for payments
- [Official Asaas Documentation](https://docs.asaas.com) - Complete API reference

## Best Practices

1. **Always set timeouts** when processing credit card payments (recommend 60 seconds)
2. **Use tokenization** for recurring payments to avoid storing sensitive card data
3. **Implement proper error handling** for payment failures and retries
4. **Monitor payment status** using webhooks for real-time updates
5. **Validate card data** before submission to reduce failed transactions
6. **Use pre-authorization** for scenarios requiring payment confirmation before capture
7. **Keep evidence files organized** for efficient chargeback dispute handling
8. **Test thoroughly in sandbox** before going to production
9. **Handle BinaryResponse properly** when downloading payment books
10. **Set appropriate refund descriptions** for customer clarity and internal tracking
