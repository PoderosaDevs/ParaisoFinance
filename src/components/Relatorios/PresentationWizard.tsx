// src/components/Relatorios/PresentationWizard.tsx
// Aba "Apresentação": pergunta ao usuário o que ele quer apresentar e monta a
// configuração que alimenta o PresentationView (tela cheia).
import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, CalendarRange, ShoppingBag, Store as StoreIcon, TrendingUp, Play } from 'lucide-react';

import { marketplaceService, Marketplace } from '../../api-routes/marketplace';
import { storeService, Store } from '../../api-routes/store';

export type PresentationScope = 'current-month' | 'last-months' | 'marketplace' | 'store' | 'week';

export interface PresentationConfig {
  scope: PresentationScope;
  months?: number;
  marketplaceId?: string;
  marketplaceName?: string;
  storeId?: string;
  storeName?: string;
  weekAnchor?: string; // qualquer data ISO dentro da semana desejada
  title: string;
}

const SCOPE_OPTIONS: { value: PresentationScope; label: string; description: string; icon: JSX.Element }[] = [
  { value: 'current-month', label: 'Rendimento do Mês Atual', description: 'Panorama fechado do mês corrente.', icon: <CalendarClock className="w-4 h-4" /> },
  { value: 'last-months', label: 'Últimos Meses', description: 'Comparativo de N meses recentes.', icon: <TrendingUp className="w-4 h-4" /> },
  { value: 'marketplace', label: 'Marketplace e suas Lojas', description: 'Um canal específico e o desempenho de cada loja.', icon: <ShoppingBag className="w-4 h-4" /> },
  { value: 'store', label: 'Loja Específica', description: 'Aprofunda em uma única loja.', icon: <StoreIcon className="w-4 h-4" /> },
  { value: 'week', label: 'Semana Específica', description: 'Recorte de uma semana (segunda a domingo).', icon: <CalendarRange className="w-4 h-4" /> },
];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface PresentationWizardProps {
  onStart: (config: PresentationConfig) => void;
}

export function PresentationWizard({ onStart }: PresentationWizardProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [scope, setScope] = useState<PresentationScope | null>(null);

  const [months, setMonths] = useState(6);
  const [marketplaceId, setMarketplaceId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [weekAnchor, setWeekAnchor] = useState(todayIso());

  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [stores, setStores] = useState<Store[]>([]);

  useEffect(() => {
    Promise.all([marketplaceService.list(), storeService.list()])
      .then(([m, s]) => { setMarketplaces(m || []); setStores(s || []); })
      .catch((err) => console.error('Erro ao carregar metadados para apresentação:', err));
  }, []);

  const availableStores = useMemo(() => stores, [stores]);

  const chooseScope = (value: PresentationScope) => {
    setScope(value);
    setStep(2);
  };

  const canStart = useMemo(() => {
    if (scope === 'marketplace') return !!marketplaceId;
    if (scope === 'store') return !!storeId;
    return true;
  }, [scope, marketplaceId, storeId]);

  const handleStart = () => {
    if (!scope) return;

    let config: PresentationConfig;
    switch (scope) {
      case 'current-month':
        config = { scope, months: 1, title: 'Rendimento do Mês Atual' };
        break;
      case 'last-months':
        config = { scope, months, title: `Comparativo — Últimos ${months} Meses` };
        break;
      case 'marketplace': {
        const m = marketplaces.find((x) => x.id === marketplaceId);
        config = { scope, months, marketplaceId, marketplaceName: m?.name, title: `Marketplace: ${m?.name || marketplaceId}` };
        break;
      }
      case 'store': {
        const s = stores.find((x) => x.id === storeId);
        config = { scope, months, storeId, storeName: s?.name || storeId, title: `Loja: ${s?.name || storeId}` };
        break;
      }
      case 'week':
        config = { scope, weekAnchor, title: 'Semana Específica' };
        break;
      default:
        return;
    }
    onStart(config);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-bold text-gray-900 mb-1">1. O que você quer apresentar?</h3>
        <p className="text-xs text-gray-500 mb-4">Escolha o recorte — a apresentação abre em tela cheia, pronta para compartilhar.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => chooseScope(opt.value)}
              className={`text-left p-3 border cursor-pointer transition-colors flex flex-col gap-2 ${
                scope === opt.value ? 'border-brand-green bg-emerald-50/60' : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className={`h-7 w-7 flex items-center justify-center border ${scope === opt.value ? 'border-brand-green text-brand-green bg-white' : 'border-gray-200 text-gray-400'}`}>
                {opt.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">{opt.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{opt.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {step === 2 && scope && (
        <div className="bg-white border border-gray-200 shadow-sm p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">2. Detalhes</h3>

          {(scope === 'last-months' || scope === 'marketplace' || scope === 'store') && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Janela de meses</label>
              <div className="flex border border-gray-200 text-[11px] font-bold overflow-hidden w-fit">
                {[3, 6, 12].map((m) => (
                  <button key={m} onClick={() => setMonths(m)}
                    className={`px-3 py-2 cursor-pointer transition-colors ${months === m ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}>
                    {m} meses
                  </button>
                ))}
              </div>
            </div>
          )}

          {scope === 'marketplace' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Marketplace</label>
              <select value={marketplaceId} onChange={(e) => setMarketplaceId(e.target.value)}
                className="w-full lg:w-72 h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 cursor-pointer">
                <option value="">Selecione...</option>
                {marketplaces.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {scope === 'store' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Loja</label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)}
                className="w-full lg:w-72 h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-semibold text-gray-700 outline-none focus:border-gray-400 cursor-pointer">
                <option value="">Selecione...</option>
                {availableStores.map((s) => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
              </select>
            </div>
          )}

          {scope === 'week' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Qualquer dia da semana desejada</label>
              <input type="date" value={weekAnchor} onChange={(e) => setWeekAnchor(e.target.value)}
                className="w-full lg:w-72 h-9 border border-gray-200 bg-gray-50/50 px-2 text-xs font-mono outline-none focus:border-gray-400" />
              <p className="text-[10px] text-gray-400 mt-1">A apresentação usa a semana completa (segunda a domingo) que contém essa data.</p>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-5 h-10 text-xs font-bold cursor-pointer disabled:opacity-40"
          >
            <Play className="w-4 h-4" /> Iniciar Apresentação
          </button>
        </div>
      )}
    </div>
  );
}
