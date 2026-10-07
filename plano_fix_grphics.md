# Plano de Correção e Atualização dos Gráficos — MyFinanceApp

> **Status:** Proposta de Correção Técnica  
> **Arquivo Alvo Principal:** `components/analytics/analytics-dashboard.tsx` e `components/charts/*`  
> **Documentos de Referência:** [KB/architecture.md](file:///c:/Users/joaov/Desktop/app-financas-pessoais/KB/architecture.md), [KB/funcionalidades.md](file:///c:/Users/joaov/Desktop/app-financas-pessoais/KB/funcionalidades.md), [KB/DECISIONS.md](file:///c:/Users/joaov/Desktop/app-financas-pessoais/KB/DECISIONS.md), [KB/PROJECT_CONTEXT.md](file:///c:/Users/joaov/Desktop/app-financas-pessoais/KB/PROJECT_CONTEXT.md)

---

## 1. Contexto e Esclarecimento Tecnológico (Chart.js vs. Recharts)

No diagnóstico inicial da base de código e da documentação em `KB/`, foi identificado um ponto crucial:
- A aplicação utiliza **Recharts** (`recharts: ^2.12.0` no `package.json`), e **não Chart.js**.
- Conforme registrado em `KB/PROJECT_CONTEXT.md` e `KB/architecture.md`, o stack oficial de gráficos é o Recharts com React 18 / Next.js 15.
- Os sintomas relatados de "gráficos que não atualizam as informações corretamente" decorrem de **falhas na manipulação de fusos horários/datas, geração de buckets mensais, dessincronização de estado client/server e ciclo de vida de renderização do Recharts no App Router**.

Este plano corrige a causa raiz no código existente (Recharts) e também apresenta as diretrizes caso o time deseje migrar para Chart.js.

---

## 2. Diagnóstico: Erros Identificados em `components/analytics`

Após análise detalhada do componente [analytics-dashboard.tsx](file:///c:/Users/joaov/Desktop/app-financas-pessoais/components/analytics/analytics-dashboard.tsx) e dos componentes de suporte em [components/charts](file:///c:/Users/joaov/Desktop/app-financas-pessoais/components/charts), foram identificados **6 problemas críticos** que impedem a atualização correta dos gráficos:

### Erro 1: Deslocamento de Fuso Horário (Timezone Skew UTC vs. Local)
- **Localização:** `analytics-dashboard.tsx` (linhas 104–108 e 146–154)
- **Causa:** O PostgreSQL armazena `occurred_at` como `DATE` sem horário (ex.: `"2026-05-01"`). Quando o JavaScript executa `new Date(t.occurred_at)`, ele interpreta a string ISO como UTC meia-noite (`2026-05-01T00:00:00Z`).
- No fuso horário brasileiro (UTC-3), essa data vira **30 de abril às 21:00:00**.
- Ao mesmo tempo, `startDate` é criado usando `new Date(now.getFullYear(), now.getMonth(), 1)` (meia-noite no fuso local).
- **Consequência:**
  1. Transações feitas no dia 1º do mês são descartadas no filtro (`txDate < startDate`).
  2. Ao agrupar os meses com `d.getFullYear()` e `d.getMonth() + 1` (métodos locais), a transação é agrupada no mês anterior (abril em vez de maio) ou cai fora de `monthBuckets`, deixando barras e totais zerados ou defasados.
- **Referência KB:** Em `KB/architecture.md`, item 6: *"Datas. occurred_at é data sem horário. Apresentação no extrato usa timezone UTC para não alterar o dia."*

### Erro 2: Bug de Overflow de Dias no Loop de Meses (`cur.setMonth`)
- **Localização:** `analytics-dashboard.tsx` (linhas 139–144)
- **Código com falha:**
  ```typescript
  const cur = new Date(startDate);
  while (cur <= endDate) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    monthBuckets[key] = { income: 0, expenses: 0 };
    cur.setMonth(cur.getMonth() + 1); // <-- BUG se startDate for dia 29, 30 ou 31
  }
  ```
- **Causa:** Se o usuário seleciona um período personalizado iniciando em um dia 31 (ex: 31/01), ao fazer `cur.setMonth(cur.getMonth() + 1)`, o JavaScript tenta criar "31 de fevereiro", que transborda automaticamente para **3 de março**. O mês de fevereiro é completamente pulado!
- **Consequência:** Gráficos com meses ausentes, quebrando a série temporal do fluxo de caixa e da evolução patrimonial.

### Erro 3: Dessincronização entre Filtro de Conta Local e Consulta do Servidor
- **Localização:** `app/analise/page.tsx` vs `analytics-dashboard.tsx` (linha 49 e 328–351)
- **Causa:** A página do servidor executa `getTransactionsByUser(userId, { accountId: params.accountId })`. Se a página for acessada com `?accountId=xxx`, apenas transações daquela conta chegam ao cliente. No entanto, o `AnalyticsDashboard` inicializa seu estado interno com `selectedAccountId = "all"`.
- **Consequência:**
  1. O usuário vê o dropdown indicando "Todas as Contas", mas os dados renderizados pertencem apenas à conta do parâmetro de URL.
  2. Se o usuário tentar trocar para outra conta no dropdown do cliente, nada acontece ou o gráfico zera, pois a transação de outra conta não foi carregada pelo servidor.
  3. A mudança no `<select>` local não atualiza a URL (`router.push` ou `useSearchParams`).

### Erro 4: Falha de Re-render e Animação do Recharts no Next.js App Router
- **Localização:** `components/charts/cashflow-chart.tsx`, `net-worth-chart.tsx` e `category-donut-chart.tsx`
- **Causa:** O Recharts armazena estado de animação interno no SVG. Quando as propriedades `data` mudam via filtro sem que a chave (`key`) do elemento mude, o `ResponsiveContainer` frequentemente não recalcula o layout ou mantém as coordenadas antigas de transição.
- **Consequência:** O usuário clica em "3 Meses" ou altera a conta, mas o gráfico aparenta estar travado ou renderiza com atraso/artefatos visuais.

### Erro 5: Ausência de Revalidação Dinâmica de Rota (Cache do Next.js 15)
- **Localização:** `app/analise/page.tsx`
- **Causa:** A página não declara `export const dynamic = "force-dynamic"`. No Next.js 15, páginas de servidor que não declaram dynamicidade explícita podem sofrer com o Client Router Cache ao navegar entre abas (`/` -> `/transacoes` -> `/analise`).
- **Consequência:** Uma nova transação adicionada no dashboard ou em `/transacoes` não reflete na tela de `/analise` até um recarregamento forçado com F5.

### Erro 6: Risco de `NaN` em Séries Numéricas
- **Localização:** `analytics-dashboard.tsx` (linhas 117, 150, 192, 214)
- **Causa:** No driver Neon/Postgres, colunas do tipo `numeric` são retornadas como string (ex.: `"250.00"`). Se um lançamento tiver valor formatado de forma imprevista, `Number(t.amount)` pode produzir `NaN`.
- **Consequência:** Quando o Recharts encontra um valor `NaN` em uma série de dados, ele interrompe a renderização dos eixos e das barras adjacentes silenciosamente.

---

## 3. Plano de Implementação da Correção

### Etapa 1: Normalização de Datas em UTC Puro
Criar funções utilitárias puras para manipulação de data sem interferência de fuso horário local dentro de `components/analytics/analytics-dashboard.tsx`:

```typescript
// Extrai ano, mês e dia seguros da string YYYY-MM-DD
function parseUTCDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  // Se vier no formato "YYYY-MM-DD"
  const cleanDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
  const [year, month, day] = cleanDate.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
}

function getUTCMonthKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
```

### Etapa 2: Correção do Cálculo de Períodos e Buckets Mensais
Substituir a lógica do período para gerar início e fim em UTC, sempre fixando o dia 1 para evitar transbordamento mensal:

```typescript
const { startDate, endDate, periodLabel } = useMemo(() => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  let start: Date;
  let end = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
  let label = "Últimos 6 meses";

  if (selectedPeriod === "este-mes") {
    start = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0));
    label = "Este Mês";
  } else if (selectedPeriod === "3-meses") {
    start = new Date(Date.UTC(currentYear, currentMonth - 2, 1, 0, 0, 0));
    label = "Últimos 3 meses";
  } else if (selectedPeriod === "ano-atual") {
    start = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0));
    label = `Ano Atual (${currentYear})`;
  } else if (selectedPeriod === "personalizado" && customStartDate && customEndDate) {
    const [sY, sM, sD] = customStartDate.split("-").map(Number);
    const [eY, eM, eD] = customEndDate.split("-").map(Number);
    start = new Date(Date.UTC(sY, sM - 1, sD, 0, 0, 0));
    end = new Date(Date.UTC(eY, eM - 1, eD, 23, 59, 59, 999));
    label = "Personalizado";
  } else {
    // 6 meses padrão
    start = new Date(Date.UTC(currentYear, currentMonth - 5, 1, 0, 0, 0));
    const startStr = start.toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" });
    const endStr = end.toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" });
    label = `Últimos 6 meses (${startStr} – ${endStr})`;
  }

  return { startDate, endDate, periodLabel: label };
}, [selectedPeriod, customStartDate, customEndDate]);
```

E no preenchimento contínuo de meses (`cashflowData`):
```typescript
const monthBuckets: { [key: string]: { income: number; expenses: number } } = {};

// Itera mês a mês com dia fixado em 1 para eliminar risco de overflow
const cur = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
const endMonth = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));

while (cur <= endMonth) {
  const key = getUTCMonthKey(cur);
  monthBuckets[key] = { income: 0, expenses: 0 };
  cur.setUTCMonth(cur.getUTCMonth() + 1);
}
```

### Etapa 3: Saneamento Numérico Seguro
Garantir que nenhum `NaN` entre nos dados:
```typescript
function parseSafeAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const num = typeof value === "number" ? value : Number(String(value).replace(",", "."));
  return isNaN(num) ? 0 : num;
}
```

### Etapa 4: Reatividade e Keys no Recharts
Para forçar o Recharts a atualizar o gráfico sem congelar em animações anteriores, injetar uma `key` combinada nos componentes dos gráficos:

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

### Etapa 5: Revalidação e Sincronização de Rota (`app/analise/page.tsx`)
1. Adicionar `export const dynamic = "force-dynamic"` em `app/analise/page.tsx`.
2. Não filtrar `getTransactionsByUser` rigidamente no servidor caso a tela de análise permita alternar contas livremente pelo dropdown cliente, ou sincronizar a troca de conta via `useRouter` / `useSearchParams`. A melhor prática para a tela de análise (conforme `KB/funcionalidades.md`) é carregar todas as transações do usuário no servidor e permitir a filtragem instantânea no cliente:

```typescript
// app/analise/page.tsx
export const dynamic = "force-dynamic";

export default async function AnalisePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  // Carrega todas as transações para permitir que os filtros de período e conta funcionem 100% no cliente sem lag de rede
  const [accounts, transactions, categories] = await Promise.all([
    getAccountsByUser(userId),
    getTransactionsByUser(userId),
    getCategoriesByUser(userId),
  ]);

  return (
    <div className="space-y-6 pb-12">
      <AnalyticsDashboard
        transactions={transactions as any}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
```

---

## 4. Arquivos que Devem Ser Alterados

| Arquivo | Mudança Necessária |
|---|---|
| `components/analytics/analytics-dashboard.tsx` | Implementar parsing UTC de datas, loop seguro de meses, chaveamento reativo dos gráficos e conversão segura com `parseSafeAmount`. |
| `app/analise/page.tsx` | Adicionar `export const dynamic = "force-dynamic"` e passar todas as transações do usuário para garantir alternância instantânea de contas. |
| `components/charts/cashflow-chart.tsx` | Garantir que o `ResponsiveContainer` possua `minHeight` e receba chave única para recálculo do SVG. |
| `components/charts/net-worth-chart.tsx` | Adicionar tratamento seguro para vetores de dados vazios e recálculo limpo da escala Y. |
| `components/charts/category-donut-chart.tsx` | Assegurar que `totalExpenses` igual a 0 não gere divisão por zero nas porcentagens. |

---

## 5. Caso Deseje Migrar para Chart.js (Alternativa)

Se o objetivo for **efetivamente substituir o Recharts pelo Chart.js** (por exemplo, usando `chart.js` e `react-chartjs-2`):

1. **Instalação de Dependências:**
   ```bash
   npm install chart.js react-chartjs-2
   ```
2. **Registro de Módulos (obrigatório no Next.js):**
   ```typescript
   import {
     Chart as ChartJS,
     CategoryScale,
     LinearScale,
     BarElement,
     PointElement,
     LineElement,
     ArcElement,
     Title,
     Tooltip,
     Legend
   } from "chart.js";

   ChartJS.register(
     CategoryScale,
     LinearScale,
     BarElement,
     PointElement,
     LineElement,
     ArcElement,
     Title,
     Tooltip,
     Legend
   );
   ```
3. **Ponto Crítico no Chart.js:** No Chart.js com React, atualizações de dados exigem passar um objeto de dados com novas referências de array (`datasets: [{ data: [...newValues] }]`) ou usar a prop `redraw={true}` no componente `<Bar />` / `<Line />` / `<Doughnut />`, além de garantir `'use client'` em cada componente gráfico.

---

## 6. Roteiro de Testes e Validação Manual

1. **Lançamentos no Dia 1 do Mês:**
   - Inserir uma despesa no dia `01` do mês corrente.
   - Verificar se o valor é contabilizado no filtro "Este Mês" e exibido na barra correspondente no gráfico de fluxo de caixa.
2. **Alternância de Filtros de Período:**
   - Alternar entre "Este Mês", "3 Meses", "6 Meses" e "Ano Atual".
   - Confirmar se o gráfico anima e redesenha as barras com os valores do período correspondente sem necessidade de F5.
3. **Filtro de Contas:**
   - Selecionar uma conta bancária específica no dropdown.
   - Confirmar se tanto os KPIs quanto os gráficos de fluxo de caixa e despesas por categoria filtram apenas lançamentos daquela conta.
   - Retornar para "Todas as Contas" e verificar se todos os valores são restabelecidos imediatamente.
4. **Período Personalizado:**
   - Selecionar uma data inicial em dia 31 (ex: 31/01/2026 a 31/03/2026).
   - Confirmar que o mês de fevereiro é renderizado no eixo X sem ser omitido.
