# Pix

The Pix service provides comprehensive functionality for managing Pix payments, keys, transactions, and advanced features like Automatic Pix and Recurring Pix in the Asaas platform.

## Key Concepts

### Dynamic vs Static QR Codes

**Dynamic QR Code**: Generated when you create a payment with `billingType: 'PIX'` through the Payments service. Each payment gets a unique QR code that expires after a specific time.

**Static QR Code**: Reusable QR codes that can accept multiple payments. Ideal for physical stores, printed materials, or recurring payment scenarios.

### Pix Key Types

When creating a Pix key through the API, only the `EVP` (Endereço Virtual de Pagamento) type is currently supported. This generates a random key managed by the Asaas platform.

Other key types (CPF, CNPJ, email, phone) can be registered through the Asaas dashboard but are not available via the API endpoint.

### Transaction Statuses

Pix transactions go through various states:

- `AWAITING_BALANCE_VALIDATION` - Checking account balance
- `SCHEDULED` - Payment scheduled for future date
- `REQUESTED` - Payment request submitted
- `DONE` - Transaction completed successfully
- `REFUSED` - Transaction declined
- `CANCELLED` - Transaction cancelled

### Automatic Pix vs Recurring Pix

**Automatic Pix**: A recurring authorization model where the payer pre-authorizes charges at defined intervals. The payer initiates the authorization via QR code, and subsequent charges happen automatically without manual intervention.

**Recurring Pix**: A scheduled payment model where you configure recurring payments to external accounts. The system automatically executes transfers at the specified frequency.

These are distinct products with different use cases and should not be confused.

## Pix Keys

Manage Pix keys registered to your Asaas account.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.keys.create(params)` | Register a new Pix key (EVP type only) |
| `client.pix.keys.list(params?)` | List all registered Pix keys (paginated) |
| `client.pix.keys.get(id)` | Retrieve a specific Pix key by ID |
| `client.pix.keys.remove(id)` | Delete a Pix key |

### Examples

**Creating a Pix Key**

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: 'your_access_token',
  environment: 'SANDBOX'
});

// Register an EVP key
const key = await client.pix.keys.create({
  type: 'EVP'
});

console.log('New Pix key:', key.key);
console.log('Status:', key.status); // AWAITING_ACTIVATION
```

**Listing Pix Keys**

```typescript
const result = await client.pix.keys.list();

for await (const key of result) {
  console.log('Key:', key.key);
  console.log('Type:', key.type);
  console.log('Status:', key.status);
  console.log('Can be deleted:', key.canBeDeleted);
  if (!key.canBeDeleted) {
    console.log('Reason:', key.cannotBeDeletedReason);
  }
}
```

**Getting a Specific Key**

```typescript
const key = await client.pix.keys.get('key_123456');

console.log('Key details:', {
  id: key.id,
  key: key.key,
  type: key.type,
  status: key.status,
  dateCreated: key.dateCreated
});

// Check if QR code is available
if (key.qrCode) {
  console.log('QR Code payload:', key.qrCode.payload);
}
```

**Removing a Pix Key**

```typescript
try {
  const result = await client.pix.keys.remove('key_123456');
  if (result.deleted) {
    console.log('Key successfully deleted');
  }
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot delete key:', error.message);
  }
}
```

## Static QR Codes

Create and manage static QR codes for receiving Pix payments.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.staticQrCodes.create(params)` | Create a static QR code |
| `client.pix.staticQrCodes.remove(id)` | Delete a static QR code |

### Examples

**Creating a Static QR Code**

```typescript
// Basic static QR code
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key@example.com',
  description: 'Pagamento de serviços',
  value: 150.00,
  format: 'ALL' // Returns both image and payload
});

console.log('QR Code ID:', qrCode.id);
console.log('Payload:', qrCode.payload);
console.log('Base64 Image:', qrCode.encodedImage);
```

**Creating a Reusable QR Code**

```typescript
// QR code that accepts multiple payments
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key',
  description: 'Pagamento de mensalidade',
  value: 299.90,
  format: 'ALL',
  allowsMultiplePayments: true,
  expirationDate: '2026-12-31',
  externalReference: 'MEMBERSHIP-2026'
});

console.log('Reusable QR Code:', qrCode.id);
console.log('Allows multiple payments:', qrCode.allowsMultiplePayments);
console.log('External reference:', qrCode.externalReference);
```

**Creating a QR Code with Expiration**

```typescript
// QR code that expires after 24 hours
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: 'your-pix-key',
  description: 'Pagamento de produto',
  value: 89.90,
  format: 'PAYLOAD', // Only returns payload, no image
  expirationSeconds: 86400 // 24 hours
});

console.log('QR Code expires in 24 hours');
console.log('Payload:', qrCode.payload);
```

**Removing a Static QR Code**

```typescript
const result = await client.pix.staticQrCodes.remove('qr_123456');

if (result.deleted) {
  console.log('Static QR code successfully removed');
}
```

## QR Code Operations

Decode and pay Pix QR codes.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.getPaymentQrCode(paymentId)` | Get QR code for a dynamic Pix payment |
| `client.pix.qrCodes.decode(params)` | Decode a Pix QR code payload |
| `client.pix.qrCodes.pay(params)` | Pay a Pix QR code |

### Examples

**Getting a Payment QR Code**

```typescript
// First, create a Pix payment
const payment = await client.payments.create({
  customer: 'cus_123456',
  billingType: 'PIX',
  value: 250.00,
  dueDate: '2026-03-20'
});

// Then get the QR code
const qrCode = await client.pix.getPaymentQrCode(payment.id);

console.log('QR Code payload:', qrCode.payload);
console.log('Base64 image:', qrCode.encodedImage);
console.log('Expires at:', qrCode.expirationDate);
console.log('Description:', qrCode.description);
```

**Decoding a QR Code**

```typescript
const decoded = await client.pix.qrCodes.decode({
  payload: '00020126580014br.gov.bcb.pix...'
});

console.log('QR Code type:', decoded.type);
console.log('Pix key:', decoded.pixKey);
console.log('Value:', decoded.value);
console.log('Total value:', decoded.totalValue);
console.log('Can be paid:', decoded.canBePaid);

if (!decoded.canBePaid) {
  console.log('Reason:', decoded.cannotBePaidReason);
}

// Check receiver details
if (decoded.receiver) {
  console.log('Receiver name:', decoded.receiver.name);
  console.log('Receiver document:', decoded.receiver.cpfCnpj);
}
```

**Decoding with Change Value**

```typescript
// Decode with a different amount (for flexible QR codes)
const decoded = await client.pix.qrCodes.decode({
  payload: '00020126580014br.gov.bcb.pix...',
  changeValue: 150.00,
  expectedPaymentDate: '2026-03-15'
});

console.log('Original value:', decoded.value);
console.log('Change value:', decoded.changeValue);
console.log('Total to pay:', decoded.totalValue);
```

**Paying a QR Code**

```typescript
const transaction = await client.pix.qrCodes.pay({
  qrCode: {
    payload: '00020126580014br.gov.bcb.pix...'
  },
  value: 150.00,
  description: 'Pagamento de fornecedor'
});

console.log('Transaction ID:', transaction.id);
console.log('End-to-end ID:', transaction.endToEndIdentifier);
console.log('Status:', transaction.status);
console.log('Effective date:', transaction.effectiveDate);

if (transaction.transactionReceiptUrl) {
  console.log('Receipt:', transaction.transactionReceiptUrl);
}
```

**Scheduling a QR Code Payment**

```typescript
const transaction = await client.pix.qrCodes.pay({
  qrCode: {
    payload: '00020126580014br.gov.bcb.pix...'
  },
  value: 200.00,
  description: 'Pagamento agendado',
  scheduleDate: '2026-03-20'
});

console.log('Scheduled for:', transaction.scheduledDate);
console.log('Can be cancelled:', transaction.canBeCanceled);
```

## Transactions

List, retrieve, and cancel Pix transactions.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.transactions.list(params?)` | List Pix transactions (paginated) |
| `client.pix.transactions.get(id)` | Retrieve a specific transaction |
| `client.pix.transactions.cancel(id)` | Cancel a scheduled transaction |

### Examples

**Listing Transactions**

```typescript
const result = await client.pix.transactions.list();

for await (const transaction of result) {
  console.log('Transaction:', transaction.id);
  console.log('Type:', transaction.type); // DEBIT, CREDIT, etc.
  console.log('Status:', transaction.status);
  console.log('Value:', transaction.value);
  console.log('Effective date:', transaction.effectiveDate);
}
```

**Filtering Transactions**

```typescript
// Filter by status and type
const result = await client.pix.transactions.list({
  status: 'DONE',
  type: 'CREDIT',
  limit: 50
});

for await (const transaction of result) {
  console.log('Completed credit:', {
    id: transaction.id,
    value: transaction.value,
    effectiveDate: transaction.effectiveDate,
    endToEndIdentifier: transaction.endToEndIdentifier
  });
}
```

**Getting Transaction Details**

```typescript
const transaction = await client.pix.transactions.get('txn_123456');

console.log('Transaction details:', {
  id: transaction.id,
  endToEndIdentifier: transaction.endToEndIdentifier,
  value: transaction.value,
  status: transaction.status,
  type: transaction.type,
  originType: transaction.originType,
  description: transaction.description,
  effectiveDate: transaction.effectiveDate
});

// Check external account details
if (transaction.externalAccount) {
  console.log('External account:', {
    name: transaction.externalAccount.name,
    cpfCnpj: transaction.externalAccount.cpfCnpj,
    pixKey: transaction.externalAccount.pixKey
  });
}

// Check if refund is possible
if (transaction.canBeRefunded) {
  console.log('Transaction can be refunded');
} else if (transaction.refundDisabledReason) {
  console.log('Refund disabled:', transaction.refundDisabledReason);
}
```

**Cancelling a Scheduled Transaction**

```typescript
try {
  const result = await client.pix.transactions.cancel('txn_123456');

  console.log('Transaction cancelled:', result.id);
  console.log('New status:', result.status); // CANCELLED
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot cancel:', error.message);
  }
}
```

## Automatic Pix

Manage Automatic Pix authorizations and payment instructions for recurring charges.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.automatic.authorizations.create(params)` | Create an authorization |
| `client.pix.automatic.authorizations.list(params?)` | List authorizations (paginated) |
| `client.pix.automatic.authorizations.get(id)` | Retrieve an authorization |
| `client.pix.automatic.authorizations.cancel(id)` | Cancel an authorization |
| `client.pix.automatic.paymentInstructions.list(params?)` | List payment instructions |
| `client.pix.automatic.paymentInstructions.get(id)` | Get instruction details |

### Examples

**Creating an Automatic Pix Authorization**

```typescript
const authorization = await client.pix.automatic.authorizations.create({
  frequency: 'MONTHLY',
  contractId: 'CONTRACT-2026-001',
  startDate: '2026-04-01',
  customerId: 'cus_123456',
  immediateQrCode: true,
  value: 99.90,
  description: 'Assinatura mensal de software',
  finishDate: '2027-03-31'
});

console.log('Authorization ID:', authorization.id);
console.log('QR Code payload:', authorization.payload);
console.log('Base64 image:', authorization.encodedImage);
console.log('Status:', authorization.status);
```

**Creating with Minimum Limit**

```typescript
const authorization = await client.pix.automatic.authorizations.create({
  frequency: 'WEEKLY',
  contractId: 'CONTRACT-2026-002',
  startDate: '2026-03-20',
  customerId: 'cus_789012',
  immediateQrCode: true,
  value: 49.90,
  minLimitValue: 30.00,
  description: 'Assinatura semanal'
});

console.log('Authorization created with minimum limit:', authorization.minLimitValue);
```

**Listing Authorizations**

```typescript
const result = await client.pix.automatic.authorizations.list();

for await (const auth of result) {
  console.log('Authorization:', {
    id: auth.id,
    customerId: auth.customerId,
    frequency: auth.frequency,
    value: auth.value,
    status: auth.status,
    startDate: auth.startDate,
    finishDate: auth.finishDate
  });
}
```

**Getting Authorization Details**

```typescript
const auth = await client.pix.automatic.authorizations.get('auth_123456');

console.log('Authorization:', {
  id: auth.id,
  contractId: auth.contractId,
  frequency: auth.frequency,
  value: auth.value,
  status: auth.status,
  endToEndIdentifier: auth.endToEndIdentifier
});

if (auth.cancellationDate) {
  console.log('Cancelled on:', auth.cancellationDate);
  console.log('Reason:', auth.cancellationReason);
}
```

**Cancelling an Authorization**

```typescript
const result = await client.pix.automatic.authorizations.cancel('auth_123456');

if (result.deleted) {
  console.log('Authorization successfully cancelled');
}
```

**Listing Payment Instructions**

```typescript
// List all instructions for a specific authorization
const result = await client.pix.automatic.paymentInstructions.list({
  authorizationId: 'auth_123456'
});

for await (const instruction of result) {
  console.log('Instruction:', {
    id: instruction.id,
    endToEndIdentifier: instruction.endToEndIdentifier,
    dueDate: instruction.dueDate,
    status: instruction.status,
    paymentId: instruction.paymentId
  });
}
```

**Filtering Instructions by Customer**

```typescript
const result = await client.pix.automatic.paymentInstructions.list({
  customerId: 'cus_123456',
  status: 'PENDING'
});

for await (const instruction of result) {
  console.log('Pending instruction for customer:', instruction.id);
}
```

**Getting Instruction Details**

```typescript
const instruction = await client.pix.automatic.paymentInstructions.get('inst_123456');

console.log('Payment instruction:', {
  id: instruction.id,
  authorization: instruction.authorization,
  dueDate: instruction.dueDate,
  status: instruction.status,
  paymentId: instruction.paymentId
});
```

## Recurring Pix

Manage Recurring Pix payments and their individual items.

### Methods

| Method | Description |
|--------|-------------|
| `client.pix.recurring.list(params?)` | List recurring payments (paginated) |
| `client.pix.recurring.get(id)` | Retrieve a recurring payment |
| `client.pix.recurring.cancel(id)` | Cancel a recurring payment |
| `client.pix.recurring.listItems(id, params?)` | List items of a recurring payment |
| `client.pix.recurring.cancelItem(itemId)` | Cancel a specific item |

### Examples

**Listing Recurring Payments**

```typescript
const result = await client.pix.recurring.list();

for await (const recurring of result) {
  console.log('Recurring payment:', {
    id: recurring.id,
    status: recurring.status,
    value: recurring.value,
    frequency: recurring.frequency,
    quantity: recurring.quantity,
    startDate: recurring.startDate,
    finishDate: recurring.finishDate
  });
}
```

**Filtering by Status**

```typescript
const result = await client.pix.recurring.list({
  status: 'SCHEDULED',
  limit: 20
});

for await (const recurring of result) {
  console.log('Scheduled recurring:', recurring.id);
  console.log('Can be cancelled:', recurring.canBeCancelled);
}
```

**Searching Recurring Payments**

```typescript
const result = await client.pix.recurring.list({
  searchText: 'fornecedor xyz',
  value: 500.00
});

for await (const recurring of result) {
  console.log('Found:', recurring.id);
  if (recurring.externalAccount) {
    console.log('Account:', recurring.externalAccount.name);
  }
}
```

**Getting Recurring Payment Details**

```typescript
const recurring = await client.pix.recurring.get('rec_123456');

console.log('Recurring payment:', {
  id: recurring.id,
  status: recurring.status,
  origin: recurring.origin,
  value: recurring.value,
  frequency: recurring.frequency,
  quantity: recurring.quantity,
  startDate: recurring.startDate,
  finishDate: recurring.finishDate,
  canBeCancelled: recurring.canBeCancelled
});

if (recurring.externalAccount) {
  console.log('External account:', {
    name: recurring.externalAccount.name,
    cpfCnpj: recurring.externalAccount.cpfCnpj,
    pixKey: recurring.externalAccount.pixKey
  });
}
```

**Cancelling a Recurring Payment**

```typescript
const result = await client.pix.recurring.cancel('rec_123456');

if (result.deleted) {
  console.log('Recurring payment successfully cancelled');
}
```

**Listing Recurring Items**

```typescript
const result = await client.pix.recurring.listItems('rec_123456');

for await (const item of result) {
  console.log('Item:', {
    id: item.id,
    status: item.status,
    scheduledDate: item.scheduledDate,
    recurrenceNumber: item.recurrenceNumber,
    quantity: item.quantity,
    value: item.value,
    canBeCancelled: item.canBeCancelled
  });

  if (item.refusalReasonDescription) {
    console.log('Refused:', item.refusalReasonDescription);
  }
}
```

**Filtering Items by Status**

```typescript
const result = await client.pix.recurring.listItems('rec_123456', {
  status: 'PENDING'
});

for await (const item of result) {
  console.log('Pending item:', item.id);
  console.log('Scheduled for:', item.scheduledDate);
}
```

**Cancelling a Recurring Item**

```typescript
try {
  const result = await client.pix.recurring.cancelItem('item_123456');

  if (result.deleted) {
    console.log('Recurring item successfully cancelled');
  }
} catch (error) {
  if (error.isValidation) {
    console.error('Cannot cancel item:', error.message);
  }
}
```

## Sandbox Limitations

### Pix Key Registration Required

When testing QR Code payments in the Sandbox environment, you must register a Pix key before attempting to pay. Without a registered key, the API will return a `404 Not Found` error.

**Correct testing flow:**

```typescript
// 1. Register a Pix key first
const key = await client.pix.keys.create({ type: 'EVP' });
console.log('Registered key:', key.key);

// 2. Wait for key activation (in sandbox, usually immediate)
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. Now you can test QR code payments
const qrCode = await client.pix.staticQrCodes.create({
  addressKey: key.key,
  value: 100.00,
  description: 'Test payment'
});

const transaction = await client.pix.qrCodes.pay({
  qrCode: { payload: qrCode.payload },
  value: 100.00
});
```

### Error Handling

```typescript
try {
  const transaction = await client.pix.qrCodes.pay({
    qrCode: { payload: 'some-payload' },
    value: 50.00
  });
} catch (error) {
  if (error.isNotFound) {
    console.error('No Pix key registered. Please create a key first.');
  } else if (error.isValidation) {
    console.error('Validation error:', error.message);
  } else {
    throw error;
  }
}
```

## Related

- [Payments](./payments.md) - Create Pix payments with `billingType: 'PIX'`
- [Transfers](./transfers.md) - Bank transfers and external payments
- [Customers](./customers.md) - Manage customers for Automatic Pix
