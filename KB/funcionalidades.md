# Funcionalidades e interações

## Visão de estado

| Área | Estado | O que o usuário consegue fazer |
|---|---|---|
| Cadastro e login | Implementado | Criar credencial, autenticar e encerrar sessão. |
| Dashboard | Implementado | Consultar perfil, contas, saldo consolidado e criar conta. |
| Transações/extrato | Implementado com lacuna de entrada | Filtrar, editar e excluir transações existentes. O formulário de nova transação existe como componente, mas não está renderizado nas páginas atuais. |
| Análise financeira | Implementado parcialmente | Explorar períodos/contas, KPIs, gráficos, imprimir e exportar CSV localmente. Metas são apenas interface local. |
| Investimentos | Planejado | A tela informa disponibilidade na V2; API ainda retorna dados vazios. |

## Autenticação

### Cadastro

1. Em `/register`, o usuário informa nome, e-mail e senha (mínimo de 6 caracteres no cliente).
2. O formulário envia `POST /api/register`.
3. A API exige os três campos, rejeita e-mail duplicado e gera hash bcrypt com custo 10.
4. O registro atual é salvo no schema `neon_auth`: uma linha em `"user"` e uma credencial na tabela `account` com `providerId = credential`.
5. Em sucesso, o usuário é redirecionado para `/login`; em falha, a mensagem retornada pela API aparece no formulário.

### Login, sessão e saída

1. Em `/login`, `signIn("credentials")` envia e-mail e senha ao Auth.js.
2. O provider consulta `neon_auth."user"` e `neon_auth.account`, compara a senha por bcrypt e cria sessão JWT se a credencial for válida.
3. O JWT recebe o identificador do usuário, usado pelas páginas e APIs financeiras para isolamento de dados.
4. Login bem-sucedido navega para `/`; erro mostra “Email ou senha inválidos”.
5. Usuário autenticado em `/login` ou `/register` é redirecionado para `/`. Usuário anônimo em páginas protegidas é redirecionado para `/login`.
6. No card Perfil do dashboard, “Sair da conta” encerra a sessão e redireciona para o login.

## Dashboard

Ao abrir `/`, o servidor carrega em paralelo contas financeiras, resumo de saldo, despesas por categoria do mês corrente, transações filtráveis e categorias. A tela exibe:

- Perfil: nome, e-mail e número de contas vinculadas;
- cartões das contas, cada um com tipo, moeda e saldo derivado;
- resumo financeiro consolidado, alimentado por contas, categorias e transações;
- botão **Nova Conta**.

### Criar conta

1. “Nova Conta” abre um modal.
2. Nome e tipo são obrigatórios. Tipos permitidos: `corrente`, `poupanca`, `investimento`; moeda assume `BRL`.
3. O envio chama `POST /api/accounts`; a API exige sessão e só cria conta associada ao usuário atual.
4. Em sucesso o modal fecha e `router.refresh()` recarrega o dashboard. Erros de API ou conexão permanecem no modal.

## Transações e extrato

Em `/transacoes`, a tabela exibe data, descrição, conta, categoria, tipo, valor e ações. A data é renderizada em UTC para evitar deslocamento de dia; o valor é BRL.

### Filtros

Os três selects preservam os demais parâmetros da URL e navegam para a nova query string:

- Conta: `accountId`;
- Categoria: `categoryId`;
- Tipo: `type` (`receita`, `despesa` ou `transferencia`).

A busca de dados é feita no servidor e sempre restringida às contas do usuário autenticado.

### Editar lançamento

1. “Editar” abre o modal preenchido com a transação selecionada.
2. Alterar tipo reduz as categorias disponíveis ao mesmo tipo.
3. Salvar envia `PUT /api/transactions/:id` com conta, categoria opcional, tipo, valor, descrição e data.
4. O servidor só atualiza se a transação pertencer a uma conta do usuário da sessão. Após sucesso, fecha o modal e atualiza a rota.

### Excluir lançamento

1. “Excluir” abre confirmação com descrição, valor e tipo.
2. Confirmar chama `DELETE /api/transactions/:id`.
3. A exclusão só ocorre quando a transação pertence ao usuário autenticado. Após sucesso, a listagem é atualizada.

### Criar lançamento — componente disponível, integração pendente

`TransactionModal` contém o formulário de nova transação e chama `POST /api/transactions`, mas não é renderizado no dashboard ou em `/transacoes`. Quando integrado, o fluxo será: selecionar conta, tipo, categoria opcional compatível, valor, data e descrição; a API valida campos obrigatórios e propriedade da conta antes de inserir.

## Análise financeira

A página `/analise` recebe as transações do usuário e calcula no cliente:

- receitas, despesas, economia líquida e taxa de poupança;
- fluxo de caixa mensal;
- evolução patrimonial estimada a partir do fluxo cumulativo;
- gastos por categoria e quatro maiores despesas;
- gráficos de fluxo de caixa, patrimônio e distribuição por categoria.

Interações disponíveis:

- período: mês atual, 3 meses, 6 meses, ano atual ou intervalo personalizado;
- conta: todas ou uma conta específica;
- **Excel / CSV**: gera e baixa CSV UTF-8 com separador `;`, somente para os dados filtrados;
- **Exportar PDF**: chama a impressão nativa do navegador (`window.print()`), não gera arquivo PDF no servidor;
- **Configurar Metas**: abre modal e permite editar percentagem localmente, mas ainda não persiste nem altera os cálculos.

Indicadores percentuais de comparação e “retorno consolidado” presentes nos cards são textos fixos de interface, não métricas calculadas contra período anterior.

## Investimentos

`/investments` exige autenticação e informa que o módulo é previsto para V2. A tabela e as funções de consulta/upsert existem no código, mas não estão ligadas ao endpoint: `GET /api/investments` retorna `[]` e `POST /api/investments` retorna `{}`. Não tratar como funcionalidade pronta.

