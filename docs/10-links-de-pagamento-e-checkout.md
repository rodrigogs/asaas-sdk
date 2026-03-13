# Links de pagamento e checkout

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como os dominios oficiais de `payment links` e `checkout` do Asaas devem virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- criacao, leitura, atualizacao, remocao e restauracao de links de pagamento
- gestao de imagens de links de pagamento
- criacao e cancelamento de checkout hospedado
- configuracao de personalizacao do checkout na conta
- diferenca funcional entre link persistente e sessao de checkout
- inconsistencias atuais entre guias, changelog e referencia

Sem esse modulo, o SDK fica incompleto em dois dos principais fluxos de cobranca hospedada:

- nao existe superficie clara para vendas por link reutilizavel
- nao existe superficie segura para checkout de carrinho com callback e itens
- o integrador acaba misturando `payments`, `subscriptions`, `installments`, `paymentLinks` e `checkouts` sem um corte funcional coerente

## Papel do dominio na plataforma

O Asaas oferece duas experiencias hospedadas diferentes.

### Payment links

`paymentLinks` e um recurso persistente e compartilhavel.

Ele serve para:

- criar um link publico
- deixar o cliente escolher ou pagar um valor predefinido
- gerar cobrancas avulsas, recorrentes ou parceladas a partir do mesmo link

### Checkout

`checkouts` e uma sessao hospedada orientada a compra.

Ele serve para:

- montar um carrinho com itens
- escolher meios de pagamento no fluxo da sessao
- redirecionar o cliente apos sucesso, cancelamento ou expiracao

Para o SDK, isso implica uma regra simples:

- `paymentLinks` e recurso persistente com CRUD e imagens
- `checkouts` e recurso efemero, com create, cancel e forte dependencia de callback e webhooks

## Recorte correto deste modulo

### O que entra aqui

- `paymentLinks`
- imagens de `paymentLinks`
- `checkouts`
- personalizacao do checkout em `myAccount/paymentCheckoutConfig`
- redirecionamento hospedado
- integracao com webhooks de `checkout`

### O que fica para outros modulos

- modelagem completa de `payments`
- assinaturas como recurso principal
- split como dominio proprio
- webhooks como infraestrutura transversal
- customizacao visual de checkout fora do que a API oficial expone

Um limite importante aqui e este:

- `paymentLinks` e `checkouts` produzem cobrancas e assinaturas
- mas nao substituem os dominios de `payments` e `subscriptions`

## Superficie oficial do dominio

Pela referencia oficial atual, o dominio se divide em tres blocos.

### 1. Links de pagamento

- `POST /v3/paymentLinks`
- `GET /v3/paymentLinks`
- `GET /v3/paymentLinks/{id}`
- `PUT /v3/paymentLinks/{id}`
- `DELETE /v3/paymentLinks/{id}`
- `POST /v3/paymentLinks/{id}/restore`

### 2. Imagens do link

- `POST /v3/paymentLinks/{id}/images`
- `GET /v3/paymentLinks/{id}/images`
- `GET /v3/paymentLinks/{paymentLinkId}/images/{imageId}`
- `DELETE /v3/paymentLinks/{paymentLinkId}/images/{imageId}`
- `PUT /v3/paymentLinks/{paymentLinkId}/images/{imageId}/setAsMain`

### 3. Checkout hospedado

- `POST /v3/checkouts`
- `POST /v3/checkouts/{id}/cancel`
- `POST /v3/myAccount/paymentCheckoutConfig/`
- `GET /v3/myAccount/paymentCheckoutConfig/`

Ha um detalhe importante aqui:

- a referencia publica atual nao documenta `GET /v3/checkouts`
- a referencia publica atual tambem nao documenta `GET /v3/checkouts/{id}`

Isso influencia diretamente o desenho do SDK.

## `paymentLinks`: contrato principal

### Criacao

Pela referencia atual, `POST /v3/paymentLinks` exige:

- `name`
- `billingType`
- `chargeType`

E ainda documenta:

- `description`
- `endDate`
- `value`
- `dueDateLimitDays`
- `subscriptionCycle`
- `maxInstallmentCount`
- `externalReference`
- `notificationEnabled`
- `callback`
- `isAddressRequired`

Os enums atuais de `billingType` sao:

- `UNDEFINED`
- `BOLETO`
- `CREDIT_CARD`
- `PIX`

Os enums atuais de `chargeType` sao:

- `DETACHED`
- `RECURRENT`
- `INSTALLMENT`

Os enums atuais de `subscriptionCycle` sao:

- `WEEKLY`
- `BIWEEKLY`
- `MONTHLY`
- `BIMONTHLY`
- `QUARTERLY`
- `SEMIANNUALLY`
- `YEARLY`

Esse contrato mostra tres pontos importantes:

1. `value` e opcional, entao o pagador pode informar quanto deseja pagar
2. `chargeType` decide se o link gera cobranca avulsa, recorrencia ou parcelamento
3. o link nao exige cliente preexistente

### Leitura

Os retornos de create, get, update e restore compartilham o mesmo shape principal, com:

- `id`
- `name`
- `value`
- `active`
- `chargeType`
- `url`
- `billingType`
- `subscriptionCycle`
- `description`
- `endDate`
- `deleted`
- `viewCount`
- `maxInstallmentCount`
- `dueDateLimitDays`
- `notificationEnabled`
- `isAddressRequired`
- `externalReference`

Isso mostra uma assimetria relevante:

- a escrita aceita `callback`
- a leitura atual nao devolve `callback`

Para o SDK, isso implica separar claramente:

- tipo de escrita
- tipo de leitura
- operacoes de update que nao sao `Partial<CreatePaymentLinkInput>`

### Atualizacao

`PUT /v3/paymentLinks/{id}` documenta hoje:

- `name`
- `description`
- `endDate`
- `value`
- `active`
- `billingType`
- `chargeType`
- `dueDateLimitDays`
- `subscriptionCycle`
- `maxInstallmentCount`
- `externalReference`
- `notificationEnabled`
- `callback`

Um detalhe importante:

- `update` nao documenta `isAddressRequired`

Entao o SDK nao deve modelar update como espelho completo do create.

### Remocao e restauracao

Os endpoints:

- `DELETE /v3/paymentLinks/{id}`
- `POST /v3/paymentLinks/{id}/restore`

deixam claro que o recurso tem semantica de soft delete.

Para o SDK, isso pede:

- `remove`
- `restore`

e nao apenas um booleano local de `active`.

## `paymentLinks`: imagens e experiencia hospedada

O Asaas permite associar imagens ao link de pagamento.

### Operacoes oficiais

As rotas atuais cobrem:

- adicionar imagem
- listar imagens
- recuperar imagem unica
- remover imagem
- definir imagem principal

### Contrato atual

`POST /v3/paymentLinks/{id}/images` usa `multipart/form-data` e documenta:

- `main`
- `image`

Cada imagem retorna:

- `id`
- `main`
- `image.originalName`
- `image.size`
- `image.extension`
- `image.previewUrl`
- `image.downloadUrl`

O guia funcional reforca que:

- cada link aceita ate 5 imagens

### Comportamento funcional importante

Os guias oficiais de links de pagamento ainda registram:

- cada pagamento feito pelo link cria um novo cliente no Asaas
- isso pode gerar duplicidade de clientes se o mesmo comprador pagar varias vezes
- links de pagamento nao suportam split nativamente

Para o SDK, essas regras importam porque:

- `paymentLinks` nao pode ser vendido como substituto universal de `checkout`
- o integrador precisa saber quando o dominio correto e `paymentLinks` e quando precisa de `checkout` ou `payments`

## Checkout hospedado

### Criacao

Pela referencia atual, `POST /v3/checkouts` exige:

- `billingTypes`
- `chargeTypes`
- `callback`
- `items`

O request atual ainda documenta:

- `minutesToExpire`
- `externalReference`
- `customerData`
- `subscription`
- `installment`
- `splits`

Os enums atuais de `billingTypes` publicados na referencia sao:

- `CREDIT_CARD`
- `PIX`

Os enums atuais de `chargeTypes` publicados na referencia sao:

- `DETACHED`
- `RECURRENT`
- `INSTALLMENT`

`callback` hoje documenta:

- `successUrl`
- `cancelUrl`
- `expiredUrl`

`items` documenta como obrigatorios:

- `imageBase64`
- `name`
- `quantity`
- `value`

### Condicoes importantes do request

O proprio schema e os guias funcionais indicam tres combinacoes estruturais:

1. se `chargeTypes` inclui `RECURRENT`, faz sentido exigir `subscription`
2. se `chargeTypes` inclui `INSTALLMENT`, faz sentido exigir `installment`
3. se o checkout precisar identificar previamente o comprador, usa-se `customerData`

Para o SDK, isso pede um tipo de entrada com discriminadores reais, nao um objeto plano gigantesco.

### Resposta atual da referencia

Aqui existe a maior inconsistancia atual do dominio.

A referencia publica de `POST /v3/checkouts` hoje devolve basicamente o espelho de configuracao:

- `billingTypes`
- `chargeTypes`
- `minutesToExpire`
- `externalReference`
- `callback`
- `items`
- `customerData`
- `subscription`
- `installment`
- `split`

Mas ela nao documenta explicitamente:

- `id`
- URL hospedada do checkout

Ao mesmo tempo, o guia oficial de redirecionamento do checkout afirma que:

- o checkout recebe um identificador unico
- o link hospedado pode ser montado como `https://asaas.com/checkoutSession/show?id={id}`

Para o SDK, isso significa:

- a referencia atual de resposta esta incompleta para uso pratico
- a criacao de checkout precisa ser tratada como area de validacao obrigatoria em implementacao e testes reais

### Cancelamento

O endpoint oficial e:

- `POST /v3/checkouts/{id}/cancel`

Ele nao documenta body relevante.

Como a referencia atual nao traz listagem ou leitura unitaria de checkout, isso reforca uma conclusao importante:

- o ciclo de vida do checkout depende muito mais de callback, `externalReference` e webhooks do que de GETs posteriores

## Split e dados do cliente no checkout

O checkout permite dois recursos que mudam bastante a modelagem:

### Dados do cliente

A referencia atual usa:

- `customerData`

com campos como:

- `name`
- `cpfCnpj`
- `email`
- `phone`
- `address`
- `addressNumber`
- `complement`
- `province`
- `postalCode`
- `city`

Mas os guias funcionais usam exemplos que mencionam:

- `customer`

Essa divergencia e importante para o SDK.

### Split

Na referencia atual, o request usa:

- `splits`

e cada item documenta:

- `walletId`
- `fixedValue`
- `percentageValue`
- `totalFixedValue`

Mas a resposta atual usa:

- `split`

E os guias funcionais costumam citar:

- `percentualValue`

Para o SDK, isso significa:

- o contrato atual de split em checkout ainda pede normalizacao cuidadosa
- nomes de campo nao devem ser inferidos a partir de exemplos legados

## Personalizacao do checkout

O Asaas expone personalizacao da experiencia hospedada por conta em:

- `POST /v3/myAccount/paymentCheckoutConfig/`
- `GET /v3/myAccount/paymentCheckoutConfig/`

### Request atual

O save usa `multipart/form-data` e exige:

- `logoBackgroundColor`
- `infoBackgroundColor`
- `fontColor`

Tambem aceita:

- `enabled`
- `logoFile`

### Leitura atual

O retorno documenta:

- `logoBackgroundColor`
- `infoBackgroundColor`
- `fontColor`
- `enabled`
- `logoUrl`
- `observations`
- `status`

Os enums atuais de `status` sao:

- `AWAITING_APPROVAL`
- `APPROVED`
- `REJECTED`

Para o SDK, isso implica:

- a personalizacao nao e apenas save-and-forget
- existe fila de analise e observacao operacional na resposta

## Webhooks e acompanhamento operacional

Para `paymentLinks`, o dominio de estado final ainda passa por `payments` e `subscriptions`.

Para `checkouts`, a pagina oficial de eventos documenta:

- `CHECKOUT_CREATED`
- `CHECKOUT_CANCELED`
- `CHECKOUT_EXPIRED`
- `CHECKOUT_PAID`

Como a referencia atual nao traz GET/list de checkout, a melhor leitura arquitetural e esta:

- webhooks de checkout sao parte essencial do dominio
- `externalReference` deve ser tratado como chave de conciliacao importante

## Inconsistencias e riscos de compatibilidade

O dominio de links de pagamento e checkout hoje tem varias divergencias entre guias, changelog e referencia.

### Checkout com boleto no changelog vs schema atual

O changelog oficial de 10 de novembro de 2025 anunciou checkout com boleto bancario.

Mas a referencia atual de `POST /v3/checkouts` em 12 de marco de 2026 continua publicando apenas:

- `CREDIT_CARD`
- `PIX`

em `billingTypes`.

O SDK deve tratar isso como area de compatibilidade futura e nao fechar os tipos de forma irreversivel.

### `customer` nos guias vs `customerData` na referencia

Os guias funcionais de checkout usam exemplos com `customer`.

A referencia atual usa:

- `customerData`

O pacote deve seguir a referencia publica atual e tratar os exemplos com `customer` como documentacao legada ou resumida.

### `items[].imageBase64` obrigatorio no schema

O schema atual torna `imageBase64` obrigatorio para cada item do checkout.

Ao mesmo tempo, guias funcionais e exemplos resumidos nem sempre apresentam esse campo.

Logo, o SDK precisa validar isso cedo e tratar a obrigatoriedade como parte do contrato atual da referencia.

### `paymentLinks.update` e assimetrico

Na referencia atual:

- create aceita `isAddressRequired`
- update nao documenta `isAddressRequired`
- leitura nao devolve `callback`

Isso impede um tipo unico de leitura e escrita sem perdas.

### `splits` no request vs `split` na resposta

O schema atual usa plural na entrada e singular na saida.

Essa divergencia deve ser absorvida internamente pelo SDK, nao vazada ao consumidor.

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
asaas.paymentLinks.create(input)
asaas.paymentLinks.list(filters)
asaas.paymentLinks.get(id)
asaas.paymentLinks.update(id, input)
asaas.paymentLinks.remove(id)
asaas.paymentLinks.restore(id)

asaas.paymentLinks.images.add(id, input)
asaas.paymentLinks.images.list(id)
asaas.paymentLinks.images.get(paymentLinkId, imageId)
asaas.paymentLinks.images.remove(paymentLinkId, imageId)
asaas.paymentLinks.images.setMain(paymentLinkId, imageId)

asaas.checkouts.create(input)
asaas.checkouts.cancel(id)

asaas.checkoutConfig.get()
asaas.checkoutConfig.save(input)
```

E tambem expor tipos separados para:

- `AsaasPaymentLink`
- `AsaasPaymentLinkCreateInput`
- `AsaasPaymentLinkUpdateInput`
- `AsaasPaymentLinkImage`
- `AsaasCheckoutCreateInput`
- `AsaasCheckoutBillingType`
- `AsaasCheckoutChargeType`
- `AsaasCheckoutCustomization`

O SDK nao deveria:

- misturar `paymentLinks` e `checkouts` no mesmo service sem separacao conceitual
- prometer `get` ou `list` de checkout enquanto a referencia atual nao expone isso
- fechar `billingTypes` de checkout como se o dominio nao pudesse expandir para boleto
- inferir que resposta de create checkout esta completamente documentada
- modelar update de `paymentLinks` como `Partial<CreatePaymentLinkInput>`

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `payment-links/types.ts`
- `payment-links/images.ts`
- `payment-links/service.ts`
- `checkouts/types.ts`
- `checkouts/service.ts`
- `checkouts/personalization.ts`

Com responsabilidades claras:

- `payment-links/types.ts` para entidade principal, enums e assimetrias de leitura
- `payment-links/images.ts` para upload e gestao de imagens
- `payment-links/service.ts` para CRUD, remove e restore
- `checkouts/types.ts` para request discriminado, callback, itens, customerData e split
- `checkouts/service.ts` para create e cancel, com forte enfase em compatibilidade de resposta
- `checkouts/personalization.ts` para configuracao e status de analise da customizacao

Esse modulo tambem consolida cinco regras de desenho:

- link de pagamento e checkout sao recursos diferentes e merecem services separados
- checkout atual depende fortemente de callback e webhook
- `paymentLinks` tem semantica de soft delete e imagens anexas
- personalizacao do checkout e configuracao de conta, nao do recurso `checkout`
- os tipos de checkout precisam ser preparados para divergencias temporais da documentacao

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de links de pagamento, redirecionamento e checkout
- guias de checkout para Pix, cartao, dados do cliente, split e boas praticas
- eventos de checkout
- changelog de checkout com boleto
- referencias de `paymentLinks`, imagens, `checkouts` e `paymentCheckoutConfig`

### Quais capacidades reais isso mostra?

- o Asaas oferece link reutilizavel e checkout de sessao como produtos distintos
- link de pagamento pode gerar cobranca, assinatura ou parcelamento
- checkout recebe itens, callback, dados do cliente e split
- a conta pode personalizar a experiencia hospedada do checkout
- checkout hoje depende mais de callback e webhook do que de leitura posterior por API

### Como isso deve virar API publica no SDK?

- com services separados para `paymentLinks`, imagens e `checkouts`
- com tipos diferentes para create, update e leitura de `paymentLinks`
- com create de checkout modelado por combinacoes validas de `chargeTypes`
- com API de personalizacao separada do recurso `checkout`
- com tratamento explicito das lacunas atuais da referencia

### O que fica fora deste corte?

- modelagem completa de `payments` e `subscriptions`
- split como dominio central
- webhooks como modulo transversal
- antifraude ou logica comercial da vitrine do parceiro

## Fontes oficiais consultadas

- [Link de pagamentos](https://docs.asaas.com/docs/link-de-pagamentos)
- [Criando um link de pagamentos](https://docs.asaas.com/docs/criando-um-link-de-pagamentos)
- [Redirecionamento apos o pagamento](https://docs.asaas.com/docs/redirecionamento-apos-o-pagamento)
- [Introducao ao checkout](https://docs.asaas.com/docs/introdu%C3%A7%C3%A3o-1)
- [Checkout para Pix](https://docs.asaas.com/docs/checkout-para-pix)
- [Checkout para cartao de credito](https://docs.asaas.com/docs/checkout-para-cart%C3%A3o-de-cr%C3%A9dito)
- [Como informar os dados do cliente](https://docs.asaas.com/docs/como-informar-os-dados-do-cliente)
- [Link do checkout e redirecionamento do cliente](https://docs.asaas.com/docs/link-do-checkout-e-redirecionamento-do-cliente)
- [Checkout com split de pagamento](https://docs.asaas.com/docs/checkout-com-split-de-pagamento)
- [Erros comuns e boas praticas](https://docs.asaas.com/docs/erros-comuns-e-boas-pr%C3%A1ticas)
- [Eventos para checkout](https://docs.asaas.com/docs/eventos-para-checkout)
- [Changelog do Asaas](https://docs.asaas.com/changelog)
- [Create a payments link](https://docs.asaas.com/reference/create-a-payments-link)
- [List payments links](https://docs.asaas.com/reference/list-payments-links)
- [Retrieve a single payments link](https://docs.asaas.com/reference/retrieve-a-single-payments-link)
- [Update a payments link](https://docs.asaas.com/reference/update-a-payments-link)
- [Remove a payments link](https://docs.asaas.com/reference/remove-a-payments-link)
- [Restore a payments link](https://docs.asaas.com/reference/restore-a-payments-link)
- [Add an image to a payments link](https://docs.asaas.com/reference/add-an-image-to-a-payments-link)
- [List images from a payments link](https://docs.asaas.com/reference/list-images-from-a-payments-link)
- [Retrieve a single payments link image](https://docs.asaas.com/reference/retrieve-a-single-payments-link-image)
- [Remove an image from payments link](https://docs.asaas.com/reference/remove-an-image-from-payments-link)
- [Set payments link main image](https://docs.asaas.com/reference/set-payments-link-main-image)
- [Create new checkout](https://docs.asaas.com/reference/create-new-checkout)
- [Cancel a checkout](https://docs.asaas.com/reference/cancel-a-checkout)
- [Save payment checkout personalization](https://docs.asaas.com/reference/save-payment-checkout-personalization)
- [Retrieve personalization settings](https://docs.asaas.com/reference/retrieve-personalization-settings)
