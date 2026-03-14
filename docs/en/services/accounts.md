# Accounts & Notifications

The Accounts services cover customer management, subaccount provisioning, account registration, and notification settings. These are fundamental operations for managing your Asaas integration at the account and customer level.

## Customers

Customers are the foundation of financial operations in Asaas. Before creating payments, subscriptions, or invoices, you must have a customer identifier (`cus_...`).

### Key Concepts

- **Soft Delete**: Removed customers can be restored using the `restore()` method
- **Automatic Notifications**: When you create a customer, Asaas automatically creates a standard set of notifications for payment lifecycle events
- **External Reference**: Use `externalReference` to link customers to your system's identifiers
- **CPF/CNPJ Requirement**: The `cpfCnpj` field is mandatory even for foreign customers

### Methods

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new customer (required: name, cpfCnpj) |
| `list(params?)` | List customers with optional filters (paginated) |
| `get(id)` | Retrieve a single customer by ID |
| `update(id, params)` | Update an existing customer |
| `remove(id)` | Soft-delete a customer |
| `restore(id)` | Restore a deleted customer |
| `listNotifications(id)` | List notification settings for a customer |

### Examples

#### Creating a Customer

```typescript
import { AsaasClient } from 'asaas-sdk';

const client = new AsaasClient({
  accessToken: 'your-access-token',
  environment: 'SANDBOX'
});

// Create a customer with minimal required fields
const result = await client.customers.create({
  name: 'João Silva',
  cpfCnpj: '12345678909',
});

console.log('Customer ID:', result.id);
console.log('Customer created:', result.dateCreated);
```

#### Creating a Customer with Full Address

```typescript
const customer = await client.customers.create({
  name: 'Maria Santos',
  cpfCnpj: '98765432100',
  email: 'maria.santos@example.com',
  phone: '1133334444',
  mobilePhone: '11999998888',
  address: 'Avenida Paulista',
  addressNumber: '1000',
  complement: 'Conjunto 101',
  province: 'Bela Vista',
  postalCode: '01310-100',
  externalReference: 'CRM-2026-001',
  notificationDisabled: false,
  observations: 'Cliente preferencial, cobranças via email'
});

console.log('Customer created:', customer.id);
```

#### Listing Customers

```typescript
// List all customers (paginated)
const result = await client.customers.list();

for await (const customer of result) {
  console.log(`${customer.name} - ${customer.cpfCnpj}`);
}
```

#### Filtering Customers

```typescript
// Filter by CPF/CNPJ
const result = await client.customers.list({
  cpfCnpj: '12345678909',
  limit: 10
});

for await (const customer of result) {
  console.log('Found:', customer.name);
}

// Filter by email
const byEmail = await client.customers.list({
  email: 'maria@example.com'
});

// Filter by external reference
const byRef = await client.customers.list({
  externalReference: 'CRM-2026-001'
});
```

#### Updating a Customer

```typescript
// Update customer information
const updated = await client.customers.update('cus_abc123', {
  email: 'newemail@example.com',
  mobilePhone: '11988887777',
  observations: 'Email atualizado em 2026-03-13'
});

console.log('Customer updated:', updated.id);
```

#### Removing and Restoring Customers

```typescript
// Soft delete a customer
const removed = await client.customers.remove('cus_abc123');
console.log('Customer deleted:', removed.deleted); // true

// Restore a deleted customer
const restored = await client.customers.restore('cus_abc123');
console.log('Customer restored:', restored.deleted); // false
console.log('Customer name:', restored.name);
```

#### Retrieving Customer Notifications

```typescript
// List all notification settings for a customer
const notifications = await client.customers.listNotifications('cus_abc123');

console.log('Total notifications:', notifications.totalCount);

for await (const notification of notifications) {
  console.log(`Event: ${notification.event}`);
  console.log(`Email enabled: ${notification.emailEnabledForCustomer}`);
  console.log(`SMS enabled: ${notification.smsEnabledForCustomer}`);
  console.log(`Schedule offset: ${notification.scheduleOffset} days`);
  console.log('---');
}
```

## Subaccounts

Subaccounts are child accounts linked to your root account. They have their own `apiKey` and `walletId`, enabling platform integrations with isolated contexts.

### Key Concepts

- **apiKey Security**: The subaccount's `apiKey` is only returned during creation. Store it securely - you cannot retrieve it later without using privileged API key management endpoints
- **walletId**: Used for splits and internal transfers between Asaas accounts
- **Two Types**: Standard subaccounts (users access Asaas interface) and White Label subaccounts (fully integrated, no Asaas branding)
- **Dual Authentication Context**: `/accounts` endpoints use root account credentials, `/myAccount` endpoints use the subaccount's credentials
- **Commercial Data Expiration**: Subaccounts must confirm commercial information annually (`commercialInfoExpiration`)

### Methods

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new subaccount (returns apiKey + walletId) |
| `list(params?)` | List subaccounts with optional filters (paginated) |
| `get(id)` | Retrieve a single subaccount by ID |
| `apiKeys.list(subaccountId)` | List API keys for a subaccount (privileged) |
| `apiKeys.create(subaccountId, params)` | Create a new API key (privileged) |
| `apiKeys.update(subaccountId, accessTokenId, params)` | Update an API key (privileged) |
| `apiKeys.remove(subaccountId, accessTokenId)` | Remove an API key (privileged) |

### Examples

#### Creating a Subaccount

```typescript
// Create a subaccount with required fields
const subaccount = await client.subaccounts.create({
  name: 'Carlos Ferreira',
  email: 'carlos@example.com',
  cpfCnpj: '12345678909',
  mobilePhone: '11988887777',
  incomeValue: 5000.00,
  address: 'Rua Augusta',
  addressNumber: '1500',
  province: 'Consolação',
  postalCode: '01304-000'
});

// CRITICAL: Store these values immediately
console.log('Subaccount ID:', subaccount.id);
console.log('API Key:', subaccount.apiKey); // Only available now!
console.log('Wallet ID:', subaccount.walletId); // For splits/transfers
console.log('Account Number:', subaccount.accountNumber);
console.log('Commercial Info Expires:', subaccount.commercialInfoExpiration?.scheduledDate);
```

#### Creating a Subaccount with Webhooks (White Label)

```typescript
// For white label integrations, configure webhooks during creation
const whitelabel = await client.subaccounts.create({
  name: 'Empresa Demo LTDA',
  email: 'contato@demo.com.br',
  cpfCnpj: '12345678000190',
  mobilePhone: '1133334444',
  incomeValue: 10000.00,
  companyType: 'LIMITED',
  address: 'Avenida Brigadeiro Faria Lima',
  addressNumber: '3000',
  province: 'Itaim Bibi',
  postalCode: '01451-000',
  webhooks: [
    {
      name: 'Account Status Webhook',
      url: 'https://api.yourplatform.com/webhooks/asaas',
      email: 'tech@yourplatform.com',
      sendType: 'SEQUENTIALLY',
      apiVersion: 3,
      enabled: true,
      interrupted: false,
      authToken: 'your-webhook-secret',
      events: [
        'ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED',
        'ACCOUNT_STATUS_GENERAL_APPROVAL_REJECTED',
        'ACCOUNT_STATUS_COMMERCIAL_INFO_EXPIRED'
      ]
    }
  ]
});

console.log('White label subaccount created:', whitelabel.id);
console.log('Store this API key:', whitelabel.apiKey);
```

#### Listing Subaccounts

```typescript
// List all subaccounts
const result = await client.subaccounts.list();

for await (const account of result) {
  console.log(`${account.name} - Wallet: ${account.walletId}`);
}

// Filter by CPF/CNPJ
const filtered = await client.subaccounts.list({
  cpfCnpj: '12345678000190',
  limit: 20
});

// Filter by wallet ID
const byWallet = await client.subaccounts.list({
  walletId: 'wal_abc123'
});
```

#### Managing API Keys (Privileged Operation)

```typescript
// List existing API keys for a subaccount
const keys = await client.subaccounts.apiKeys.list('acc_abc123');
console.log('Total keys:', keys.accessTokens.length);

for (const key of keys.accessTokens) {
  console.log(`Key: ${key.name} - Enabled: ${key.enabled}`);
  console.log(`Created: ${key.dateCreated}`);
  console.log(`Expires: ${key.expirationDate || 'Never'}`);
}

// Create a new API key
const newKey = await client.subaccounts.apiKeys.create('acc_abc123', {
  name: 'Production API Key',
  expirationDate: '2027-12-31'
});

console.log('New API Key:', newKey.apiKey); // Store this immediately!
console.log('Key ID:', newKey.id);

// Update an API key
await client.subaccounts.apiKeys.update('acc_abc123', 'token_xyz', {
  name: 'Updated Key Name',
  enabled: false,
  expirationDate: '2027-06-30'
});

// Remove an API key
await client.subaccounts.apiKeys.remove('acc_abc123', 'token_xyz');
console.log('API key revoked');
```

**Important**: API key management endpoints require:
- Temporary enablement via Asaas interface (2-hour window)
- Active IP whitelist
- Root account credentials

## MyAccount

The `myAccount` service is used by subaccounts to manage their own registration, documents, and commercial information. These endpoints must be called using the subaccount's `apiKey`.

### Key Concepts

- **Authentication Context**: Use the subaccount's credentials, not the root account
- **White Label Requirement**: Essential for white label integrations where users don't access Asaas interface
- **Onboarding Flow**: After creating a subaccount, wait at least 15 seconds before checking documents (allows Federal Revenue validation)
- **Document Routing**: If `onboardingUrl` exists, use that link; otherwise, upload via API
- **Annual Confirmation**: Commercial information must be confirmed annually to avoid API restrictions

### Methods

| Method | Description |
|--------|-------------|
| `getRegistrationStatus()` | Check account registration status (commercialInfo, documentation, bankAccountInfo, general) |
| `listPendingDocuments()` | List pending document groups and their status |
| `sendDocument(groupId, params)` | Upload a document file (multipart) |
| `viewSentDocument(fileId)` | View a previously sent document |
| `updateSentDocument(fileId, params)` | Update a sent document |
| `removeSentDocument(fileId)` | Remove a sent document |
| `getCommercialInfo()` | Get business/personal data |
| `updateCommercialInfo(params)` | Update business/personal data (annual confirmation) |
| `deleteWhiteLabelSubaccount(reason?)` | Delete white label subaccount |

### Examples

#### Checking Registration Status

```typescript
// Create a client with the subaccount's credentials
const subaccountClient = new AsaasClient({
  accessToken: 'subaccount-api-key-here',
  environment: 'SANDBOX'
});

// Check overall registration status
const status = await subaccountClient.myAccount.getRegistrationStatus();

console.log('Commercial Info:', status.commercialInfo); // PENDING, APPROVED, REJECTED, AWAITING_APPROVAL
console.log('Documentation:', status.documentation);
console.log('Bank Account:', status.bankAccountInfo);
console.log('General Status:', status.general); // APPROVED means fully activated

if (status.general === 'APPROVED') {
  console.log('Account fully approved and ready for all products!');
}
```

#### Listing Pending Documents

```typescript
// Wait at least 15 seconds after subaccount creation
await new Promise(resolve => setTimeout(resolve, 15000));

// List pending document groups
const docs = await subaccountClient.myAccount.listPendingDocuments();

if (docs.rejectReasons && docs.rejectReasons.length > 0) {
  console.log('Rejection reasons:', docs.rejectReasons);
}

for (const group of docs.data) {
  console.log(`\nGroup: ${group.title}`);
  console.log(`Type: ${group.type}`);
  console.log(`Status: ${group.status}`);
  console.log(`Description: ${group.description}`);

  if (group.onboardingUrl) {
    console.log('Use this link to upload:', group.onboardingUrl);
    console.log('Link expires:', group.onboardingUrlExpirationDate);
  } else {
    console.log('Upload via API - Group ID:', group.id);
  }

  if (group.documents && group.documents.length > 0) {
    console.log('Submitted documents:', group.documents.length);
  }
}
```

#### Sending Documents via API

```typescript
import { readFileSync } from 'fs';

// Only send via API if onboardingUrl is NOT present
const documentFile = readFileSync('/path/to/document.pdf');

const result = await subaccountClient.myAccount.sendDocument('doc_group_123', {
  documentFile: documentFile,
  type: 'IDENTIFICATION' // Must match document group type
});

console.log('Document sent:', result.id);
console.log('Status:', result.status);
```

#### Managing Sent Documents

```typescript
// View a sent document
const document = await subaccountClient.myAccount.viewSentDocument('file_abc123');
console.log('Document type:', document.type);
console.log('Status:', document.status);

// Update a sent document
await subaccountClient.myAccount.updateSentDocument('file_abc123', {
  documentFile: updatedFileBuffer,
  type: 'IDENTIFICATION'
});

// Remove a sent document
await subaccountClient.myAccount.removeSentDocument('file_abc123');
console.log('Document removed');
```

#### Managing Commercial Information

```typescript
// Get current commercial information
const info = await subaccountClient.myAccount.getCommercialInfo();

console.log('Status:', info.status);
console.log('Person Type:', info.personType);
console.log('Name:', info.name);
console.log('Income:', info.incomeValue);
console.log('Expiration:', info.commercialInfoExpiration);

if (info.denialReason) {
  console.log('Denial reason:', info.denialReason);
}

// Update commercial information (annual confirmation)
const updated = await subaccountClient.myAccount.updateCommercialInfo({
  incomeValue: 6000.00,
  email: 'newemail@example.com',
  mobilePhone: '11999998888',
  address: 'Rua Nova',
  addressNumber: '100',
  province: 'Centro',
  postalCode: '01000-000'
});

console.log('Commercial info updated:', updated.status);
console.log('New expiration:', updated.commercialInfoExpiration);
```

#### Deleting a White Label Subaccount

```typescript
// Delete the white label subaccount (called by the subaccount itself)
await subaccountClient.myAccount.deleteWhiteLabelSubaccount(
  'Customer requested account closure'
);

console.log('White label subaccount deleted');
```

## Notifications

Notifications are fixed configurations attached to each customer that control when Asaas sends payment-related messages via email, SMS, WhatsApp, or voice calls.

### Key Concepts

- **Automatic Creation**: Asaas creates a standard set of notifications when you register a customer
- **Fixed Configuration**: You cannot create or delete notifications; you can only update the existing set
- **Event + Offset**: Notifications are identified by `event` + `scheduleOffset` (e.g., `PAYMENT_DUEDATE_WARNING` with 10 days before due date)
- **Channels**: Email, SMS, WhatsApp, and voice calls (support varies by environment)
- **Customer Kill Switch**: Use `notificationDisabled` in customer records to block all notifications

### Standard Notification Set

When a customer is created, Asaas automatically creates these notifications:

- `PAYMENT_CREATED` (offset 0) - When payment is created
- `PAYMENT_UPDATED` (offset 0) - When payment is updated
- `PAYMENT_RECEIVED` (offset 0) - When payment is received
- `PAYMENT_OVERDUE` (offset 0) - On due date when overdue
- `PAYMENT_OVERDUE` (offset 7) - 7 days after overdue
- `PAYMENT_DUEDATE_WARNING` (offset 0) - On due date
- `PAYMENT_DUEDATE_WARNING` (offset 10) - 10 days before due date
- `SEND_LINHA_DIGITAVEL` (offset 0) - Send bank slip barcode

### Methods

| Method | Description |
|--------|-------------|
| `listByCustomer(customerId)` | List all notification settings for a customer |
| `update(id, params)` | Update a single notification |
| `updateBatch(params)` | Update multiple notifications at once (recommended) |

### Examples

#### Listing Customer Notifications

```typescript
// List all notifications for a customer
const notifications = await client.notifications.listByCustomer('cus_abc123');

console.log('Total notifications:', notifications.totalCount);

for await (const notification of notifications) {
  console.log(`\nEvent: ${notification.event}`);
  console.log(`Enabled: ${notification.enabled}`);
  console.log(`Schedule offset: ${notification.scheduleOffset} days`);

  // Check channels
  if (notification.emailEnabledForCustomer) {
    console.log('  - Email to customer: enabled');
  }
  if (notification.smsEnabledForCustomer) {
    console.log('  - SMS to customer: enabled');
  }
  if (notification.whatsappEnabledForCustomer) {
    console.log('  - WhatsApp to customer: enabled');
  }
  if (notification.phoneCallEnabledForCustomer) {
    console.log('  - Voice call to customer: enabled');
  }

  // Provider notifications
  if (notification.emailEnabledForProvider) {
    console.log('  - Email to provider: enabled');
  }
  if (notification.smsEnabledForProvider) {
    console.log('  - SMS to provider: enabled');
  }
}
```

#### Updating a Single Notification

```typescript
// Disable SMS for overdue notifications
const updated = await client.notifications.update('not_xyz789', {
  smsEnabledForCustomer: false,
  emailEnabledForCustomer: true,
  whatsappEnabledForCustomer: true
});

console.log('Notification updated:', updated.event);
```

#### Batch Updating Notifications (Recommended)

```typescript
// First, get the current notifications
const current = await client.notifications.listByCustomer('cus_abc123');

// Build batch update array
const notifications = [];

for await (const notification of current) {
  // Disable all SMS, enable email for all payment events
  if (notification.event.startsWith('PAYMENT_')) {
    notifications.push({
      id: notification.id,
      smsEnabledForCustomer: false,
      emailEnabledForCustomer: true,
      whatsappEnabledForCustomer: false
    });
  }

  // Change schedule offset for due date warnings
  if (notification.event === 'PAYMENT_DUEDATE_WARNING' && notification.scheduleOffset === 10) {
    notifications.push({
      id: notification.id,
      scheduleOffset: 5, // Change from 10 days to 5 days
      emailEnabledForCustomer: true
    });
  }
}

// Apply all changes at once
await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: notifications
});

console.log(`Updated ${notifications.length} notifications`);
```

#### Customizing Notifications for Email-Only Flow

```typescript
// Disable all channels except email for a customer
const allNotifications = await client.notifications.listByCustomer('cus_abc123');

const updates = [];
for await (const notification of allNotifications) {
  updates.push({
    id: notification.id,
    enabled: true,
    emailEnabledForCustomer: true,
    smsEnabledForCustomer: false,
    whatsappEnabledForCustomer: false,
    phoneCallEnabledForCustomer: false,
    emailEnabledForProvider: false,
    smsEnabledForProvider: false
  });
}

await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: updates
});

console.log('Customer configured for email-only notifications');
```

#### Setting Up Reminder Notifications

```typescript
// Configure payment reminders: 7 days before + 3 days after overdue
const notifications = await client.notifications.listByCustomer('cus_abc123');

const updates = [];
for await (const notification of notifications) {
  // Enable 7-day advance warning
  if (notification.event === 'PAYMENT_DUEDATE_WARNING' && notification.scheduleOffset === 10) {
    updates.push({
      id: notification.id,
      scheduleOffset: 7, // 7 days before
      emailEnabledForCustomer: true,
      smsEnabledForCustomer: true,
      whatsappEnabledForCustomer: false
    });
  }

  // Enable overdue notification after 3 days
  if (notification.event === 'PAYMENT_OVERDUE' && notification.scheduleOffset === 7) {
    updates.push({
      id: notification.id,
      scheduleOffset: 3, // 3 days after overdue
      emailEnabledForCustomer: true,
      smsEnabledForCustomer: false,
      whatsappEnabledForCustomer: true
    });
  }
}

await client.notifications.updateBatch({
  customer: 'cus_abc123',
  notifications: updates
});

console.log('Reminder schedule configured');
```

### Schedule Offset Values

Valid `scheduleOffset` values are: **0, 1, 5, 7, 10, 15, 30**

The offset applies differently depending on the event:
- `PAYMENT_DUEDATE_WARNING`: days **before** due date
- `PAYMENT_OVERDUE`: days **after** due date becomes overdue

### Notification Events

| Event | Description |
|-------|-------------|
| `PAYMENT_CREATED` | Payment was created |
| `PAYMENT_UPDATED` | Payment was updated |
| `PAYMENT_RECEIVED` | Payment was received/confirmed |
| `PAYMENT_OVERDUE` | Payment is overdue |
| `PAYMENT_DUEDATE_WARNING` | Due date is approaching |
| `SEND_LINHA_DIGITAVEL` | Send bank slip barcode/link |

**Note**: `PAYMENT_CREATED` is not sent for payments created by subscriptions.

### Sandbox Limitations

In sandbox environment:
- **Email**: Can be tested
- **SMS**: Can be tested
- **WhatsApp**: Cannot be tested
- **Voice calls**: Limited/unclear testing support

Sandbox subaccount communications are sent to the root account's email address.

## Related

- [Payments](./payments.md) - Create and manage customer payments
- [Subscriptions](./subscriptions.md) - Recurring payment plans
- [Webhooks](./webhooks.md) - Real-time event notifications for your platform
- [Transfers](./transfers.md) - Internal transfers between Asaas accounts using walletId
