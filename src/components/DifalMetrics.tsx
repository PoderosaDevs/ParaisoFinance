// apps/web/src/components/DifalMetrics.tsx
import { Loader2, MapPinned, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { DifalMetricasResponse } from "../api-routes/difal.ts";

interface DifalMetricsProps {
  metrics: DifalMetricasResponse | null;
  loading: boolean;
}

function formatValor(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function DifalMetrics({ metrics, loading }: DifalMetricsProps) {
  if (loading) {
    return (
      <div className="py-16 flex justify-center items-center bg-white border border-gray-200 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!metrics || metrics.porEstado.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm text-gray-400">
        <MapPinned className="w-6 h-6" />
        <p className="text-xs font-semibold">Nenhum dado de DIFAL para exibir métricas ainda.</p>
      </div>
    );
  }

  const maiorValor = Math.max(...metrics.porEstado.map((e) => e.valorTotal), 1);
  const estadosOrdenados = [...metrics.porEstado].sort((a, b) => b.valorTotal - a.valorTotal);

  return (
    <div className="space-y-4">
      {/* Cards de resumo geral */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <TrendingUp className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Valor total</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1.5">
            {formatValor(metrics.valorTotalGeral)}
          </p>
          <p className="text-[11px] text-gray-500 mt-0.5">
            {metrics.totalNotas} {metrics.totalNotas === 1 ? "nota" : "notas"} no total
          </p>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Recolhido</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1.5">
            {formatValor(metrics.valorRecolhidoGeral)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Pendente</span>
          </div>
          <p className="text-lg font-bold text-gray-900 mt-1.5">
            {formatValor(metrics.valorPendenteGeral)}
          </p>
        </div>
      </div>

      {/* Ranking por estado */}
      <div className="bg-white border border-gray-200 shadow-sm p-1">
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">DIFAL por Estado</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Valor total, recolhido e pendente por UF de destino.
          </p>
        </div>

        <div className="p-4 space-y-3">
          {estadosOrdenados.map((e) => (
            <div key={e.estado} className="flex items-center gap-3">
              <span className="w-9 shrink-0 text-xs font-bold text-gray-700">{e.estado}</span>

              <div className="flex-1">
                <div className="h-5 bg-gray-100 relative overflow-hidden">
                  <div
                    className="h-full bg-gray-900"
                    style={{ width: `${(e.valorTotal / maiorValor) * 100}%` }}
                  />
                </div>
              </div>

              <span className="w-28 shrink-0 text-right text-xs font-semibold text-gray-800">
                {formatValor(e.valorTotal)}
              </span>
              <span className="w-16 shrink-0 text-right text-[11px] text-gray-500">
                {e.totalNotas} {e.totalNotas === 1 ? "nota" : "notas"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}