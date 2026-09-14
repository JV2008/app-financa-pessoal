# Design system

## Princípios

Interface financeira limpa, orientada a leitura rápida de saldo, receitas e despesas. A UI atual privilegia superfícies brancas, contraste em cinza e azul como cor de ação. O conteúdo é em pt-BR e valores devem ser apresentados como moeda BRL quando não houver moeda explícita da conta.

## Tokens visuais atuais

O projeto usa Tailwind CSS sem extensões de tema; portanto os tokens abaixo são as classes Tailwind recorrentes e devem ser mantidos como padrão até a criação de um tema semântico centralizado.

| Papel | Token / classe | Uso |
|---|---|---|
| Fundo de aplicação | `bg-gray-50` | Área principal e telas de autenticação. |
| Superfície | `bg-white` | Cards, formulários, modais e controles. |
| Texto primário | `text-gray-900` | Títulos, métricas e texto de maior prioridade. |
| Texto secundário | `text-gray-500` / `text-gray-600` | Contexto, ajuda e metadados. |
| Borda padrão | `border-gray-200` | Cards, cabeçalhos e controles. |
| Ação primária | `bg-blue-600`, hover `bg-blue-700` | Salvar, criar conta, entrar e ações confirmatórias. |
| Foco | `ring-blue-500` | Inputs e selects em foco. |
| Receita / sucesso | `bg-green-100 text-green-800`; análises `emerald-*` | Badge de receita, economia e exportação CSV. |
| Despesa / perigo | `bg-red-100 text-red-800`; ação `bg-red-600` | Badge de despesa, erros e exclusão. |
| Navegação lateral | `bg-gray-900`, ativo/hover `bg-gray-800` | Sidebar. |
| Overlay | `bg-black/50` | Fundo de modal. |

### Cores de categoria

`category.color` é uma string livre no banco e alimenta o gráfico de gastos. Quando ausente, a análise usa `#64748b` (slate). Novas categorias devem receber uma cor hexadecimal com contraste suficiente e não devem depender somente da cor para transmitir significado.

## Tipografia e espaçamento

- A fonte não é declarada no projeto; aplica-se a fonte sans-serif padrão do navegador/Tailwind. Para padronização futura, definir uma família no `tailwind.config.ts` e em `app/globals.css`.
- Título de página: `text-3xl font-bold` (em relatórios, `font-extrabold`).
- Título de card: `text-lg font-semibold`; título de seção: `text-xl font-semibold`.
- Corpo: `text-sm`; metadado/legenda: `text-xs` ou `text-[11px]`.
- KPI: `text-2xl font-extrabold`.
- Ritmo: páginas usam `space-y-6`; grades usam `gap-4` ou `gap-6`; cards têm `p-6`; campos normalmente `px-3 py-2`.

## Componentes reutilizáveis

| Componente | Padrão visual e de comportamento |
|---|---|
| `Button` | Borda `rounded-md`; tamanhos `sm` (h-8), `md` (h-10) e `lg` (h-12). Variantes: `primary`, `secondary`, `danger`, `ghost`. Desabilitado reduz opacidade e bloqueia clique. |
| `Input` | Label acima; borda cinza; foco azul. Recebe mensagem de erro abaixo e troca borda/foco para vermelho. |
| `Card` | Branco, `rounded-lg`, borda cinza e sombra discreta. Cabeçalho e conteúdo usam `p-6`. |
| `Modal` | Janela centralizada, largura máxima `max-w-lg`, scroll interno, overlay e botão `✕`. Fecha por clique no overlay ou no botão. |
| `Badge` | Cápsula de `text-xs`: verde para receita e vermelho para despesa. |
| `DataTable` | Exibe o extrato em colunas; formata data em `pt-BR` com timezone UTC e valores em BRL. |
| `Sidebar` | Largura `w-64`, logo e links para Início, Transações/Extrato e Análise Financeira. O link da rota atual é destacado. |

## Padrões de formulário e feedback

- Campos obrigatórios devem usar `required`, label visível e tipo nativo correto (`email`, `password`, `number`, `date`).
- Valores monetários usam `type=number`, `step=0.01`; a apresentação usa `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.
- Durante envio, desabilitar a ação e trocar o texto para estado de progresso: “Entrando...”, “Cadastrando...”, “Salvando...” ou “Excluindo...”.
- Erros próximos ao fluxo: vermelho em `text-sm`; respostas de API devem ser verificadas antes de fechar um modal ou atualizar a tela.
- Operações destrutivas exigem modal de confirmação, resumo do lançamento e botões Cancelar/Excluir.

## Textos padronizados

| Contexto | Texto |
|---|---|
| Autenticação inválida | `Email ou senha inválidos` |
| Campos de cadastro ausentes | `Nome, e-mail e senha são obrigatórios.` |
| E-mail em uso | `Este e-mail já está em uso.` |
| Sem contas | `Nenhuma conta cadastrada ainda. Crie uma conta para começar a lançar transações.` |
| Sem categoria | `Sem categoria` |
| Sem dados para exportar | `Não há dados no período para exportar.` |
| Confirmação de exclusão | `Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.` |
| Não autenticado (API) | `Não autorizado` |

## Responsividade e acessibilidade

- Use grades progressivas: `grid-cols-1`, depois `sm:grid-cols-2` / `md:grid-cols-2` e `lg:grid-cols-*`.
- Mantenha labels associadas aos controles via `htmlFor`/`id`; não use placeholder como único rótulo.
- Preserve o foco visível em controles. Ícones/emoji decorativos devem ter texto equivalente quando transmitirem significado.
- O modal atual bloqueia scroll de fundo, mas ainda não implementa foco preso, `Escape` para fechar nem atributos ARIA de diálogo. Esses requisitos devem acompanhar qualquer evolução do componente.

