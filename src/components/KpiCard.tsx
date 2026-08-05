// src/components/KpiCard.tsx
import { ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { SensitiveValue } from './SensitiveValue';
import { Skeleton } from './Skeleton';

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  loading?: boolean;
  accent?: 'default' | 'green' | 'amber' | 'red';
  variationPercent?: number;
  sensitive?: boolean;
}

const ACCENT_STYLES: Record<string, { iconBg: string; iconColor: string; valueColor: string }> = {
  default: { iconBg: 'bg-gray-50 border-gray-200', iconColor: 'text-gray-500', valueColor: 'text-gray-900' },
  green: { iconBg: 'bg-emerald-50 border-emerald-100', iconColor: 'text-emerald-700', valueColor: 'text-emerald-700' },
  amber: { iconBg: 'bg-amber-50 border-amber-100', iconColor: 'text-amber-700', valueColor: 'text-amber-700' },
  red: { iconBg: 'bg-rose-50 border-rose-100', iconColor: 'text-rose-700', valueColor: 'text-rose-700' },
};

export function KpiCard({ label, value, icon, loading, accent = 'default', variationPercent, sensitive = true }: KpiCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="bg-white p-4 border border-gray-200 shadow-sm flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>

        {loading ? (
          <Skeleton className="h-6 w-24 mt-2" />
        ) : sensitive ? (
          <SensitiveValue as="h3" className={`text-xl font-mono font-bold mt-1 ${styles.valueColor}`}>
            {value}
          </SensitiveValue>
        ) : (
          <h3 className={`text-xl font-mono font-bold mt-1 ${styles.valueColor}`}>{value}</h3>
        )}

        {typeof variationPercent === 'number' && !loading && (
          <div className={`flex items-center gap-0.5 mt-1 text-[10px] font-bold ${variationPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {variationPercent >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(variationPercent).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% vs mês anterior
          </div>
        )}
      </div>
      <div className={`h-9 w-9 shrink-0 border flex items-center justify-center ${styles.iconBg} ${styles.iconColor}`}>
        {icon}
      </div>
    </div>
  );
}
