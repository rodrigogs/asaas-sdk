# Paginação

A API do Asaas utiliza paginação baseada em offset para endpoints que retornam listas de recursos. Este guia explica como trabalhar com respostas paginadas no `asaas-sdk`.

## Como a Paginação Funciona

A API do Asaas usa paginação baseada em offset. Todos os métodos `.list()` aceitam parâmetros opcionais `offset` e `limit` e retornam um `PaginatedList<T>`.

O offset indica a posição inicial (quantos itens pular) e o limit controla quantos itens retornar por página.

## PaginatedList\<T\>

Esta classe encapsula a resposta paginada da API. Implementa `AsyncIterable<T>` para busca automática de páginas.

### Propriedades

- `data` (T[]) - Array contendo os itens da página atual (ou primeira página)
- `hasMore` (boolean) - Indica se existem mais páginas disponíveis
- `totalCount` (number) - Número total de itens em todas as páginas

### Estrutura da Resposta da API

A resposta bruta da API tem o formato `PaginatedResponse<T>`:

```typescript
interface PaginatedResponse<T> {
  object: string
  hasMore: boolean
  totalCount: number
  offset: number
  limit: number
  data: T[]
}
```

O `PaginatedList<T>` encapsula essa resposta e adiciona funcionalidades de iteração automática.

## Uso Básico

Listar recursos com paginação padrão:

```typescript
const result = await asaas.customers.list()

console.log(result.data)        // primeira página de clientes
console.log(result.totalCount)  // total em todas as páginas
console.log(result.hasMore)     // true se existem mais páginas
```

Neste exemplo, a API retorna a primeira página usando os valores padrão de `offset` e `limit` do endpoint.

## Paginação Manual

Você pode controlar manualmente a navegação entre páginas usando os parâmetros `offset` e `limit`:

```typescript
// Primeira página: 10 itens começando do início
const pagina1 = await asaas.customers.list({ limit: 10, offset: 0 })

// Segunda página: 10 itens começando do item 10
const pagina2 = await asaas.customers.list({ limit: 10, offset: 10 })

// Terceira página: 10 itens começando do item 20
const pagina3 = await asaas.customers.list({ limit: 10, offset: 20 })
```

Esta abordagem é útil quando você precisa implementar navegação customizada (botões "Anterior"/"Próximo", por exemplo).

## Auto-Paginação com for-await

A funcionalidade principal do `PaginatedList<T>` é a implementação de `AsyncIterable`, que permite iterar sobre TODOS os itens de TODAS as páginas automaticamente:

```typescript
const customers = await asaas.customers.list({ limit: 50 })

for await (const customer of customers) {
  console.log(customer.name)
  // Busca próximas páginas automaticamente conforme necessário
}
```

### Como Funciona

- A primeira página é buscada imediatamente quando `.list()` é chamado
- Páginas subsequentes são buscadas sob demanda conforme você itera
- O mesmo `limit` usado na requisição inicial é usado para buscar páginas subsequentes
- O iterador respeita backpressure: páginas só são buscadas quando a anterior é consumida

Este é o método recomendado para processar grandes volumes de dados, pois:

- Não carrega todos os itens na memória de uma vez
- Permite processar itens conforme chegam
- Busca páginas apenas quando necessário

## Coletando Todos os Itens com toArray()

Se você precisa de todos os itens em um array, use o método `toArray()`:

```typescript
const todosClientes = await asaas.customers.list().then(r => r.toArray())

// Agora todosClientes é um array simples com todos os itens
console.log(`Total de clientes: ${todosClientes.length}`)
```

### Limite de Segurança

Para evitar consumo excessivo de memória, `toArray()` possui um limite de segurança padrão de 10.000 itens:

```typescript
// Busca até 10.000 itens (padrão)
const todos = await result.toArray()

// Limite customizado: busca apenas os primeiros 500 itens
const primeiros500 = await result.toArray({ limit: 500 })
```

Se o total de itens exceder o limite, `toArray()` lançará um erro. Use `for await...of` para processar grandes volumes.

## Uso com Filtros

Métodos de listagem aceitam filtros específicos do domínio junto com parâmetros de paginação. Exemplo com cobranças:

```typescript
const cobrancasVencidas = await asaas.payments.list({
  status: 'OVERDUE',
  dueDate: { ge: '2024-01-01', le: '2024-12-31' },
  limit: 100,
})

// Processar todas as cobranças vencidas no período
for await (const cobranca of cobrancasVencidas) {
  console.log(`Cobrança ${cobranca.id}: R$ ${cobranca.value}`)
}
```

Os filtros são aplicados em todas as páginas automaticamente. Você não precisa passá-los novamente ao buscar páginas subsequentes.

## Exemplos Práticos

### Exportar Todos os Clientes

```typescript
const clientes = await asaas.customers.list({ limit: 100 })
const todosClientes = await clientes.toArray()

// Exportar para CSV, JSON, etc.
exportarParaCSV(todosClientes)
```

### Processar Cobranças em Lote

```typescript
const cobrancas = await asaas.payments.list({
  status: 'PENDING',
  limit: 50,
})

for await (const cobranca of cobrancas) {
  await processarCobranca(cobranca)
  // Busca próxima página quando necessário
}
```

### Implementar Navegação Customizada

```typescript
let offset = 0
const limit = 20

function buscarPagina(offset: number) {
  return asaas.customers.list({ offset, limit })
}

// Primeira página
const pagina = await buscarPagina(offset)

// Botão "Próxima"
if (pagina.hasMore) {
  offset += limit
  const proximaPagina = await buscarPagina(offset)
}

// Botão "Anterior"
if (offset > 0) {
  offset -= limit
  const paginaAnterior = await buscarPagina(offset)
}
```

### Buscar com Limite de Segurança

```typescript
// Buscar no máximo 1000 assinaturas
const assinaturas = await asaas.subscriptions.list({ limit: 100 })
const primeiras1000 = await assinaturas.toArray({ limit: 1000 })

console.log(`Processando ${primeiras1000.length} assinaturas`)
```

## Dicas e Boas Práticas

- **Use `limit` adequadamente**: Controle o tamanho da página de acordo com sua necessidade. Valores muito altos podem causar timeouts; valores muito baixos resultam em muitas requisições.

- **Respeite o limite de `toArray()`**: O limite padrão de 10.000 itens existe para evitar consumo excessivo de memória. Se você precisa processar mais itens, use `for await...of`.

- **Prefira iteração para grandes volumes**: Para processar grandes quantidades de dados, sempre prefira `for await...of` em vez de `toArray()`. Isso permite processar itens conforme chegam, sem carregar tudo na memória.

- **Os filtros são mantidos**: Quando você itera sobre um `PaginatedList`, os filtros da requisição inicial são aplicados automaticamente em todas as páginas subsequentes.

- **Backpressure automático**: O iterador assíncrono só busca a próxima página quando você terminar de processar a anterior. Isso evita requisições desnecessárias e controla o uso de memória.

- **Valor padrão do limit varia**: O valor padrão de `limit` varia por endpoint da API do Asaas. Consulte a documentação da API para conhecer o padrão de cada recurso.

## Resumo

```typescript
// ✅ Recomendado: Auto-paginação para processar todos os itens
for await (const item of await asaas.customers.list()) {
  processar(item)
}

// ✅ Bom: Coletar todos em array com limite de segurança
const items = await asaas.customers.list().then(r => r.toArray({ limit: 1000 }))

// ✅ Bom: Paginação manual para navegação customizada
const pagina = await asaas.customers.list({ offset: 0, limit: 20 })

// ⚠️ Cuidado: toArray() sem limite pode consumir muita memória
const todos = await asaas.customers.list().then(r => r.toArray())
```
