import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  Wallet, TrendingUp, AlertCircle, DollarSign, Truck, ShoppingBag, Store as StoreIcon
} from 'lucide-react';

import { KpiCard } from '../components/KpiCard';
import { Skeleton } from '../components/Skeleton';
import { VisibilityToggle } from '../components/VisibilityToggle';
import { SensitiveValue } from '../components/SensitiveValue';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, DashboardSummaryResponse } from '../api-routes/dashboard';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PERIOD_OPTIONS = [
  { label: '6 meses', value: 6 },
  { label: '12 meses', value: 12 },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // AbortController cancela a requisição anterior sempre que "months" muda de novo
    // (ou quando o componente desmonta/remonta, como o React StrictMode faz em dev).
    // Sem isso, cada disparo do efeito vira uma requisição completa e desperdiçada.
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await dashboardService.summary({ months }, controller.signal);
        setData(response);
      } catch (err: any) {
        if (err?.name === 'AbortError') return; // requisição cancelada de propósito, ignora
        console.error('Erro ao carregar dashboard:', err);
        setError(err.message || 'Não foi possível carregar os dados do dashboard.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [months]);

  const kpis = data?.kpis;

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-950">
      {/* Cabeçalho */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Olá{user?.name ? `, ${user.name}` : ''} 👋
          </h1>
          <p className="text-sm text-gray-500">Visão geral consolidada das suas operações financeiras.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 text-[10px] font-bold overflow-hidden">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMonths(opt.value)}
                className={`px-3 py-2 cursor-pointer transition-colors ${months === opt.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <VisibilityToggle />
        </div>
      </header>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Vendas no Período"
          value={String(kpis?.vendasPeriodo ?? 0)}
          icon={<ShoppingBag className="w-4 h-4" />}
          loading={loading}
          variationPercent={kpis?.variacaoVendasPercent}
          sensitive={false}
        />
        <KpiCard
          label="Receita Bruta"
          value={formatBRL(kpis?.receitaBruta ?? 0)}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={loading}
          variationPercent={kpis?.variacaoReceitaPercent}
        />
        <KpiCard
          label="Receita Líquida Recebida"
          value={formatBRL(kpis?.receitaLiquida ?? 0)}
          icon={<Wallet className="w-4 h-4" />}
          loading={loading}
          accent="green"
        />
        <KpiCard
          label="Saldo a Receber"
          value={formatBRL(kpis?.saldoAReceber ?? 0)}
          icon={<AlertCircle className="w-4 h-4" />}
          loading={loading}
          accent="amber"
        />
        <KpiCard
          label="Comissões de Marketplace"
          value={formatBRL(kpis?.comissoes ?? 0)}
          icon={<DollarSign className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          label="Custos de Frete/Logística"
          value={formatBRL(kpis?.frete ?? 0)}
          icon={<Truck className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          label="Ticket Médio"
          value={formatBRL(kpis?.ticketMedio ?? 0)}
          icon={<TrendingUp className="w-4 h-4" />}
          loading={loading}
        />
        <KpiCard
          label="Vendas no Mês Atual"
          value={String(kpis?.vendasMesAtual ?? 0)}
          icon={<ShoppingBag className="w-4 h-4" />}
          loading={loading}
          sensitive={false}
        />
      </div>

      {/* Gráfico de linha: evolução mensal */}
      <div className="bg-white border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Evolução Mensal</h2>
            <p className="text-xs text-gray-500 mt-0.5">Receita bruta vs. receita líquida recebida, mês a mês.</p>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlySeries || []} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: number) => formatBRL(value)}
                  contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 0 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="receitaBruta" name="Receita Bruta" stroke="#0f172a" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="receitaLiquida" name="Receita Líquida" stroke="#064E3B" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking por marketplace */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-sm text-gray-900">Receita por Marketplace</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-4 w-full" /></div>
              ))
            ) : (data?.byMarketplace || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">Nenhum dado no período selecionado.</p>
            ) : (
              data!.byMarketplace.map((m) => (
                <div key={m.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{m.vendas} venda(s)</p>
                  </div>
                  <SensitiveValue as="span" className="text-xs font-mono font-semibold text-emerald-700">
                    {formatBRL(m.receitaLiquida)}
                  </SensitiveValue>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top lojas */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-gray-400" />
            <h2 className="font-bold text-sm text-gray-900">Top 5 Lojas</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4"><Skeleton className="h-4 w-full" /></div>
              ))
            ) : (data?.topStores || []).length === 0 ? (
              <p className="p-6 text-center text-xs text-gray-400">Nenhum dado no período selecionado.</p>
            ) : (
              data!.topStores.map((s) => (
                <div key={s.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{s.name}</p>
                    <p className="text-[10px] text-gray-400 font-mono">{s.marketplace} · {s.vendas} venda(s)</p>
                  </div>
                  <SensitiveValue as="span" className="text-xs font-mono font-semibold text-emerald-700">
                    {formatBRL(s.receitaLiquida)}
                  </SensitiveValue>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Últimas vendas */}
      <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="font-bold text-sm text-gray-900">Últimas Vendas Registradas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-semibold">
              <tr>
                <th className="px-6 py-3">Nota Fiscal</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Loja / Canal</th>
                <th className="px-6 py-3 text-right">Valor Bruto</th>
                <th className="px-6 py-3 text-right">Líquido Recebido</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-3.5"><Skeleton className="h-4 w-full" /></td>
                  </tr>
                ))
              ) : (data?.recentSales || []).length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-400 font-medium">Nenhuma venda encontrada.</td></tr>
              ) : (
                data!.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-xs font-bold text-gray-800">Nº {sale.nf}</td>
                    <td className="px-6 py-3.5 text-gray-500 text-xs">
                      {(() => {
                        const parts = sale.date.split('-');
                        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : sale.date;
                      })()}
                    </td>
                    <td className="px-6 py-3.5 text-xs text-gray-700">
                      <span className="font-semibold">{sale.storeName}</span>
                      <span className="text-gray-400"> · {sale.marketplaceName}</span>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs text-gray-900">
                      <SensitiveValue showToggle={false}>{formatBRL(sale.valorBruto)}</SensitiveValue>
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold text-emerald-700">
                      <SensitiveValue showToggle={false}>{formatBRL(sale.liquidoRecebido)}</SensitiveValue>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase bg-gray-100 text-gray-700">
                        {sale.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
