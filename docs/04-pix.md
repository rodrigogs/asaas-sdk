# Pix

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de Pix do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- cobranca via Pix com QR Code dinamico
- QR Code estatico
- decodificacao e pagamento de QR Code
- chaves Pix
- transacoes Pix
- Pix Automatico
- Pix Recorrente
- regras de teste em Sandbox

Sem esse modulo, a integracao fica quebrada entre `payments`, `pix`, `transfers` e automacoes de recorrencia, com risco alto de misturar fluxos de recebimento, envio, autorizacao recorrente e leitura de transacoes num unico helper generico.

## Papel do dominio na plataforma

A visao geral oficial de Pix do Asaas posiciona esse dominio como mais do que um detalhe de `payments`.

Segundo a documentacao oficial, a API oferece controle sobre:

- geracao de chaves Pix
- recebimento por QR Code dinamico
- recebimento por QR Code estatico
- envio de dinheiro por chave Pix, dados bancarios e QR Code

Ao mesmo tempo, a propria documentacao afirma que essa secao de Pix foca principalmente no recebimento via Pix.

Para o SDK, isso implica:

1. `billingType: PIX` sozinho nao resolve o dominio inteiro.
2. o pacote precisa de um modulo `pix` proprio, com subservicos separados.
3. nem tudo que toca Pix deve morar aqui; transferencias amplas continuam sendo modulo dedicado.

## Recorte correto deste modulo

### O que entra aqui

- obtencao do QR Code de uma cobranca Pix ja criada
- criacao e remocao de QR Code estatico
- decodificacao e pagamento de QR Code
- criacao, listagem, consulta e remocao de chaves Pix
- listagem, consulta e cancelamento de transacoes Pix
- autorizacoes e instrucoes de pagamento do Pix Automatico
- recorrencias e itens de recorrencia do Pix Recorrente
- regras operacionais de Sandbox especificas de Pix

### O que fica para outros modulos

- criacao, atualizacao e cancelamento do objeto principal `payment`
- assinaturas e geracao recorrente de cobrancas
- transferencias bancarias amplas e envio para contas externas como modulo principal
- webhooks e eventos
- checkout hospedado, links de pagamento e fluxo comercial da cobranca

O limite aqui e importante:

- criar a cobranca Pix continua sendo responsabilidade primaria de `payments`
- tudo que e especifico do instrumento Pix deve ficar em `pix`

## Superficie oficial do dominio

Pelo conjunto atual de guias e referencias oficiais, o dominio de Pix se divide em seis blocos.

### 1. QR Code de cobranca Pix

- `GET /v3/payments/{id}/pixQrCode`

Esse endpoint existe porque a cobranca Pix nasce em `payments`, mas o QR Code associado pertence ao dominio operacional de Pix.

### 2. QR Codes e operacoes de leitura/pagamento

- `POST /v3/pix/qrCodes/static`
- `DELETE /v3/pix/qrCodes/static/{id}`
- `POST /v3/pix/qrCodes/decode`
- `POST /v3/pix/qrCodes/pay`

### 3. Chaves Pix

- `POST /v3/pix/addressKeys`
- `GET /v3/pix/addressKeys`
- `GET /v3/pix/addressKeys/{id}`
- `DELETE /v3/pix/addressKeys/{id}`

### 4. Transacoes Pix

- `GET /v3/pix/transactions`
- `GET /v3/pix/transactions/{id}`
- `POST /v3/pix/transactions/{id}/cancel`

### 5. Pix Automatico

- `POST /v3/pix/automatic/authorizations`
- `GET /v3/pix/automatic/authorizations`
- `GET /v3/pix/automatic/authorizations/{id}`
- `DELETE /v3/pix/automatic/authorizations/{id}`
- `GET /v3/pix/automatic/paymentInstructions`
- `GET /v3/pix/automatic/paymentInstructions/{id}`

### 6. Pix Recorrente

- `GET /v3/pix/transactions/recurrings`
- `GET /v3/pix/transactions/recurrings/{id}`
- `POST /v3/pix/transactions/recurrings/{id}/cancel`
- `GET /v3/pix/transactions/recurrings/{id}/items`
- `POST /v3/pix/transactions/recurrings/items/{id}/cancel`

Esse mapa ja mostra que o dominio de Pix no Asaas nao cabe bem num unico arquivo de metodos soltos.

## Cobranca Pix com QR Code dinamico

O guia oficial de pagamentos via Pix informa que, ao escolher Pix como forma de pagamento e ter uma chave Pix configurada na conta, a cobranca gera um QR Code unico.

Na pratica, isso significa um fluxo em duas etapas:

1. criar a cobranca em `payments` com `billingType: PIX`
2. obter o QR Code associado em `GET /v3/payments/{id}/pixQrCode`

O retorno documentado do QR Code inclui:

- `encodedImage`
- `payload`
- `expirationDate`
- `description`

### Implicacao para o SDK

O SDK nao deve tentar mover a criacao da cobranca Pix para dentro do modulo `pix`.

O desenho coerente e:

- `asaas.payments.create({ billingType: 'PIX', ... })`
- `asaas.pix.getPaymentQrCode(paymentId)`

Assim, o pacote preserva a fronteira real da API oficial.

## QR Code estatico

O Asaas tambem oferece QR Code estatico como recurso proprio.

Na referencia atual de criacao, os campos documentados sao:

- `addressKey`
- `description`
- `value`
- `format`
- `expirationDate`
- `expirationSeconds`
- `allowsMultiplePayments`
- `externalReference`

O enum oficial atual de `format` e:

- `ALL`
- `IMAGE`
- `PAYLOAD`

O retorno documentado inclui:

- `id`
- `encodedImage`
- `payload`
- `allowsMultiplePayments`
- `expirationDate`
- `externalReference`
- `description`

### Implicacoes para o SDK

O recurso pede um subservico proprio, algo como:

```ts
asaas.pix.staticQrCodes.create(input)
asaas.pix.staticQrCodes.remove(id)
```

Esse contrato tambem pede tipos separados para:

- input de criacao
- resposta completa do QR Code estatico
- resposta curta de remocao

## Decodificacao e pagamento de QR Code

O dominio de Pix nao para na geracao do QR Code.

Tambem existe uma operacao oficial para decodificar um payload e outra para efetuar o pagamento do QR Code.

### Decodificacao

O endpoint `POST /v3/pix/qrCodes/decode` exige:

- `payload`

E ainda aceita:

- `changeValue`
- `expectedPaymentDate`

O retorno documentado inclui um conjunto rico de campos, entre eles:

- `payload`
- `type`
- `transactionOriginType`
- `pixKey`
- `conciliationIdentifier`
- `dueDate`
- `expirationDate`
- `value`
- `changeValue`
- `interest`
- `fine`
- `discount`
- `totalValue`
- `receiver`
- `payer`
- `description`
- `canBePaid`
- `cannotBePaidReason`

### Pagamento

O endpoint `POST /v3/pix/qrCodes/pay` exige:

- `qrCode`
- `value`

E aceita ainda:

- `description`
- `scheduleDate`

O retorno documentado ja cai no universo de transacao Pix, com campos como:

- `id`
- `endToEndIdentifier`
- `value`
- `effectiveDate`
- `scheduledDate`
- `status`
- `type`
- `originType`
- `description`
- `transactionReceiptUrl`
- `refusalReason`
- `canBeCanceled`
- `externalAccount`
- `qrCode`
- `payment`
- `externalReference`

### Implicacoes para o SDK

Esses endpoints nao devem ficar escondidos sob `payments`.

O desenho correto e algo como:

```ts
asaas.pix.qrCodes.decode(input)
asaas.pix.qrCodes.pay(input)
```

E importante que o tipo de resposta do pagamento reusa o contrato principal de `PixTransaction`, em vez de criar DTO paralelo so para esse endpoint.

## Chaves Pix

O Asaas trata chave Pix como recurso proprio, com CRUD parcial.

### Criacao

Na referencia atual, `POST /v3/pix/addressKeys` marca apenas um campo obrigatorio:

- `type`

O ponto importante aqui e que o enum oficialmente documentado hoje para esse request e:

- `EVP`

Para o SDK, a decisao correta e conservadora:

- refletir o contrato oficial atual
- nao inventar suporte tipado para tipos de chave que nao estejam documentados nesse endpoint

### Leitura

O objeto de chave Pix documentado hoje inclui:

- `id`
- `key`
- `type`
- `status`
- `dateCreated`
- `canBeDeleted`
- `cannotBeDeletedReason`
- `qrCode`

Os status oficiais documentados para chave Pix incluem:

- `AWAITING_ACTIVATION`
- `ACTIVE`
- `AWAITING_DELETION`
- `AWAITING_ACCOUNT_DELETION`
- `DELETED`
- `ERROR`

### Implicacoes para o SDK

Esse bloco deveria virar algo proximo de:

```ts
asaas.pix.keys.create(input)
asaas.pix.keys.list(filters)
asaas.pix.keys.get(id)
asaas.pix.keys.remove(id)
```

O SDK tambem precisa preservar `canBeDeleted` e `cannotBeDeletedReason`, porque eles representam regra operacional real da API.

## Transacoes Pix

O Asaas expoe um recurso especifico de transacoes Pix.

Na referencia atual, a listagem aceita filtros como:

- `offset`
- `limit`
- `status`
- `type`
- `endToEndIdentifier`

Os status documentados para transacao incluem:

- `AWAITING_BALANCE_VALIDATION`
- `AWAITING_INSTANT_PAYMENT_ACCOUNT_BALANCE`
- `AWAITING_CRITICAL_ACTION_AUTHORIZATION`
- `AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST`
- `AWAITING_CASH_IN_RISK_ANALYSIS_REQUEST`
- `SCHEDULED`
- `AWAITING_REQUEST`
- `REQUESTED`
- `DONE`
- `REFUSED`
- `CANCELLED`

Os tipos documentados incluem:

- `DEBIT`
- `CREDIT`
- `CREDIT_REFUND`
- `DEBIT_REFUND`
- `DEBIT_REFUND_CANCELLATION`

O objeto principal de transacao inclui, entre outros:

- `id`
- `endToEndIdentifier`
- `finality`
- `value`
- `changeValue`
- `refundedValue`
- `effectiveDate`
- `scheduledDate`
- `status`
- `type`
- `originType`
- `conciliationIdentifier`
- `description`
- `transactionReceiptUrl`
- `refusalReason`
- `canBeCanceled`
- `originalTransaction`
- `externalAccount`
- `qrCode`
- `payment`
- `canBeRefunded`
- `refundDisabledReason`
- `chargedFeeValue`
- `dateCreated`
- `addressKey`
- `addressKeyType`
- `transferId`
- `externalReference`

### Cancelamento

O endpoint de cancelamento documentado e:

- `POST /v3/pix/transactions/{id}/cancel`

Pela propria referencia, ele se aplica ao cancelamento de transacao agendada.

Para o SDK, isso significa que `cancel(id)` nao deve ser descrito como cancelamento universal de qualquer transacao Pix.

## Pix Automatico

O Asaas trata Pix Automatico como um fluxo proprio de autorizacao recorrente.

O guia oficial apresenta esse modelo como cobranca automatizada apos autorizacao previa, sem exigir acao manual do pagador a cada cobranca.

### Autorizacoes

Na referencia atual de `POST /v3/pix/automatic/authorizations`, os campos obrigatorios sao:

- `frequency`
- `contractId`
- `startDate`
- `customerId`
- `immediateQrCode`

Os campos opcionais documentados incluem:

- `finishDate`
- `value`
- `description`
- `minLimitValue`

O enum oficial atual de `frequency` e:

- `WEEKLY`
- `MONTHLY`
- `QUARTERLY`
- `SEMIANNUALLY`
- `ANNUALLY`

O objeto de autorizacao documentado inclui:

- `id`
- `minLimitValue`
- `cancellationDate`
- `cancellationReason`
- `contractId`
- `customerId`
- `description`
- `finishDate`
- `frequency`
- `endToEndIdentifier`
- `startDate`
- `status`
- `value`
- `payload`
- `encodedImage`
- `immediateQrCode`
- `originType`
- `subscriptionId`

### Instrucoes de pagamento

O dominio ainda expoe:

- `GET /v3/pix/automatic/paymentInstructions`
- `GET /v3/pix/automatic/paymentInstructions/{id}`

Na referencia atual, os filtros de listagem incluem:

- `authorizationId`
- `customerId`
- `paymentId`
- `status`

E o item de instrucao inclui:

- `id`
- `endToEndIdentifier`
- `authorization`
- `dueDate`
- `status`
- `paymentId`

### Implicacoes para o SDK

O modulo deve manter Pix Automatico em namespace proprio, por exemplo:

```ts
asaas.pix.automatic.authorizations.create(input)
asaas.pix.automatic.authorizations.list(filters)
asaas.pix.automatic.authorizations.get(id)
asaas.pix.automatic.authorizations.cancel(id)
asaas.pix.automatic.paymentInstructions.list(filters)
asaas.pix.automatic.paymentInstructions.get(id)
```

Essa separacao evita misturar autorizacao recorrente com transacao Pix comum.

## Pix Recorrente

O Asaas tambem documenta Pix Recorrente como um fluxo proprio.

O guia oficial descreve Pix Recorrente como um meio de pagamento automatico e periodico via Pix, no qual o pagador autoriza uma pessoa ou empresa a receber valores em intervalos definidos.

Ha um ponto de modelagem muito importante aqui:

- a documentacao oficial afirma que Pix Recorrente e Pix Automatico tem nomes parecidos, mas finalidades e fluxos diferentes

Entao o SDK nao deve unificar os dois recursos sob um unico tipo generico de recorrencia Pix.

### Superficie oficial

O recurso atual expoe:

- `GET /v3/pix/transactions/recurrings`
- `GET /v3/pix/transactions/recurrings/{id}`
- `POST /v3/pix/transactions/recurrings/{id}/cancel`
- `GET /v3/pix/transactions/recurrings/{id}/items`
- `POST /v3/pix/transactions/recurrings/items/{id}/cancel`

Na listagem principal, os filtros documentados incluem:

- `offset`
- `limit`
- `status`
- `value`
- `searchText`

Os status documentados para recorrencia incluem:

- `AWAITING_CRITICAL_ACTION_AUTHORIZATION`
- `PENDING`
- `SCHEDULED`
- `CANCELLED`
- `DONE`

O objeto principal de recorrencia inclui:

- `id`
- `status`
- `origin`
- `value`
- `frequency`
- `quantity`
- `startDate`
- `finishDate`
- `canBeCancelled`
- `externalAccount`

Ja os itens da recorrencia retornam campos como:

- `id`
- `status`
- `scheduledDate`
- `canBeCancelled`
- `recurrenceNumber`
- `quantity`
- `value`
- `refusalReasonDescription`
- `externalAccount`

### Implicacoes para o SDK

Esse recurso deve ficar isolado em algo como:

```ts
asaas.pix.recurring.list(filters)
asaas.pix.recurring.get(id)
asaas.pix.recurring.cancel(id)
asaas.pix.recurring.listItems(id, filters)
asaas.pix.recurring.cancelItem(itemId)
```

## Sandbox e teste de Pix

O material oficial de Sandbox adiciona regras importantes para este modulo.

### Teste de QR Code estatico

O guia oficial informa que, depois de criar um QR Code estatico no Sandbox, o pagamento de teste e feito por:

- `POST /v3/pix/qrCodes/pay`

Isso e importante porque o SDK pode usar esse fluxo em testes de integracao controlados de Pix.

### Erro 404 sem chave Pix registrada

A documentacao oficial tambem registra um caso operacional especifico:

- ao tentar pagar no Sandbox um QR Code Pix gerado a partir de cobranca criada pela interface, a API pode responder `404 Not Found` se nao houver chave Pix registrada na conta

Para o SDK e para os testes automatizados, isso significa:

- nao tratar `404` nesse fluxo como bug automatico do pacote
- incluir dica operacional sobre configuracao de chave Pix no diagnostico de erro

## Decisoes recomendadas para a API publica do SDK

O modulo `pix` deveria convergir para algo proximo de:

```ts
asaas.pix.getPaymentQrCode(paymentId)

asaas.pix.staticQrCodes.create(input)
asaas.pix.staticQrCodes.remove(id)

asaas.pix.qrCodes.decode(input)
asaas.pix.qrCodes.pay(input)

asaas.pix.keys.create(input)
asaas.pix.keys.list(filters)
asaas.pix.keys.get(id)
asaas.pix.keys.remove(id)

asaas.pix.transactions.list(filters)
asaas.pix.transactions.get(id)
asaas.pix.transactions.cancel(id)

asaas.pix.automatic.authorizations.create(input)
asaas.pix.automatic.authorizations.list(filters)
asaas.pix.automatic.authorizations.get(id)
asaas.pix.automatic.authorizations.cancel(id)
asaas.pix.automatic.paymentInstructions.list(filters)
asaas.pix.automatic.paymentInstructions.get(id)

asaas.pix.recurring.list(filters)
asaas.pix.recurring.get(id)
asaas.pix.recurring.cancel(id)
asaas.pix.recurring.listItems(id, filters)
asaas.pix.recurring.cancelItem(itemId)
```

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `pix/types.ts`
- `pix/contracts.ts`
- `pix/service.ts`
- `pix/qr-codes.ts`
- `pix/keys.ts`
- `pix/transactions.ts`
- `pix/automatic.ts`
- `pix/recurring.ts`

Com responsabilidades claras:

- `types.ts` para enums e entidades transversais
- `contracts.ts` para filtros, payloads de criacao e respostas curtas
- `service.ts` para o facade principal do dominio
- `qr-codes.ts` para QR dinamico, QR estatico, decode e pay
- `keys.ts` para chaves Pix
- `transactions.ts` para leitura e cancelamento de transacoes
- `automatic.ts` para autorizacoes e payment instructions
- `recurring.ts` para recorrencias e itens de recorrencia

Esse modulo tambem reforca tres regras de desenho:

- `payments` continua dono da criacao da cobranca Pix
- `pix` continua dono das operacoes especificas do instrumento Pix
- Pix Automatico e Pix Recorrente nao devem ser colapsados no mesmo contrato

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- visao geral de Pix
- guia de pagamentos via Pix e QR Code dinamico
- guia de QR Code estatico
- guias de Pix Automatico e Pix Recorrente
- guia que diferencia Pix Automatico de Pix Recorrente
- guias de teste em Sandbox
- referencias de chaves, transacoes, QR Codes, autorizacoes e recorrencias

### Quais capacidades reais isso mostra?

- o Asaas separa cobranca Pix, QR Code, chaves e transacoes em recursos especificos
- existe suporte oficial a QR Code dinamico e estatico
- ha operacoes de decode e pay de QR Code
- o produto distingue Pix Automatico de Pix Recorrente
- o Sandbox tem regras proprias para teste de Pix e dependencia operacional de chave configurada

### Como isso deve virar API publica no SDK?

- com um modulo `pix` proprio
- com subservicos separados por topico
- com tipos distintos para chave, QR Code, transacao, autorizacao e recorrencia
- com fronteira clara entre `payments` e `pix`
- com tratamento operacional explicito para fluxos de Sandbox

### O que fica fora deste corte?

- o CRUD principal de `payments`
- o dominio completo de transferencias
- configuracao de webhooks
- orquestracao de cobrancas por assinatura
- qualquer normalizacao local que una Pix Automatico e Pix Recorrente sem base oficial

## Fontes oficiais consultadas

- [Pix Overview](https://docs.asaas.com/docs/pix-overview)
- [Payments via Pix or Dynamic QR Code](https://docs.asaas.com/docs/payments-via-pix-or-dynamic-qr-code)
- [Creating a static QR Code](https://docs.asaas.com/docs/creating-a-static-qr-code)
- [Automatic Pix](https://docs.asaas.com/docs/automatic-pix)
- [Recurring Pix](https://docs.asaas.com/docs/recurring-pix)
- [Difference between Recurring Pix and Automatic Pix](https://docs.asaas.com/docs/difference-between-recurring-pix-and-automatic-pix)
- [Testing Pix QR Code Payment](https://docs.asaas.com/docs/testing-pix-qr-code-payment)
- [Trying to pay a Pix QR Code in Sandbox without a registered key: 404 error](https://docs.asaas.com/docs/trying-to-pay-a-pix-qr-code-in-sandbox-without-a-registered-key-404-error)
- [What can be tested?](https://docs.asaas.com/docs/what-can-be-tested)
- [Create new payment](https://docs.asaas.com/reference/create-new-payment)
- [Create a key](https://docs.asaas.com/reference/create-a-key)
- [List keys](https://docs.asaas.com/reference/list-keys)
- [Retrieve a single key](https://docs.asaas.com/reference/retrieve-a-single-key)
- [List transactions](https://docs.asaas.com/reference/list-transactions)
- [Retrieve a single transaction](https://docs.asaas.com/reference/retrieve-a-single-transaction)
- [Cancel a scheduled transaction](https://docs.asaas.com/reference/cancel-a-scheduled-transaction)
- [Create an Automatic Pix authorization](https://docs.asaas.com/reference/create-an-automatic-pix-authorization)
- [List Automatic Pix authorizations](https://docs.asaas.com/reference/list-automatic-pix-authorizations)
- [Retrieve a single Automatic Pix authorization](https://docs.asaas.com/reference/retrieve-a-single-automatic-pix-authorization)
- [Cancel an Automatic Pix authorization](https://docs.asaas.com/reference/cancel-an-automatic-pix-authorization)
- [List Automatic Pix payment instructions](https://docs.asaas.com/reference/list-automatic-pix-payment-instructions)
- [Retrieve a single Automatic Pix payment instruction](https://docs.asaas.com/reference/retrieve-a-single-automatic-pix-payment-instruction)
- [List recurrences](https://docs.asaas.com/reference/list-recurrences)
- [Retrieve a single recurrence](https://docs.asaas.com/reference/retrieve-a-single-recurrence)
- [Cancel a recurrence](https://docs.asaas.com/reference/cancel-a-recurrence)
- [List recurrence items](https://docs.asaas.com/reference/list-recurrence-items)
- [Cancel a recurrence item](https://docs.asaas.com/reference/cancel-a-recurrence-item)
