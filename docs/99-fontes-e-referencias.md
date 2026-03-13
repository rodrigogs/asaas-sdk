# Fontes e referencias

> Data de revisao: 13 de marco de 2026

## Objetivo

Consolidar as fontes oficiais usadas nos modulos do SDK `@repo/asaas`, registrar a hierarquia de confianca entre tipos de fonte e deixar um inventario reutilizavel para futuras etapas de implementacao e manutencao.

Este arquivo cobre:

- quais tipos de fonte oficial do Asaas entraram no trabalho de documentacao
- qual prioridade cada tipo de fonte deve ter quando houver conflito
- qual nivel de confianca cada modulo terminou tendo
- quais links oficiais foram usados em cada modulo
- quais riscos de manutencao continuam valendo para o SDK

Sem este fechamento, a documentacao modular fica util para leitura, mas fraca como base de manutencao e auditoria de fonte.

## Estrutura oficial do portal observada nesta revisao

A estrutura publica atual do portal do Asaas continua separando a informacao em quatro classes que importam para o SDK:

- guias funcionais em `/docs/`, onde o produto explica fluxo, regras de negocio, exemplos operacionais e catalogos de eventos
- referencia de API em `/reference/`, onde o contrato HTTP publicado fica mais explicito
- changelog em `/changelog/`, onde mudancas recentes, novos campos e mudancas de comportamento aparecem antes de serem absorvidas em todos os guias
- breaking changes em `/page/breaking-changes`, que precisam ser tratados como fonte obrigatoria para dominios sujeitos a mudancas de contrato

Para este trabalho, os itens de suporte, collections, FAQ, MCP Server e plugins continuaram fora do corte como superficie primaria do SDK. Eles podem apoiar investigacao, mas nao definem contrato publico do pacote.

## Hierarquia de confianca recomendada

Quando houver conflito entre fontes oficiais do Asaas, a ordem recomendada para o SDK e:

1. a referencia de API publicada em `/reference/`, quando o assunto e shape de request, response, path, query params e permissoes
2. os guias em `/docs/`, quando o assunto e fluxo operacional, semantica de negocio, eventos e regras de uso
3. o changelog e a pagina de breaking changes, quando houver indicio de mudanca recente ainda nao absorvida pelo restante da documentacao
4. o portal raiz e materiais de SDKs oficiais, quando servirem apenas como contexto de produto e navegacao, nao como contrato

Isso resume a regra pratica que guiou os modulos anteriores:

- nao inventar campo so porque ele aparece num exemplo isolado
- nao ignorar guia funcional quando a referencia nao explica o comportamento real
- sempre considerar changelog e breaking changes em dominios com sinais de evolucao recente

## Cobertura quantitativa desta base

No fechamento desta pasta, a base consolidada usa 266 URLs oficiais unicas.

- guias em `/docs/`: 113
- referencia em `/reference/`: 141
- changelog: 10
- breaking changes: 1
- portal raiz: 1

A distribuicao confirma um padrao importante do Asaas:

- a referencia cobre grande parte da superficie HTTP
- os guias continuam essenciais para entender fluxo, status, eventos, limites de sandbox e regras operacionais
- changelog e breaking changes so aparecem em alguns dominios, mas nesses dominios sao obrigatorios

## Confianca por modulo

- `00-visao-geral.md`: Media. Modulo de orientacao. Baseado principalmente em guias e no portal raiz, sem referencia operacional propria.
- `01-fundacoes-http-seguranca-e-ambientes.md`: Media-alta. Boa base oficial, mas com dependencia de guias transversais e exemplos de comportamento operacional.
- `02-clientes.md`: Alta. Dominio simples e bem coberto pela referencia principal de customers.
- `03-cobrancas.md`: Media. Cobertura extensa, mas com divergencias recorrentes entre guias, referencia e enums de runtime.
- `04-pix.md`: Media. Dominio distribuido entre cobrancas, chaves, transacoes e produtos novos como Pix Automatico.
- `05-assinaturas.md`: Media-alta. Referencia principal razoavel, com algumas divergencias pontuais entre requests e respostas.
- `06-webhooks.md`: Media. Modulo depende fortemente de guias, catalogos de eventos, changelog e breaking changes.
- `07-notas-fiscais.md`: Media. Dominio sujeito a mudancas tributarias e a desalinhamentos entre guias, schema e breaking changes.
- `08-transferencias.md`: Media. Boa cobertura funcional, mas com forte peso de regras operacionais e changelog.
- `09-subcontas.md`: Media-alta. Cobertura ampla e relativamente estavel, com variacoes de onboarding e white label.
- `10-links-de-pagamento-e-checkout.md`: Media. Payment links sao bem documentados; checkout ainda depende de guias e resposta incompleta em alguns pontos.
- `11-split-e-antecipacoes.md`: Media. Split e transversal e antecipacao tem partes operacionais dispersas entre referencia e guias.
- `12-notificacoes.md`: Media-alta. Dominio pequeno e bem delimitado, com divergencia principal restrita ao verbo HTTP do update.
- `13-pague-contas-e-escrow.md`: Media-alta. Superficie objetiva, com boa referencia principal e apoio funcional em guias de operacao.

## Observacoes de manutencao da base de fontes

- o portal do Asaas mistura portugues e ingles em slugs e titulos, entao o SDK nao deve depender de naming uniforme para deduzir contrato
- alguns guias sao renomeados ou movidos ao longo do tempo; por isso este arquivo precisa ser tratado como inventario vivo
- em varios dominios os enums e estados aparecem primeiro em exemplos, eventos ou changelog, e nao num schema centralizado
- webhooks, notas fiscais, transferencias, checkout e recursos novos exigem revisita periodica ao changelog e a breaking changes antes de mudancas maiores no SDK
- algumas paginas do portal podem responder lentamente em validacoes automatizadas em lote; timeouts curtos podem gerar falso negativo
- FAQ e materiais de suporte podem apontar para comportamento real, mas so devem reforcar decisoes ja sustentadas por guia, referencia ou changelog

## Fontes oficiais por modulo

### `00-visao-geral.md`

- [Introducao](https://docs.asaas.com/docs/visao-geral)
- [Portal para desenvolvedores do Asaas](https://docs.asaas.com/)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Criar novo Webhook pela API](https://docs.asaas.com/docs/create-new-webhook-via-api)
- [Criar novo Webhook pela aplicacao web](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)
- [Java SDK](https://docs.asaas.com/docs/java)

### `01-fundacoes-http-seguranca-e-ambientes.md`

- [Authentication](https://docs.asaas.com/docs/authentication-2)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Sandbox](https://docs.asaas.com/docs/sandbox)
- [How to set up your account in the Sandbox](https://docs.asaas.com/docs/how-to-set-up-your-account-in-the-sandbox-1)
- [O que pode ser testado?](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Limites da API](https://docs.asaas.com/docs/duvidas-frequentes-limites-da-api)
- [Additional Security Mechanisms](https://docs.asaas.com/docs/additional-security-mechanisms)
- [Whitelist de IPs](https://docs.asaas.com/docs/whitelist-de-ips)
- [Mecanismo para validacao de saque via webhooks](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [Official Asaas IPs](https://docs.asaas.com/docs/official-asaas-ips)
- [List payments](https://docs.asaas.com/reference/list-payments)
- [Alterando notificacoes de um cliente](https://docs.asaas.com/docs/alterando-notificacoes-de-um-cliente)

### `02-clientes.md`

- [Creating customers](https://docs.asaas.com/docs/creating-customers)
- [Create new customer](https://docs.asaas.com/reference/create-new-customer)
- [List customers](https://docs.asaas.com/reference/list-customers)
- [Retrieve a single customer](https://docs.asaas.com/reference/retrieve-a-single-customer)
- [Update existing customer](https://docs.asaas.com/reference/update-existing-customer)
- [Remove customer](https://docs.asaas.com/reference/remove-customer)
- [Restore removed customer](https://docs.asaas.com/reference/restore-removed-customer)
- [Retrieve notifications from a customer](https://docs.asaas.com/reference/retrieve-notifications-from-a-customer)
- [Default notifications](https://docs.asaas.com/docs/default-notifications)
- [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client)

### `03-cobrancas.md`

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

### `04-pix.md`

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

### `05-assinaturas.md`

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

### `06-webhooks.md`

- [Sobre os Webhooks](https://docs.asaas.com/docs/sobre-os-webhooks)
- [Criar novo Webhook pela aplicacao web](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)
- [Criar novo Webhook pela API](https://docs.asaas.com/docs/criar-novo-webhook-pela-api)
- [Tipos de envio](https://docs.asaas.com/docs/tipos-de-envio)
- [Receba eventos do Asaas no seu endpoint de Webhook](https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook)
- [Como implementar idempotencia em Webhooks](https://docs.asaas.com/docs/como-implementar-idempotencia-em-webhooks)
- [Polling vs Webhooks](https://docs.asaas.com/docs/polling-vs-webhooks)
- [Fila pausada](https://docs.asaas.com/docs/fila-pausada)
- [Penalizacao de filas](https://docs.asaas.com/docs/penaliza%C3%A7%C3%A3o-de-filas)
- [Como reativar fila interrompida](https://docs.asaas.com/docs/como-reativar-fila-interrompida)
- [Logs de Webhooks](https://docs.asaas.com/docs/logs-de-webhooks)
- [Erro 408 - Read Timed Out](https://docs.asaas.com/docs/erro-read-timed-out)
- [Webhook para cobrancas](https://docs.asaas.com/docs/webhook-para-cobrancas)
- [Eventos para assinaturas](https://docs.asaas.com/docs/eventos-para-assinaturas)
- [Webhook para notas fiscais](https://docs.asaas.com/docs/webhook-para-notas-fiscais)
- [Webhook para transferencias](https://docs.asaas.com/docs/webhook-para-transferencias)
- [Webhook para pague contas](https://docs.asaas.com/docs/webhook-para-pague-contas)
- [Webhook para antecipacoes](https://docs.asaas.com/docs/webhook-para-antecipacoes)
- [Webhook para recargas de celular](https://docs.asaas.com/docs/webhook-para-recargas-de-celular)
- [Webhook para verificar situacao da conta](https://docs.asaas.com/docs/webhook-para-verificar-situacao-da-conta)
- [Eventos para bloqueios de saldo](https://docs.asaas.com/docs/eventos-para-bloqueios-de-saldo)
- [Eventos para checkout](https://docs.asaas.com/docs/eventos-para-checkout)
- [Eventos para movimentacoes internas](https://docs.asaas.com/docs/eventos-para-movimenta%C3%A7%C3%B5es-internas)
- [Eventos para chaves de API](https://docs.asaas.com/docs/eventos-para-chaves-de-api)
- [Eventos para Pix automatico](https://docs.asaas.com/docs/eventos-para-pix-autom%C3%A1tico)
- [Create new Webhook](https://docs.asaas.com/reference/create-new-webhook)
- [List Webhooks](https://docs.asaas.com/reference/list-webhooks)
- [Retrieve a single Webhook](https://docs.asaas.com/reference/retrieve-a-single-webhook)
- [Update existing Webhook](https://docs.asaas.com/reference/update-existing-webhook)
- [Remove Webhook](https://docs.asaas.com/reference/remove-webhook)
- [Remove webhook backoff](https://docs.asaas.com/reference/remove-webhook-backoff)
- [Obrigatoriedade e auto-geracao de tokens para Webhooks](https://docs.asaas.com/changelog/obrigatoriedade-e-auto-gera%C3%A7%C3%A3o-de-tokens-para-webhooks)
- [Validacao de complexidade em tokens de Webhook](https://docs.asaas.com/changelog/valida%C3%A7%C3%A3o-de-complexidade-em-tokens-de-webhook)
- [Inclusao de campo com ID do evento em envios de Webhooks](https://docs.asaas.com/changelog/inclus%C3%A3o-de-campo-com-id-do-evento-em-envios-de-webhooks)
- [Campo dateCreated em objetos de Webhooks](https://docs.asaas.com/changelog/campo-datecreated-em-objetos-de-webhooks)
- [Identificacao da origem da conta em Webhooks V3](https://docs.asaas.com/changelog/identifica%C3%A7%C3%A3o-da-origem-da-conta-em-webhooks-v3)
- [Breaking changes](https://docs.asaas.com/page/breaking-changes)
- [Assinaturas](https://docs.asaas.com/docs/assinaturas)

### `07-notas-fiscais.md`

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

### `08-transferencias.md`

- [Overview](https://docs.asaas.com/docs/transfers-overview)
- [Transferencia para conta Asaas](https://docs.asaas.com/docs/transferencia-para-conta-asaas)
- [Transferencia para contas de outra instituicao (Pix / TED)](https://docs.asaas.com/docs/transferencia-para-contas-de-outra-instituicao-pix-ted)
- [Pix Recorrente](https://docs.asaas.com/docs/pix-recorrente)
- [Eventos para transferencias](https://docs.asaas.com/docs/webhook-para-transferencias)
- [Testando transferencias](https://docs.asaas.com/docs/testando-transfer%C3%AAncias)
- [O que pode ser testado?](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Whitelist de IPs](https://docs.asaas.com/docs/whitelist-de-ips)
- [Mecanismo para validacao de saque via webhooks](https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks)
- [Duvidas frequentes sobre seguranca](https://docs.asaas.com/docs/duvidas-frequentes-seguranca)
- [Transferir para conta de outra Instituicao ou chave Pix](https://docs.asaas.com/reference/transferir-para-conta-de-outra-instituicao-ou-chave-pix)
- [Transferir para conta Asaas](https://docs.asaas.com/reference/transferir-para-conta-asaas)
- [Listar transferencias](https://docs.asaas.com/reference/listar-transferencias)
- [Recuperar uma unica transferencia](https://docs.asaas.com/reference/recuperar-uma-unica-transferencia)
- [Cancelar uma transferencia](https://docs.asaas.com/reference/cancelar-uma-transfer%C3%AAncia)
- [Recuperar WalletId](https://docs.asaas.com/reference/recuperar-walletid)
- [Inclusao de atributo para definir referencia externa em transferencias](https://docs.asaas.com/changelog/novo-campo-de-refer%C3%AAncia-externa-no-endpoint-de-transfer%C3%AAncias)
- [TEDs apos as 15h serao agendados para o proximo dia](https://docs.asaas.com/changelog/teds-ap%C3%B3s-%C3%A0s-15h-ser%C3%A3o-agendados-para-o-pr%C3%B3ximo-dia)
- [Automacao de saques para IPs autorizados](https://docs.asaas.com/changelog/automa%C3%A7%C3%A3o-de-saques-para-ips-autorizados)

### `09-subcontas.md`

- [Creating subaccounts](https://docs.asaas.com/docs/creating-subaccounts)
- [Creating Whitelabel subaccounts](https://docs.asaas.com/docs/creating-whitelabel-subaccounts)
- [White label](https://docs.asaas.com/docs/about-white-label)
- [Managing sub-account API keys](https://docs.asaas.com/docs/sub-account-api-key-management)
- [Detailed Subaccount Approval Flow](https://docs.asaas.com/docs/detailed-subaccount-approval-flow)
- [Onboarding and sending documents via link](https://docs.asaas.com/docs/onboarding-and-sending-documents-via-link)
- [Annual Business Data Confirmation for Subaccounts](https://docs.asaas.com/docs/annual-business-data-confirmation-for-subaccounts)
- [Approval of accounts](https://docs.asaas.com/docs/approval-of-accounts)
- [Authentication](https://docs.asaas.com/docs/authentication-2)
- [Create subaccount](https://docs.asaas.com/reference/create-subaccount)
- [Listar subcontas](https://docs.asaas.com/reference/listar-subcontas)
- [Retrieve a single subaccount](https://docs.asaas.com/reference/retrieve-a-single-subaccount)
- [Listar chaves de API de uma subconta](https://docs.asaas.com/reference/listar-chaves-de-api-de-uma-subconta)
- [Criar chave de API para uma subconta](https://docs.asaas.com/reference/criar-chave-de-api-para-uma-subconta)
- [Atualizar chave de API de uma subconta](https://docs.asaas.com/reference/atualizar-chave-de-api-de-uma-subconta)
- [Excluir chave de API de uma subconta](https://docs.asaas.com/reference/excluir-chave-de-api-de-uma-subconta)
- [Check pending documents](https://docs.asaas.com/reference/check-pending-documents)
- [Send documents](https://docs.asaas.com/reference/send-documents)
- [View document sent](https://docs.asaas.com/reference/view-document-sent)
- [Update sent document](https://docs.asaas.com/reference/update-sent-document)
- [Remove sent document](https://docs.asaas.com/reference/remove-sent-document)
- [Check account registration status](https://docs.asaas.com/reference/check-account-registration-status)
- [Retrieve business data](https://docs.asaas.com/reference/retrieve-business-data)
- [Update business data](https://docs.asaas.com/reference/update-business-data)
- [Delete White Label subaccount](https://docs.asaas.com/reference/delete-white-label-subaccount)

### `10-links-de-pagamento-e-checkout.md`

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

### `11-split-e-antecipacoes.md`

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

### `12-notificacoes.md`

- [Default notifications](https://docs.asaas.com/docs/default-notifications)
- [Changing notifications of a client](https://docs.asaas.com/docs/changing-notifications-of-a-client)
- [Notifications FAQ](https://docs.asaas.com/docs/notifications-1)
- [Payments](https://docs.asaas.com/docs/payments-1)
- [O que pode ser testado](https://docs.asaas.com/docs/o-que-pode-ser-testado)
- [Create new customer](https://docs.asaas.com/reference/create-new-customer)
- [Update existing customer](https://docs.asaas.com/reference/update-existing-customer)
- [Retrieve notifications from a customer](https://docs.asaas.com/reference/retrieve-notifications-from-a-customer)
- [Update existing notification](https://docs.asaas.com/reference/update-existing-notification)
- [Update existing notifications in batch](https://docs.asaas.com/reference/update-existing-notifications-in-batch)

### `13-pague-contas-e-escrow.md`

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

## O que este modulo fecha no plano do SDK

1. fecha o inventario de fontes que sustenta os 14 modulos anteriores
2. deixa explicita a prioridade entre referencia, guias e changelog para a futura implementacao do pacote
3. da uma base objetiva para revisao periodica de links quebrados e mudancas de escopo no portal do Asaas
4. encerra a etapa de documentacao inicial do SDK `@repo/asaas`

## Perguntas que este modulo responde

- Quais fontes oficiais do Asaas sustentaram cada modulo do SDK?
- Quando priorizar referencia, guia, changelog ou breaking changes?
- Quais dominios terminaram com confianca mais alta ou mais sensivel a mudancas?
- Como revisar essa base de fontes sem recomecar a pesquisa do zero?
