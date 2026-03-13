# Pague contas e escrow

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como os dominios oficiais de pagamento de contas e escrow do Asaas devem virar modulos TypeScript claros dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- pagamento de contas por linha digitavel
- simulacao, criacao, listagem, consulta e cancelamento de `bill`
- regras operacionais de agendamento, vencimento, cancelamento e teste
- eventos e estados operacionais de pagamento de contas
- configuracao default e por subconta de escrow
- consulta do escrow de um pagamento e encerramento da garantia
- permissoes e fronteiras entre `bill`, `escrow`, `transfers`, `subaccounts` e `webhooks`

Sem este modulo, o SDK ficaria incompleto em dois fluxos financeiros sensiveis:

- saida de dinheiro para pagamento de contas
- bloqueio e liberacao de valores garantidos por escrow

## Papel do dominio na plataforma

Embora o indice una `bill` e `escrow` no mesmo arquivo, a API do Asaas trata esses assuntos como dominios diferentes.

### Pagamento de contas

`bill` representa um recurso operacional de saida financeira.

Na pratica, ele permite:

- validar o pagamento de uma conta via simulacao
- criar o pagamento a partir da linha digitavel
- listar e consultar pagamentos gerados
- cancelar pagamentos ainda cancelaveis

O foco aqui nao e cobranca recebida.

O foco e pagar uma conta a partir do saldo e das regras operacionais da conta Asaas.

### Escrow

`escrow` representa um recurso de garantia vinculado a subcontas e a pagamentos especificos.

Na pratica, ele permite:

- configurar uma politica default de escrow para subcontas
- sobrescrever a configuracao de uma subconta especifica
- consultar a garantia associada a um pagamento
- encerrar a garantia quando o fluxo de liberacao termina

Para o SDK, a conclusao correta e:

- `bill` deve ser um modulo proprio de money-out
- `escrow` deve ser um modulo proprio de configuracao e operacao de garantia

Agrupar os dois no mesmo arquivo ajuda o plano do SDK.

Misturar os dois na mesma superficie publica nao ajuda.

## Recorte correto deste modulo

### O que entra aqui

- `POST /v3/bill`
- `GET /v3/bill`
- `POST /v3/bill/simulate`
- `GET /v3/bill/{id}`
- `POST /v3/bill/{id}/cancel`
- status, eventos e regras operacionais de `bill`
- `POST /v3/accounts/escrow`
- `GET /v3/accounts/escrow`
- `POST /v3/accounts/{id}/escrow`
- `GET /v3/accounts/{id}/escrow`
- `GET /v3/payments/{id}/escrow`
- `POST /v3/escrow/{id}/finish`
- permissoes `BILL:*`, `ESCROW_CONFIG:*` e `ESCROW:*`

### O que fica para outros modulos

- `08-transferencias.md` para TED, Pix de saida, saque e transferencia entre contas
- `09-subcontas.md` para criacao e onboarding de subcontas
- `10-links-de-pagamento-e-checkout.md` e `11-split-e-antecipacoes.md` para origem comercial dos pagamentos
- `06-webhooks.md` para infraestrutura, assinatura e entrega de eventos
- `01-fundacoes-http-seguranca-e-ambientes.md` para autenticacao, rate limits e convencoes transversais
- `Financial Transaction` e extrato, que sao observabilidade financeira de conta, nao operacao de `bill` ou `escrow`

Um limite importante aqui e este:

- `bill` move dinheiro para fora da conta
- `escrow` segura e libera dinheiro de pagamentos elegiveis

Esses fluxos sao adjacentes, mas nao compartilham o mesmo ciclo de vida.

## Superficie oficial do dominio

Pela referencia oficial atual, este arquivo se divide em dois blocos distintos.

### 1. Pagamento de contas

- `POST /v3/bill`
  - resumo oficial: `Create a bill payment`
  - permissao oficial confirmada: `BILL:WRITE`
- `GET /v3/bill`
  - resumo oficial: `List bill payments`
  - permissao oficial confirmada: `BILL:READ`
- `POST /v3/bill/simulate`
  - resumo oficial: `Simulate a bill payment`
- `GET /v3/bill/{id}`
  - resumo oficial: `Retrieve a single bill payment`
- `POST /v3/bill/{id}/cancel`
  - resumo oficial: `Cancel bill payments`

### 2. Escrow

- `POST /v3/accounts/escrow`
  - resumo oficial: `Create default Escrow Account configuration to all subaccounts`
  - permissao oficial: `ESCROW_CONFIG:WRITE`
- `GET /v3/accounts/escrow`
  - resumo oficial: `Retrieve default Escrow Account configuration`
  - permissao oficial: `ESCROW_CONFIG:READ`
- `POST /v3/accounts/{id}/escrow`
  - resumo oficial: `Save or update Escrow Account configuration for subaccount`
  - permissao oficial: `ESCROW_CONFIG:WRITE`
- `GET /v3/accounts/{id}/escrow`
  - resumo oficial: `Reterive Escrow Account configuration for subaccount`
  - permissao oficial: `ESCROW_CONFIG:READ`
- `GET /v3/payments/{id}/escrow`
  - resumo oficial: `Retrieve payment escrow in the Escrow Account`
  - permissao oficial: `ESCROW:READ`
- `POST /v3/escrow/{id}/finish`
  - resumo oficial: `Finish payment escrow in the Escrow Account`
  - permissao oficial: `ESCROW:WRITE`

Esse desenho ja mostra a principal assimetria do modulo:

- `bill` e um recurso com ciclo operacional proprio
- `escrow` se divide entre configuracao de conta e operacao sobre uma garantia ja existente

## Pagamento de contas como recurso de saida financeira

O guia oficial de `Pague Contas` e a referencia de `Create a bill payment` deixam claro que o ponto de partida do dominio e a linha digitavel.

Ou seja:

- a identidade principal do pagamento de conta e `identificationField`
- o SDK nao deve tratar `bill` como um alias de `transfer`

### Contrato principal de criacao

Pela referencia atual de `POST /v3/bill`, o request documentado aceita:

- `identificationField`
- `scheduleDate`
- `description`
- `discount`
- `interest`
- `fine`
- `dueDate`
- `value`
- `externalReference`

O unico campo obrigatorio documentado e:

- `identificationField`

Dois campos merecem destaque porque so fazem sentido em certos tipos de conta:

- `dueDate`
- `value`

A propria referencia explica que eles existem para contas que nao trazem essa informacao de forma implicita, como o exemplo de fatura de cartao de credito.

### Simulacao antes da criacao

`POST /v3/bill/simulate` merece modulo proprio no SDK, e nao apenas um helper interno.

Motivo:

- ele faz parte do fluxo oficial
- reduz erro operacional antes da criacao
- ajuda a diferenciar validacao de linha digitavel de efetiva instrucao de pagamento

Para o SDK, a decisao correta e:

- expor `simulate` como metodo publico de primeiro nivel em `bill`

### Regras operacionais de agendamento e vencimento

As fontes oficiais de `Pague Contas` e de `Pagamento imediato x Pagamento agendado` registram quatro regras importantes:

1. se `scheduleDate` for informado, o pagamento e agendado para essa data
2. se a data cair em dia nao util, o pagamento ocorre no proximo dia util
3. se `scheduleDate` nao for informado, o pagamento ocorre na data de vencimento da conta
4. contas vencidas nao podem ser agendadas; o pagamento ocorre imediatamente quando a requisicao e feita

Para o SDK, isso implica duas coisas:

- o metodo `create` nao deve esconder `scheduleDate`
- a documentacao publica do pacote precisa explicar a diferenca entre pagamento imediato e pagamento agendado

### Listagem e consulta

Hoje a referencia publica de `GET /v3/bill` documenta apenas:

- `offset`
- `limit`

Esse e um ponto importante de disciplina de escopo.

O SDK nao deve:

- inventar filtros adicionais
- assumir contratos de busca que a referencia atual nao publica

Ja `GET /v3/bill/{id}` fecha a leitura pontual do recurso.

Com isso, o dominio atual de `bill` fica claramente assim:

- `simulate`
- `create`
- `list`
- `get`
- `cancel`

Sem `update`, `delete`, `restore` ou `list` com filtros ricos documentados.

### Cancelamento

O endpoint `POST /v3/bill/{id}/cancel` tem uma regra operacional importante explicitada na propria referencia:

- a propriedade `canBeCancelled` do `bill` e que indica se o pagamento pode ser cancelado

E o comportamento esperado, quando permitido, e:

- o pagamento da conta nao sera executado

Para o SDK, a conclusao correta e:

- expor `cancel(id)`
- preservar `canBeCancelled` no contrato de leitura
- nao prometer cancelamento localmente sem antes consultar ou confiar na resposta do servidor

## Estados, eventos e leitura operacional de `bill`

O Asaas publica os eventos de pagamento de contas em documentacao funcional propria.

Combinando essa documentacao com os exemplos oficiais, o conjunto de estados observados neste dominio inclui:

- `PENDING`
- `BANK_PROCESSING`
- `PAID`
- `CANCELLED`
- `FAILED`
- `REFUNDED`
- `AWAITING_CHECKOUT_RISK_ANALYSIS_REQUEST`

Esses valores aparecem de forma mais clara nos materiais de eventos do que numa pagina centralizada de enums.

Isso e importante porque o SDK vai precisar lidar com estados reais antes de existir um schema mais consolidado.

### Campos operacionais relevantes

Os exemplos oficiais de eventos e carga operacional de `bill` tambem expoem campos que importam para tipagem e suporte:

- `canBeCancelled`
- `failReasons`
- `transactionReceiptUrl`

Para o SDK, isso reforca:

- o contrato de `bill` nao deve ser reduzido a `id + status`
- a resposta precisa preservar detalhes operacionais relevantes para troubleshooting e conciliacao

### Relacao com webhooks e validacao critica

Os guias de pagamento de contas e os materiais de validacao via webhook mostram que este dominio fica proximo de outros fluxos de autorizacao critica de money-out.

A inferencia segura aqui e:

- `bill` nao vira parte do modulo `webhooks`
- mas a documentacao do SDK precisa deixar claro que integracoes empresariais podem depender de aprovacao e eventos operacionais fora do request sincrono

## Escrow como garantia configuravel

Os guias oficiais de escrow deixam claro que esse dominio tem duas camadas:

1. configuracao de politica
2. operacao sobre a garantia de um pagamento

Essa divisao tambem aparece nos nomes de permissao:

- `ESCROW_CONFIG:*` para configuracao
- `ESCROW:*` para leitura e encerramento da garantia

### Configuracao default e por subconta

Tanto `POST /v3/accounts/escrow` quanto `POST /v3/accounts/{id}/escrow` documentam o mesmo shape principal de request:

- `daysToExpire`
- `enabled`
- `isFeePayer`

O unico campo obrigatorio documentado e:

- `daysToExpire`

As descricoes oficiais indicam:

- `daysToExpire` define em quantos dias o escrow expira
- `enabled` liga ou desliga a funcionalidade
- `isFeePayer` define se a subconta paga a taxa do escrow; se nao for informado, a conta principal assume a taxa

O modelo correto para o SDK e:

- um metodo para configuracao default da conta principal
- outro metodo para configuracao de uma subconta especifica

Separar os dois importa porque:

- os paths sao diferentes
- o alvo operacional e diferente
- o significado de heranca e override tambem e diferente

### Leitura de configuracao

As leituras oficiais hoje sao:

- `GET /v3/accounts/escrow`
- `GET /v3/accounts/{id}/escrow`

Um detalhe operacional documentado nas respostas de erro merece registro:

- chamadas `GET` com body podem retornar `403`

Isso nao muda a API publica do SDK, mas reforca que:

- o cliente HTTP deve tratar `GET` desse dominio sem body

### Garantia associada a um pagamento

`GET /v3/payments/{id}/escrow` faz a ponte entre o dominio comercial do pagamento e o dominio operacional da garantia.

Esse endpoint mostra um limite importante:

- o SDK nao deve tentar listar escrows genericamente sem base documental
- a superficie publica atual entra pelo pagamento ou pelo identificador do escrow

### Encerramento do escrow

`POST /v3/escrow/{id}/finish` encerra a garantia a partir do identificador do escrow.

Na referencia atual:

- existe path param `id`
- nao ha body params documentados

Para o SDK, a decisao correta e:

- expor uma operacao imperativa `finish`
- nao inventar payload complementar ate que a referencia publique um contrato de body

## Divergencias e lacunas atuais da documentacao

Este modulo tem algumas inconsistencias e zonas cinzentas que o SDK vai precisar absorver com cuidado.

### 1. `bill` tem ciclo claro, mas schema de leitura menos centralizado

Os endpoints de `bill` existem com clareza.

Mas parte dos estados e campos operacionais aparece de forma mais explicita nos guias de eventos do que numa referencia unica de contrato.

Para o SDK, isso significa:

- tipar o que a documentacao confirma
- preservar campos operacionais relevantes sem reduzir demais a resposta

### 2. `bill.list` documenta apenas paginacao

A referencia atual de listagem publica so:

- `offset`
- `limit`

Logo:

- o SDK nao deve prometer filtros nao documentados

### 3. `escrow` usa `POST` para `save or update`

A configuracao por subconta usa `POST` em vez de `PUT` ou `PATCH`.

Isso nao e um problema para o cliente HTTP, mas e um ponto semantico importante:

- a API publica do SDK deve refletir a intencao de `set` ou `save`, nao vender isso como REST puro

### 4. Ha typo oficial em uma pagina de referencia

O proprio Asaas publica a pagina:

- `Reterive Escrow Account configuration for subaccount`

Para o SDK, isso nao altera o path real.

Mas altera a necessidade de registrar a URL correta da documentacao e nao depender de intuicao por nome.

### 5. `finish` publica `content-type` JSON sem body documentado

Na pagina de encerramento de escrow, a referencia mostra `content-type: application/json`, mas nao publica body params.

A leitura mais segura e:

- a operacao existe e deve ser suportada
- o SDK nao deve inventar um contrato de input adicional ate haver confirmacao oficial

## Decisoes recomendadas para a API publica do SDK

O desenho mais coerente deste modulo no `@repo/asaas` hoje e:

- `asaas.bill.simulate(input)`
- `asaas.bill.create(input)`
- `asaas.bill.list(params)`
- `asaas.bill.get(id)`
- `asaas.bill.cancel(id)`
- `asaas.escrow.getDefaultConfig()`
- `asaas.escrow.setDefaultConfig(input)`
- `asaas.escrow.getSubaccountConfig(accountId)`
- `asaas.escrow.setSubaccountConfig(accountId, input)`
- `asaas.escrow.getPayment(paymentId)`
- `asaas.escrow.finish(escrowId)`

### Decisoes de modelagem

1. `bill` e `escrow` devem ser namespaces separados
2. `bill.list` deve aceitar apenas paginacao enquanto a referencia oficial nao documentar mais filtros
3. `bill` deve preservar campos operacionais como `canBeCancelled`, `failReasons` e `transactionReceiptUrl`
4. `escrow` deve separar configuracao default e configuracao por subconta
5. `escrow.finish` deve continuar sem payload opcional inventado
6. permissao de configuracao e permissao de operacao de escrow devem permanecer conceitualmente separadas

### Tipos que este modulo pede

No minimo, este recorte pede os seguintes contratos no plano do SDK:

- `BillPaymentCreateInput`
- `BillPaymentSimulationInput`
- `BillPaymentListParams`
- `BillPayment`
- `BillPaymentStatus`
- `EscrowConfigInput`
- `EscrowConfig`
- `PaymentEscrow`

## O que este modulo muda no plano do SDK

Depois desta etapa, o plano do pacote fica mais claro em quatro pontos:

1. `@repo/asaas` precisa de um modulo `bill`, e nao apenas de `payments` e `transfers`
2. `escrow` precisa ser modelado como modulo proprio, e nao como detalhe de `subaccounts`
3. a documentacao do SDK precisa registrar explicitamente o fluxo de money-out com agendamento e cancelamento
4. a futura tipagem de webhooks deve incluir eventos de `bill`, mesmo que a infraestrutura deles continue centralizada no modulo `webhooks`

## Perguntas que este modulo responde

- Como pagar uma conta a partir da linha digitavel no Asaas?
- Quando usar simulacao antes da criacao?
- O que acontece com datas nao uteis, vencimento e cancelamento?
- Como saber se um pagamento de conta ainda pode ser cancelado?
- Como configurar escrow para todas as subcontas ou apenas para uma subconta?
- Como consultar a garantia de um pagamento e encerrala?
- Onde termina `bill` e onde comecam `transfer`, `subaccounts` e `webhooks`?

## Fontes oficiais consultadas

- [Pague Contas](https://docs.asaas.com/docs/pague-contas)
- [Pagamento imediato x Pagamento agendado](https://docs.asaas.com/docs/pagamento-imediato-x-pagamento-agendado)
- [Erros e excecoes comuns - Pague Contas](https://docs.asaas.com/docs/mensagens-de-erro-comuns)
- [Eventos para pague contas](https://docs.asaas.com/docs/webhook-para-pague-contas)
- [Mecanismo para validacao de saque via webhooks](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [What can be tested?](https://docs.asaas.com/docs/what-can-be-tested)
- [Create a bill payment](https://docs.asaas.com/reference/create-a-bill-payment)
- [List bill payments](https://docs.asaas.com/reference/list-bill-payments)
- [Simulate a bill payment](https://docs.asaas.com/reference/simulate-a-bill-payment)
- [Retrieve a single bill payment](https://docs.asaas.com/reference/retrieve-a-single-bill-payment)
- [Cancel bill payment](https://docs.asaas.com/reference/cancel-bill-payment)
- [Escrow Account Introduction](https://docs.asaas.com/docs/introduction-2)
- [Enabling the Escrow Account for Subaccounts](https://docs.asaas.com/docs/enabling-the-escrow-account-for-subaccounts)
- [Fee Charging per Configured Subaccount](https://docs.asaas.com/docs/fee-charging-per-configured-subaccount)
- [Funds Guaranteed by the Escrow Account](https://docs.asaas.com/docs/funds-guaranteed-by-the-escrow-account)
- [Release of Guaranteed Funds](https://docs.asaas.com/docs/release-of-guaranteed-funds)
- [Disabling the Escrow Account](https://docs.asaas.com/docs/disabling-the-escrow-account)
- [Create default Escrow Account configuration to all subaccounts](https://docs.asaas.com/reference/create-default-escrow-account-configuration-to-all-subaccounts)
- [Retrieve default Escrow Account configuration](https://docs.asaas.com/reference/retrieve-default-escrow-account-configuration)
- [Save or update Escrow Account configuration for subaccount](https://docs.asaas.com/reference/save-or-update-escrow-account-configuration-for-subaccount)
- [Reterive Escrow Account configuration for subaccount](https://docs.asaas.com/reference/reterive-escrow-account-configuration-for-subaccount)
- [Retrieve payment escrow in the Escrow Account](https://docs.asaas.com/reference/retrieve-payment-escrow-in-the-escrow-account)
- [Finish payment escrow in the Escrow Account](https://docs.asaas.com/reference/finish-payment-escrow-in-the-escrow-account)
