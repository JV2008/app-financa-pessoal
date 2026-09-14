# PROJECT_CONTEXT — App de Finanças Pessoais

Projeto isolado. Substitui controle via Excel por um web app público de gestão financeira pessoal.

## Ferramentas / Stack

| Camada | Ferramenta | Uso |
|---|---|---|
| Frontend | Next.js (React) + TypeScript | Interface, rotas, SSR |
| Estilo | Tailwind CSS | UI/UX — foco declarado do projeto |
| Gráficos | Recharts | Gastos mensais, saldo, investimentos |
| Backend | Next.js Route Handlers | API dentro do próprio projeto (sem serviço separado) |
| Autenticação | Auth.js (NextAuth) | Login, hash de senha, sessão |
| Banco de dados | PostgreSQL (Neon) | Dados relacionais normalizados |
| Rate limiting | Upstash Ratelimit | Proteção da API pública |
| Hospedagem | Vercel (app) + Neon (banco) | Free tier |

## Estrutura de pastas

```
/app
  /(auth)
    login/
    register/
  /(dashboard)
    page.tsx              -- visão geral: saldo, gráfico de gastos
    transactions/
    accounts/
    investments/
  /api
    auth/[...nextauth]/
    transactions/
    accounts/
    investments/
/lib
  db.ts                    -- conexão Postgres
  auth.ts                  -- config Auth.js
  queries/                 -- funções de acesso a dados por entidade
/components
  ui/                      -- componentes reutilizáveis (botão, input, card)
  charts/                  -- gráficos (gastos, saldo, investimentos)
/db
  schema.sql                -- users, accounts, categories, transactions, investments
```

## Regras da estrutura

- **Backend e frontend no mesmo projeto** (Route Handlers) — sem serviço separado, sem CORS.
- **Saldo é sempre calculado a partir de `transactions`**, nunca armazenado como coluna própria — evita redundância/inconsistência.
- Toda query de dados filtra obrigatoriamente por `user_id` do usuário autenticado — isolamento multi-tenant.
- `/lib/queries` concentra acesso ao banco — nenhum componente de UI faz query direto.

## Roadmap resumido
MVP → 1 conta, transações, gráfico de gastos mensais.
V1 → múltiplas contas, categorias customizáveis, gráfico de saldo no tempo.
V2 → módulo de investimentos.
V3 → interatividade avançada (drill-down, filtros).
