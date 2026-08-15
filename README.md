# App de Finanças Pessoais

Web app para substituir controle financeiro via Excel. Ver `PROJECT_CONTEXT.md` para stack, decisões e estrutura completa.

## Setup

```bash
npm install
cp .env.example .env.local   # preencher com as credenciais reais
# rodar db/schema.sql no Postgres (Neon) antes de subir o app
npm run dev
```

## Estrutura
- `app/` — páginas e rotas de API (Next.js App Router)
- `lib/` — conexão com banco, auth, queries
- `components/` — UI e gráficos
- `db/schema.sql` — schema normalizado do banco
# app-financa-pessoal
