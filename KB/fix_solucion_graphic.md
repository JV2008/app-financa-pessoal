# Documentação de Correção — Atualização dos Gráficos

> **Data:** 07/10/2026  
> **Escopo:** Resolução de falhas na atualização e renderização dos gráficos analíticos  
> **Arquivos Alterados:**  
> - `components/analytics/analytics-dashboard.tsx`  
> - `app/analise/page.tsx`  
> **Documentos de Referência:** [KB/architecture.md](./architecture.md), [KB/funcionalidades.md](./funcionalidades.md), [plano_fix_grphics.md](../plano_fix_grphics.md)

---

## 1. Contexto e Motivação

O painel de relatórios financeiros (`/analise`) apresentava inconsistências na atualização das informações gráficas após filtros de período e seleção de contas, além de omissão de lançamentos efetuados nos primeiros dias dos meses.

Embora o relato inicial mencionasse "Chart.js", a stack estabelecida do projeto utiliza **Recharts** (`recharts: ^2.12.0`), integrado ao Next.js 15 (App Router) e React 18. Para respeitar a premissa de **alteração mínima do sistema sem afetar a UX/UI e sem modificar nenhum dado existente no banco de dados**, a correção focou nas causas raízes lógicas e de ciclo de vida do React/Next.js.

---

## 2. Diagnóstico das Causas Raízes

1. **Deslocamento de Fuso Horário (Timezone Skew UTC vs. Local):**
   - O campo `occurred_at` (tipo `DATE` no PostgreSQL) armazena datas no formato `YYYY-MM-DD`.
   - O JavaScript padrão interpreta strings ISO como UTC (`00:00:00Z`), que no fuso horário brasileiro (UTC-3) vira **21:00 do dia anterior**.
   - As datas de início e agrupamento local usavam `getMonth()` e `getFullYear()`, fazendo com que transações do dia 1º fossem excluídas do filtro (`txDate < startDate`) ou agrupadas no mês anterior.
2. **Bug de Overflow de Dias no Loop de Séries Temporais:**
   - Ao avançar meses usando `cur.setMonth(cur.getMonth() + 1)`, se o intervalo começasse em dias 29, 30 ou 31, o JavaScript transbordava (ex: 31/01 virava março, pulando fevereiro por completo).
3. **Dessincronização de Estado entre Servidor e Cliente:**
   - Em `app/analise/page.tsx`, a consulta no servidor aplicava `{ accountId: params.accountId }`. Se o usuário carregasse a página com parâmetro de conta, o cliente recebia apenas transações daquela conta, mas o `<select>` iniciava em `"all"`. Mudar de conta no cliente resultava em gráficos zerados.
4. **Cache Estático no Next.js 15:**
   - A rota `/analise` não declarava `force-dynamic`, permitindo cache agressivo do App Router entre navegações de tela.
5. **Retenção de Layout no Recharts (SVG e Animações):**
   - Os componentes de gráficos não recebiam chaves (`key`) únicas vinculadas às mudanças de filtros, impedindo o Recharts de reiniciar transições e recalcular escalas em tempo real.
6. **Fragilidade com Retornos Numéricos em String:**
   - Valores decimais retornados pelo driver `@neondatabase/serverless` como string podiam gerar `NaN` em conversões simples, corrompendo as séries do Recharts.
7. **Erro `dateStr.includes is not a function`:**
   - No PostgreSQL/Neon, colunas `DATE` são frequentemente instanciadas diretamente como objetos nativos `Date` do JavaScript pelo driver (`@neondatabase/serverless`), em vez de strings primitivas.
   - Chamar `.includes()` (método exclusivo de `String.prototype`) sobre um objeto `Date` causava a exceção de tipo `TypeError: dateStr.includes is not a function`.

---

## 3. Modificações Realizadas

### 3.1. `components/analytics/analytics-dashboard.tsx`

1. **Criação de Funções Utilitárias Puras e Polimórficas:**
   - `parseUTCDate(dateInput)`: Trata de forma polimórfica tanto instâncias nativas de `Date` quanto strings formatadas em ISO/UTC. Se for um objeto `Date`, extrai os componentes via `getUTCFullYear()`, `getUTCMonth()` e `getUTCDate()` garantindo meio-dia em UTC (`Date.UTC(ano, mes, dia, 12, 0, 0)`). Se for string, converte e remove o sufixo temporal sem estourar exceções.
   - `getUTCMonthKey(date)`: Formata a chave mensal no padrão `YYYY-MM` baseando-se estritamente em métodos UTC.
   - `parseSafeAmount(value)`: Converte strings monetárias e números de forma robusta, retornando `0` para valores nulos ou inválidos, blindando o Recharts contra `NaN`.

2. **Cálculo de Período e Agrupamento Mensal Seguro:**
   - `startDate` e `endDate` gerados via `Date.UTC`.
   - O loop de continuidade mensal agora fixa sempre o **dia 1 em UTC** (`cur.setUTCMonth(cur.getUTCMonth() + 1)`), eliminando o bug de transbordamento de mês para períodos iniciados em dias 29 a 31.

3. **Chaveamento Reativo dos Gráficos (`key` prop):**
   - Adicionada prop `key` composta em cada gráfico:
     ```tsx
     <CashflowChart
       key={`cashflow-${selectedPeriod}-${selectedAccountId}-${filteredTransactions.length}`}
       data={cashflowData}
     />
     <NetWorthChart
       key={`networth-${selectedPeriod}-${selectedAccountId}-${filteredTransactions.length}`}
       data={netWorthData}
       currentTotal={totals.accountsBalance}
       accumulatedSavings={totals.netSavings}
       estimatedReturn={Math.max(0, totals.netSavings * 0.05)}
     />
     <CategoryDonutChart
       key={`donut-${selectedPeriod}-${selectedAccountId}-${filteredTransactions.length}`}
       data={categoryExpenses}
       totalExpenses={totals.expenses}
     />
     ```
   - Isso força o Recharts a reconstruir o SVG e animar com precisão sempre que o período, a conta ou o volume de transações se altera.

4. **Sincronização com Conta Inicial:**
   - Adicionada a propriedade opcional `initialAccountId` na interface `AnalyticsDashboardProps`, inicializando o estado do dropdown com a conta da URL quando presente.

### 3.2. `app/analise/page.tsx`

1. **Ativação de Rota Dinâmica:**
   - Declarado `export const dynamic = "force-dynamic";` para garantir que novas transações e edições reflitam imediatamente na tela de análise financeira sem cache defasado.

2. **Carregamento Abrangente no Servidor com Filtro Instantâneo no Cliente:**
   - Alterada a chamada de `getTransactionsByUser(userId)` para obter o histórico completo do usuário, passando `initialAccountId={params.accountId}` para o componente cliente.
   - Isso permite que o usuário alterne instantaneamente entre "Todas as Contas" e contas individuais pelo `<select>` no cliente, com resposta imediata e sem travamentos.

---

## 4. Garantias e Integridade do Sistema

- **Preservação de Dados:** Nenhum dado no banco PostgreSQL (Neon) foi alterado, excluído ou migrado. O modelo de dados e as queries existentes continuam intactos.
- **Preservação de UX/UI:** Nenhuma classe de estilo, layout, modal, paleta de cores ou elemento visual foi modificado. A interface permaneceu 100% idêntica, apenas com o comportamento interativo e reativo corrigido.
- **Impacto Cirúrgico:** Apenas 2 arquivos foram ajustados, com alterações mínimas e estritamente voltadas para a consistência lógica da apresentação gráfica.

---

## 5. Procedimento de Validação Manual

1. Acessar `/analise` e alternar os botões de período ("Este Mês", "3 Meses", "Ano Atual", "Personalizado"): verificar se os gráficos e KPIs recalculam instantaneamente.
2. Criar ou verificar uma transação com data no dia 1º do mês corrente: confirmar que a mesma aparece no gráfico do mês e soma aos totais.
3. No dropdown de contas, selecionar uma conta específica e depois retornar para "Todas as Contas": confirmar atualização imediata dos valores em tela.
