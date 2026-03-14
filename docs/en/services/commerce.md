# Commerce & Invoicing

This guide covers the five services that compose the Commerce & Invoicing domain in the Asaas SDK: Payment Links, Checkouts, Checkout Configuration, Invoices, and Fiscal Information.

## Table of Contents

- [Payment Links Service](#payment-links-service)
- [Checkouts Service](#checkouts-service)
- [Checkout Configuration Service](#checkout-configuration-service)
- [Invoices Service](#invoices-service)
- [Fiscal Information Service](#fiscal-information-service)
- [Related Resources](#related-resources)

## Payment Links Service

The Payment Links service (`client.paymentLinks`) manages persistent, shareable payment links that customers can use to generate charges, subscriptions, or installments.

### Key Concepts

**Payment Links vs Checkouts**

- **Payment Links** are persistent, reusable resources with a public URL that can generate multiple charges over time
- **Checkouts** are ephemeral sessions for specific purchases with items, callbacks, and limited lifetime

**Charge Types**

When creating a payment link, specify the charge type:
- `DETACHED` - Single payment charges
- `RECURRENT` - Recurring subscription charges
- `INSTALLMENT` - Installment payment plans

**Billing Types**

- `UNDEFINED` - Customer chooses payment method
- `BOLETO` - Bank slip (boleto bancário)
- `CREDIT_CARD` - Credit card
- `PIX` - Instant payment

**Subscription Cycles** (for `RECURRENT` links)

- `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `BIMONTHLY`, `QUARTERLY`, `SEMIANNUALLY`, `YEARLY`

**Soft Delete**

Payment links use soft deletion. Use `remove()` to deactivate and `restore()` to reactivate.

**Images Sub-Service**

Each payment link supports up to 5 images. Use the `images` sub-service to add product photos, set a main image, and manage the hosted payment experience.

**Important Behavior**

Each payment made through a link creates a new customer in Asaas. This may cause duplicate customers if the same person pays multiple times.

### Methods Reference

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new payment link |
| `list(params?)` | List payment links with filters (paginated) |
| `get(id)` | Retrieve a payment link by ID |
| `update(id, params)` | Update an existing payment link |
| `remove(id)` | Soft-delete a payment link |
| `restore(id)` | Restore a previously deleted link |
| `images.add(linkId, params)` | Add image to payment link (multipart) |
| `images.list(linkId)` | List all images for a link (paginated) |
| `images.get(linkId, imageId)` | Get a specific image |
| `images.remove(linkId, imageId)` | Remove an image |
| `images.setMain(linkId, imageId)` | Set an image as the main image |

### Examples

#### Create a Payment Link for Single Payments

```typescript
import { AsaasClient } from '@rodrigogs/asaas-sdk';

const client = new AsaasClient({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
});

const link = await client.paymentLinks.create({
  name: 'Consultoria em TI',
  billingType: 'PIX',
  chargeType: 'DETACHED',
  value: 500.00,
  description: 'Serviço de consultoria técnica',
  notificationEnabled: true,
  callback: {
    successUrl: 'https://myapp.com/success',
  },
});

console.log('Payment link URL:', link.url);
console.log('Link ID:', link.id);
console.log('Charge type:', link.chargeType);
```

#### Create a Subscription Payment Link

```typescript
const subscriptionLink = await client.paymentLinks.create({
  name: 'Plano Premium Mensal',
  billingType: 'CREDIT_CARD',
  chargeType: 'RECURRENT',
  value: 99.90,
  subscriptionCycle: 'MONTHLY',
  description: 'Assinatura mensal do plano premium',
  dueDateLimitDays: 5,
  notificationEnabled: true,
});

console.log('Subscription link:', subscriptionLink.url);
console.log('Cycle:', subscriptionLink.subscriptionCycle);
```

#### Create an Installment Payment Link

```typescript
const installmentLink = await client.paymentLinks.create({
  name: 'Curso Online - 12x',
  billingType: 'BOLETO',
  chargeType: 'INSTALLMENT',
  value: 1200.00,
  maxInstallmentCount: 12,
  description: 'Curso completo de desenvolvimento web',
  endDate: '2026-12-31',
});

console.log('Installment link:', installmentLink.url);
console.log('Max installments:', installmentLink.maxInstallmentCount);
```

#### List Payment Links

```typescript
const result = await client.paymentLinks.list({
  active: true,
});

for await (const link of result) {
  console.log('Link:', link.name);
  console.log('  Type:', link.chargeType);
  console.log('  Views:', link.viewCount);
  console.log('  Active:', link.active);
}
```

#### Update a Payment Link

```typescript
const updated = await client.paymentLinks.update(link.id, {
  name: 'Consultoria em TI - Atualizado',
  value: 550.00,
  description: 'Serviço de consultoria técnica especializada',
  active: true,
});

console.log('Updated link:', updated.name);
```

#### Soft Delete and Restore

```typescript
// Soft delete
await client.paymentLinks.remove(link.id);
console.log('Link deactivated');

// Restore
const restored = await client.paymentLinks.restore(link.id);
console.log('Link restored:', restored.active);
```

#### Add Images to Payment Link

```typescript
import { readFile } from 'fs/promises';

const imageData = await readFile('./product-photo.jpg');
const imageBlob = new Blob([imageData], { type: 'image/jpeg' });

const image = await client.paymentLinks.images.add(link.id, {
  image: imageBlob,
  main: true, // Set as main image
});

console.log('Image ID:', image.id);
console.log('Is main:', image.main);
console.log('Preview URL:', image.image.previewUrl);
console.log('Download URL:', image.image.downloadUrl);
```

#### Manage Link Images

```typescript
// List all images
const images = await client.paymentLinks.images.list(link.id);

for await (const img of images) {
  console.log('Image:', img.id);
  console.log('  Main:', img.main);
  console.log('  Size:', img.image.size, 'bytes');
  console.log('  Extension:', img.image.extension);
}

// Get specific image
const specificImage = await client.paymentLinks.images.get(link.id, image.id);
console.log('Image URL:', specificImage.image.downloadUrl);

// Set different image as main
await client.paymentLinks.images.setMain(link.id, 'img_000002');
console.log('Main image updated');

// Remove image
await client.paymentLinks.images.remove(link.id, image.id);
console.log('Image removed');
```

## Checkouts Service

The Checkouts service (`client.checkouts`) manages hosted checkout sessions for cart-based purchases with item details, customer data, and post-payment redirects.

### Key Concepts

**Checkout Sessions**

Checkouts are ephemeral sessions that expire after a set time (default: 60 minutes). They're ideal for cart-based flows requiring:
- Multiple items with images and quantities
- Customer data collection
- Success/cancel/expired URL redirects
- Split payment configuration

**Billing Types**

Currently supported in checkouts:
- `CREDIT_CARD`
- `PIX`

**Charge Types**

- `DETACHED` - Single payment
- `RECURRENT` - Subscription (requires `subscription` params)
- `INSTALLMENT` - Installment plan (requires `installment` params)

**Items**

Each item requires:
- `name` - Product/service name
- `value` - Unit price
- `quantity` - Quantity
- `imageBase64` - Base64-encoded product image

**Important Note**

The Asaas API does not currently document `GET /v3/checkouts` or `GET /v3/checkouts/{id}` endpoints. Checkout tracking relies primarily on callbacks, `externalReference`, and webhooks (`CHECKOUT_CREATED`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `CHECKOUT_PAID`).

### Methods Reference

| Method | Description |
|--------|-------------|
| `create(params)` | Create a new checkout session |
| `list(params?)` | List checkouts with filters (paginated) |
| `get(id)` | Retrieve a checkout by ID |
| `cancel(id)` | Cancel a checkout session |

### Examples

#### Create a Simple Checkout

```typescript
const checkout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD', 'PIX'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://mystore.com/success',
    cancelUrl: 'https://mystore.com/cancel',
    expiredUrl: 'https://mystore.com/expired',
  },
  items: [
    {
      name: 'Notebook Dell Inspiron 15',
      value: 3500.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
    {
      name: 'Mouse Logitech',
      value: 150.00,
      quantity: 2,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  minutesToExpire: 120,
  externalReference: 'ORDER-2026-001',
});

console.log('Checkout ID:', checkout.id);
console.log('Expires in:', checkout.minutesToExpire, 'minutes');
```

#### Create Checkout with Customer Data

```typescript
const checkoutWithCustomer = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://mystore.com/success',
  },
  items: [
    {
      name: 'Curso de Python Avançado',
      value: 497.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  customerData: {
    name: 'Maria Silva',
    cpfCnpj: '12345678901',
    email: 'maria@example.com',
    phone: '11987654321',
    address: 'Rua Augusta',
    addressNumber: '1500',
    complement: 'Apto 42',
    province: 'Consolação',
    postalCode: '01304-001',
    city: 'São Paulo',
  },
  externalReference: 'CURSO-001',
});

console.log('Checkout with customer:', checkoutWithCustomer.id);
```

#### Create Subscription Checkout

```typescript
const subscriptionCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['RECURRENT'],
  callback: {
    successUrl: 'https://myapp.com/subscription/success',
  },
  items: [
    {
      name: 'Plano Profissional',
      value: 149.90,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  subscription: {
    cycle: 'MONTHLY',
    value: 149.90,
    description: 'Assinatura mensal plano profissional',
  },
  externalReference: 'SUB-PRO-001',
});

console.log('Subscription checkout:', subscriptionCheckout.id);
```

#### Create Installment Checkout

```typescript
const installmentCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD'],
  chargeTypes: ['INSTALLMENT'],
  callback: {
    successUrl: 'https://mystore.com/success',
  },
  items: [
    {
      name: 'Smartphone Samsung Galaxy',
      value: 2400.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  installment: {
    installmentCount: 12,
    value: 2400.00,
  },
  externalReference: 'PHONE-12X-001',
});

console.log('Installment checkout:', installmentCheckout.id);
```

#### Create Checkout with Split

```typescript
const splitCheckout = await client.checkouts.create({
  billingTypes: ['CREDIT_CARD', 'PIX'],
  chargeTypes: ['DETACHED'],
  callback: {
    successUrl: 'https://marketplace.com/success',
  },
  items: [
    {
      name: 'Produto do Vendedor A',
      value: 1000.00,
      quantity: 1,
      imageBase64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ],
  splits: [
    {
      walletId: 'wal_000001234567',
      percentageValue: 80.0, // 80% for seller
    },
    {
      walletId: 'wal_000007654321',
      percentageValue: 20.0, // 20% marketplace fee
    },
  ],
  externalReference: 'MARKETPLACE-SALE-001',
});

console.log('Split checkout created:', splitCheckout.id);
```

#### List and Cancel Checkouts

```typescript
// List checkouts
const checkouts = await client.checkouts.list();

for await (const checkout of checkouts) {
  console.log('Checkout:', checkout.id);
  console.log('  External ref:', checkout.externalReference);
  console.log('  Items:', checkout.items?.length);
}

// Cancel a checkout
await client.checkouts.cancel(checkout.id);
console.log('Checkout cancelled');
```

## Checkout Configuration Service

The Checkout Configuration service (`client.checkoutConfig`) manages visual personalization of the hosted checkout experience at the account level.

### Key Concepts

**Account-Level Configuration**

Customization applies to all checkouts for the account. Settings include:
- Logo file upload
- Background colors
- Font colors

**Approval Status**

After submitting customization, Asaas reviews the changes. Status values:
- `AWAITING_APPROVAL` - Pending review
- `APPROVED` - Customization active
- `REJECTED` - Rejected with observations

**Important Note**

This is NOT configuration of individual checkout sessions—it's the account-wide visual theme for all hosted checkout pages.

### Methods Reference

| Method | Description |
|--------|-------------|
| `get()` | Get current checkout personalization |
| `update(params)` | Update checkout config (colors, logo) |

### Examples

#### Get Current Configuration

```typescript
const config = await client.checkoutConfig.get();

console.log('Enabled:', config.enabled);
console.log('Logo URL:', config.logoUrl);
console.log('Background color:', config.logoBackgroundColor);
console.log('Info background:', config.infoBackgroundColor);
console.log('Font color:', config.fontColor);
console.log('Status:', config.status);
if (config.observations) {
  console.log('Observations:', config.observations);
}
```

#### Update Checkout Configuration

```typescript
import { readFile } from 'fs/promises';

const logoData = await readFile('./company-logo.png');
const logoBlob = new Blob([logoData], { type: 'image/png' });

const updated = await client.checkoutConfig.update({
  enabled: true,
  logoFile: logoBlob,
  logoBackgroundColor: '#1E40AF', // Blue
  infoBackgroundColor: '#F3F4F6', // Light gray
  fontColor: '#111827', // Dark gray
});

console.log('Configuration updated');
console.log('Status:', updated.status); // Likely AWAITING_APPROVAL
console.log('Logo URL:', updated.logoUrl);
```

#### Update Colors Only

```typescript
const colorsUpdated = await client.checkoutConfig.update({
  logoBackgroundColor: '#10B981', // Green
  infoBackgroundColor: '#FFFFFF', // White
  fontColor: '#000000', // Black
});

console.log('Colors updated:', colorsUpdated.status);
```

## Invoices Service

The Invoices service (`client.invoices`) handles the complete lifecycle of Brazilian NFS-e (Nota Fiscal de Serviço Eletrônica) issuance, including scheduling, authorization, updates, and cancellation.

### Key Concepts

**Invoice Lifecycle**

1. **Schedule** - Create invoice with `effectiveDate`
2. **Automatic Issuance** - If `effectiveDate` is today, issued within 15 minutes
3. **Manual Authorization** - Use `authorize()` to issue ahead of schedule
4. **Cancellation** - Cancel issued invoices (municipality-dependent)

**Invoice Status**

- `SCHEDULED` - Scheduled for future issuance
- `AUTHORIZED` - Successfully issued
- `SYNCHRONIZED` - Synchronized with municipal system
- `PROCESSING_CANCELLATION` - Cancellation in progress
- `CANCELED` - Successfully cancelled
- `CANCELLATION_DENIED` - Cancellation rejected by municipality
- `ERROR` - Issuance error

**Tax Reform Transition**

The API is transitioning to support IBS (Imposto sobre Bens e Serviços) and CBS (Contribuição sobre Bens e Serviços) from Brazil's tax reform. Current `taxes` object includes both legacy fields and new reform fields.

**Context Requirement**

Invoices must be tied to:
- `payment` - A payment ID, OR
- `installment` - An installment ID, OR
- `customer` - A customer ID (for standalone invoices)

**Municipal Services**

Identify services using:
- `municipalServiceId` - From service catalog (preferred), OR
- `municipalServiceCode` - Manual code when catalog unavailable (e.g., National Portal)

### Methods Reference

| Method | Description |
|--------|-------------|
| `schedule(params)` | Schedule an invoice for issuance |
| `list(params?)` | List invoices with filters (paginated) |
| `get(id)` | Retrieve an invoice by ID |
| `update(id, params)` | Update a scheduled invoice |
| `authorize(id)` | Authorize/issue an invoice immediately |
| `cancel(id, params?)` | Cancel an issued invoice |

### Examples

#### Schedule an Invoice for a Payment

```typescript
const invoice = await client.invoices.schedule({
  payment: 'pay_000001234567',
  serviceDescription: 'Desenvolvimento de aplicativo web personalizado',
  observations: 'Projeto concluído conforme especificações',
  value: 5000.00,
  deductions: 0.00,
  effectiveDate: '2026-03-20',
  municipalServiceId: 'svc_000001',
  taxes: {
    retainIss: false,
    iss: 2.5,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
  },
});

console.log('Invoice ID:', invoice.id);
console.log('Status:', invoice.status); // SCHEDULED
console.log('Effective date:', invoice.effectiveDate);
```

#### Schedule Invoice with Manual Service Code

```typescript
const invoiceWithCode = await client.invoices.schedule({
  customer: 'cus_000005836142',
  serviceDescription: 'Consultoria em tecnologia da informação',
  observations: 'Serviço prestado em março de 2026',
  value: 2500.00,
  deductions: 0.00,
  effectiveDate: '2026-03-15',
  municipalServiceCode: '01.07', // Manual code for IT consulting
  municipalServiceName: 'Suporte técnico em informática',
  taxes: {
    retainIss: true,
    iss: 3.0,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 1.5,
  },
});

console.log('Invoice scheduled:', invoiceWithCode.id);
```

#### Schedule Invoice with Tax Reform Fields

```typescript
const modernInvoice = await client.invoices.schedule({
  payment: 'pay_000002345678',
  serviceDescription: 'Desenvolvimento e manutenção de software',
  observations: 'Nota fiscal com adequação à Reforma Tributária',
  value: 10000.00,
  deductions: 500.00,
  effectiveDate: '2026-03-25',
  municipalServiceId: 'svc_000005',
  taxes: {
    retainIss: false,
    iss: 2.0,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
    // Tax reform fields
    nbsCode: '1.0401.30.00',
    taxSituationCode: '01',
    taxClassificationCode: 'T01',
    operationIndicatorCode: '01',
  },
});

console.log('Modern invoice:', modernInvoice.id);
console.log('NBS Code:', modernInvoice.taxes?.nbsCode);
```

#### List Invoices

```typescript
const result = await client.invoices.list({
  status: 'AUTHORIZED',
  effectiveDateGe: '2026-03-01',
  effectiveDateLe: '2026-03-31',
});

for await (const invoice of result) {
  console.log('Invoice:', invoice.id);
  console.log('  Number:', invoice.number);
  console.log('  Customer:', invoice.customer);
  console.log('  Value:', invoice.value);
  console.log('  Status:', invoice.status);
  console.log('  PDF:', invoice.pdfUrl);
  console.log('  XML:', invoice.xmlUrl);
}
```

#### Update a Scheduled Invoice

```typescript
const updated = await client.invoices.update(invoice.id, {
  serviceDescription: 'Desenvolvimento de aplicativo web - ATUALIZADO',
  value: 5500.00,
  observations: 'Valor atualizado após revisão do escopo',
  taxes: {
    retainIss: false,
    iss: 2.5,
    pis: 0.65,
    cofins: 3.0,
    csll: 1.0,
    inss: 0.0,
    ir: 0.0,
  },
});

console.log('Invoice updated:', updated.id);
console.log('New value:', updated.value);
```

#### Authorize Invoice Immediately

```typescript
// Issue a scheduled invoice ahead of its effectiveDate
const authorized = await client.invoices.authorize(invoice.id);

console.log('Invoice authorized:', authorized.id);
console.log('Status:', authorized.status); // AUTHORIZED or PROCESSING
console.log('Invoice number:', authorized.number);
console.log('Validation code:', authorized.validationCode);
console.log('PDF URL:', authorized.pdfUrl);
console.log('XML URL:', authorized.xmlUrl);
```

#### Cancel an Invoice

```typescript
// Cancel on Asaas only (doesn't communicate with municipality)
await client.invoices.cancel(invoice.id, {
  cancelOnlyOnAsaas: true,
});

console.log('Invoice cancelled on Asaas');

// Full cancellation (attempts to cancel with municipality)
await client.invoices.cancel(invoice.id, {
  cancelOnlyOnAsaas: false,
});

console.log('Invoice cancellation requested with municipality');
```

#### Get Invoice Details

```typescript
const details = await client.invoices.get(invoice.id);

console.log('Invoice:', details.id);
console.log('Type:', details.type);
console.log('Status:', details.status);
console.log('Status description:', details.statusDescription);
console.log('RPS:', `${details.rpsSerie}-${details.rpsNumber}`);
console.log('Invoice number:', details.number);
console.log('Value:', details.value);
console.log('Deductions:', details.deductions);
console.log('Estimated taxes:', details.estimatedTaxesDescription);
console.log('External reference:', details.externalReference);

// Tax details
if (details.taxes) {
  console.log('ISS:', details.taxes.iss, '%');
  console.log('PIS:', details.taxes.pis, '%');
  console.log('COFINS:', details.taxes.cofins, '%');

  // Tax reform fields (if available)
  if (details.taxes.municipalIbsValue) {
    console.log('Municipal IBS:', details.taxes.municipalIbsValue);
  }
  if (details.taxes.cbsValue) {
    console.log('CBS:', details.taxes.cbsValue);
  }
}
```

## Fiscal Information Service

The Fiscal Information service (`client.fiscalInfo`) manages the account's fiscal configuration required before issuing invoices, including municipal credentials, tax regimes, and service catalogs.

### Key Concepts

**Integration Sequence**

Before issuing invoices, you must:
1. Check municipal requirements with `getMunicipalServices()` (optional for discovery)
2. Upsert fiscal info with `upsert()`
3. Look up service codes with `getMunicipalServices()` if needed
4. Schedule invoices

**Authentication Types**

Municipalities require one of:
- `CERTIFICATE` - Digital certificate file + password
- `TOKEN` - Access token
- `USER_AND_PASSWORD` - Username + password

**National Portal**

Some municipalities integrate via Brazil's National Portal for invoice issuance. When enabled:
- Municipal service catalog may not be available via API
- You must provide `municipalServiceCode` manually when scheduling invoices

**Upsert Pattern**

`fiscalInfo.upsert()` creates OR updates fiscal information in a single call. The API uses multipart/form-data for certificate file uploads.

**Security Note**

Sensitive fields (password, access token, certificate) are not returned in GET responses. Instead, boolean flags indicate what's been set: `passwordSent`, `accessTokenSent`, `certificateSent`.

### Methods Reference

| Method | Description |
|--------|-------------|
| `getInfo()` | Get current fiscal information |
| `upsert(params)` | Create or update fiscal info (multipart) |
| `getMunicipalServices(params?)` | Look up municipal service codes (paginated) |
| `getNationalPortalConfig()` | Get National Portal configuration |
| `updateNationalPortalConfig(params)` | Enable/disable National Portal |

### Examples

#### Get Current Fiscal Information

```typescript
const fiscalInfo = await client.fiscalInfo.getInfo();

console.log('Email:', fiscalInfo.email);
console.log('Simples Nacional:', fiscalInfo.simplesNacional);
console.log('Municipal inscription:', fiscalInfo.municipalInscription);
console.log('CNAE:', fiscalInfo.cnae);
console.log('Special tax regime:', fiscalInfo.specialTaxRegime);
console.log('Service list item:', fiscalInfo.serviceListItem);

// Credential flags (actual values not returned)
console.log('Password configured:', fiscalInfo.passwordSent);
console.log('Access token configured:', fiscalInfo.accessTokenSent);
console.log('Certificate configured:', fiscalInfo.certificateSent);
```

#### Configure Fiscal Info with Username/Password

```typescript
const fiscalConfig = await client.fiscalInfo.upsert({
  email: 'fiscal@minhaempresa.com.br',
  simplesNacional: true,
  municipalInscription: '12345678',
  cnae: '6201-5/00',
  specialTaxRegime: 'MUNICIPAL_TAX_REGIME_1',
  serviceListItem: '01.07',
  username: 'empresa.cnpj',
  password: 'senha-municipal-segura',
});

console.log('Fiscal info configured');
console.log('Email:', fiscalConfig.email);
console.log('Password sent:', fiscalConfig.passwordSent);
```

#### Configure Fiscal Info with Access Token

```typescript
const fiscalWithToken = await client.fiscalInfo.upsert({
  email: 'fiscal@mycompany.com',
  simplesNacional: false,
  municipalInscription: '87654321',
  cnae: '6202-3/00',
  accessToken: 'municipal-access-token-here',
  nationalPortalTaxCalculationRegime: 'LUCRO_PRESUMIDO',
});

console.log('Fiscal info configured with token');
console.log('Token sent:', fiscalWithToken.accessTokenSent);
```

#### Configure Fiscal Info with Digital Certificate

```typescript
import { readFile } from 'fs/promises';

const certData = await readFile('./certificado-empresa.pfx');
const certBlob = new Blob([certData], { type: 'application/x-pkcs12' });

const fiscalWithCert = await client.fiscalInfo.upsert({
  email: 'fiscal@empresa.com.br',
  simplesNacional: true,
  municipalInscription: '98765432',
  cnae: '6201-5/00',
  certificateFile: certBlob,
  certificatePassword: 'senha-certificado',
  rpsSerie: 'A',
  rpsNumber: 1,
  loteNumber: 1,
});

console.log('Fiscal info with certificate configured');
console.log('Certificate sent:', fiscalWithCert.certificateSent);
```

#### Look Up Municipal Services

```typescript
// Search services by description
const services = await client.fiscalInfo.getMunicipalServices({
  description: 'desenvolvimento',
  limit: 10,
});

for await (const service of services) {
  console.log('Service:', service.id);
  console.log('  Description:', service.description);
  console.log('  ISS Tax:', service.issTax, '%');
}

// Use service ID when scheduling invoice
const invoice = await client.invoices.schedule({
  payment: 'pay_000001234567',
  serviceDescription: 'Desenvolvimento de software',
  municipalServiceId: services.data[0].id, // Use found service
  value: 5000.00,
  // ... rest of params
});
```

#### Configure National Portal

```typescript
// Check current configuration
const portalConfig = await client.fiscalInfo.getNationalPortalConfig();
console.log('National Portal enabled:', portalConfig.enabled);

// Enable National Portal
await client.fiscalInfo.updateNationalPortalConfig({
  enabled: true,
});

console.log('National Portal enabled for invoice issuance');

// Disable National Portal
await client.fiscalInfo.updateNationalPortalConfig({
  enabled: false,
});

console.log('National Portal disabled');
```

### Sandbox Limitations

When testing fiscal operations in the sandbox environment, note the following limitations:

**Fully Testable:**
- Fiscal info configuration (upsert)
- Municipal service lookups
- Invoice scheduling
- Invoice authorization
- Invoice status queries

**NOT Testable (Production Only):**
- Actual NFS-e issuance with municipalities
- Real PDF/XML generation with municipal layout
- Municipal cancellation flows
- Integration with National Portal

For sandbox testing, invoices will reach `AUTHORIZED` status but won't generate real municipal documents. Use the sandbox to validate your integration flow, then test end-to-end in production with small test invoices.

## Related Resources

- [Pagination Guide](../pagination.md) - Learn how to handle paginated responses
- [Error Handling](../error-handling.md) - Understand error handling patterns
- [Customers Service](./customers.md) - Manage customer records
- [Payments Service](./payments.md) - Create payments linked to invoices
- [Subscriptions Service](./subscriptions.md) - Configure automatic invoice issuance for subscriptions
- [Official Asaas Documentation](https://docs.asaas.com) - Complete API reference

## Best Practices

1. **Choose the right tool**: Use payment links for persistent, reusable links; use checkouts for cart-based purchases with callbacks
2. **Set callback URLs**: Always provide success/cancel/expired URLs in checkout sessions for proper customer flow
3. **Use external references**: Track checkouts and invoices with your internal order/transaction IDs
4. **Manage payment link images**: Use up to 5 high-quality images and set a main image for better conversion
5. **Configure fiscal info early**: Complete fiscal configuration before scheduling your first invoice
6. **Look up service codes**: Use `getMunicipalServices()` to find correct service IDs for accurate tax calculation
7. **Handle invoice status**: Monitor invoice status changes via webhooks (`INVOICE_SYNCHRONIZED`, etc.)
8. **Test authorization timing**: Schedule invoices with today's date for automatic issuance, or use `authorize()` for immediate processing
9. **Respect municipality limits**: Check if your municipality supports cancellation before relying on the cancel flow
10. **Prepare for tax reform**: Include tax reform fields (`nbsCode`, `taxSituationCode`, etc.) in invoice creation for compliance
11. **Use multipart correctly**: Remember that fiscal info and images require multipart/form-data, not JSON
12. **Track checkout sessions**: Rely on callbacks and webhooks for checkout state—GET endpoints may not be available
