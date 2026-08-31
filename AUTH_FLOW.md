# Como funciona a autenticação do app

## Fluxo atual

```mermaid
flowchart TD
    A[Usuário acessa /register] --> B{middleware}
    B -->|não logado| C[Permite acesso]
    B -->|já logado| D[Redirect para /]

    C --> E[Formulário de cadastro]
    E --> F[POST /api/register]
    F --> G{API de registro}
    G -->|valida| H[Insere em "user"]
    H --> I[createAccount cria conta padrão]
    I --> J[201 + userId]
    J --> K[Redirect para /login]

    L[Usuário acessa /login] --> M{middleware}
    M -->|não logado| N[Permite acesso]
    N --> O[Formulário de login]
    O --> P[signIn("credentials")]
    P --> Q{NextAuth}
    Q -->|valida| R[Sessão JWT]
    R --> S[Redirect para /]

    T[Usuário acessa /dashboard] --> U{middleware}
    U -->|não logado| V[Redirect para /login]
    U -->|logado| W[Permite acesso]
```

## Arquivos envolvidos

### 1. Páginas (Client Components)
- `app/(auth)/login/page.tsx` - Formulário de login
- `app/(auth)/register/page.tsx` - Formulário de cadastro

### 2. API Routes
- `app/api/register/route.ts` - Cria usuário + conta padrão
- `app/api/auth/[...nextauth]/route.ts` - Endpoints do NextAuth

### 3. Lógica de autenticação
- `lib/auth.ts` - Configuração do NextAuth (Credentials provider)
- `middleware.ts` - Proteção de rotas

### 4. Banco de dados
- `lib/db.ts` - Pool de conexões PostgreSQL
- `db/schema.sql` - Schema com tabelas no singular

## Problemas encontrados

### 1. Middleware interceptando rotas de API
**Problema:** O regex do matcher estava capturando `/api/auth/callback/credentials` e `/api/register`, retornando HTML de redirect ao invés de JSON.

**Solução aplicada:** Ajustei o matcher para excluir essas rotas:
```ts
matcher: ["/((?!_next/static|_next/image|api/auth|api/register|/api/accounts|/api/transactions|/api/investments).*)"]
```

### 2. Divergência de nomes de tabelas
**Problema:** O código usava `users`, `accounts`, etc. mas o Neon tinha tabelas no singular: `user`, `account`, etc.

**Solução aplicada:** Atualizei todas as queries para usar os nomes corretos.

### 3. Timeout na conexão com Neon
**Problema:** `channel_binding=require` na DATABASE_URL causava `ECONNRESET` e depois timeout.

**Solução aplicada:** Removi `channel_binding=require` e ajustei a connection string para `sslmode=verify-full`.

### 4. Erro genérico sem log
**Problema:** O catch retornava apenas "Erro interno" sem detalhes.

**Solução aplicada:** Adicionei `console.error` para mostrar o erro real no terminal.

## Estado atual

- ✅ Middleware configurado corretamente
- ✅ Schema e queries alinhadas com tabelas do Neon
- ✅ DATABASE_URL sem `channel_binding=require`
- ✅ Logs de erro habilitados
- ⏳ Aguardando teste real do cadastro

## Como testar agora

1. Acesse `http://localhost:3000/register`
2. Preencha nome, email e senha
3. Clique em "Cadastrar"
4. Se falhar, verifique o terminal para ver o erro real