# Split e antecipacoes

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como os dominios oficiais de split e antecipacoes do Asaas devem virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- split como capacidade transversal de distribuicao de valores
- consulta de splits pagos e recebidos
- atualizacao de split em parcelamentos
- estatisticas financeiras de split
- antecipacao manual e simulacao
- limites e configuracao de antecipacao automatica
- cancelamento e acompanhamento por status
- impacto de divergencia de valor e antecipacao sobre splits

Sem esse modulo, o SDK fica incompleto em duas partes importantes da plataforma:

- nao existe superficie clara para observar e operar repasses entre carteiras
- nao existe superficie segura para antecipar recebiveis com simulacao, documentos e configuracao automatica

## Papel do dominio na plataforma

Embora o indice una split e antecipacoes no mesmo modulo, os dois assuntos nao tem o mesmo formato na API.

### Split

Split e uma capacidade transversal.

Na pratica, ele e configurado dentro de outros recursos:

- cobrancas avulsas
- parcelamentos
- assinaturas
- checkout

E depois passa a ser observado e ajustado por endpoints proprios.

### Antecipacoes

Antecipacao e um recurso proprio com ciclo de vida completo:

- simulacao
- solicitacao
- listagem
- consulta
- cancelamento
- limites
- configuracao automatica

Para o SDK, isso implica:

- `split` deve ser tratado como modulo de observabilidade e contratos compartilhados
- `anticipations` deve ser tratado como service principal do dominio

## Recorte correto deste modulo

### O que entra aqui

- contratos compartilhados de split
- listagem de splits pagos e recebidos
- consulta de um split pago ou recebido
- estatisticas de split
- update de splits em parcelamentos
- simulacao, request, listagem, get e cancel de antecipacoes
- limites e configuracao de antecipacao automatica
- webhooks de antecipacao

### O que fica para outros modulos

- configuracao inicial de split em cobrancas, assinaturas e checkout
- divergencia de split em assinaturas e checkout, que ja afeta os modulos de origem
- escrow
- regras de recebimento de pagamentos

Um limite importante aqui e este:

- o modulo documenta split como contrato transversal
- mas nao substitui os modulos `03-cobrancas.md`, `05-assinaturas.md` ou `10-links-de-pagamento-e-checkout.md`, onde o split nasce

## Superficie oficial do dominio

Pela referencia oficial atual, o dominio se divide em dois blocos.

### 1. Split

- `PUT /v3/installments/{id}/splits`
- `GET /v3/payments/splits/paid`
- `GET /v3/payments/splits/paid/{id}`
- `GET /v3/payments/splits/received`
- `GET /v3/payments/splits/received/{id}`
- `GET /v3/finance/split/statistics`

### 2. Antecipacoes

- `POST /v3/anticipations`
- `GET /v3/anticipations`
- `GET /v3/anticipations/{id}`
- `POST /v3/anticipations/simulate`
- `GET /v3/anticipations/limits`
- `GET /v3/anticipations/configurations`
- `PUT /v3/anticipations/configurations`
- `POST /v3/anticipations/{id}/cancel`

Esse mapeamento mostra a principal assimetria do modulo:

- split nao tem endpoint publico de create isolado
- antecipacao tem um CRUD operacional quase completo

## Split como capacidade transversal

Os guias funcionais de split deixam claro que o recurso nasce no request do dominio pai.

Hoje isso aparece em:

- cobrancas avulsas
- parcelamentos
- assinaturas
- checkout

Os guias especificos reforcam a mesma regra:

- a diferenca pratica entre criar o recurso com ou sem split e enviar o array `split` ou `splits`

Para o SDK, isso implica:

- o contrato de split deve ser reutilizavel
- mas a operacao de criacao nao vive em um service `split.create()`

### Regras operacionais importantes de split

Pelos guias e FAQ oficiais:

- nao ha limite fixo de `walletId` informado no split
- se a cobranca for estornada, o split correspondente tambem e revertido
- em cobrancas antecipadas com split fixo, o valor do split precisa respeitar o valor liquido apos a antecipacao

Essa ultima regra e especialmente importante porque a propria referencia de split documenta:

- `BLOCKED_BY_VALUE_DIVERGENCE` como status
- `VALUE_DIVERGENCE_BLOCK` como motivo de cancelamento

## Contrato principal de split

### Escrita em parcelamentos

O unico endpoint publico de escrita isolada de split hoje e:

- `PUT /v3/installments/{id}/splits`

O request aceita:

- `splits`

E cada item documenta:

- `walletId`
- `fixedValue`
- `percentualValue`
- `totalFixedValue`
- `externalReference`
- `description`
- `installmentNumber`

O unico campo obrigatorio documentado em cada item e:

- `walletId`

Mas a regra de negocio e mais rica do que isso.

Pelos guias funcionais:

- parcelamentos podem usar valores previamente calculados por parcela
- ou podem usar um valor total a ser distribuido ao longo das parcelas

Isso explica a coexistencia de:

- `fixedValue`
- `totalFixedValue`
- `installmentNumber`

E a referencia ainda registra uma restricao importante:

- `installmentNumber` nao pode ser informado junto com `totalFixedValue`

### Leitura de split

Os endpoints de paid e received devolvem essencialmente o mesmo contrato principal:

- `id`
- `walletId`
- `fixedValue`
- `percentualValue`
- `totalValue`
- `cancellationReason`
- `status`
- `externalReference`
- `description`

No caso de update de parcelamento, a resposta ainda pode incluir:

- `installmentNumber`

### Enums atuais de split

Os enums atuais de `status` sao:

- `PENDING`
- `PROCESSING`
- `PROCESSING_REFUND`
- `AWAITING_CREDIT`
- `CANCELLED`
- `DONE`
- `REFUNDED`
- `BLOCKED_BY_VALUE_DIVERGENCE`

Os enums atuais de `cancellationReason` sao:

- `PAYMENT_DELETED`
- `PAYMENT_OVERDUE`
- `PAYMENT_RECEIVED_IN_CASH`
- `PAYMENT_REFUNDED`
- `VALUE_DIVERGENCE_BLOCK`
- `WALLET_UNABLE_TO_RECEIVE`

Para o SDK, isso mostra que split nao e apenas uma instruicao estatica:

- ele tem status operacional proprio
- pode falhar
- pode ser bloqueado
- pode entrar em refund process

## Sides de consulta: paid, received e estatisticas

### Paid splits

`GET /v3/payments/splits/paid` aceita hoje:

- `offset`
- `limit`
- `paymentId`
- `status`
- `paymentConfirmedDate[ge]`
- `paymentConfirmedDate[le]`
- `creditDate[ge]`
- `creditDate[le]`

Isso representa a visao dos splits enviados.

### Received splits

`GET /v3/payments/splits/received` aceita hoje:

- `offset`
- `limit`
- `paymentId`
- `status`
- `paymentConfirmedDate[ge]`
- `paymentConfirmedDate[le]`
- `creditDate[ge]`
- `creditDate[le]`

Isso representa a visao dos splits recebidos.

### Estatisticas

`GET /v3/finance/split/statistics` retorna hoje:

- `income`
- `value`

Pela descricao oficial:

- `income` representa valores a receber
- `value` representa valores a enviar

Para o SDK, isso pede uma separacao explicita entre:

- lista detalhada de eventos de split
- visao agregada de saldo do dominio

## Antecipacoes: papel e escopo

A pagina oficial de antecipacoes deixa claro que e possivel antecipar:

- uma cobranca avulsa
- um parcelamento

Ela tambem registra uma nuance importante:

- em parcelamentos com cartao, a antecipacao pode ser do parcelamento inteiro ou de parcelas individuais

Pela referencia atual, essa distincao aparece no request por meio de dois campos alternativos:

- `installment`
- `payment`

Para o SDK, isso implica um input discriminado simples:

- antecipacao por cobranca
- antecipacao por parcelamento

## Contrato principal de antecipacao

### Solicitacao

O endpoint oficial e:

- `POST /v3/anticipations`

Esse request usa `multipart/form-data`.

Os campos documentados sao:

- `installment`
- `payment`
- `documents`

Isso gera duas conclusoes importantes:

1. a API aceita documentacao comprobatoria junto da solicitacao
2. o SDK precisa suportar upload binario real neste fluxo

### Leitura principal

Os retornos de create, get, list item e cancel compartilham o mesmo contrato principal:

- `id`
- `installment`
- `payment`
- `status`
- `anticipationDate`
- `dueDate`
- `requestDate`
- `fee`
- `anticipationDays`
- `netValue`
- `totalValue`
- `value`
- `denialObservation`

### Status de antecipacao

Pela referencia atual, os enums de `status` sao:

- `PENDING`
- `DENIED`
- `CREDITED`
- `DEBITED`
- `CANCELLED`
- `OVERDUE`
- `SCHEDULED`

Isso mostra um ciclo operacional mais rico do que "solicitada ou nao":

- a antecipacao pode ser negada
- pode ser agendada
- pode gerar credito
- e depois debito

## Simulacao, documentos e limites

### Simulacao

O endpoint oficial e:

- `POST /v3/anticipations/simulate`

Ele aceita:

- `installment`
- `payment`

E retorna:

- `anticipationDate`
- `dueDate`
- `fee`
- `anticipationDays`
- `netValue`
- `totalValue`
- `value`
- `isDocumentationRequired`

Esse ultimo campo e decisivo para o SDK.

Ele indica se o proximo passo precisa lidar com documentacao na solicitacao efetiva.

### Limites

`GET /v3/anticipations/limits` retorna hoje dois blocos:

- `creditCard`
- `bankSlip`

Cada um com:

- `total`
- `available`

Para o SDK, isso pede uma modelagem por modalidade de recebivel, nao um numero unico de limite.

## Antecipacao automatica

O dominio tambem expone configuracao de antecipacao automatica em:

- `GET /v3/anticipations/configurations`
- `PUT /v3/anticipations/configurations`

O contrato atual e enxuto:

- `creditCardAutomaticEnabled`

Isso mostra uma restricao importante da superficie publica atual:

- a configuracao automatica documentada hoje esta limitada a recebiveis de cartao

Entao o SDK nao deve inferir suporte automatico equivalente para boleto so porque `limits` expone `bankSlip`.

## Listagem e cancelamento de antecipacoes

### Listagem

`GET /v3/anticipations` aceita hoje:

- `offset`
- `limit`
- `payment`
- `installment`
- `status`

Isso pede um tipo proprio de `ListAnticipationsParams`.

### Cancelamento

O endpoint oficial e:

- `POST /v3/anticipations/{id}/cancel`

Ele nao documenta body relevante.

Para o SDK, a principal implicacao e:

- cancelamento deve ser tratado como operacao dedicada do recurso
- nao como update de `status`

## Webhooks e observabilidade

A pagina oficial de eventos para antecipacoes e os enums de webhook do Asaas cobrem pelo menos:

- `RECEIVABLE_ANTICIPATION_CANCELLED`
- `RECEIVABLE_ANTICIPATION_SCHEDULED`
- `RECEIVABLE_ANTICIPATION_PENDING`
- `RECEIVABLE_ANTICIPATION_CREDITED`
- `RECEIVABLE_ANTICIPATION_DEBITED`
- `RECEIVABLE_ANTICIPATION_DENIED`
- `RECEIVABLE_ANTICIPATION_OVERDUE`

Para o SDK, isso reforca duas regras:

- a conciliacao de antecipacoes nao deve depender apenas de polling
- os status do recurso e os eventos de webhook devem ser modelados como conjuntos relacionados, mas nao necessariamente identicos

## Inconsistencias e riscos de compatibilidade

O dominio de split e antecipacoes hoje tem algumas divergencias importantes entre guias, exemplos e referencia.

### `percentualValue` versus `percentageValue`

Na referencia atual de split usada em cobrancas e parcelamentos, o nome publicado e:

- `percentualValue`

Mas outros pontos da plataforma, como checkout, usam:

- `percentageValue`

O SDK deve preservar o nome correto por dominio e evitar normalizacao automatica silenciosa.

### Split nao nasce em endpoint proprio

Os guias de split tratam a funcionalidade como parte da criacao de cobrancas, assinaturas, parcelamentos e checkout.

A referencia confirma isso:

- o unico endpoint publico isolado de escrita e `PUT /v3/installments/{id}/splits`

O pacote nao deve inventar `split.create()` sem semantica oficial.

### Antecipacao com documentos

Pela referencia, `request anticipation` usa `multipart/form-data`.

Mas isso e facil de perder se o integrador olhar apenas a pagina introdutoria.

O SDK precisa validar isso cedo e deixar claro que a camada HTTP precisa suportar upload.

### Split em cobrancas antecipadas

O guia funcional de split em cobrancas antecipadas deixa claro que o valor do split precisa respeitar o valor liquido apos antecipacao.

A referencia de split confirma o efeito disso via:

- `BLOCKED_BY_VALUE_DIVERGENCE`
- `VALUE_DIVERGENCE_BLOCK`

Entao o SDK deve tratar essa combinacao como comportamento central do dominio, nao como detalhe raro.

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
asaas.splits.listPaid(filters)
asaas.splits.getPaid(id)
asaas.splits.listReceived(filters)
asaas.splits.getReceived(id)
asaas.splits.getStatistics()
asaas.splits.updateInstallment(id, input)

asaas.anticipations.simulate(input)
asaas.anticipations.request(input)
asaas.anticipations.list(filters)
asaas.anticipations.get(id)
asaas.anticipations.cancel(id)
asaas.anticipations.getLimits()
asaas.anticipations.getConfiguration()
asaas.anticipations.updateConfiguration(input)
```

E tambem expor tipos separados para:

- `AsaasSplit`
- `AsaasSplitStatus`
- `AsaasSplitCancellationReason`
- `AsaasInstallmentSplitInput`
- `AsaasSplitStatistics`
- `AsaasAnticipation`
- `AsaasAnticipationStatus`
- `AsaasAnticipationRequestInput`
- `AsaasAnticipationSimulation`
- `AsaasAnticipationLimits`
- `AsaasAutomaticAnticipationConfig`

O SDK nao deveria:

- inventar criacao isolada de split fora dos recursos de origem
- colapsar `percentualValue` com `percentageValue`
- modelar antecipacao como JSON simples quando o request pode exigir arquivo
- tratar configuracao automatica como suporte generico para todas as modalidades
- esconder que split e antecipacao se afetam mutuamente em cenarios de divergencia de valor

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `splits/types.ts`
- `splits/service.ts`
- `splits/installments.ts`
- `anticipations/types.ts`
- `anticipations/service.ts`
- `anticipations/config.ts`

Com responsabilidades claras:

- `splits/types.ts` para contrato transversal de split
- `splits/service.ts` para leitura de paid, received e statistics
- `splits/installments.ts` para update isolado de parcelamentos
- `anticipations/types.ts` para estados, simulacao, limites e recurso principal
- `anticipations/service.ts` para request, list, get e cancel
- `anticipations/config.ts` para configuracao automatica

Esse modulo tambem consolida cinco regras de desenho:

- split nasce em outros dominios e aqui e observado e ajustado
- antecipacao e recurso proprio com ciclo de vida completo
- upload de arquivo faz parte do contrato real de antecipacao
- limites e automacao nao compartilham exatamente o mesmo escopo funcional
- divergencia de valor e uma regra estrutural de split, nao um erro cosmetico

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de split, split em cobrancas, parcelamentos, assinaturas e cobrancas antecipadas
- guia de consulta de splits e FAQ
- guia de antecipacoes e webhook de antecipacoes
- referencias de `splits`, `statistics`, `anticipations`, `simulate`, `limits`, `configurations` e `cancel`

### Quais capacidades reais isso mostra?

- split e configurado nos recursos de origem e depois observado por endpoints proprios
- parcelamentos podem ter split atualizado isoladamente
- o Asaas separa a visao de splits pagos e recebidos
- antecipacoes podem ser simuladas, solicitadas, canceladas e automatizadas parcialmente
- documentacao comprobatoria pode ser exigida no request de antecipacao

### Como isso deve virar API publica no SDK?

- com services separados de `splits` e `anticipations`
- com contratos reutilizaveis de split nos modulos de origem
- com inputs discriminados para antecipacao por cobranca ou parcelamento
- com suporte a multipart no request de antecipacao
- com enums operacionais reais de split e antecipacao

### O que fica fora deste corte?

- criacao inicial de split dentro de cobrancas, assinaturas e checkout
- escrow
- regras financeiras completas de saldo e extrato
- modelagem completa de pagamentos que originam os recebiveis

## Fontes oficiais consultadas

- [Split](https://docs.asaas.com/docs/split)
- [Split de pagamentos](https://docs.asaas.com/docs/split-de-pagamentos)
- [Split em cobrancas avulsas](https://docs.asaas.com/docs/split-em-cobrancas-avulsas)
- [Split em parcelamentos](https://docs.asaas.com/docs/split-em-parcelamentos)
- [Split em assinaturas](https://docs.asaas.com/docs/split-em-assinaturas)
- [Split em cobrancas antecipadas](https://docs.asaas.com/docs/split-em-cobrancas-antecipadas)
- [Consulta de splits via interface](https://docs.asaas.com/docs/consulta-de-splits-via-interface)
- [Duvidas frequentes sobre split](https://docs.asaas.com/docs/duvidas-frequentes-split)
- [Antecipacoes](https://docs.asaas.com/docs/antecipacoes)
- [Webhook para antecipacoes](https://docs.asaas.com/docs/webhook-para-antecipacoes)
- [Update installment splits](https://docs.asaas.com/reference/update-installment-splits)
- [Listar splits pagos](https://docs.asaas.com/reference/listar-splits-pagos)
- [Retrieve a single paid split](https://docs.asaas.com/reference/retrieve-a-single-paid-split)
- [Listar splits recebidos](https://docs.asaas.com/reference/listar-splits-recebidos)
- [Retrieve a single received split](https://docs.asaas.com/reference/retrieve-a-single-received-split)
- [Retrieve split values](https://docs.asaas.com/reference/retrieve-split-values)
- [Request anticipation](https://docs.asaas.com/reference/request-anticipation)
- [List anticipations](https://docs.asaas.com/reference/list-anticipations)
- [Retrieve a single anticipation](https://docs.asaas.com/reference/retrieve-a-single-anticipation)
- [Simulate anticipation](https://docs.asaas.com/reference/simulate-anticipation)
- [Retrieve anticipation limits](https://docs.asaas.com/reference/retrieve-anticipation-limits)
- [Retrieve status of automatic anticipation](https://docs.asaas.com/reference/retrieve-status-of-automatic-anticipation)
- [Update status of automatic anticipation](https://docs.asaas.com/reference/update-status-of-automatic-anticipation)
- [Cancel anticipation](https://docs.asaas.com/reference/cancel-anticipation)
