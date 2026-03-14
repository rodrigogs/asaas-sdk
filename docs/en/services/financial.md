# Financial Services

The Financial Services module provides comprehensive money management capabilities including transfers, bill payments, escrow management, splits, and anticipations. These services handle both incoming and outgoing money flows with detailed tracking and control.

## Transfers

Transfers allow you to move money from your Asaas account to other destinations: bank accounts, Pix keys, or other Asaas accounts within your operation.

### Key Concepts

**Transfer Types:**
- **Bank Transfer**: Send money to external bank accounts via TED or Pix
- **Pix Transfer**: Send money using Pix keys (CPF, CNPJ, email, phone, EVP)
- **Internal Transfer**: Transfer between Asaas accounts in your operation (requires `walletId`)

**Important Rules:**
- TEDs requested after 3:00 PM are automatically scheduled for the next business day
- Internal transfers between Asaas accounts are typically processed immediately
- Pix transfers are usually instant when no scheduling is applied
- Transfers may require critical authorization (SMS/App Token) depending on account settings
- Transfer validation webhook can be used for automated approval workflows

**Transfer Status:**
- `PENDING`: Transfer created, awaiting processing
- `BANK_PROCESSING`: Being processed by the bank
- `DONE`: Successfully completed
- `CANCELLED`: Cancelled before completion
- `FAILED`: Failed to complete

**Security Features:**
- IP whitelist for automated transfers without manual approval
- Transfer validation webhook (POST sent ~5 seconds after creation)
- Critical authorization via Token SMS or Token APP
- `authorized` field indicates if transfer requires manual approval

### Methods

| Method | Description |
|--------|-------------|
| `toBank(params)` | Transfer to bank account or Pix key |
| `toAsaasAccount(params)` | Transfer to another Asaas account (requires walletId) |
| `list(params?)` | List all transfers with optional filters |
| `get(id)` | Get a single transfer by ID |
| `cancel(id)` | Cancel a pending transfer |
| `listWallets()` | List wallets to get walletId for internal transfers |

### Examples

#### Transfer to Bank Account

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Transfer via TED to bank account
const transfer = await client.transfers.toBank({
  value: 150.00,
  bankAccount: {
    bank: {
      code: '341' // Itaú
    },
    accountName: 'João Silva',
    ownerName: 'João Silva',
    ownerBirthDate: '1990-05-15',
    cpfCnpj: '12345678901',
    agency: '1234',
    account: '56789',
    accountDigit: '0',
    bankAccountType: 'CONTA_CORRENTE'
  },
  operationType: 'TED', // or 'PIX' for automatic selection
  description: 'Pagamento de fornecedor',
  scheduleDate: '2026-03-20', // optional scheduling
  externalReference: 'INV-2026-001'
})

console.log(transfer.id)
console.log(transfer.status) // PENDING, BANK_PROCESSING, DONE
console.log(transfer.authorized) // true if no manual approval needed
console.log(transfer.transactionReceiptUrl) // Download receipt when available
```

#### Transfer via Pix Key

```typescript
// Transfer using CPF as Pix key
const pixTransfer = await client.transfers.toBank({
  value: 250.50,
  pixAddressKey: '12345678901',
  pixAddressKeyType: 'CPF',
  operationType: 'PIX',
  description: 'Reembolso cliente',
  externalReference: 'REFUND-789'
})

// Transfer using email as Pix key
const emailTransfer = await client.transfers.toBank({
  value: 100.00,
  pixAddressKey: 'joao@exemplo.com.br',
  pixAddressKeyType: 'EMAIL',
  description: 'Pagamento freelancer'
})

// Transfer using phone (11 digits with area code)
const phoneTransfer = await client.transfers.toBank({
  value: 75.00,
  pixAddressKey: '11987654321',
  pixAddressKeyType: 'PHONE'
})

// Transfer using random key (EVP)
const evpTransfer = await client.transfers.toBank({
  value: 300.00,
  pixAddressKey: '123e4567-e89b-12d3-a456-426614174000',
  pixAddressKeyType: 'EVP',
  description: 'Pagamento parceiro'
})
```

#### Transfer to Asaas Account

```typescript
// First, get the walletId of the destination account
const wallets = await client.transfers.listWallets()
const destinationWallet = wallets.data.find(w => w.id === 'wallet_abc123')

// Transfer to another Asaas account in your operation
const internalTransfer = await client.transfers.toAsaasAccount({
  value: 500.00,
  walletId: destinationWallet.id,
  externalReference: 'INT-TRANSFER-2026-03'
})

console.log(internalTransfer.status) // Usually DONE immediately
console.log(internalTransfer.type) // INTERNAL
```

#### List and Filter Transfers

```typescript
// List all transfers with pagination
const result = await client.transfers.list({
  limit: 20,
  offset: 0
})

for await (const transfer of result) {
  console.log(`${transfer.id}: ${transfer.value} - ${transfer.status}`)
  console.log(`Type: ${transfer.type}`) // PIX, TED, INTERNAL
  console.log(`Effective Date: ${transfer.effectiveDate}`)
}

// Filter by date range and type
const filtered = await client.transfers.list({
  'dateCreated[ge]': '2026-03-01',
  'dateCreated[le]': '2026-03-31',
  type: 'PIX',
  limit: 50
})

for await (const transfer of filtered) {
  if (transfer.status === 'DONE') {
    console.log(`Completed: ${transfer.endToEndIdentifier}`)
  }
}
```

#### Get and Cancel Transfer

```typescript
// Get single transfer details
const transfer = await client.transfers.get('transf_abc123')

console.log(transfer.value)
console.log(transfer.netValue) // value minus fees
console.log(transfer.transferFee)
console.log(transfer.failReason) // if status is FAILED

// Cancel pending transfer
if (transfer.status === 'PENDING') {
  const cancelled = await client.transfers.cancel(transfer.id)
  console.log(cancelled.status) // CANCELLED
}
```

#### Recurring Pix Transfer

```typescript
// Create recurring Pix transfer (weekly or monthly)
const recurringTransfer = await client.transfers.toBank({
  value: 100.00,
  pixAddressKey: 'fornecedor@empresa.com.br',
  pixAddressKeyType: 'EMAIL',
  operationType: 'PIX',
  description: 'Pagamento mensal fornecedor',
  recurring: {
    frequency: 'MONTHLY', // or 'WEEKLY'
    quantity: 11 // max 11 for MONTHLY, 51 for WEEKLY
  }
})

console.log(recurringTransfer.recurring)
```

### Sandbox Limitations

- **Pix transfers**: Work with fictitious BACEN keys and complete immediately with success
- **TED transfers**: Require manual controls in Asaas interface to simulate success/failure
- **Internal transfers**: Can be fully tested in sandbox environment
- Automatic approval may still require manual steps depending on account configuration

## Bill Payments

Bill payments allow you to pay bills using the barcode identification field (linha digitável). The Asaas account balance is debited to pay third-party bills.

### Key Concepts

**Payment Flow:**
1. Simulate the bill payment to validate and get fee information
2. Create the bill payment with the identification field
3. Track payment status through webhooks or polling
4. Download receipt when payment is completed

**Scheduling Rules:**
- If `scheduleDate` is provided, payment is scheduled for that date
- If date falls on non-business day, payment occurs on next business day
- If `scheduleDate` is not provided, payment occurs on bill due date
- Overdue bills cannot be scheduled and are paid immediately

**Bill Payment Status:**
- `PENDING`: Payment created, awaiting processing
- `BANK_PROCESSING`: Being processed by bank
- `PAID`: Successfully paid
- `CANCELLED`: Cancelled before processing
- `FAILED`: Failed to complete
- `REFUNDED`: Payment was refunded
- `AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST`: Under risk analysis

### Methods

| Method | Description |
|--------|-------------|
| `simulate(params)` | Simulate bill payment to validate and get fees |
| `create(params)` | Create a bill payment |
| `list(params?)` | List all bill payments with pagination |
| `get(id)` | Get a single bill payment by ID |
| `cancel(id)` | Cancel a pending bill payment |

### Examples

#### Simulate Bill Payment

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Simulate payment to validate barcode and get fee estimate
const simulation = await client.bill.simulate({
  identificationField: '34191790010104351004791020150008291070026000'
})

console.log(simulation.value) // Bill amount
console.log(simulation.discount) // Available discount
console.log(simulation.interest) // Interest charged
console.log(simulation.fine) // Fine charged
console.log(simulation.netValue) // Total to be paid
console.log(simulation.bankSlipFee) // Asaas processing fee
```

#### Create Bill Payment

```typescript
// Pay immediately (on due date if not overdue)
const payment = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  description: 'Pagamento conta de luz - Março 2026',
  externalReference: 'BILL-LUZ-03-2026'
})

console.log(payment.id)
console.log(payment.status) // PENDING
console.log(payment.canBeCancelled) // true if cancellation is allowed

// Schedule payment for specific date
const scheduledPayment = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  scheduleDate: '2026-03-25',
  description: 'Pagamento agendado - Fornecedor XYZ'
})

console.log(scheduledPayment.scheduleDate)
```

#### Manual Bill Information

For bills that don't have embedded information (like credit card bills):

```typescript
// Provide manual bill details
const manualBill = await client.bill.create({
  identificationField: '34191790010104351004791020150008291070026000',
  value: 350.75,
  dueDate: '2026-03-30',
  description: 'Fatura cartão corporativo',
  discount: 0,
  interest: 0,
  fine: 0
})
```

#### List Bill Payments

```typescript
// List all bill payments with pagination
const result = await client.bill.list({
  limit: 20,
  offset: 0
})

for await (const bill of result) {
  console.log(`${bill.id}: R$ ${bill.value} - ${bill.status}`)
  console.log(`Description: ${bill.description}`)
  if (bill.transactionReceiptUrl) {
    console.log(`Receipt: ${bill.transactionReceiptUrl}`)
  }
}

console.log(`Total: ${result.totalCount}`)
console.log(`Has more: ${result.hasMore}`)
```

#### Get and Cancel Bill Payment

```typescript
// Get single bill payment details
const bill = await client.bill.get('bill_abc123')

console.log(bill.status)
console.log(bill.value)
console.log(bill.netValue) // includes fees

if (bill.canBeCancelled) {
  // Cancel pending payment
  const cancelled = await client.bill.cancel(bill.id)
  console.log(cancelled.status) // CANCELLED
}

// Check failure reasons if payment failed
if (bill.status === 'FAILED' && bill.failReasons) {
  console.error('Payment failed:', bill.failReasons)
}
```

### Sandbox Limitations

- Bill payments can be tested in sandbox with valid barcode formats
- Success/failure simulation may require manual controls in Asaas interface
- Some states may only be observable in production environment

## Escrow

Escrow allows you to hold payment funds in a guaranteed account before releasing them to subaccounts. This provides transaction security by ensuring funds are only released when conditions are met.

### Key Concepts

**Configuration Levels:**
- **Default Configuration**: Applied to all subaccounts by default
- **Subaccount Configuration**: Override default settings for specific subaccount

**Escrow Flow:**
1. Configure escrow settings (days to expire, enabled status, fee payer)
2. When subaccount receives payment, funds are held in escrow
3. Funds are automatically released after expiration period
4. Or manually finish escrow to release funds immediately

**Key Settings:**
- `daysToExpire`: Number of days until escrow expires and funds are released
- `enabled`: Whether escrow is active for the account/subaccount
- `isFeePayer`: If true, subaccount pays escrow fee; if false, main account pays

### Methods

| Method | Description |
|--------|-------------|
| `getConfig()` | Get default escrow configuration for all subaccounts |
| `updateConfig(params)` | Update default escrow configuration |
| `getSubaccountConfig(subaccountId)` | Get escrow configuration for specific subaccount |
| `updateSubaccountConfig(subaccountId, params)` | Update configuration for specific subaccount |
| `getPaymentEscrow(paymentId)` | Get escrow details for a specific payment |
| `finishPaymentEscrow(paymentId)` | Release escrow funds immediately |

### Examples

#### Configure Default Escrow

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Set default escrow configuration for all subaccounts
const config = await client.escrow.updateConfig({
  daysToExpire: 15, // Hold funds for 15 days
  enabled: true,
  isFeePayer: false // Main account pays escrow fees
})

console.log(config.daysToExpire)
console.log(config.enabled)

// Get current default configuration
const currentConfig = await client.escrow.getConfig()
console.log('Default escrow days:', currentConfig.daysToExpire)
```

#### Configure Subaccount Escrow

```typescript
// Override escrow settings for specific subaccount
const subaccountConfig = await client.escrow.updateSubaccountConfig(
  'acc_abc123',
  {
    daysToExpire: 30, // Hold for 30 days for this subaccount
    enabled: true,
    isFeePayer: true // This subaccount pays its own escrow fees
  }
)

console.log('Subaccount escrow configured')

// Get subaccount-specific configuration
const config = await client.escrow.getSubaccountConfig('acc_abc123')
console.log(`Days to expire: ${config.daysToExpire}`)
console.log(`Fee payer: ${config.isFeePayer ? 'Subaccount' : 'Main account'}`)
```

#### Disable Escrow

```typescript
// Disable escrow for all new subaccounts
await client.escrow.updateConfig({
  daysToExpire: 0,
  enabled: false
})

// Disable escrow for specific subaccount
await client.escrow.updateSubaccountConfig('acc_abc123', {
  daysToExpire: 0,
  enabled: false
})
```

#### Manage Payment Escrow

```typescript
// Get escrow details for a specific payment
const paymentEscrow = await client.escrow.getPaymentEscrow('pay_xyz789')

console.log(paymentEscrow.value) // Amount held in escrow
console.log(paymentEscrow.expirationDate) // When funds will be released
console.log(paymentEscrow.status) // Escrow status

// Release escrow funds immediately (before expiration)
const finished = await client.escrow.finishPaymentEscrow('pay_xyz789')
console.log('Escrow finished, funds released to subaccount')
```

### Use Cases

**Marketplace Transactions:**
```typescript
// Hold payment for 7 days after delivery
await client.escrow.updateConfig({
  daysToExpire: 7,
  enabled: true,
  isFeePayer: false
})

// When customer confirms receipt, release immediately
await client.escrow.finishPaymentEscrow(paymentId)
```

**High-Risk Subaccounts:**
```typescript
// Extended hold period for new subaccount
await client.escrow.updateSubaccountConfig('acc_new_vendor', {
  daysToExpire: 45,
  enabled: true,
  isFeePayer: true
})
```

## Splits

Splits allow you to automatically distribute payment values across multiple wallets. When a payment is received, it can be split between your main account and other Asaas accounts in your operation.

### Key Concepts

**Split Configuration:**
- Splits are configured when creating payments, installments, subscriptions, or checkout links
- Can specify fixed values or percentages
- Multiple wallets can receive portions of the same payment
- Split values must respect net value after anticipations (if any)

**Split Views:**
- **Paid Splits**: Splits you send to other wallets from your payments
- **Received Splits**: Splits you receive from other accounts' payments

**Split Status:**
- `PENDING`: Split created, awaiting payment confirmation
- `PROCESSING`: Payment confirmed, processing distribution
- `AWAITING_CREDIT`: Waiting for funds transfer
- `DONE`: Split successfully completed
- `CANCELLED`: Split was cancelled
- `REFUNDED`: Payment was refunded, split reversed
- `PROCESSING_REFUND`: Refund in progress
- `BLOCKED_BY_VALUE_DIVERGENCE`: Blocked due to value mismatch (e.g., after anticipation)

**Cancellation Reasons:**
- `PAYMENT_DELETED`: Parent payment was deleted
- `PAYMENT_OVERDUE`: Payment became overdue
- `PAYMENT_RECEIVED_IN_CASH`: Payment received in cash
- `PAYMENT_REFUNDED`: Payment was refunded
- `VALUE_DIVERGENCE_BLOCK`: Split value doesn't match available amount
- `WALLET_UNABLE_TO_RECEIVE`: Destination wallet cannot receive splits

### Methods

| Method | Description |
|--------|-------------|
| `listPaidSplits(params?)` | List splits you've sent to other wallets |
| `listReceivedSplits(params?)` | List splits you've received from others |
| `getStatistics(params?)` | Get aggregated split statistics (income vs outgoing) |

### Examples

#### List Paid Splits

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// List all splits you've sent
const result = await client.splits.listPaidSplits({
  limit: 20,
  offset: 0
})

for await (const split of result) {
  console.log(`Split ${split.id}`)
  console.log(`  To wallet: ${split.walletId}`)
  console.log(`  Value: R$ ${split.totalValue}`)
  console.log(`  Status: ${split.status}`)
  console.log(`  Description: ${split.description || 'N/A'}`)
}

// Filter by status
const doneSplits = await client.splits.listPaidSplits({
  status: 'DONE',
  limit: 50
})

for await (const split of doneSplits) {
  console.log(`Completed split: R$ ${split.totalValue} to ${split.walletId}`)
}
```

#### Filter Splits by Date

```typescript
// Splits confirmed in March 2026
const marchSplits = await client.splits.listPaidSplits({
  'paymentConfirmedDate[ge]': '2026-03-01',
  'paymentConfirmedDate[le]': '2026-03-31',
  limit: 100
})

let total = 0
for await (const split of marchSplits) {
  total += split.totalValue
}
console.log(`Total split in March: R$ ${total.toFixed(2)}`)

// Filter by credit date
const creditedSplits = await client.splits.listPaidSplits({
  'creditDate[ge]': '2026-03-15',
  'creditDate[le]': '2026-03-20'
})

for await (const split of creditedSplits) {
  console.log(`Credited on ${split.creditDate}: R$ ${split.totalValue}`)
}
```

#### List Received Splits

```typescript
// List splits you've received from other accounts
const receivedResult = await client.splits.listReceivedSplits({
  limit: 20,
  offset: 0
})

for await (const split of receivedResult) {
  console.log(`Received ${split.id}`)
  console.log(`  Value: R$ ${split.totalValue}`)
  console.log(`  Status: ${split.status}`)
  console.log(`  External ref: ${split.externalReference || 'N/A'}`)
}

// Filter by payment ID
const paymentSplits = await client.splits.listReceivedSplits({
  paymentId: 'pay_abc123'
})

for await (const split of paymentSplits) {
  if (split.fixedValue) {
    console.log(`Fixed: R$ ${split.fixedValue}`)
  }
  if (split.percentualValue) {
    console.log(`Percentage: ${split.percentualValue}%`)
  }
}
```

#### Get Split Statistics

```typescript
// Get aggregated split values
const stats = await client.splits.getStatistics()

console.log('Split Statistics:')
console.log(`  To receive (income): R$ ${stats.income}`)
console.log(`  To send (value): R$ ${stats.value}`)

const netFlow = stats.income - stats.value
console.log(`  Net flow: R$ ${netFlow.toFixed(2)}`)

if (netFlow > 0) {
  console.log('  → You will receive more than you send')
} else {
  console.log('  → You will send more than you receive')
}
```

#### Handle Split Errors

```typescript
// Check for blocked splits
const blockedSplits = await client.splits.listPaidSplits({
  status: 'BLOCKED_BY_VALUE_DIVERGENCE'
})

for await (const split of blockedSplits) {
  console.error(`Split ${split.id} blocked`)
  console.error(`  Reason: ${split.cancellationReason}`)
  console.error(`  Payment: ${split.paymentId}`)
  console.error(`  Expected: R$ ${split.totalValue}`)
  // May need to adjust split values or review anticipation impact
}

// Monitor cancelled splits
const cancelledSplits = await client.splits.listPaidSplits({
  status: 'CANCELLED'
})

for await (const split of cancelledSplits) {
  console.log(`Cancelled: ${split.id}`)
  console.log(`  Reason: ${split.cancellationReason}`)
}
```

## Anticipations

Anticipations allow you to receive payment funds before the due date by requesting advance payment of receivables (credit card installments or bank slips). This improves cash flow by converting future receivables into immediate funds.

### Key Concepts

**Anticipation Types:**
- **Installment Anticipation**: Anticipate all or specific installments from a payment plan
- **Payment Anticipation**: Anticipate a single payment receivable

**Anticipation Flow:**
1. Check available limits for credit card and bank slip
2. Simulate anticipation to see fees and net value
3. Create anticipation request (may require documentation)
4. Track status until funds are credited
5. Cancel if needed before processing completes

**Anticipation Status:**
- `PENDING`: Request created, under analysis
- `SCHEDULED`: Approved and scheduled for credit
- `CREDITED`: Funds credited to your account
- `DEBITED`: Original receivable was debited (when due)
- `DENIED`: Request was denied
- `CANCELLED`: Cancelled before processing
- `OVERDUE`: Anticipation became overdue

**Key Considerations:**
- Fees are charged based on days anticipated and risk assessment
- Documentation may be required for certain anticipations
- Automatic anticipation can be enabled for credit card receivables
- Split payments must respect net value after anticipation

### Methods

| Method | Description |
|--------|-------------|
| `simulate(params)` | Simulate anticipation to get fees and net value |
| `create(params)` | Request anticipation (may include documents) |
| `list(params?)` | List all anticipations with filters |
| `get(id)` | Get a single anticipation by ID |
| `cancel(id)` | Cancel a pending anticipation |
| `getLimits()` | Get available anticipation limits by type |

### Examples

#### Check Anticipation Limits

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Check available limits
const limits = await client.anticipations.getLimits()

console.log('Anticipation Limits:')
console.log('Credit Card:')
console.log(`  Total: R$ ${limits.creditCard.total}`)
console.log(`  Available: R$ ${limits.creditCard.available}`)
console.log('Bank Slip:')
console.log(`  Total: R$ ${limits.bankSlip.total}`)
console.log(`  Available: R$ ${limits.bankSlip.available}`)
```

#### Simulate Anticipation

```typescript
// Simulate installment anticipation
const installmentSim = await client.anticipations.simulate({
  installment: 'inst_abc123'
})

console.log('Simulation Results:')
console.log(`  Original value: R$ ${installmentSim.value}`)
console.log(`  Anticipation fee: R$ ${installmentSim.fee}`)
console.log(`  Net value: R$ ${installmentSim.netValue}`)
console.log(`  Days anticipated: ${installmentSim.anticipationDays}`)
console.log(`  Due date: ${installmentSim.dueDate}`)
console.log(`  Credit date: ${installmentSim.anticipationDate}`)
console.log(`  Documentation required: ${installmentSim.isDocumentationRequired}`)

// Simulate payment anticipation
const paymentSim = await client.anticipations.simulate({
  payment: 'pay_xyz789'
})

console.log(`Net to receive: R$ ${paymentSim.netValue}`)
```

#### Create Anticipation

```typescript
// Simple anticipation without documents
const anticipation = await client.anticipations.create({
  installment: 'inst_abc123'
})

console.log(`Anticipation ${anticipation.id} created`)
console.log(`Status: ${anticipation.status}`)
console.log(`Net value: R$ ${anticipation.netValue}`)

// Anticipation for single payment
const paymentAnticipation = await client.anticipations.create({
  payment: 'pay_xyz789'
})

console.log(`Anticipated R$ ${paymentAnticipation.netValue}`)
```

#### Create Anticipation with Documents

```typescript
import * as fs from 'fs'

// When documentation is required
const simulation = await client.anticipations.simulate({
  installment: 'inst_abc123'
})

if (simulation.isDocumentationRequired) {
  // Create FormData with documents
  const formData = new FormData()
  formData.append('installment', 'inst_abc123')

  // Add document files
  const invoice = fs.readFileSync('./invoice.pdf')
  formData.append('documents', new Blob([invoice]), 'invoice.pdf')

  const contract = fs.readFileSync('./contract.pdf')
  formData.append('documents', new Blob([contract]), 'contract.pdf')

  // Create with documents
  const anticipation = await client.anticipations.create(formData)
  console.log('Anticipation with documents created:', anticipation.id)
}
```

#### List Anticipations

```typescript
// List all anticipations
const result = await client.anticipations.list({
  limit: 20,
  offset: 0
})

for await (const anticipation of result) {
  console.log(`${anticipation.id}: R$ ${anticipation.netValue}`)
  console.log(`  Status: ${anticipation.status}`)
  console.log(`  Request date: ${anticipation.requestDate}`)
  console.log(`  Credit date: ${anticipation.anticipationDate}`)
}

// Filter by status
const credited = await client.anticipations.list({
  status: 'CREDITED',
  limit: 50
})

let totalCredited = 0
for await (const anticipation of credited) {
  totalCredited += anticipation.netValue
}
console.log(`Total credited: R$ ${totalCredited.toFixed(2)}`)

// Filter by payment or installment
const paymentAnticipations = await client.anticipations.list({
  payment: 'pay_abc123'
})

for await (const anticipation of paymentAnticipations) {
  console.log(`Payment anticipation: ${anticipation.id}`)
}
```

#### Get and Cancel Anticipation

```typescript
// Get single anticipation details
const anticipation = await client.anticipations.get('antcp_abc123')

console.log(anticipation.status)
console.log(`Original value: R$ ${anticipation.totalValue}`)
console.log(`Fee: R$ ${anticipation.fee}`)
console.log(`Net received: R$ ${anticipation.netValue}`)
console.log(`Days anticipated: ${anticipation.anticipationDays}`)

if (anticipation.status === 'DENIED') {
  console.error('Denial reason:', anticipation.denialObservation)
}

// Cancel pending anticipation
if (anticipation.status === 'PENDING') {
  const cancelled = await client.anticipations.cancel(anticipation.id)
  console.log(cancelled.status) // CANCELLED
}
```

### Sandbox Limitations

- Anticipation simulation works fully in sandbox
- Actual anticipation requests may require manual approval in sandbox
- Documentation upload can be tested but approval is manual
- Limits reflect sandbox configuration, not production capacity

## Anticipation Config

Configure automatic anticipation settings to automatically anticipate credit card receivables as soon as they're generated.

### Key Concepts

**Automatic Anticipation:**
- Applies only to credit card receivables (documented limitation)
- When enabled, eligible receivables are automatically anticipated
- Saves time by eliminating manual anticipation requests
- Standard anticipation fees still apply

**Configuration:**
- Single boolean toggle for credit card automatic anticipation
- Once enabled, applies to all new eligible receivables
- Can be disabled at any time

### Methods

| Method | Description |
|--------|-------------|
| `get()` | Get current automatic anticipation configuration |
| `update(params)` | Enable or disable automatic anticipation |

### Examples

#### Check Automatic Anticipation Status

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk'

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN,
  environment: 'SANDBOX'
})

// Get current configuration
const config = await client.anticipationConfig.get()

console.log('Automatic Anticipation:')
console.log(`  Credit Card: ${config.creditCardAutomaticEnabled ? 'Enabled' : 'Disabled'}`)

if (config.creditCardAutomaticEnabled) {
  console.log('  → New credit card receivables will be automatically anticipated')
} else {
  console.log('  → Manual anticipation required')
}
```

#### Enable Automatic Anticipation

```typescript
// Enable automatic anticipation for credit card
const updated = await client.anticipationConfig.update({
  creditCardAutomaticEnabled: true
})

console.log('Automatic anticipation enabled')
console.log('All future credit card receivables will be anticipated automatically')
```

#### Disable Automatic Anticipation

```typescript
// Disable automatic anticipation
const updated = await client.anticipationConfig.update({
  creditCardAutomaticEnabled: false
})

console.log('Automatic anticipation disabled')
console.log('Manual anticipation request required for new receivables')
```

#### Toggle Based on Business Logic

```typescript
// Enable during high-demand periods
async function enableAutoAnticipationForHighSeason() {
  const config = await client.anticipationConfig.get()

  if (!config.creditCardAutomaticEnabled) {
    await client.anticipationConfig.update({
      creditCardAutomaticEnabled: true
    })
    console.log('Auto-anticipation enabled for high season')
  }
}

// Disable during periods with good cash flow
async function disableAutoAnticipationForNormalPeriods() {
  const config = await client.anticipationConfig.get()

  if (config.creditCardAutomaticEnabled) {
    await client.anticipationConfig.update({
      creditCardAutomaticEnabled: false
    })
    console.log('Auto-anticipation disabled - normal cash flow')
  }
}
```

### Important Notes

1. **Scope Limitation**: Current API only supports automatic anticipation for credit card receivables. Bank slip automatic anticipation is not available through this configuration.

2. **Fees Apply**: Automatic anticipation still incurs standard anticipation fees based on days and risk.

3. **Eligibility**: Not all receivables may be eligible for automatic anticipation. Check limits and simulation results.

4. **Existing Receivables**: Changing configuration only affects new receivables created after the change.

### Sandbox Limitations

- Configuration can be toggled in sandbox
- Automatic anticipation behavior can be tested with test credit card payments
- Actual fund movement in sandbox follows same rules as production but with simulated timing

## Related

- **[Payments](./payments.md)**: Create charges that generate receivables for anticipation
- **[Installments](./installments.md)**: Manage payment plans and split anticipation
- **[Subaccounts](./subaccounts.md)**: Configure escrow and splits for subaccounts
- **[Webhooks](./webhooks.md)**: Track transfer, bill payment, split, and anticipation events
- **[Error Handling](../guides/error-handling.md)**: Handle transfer validation and authorization errors
