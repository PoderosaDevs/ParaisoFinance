// src/components/Relatorios/PresentationView.tsx
// Modo Apresentação: cobre a tela inteira com um resumo pronto para compartilhar
// (projetor, reunião, print). Reaproveita /dashboard/summary e /reports/generate —
// nenhum dado novo é escrito, é 100% leitura.
import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { X, Loader2, AlertTriangle, Printer } from 'lucide-react';

import { dashboardService, DashboardSummaryResponse } from '../../api-routes/dashboard';
import { reportService, ReportResponse } from '../../api-routes/reports';
import { VisibilityToggle } from '../VisibilityToggle';
import { SensitiveValue } from '../SensitiveValue';
import { PresentationConfig } from './PresentationWizard';

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function startOfWeek(dateIso: string): Date {
  const [y, m, d] = dateIso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  return date;
}
function toIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatBrDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

interface PresentationViewProps {
  config: PresentationConfig;
  onExit: () => void;
}

export function PresentationView({ config, onExit }: PresentationViewProps) {
  const [dashboardData, setDashboardData] = useState<DashboardSummaryResponse | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekRange, setWeekRange] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onExit(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onExit]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (config.scope === 'week') {
          const anchor = config.weekAnchor || toIso(new Date());
          const start = startOfWeek(anchor);
          const end = new Date(start);
          end.setDate(end.getDate() + 6);
          const range = { start: toIso(start), end: toIso(end) };
          if (active) setWeekRange(range);

          const response = await reportService.generate({ type: 'store', startDate: range.start, endDate: range.end });
          if (active) setReportData(response);
        } else {
          const response = await dashboardService.summary({
            months: config.months || 6,
            marketplaceId: config.marketplaceId,
            storeId: config.storeId,
          });
          if (active) setDashboardData(response);
        }
      } catch (err: any) {
        console.error('Erro ao carregar apresentação:', err);
        if (active) setError(err.message || 'Não foi possível carregar os dados da apresentação.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [config]);

  const subtitle = (() => {
    if (config.scope === 'week' && weekRange) return `Semana de ${formatBrDate(weekRange.start)} a ${formatBrDate(weekRange.end)}`;
    if (dashboardData) return `Período: ${formatBrDate(dashboardData.range.start)} a ${formatBrDate(dashboardData.range.end)}`;
    return '';
  })();

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col text-slate-950">
      {/* Barra superior — não aparece na impressão */}
      <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{config.title}</h1>
          <p className="text-xs text-gray-500 font-mono">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <VisibilityToggle />
          <button onClick={() => window.print()} className="h-9 w-9 flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 cursor-pointer" title="Imprimir / Exportar PDF">
            <Printer className="w-4 h-4" />
          </button>
          <button onClick={onExit} className="h-9 px-4 flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold cursor-pointer" title="Sair (Esc)">
            <X className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {loading && (
          <div className="h-full flex items-center justify-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin" /> Preparando apresentação...
          </div>
        )}

        {error && !loading && (
          <div className="max-w-lg mx-auto mt-16 p-4 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && dashboardData && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PresentationKpi label="Vendas no Período" value={String(dashboardData.kpis.vendasPeriodo)} sensitive={false} />
              <PresentationKpi label="Receita Bruta" value={formatBRL(dashboardData.kpis.receitaBruta)} />
              <PresentationKpi label="Receita Líquida Recebida" value={formatBRL(dashboardData.kpis.receitaLiquida)} highlight />
              <PresentationKpi label="Ticket Médio" value={formatBRL(dashboardData.kpis.ticketMedio)} />
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Evolução no Período</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dashboardData.monthlySeries} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 0 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="receitaBruta" name="Receita Bruta" stroke="#0f172a" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="receitaLiquida" name="Receita Líquida" stroke="#064E3B" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {dashboardData.byMarketplace.length > 1 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Receita Líquida por Marketplace</h2>
                <div className="space-y-2">
                  {dashboardData.byMarketplace.map((m) => {
                    const max = Math.max(...dashboardData.byMarketplace.map((x) => x.receitaLiquida), 1);
                    return (
                      <div key={m.id} className="flex items-center gap-3">
                        <span className="w-32 text-xs font-semibold text-gray-700 truncate">{m.name}</span>
                        <div className="flex-1 h-5 bg-gray-100">
                          <div className="h-full bg-brand-green" style={{ width: `${(m.receitaLiquida / max) * 100}%` }} />
                        </div>
                        <SensitiveValue showToggle={false} className="w-28 text-right text-xs font-mono text-gray-700">{formatBRL(m.receitaLiquida)}</SensitiveValue>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {dashboardData.topStores.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-sm font-bold text-gray-900 mb-4">Top Lojas</h2>
                <div className="space-y-2">
                  {dashboardData.topStores.map((s) => {
                    const max = Math.max(...dashboardData.topStores.map((x) => x.receitaLiquida), 1);
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <span className="w-40 text-xs font-semibold text-gray-700 truncate">{s.name}</span>
                        <div className="flex-1 h-5 bg-gray-100">
                          <div className="h-full bg-gray-900" style={{ width: `${(s.receitaLiquida / max) * 100}%` }} />
                        </div>
                        <SensitiveValue showToggle={false} className="w-28 text-right text-xs font-mono text-gray-700">{formatBRL(s.receitaLiquida)}</SensitiveValue>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && reportData && (
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <PresentationKpi label="Vendas na Semana" value={String(reportData.totals.vendas)} sensitive={false} />
              <PresentationKpi label="Receita Bruta" value={formatBRL(reportData.totals.receitaBruta)} />
              <PresentationKpi label="Receita Líquida Recebida" value={formatBRL(reportData.totals.receitaLiquida)} highlight />
              <PresentationKpi label="Margem sobre Faturamento" value={`${reportData.totals.margemPercent}%`} sensitive={false} />
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-sm font-bold text-gray-900 mb-4">Receita Líquida por Loja na Semana</h2>
              {reportData.rows.length === 0 ? (
                <p className="text-xs text-gray-400">Nenhuma venda registrada nessa semana.</p>
              ) : (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.rows} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} angle={-35} textAnchor="end" interval={0} height={70} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value: number) => formatBRL(value)} contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 0 }} />
                      <Bar dataKey="receitaLiquida" name="Receita Líquida" fill="#064E3B" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PresentationKpi({ label, value, highlight, sensitive = true }: { label: string; value: string; highlight?: boolean; sensitive?: boolean }) {
  return (
    <div className={`p-5 border ${highlight ? 'border-brand-green bg-emerald-50/60' : 'border-gray-200 bg-white'}`}>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      {sensitive ? (
        <SensitiveValue as="h3" className={`text-2xl font-mono font-bold mt-1 ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</SensitiveValue>
      ) : (
        <h3 className={`text-2xl font-mono font-bold mt-1 ${highlight ? 'text-emerald-700' : 'text-gray-900'}`}>{value}</h3>
      )}
    </div>
  );
}
