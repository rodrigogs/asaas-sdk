# Cobrancas

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de cobrancas do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- cobranca simples
- boleto
- cartao de credito
- tokenizacao
- pre-autorizacao e captura
- parcelamento
- estornos
- chargeback e disputa
- documentos da cobranca
- confirmacao em dinheiro
- simulacao e limites

Sem esse modulo, a integracao fica fragmentada entre `payments`, `installments`, `creditCard`, `refunds` e `chargebacks`, com risco alto de tipos inconsistentes e fronteiras confusas entre cobranca, Pix, assinatura, split e escrow.

## Papel do dominio na plataforma

A documentacao oficial posiciona cobrancas como o centro da operacao financeira do Asaas.

No material oficial, pagamentos sao apresentados como a principal forma de receber dinheiro, cobrindo ao menos:

- boleto
- cartao de credito
- cartao de debito via tela de pagamento
- Pix

Para o SDK, isso implica:

1. `payments` nao e so um CRUD simples.
2. o objeto de cobranca e o agregado principal que conecta cliente, metodo de pagamento, status, estornos, chargeback, split, escrow e comprovantes.

## Recorte correto deste modulo

### O que entra aqui

- CRUD de cobrancas
- fluxo principal de boleto
- fluxo principal de cartao
- tokenizacao de cartao
- pre-autorizacao e captura
- cobranca parcelada e recurso `installments`
- estornos de cobranca e parcelamento
- leitura e disputa de chargeback
- documentos de cobranca
- confirmacao de recebimento em dinheiro
- simulacao de venda e limites de criacao

### O que fica para outros modulos

- QR Code Pix, cobranca via chave Pix e detalhes ampliados de Pix
- assinaturas e geracao recorrente de cobrancas
- payment links e checkout hospedado
- configuracao avancada de split
- conta escrow
- webhooks e machine de eventos como modulo dedicado

O ponto importante e este:

- o objeto `payment` aparece em varios modulos
- mas a API publica principal de cobrancas precisa continuar coesa e nao absorver toda a plataforma

## Superficie oficial do dominio

Pelo conjunto atual de guias e referencias oficiais, o dominio de cobrancas se divide em cinco blocos.

### 1. Cobrancas unitarias

- `POST /v3/payments`
- `GET /v3/payments`
- `GET /v3/payments/{id}`
- `PUT /v3/payments/{id}`
- `DELETE /v3/payments/{id}`
- `POST /v3/payments/{id}/restore`
- `GET /v3/payments/{id}/status`
- `GET /v3/payments/{id}/billingInfo`
- `GET /v3/payments/{id}/identificationField`
- `GET /v3/payments/{id}/viewingInfo`

### 2. Cartao e captura

- `POST /v3/payments/{id}/payWithCreditCard`
- `POST /v3/creditCard/tokenizeCreditCard`
- `POST /v3/payments/{id}/captureAuthorizedPayment`
- `GET /v3/creditCard/preAuthorization`
- `POST /v3/creditCard/preAuthorization`

### 3. Parcelamentos

- `POST /v3/installments`
- `GET /v3/installments`
- `GET /v3/installments/{id}`
- `DELETE /v3/installments/{id}`
- `GET /v3/installments/{id}/payments`
- `DELETE /v3/installments/{id}/payments`
- `POST /v3/installments/{id}/refund`
- `GET /v3/installments/{id}/paymentBook`

### 4. Estornos e chargebacks

- `POST /v3/payments/{id}/refund`
- `GET /v3/payments/{id}/refunds`
- `POST /v3/payments/{id}/bankSlip/refund`
- `GET /v3/payments/{id}/chargeback`
- `GET /v3/chargebacks/`
- `POST /v3/chargebacks/{id}/dispute`

### 5. Operacoes auxiliares da cobranca

- `POST /v3/payments/{id}/receiveInCash`
- `POST /v3/payments/{id}/undoReceivedInCash`
- `GET /v3/payments/limits`
- `POST /v3/payments/simulate`
- `GET /v3/payments/{id}/documents`
- `POST /v3/payments/{id}/documents`
- `GET /v3/payments/{id}/documents/{documentId}`
- `PUT /v3/payments/{id}/documents/{documentId}`
- `DELETE /v3/payments/{id}/documents/{documentId}`

Esse mapa ja mostra que `payments` e grande demais para caber bem em um unico arquivo solto de helper HTTP.

## Contrato principal da cobranca

### Criacao de cobranca

Na referencia principal, a criacao de `payment` exige:

- `customer`
- `billingType`
- `value`
- `dueDate`

Os campos adicionais mais importantes documentados no request principal sao:

- `description`
- `daysAfterDueDateToRegistrationCancellation`
- `externalReference`
- `installmentCount`
- `totalValue`
- `installmentValue`
- `discount`
- `interest`
- `fine`
- `postalService`
- `split`
- `callback`
- `pixAutomaticAuthorizationId`

O enum oficial de `billingType` neste request aparece como:

- `UNDEFINED`
- `BOLETO`
- `CREDIT_CARD`
- `PIX`

### Leitura de cobranca

O objeto retornado pela API e bem mais rico do que o payload de criacao.

Entre os campos mais importantes de leitura estao:

- `id`
- `customer`
- `subscription`
- `installment`
- `checkoutSession`
- `paymentLink`
- `value`
- `netValue`
- `originalValue`
- `interestValue`
- `billingType`
- `status`
- `dueDate`
- `paymentDate`
- `invoiceUrl`
- `invoiceNumber`
- `externalReference`
- `bankSlipUrl`
- `nossoNumero`
- `transactionReceiptUrl`
- `pixTransaction`
- `pixQrCodeId`
- `creditCard`
- `discount`
- `fine`
- `interest`
- `split`
- `chargeback`
- `escrow`
- `refunds`
- `deleted`

O enum de `billingType` na leitura ja fica mais amplo:

- `UNDEFINED`
- `BOLETO`
- `CREDIT_CARD`
- `DEBIT_CARD`
- `TRANSFER`
- `DEPOSIT`
- `PIX`

Para o SDK, isso significa que o contrato de escrita e o contrato de leitura precisam ser separados.

### Atualizacao de cobranca

A referencia atual de `PUT /v3/payments/{id}` nao marca nenhum campo como obrigatorio no body.

Os campos documentados como editaveis sao:

- `description`
- `dueDate`
- `value`
- `discount`
- `interest`
- `fine`
- `externalReference`
- `installmentCount`
- `totalValue`
- `installmentValue`
- `postalService`
- `split`

Nota importante: `billingType` nao aparece como campo editavel na referencia oficial.

Para o SDK, isso significa que `updatePayment` pode aceitar todos os campos acima como opcionais, sem exigir nenhum como obrigatorio.

## Busca, filtros e status

O endpoint `GET /v3/payments` expoe um conjunto grande de filtros.

### Filtros de identidade e origem

- `customer`
- `customerGroupName`
- `subscription`
- `installment`
- `externalReference`
- `checkoutSession`
- `user`

### Filtros de metodo e estado

- `billingType`
- `status`
- `invoiceStatus`
- `pixQrCodeId`
- `anticipated`
- `anticipable`

### Filtros de data

- `dateCreated[ge]`
- `dateCreated[le]`
- `paymentDate`
- `paymentDate[ge]`
- `paymentDate[le]`
- `estimatedCreditDate`
- `estimatedCreditDate[ge]`
- `estimatedCreditDate[le]`
- `dueDate[ge]`
- `dueDate[le]`

### Status oficiais relevantes

Na referencia principal, o enum de `status` inclui:

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

O SDK precisa preservar esse valor como dado de dominio real, nao como booleanos artificiais do tipo `isPaid`.

## Boleto

O guia oficial de boleto reforca que:

- ao criar uma cobranca `BOLETO`, o boleto e gerado automaticamente
- o retorno expone `bankSlipUrl`
- descontos, juros e multa sao definidos no payload da cobranca
- o retorno posterior pode trazer `originalValue` e `interestValue`

No dominio do SDK, isso pede:

- suporte explicito a `discount`, `interest` e `fine`
- helper para obter linha digitavel e codigo de barras via `identificationField`
- campos de boleto no tipo de leitura, como `bankSlipUrl` e `nossoNumero`

Tambem existe um endpoint especifico de estorno de boleto:

- `POST /v3/payments/{id}/bankSlip/refund`

Na referencia atual, ele retorna `requestUrl`, o que indica um fluxo proprio e diferente do estorno generico.

Isso justifica um metodo separado no SDK, em vez de esconder tudo sob um unico `refund()`.

## Cartao de credito

O guia oficial de cartao mostra dois fluxos principais.

### 1. Criar cobranca e redirecionar para `invoiceUrl`

Nesse fluxo:

- a cobranca e criada com `billingType: CREDIT_CARD`
- o cliente conclui o pagamento pela tela do Asaas em `invoiceUrl`

Esse caminho e importante porque tambem habilita o uso de debito pela tela do Asaas:

- o guia oficial diz que nao e possivel enviar dados de cartao de debito pela API
- mas a opcao de debito aparece em `invoiceUrl` quando `billingType` for `CREDIT_CARD` ou `UNDEFINED`

### 2. Criar e cobrar no mesmo request

O guia oficial tambem documenta criacao com captura imediata enviando junto:

- `creditCard`
- `creditCardHolderInfo`
- `remoteIp`

Se a autorizacao ocorrer, o pagamento e persistido com `HTTP 200`.
Se falhar, o pagamento nao e persistido e a API retorna `HTTP 400`.

O guia tambem adiciona duas regras operacionais importantes:

- se a aplicacao capturar dados de cartao na propria interface, HTTPS e obrigatorio
- o timeout recomendado para esse request e de pelo menos `60` segundos para evitar timeout e duplicidade de captura

### Tokenizacao

O dominio de cartao ainda inclui tokenizacao:

- o guia de cobranca por cartao documenta o uso de `creditCardToken` em cobrancas futuras
- a referencia oficial expone `POST /v3/creditCard/tokenizeCreditCard`

Na referencia atual, o request de tokenizacao exige:

- `customer`
- `creditCard`
- `creditCardHolderInfo`
- `remoteIp`

E a documentacao oficial adiciona duas regras de negocio importantes:

- o token e armazenado por cliente e nao pode ser reutilizado por outro cliente
- em producao, a funcionalidade pode depender de habilitacao previa

O proprio guia de tokenizacao tambem deixa claro que a feature pode nao estar liberada para toda conta por padrao.

### Pre-autorizacao

O guia oficial de pagamentos tambem documenta pre-autorizacao:

- enviar `authorizedOnly: true` na criacao da cobranca
- a cobranca fica com status `AUTHORIZED`
- a captura pode ser feita depois via `captureAuthorizedPayment`
- o prazo maximo atual e de `3` dias; depois disso a transacao e revertida automaticamente

Esse fluxo pede um subdominio proprio no SDK, ou pelo menos metodos claros:

- `captureAuthorizedPayment(paymentId)`
- talvez `cards.captureAuthorizedPayment(paymentId)`

## Parcelamentos

O Asaas trata parcelamento como um recurso proprio, nao apenas como mais um campo no `payment`.

### Criacao

Na referencia principal de `installments`, os campos obrigatorios sao:

- `installmentCount`
- `customer`
- `value`
- `billingType`
- `dueDate`

O request ainda aceita:

- `totalValue`
- `description`
- `postalService`
- `daysAfterDueDateToRegistrationCancellation`
- `paymentExternalReference`
- `discount`
- `interest`
- `fine`
- `splits`

### Leitura e operacoes relacionadas

O recurso `installment` expone:

- listagem e consulta
- PDF do carnê via `paymentBook`
- listagem de cobrancas pertencentes ao parcelamento
- cancelamento das cobrancas pendentes do parcelamento
- estorno do parcelamento

O tipo de leitura de parcelamento inclui campos como:

- `id`
- `value`
- `netValue`
- `paymentValue`
- `installmentCount`
- `billingType`
- `paymentDate`
- `expirationDay`
- `customer`
- `chargeback`
- `refunds`
- `deleted`

O SDK deve refletir isso como modulo proprio ou subservico claro.

Uma forma coerente seria:

```ts
asaas.installments.create(input)
asaas.installments.list(filters)
asaas.installments.get(id)
asaas.installments.remove(id)
asaas.installments.listPayments(id)
asaas.installments.cancelPendingCharges(id)
asaas.installments.refund(id, input)
asaas.installments.downloadPaymentBook(id)
```

## Estornos

O material oficial trata estorno em dois niveis:

- estorno da cobranca
- estorno do parcelamento

Para `payments/{id}/refund`, a referencia atual aceita:

- `value`
- `description`
- `splitRefunds`

Ja a lista de estornos da cobranca retorna itens com:

- `dateCreated`
- `status`
- `value`
- `endToEndIdentifier`
- `description`
- `effectiveDate`
- `transactionReceiptUrl`
- `refundedSplits`

Um ponto importante de modelagem:

- o guia de estornos lista um conjunto menor de status
- a referencia atual de `refunds` expoe um enum mais amplo

Logo, o SDK nao deve endurecer demais esse enum com base em uma unica pagina.

## Chargeback e disputa

O dominio de chargeback ja esta acoplado ao objeto da cobranca, mas tambem possui recurso proprio.

### Leitura

O objeto de chargeback atual expone, entre outros:

- `id`
- `payment`
- `installment`
- `customerAccount`
- `status`
- `reason`
- `disputeStartDate`
- `value`
- `paymentDate`
- `creditCard`
- `disputeStatus`
- `deadlineToSendDisputeDocuments`

Os status oficiais documentados incluem:

- `REQUESTED`
- `IN_DISPUTE`
- `DISPUTE_LOST`
- `REVERSED`
- `DONE`

E a lista de motivos oficiais e extensa.

Para o SDK, a decisao correta e:

- preservar o enum oficial conhecido
- continuar aceitando string aberta para compatibilidade futura
- nao reduzir `reason` a categorias locais simplificadas

### Disputa

O endpoint de disputa:

- `POST /v3/chargebacks/{id}/dispute`

usa `multipart/form-data` e, na referencia atual, exige:

- `files`

com limite maximo de `11` arquivos.

Isso pede suporte real a upload multipart no SDK.

Nao cabe esconder essa operacao por baixo de um JSON helper simples.

## Confirmacao em dinheiro e documentos

O dominio de cobrancas tambem inclui operacoes operacionais que nao podem ficar esquecidas.

### Confirmacao em dinheiro

Existe suporte a:

- `POST /v3/payments/{id}/receiveInCash`
- `POST /v3/payments/{id}/undoReceivedInCash`

O request de confirmacao em dinheiro pode receber:

- `paymentDate`
- `value`
- `notifyCustomer`

### Documentos da cobranca

Tambem existe um subrecurso completo de documentos:

- upload por `multipart/form-data`
- listagem
- leitura individual
- atualizacao de configuracao
- exclusao

No upload, a referencia atual exige:

- `availableAfterPayment`
- `type`
- `file`

Isso e suficiente para justificar um subservico proprio, por exemplo:

```ts
asaas.payments.documents.list(paymentId)
asaas.payments.documents.upload(paymentId, input)
asaas.payments.documents.get(paymentId, documentId)
asaas.payments.documents.update(paymentId, documentId, input)
asaas.payments.documents.remove(paymentId, documentId)
```

## Simulacao, limites e leitura auxiliar

O dominio tambem expone endpoints auxiliares que podem entrar como suporte de produto:

- `GET /v3/payments/limits`
- `POST /v3/payments/simulate`
- `GET /v3/payments/{id}/status`
- `GET /v3/payments/{id}/billingInfo`
- `GET /v3/payments/{id}/viewingInfo`

`simulate` e especialmente util porque aceita:

- `value`
- `installmentCount`
- `billingTypes`

e retorna projecoes separadas para:

- `creditCard`
- `bankSlip`
- `pix`

Isso torna o endpoint candidato natural a uma API publica de apoio comercial, nao so a um helper interno.

## Inconsistencias atuais da documentacao oficial

Este modulo expoe um ponto importante: a documentacao do Asaas nao esta 100% uniforme entre guias, referencia e schemas embutidos.

### 1. `/v3/payments` versus `/v3/lean/payments`

Os guias em portugues ainda mostram exemplos com:

- `/v3/lean/payments`

Enquanto a referencia principal e o OpenAPI embutido hoje usam:

- `/v3/payments`

Para o SDK, a decisao correta e usar o caminho canonico atual da referencia, e nao expor `lean` como superficie publica principal.

### 2. Cartao no `POST /payments`

O guia de cobranca por cartao documenta campos como:

- `creditCard`
- `creditCardHolderInfo`
- `creditCardToken`
- `remoteIp`

Mas esses campos nao aparecem no schema principal de `create payment` que a referencia embute hoje.

Para o SDK, isso sugere:

- tipos mais flexiveis para criacao de cobranca por cartao
- testes de integracao voltados ao comportamento real, nao apenas ao schema da pagina principal

### 3. Tokenizacao: `tokenize` versus `tokenizeCreditCard`

O guia de cartao menciona:

- `POST /v3/creditCard/tokenize`

Ja a referencia oficial atual usa:

- `POST /v3/creditCard/tokenizeCreditCard`

O SDK deve padronizar no endpoint canonico atual e esconder essa divergencia documental do consumidor final.

### 4. Pre-autorizacao e status `AUTHORIZED`

O guia de pagamentos e os eventos de webhook mencionam pre-autorizacao com status `AUTHORIZED` e evento `PAYMENT_AUTHORIZED`.

Ja o enum de `status` da referencia principal de `payment` atualmente nao lista `AUTHORIZED`.

Logo, o SDK nao deve tratar o enum da pagina principal como lista fechada.

### 5. Status de `refunds`

O guia de estornos resume menos estados do que a referencia atual de listagem de estornos.

De novo, o pacote precisa ser tolerante a novos literais de status.

## Sandbox e validacao

O quadro oficial de Sandbox e especialmente relevante para este modulo.

Hoje, a matriz oficial marca como testavel em Sandbox:

- criacao de cobrancas
- criacao de cobranca com cartao
- criacao de cobranca parcelada
- tokenizacao de cartao
- recuperar e listar cobrancas
- atualizar, remover e restaurar cobrancas
- estornar cobranca
- chargeback
- obter linha digitavel do boleto
- obter QR Code Pix da cobranca
- confirmar recebimento em dinheiro
- desfazer confirmacao em dinheiro
- upload, listagem, atualizacao e exclusao de documentos da cobranca
- listar, recuperar, remover e estornar parcelamentos

Ao mesmo tempo, a matriz oficial marca como nao testavel em Sandbox:

- layout de boleto com QR Code Pix
- aplicacao de descontos, juros e multas em boleto/Pix

Para o SDK, isso significa:

- testes automatizados de integracao para cobrancas podem cobrir bastante coisa
- mas validacao de juros, multa e alguns detalhes visuais de boleto nao devem ser prometidos so com Sandbox

## Decisoes recomendadas para a API publica do SDK

O desenho mais coerente hoje parece ser:

```ts
asaas.payments.create(input)
asaas.payments.list(filters)
asaas.payments.get(id)
asaas.payments.update(id, input)
asaas.payments.remove(id)
asaas.payments.restore(id)
asaas.payments.getStatus(id)
asaas.payments.getBillingInfo(id)
asaas.payments.getViewingInfo(id)
asaas.payments.getIdentificationField(id)
asaas.payments.confirmCashReceipt(id, input)
asaas.payments.undoCashReceipt(id)
asaas.payments.refund(id, input)
asaas.payments.refundBankSlip(id)
asaas.payments.listRefunds(id)
asaas.payments.getChargeback(id)
asaas.payments.simulate(input)
asaas.payments.getLimits()
```

Com subdominios complementares:

```ts
asaas.cards.payPayment(paymentId, input)
asaas.cards.tokenize(input)
asaas.cards.captureAuthorizedPayment(paymentId)

asaas.installments.create(input)
asaas.installments.list(filters)
asaas.installments.get(id)
asaas.installments.remove(id)
asaas.installments.listPayments(id)
asaas.installments.cancelPendingCharges(id)
asaas.installments.refund(id, input)
asaas.installments.downloadPaymentBook(id)

asaas.chargebacks.list(filters)
asaas.chargebacks.dispute(id, files)

asaas.paymentDocuments.list(paymentId)
asaas.paymentDocuments.upload(paymentId, input)
asaas.paymentDocuments.get(paymentId, documentId)
asaas.paymentDocuments.update(paymentId, documentId, input)
asaas.paymentDocuments.remove(paymentId, documentId)
```

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para algo como:

- `payments/types.ts`
- `payments/service.ts`
- `payments/contracts.ts`
- `payments/cards.ts`
- `payments/installments.ts`
- `payments/refunds.ts`
- `payments/chargebacks.ts`
- `payments/documents.ts`

E tambem para uma regra central de modelagem:

- enums oficiais devem ser modelados como `KnownLiteral | string`, e nao como unioes fechadas cegas, quando a propria documentacao oficial ja mostra divergencia entre paginas

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- visao geral de pagamentos
- cobrancas via boleto
- cobrancas via cartao
- pagamentos e pre-autorizacao
- tokenizacao de cartao
- estornos
- chargeback
- eventos de pagamento
- matriz do que pode ser testado em Sandbox
- referencia de `payments`, `installments`, `refunds`, `chargebacks` e endpoints auxiliares

### Quais capacidades reais isso mostra?

- cobrancas sao o agregado central do Asaas
- o dominio oficial cobre muito mais do que `create/list/get`
- boleto, cartao, parcelamento, estorno e chargeback compartilham o mesmo agregado
- ha operacoes multipart importantes, como disputa e documentos
- a documentacao atual possui inconsistencias que o SDK precisa absorver sem vazar complexidade ao consumidor

### Como isso deve virar API publica no SDK?

- com um modulo principal `payments`
- com subservicos para cartao, parcelamentos, chargebacks e documentos
- com contratos separados para create, update, leitura e operacoes auxiliares
- com suporte a multipart upload
- com tipos tolerantes a evolucao dos enums oficiais

### O que fica fora deste corte?

- detalhamento completo de Pix e QR Code
- geracao recorrente e lifecycle de assinaturas
- checkout hospedado e payment links como modulo de UX
- split e escrow como modulos proprios
- pipeline detalhado de webhooks

## Fontes oficiais consultadas

- [Overview](https://docs.asaas.com/docs/payments-overview)
- [Cobrancas via boleto](https://docs.asaas.com/docs/cobrancas-via-boleto)
- [Credit Card Charges](https://docs.asaas.com/docs/payments-via-credit-card)
- [Payments](https://docs.asaas.com/docs/payments-1)
- [Refunds](https://docs.asaas.com/docs/refunds)
- [Chargeback](https://docs.asaas.com/docs/chargeback-en)
- [Credit card tokenization](https://docs.asaas.com/reference/credit-card-tokenization)
- [Pagar uma cobranca com cartao de credito](https://docs.asaas.com/reference/pagar-uma-cobranca-com-cartao-de-credito)
- [Capture payment with Pre-Authorization](https://docs.asaas.com/reference/capture-payment-with-pre-authorization)
- [Create new payment](https://docs.asaas.com/reference/create-new-payment)
- [List payments](https://docs.asaas.com/reference/list-payments)
- [Retrieve a single payment](https://docs.asaas.com/reference/retrieve-a-single-payment)
- [Update existing payment](https://docs.asaas.com/reference/update-existing-payment)
- [Delete payment](https://docs.asaas.com/reference/delete-payment)
- [Restore removed payment](https://docs.asaas.com/reference/restore-removed-payment)
- [List installments](https://docs.asaas.com/reference/list-installments)
- [Retrieve a single installment](https://docs.asaas.com/reference/retrieve-a-single-installment)
- [Remove installment](https://docs.asaas.com/reference/remove-installment)
- [List payments of a installment](https://docs.asaas.com/reference/list-payments-of-a-installment)
- [Cancel charges of an installment](https://docs.asaas.com/reference/cancel-charges-of-an-installment)
- [Refund payment](https://docs.asaas.com/reference/refund-payment)
- [List chargebacks](https://docs.asaas.com/reference/list-chargebacks)
- [Recuperar um unico chargeback](https://docs.asaas.com/reference/recuperar-um-unico-chargeback)
- [Criar disputa de chargeback](https://docs.asaas.com/reference/criar-disputa-de-chargeback)
- [Confirm cash receipt](https://docs.asaas.com/reference/confirm-cash-receipt)
- [Undo cash receipt confirmation](https://docs.asaas.com/reference/undo-cash-receipt-confirmation)
- [Payment viewing information](https://docs.asaas.com/reference/payment-viewing-information)
- [What can be tested?](https://docs.asaas.com/docs/what-can-be-tested)
- [Payment events](https://docs.asaas.com/docs/webhooks-events)
- [PCI-DSS](https://docs.asaas.com/docs/pci-dss)
