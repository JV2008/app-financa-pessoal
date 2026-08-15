# MVP — App de Finanças Pessoais

Criar o MVP do web app de gestão financeira pessoal conforme definido em [PROJECT_CONTEXT.md](file:///c:/Users/joaov/Desktop/Gerenciador%20Contas/PROJECT_CONTEXT.md).

**Escopo do MVP**: 1 conta, transações (receita/despesa), gráfico de gastos mensais, dashboard com saldo calculado.

---

## User Review Required

> [!IMPORTANT]
> **Tailwind CSS**: O `PROJECT_CONTEXT.md` define Tailwind CSS como ferramenta de estilo. Vou usar **Tailwind CSS v4** (já incluído no `create-next-app` mais recente). Confirme se deseja outra versão.

> [!IMPORTANT]
> **Banco de dados (Neon)**: Para o MVP funcionar end-to-end, será necessário uma connection string do Neon PostgreSQL. Podemos iniciar o desenvolvimento com o schema SQL e as queries prontas, e conectar ao Neon quando você tiver a URL configurada via variável de ambiente.

> [!IMPORTANT]
> **Autenticação**: O MVP usará Auth.js (NextAuth v5) com **Credentials Provider** (email + senha com bcrypt). Login via Google/GitHub pode ser adicionado depois. Está de acordo?

---

## Open Questions

> [!IMPORTANT]
> **Categorias no MVP**: O roadmap diz "categorias customizáveis" na V1, mas o MVP precisa de categorias para classificar transações. Minha proposta: criar **categorias pré-definidas** (seed) no MVP — Alimentação, Transporte, Moradia, Lazer, Saúde, Educação, Salário, Freelance, Outros. O usuário não poderá criar/editar categorias no MVP. Concorda?

> [!IMPORTANT]  
> **Idioma da UI**: A interface será em **Português (pt-BR)**? Ou prefere inglês?

> [!IMPORTANT]
> **Moeda**: Vou assumir **BRL (R$)** como moeda padrão. Correto?

---

## Proposed Changes

A implementação será dividida em **6 fases incrementais**, cada uma validável independentemente.

---

### Fase 1 — Scaffold do Projeto

Inicializar o projeto Next.js com a stack definida.

#### [NEW] Scaffold Next.js
- `npx create-next-app@latest ./` com TypeScript, Tailwind CSS, App Router, ESLint
- Instalar dependências: `@neondatabase/serverless`, `bcryptjs`, `next-auth@beta`, `recharts`, `@upstash/ratelimit`, `@upstash/redis`
- Configurar `tsconfig.json` com path aliases (`@/`)

#### [NEW] Variáveis de ambiente
- `.env.example` com todas as variáveis necessárias (sem valores reais)
- `DATABASE_URL`, `AUTH_SECRET`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

### Fase 2 — Banco de Dados

#### [NEW] `db/schema.sql`
Schema PostgreSQL normalizado:

```sql
-- users: gerenciado pelo Auth.js (tabela padrão)
-- accounts: conta financeira do usuário (1 por usuário no MVP)
-- categories: pré-definidas (seed)
-- transactions: receita/despesa vinculada a account + category
```

Tabelas planejadas:

| Tabela | Colunas principais | Notas |
|---|---|---|
| `users` | id, name, email, password_hash, created_at | Auth.js adapter |
| `accounts` | id, user_id (FK), name, type, created_at | 1 conta no MVP |
| `categories` | id, name, type (income/expense), icon | Pré-definidas |
| `transactions` | id, user_id (FK), account_id (FK), category_id (FK), type, amount, description, date, created_at | Core do app |

#### [NEW] `db/seed.sql`
- Categorias pré-definidas (Alimentação, Transporte, etc.)

#### [NEW] `lib/db.ts`
- Conexão via `@neondatabase/serverless` (pool)

#### [NEW] `lib/queries/`
- `transactions.ts` — CRUD + query de gastos mensais
- `accounts.ts` — criar/ler conta do usuário
- `categories.ts` — listar categorias

---

### Fase 3 — Autenticação

#### [NEW] `lib/auth.ts`
- Config Auth.js v5 com Credentials Provider
- Hash de senha com `bcryptjs`
- Session strategy: JWT

#### [NEW] `app/api/auth/[...nextauth]/route.ts`
- Route Handler do Auth.js

#### [NEW] `app/(auth)/login/page.tsx`
- Formulário de login (email + senha)

#### [NEW] `app/(auth)/register/page.tsx`
- Formulário de registro (nome, email, senha)
- Criação automática da conta financeira padrão ao registrar

#### [NEW] `middleware.ts`
- Proteção de rotas — redirecionar para `/login` se não autenticado

---

### Fase 4 — Componentes UI Base

#### [NEW] `components/ui/button.tsx`
- Botão reutilizável com variantes (primary, secondary, danger, ghost)

#### [NEW] `components/ui/input.tsx`
- Input com label, error state, ícones

#### [NEW] `components/ui/card.tsx`
- Card container para dashboard

#### [NEW] `components/ui/modal.tsx`
- Modal para criação/edição de transações

#### [NEW] `components/ui/sidebar.tsx`
- Sidebar de navegação (Dashboard, Transações, Conta)

#### [NEW] `components/ui/badge.tsx`
- Badge para tipo de transação (receita/despesa)

#### [NEW] `components/ui/data-table.tsx`
- Tabela para listagem de transações

---

### Fase 5 — Funcionalidades Core (API + UI)

#### [NEW] `app/api/transactions/route.ts`
- `GET` — listar transações do usuário (paginado, filtrado por mês)
- `POST` — criar transação

#### [NEW] `app/api/transactions/[id]/route.ts`
- `PUT` — editar transação
- `DELETE` — excluir transação

#### [NEW] `app/api/accounts/route.ts`
- `GET` — dados da conta do usuário
- Saldo calculado via `SUM(transactions)`

#### [NEW] `app/(dashboard)/layout.tsx`
- Layout com sidebar + header (nome do usuário, logout)

#### [NEW] `app/(dashboard)/page.tsx` — Dashboard
- Card de saldo atual (calculado)
- Card de receitas do mês
- Card de despesas do mês
- Gráfico de gastos mensais (Recharts)

#### [NEW] `app/(dashboard)/transactions/page.tsx`
- Listagem de transações com filtro por mês
- Botão "Nova Transação" → modal
- Editar / Excluir transações

#### [NEW] `app/(dashboard)/accounts/page.tsx`
- Detalhes da conta
- Histórico resumido

---

### Fase 6 — Gráficos e Polish

#### [NEW] `components/charts/monthly-expenses.tsx`
- Gráfico de barras — gastos por categoria no mês (Recharts)

#### [NEW] `components/charts/balance-summary.tsx`
- Cards resumo com ícones e cores

#### Ajustes finais
- Rate limiting nas rotas de API (Upstash)
- Loading states e error boundaries
- Responsividade mobile
- Meta tags e SEO básico

---

## Verificação

### Automated Tests
- Não incluídos no MVP inicial (podem ser adicionados na V1)
- Validação manual das rotas de API via browser

### Manual Verification
1. Registrar novo usuário → conta criada automaticamente
2. Login/logout funcional
3. Criar, editar e excluir transações
4. Dashboard mostra saldo correto (calculado)
5. Gráfico de gastos mensais renderiza corretamente
6. Rotas protegidas redirecionam para login
7. Filtro por mês funciona na listagem de transações
8. Responsivo em mobile

---

## Estimativa de Arquivos

| Tipo | Quantidade |
|---|---|
| Páginas (routes) | ~8 |
| Componentes UI | ~8 |
| Componentes Charts | ~2 |
| API Routes | ~4 |
| Lib (queries, auth, db) | ~5 |
| SQL | ~2 |
| Config | ~3 |
| **Total** | **~32 arquivos** |

---

## Riscos

| Risco | Mitigação |
|---|---|
| Sem banco conectado no início | Schema SQL pronto; conexão via env var — app funciona assim que o Neon for configurado |
| Auth.js v5 ainda em beta | API estável; usado amplamente com Next.js App Router |
| Complexidade do MVP | Implementação incremental por fases — cada fase é independente |
