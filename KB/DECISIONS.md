# DECISIONS — App de Finanças Pessoais

Log append-only de decisões arquiteturais. Formato: Decisão / Contexto / Opções Consideradas / Opção Escolhida / Motivo / Trade-offs / Riscos / Reversibilidade.

---

## DEC-001 — Backend fullstack no Next.js (não serviço separado em .NET)

**Contexto:** o projeto tem um domínio simples (CRUD de transações + agregações), diferente da complexidade de regras de negócio do JVISA.

**Opções consideradas:** (a) Next.js Route Handlers fullstack; (b) API separada em C#/.NET reaproveitando o padrão do JVISA; (c) Supabase gerenciado.

**Opção escolhida:** (a) Next.js Route Handlers.

**Motivo:** menos peças móveis (1 deploy, 1 repo, sem CORS), reaproveita o padrão de infra já validado no JVISA (Vercel/Neon), sem ganho real de (b) para este domínio.

**Trade-offs:** ganha velocidade de desenvolvimento e simplicidade; perde separação de responsabilidades caso o app cresça muito (limite de cold start/execução de serverless).

**Riscos:** baixo na escala atual (MVP/portfólio); revisitar se o produto crescer para uso em escala real.

**Reversibilidade:** média — migrar para backend separado depois é possível, mas exige reescrever a camada de API.

---

## DEC-002 — Saldo derivado, nunca armazenado

**Contexto:** requisito explícito do projeto era banco "sem redundâncias".

**Opções consideradas:** (a) coluna `balance` em `accounts`, atualizada a cada transação; (b) saldo sempre calculado via `SUM(transactions.amount)`.

**Opção escolhida:** (b) saldo derivado.

**Motivo:** elimina a classe de bug em que o saldo salvo diverge do saldo real após edição/exclusão de transação — e permite que CRUD completo de transações seja de baixo risco (ver DEC-004).

**Trade-offs:** ganha consistência garantida; perde performance bruta em altíssima escala (mitigável com view materializada, não necessária agora).

**Riscos:** nenhum na escala atual.

**Reversibilidade:** alta — pode-se adicionar cache/view materializada depois sem mudar o modelo conceitual.

---

## DEC-003 — PostgreSQL relacional normalizado (não NoSQL)

**Contexto:** dados com relações fortes (usuário → conta → transação → categoria) e requisito explícito de "sem redundâncias".

**Opções consideradas:** (a) PostgreSQL normalizado (3FN); (b) Firebase/Firestore (documento).

**Opção escolhida:** (a) PostgreSQL.

**Motivo:** modelo de dados é inerentemente relacional; NoSQL orientado a documento tende a introduzir a própria redundância que o requisito pedia para evitar.

**Trade-offs:** nenhum relevante para este domínio.

**Riscos:** nenhum.

**Reversibilidade:** baixa — trocar de modelo de dados depois é caro. Decisão de baixo risco por ser claramente a opção correta para o domínio.

---

## DEC-004 — Escopo do MVP inclui CRUD completo, filtro por mês, paginação e UI kit

**Contexto:** proposta de implementação do GitHub Copilot incluiu, nas Fases 5-6, editar/excluir transação, filtro por mês, paginação, modal, sidebar, data-table e outros componentes de UI — além do escopo mínimo original definido em `PROJECT_CONTEXT.md` ("1 conta, transações, gráfico de gastos mensais, saldo calculado").

**Opções consideradas:** (a) manter MVP restrito ao escopo mínimo original, empurrando CRUD completo e UI kit para V1; (b) manter as Fases 5-6 como propostas pelo Copilot dentro do MVP.

**Opção escolhida:** (b).

**Motivo:** dois fatores mudam a avaliação de risco original — (1) a maior parte do conteúdo das Fases 5-6 é camada de apresentação, alinhada ao requisito explícito de prioridade em UX/UI; (2) editar/excluir transação, que parecia risco de V1, é na verdade baixo risco graças ao DEC-002 (saldo derivado elimina o problema de recálculo/dessincronização).

**Trade-offs:** ganha um MVP mais completo e usável desde o início; perde um pouco da disciplina original de "menor MVP possível" — aceito porque o custo extra é majoritariamente de apresentação, não de lógica de negócio.

**Riscos:** superfície de código maior para validar antes do primeiro release — mitigado por serem funcionalidades de baixo acoplamento entre si.

**Reversibilidade:** alta — nenhum item aqui é estrutural o suficiente para travar decisões futuras.

---

## DEC-005 — Rate limiting antecipado para a Fase 3 (autenticação), não Fase 6 (polish)

**Contexto:** a proposta original do Copilot colocava rate limiting como item de "polish" na última fase; o app é público com login desde o dia 1.

**Opções consideradas:** (a) manter rate limiting na Fase 6, como no plano original; (b) mover para a Fase 3, junto da implementação de autenticação.

**Opção escolhida:** (b).

**Motivo:** rate limiting nas rotas de login/registro é postura de segurança (proteção contra força bruta e criação de contas em massa), não um fator estético — não deveria ficar exposto até a última etapa de um MVP público.

**Trade-offs:** nenhum custo real — é reordenação de fase, não trabalho adicional.

**Riscos:** manter na Fase 6 exporia a rota de auth sem proteção durante todo o desenvolvimento das Fases 3-5.

**Reversibilidade:** alta.

---

## Pendências de decisão (ainda não confirmadas por João)

Estes pontos foram levantados durante a revisão do plano do Copilot e **ainda não têm decisão formal registrada** — não tratar como decidido até confirmação:

- **Nome da tabela `accounts`:** risco de colisão com a tabela padrão do adapter de banco do Auth.js caso OAuth (Google/GitHub) seja ativado no futuro. Proposta em aberto: renomear para `financial_accounts` agora, custo baixo, evita retrabalho caro depois.
- **Driver de banco:** Copilot substituiu `pg` por `@neondatabase/serverless` sem registrar a mudança. Tecnicamente mais adequado a ambiente serverless (Vercel), mas precisa de confirmação explícita antes de virar padrão do projeto.
- **Modelo de autenticação:** confirmar que `users` é tabela própria, sem adapter de banco do Auth.js, sessão via JWT puro (Credentials Provider) — o texto do Copilot descreveu, na mesma proposta, elementos de adapter (database session) e JWT ao mesmo tempo, que são mutuamente exclusivos.
- **Idioma da UI:** pt-BR (assumido pelo Copilot, não confirmado por João).
- **Moeda padrão:** BRL (assumido pelo Copilot, não confirmado por João).
- **Categorias pré-definidas no MVP** (sem edição pelo usuário): proposta do Copilot, coerente com o roadmap original — pendente de confirmação explícita.
