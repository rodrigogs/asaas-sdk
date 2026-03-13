# Visao Geral do SDK Asaas

> Data de revisao: 12 de marco de 2026

## Resumo executivo

O Asaas expoe uma plataforma financeira relativamente ampla por API.

Na documentacao oficial, a plataforma nao aparece so como "cobrancas". Ela cobre tambem:

- clientes
- cobrancas
- Pix
- assinaturas
- links de pagamento
- checkout hospedado
- split
- antecipacoes
- notificacoes
- webhooks
- transferencias
- notas fiscais de servico
- subcontas
- pague contas
- escrow

O pacote `@repo/asaas` ainda nao representa esse escopo.

Hoje ele e apenas uma fundacao HTTP pequena:

- `asaasRequest`
- `fetchAsaasBinary`
- algumas constantes
- alguns tipos basicos

A direcao correta para o pacote nao e crescer como um conjunto solto de helpers.

A direcao correta e transforma-lo em um SDK TypeScript modular, tipado e orientado aos dominios oficiais da API.

## O que a documentacao oficial do Asaas mostra

A visao geral oficial posiciona o Asaas como uma API para automatizar cobranca, recebimento e pagamento com diferentes meios, incluindo Pix, boleto, cartao e TED. A mesma pagina tambem destaca funcionalidades complementares como notificacoes automaticas, link de pagamento, split, assinaturas, cofre de cartao, antecipacao de recebiveis e webhooks.

O mapa oficial da documentacao tambem deixa claro que a superficie real da plataforma esta organizada em grandes blocos:

- seguranca e autenticacao
- sandbox
- cobrancas
- Pix e Pix automatico
- assinaturas
- links de pagamento
- checkout
- split
- antecipacoes
- notificacoes
- webhooks
- transferencias
- notas fiscais
- subcontas
- pague contas
- conta escrow

Por fim, a propria documentacao oficial do SDK Java confirma um padrao util para o nosso desenho: o provider organiza a integracao por servicos de dominio, e nao por um unico cliente generico gigante.

## O que isso significa para o pacote `@repo/asaas`

O pacote precisa virar uma camada publica de integracao com quatro caracteristicas centrais:

1. configuracao unica de ambiente e autenticacao
2. clientes ou servicos separados por dominio funcional
3. contratos TypeScript explicitos para requests, responses, erros e eventos
4. utilitarios transversais para webhooks, paginacao, binary downloads e comportamento de rede

Em termos praticos, isso significa sair deste modelo:

```ts
await asaasRequest({ path: '/customers', method: 'POST', body })
```

para algo mais proximo disto:

```ts
const asaas = createAsaasSdk({
  accessToken: process.env.ASAAS_ACCESS_TOKEN!,
  environment: 'SANDBOX',
})

await asaas.customers.create({
  name: 'PitStop',
  email: 'financeiro@example.com',
})
```

O helper HTTP continua existindo, mas deixa de ser a API principal do pacote.

## Escopo recomendado do SDK

### O que deve entrar

- configuracao de ambiente `SANDBOX` e `PRODUCTION`
- autenticacao por API key
- tratamento consistente de erros HTTP e erros de negocio do Asaas
- modulos publicos por dominio
- contratos tipados para webhooks
- suporte a conta principal e subcontas
- downloads binarios quando a API expuser arquivos

### O que nao deve entrar como superficie principal

- tutoriais de plugins de ecommerce
- integracoes no-code de parceiros
- FAQ como API publica
- detalhes de suporte comercial
- regras de negocio especificas do PitStop

Esses itens continuam relevantes como referencia operacional, mas nao definem a API do pacote.

## Principios de design recomendados

### 1. SDK orientado a dominio

Cada area principal do Asaas deve ser representada por um modulo proprio, por exemplo:

- `customers`
- `payments`
- `pix`
- `subscriptions`
- `webhooks`
- `invoices`
- `transfers`
- `subaccounts`

### 2. Core pequeno e reutilizavel

O nucleo compartilhado do pacote deve cuidar apenas do que e transversal:

- configuracao
- autenticacao
- ambiente
- transporte HTTP
- serializacao
- erros
- paginacao
- headers comuns

### 3. Tipos explicitos, sem esconder a API real

O SDK nao deve inventar um dominio paralelo ao do Asaas.

Ele deve:

- refletir os recursos oficiais com nomes previsiveis
- encapsular detalhes repetitivos de HTTP
- preservar a semantica oficial dos payloads e status

### 4. Webhooks como parte de primeira classe

Pela propria documentacao oficial, webhooks nao sao acessorios. Eles fazem parte do fluxo normal de integracao.

O SDK precisa prever:

- gestao de webhooks
- tipos de eventos
- helpers de autenticacao do header `asaas-access-token`
- utilitarios de parsing e validacao basica

### 5. Sandbox como ambiente obrigatorio de desenvolvimento

A documentacao oficial reforca o uso de Sandbox durante o desenvolvimento e validacao. O SDK deve tratar isso como configuracao de primeira classe, nao como detalhe opcional.

## Estrutura recomendada de alto nivel

Uma estrutura inicial coerente para o pacote e:

```txt
packages/asaas/src/
  core/
    config.ts
    auth.ts
    client.ts
    errors.ts
    pagination.ts
    webhooks.ts
  customers/
    types.ts
    service.ts
  payments/
    types.ts
    service.ts
  pix/
    types.ts
    service.ts
  subscriptions/
    types.ts
    service.ts
  webhooks/
    types.ts
    service.ts
  invoices/
    types.ts
    service.ts
  transfers/
    types.ts
    service.ts
  subaccounts/
    types.ts
    service.ts
  index.ts
```

Isso nao e schema final.

E apenas a direcao arquitetural recomendada para evitar que o pacote cresca em torno de um unico arquivo generico de requests.

## Consequencias praticas para a execucao desta pasta

Depois desta visao geral, a ordem natural de documentacao continua sendo:

1. fundacoes HTTP, seguranca e ambientes
2. clientes
3. cobrancas
4. Pix
5. assinaturas
6. webhooks
7. notas fiscais
8. transferencias
9. subcontas
10. links de pagamento e checkout
11. split e antecipacoes
12. notificacoes
13. pague contas e escrow

## Perguntas que este modulo responde

### Qual parte oficial foi pesquisada?

- visao geral do portal e da documentacao de guias
- autenticacao e chaves de API
- webhooks
- SDK Java oficial

### Quais capacidades reais isso mostra?

- o Asaas cobre varios dominios alem de cobrancas
- Sandbox e producao sao ambientes separados de primeira classe
- webhooks fazem parte do fluxo normal da plataforma
- existe precedente oficial para um SDK modular por servicos

### Como isso deve virar API publica no SDK?

- com um core pequeno
- com modulos por dominio
- com contratos tipados por recurso
- com configuracao centralizada por ambiente e credencial

### O que fica fora deste corte?

- plugins e parceiros
- no-code tools
- guias operacionais que nao geram API publica

## Fontes oficiais consultadas

- [Introducao](https://docs.asaas.com/docs/visao-geral)
- [Portal para desenvolvedores do Asaas](https://docs.asaas.com/)
- [Chaves de API](https://docs.asaas.com/docs/chaves-de-api)
- [Criar novo Webhook pela API](https://docs.asaas.com/docs/create-new-webhook-via-api)
- [Criar novo Webhook pela aplicacao web](https://docs.asaas.com/docs/criar-novo-webhook-pela-aplicacao-web)
- [Java SDK](https://docs.asaas.com/docs/java)
