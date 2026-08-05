import { useMemo, useState } from 'react';
import { Search, Filter, ChevronDown, Check, X } from 'lucide-react';
import { Marketplace, STATUS_OPTIONS } from '../../types/financeiro';
import { Store } from '../../api-routes/store';
import { DateRangePicker } from './DateRangePicker';

interface FinanceiroFiltersProps {
  search: string;
  setSearch: (val: string) => void;
  marketplaceFilter: string;
  setMarketplaceFilter: (val: string) => void;
  storeFilter: string;
  setStoreFilter: (val: string) => void;
  /** Lista completa de lojas — o componente filtra sozinho pelo marketplace selecionado */
  stores: Store[];
  statusFilter: string[];
  setStatusFilter: React.Dispatch<React.SetStateAction<string[]>>;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  marketplaces: Marketplace[];
  handleClearFilters: () => void;
  hasActiveFilters: boolean;
}

export function FinanceiroFilters({
  search, setSearch,
  marketplaceFilter, setMarketplaceFilter,
  storeFilter, setStoreFilter,
  stores,
  statusFilter, setStatusFilter,
  startDate, setStartDate,
  endDate, setEndDate,
  marketplaces,
  handleClearFilters,
  hasActiveFilters
}: FinanceiroFiltersProps) {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  // Harmonia entre filtros: a lista de lojas exibida reflete o marketplace selecionado.
  // Isso evita que o usuário escolha uma combinação impossível (loja de um canal + marketplace de outro).
  const availableStores = useMemo(() => {
    if (marketplaceFilter === 'all') return stores;
    return stores.filter((s) => s.marketplaceId === marketplaceFilter);
  }, [stores, marketplaceFilter]);

  const handleMarketplaceChange = (value: string) => {
    setMarketplaceFilter(value);
    // Se a loja atualmente selecionada não pertence ao novo marketplace, reseta para "Todas as Lojas"
    if (value !== 'all' && storeFilter !== 'all') {
      const stillValid = stores.some((s) => s.id === storeFilter && s.marketplaceId === value);
      if (!stillValid) setStoreFilter('all');
    }
  };

  // Corrigido para formatar a string de data completa (Ex: 2026-06-01 vira 01/06/2026)
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return dateString;
  };

  const handleStatusToggle = (status: string) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  return (
    <div className="bg-white p-3 border border-gray-200 shadow-sm flex flex-col lg:flex-row gap-3 items-center w-full">
      <div className="relative flex-1 w-full">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-4 h-4 pointer-events-none">
          <Search className="w-full h-full text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Buscar por NF, Loja..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 h-9 border border-gray-200 bg-gray-50/50 focus:bg-white text-xs text-gray-800 outline-none focus:border-gray-400 font-medium"
        />
      </div>

      <div className="relative w-full lg:w-auto">
        <button
          onClick={() => setIsStatusOpen(!isStatusOpen)}
          className="w-full lg:w-auto h-9 justify-between border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 hover:bg-gray-100 px-3 flex items-center gap-2 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span>Status</span>
            {statusFilter.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-gray-900 text-white">
                {statusFilter.length}
              </span>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 opacity-50 ml-2" />
        </button>

        {isStatusOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsStatusOpen(false)} />
            <div className="absolute left-0 mt-1 w-64 p-1 bg-white border border-gray-200 shadow-xl z-20 max-h-72 overflow-y-auto">
              {STATUS_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer text-xs transition-colors ${
                    statusFilter.includes(option.value) ? "bg-gray-100 text-gray-900 font-bold" : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 border flex items-center justify-center transition-all ${
                    statusFilter.includes(option.value) ? "bg-gray-900 border-gray-900" : "border-gray-300"
                  }`}>
                    {statusFilter.includes(option.value) && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span>{option.icon} {option.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="w-full lg:w-[160px]">
        <select
          value={marketplaceFilter}
          onChange={(e) => handleMarketplaceChange(e.target.value)}
          className="w-full h-9 border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 px-2 outline-none focus:border-gray-400 cursor-pointer"
        >
          <option value="all">Todos Canais</option>
          {marketplaces.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="w-full lg:w-[160px]">
        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          disabled={availableStores.length === 0}
          title={availableStores.length === 0 ? 'Nenhuma loja para o canal selecionado' : undefined}
          className="w-full h-9 border border-gray-200 bg-gray-50/50 text-xs font-semibold text-gray-700 px-2 outline-none focus:border-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="all">Todas as Lojas {marketplaceFilter !== 'all' ? `(${availableStores.length})` : ''}</option>
          {availableStores.map((store) => (
            <option key={store.id} value={store.id}>
              {store.name || store.id}
            </option>
          ))}
        </select>
      </div>

      {/* Invoca o Date Picker Customizado integrado */}
      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        formatDateDisplay={formatDateDisplay}
      />

      {hasActiveFilters && (
        <button onClick={handleClearFilters} className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50 transition-all flex items-center justify-center shrink-0 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}