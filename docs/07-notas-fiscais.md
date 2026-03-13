# Notas fiscais

> Data de revisao: 12 de marco de 2026

## Objetivo

Definir como o dominio oficial de notas fiscais do Asaas deve virar um modulo TypeScript completo dentro do SDK `@repo/asaas`.

Este arquivo cobre:

- configuracao fiscal da conta via `fiscalInfo`
- configuracao municipal e dependencias por prefeitura
- emissao via Portal Nacional
- catalogos auxiliares de servicos municipais e situacoes tributarias
- ciclo de vida principal de `invoices`
- emissao, atualizacao, consulta e cancelamento de NFS-e
- impactos atuais da Reforma Tributaria no contrato da API

Sem esse modulo, o SDK fica incompleto em um dos dominios mais sensiveis da plataforma:

- a emissao depende de configuracao previa por prefeitura
- o contrato mistura campos fiscais, credenciais municipais e dados da nota
- a API publica sofre mudancas regulatorias e de integracao com o Ambiente de Dados Nacional

## Papel do dominio na plataforma

O Asaas posiciona notas fiscais como o modulo de emissao de NFS-e para empresas.

A nota pode ser:

- vinculada a uma cobranca
- vinculada a um parcelamento
- avulsa para um cliente

Ao mesmo tempo, esse dominio nao e apenas `invoices`.

Na pratica, a emissao depende de duas camadas:

1. a base fiscal da conta, modelada em `fiscalInfo`
2. o ciclo operacional da nota, modelado em `invoices`

Para o SDK, isso implica uma decisao importante:

- `fiscalInfo` e `invoices` devem viver no mesmo modulo funcional de notas fiscais
- separar isso em dois modulos independentes criaria uma API publica artificialmente fragmentada

## Recorte correto deste modulo

### O que entra aqui

- leitura das exigencias municipais
- create e get de `fiscalInfo`
- configuracao de emissao via Portal Nacional
- listagem de servicos municipais
- listagem de codigos de situacoes tributarias
- create, list, get, update, authorize e cancel de `invoices`
- status, links de PDF e XML e impostos retornados na leitura
- riscos atuais de compatibilidade com a Reforma Tributaria

### O que fica para outros modulos

- criacao da cobranca ou do parcelamento que origina a nota
- configuracao automatica de notas para assinaturas
- webhooks e processamento assincrono detalhado
- onboarding e aprovacao de conta ou subconta

Um limite importante aqui e este:

- a nota pode nascer de `payment`, `installment` ou `customer`
- mas o contrato e a operacao da nota continuam sendo dominio proprio de `invoices`

## Sequencia oficial de integracao

O proprio guia de introducao das notas fiscais descreve uma ordem pratica de integracao.

### 1. Descobrir o que a prefeitura exige

- `GET /v3/fiscalInfo/municipalOptions`

### 2. Salvar ou atualizar as informacoes fiscais da conta

- `POST /v3/fiscalInfo/`

### 3. Descobrir qual servico municipal deve ser informado

- `GET /v3/fiscalInfo/services`

Ou, quando a conta usa Portal Nacional:

- informar manualmente `municipalServiceCode` no agendamento da nota

### 4. Agendar a nota fiscal

- `POST /v3/invoices`

### 5. Acompanhar emissao, atualizar, adiantar ou cancelar

- `GET /v3/invoices`
- `GET /v3/invoices/{id}`
- `PUT /v3/invoices/{id}`
- `POST /v3/invoices/{id}/authorize`
- `POST /v3/invoices/{id}/cancel`

Para o SDK, essa sequencia vira um fluxo guiado de integracao, nao apenas uma lista solta de endpoints.

## Superficie oficial do dominio

Pela documentacao oficial atual, o dominio se divide em tres blocos.

### 1. Fundacao fiscal da conta

- `GET /v3/fiscalInfo/municipalOptions`
- `POST /v3/fiscalInfo/`
- `GET /v3/fiscalInfo/`
- `POST /v3/fiscalInfo/nationalPortal`

### 2. Catalogos auxiliares

- `GET /v3/fiscalInfo/services`
- `GET /v3/fiscalInfo/taxSituationCodes`

### 3. Ciclo de vida da nota

- `POST /v3/invoices`
- `GET /v3/invoices`
- `GET /v3/invoices/{id}`
- `PUT /v3/invoices/{id}`
- `POST /v3/invoices/{id}/authorize`
- `POST /v3/invoices/{id}/cancel`

Ha um detalhe importante de modelagem aqui:

- a referencia publica nao documenta `DELETE /v3/invoices/{id}`
- a remocao logica da nota acontece via cancelamento

## Configuracao municipal e `fiscalInfo`

### Opcoes municipais

O endpoint de configuracao municipal retorna o que a prefeitura exige para a conta atual.

Os campos mais importantes da resposta atual sao:

- `authenticationType`
- `supportsCancellation`
- `usesSpecialTaxRegimes`
- `usesServiceListItem`
- `specialTaxRegimesList`
- `nationalPortalTaxCalculationRegimeList`
- `nationalPortalTaxCalculationRegimeHelp`
- `municipalInscriptionHelp`
- `specialTaxRegimeHelp`
- `serviceListItemHelp`
- `digitalCertificatedHelp`
- `accessTokenHelp`
- `municipalServiceCodeHelp`

O enum oficial de `authenticationType` e:

- `CERTIFICATE`
- `TOKEN`
- `USER_AND_PASSWORD`

Para o SDK, isso pede uma regra clara:

- primeiro ler `municipalOptions`
- depois validar localmente o payload de `fiscalInfo` com base no que aquela prefeitura exige

### Criacao e atualizacao de `fiscalInfo`

A referencia atual usa um unico endpoint para criar e atualizar as informacoes fiscais:

- `POST /v3/fiscalInfo/`

Esse endpoint usa `multipart/form-data`, nao `application/json`.

Os campos obrigatorios documentados hoje sao:

- `email`
- `simplesNacional`

Os campos opcionais documentados incluem:

- `municipalInscription`
- `culturalProjectsPromoter`
- `cnae`
- `specialTaxRegime`
- `serviceListItem`
- `nbsCode`
- `rpsSerie`
- `rpsNumber`
- `loteNumber`
- `username`
- `password`
- `accessToken`
- `certificateFile`
- `certificatePassword`
- `nationalPortalTaxCalculationRegime`

Esse shape mostra um ponto importante para o SDK:

- a autenticacao com a prefeitura pode depender de usuario e senha
- ou de token
- ou de certificado digital com senha

Logo, o pacote precisa de suporte real a upload binario e a contratos mutuamente condicionais, nao apenas tipos planos.

### Leitura de `fiscalInfo`

O `GET /v3/fiscalInfo/` retorna a configuracao salva sem expor segredos diretamente.

Em vez disso, a resposta publica flags como:

- `passwordSent`
- `accessTokenSent`
- `certificateSent`

Para o SDK, isso implica separar:

- input de escrita
- tipo de leitura
- helpers de mascaramento e verificacao de completude

## Portal Nacional, servicos municipais e catalogos fiscais

### Portal Nacional

O endpoint:

- `POST /v3/fiscalInfo/nationalPortal`

aceita apenas:

- `enabled`

Isso indica se a emissao pelo Portal Nacional deve ficar habilitada ou nao.

Esse detalhe afeta o fluxo de emissao porque, segundo o guia de notas fiscais:

- contas que usam Portal Nacional podem nao conseguir listar servicos municipais pela API
- nesses casos, o servico precisa ser informado manualmente por `municipalServiceCode`

### Servicos municipais

A referencia atual de listagem de servicos esta em:

- `GET /v3/fiscalInfo/services`

Com filtros:

- `offset`
- `limit`
- `description`

Cada item retornado documenta:

- `id`
- `description`
- `issTax`

O guia funcional reforca que:

- quando houver lista de servicos, o ideal e informar `municipalServiceId`
- quando nao houver lista, deve-se informar `municipalServiceCode`

Para o SDK, a consequencia e objetiva:

- o input de criacao precisa aceitar as duas formas
- a validacao de negocio deve exigir uma ou outra, nao necessariamente ambas

### Codigos de situacao tributaria

O endpoint:

- `GET /v3/fiscalInfo/taxSituationCodes`

aceita filtros por:

- `offset`
- `limit`
- `code`
- `description`

Cada item retornado inclui:

- `code`
- `description`
- `isSubjectToIbsCbsTaxation`
- `isBaseReductionPercentApplicable`
- `isDefermentApplicable`

Esse catalogo e importante porque a documentacao da Reforma Tributaria recomenda preparar a aplicacao para selecao de situacao tributaria conforme a operacao.

## Contrato principal de `invoices`

### Criacao

O endpoint oficial e:

- `POST /v3/invoices`

Os campos obrigatorios documentados hoje sao:

- `serviceDescription`
- `observations`
- `value`
- `deductions`
- `effectiveDate`
- `municipalServiceName`
- `taxes`

O request ainda aceita:

- `payment`
- `installment`
- `customer`
- `externalReference`
- `municipalServiceId`
- `municipalServiceCode`
- `updatePayment`

Dentro de `taxes`, a referencia atual exige:

- `retainIss`
- `iss`
- `pis`
- `cofins`
- `csll`
- `inss`
- `ir`

E ainda documenta campos adicionais como:

- `nbsCode`
- `taxSituationCode`
- `taxClassificationCode`
- `operationIndicatorCode`
- `pisCofinsRetentionType`
- `pisCofinsTaxStatus`

Ha duas regras operacionais que a referencia nao expressa completamente em `required`, mas o guia funcional deixa claras:

1. a nota precisa nascer de um contexto de negocio: `payment`, `installment` ou `customer`
2. para identificar o servico, normalmente deve existir `municipalServiceId` ou `municipalServiceCode`

Entao o SDK nao deve confiar apenas no schema bruto de `required`.

### Leitura

Os retornos de create, get, update, authorize e cancel compartilham o mesmo contrato principal de leitura.

Os campos mais importantes documentados hoje sao:

- `id`
- `status`
- `customer`
- `payment`
- `installment`
- `type`
- `statusDescription`
- `serviceDescription`
- `pdfUrl`
- `xmlUrl`
- `rpsSerie`
- `rpsNumber`
- `number`
- `validationCode`
- `value`
- `deductions`
- `effectiveDate`
- `observations`
- `estimatedTaxesDescription`
- `externalReference`
- `taxes`
- `municipalServiceId`
- `municipalServiceCode`
- `municipalServiceName`

Na resposta, `taxes` fica mais amplo e ja traz valores calculados para a transicao tributaria:

- `stateIbs`
- `stateIbsValue`
- `municipalIbs`
- `municipalIbsValue`
- `cbs`
- `cbsValue`

### Status

Pela referencia atual, os enums de `status` documentados em `invoices` sao:

- `SCHEDULED`
- `AUTHORIZED`
- `PROCESSING_CANCELLATION`
- `CANCELED`
- `CANCELLATION_DENIED`
- `ERROR`

Mas os guias funcionais e o webhook oficial de notas fiscais tambem citam:

- `INVOICE_SYNCHRONIZED`
- estado de nota `SYNCHRONIZED`

Para o SDK, isso e importante:

- o tipo publico de status deve considerar o superset efetivamente usado pela plataforma
- limitar `InvoiceStatus` apenas ao enum da referencia atual cria risco real de rejeitar estados validos

## Busca, atualizacao, emissao e cancelamento

### Listagem

O endpoint `GET /v3/invoices` aceita atualmente:

- `offset`
- `limit`
- `effectiveDate[Ge]`
- `effectiveDate[Le]`
- `payment`
- `installment`
- `externalReference`
- `status`
- `customer`

Isso pede um tipo proprio de `ListInvoicesParams`, sem inferir filtros adicionais.

### Atualizacao

O endpoint `PUT /v3/invoices/{id}` documenta:

- `serviceDescription`
- `observations`
- `externalReference`
- `value`
- `deductions`
- `effectiveDate`
- `updatePayment`
- `taxes`

Um ponto importante de modelagem:

- a referencia atual de update nao documenta `payment`, `installment` ou `customer`
- a referencia atual tambem nao documenta `municipalServiceId`, `municipalServiceCode` ou `municipalServiceName`

Entao o SDK nao deve modelar `update` como `Partial<CreateInvoiceInput>`.

### Emissao imediata de uma nota agendada

O endpoint:

- `POST /v3/invoices/{id}/authorize`

nao documenta body relevante.

Segundo o guia funcional:

- se `effectiveDate` for o dia atual, a emissao pode acontecer em ate 15 minutos
- se a nota estiver agendada para o futuro, `authorize` permite adiantar esse processamento

### Cancelamento

O endpoint:

- `POST /v3/invoices/{id}/cancel`

aceita atualmente:

- `cancelOnlyOnAsaas`

Esse comportamento precisa ser lido junto com `supportsCancellation` de `municipalOptions`.

Ou seja:

- o cancelamento existe na superficie da API
- mas a capacidade real de cancelamento automatico depende da prefeitura vinculada a conta

## Inconsistencias e riscos de compatibilidade

O dominio de notas fiscais hoje tem divergencias relevantes entre guias, referencia e breaking changes.

### Path de servicos municipais

O guia funcional ainda mostra:

- `GET /v3/invoices/municipalServices`

Ja a referencia oficial atual documenta:

- `GET /v3/fiscalInfo/services`

O SDK deve seguir a referencia publica atual e tratar o path antigo do guia como documentacao legada.

### Limite de pagina na lista de servicos

O guia funcional fala em ate 500 servicos por requisicao.

A referencia atual documenta:

- `limit` maximo de 100

Entao o SDK nao deve embutir a expectativa de pagina de 500 itens.

### Status `SYNCHRONIZED`

O guia funcional e o webhook para notas fiscais listam o estado `SYNCHRONIZED`.

A referencia de `invoices`, por outro lado, nao inclui esse valor nos enums publicados de resposta.

Logo, o SDK deve tratar isso como divergencia real da documentacao e aceitar `SYNCHRONIZED` como valor valido em tipos de leitura.

### Reforma Tributaria e shape futuro do payload

O calendario oficial de breaking changes anunciou para 1 de janeiro de 2026 a adequacao da emissao de notas fiscais a Reforma Tributaria.

Segundo essa comunicacao:

- os endpoints de agendar nota e criar configuracao de emissao passariam a receber um objeto `ibsCbs`
- esse objeto deveria comportar `nbsCode`, `nationalServiceCode`, `taxSituation`, `taxClassification` e `operationIndicatorCode`
- a falta desses campos pode gerar `400 Bad Request` para empresas de Lucro Real e Lucro Presumido

Mas a referencia publica atual em 12 de marco de 2026 ainda mostra outra modelagem:

- campos fiscais extras continuam flatten em `taxes`
- nao ha objeto `ibsCbs`
- nao ha `nationalServiceCode` no schema atual de `invoices`

Para o SDK, essa e a principal area de risco do modulo.

## Decisoes recomendadas para a API publica do SDK

O modulo deveria convergir para algo proximo de:

```ts
asaas.invoices.fiscalInfo.getMunicipalOptions()
asaas.invoices.fiscalInfo.upsert(input)
asaas.invoices.fiscalInfo.get()
asaas.invoices.fiscalInfo.configureNationalPortal({ enabled })

asaas.invoices.listMunicipalServices(filters)
asaas.invoices.listTaxSituationCodes(filters)

asaas.invoices.create(input)
asaas.invoices.list(filters)
asaas.invoices.get(id)
asaas.invoices.update(id, input)
asaas.invoices.authorize(id)
asaas.invoices.cancel(id, input)
```

E tambem expor tipos separados para:

- `AsaasFiscalInfoInput`
- `AsaasFiscalInfo`
- `AsaasMunicipalOptions`
- `AsaasMunicipalService`
- `AsaasTaxSituationCode`
- `AsaasInvoiceCreateInput`
- `AsaasInvoiceUpdateInput`
- `AsaasInvoice`
- `AsaasInvoiceStatus`

O SDK nao deveria:

- modelar `fiscalInfo` como JSON comum quando a referencia pede `multipart/form-data`
- tratar `update` como `Partial<CreateInvoiceInput>`
- assumir que `municipalServiceId` sempre existira
- fechar o tipo de status apenas no enum reduzido da referencia
- ignorar a transicao futura para `ibsCbs`

## O que este modulo muda no plano do SDK

Depois desta etapa, o pacote ja deveria apontar para uma base como:

- `invoices/types.ts`
- `invoices/status.ts`
- `invoices/taxes.ts`
- `invoices/fiscal-info.ts`
- `invoices/service-catalog.ts`
- `invoices/service.ts`

Com responsabilidades claras:

- `types.ts` para entidade principal de nota
- `status.ts` para enums e compatibilidade entre referencia e guias
- `taxes.ts` para o contrato fiscal atual e a transicao futura de IBS/CBS
- `fiscal-info.ts` para configuracao da conta e upload de certificado
- `service-catalog.ts` para servicos municipais e codigos tributarios
- `service.ts` para create, list, get, update, authorize e cancel

Esse modulo tambem consolida cinco regras de desenho:

- notas fiscais dependem de configuracao previa da conta
- o modulo precisa combinar `fiscalInfo` e `invoices`
- a emissao e assincrona e deve conviver com webhook
- update nao compartilha o mesmo shape de create
- a reforma tributaria exige tipos preparados para convivio entre contrato atual e contrato futuro

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- guias de introducao, configuracao fiscal e emissao de notas
- guia de adequacao a Reforma Tributaria
- webhook para notas fiscais
- tabela de capacidades testaveis em sandbox
- referencias de `municipalOptions`, `fiscalInfo`, `nationalPortal`, `services`, `taxSituationCodes` e `invoices`
- breaking changes e changelog ligados ao portal nacional

### Quais capacidades reais isso mostra?

- o Asaas emite NFS-e vinculada a cobrancas, parcelamentos ou clientes
- a conta precisa ser configurada antes da emissao
- a prefeitura define quais credenciais e campos fiscais sao necessarios
- o Portal Nacional altera o fluxo de servicos municipais
- a nota pode ser agendada, emitida antecipadamente e cancelada
- a API ja esta em transicao por causa de IBS e CBS

### Como isso deve virar API publica no SDK?

- com um modulo unico de notas fiscais
- com `fiscalInfo` como subservico
- com suporte a multipart para certificado e credenciais
- com tipos separados para create, update e leitura
- com catalogos auxiliares para servicos municipais e situacoes tributarias
- com contrato de impostos tolerante ao periodo de transicao regulatoria

### O que fica fora deste corte?

- configuracao automatica de notas para assinaturas
- detalhes completos de webhook
- onboarding de conta e aprovacao fiscal
- conciliacao financeira da cobranca que originou a nota

## Fontes oficiais consultadas

- [Introducao de Notas Fiscais](https://docs.asaas.com/docs/notas-fiscais)
- [Configurar informacoes fiscais](https://docs.asaas.com/docs/configurar-informacoes-fiscais)
- [Emitindo notas fiscais de servico](https://docs.asaas.com/docs/emitindo-notas-fiscais-de-servico)
- [Adequando sua integracao a Reforma Tributaria](https://docs.asaas.com/docs/adequando-sua-integra%C3%A7%C3%A3o-%C3%A0-reforma-tribut%C3%A1ria)
- [Eventos para notas fiscais](https://docs.asaas.com/docs/webhook-para-notas-fiscais)
- [O que pode ser testado](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Listar configuracoes municipais](https://docs.asaas.com/reference/listar-configuracoes-municipais)
- [Criar e atualizar informacoes fiscais](https://docs.asaas.com/reference/criar-e-atualizar-informacoes-fiscais)
- [Recuperar informacoes fiscais](https://docs.asaas.com/reference/retrieve-tax-information)
- [Configurar portal emissor de notas fiscais](https://docs.asaas.com/reference/configurar-portal-emissor-de-notas-fiscais)
- [List municipal services](https://docs.asaas.com/reference/list-municipal-services)
- [Listar codigos de situacoes tributarias](https://docs.asaas.com/reference/listar-codigos-de-situacoes-tributarias)
- [Agendar nota fiscal](https://docs.asaas.com/reference/agendar-nota-fiscal)
- [List invoices](https://docs.asaas.com/reference/list-invoices)
- [Retrieve a single invoice](https://docs.asaas.com/reference/retrieve-a-single-invoice)
- [Atualizar nota fiscal](https://docs.asaas.com/reference/atualizar-nota-fiscal)
- [Emitir uma nota fiscal](https://docs.asaas.com/reference/emitir-uma-nota-fiscal)
- [Cancelar uma nota fiscal](https://docs.asaas.com/reference/cancelar-uma-nota-fiscal)
- [Endpoint para configurar portal emissor de notas fiscais](https://docs.asaas.com/changelog/endpoint-para-configurar-portal-emissor-de-notas-fiscais)
- [Breaking changes](https://docs.asaas.com/page/breaking-changes)
