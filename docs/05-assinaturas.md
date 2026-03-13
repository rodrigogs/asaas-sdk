# Assinaturas

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de assinaturas do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- ciclo principal de `subscriptions`
- cobranca recorrente por boleto, cartao e Pix dentro de assinatura
- criacao de assinatura com cartao de credito
- atualizacao do cartao da assinatura
- listagem de cobrancas geradas pela assinatura
- geracao de carne da assinatura
- configuracao de emissao automatica de notas fiscais para a assinatura
- listagem de notas fiscais das cobrancas da assinatura
- split em assinaturas e bloqueio por divergencia de split

Sem esse modulo, a integracao fica quebrada entre `subscriptions`, `payments`, `invoices`, `payment links`, `checkout` e `split`, com risco alto de tratar assinatura apenas como "um payment que se repete" e perder regras operacionais do Asaas.

## Papel do dominio na plataforma

O guia oficial de assinaturas posiciona esse recurso como a forma de cobrar periodicamente de maneira recorrente.

A documentacao oficial cita casos como:

- cobranca mensal por uso de software
- cobranca recorrente de aluguel
- recorrencias com outras periodicidades alem de mensal

Pela referencia atual, o enum oficial de `cycle` inclui:

- `WEEKLY`
- `BIWEEKLY`
- `MONTHLY`
- `BIMONTHLY`
- `QUARTERLY`
- `SEMIANNUALLY`
- `YEARLY`

Para o SDK, isso implica:

1. `subscriptions` e um agregado proprio, nao um alias de `payments`.
2. a assinatura define a regra de geracao das cobrancas futuras.
3. as cobrancas geradas continuam pertencendo ao dominio de `payments`, mas a origem e o controle da recorrencia ficam aqui.

## Recorte correto deste modulo

### O que entra aqui

- criacao, listagem, consulta, atualizacao e remocao de assinatura
- criacao de assinatura com cartao de credito
- atualizacao do cartao vinculado a assinatura
- filtros, status e semantica de exclusao
- listagem das cobrancas geradas pela assinatura
- download do carne da assinatura
- configuracao de `invoiceSettings` da assinatura
- listagem das notas fiscais ligadas as cobrancas da assinatura
- comportamento de split e bloqueio por divergencia de split

### O que fica para outros modulos

- CRUD completo de cobrancas avulsas
- recorrencia via Pix Recorrente e Pix Automatico
- modelagem completa de notas fiscais
- configuracao e consumo de webhooks
- checkout hospedado e payment links como modulos proprios

Um limite importante aqui e este:

- `billingType: PIX` dentro de `subscriptions` nao transforma esse recurso em `Pix Recorrente`
- assinatura recorrente com `billingType: PIX` continua sendo dominio de `subscriptions`

## Superficie oficial do dominio

Pelo conjunto atual de guias e referencias oficiais, o dominio de assinaturas se divide em tres blocos.

### 1. Ciclo principal da assinatura

- `POST /v3/subscriptions`
- `POST /v3/subscriptions/`
- `GET /v3/subscriptions`
- `GET /v3/subscriptions/{id}`
- `PUT /v3/subscriptions/{id}`
- `PUT /v3/subscriptions/{id}/creditCard`
- `DELETE /v3/subscriptions/{id}`

O ponto importante aqui e que a referencia atual documenta um endpoint separado para criacao com cartao em `POST /v3/subscriptions/`, com barra final.

Para o SDK, isso e uma inconsistencia de documentacao a ser absorvida, nao vazada como detalhe estranho da API publica.

### 2. Recursos derivados da assinatura

- `GET /v3/subscriptions/{id}/payments`
- `GET /v3/subscriptions/{id}/paymentBook`

### 3. Configuracao fiscal da assinatura

- `POST /v3/subscriptions/{id}/invoiceSettings`
- `GET /v3/subscriptions/{id}/invoiceSettings`
- `PUT /v3/subscriptions/{id}/invoiceSettings`
- `DELETE /v3/subscriptions/{id}/invoiceSettings`
- `GET /v3/subscriptions/{id}/invoices`

Pela referencia oficial atual, esse conjunto e o que existe publicamente para o recurso.

Um detalhe importante:

- diferente de `customers` e `payments`, a referencia atual nao documenta endpoint de `restore` para assinatura

## Contrato principal da assinatura

### Criacao

Na referencia principal, a criacao de assinatura exige:

- `customer`
- `billingType`
- `value`
- `nextDueDate`
- `cycle`

Os campos adicionais documentados sao:

- `discount`
- `interest`
- `fine`
- `description`
- `endDate`
- `maxPayments`
- `externalReference`
- `split`
- `callback`

O enum oficial de `billingType` na escrita atual e:

- `UNDEFINED`
- `BOLETO`
- `CREDIT_CARD`
- `PIX`

O enum oficial de `cycle` na escrita atual e:

- `WEEKLY`
- `BIWEEKLY`
- `MONTHLY`
- `BIMONTHLY`
- `QUARTERLY`
- `SEMIANNUALLY`
- `YEARLY`

### Leitura

O objeto retornado pela API inclui, entre outros:

- `object`
- `id`
- `dateCreated`
- `customer`
- `paymentLink`
- `billingType`
- `cycle`
- `value`
- `nextDueDate`
- `endDate`
- `description`
- `status`
- `discount`
- `fine`
- `interest`
- `deleted`
- `maxPayments`
- `externalReference`
- `checkoutSession`
- `split`

O enum oficial de `billingType` na leitura fica mais amplo:

- `UNDEFINED`
- `BOLETO`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `TRANSFER`
- `DEPOSIT`
- `PIX`

E o enum oficial de `status` na leitura atual e:

- `ACTIVE`
- `EXPIRED`
- `INACTIVE`

Para o SDK, isso implica:

- separar tipos de escrita e leitura
- preservar a relacao da assinatura com `paymentLink` e `checkoutSession`
- nao reduzir o recurso a um simples cron de cobrancas

## Atualizacao e semantica de remocao

### Atualizacao principal

Na referencia atual de `PUT /v3/subscriptions/{id}`, nenhum campo do body aparece como obrigatorio.

Os campos documentados para update sao:

- `billingType`
- `status`
- `nextDueDate`
- `discount`
- `interest`
- `fine`
- `cycle`
- `description`
- `endDate`
- `updatePendingPayments`
- `externalReference`
- `split`
- `callback`

Ha um ponto importante de modelagem aqui:

- a referencia atual de update nao documenta `value`
- a referencia atual de update tambem nao documenta `maxPayments`

Entao o SDK nao deve modelar `update` como `Partial<CreateSubscriptionInput>` sem cuidado.

O enum oficial documentado para `status` no request de update e:

- `ACTIVE`
- `INACTIVE`

### Remocao

O endpoint `DELETE /v3/subscriptions/{id}` retorna apenas:

- `deleted`
- `id`

Ao mesmo tempo, a listagem oficial aceita:

- `deletedOnly`
- `includeDeleted`

Isso sugere semantica de remocao logica ou pelo menos visibilidade de registros removidos na referencia atual.

Mas o SDK nao deve prometer `restore`, porque:

- a referencia publica atual nao documenta esse endpoint para assinatura

## Busca, filtros e estados

O endpoint `GET /v3/subscriptions` documenta os seguintes filtros:

- `offset`
- `limit`
- `customer`
- `customerGroupName`
- `billingType`
- `status`
- `deletedOnly`
- `includeDeleted`
- `externalReference`
- `order`
- `sort`

Os enums documentados de filtro incluem:

- `billingType`: `UNDEFINED`, `BOLETO`, `CREDIT_CARD`, `DEBIT_CARD`, `TRANSFER`, `DEPOSIT`, `PIX`
- `status`: `ACTIVE`, `EXPIRED`, `INACTIVE`

Para o SDK, isso pede:

- um tipo proprio de `ListSubscriptionsParams`
- preservacao do envelope oficial de lista
- cuidado para nao inferir filtros adicionais nao documentados

## Cartao de credito na assinatura

O Asaas trata cartao em assinatura como fluxo proprio, com dois endpoints separados.

### Criacao com cartao

A referencia de `POST /v3/subscriptions/` exige, alem dos campos normais da assinatura:

- `creditCard`
- `creditCardHolderInfo`
- `remoteIp`

E ainda aceita:

- `creditCardToken`

O guia oficial de "criando assinatura com cartao de credito" reforca que os dados do cartao e do portador podem ser enviados na criacao da assinatura para que o pagamento ja seja processado.

Para o SDK, isso sugere um metodo separado, nao um overload frouxo do `create`.

### Atualizacao do cartao

O endpoint `PUT /v3/subscriptions/{id}/creditCard` exige:

- `creditCard`
- `creditCardHolderInfo`
- `remoteIp`

E ainda aceita:

- `creditCardToken`

A referencia atual explicita um detalhe importante:

- esse endpoint atualiza o cartao da assinatura sem realizar cobranca imediata
- as cobrancas pendentes vinculadas a assinatura tambem sao atualizadas

### Implicacoes para o SDK

O desenho coerente e algo como:

```ts
asaas.subscriptions.create(input)
asaas.subscriptions.createWithCreditCard(input)
asaas.subscriptions.update(id, input)
asaas.subscriptions.updateCreditCard(id, input)
```

Isso evita misturar:

- criacao normal de assinatura
- criacao com dados sensiveis de cartao
- atualizacao estrutural da assinatura
- troca de cartao sem cobranca imediata

## Cobrancas geradas e carne

O dominio de assinaturas tambem expoe leitura das cobrancas derivadas do recurso.

### Listagem de cobrancas

O endpoint `GET /v3/subscriptions/{id}/payments` aceita:

- `status`

Com o mesmo enum oficial amplo de `payments`, incluindo valores como:

- `PENDING`
- `RECEIVED`
- `CONFIRMED`
- `OVERDUE`
- `REFUNDED`
- `RECEIVED_IN_CASH`
- `REFUND_REQUESTED`
- `REFUND_IN_PROGRESS`
- `CHARGEBACK_REQUESTED`
- `CHARGEBACK_DISPUTE`
- `AWAITING_CHARGEBACK_REVERSAL`
- `DUNNING_REQUESTED`
- `DUNNING_RECEIVED`
- `AWAITING_RISK_ANALYSIS`

Para o SDK, isso significa:

- a resposta deve reaproveitar o tipo de `payment` do modulo `cobrancas`
- o subservico de assinatura nao deve duplicar o contrato de cobranca

### Carne da assinatura

O endpoint `GET /v3/subscriptions/{id}/paymentBook` retorna `application/pdf`.

Esse detalhe e importante por dois motivos:

1. o SDK precisa de suporte real a download binario nesse metodo.
2. a documentacao oficial de Sandbox informa que, para testar a geracao de novas cobrancas de uma assinatura, e necessario gerar o carne da assinatura.

Logo, esse endpoint nao e acessorio.

## Notas fiscais automaticas da assinatura

O Asaas expoe `invoiceSettings` como recurso aninhado em assinatura.

### Criacao e atualizacao

Na referencia atual:

- `POST /v3/subscriptions/{id}/invoiceSettings` exige `taxes`
- `PUT /v3/subscriptions/{id}/invoiceSettings` tambem exige `taxes`

Os campos de escrita documentados incluem:

- `municipalServiceId`
- `municipalServiceCode`
- `municipalServiceName`
- `updatePayment`
- `deductions`
- `effectiveDatePeriod`
- `receivedOnly`
- `daysBeforeDueDate`
- `observations`
- `taxes`

O enum oficial atual de `effectiveDatePeriod` e:

- `ON_PAYMENT_CONFIRMATION`
- `ON_PAYMENT_DUE_DATE`
- `BEFORE_PAYMENT_DUE_DATE`
- `ON_DUE_DATE_MONTH`
- `ON_NEXT_MONTH`

O guia oficial reforca que, ao criar essa configuracao, o Asaas passa a gerar automaticamente as notas fiscais para as cobrancas da assinatura com base nos valores definidos nela.

### Leitura

O retorno documentado de `invoiceSettings` inclui:

- `municipalServiceId`
- `municipalServiceCode`
- `municipalServiceName`
- `deductions`
- `invoiceCreationPeriod`
- `daysBeforeDueDate`
- `receivedOnly`
- `observations`
- `taxes`

Ha uma nuance importante aqui:

- o request usa `effectiveDatePeriod`
- a resposta usa `invoiceCreationPeriod`

O SDK deve refletir essa diferenca explicitamente, em vez de fingir que os nomes sao identicos.

### Listagem de notas fiscais

O endpoint `GET /v3/subscriptions/{id}/invoices` aceita filtros como:

- `offset`
- `limit`
- `effectiveDate[ge]`
- `effectiveDate[le]`
- `externalReference`
- `status`
- `customer`

O enum oficial atual de `status` inclui:

- `SCHEDULED`
- `WAITING_OVERDUE_PAYMENT`
- `PENDING`
- `SYNCHRONIZED`
- `AUTHORIZED`
- `PROCESSING_CANCELLATION`
- `CANCELLED`
- `CANCELLATION_DENIED`
- `ERROR`
- `NONE`
- `CANCELED`

Esse enum mostra um detalhe importante:

- a referencia atual documenta ao mesmo tempo `CANCELLED` e `CANCELED`

O SDK deve preservar esse contrato oficial atual, mesmo que ele pareca redundante.

Ao mesmo tempo:

- a modelagem completa de `Invoice` continua sendo assunto do modulo `07-notas-fiscais.md`

## Split em assinaturas e bloqueio por divergencia

O guia oficial de split em assinaturas diz que a diferenca principal entre criar uma assinatura com e sem split e enviar o array `split` no request de criacao.

Na referencia atual, cada item de `split` inclui:

- `walletId`
- `fixedValue`
- `percentualValue`
- `externalReference`
- `description`

Mas esse dominio nao e apenas declarativo.

O guia oficial de bloqueio por divergencia de split informa que:

- quando uma cobranca recorrente e criada ou recebida
- o Asaas verifica se o total do split da assinatura supera o valor liquido a receber
- se isso ocorrer, a assinatura e bloqueada
- o split e desabilitado
- novas cobrancas recorrentes deixam de ser criadas

Para o SDK, isso implica:

- `split` nao pode ser tratado como metadado passivo
- erros e estados de assinatura precisam carregar contexto operacional suficiente
- o modulo de `assinaturas` precisa mencionar essa regra, mesmo que a modelagem detalhada de split viva em `11-split-e-antecipacoes.md`

## Decisoes recomendadas para a API publica do SDK

O modulo `subscriptions` deveria convergir para algo proximo de:

```ts
asaas.subscriptions.create(input)
asaas.subscriptions.createWithCreditCard(input)
asaas.subscriptions.list(filters)
asaas.subscriptions.get(id)
asaas.subscriptions.update(id, input)
asaas.subscriptions.updateCreditCard(id, input)
asaas.subscriptions.remove(id)

asaas.subscriptions.listPayments(id, filters)
asaas.subscriptions.downloadPaymentBook(id)

asaas.subscriptions.invoiceSettings.create(id, input)
asaas.subscriptions.invoiceSettings.get(id)
asaas.subscriptions.invoiceSettings.update(id, input)
asaas.subscriptions.invoiceSettings.remove(id)
asaas.subscriptions.listInvoices(id, filters)
```

E o pacote nao deveria expor:

- `restoreSubscription`
- unificacao artificial entre assinatura Pix e Pix Recorrente
- tipos duplicados de `Payment` e `Invoice` so porque vieram por endpoint aninhado

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `subscriptions/types.ts`
- `subscriptions/contracts.ts`
- `subscriptions/service.ts`
- `subscriptions/cards.ts`
- `subscriptions/payments.ts`
- `subscriptions/invoice-settings.ts`

Com responsabilidades claras:

- `types.ts` para entidade de assinatura e enums principais
- `contracts.ts` para payloads de create, update, filtros e respostas curtas
- `service.ts` para o facade principal do dominio
- `cards.ts` para criacao com cartao e troca do cartao vinculado
- `payments.ts` para cobrancas derivadas e download de carne
- `invoice-settings.ts` para configuracao fiscal aninhada e listagem de notas

Esse modulo tambem reforca quatro regras de desenho:

- assinatura e agregador de recorrencia, nao de cobranca avulsa
- atualizacao da assinatura nao e `Partial<CreateSubscriptionInput>`
- cartao em assinatura pede superficie separada
- `invoiceSettings` e aninhado a assinatura, mas o dominio completo de notas continua separado

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guia geral de assinaturas
- guia de criacao de assinatura
- guia de criacao de assinatura com cartao de credito
- guia de emissao automatica de notas fiscais para assinaturas
- guia de split em assinaturas
- guia de bloqueio por divergencia de split
- guia de Sandbox para gerar novas cobrancas de uma assinatura
- referencias de create, list, get, update, remove, cartao, payments, paymentBook, invoiceSettings e invoices

### Quais capacidades reais isso mostra?

- o Asaas trata assinatura como recurso recorrente proprio
- existe variante de criacao com cartao e troca dedicada de cartao
- a assinatura expoe cobrancas derivadas e PDF do carne
- existe configuracao fiscal aninhada para emissao automatica de notas
- split em assinatura pode bloquear a recorrencia se houver divergencia com o valor liquido
- a referencia atual nao documenta restore para assinatura

### Como isso deve virar API publica no SDK?

- com um modulo `subscriptions` proprio
- com metodos separados para fluxo normal e fluxo de cartao
- com reuso dos tipos de `payments` e `invoices` quando as respostas forem aninhadas
- com suporte binario para `paymentBook`
- com subservico de `invoiceSettings`

### O que fica fora deste corte?

- webhooks de assinatura
- implementacao detalhada de split
- modelagem completa de invoice
- checkout recorrente como modulo proprio
- qualquer normalizacao que misture assinatura Pix com Pix Recorrente

## Fontes oficiais consultadas

- [Assinaturas](https://docs.asaas.com/docs/assinaturas)
- [Criando uma assinatura](https://docs.asaas.com/docs/criando-uma-assinatura)
- [Criando assinatura com cartao de credito](https://docs.asaas.com/docs/criando-assinatura-com-cartao-de-credito)
- [Como gerar novas cobrancas de uma assinatura](https://docs.asaas.com/docs/como-gerar-novas-cobran%C3%A7as-de-uma-assinatura)
- [Emitir notas fiscais automaticamente para assinaturas](https://docs.asaas.com/docs/emitir-notas-fiscais-automaticamente-para-assinaturas)
- [Split em assinaturas](https://docs.asaas.com/docs/split-em-assinaturas)
- [Fluxo de bloqueio de assinatura por divergencia de split](https://docs.asaas.com/docs/fluxo-de-bloqueio-de-assinatura-por-diverg%C3%AAncia-de-split)
- [Duvidas frequentes sobre assinaturas](https://docs.asaas.com/docs/duvidas-frequentes-assinaturas)
- [Create new subscription](https://docs.asaas.com/reference/create-new-subscription)
- [Create subscription with credit card](https://docs.asaas.com/reference/create-subscription-with-credit-card)
- [List subscriptions](https://docs.asaas.com/reference/list-subscriptions)
- [Retrieve a single subscription](https://docs.asaas.com/reference/retrieve-a-single-subscription)
- [Update existing subscription](https://docs.asaas.com/reference/update-existing-subscription)
- [Update credit card without charging the subscription](https://docs.asaas.com/reference/update-subscription-credit-card)
- [Remove subscription](https://docs.asaas.com/reference/remove-subscription)
- [List payments of a subscription](https://docs.asaas.com/reference/list-payments-of-a-subscription)
- [Generate subscription booklet](https://docs.asaas.com/reference/generate-subscription-booklet)
- [Create configuration for issuing invoices](https://docs.asaas.com/reference/create-configuration-for-issuance-of-invoices)
- [Retrieve configuration for issuance of invoices](https://docs.asaas.com/reference/retrieve-configuration-for-issuance-of-invoices)
- [Update configuration for issuance of invoices](https://docs.asaas.com/reference/update-configuration-for-issuance-of-invoices)
- [Remove configuration for issuance of invoices](https://docs.asaas.com/reference/remove-configuration-for-issuance-of-invoices)
- [List invoices for subscription charges](https://docs.asaas.com/reference/list-invoices-for-subscription-charges)
