// src/components/Financeiro/FinanceiroSummary.tsx
import { FileSpreadsheet, CheckCircle2, AlertCircle, Wallet, DollarSign, Truck } from 'lucide-react';

interface FinanceiroSummaryProps {
  stats: {
    count: number;
    totalLiquido: number;
    totalRecebido: number;
    totalTaxas: number;
    freteETaxas: number;
    faltaReceber: number;
  };
}

export function FinanceiroSummary({ stats }: FinanceiroSummaryProps) {
  const formatBRL = (value: number) => 
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendas no Período</p>
          <h3 className="text-xl font-mono font-bold text-gray-900 mt-1">{stats.count}</h3>
        </div>
        <div className="h-8 w-8 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
          <FileSpreadsheet className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Bruta (Prevista)</p>
          <h3 className="text-xl font-mono font-bold text-gray-900 mt-1">{formatBRL(stats.totalLiquido)}</h3>
        </div>
        <div className="h-8 w-8 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Saldo a Receber</p>
          <h3 className="text-xl font-mono font-bold text-amber-700 mt-1">{formatBRL(stats.faltaReceber)}</h3>
        </div>
        <div className="h-8 w-8 bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
          <AlertCircle className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Receita Conciliada (Recebida)</p>
          <h3 className="text-xl font-mono font-bold text-emerald-700 mt-1">{formatBRL(stats.totalRecebido)}</h3>
        </div>
        <div className="h-8 w-8 bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
          <Wallet className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Comissões de Marketplace</p>
          <h3 className="text-xl font-mono font-bold text-gray-900 mt-1">{formatBRL(stats.totalTaxas)}</h3>
        </div>
        <div className="h-8 w-8 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
          <DollarSign className="w-4 h-4" />
        </div>
      </div>

      <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Custos de Logística e Frete</p>
          <h3 className="text-xl font-mono font-bold text-gray-900 mt-1">{formatBRL(stats.freteETaxas)}</h3>
        </div>
        <div className="h-8 w-8 bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500">
          <Truck className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}