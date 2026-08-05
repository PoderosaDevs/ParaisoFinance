// src/components/Financeiro/FinanceiroSummary.tsx
import { FileSpreadsheet, CheckCircle2, AlertCircle, Wallet, DollarSign, Truck } from 'lucide-react';
import { SensitiveValue } from '../SensitiveValue';
import { Skeleton } from '../Skeleton';

interface FinanceiroSummaryProps {
  stats: {
    count: number;
    totalLiquido: number;
    totalRecebido: number;
    totalTaxas: number;
    freteETaxas: number;
    faltaReceber: number;
  };
  loading?: boolean;
}

export function FinanceiroSummary({ stats, loading = false }: FinanceiroSummaryProps) {
  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const cards = [
    {
      label: 'Vendas no Período', value: String(stats.count), icon: <FileSpreadsheet className="w-4 h-4" />,
      valueColor: 'text-gray-900', iconBg: 'bg-gray-50 border-gray-200 text-gray-500', sensitive: false,
    },
    {
      label: 'Receita Bruta (Prevista)', value: formatBRL(stats.totalLiquido), icon: <CheckCircle2 className="w-4 h-4" />,
      valueColor: 'text-gray-900', iconBg: 'bg-gray-50 border-gray-200 text-gray-500',
    },
    {
      label: 'Saldo a Receber', value: formatBRL(stats.faltaReceber), icon: <AlertCircle className="w-4 h-4" />,
      valueColor: 'text-amber-700', iconBg: 'bg-amber-50 border-amber-100 text-amber-700',
    },
    {
      label: 'Receita Conciliada (Recebida)', value: formatBRL(stats.totalRecebido), icon: <Wallet className="w-4 h-4" />,
      valueColor: 'text-emerald-700', iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    },
    {
      label: 'Comissões de Marketplace', value: formatBRL(stats.totalTaxas), icon: <DollarSign className="w-4 h-4" />,
      valueColor: 'text-gray-900', iconBg: 'bg-gray-50 border-gray-200 text-gray-500',
    },
    {
      label: 'Custos de Logística e Frete', value: formatBRL(stats.freteETaxas), icon: <Truck className="w-4 h-4" />,
      valueColor: 'text-gray-900', iconBg: 'bg-gray-50 border-gray-200 text-gray-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
            {loading ? (
              <Skeleton className="h-6 w-24 mt-2" />
            ) : card.sensitive === false ? (
              <h3 className={`text-xl font-mono font-bold mt-1 ${card.valueColor}`}>{card.value}</h3>
            ) : (
              <SensitiveValue as="h3" className={`text-xl font-mono font-bold mt-1 ${card.valueColor}`}>
                {card.value}
              </SensitiveValue>
            )}
          </div>
          <div className={`h-8 w-8 shrink-0 border flex items-center justify-center ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}
