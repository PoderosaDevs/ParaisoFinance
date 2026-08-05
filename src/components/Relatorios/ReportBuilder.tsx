// src/components/Relatorios/ReportBuilder.tsx
// Aba "Relatórios": gera relatórios agrupados (loja, marketplace, situação, mensal, semanal)
// consumindo GET /reports/generate — o mesmo endpoint alimenta o modo Apresentação.
import { useEffect, useMemo, useState } from 'react';
import {
  Store as StoreIcon, ShoppingBag, Tag, CalendarDays, CalendarRange,
  Download, AlertTriangle, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { reportService, ReportResponse, ReportType } from '../../api-routes/reports';
import { marketplaceService, Marketplace } from '../../api-routes/marketplace';
import { storeService, Store } from '../../api-routes/store';
import { SensitiveValue } from '../SensitiveValue';
import { Skeleton } from '../Skeleton';

const REPORT_TYPES: { value: ReportType; label: string; description: string; icon: JSX.Element }[] = [
  { value: 'store', label: 'Por Loja', description: 'Desempenho detalhado de cada loja cadastrada.', icon: <StoreIcon className="w-4 h-4" /> },
  { value: 'marketplace', label: 'Por Marketplace', description: 'Consolidado por canal de venda.', icon: <ShoppingBag className="w-4 h-4" /> },
  { value: 'status', label: 'Por Situação', description: 'Vendas agrupadas por status financeiro.', icon: <Tag className="w-4 h-4" /> },
  { value: 'monthly', label: 'Mensal', description: 'Comparativo mês a mês.', icon: <CalendarDays className="w-4 h-4" /> },
  { value: 'weekly', label: 'Semanal', description: 'Comparativo semana a semana.', icon: <CalendarRange className="w-4 h-4" /> },
];

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function firstDayOfMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ReportBuilder() {
  const [type, setType] = useState<ReportType>('marketplace');
  const [startDate, setStartDate] = useState(firstDayOfMonthIso());
  const [endDate, setEndDate] = useState(todayIso());
  const [marketplaceFilter, setMarketplaceFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');

  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  const [result, setResult] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    Promise.all([marketplaceService.list(), storeService.list()])
      .then(([m, s]) => { setMarketplaces(m || []); setStores(s || []); })
      .catch((err) => console.error('Erro ao carregar metadados de relatórios:', err));
  }, []);

  const availableStores = useMemo(() => {
    if (marketplaceFilter === 'all') return stores;
    return stores.filter((s) => s.marketplaceId === marketplaceFilter);
  }, [stores, marketplaceFilter]);

  const handleMarketplaceChange = (value: string) => {
    setMarketplaceFilter(value);
    if (value !== 'all' && storeFilter !== 'all') {
      const stillValid = stores.some((s) => s.id === storeFilter && s.marketplaceId === value);
      if (!stillValid) setStoreFilter('all');
    }
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    setHasGenerated(true);
    try {
      const response = await reportService.generate({
        type,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        marketplaceId: marketplaceFilter !== 'all' ? marketplaceFilter : undefined,
        storeId: storeFilter !== 'all' ? storeFilter : undefined,
      });
      setResult(response);
    } catch (err: any) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.message || 'Não foi possível gerar o relatório.');
    } finally {
      setLoading(false);
    }
  };

  const exportXlsx = () => {
    if (!result) return;
    const sheetData = result.rows.map((r) => ({
      'Agrupamento': r.label,
      'Vendas': r.vendas,
      'Receita Bruta': r.receitaBruta,
      'Comissões': r.comissoes,
      'Frete/Logística': r.frete,
      'Receita Líquida': r.receitaLiquida,
      'Ticket Médio': r.ticketMedio,
      'Margem (%)': r.margemPercent,
    }));
    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    XLSX.writeFile(workbook, `relatorio_${result.type}_${todayIso()}.xlsx`);
  };

  const columnLabel = REPORT_TYPES.find((t) => t.value === type)?.label || 'Agrupamento';

  return (
    <div className="space-y-6">
      {/* Seleção do tipo de relatório */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {REPORT_TYPES.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setType(opt.value)}
            className={`text-left p-3 border cursor-pointer transition-colors flex flex-col gap-2 ${
              type === opt.value ? 'border-brand-green bg-emerald-50/60' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`h-7 w-7 flex items-center justify-center border ${type === opt.value ? 'border-brand-green text-brand-green bg-white' : 'border-gray-200 text-gray-400'}`}>
              {opt.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">{opt.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-3 items-stretch lg:items-end">
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">De</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-mono outline-none focus:border-gray-400" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Até</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-mono outline-none focus:border-gray-400" />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Marketplace</label>
          <select value={marketplaceFilter} onChange={(e) => handleMarketplaceChange(e.target.value)}
            className="w-full h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 cursor-pointer">
            <option value="all">Todos os canais</option>
            {marketplaces.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Loja</label>
          <select value={storeFilter} onChange={(e) => setStoreFilter(e.target.value)} disabled={availableStores.length === 0}
            className="w-full h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 cursor-pointer disabled:opacity-50">
            <option value="all">Todas as lojas</option>
            {availableStores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
          </select>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="h-9 px-5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Gerar Relatório
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {!loading && result && (
        <>
          {/* Totais */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendas</p>
              <h3 className="text-lg font-mono font-bold text-gray-900 mt-1">{result.totals.vendas}</h3>
            </div>
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Bruta</p>
              <SensitiveValue as="h3" className="text-lg font-mono font-bold text-gray-900 mt-1">{formatBRL(result.totals.receitaBruta)}</SensitiveValue>
            </div>
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Líquida</p>
              <SensitiveValue as="h3" className="text-lg font-mono font-bold text-emerald-700 mt-1">{formatBRL(result.totals.receitaLiquida)}</SensitiveValue>
            </div>
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comissões + Frete</p>
              <SensitiveValue as="h3" className="text-lg font-mono font-bold text-gray-900 mt-1">{formatBRL(result.totals.comissoes + result.totals.frete)}</SensitiveValue>
            </div>
            <div className="bg-white p-4 border border-gray-200 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Margem sobre Faturamento</p>
              <h3 className="text-lg font-mono font-bold text-gray-900 mt-1">{result.totals.margemPercent}%</h3>
            </div>
          </div>

          {/* Tabela */}
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Detalhamento — {columnLabel}</h3>
              <button onClick={exportXlsx} className="flex items-center gap-1.5 text-xs font-bold text-gray-700 border border-gray-200 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                <Download className="w-3.5 h-3.5" /> Exportar XLSX
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[11px] uppercase text-gray-400 font-semibold">
                  <tr>
                    <th className="px-6 py-3">{columnLabel}</th>
                    <th className="px-6 py-3 text-right">Vendas</th>
                    <th className="px-6 py-3 text-right">Receita Bruta</th>
                    <th className="px-6 py-3 text-right">Comissões</th>
                    <th className="px-6 py-3 text-right">Frete</th>
                    <th className="px-6 py-3 text-right">Receita Líquida</th>
                    <th className="px-6 py-3 text-right">Ticket Médio</th>
                    <th className="px-6 py-3 text-right">Margem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {result.rows.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-400 font-medium">Nenhum dado encontrado para os filtros selecionados.</td></tr>
                  ) : (
                    result.rows.map((row) => (
                      <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-semibold text-gray-800 text-xs">{row.label}</td>
                        <td className="px-6 py-3 text-right font-mono text-xs">{row.vendas}</td>
                        <td className="px-6 py-3 text-right font-mono text-xs"><SensitiveValue showToggle={false}>{formatBRL(row.receitaBruta)}</SensitiveValue></td>
                        <td className="px-6 py-3 text-right font-mono text-xs text-rose-600"><SensitiveValue showToggle={false}>{formatBRL(row.comissoes)}</SensitiveValue></td>
                        <td className="px-6 py-3 text-right font-mono text-xs text-amber-600"><SensitiveValue showToggle={false}>{formatBRL(row.frete)}</SensitiveValue></td>
                        <td className="px-6 py-3 text-right font-mono text-xs font-semibold text-emerald-700"><SensitiveValue showToggle={false}>{formatBRL(row.receitaLiquida)}</SensitiveValue></td>
                        <td className="px-6 py-3 text-right font-mono text-xs text-gray-600"><SensitiveValue showToggle={false}>{formatBRL(row.ticketMedio)}</SensitiveValue></td>
                        <td className="px-6 py-3 text-right font-mono text-xs text-gray-600">{row.margemPercent}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!loading && !hasGenerated && (
        <div className="bg-white border border-dashed border-gray-300 p-10 text-center">
          <p className="text-xs text-gray-500">Escolha o tipo de relatório, ajuste os filtros e clique em <strong>Gerar Relatório</strong>.</p>
        </div>
      )}
    </div>
  );
}
