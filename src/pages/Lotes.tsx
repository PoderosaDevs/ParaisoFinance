import { useState, useEffect } from 'react';
import { 
  Layers, Loader2, AlertTriangle, RefreshCw, Eye, Trash2, 
  Layers3, ShoppingBag, CreditCard, X, CheckCircle2, Info, Pencil, Check,
  ArrowLeftRight, // Novo ícone para devoluções
  Search, CalendarRange, SlidersHorizontal, XCircle, ListFilter
} from 'lucide-react';

import Table, { Column } from '../components/Table';
import Modal from '../components/Modal';

// Consome o serviço unificado criado nos passos anteriores
import { batchService, Batch as ApiBatch, BatchListFilters } from '../api-routes/batch';

interface UnifiedBatch {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  recordsCount: number;
  totalValue: number;
  originType: 'sale' | 'payment' | 'devolution';
}

interface AlertState {
  show: boolean;
  type: 'success' | 'error' | 'warning';
  title: string;
  message: string;
}

interface ConfirmModalState {
  show: boolean;
  batchId: string;
  batchName: string;
  originType: 'sale' | 'payment' | 'devolution';
}

type TypeFilterOption = 'all' | 'sale' | 'payment' | 'devolution';

// Mapeia o filtro amigável do front para o valor de "type" esperado pela API
const TYPE_FILTER_TO_API: Record<TypeFilterOption, BatchListFilters['type']> = {
  all: undefined,
  sale: 'SALES',
  payment: 'PAYMENTS',
  devolution: 'DEVOLUTIONS'
};

export default function Lotes() {
  // ─── ESTADOS DE INFRAESTRUTURA ───
  const [unifiedBatches, setUnifiedBatches] = useState<UnifiedBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // ─── ESTADOS DE EDIÇÃO EM LINHA (RENAME) ───
  const [editingBatchId, setEditingBatchId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [renamingLoading, setRenamingLoading] = useState<boolean>(false);

  // ─── ESTADOS DOS FILTROS DE BUSCA DO LOTE (valores "crus", controlam os inputs) ───
  const [searchText, setSearchText] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<TypeFilterOption>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [valueMin, setValueMin] = useState<string>('');
  const [valueMax, setValueMax] = useState<string>('');

  // ─── VERSÕES "DEBOUNCED" (usadas de fato na chamada à API, evitam 1 request por tecla) ───
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [debouncedValueMin, setDebouncedValueMin] = useState<string>('');
  const [debouncedValueMax, setDebouncedValueMax] = useState<string>('');

  // ─── ESTADOS DE ALERTAS CUSTOMIZADOS ───
  const [alert, setAlert] = useState<AlertState>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    show: false,
    batchId: '',
    batchName: '',
    originType: 'sale'
  });

  // ─── ESTADOS DO MODAL DE PREVIEW INTERNO ───
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<any | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<'sale' | 'payment' | 'devolution'>('sale');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Auxiliar para disparar feedbacks bonitos na tela
  const triggerAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlert({ show: true, type, title, message });
    if (type === 'success') {
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
    }
  };

  // Converte uma string mascarada em formato de moeda BRL (ex: "R$ 1.234,56") para number
  const parseCurrencyToNumber = (masked: string): number | undefined => {
    if (!masked.trim()) return undefined;
    const cleaned = masked.replace(/[^\d,-]/g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    return isNaN(value) ? undefined : value;
  };

  // ─── CARREGAMENTO INTEGRADO E UNIFICADO ATRAVÉS DO BATCH_SERVICE (agora com filtros server-side) ───
  const loadAllBatches = async (currentPage: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const filters: BatchListFilters = {
        search: debouncedSearch.trim() || undefined,
        type: TYPE_FILTER_TO_API[typeFilter],
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        valueMin: parseCurrencyToNumber(debouncedValueMin),
        valueMax: parseCurrencyToNumber(debouncedValueMax)
      };

      const response = await batchService.list(currentPage, 10, filters);

      const consolidated = (response.data || []).map((b: ApiBatch) => {
        // Tratativa dinâmica do tipo baseado no retorno da API
        let originType: 'sale' | 'payment' | 'devolution' = 'sale';
        if (b.type === 'PAYMENTS') originType = 'payment';
        if (b.type === 'DEVOLUTIONS') originType = 'devolution';

        return {
          id: b.id,
          name: b.name,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          recordsCount: Number(b.salesCount  || 0), // Fallback caso mude o nome da propriedade na API
          totalValue: Number(b.totalBaseIcms || 0),
          originType
        };
      });

      setUnifiedBatches(consolidated);
      setTotalRecords(response.meta?.totalRecords || 0);
      setTotalPages(response.meta?.totalPages || 1);
      
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar os lotes operacionais.');
    } finally {
      setLoading(false);
    }
  };

  // Debounce da busca textual: só atualiza debouncedSearch (e reseta a página) 400ms após parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Debounce da faixa de valores: mesma lógica, só dispara a busca depois que o usuário parar de digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValueMin(valueMin);
      setDebouncedValueMax(valueMax);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [valueMin, valueMax]);

  // Dispara a busca sempre que a página ou algum filtro (já debounced) mudar
  useEffect(() => {
    loadAllBatches(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch, typeFilter, dateFrom, dateTo, debouncedValueMin, debouncedValueMax]);

  const hasActiveFilters = Boolean(
    searchText.trim() || typeFilter !== 'all' || dateFrom || dateTo || valueMin.trim() || valueMax.trim()
  );

  const clearFilters = () => {
    setSearchText('');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
    setValueMin('');
    setValueMax('');
    setDebouncedSearch('');
    setDebouncedValueMin('');
    setDebouncedValueMax('');
    setPage(1);
  };

  // Filtro por tipo e por data já refletem na hora (sem debounce), então resetam a página imediatamente
  const handleTypeFilterChange = (value: TypeFilterOption) => {
    setTypeFilter(value);
    setPage(1);
  };

  const handleDateFromChange = (value: string) => {
    setDateFrom(value);
    setPage(1);
  };

  const handleDateToChange = (value: string) => {
    setDateTo(value);
    setPage(1);
  };

  // Aplica máscara de moeda (BRL) enquanto o usuário digita nos campos de valor
  const formatCurrencyInput = (rawValue: string): string => {
    const digits = rawValue.replace(/\D/g, '');
    if (!digits) return '';
    const numeric = parseInt(digits, 10) / 100;
    return numeric.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const handleValueMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueMin(formatCurrencyInput(e.target.value));
  };

  const handleValueMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValueMax(formatCurrencyInput(e.target.value));
  };

  // ─── MANIPULAÇÃO DO PROCESSO DE RENOMEAR LOTE ───
  const startRename = (id: string, currentName: string) => {
    setEditingBatchId(id);
    setEditingNameValue(currentName);
  };

  const handleExecuteRename = async (id: string) => {
    if (!editingNameValue.trim()) {
      triggerAlert('warning', 'Validação', 'O nome do lote não pode ficar em branco.');
      return;
    }

    setRenamingLoading(true);
    try {
      await batchService.rename(id, editingNameValue.trim());
      
      setUnifiedBatches(prev => 
        prev.map(b => b.id === id ? { ...b, name: editingNameValue.trim() } : b)
      );
      
      triggerAlert('success', 'Lote Renomeado', 'O nome do lote foi updated com sucesso.');
      setEditingBatchId(null);
    } catch (err: any) {
      triggerAlert('error', 'Falha ao renomear', err.message || 'Não foi possível alterar a descrição.');
    } finally {
      setRenamingLoading(false);
    }
  };

  // ─── REMOÇÃO INTELIGENTE VIA CONFIRMAÇÃO CUSTOMIZADA ───
  const openDeleteConfirmation = (id: string, name: string, originType: 'sale' | 'payment' | 'devolution') => {
    setConfirmModal({
      show: true,
      batchId: id,
      batchName: name,
      originType
    });
  };

  const executeDeleteBatch = async () => {
    const { batchId, batchName } = confirmModal;
    setConfirmModal(prev => ({ ...prev, show: false }));
    
    try {
      await batchService.delete(batchId);
      triggerAlert('success', 'Sucesso na exclusão', `O lote "${batchName}" foi limpo e removido do sistema.`);
      loadAllBatches(page);
    } catch (err: any) {
      triggerAlert('error', 'Falha ao remover', err.message || 'Erro crítico durante a limpeza de dados.');
    }
  };

  // ─── INSPEÇÃO DINÂMICA ───
  const handleOpenPreview = async (id: string, originType: 'sale' | 'payment' | 'devolution') => {
    setLoadingDetails(true);
    setIsPreviewOpen(true);
    setPreviewOrigin(originType);

    try {
      const details = await batchService.getDetails(id);
      setSelectedBatchDetails(details);
    } catch (err: any) {
      triggerAlert('error', 'Erro de partição', err.message || 'Não foi possível ler as linhas deste lote.');
      setIsPreviewOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // ─── CONFIGURAÇÃO DE COLUNAS DA TABELA PRINCIPAL ───
  const mainColumns: Column<UnifiedBatch>[] = [
    {
      header: 'Identificador do Lote',
      render: (b) => <span className="font-mono text-xs text-gray-400 font-bold">{b.id}</span>
    },
    {
      header: 'Nome do Arquivo / Descrição',
      render: (b) => {
        const isEditing = editingBatchId === b.id;

        if (isEditing) {
          return (
            <div className="flex items-center gap-1.5 max-w-xs sm:max-w-md">
              <input 
                type="text"
                value={editingNameValue}
                onChange={(e) => setEditingNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleExecuteRename(b.id);
                  if (e.key === 'Escape') setEditingBatchId(null);
                }}
                disabled={renamingLoading}
                className="flex-1 px-2 py-1 text-xs border border-slate-300 focus:outline-none focus:border-indigo-500 font-medium text-gray-950 bg-white rounded-md shadow-inner"
                autoFocus
              />
              <button 
                onClick={() => handleExecuteRename(b.id)}
                disabled={renamingLoading}
                className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer disabled:opacity-50"
              >
                {renamingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button 
                onClick={() => setEditingBatchId(null)}
                disabled={renamingLoading}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-md cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        }

        return (
          <div 
            onClick={() => startRename(b.id, b.name)}
            className="group flex items-center gap-1.5 cursor-pointer max-w-fit"
            title="Clique para renomear este lote"
          >
            <span className="font-semibold text-gray-900 text-xs border-b border-dashed border-gray-400 group-hover:border-slate-800 group-hover:text-slate-950 transition-colors">
              {b.name}
            </span>
            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </div>
        );
      }
    },
    {
      header: 'Tipo de Lote',
      render: (b) => {
        // Centralização do estilo das Badges por tipo de lote
        const badgeStyles = {
          payment: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-100', icon: <CreditCard className="w-3 h-3" />, label: 'Pagamentos' },
          sale: { bg: 'bg-green-50 text-green-700 border-green-100', icon: <ShoppingBag className="w-3 h-3" />, label: 'Vendas' },
          devolution: { bg: 'bg-amber-50 text-amber-700 border-amber-100', icon: <ArrowLeftRight className="w-3 h-3" />, label: 'Devoluções' }
        };

        const currentStyle = badgeStyles[b.originType] || badgeStyles.sale;

        return (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 border ${currentStyle.bg}`}>
            {currentStyle.icon}
            {currentStyle.label}
          </span>
        );
      }
    },
    {
      header: 'Registros',
      align: 'right',
      render: (b) => <span className="font-mono text-xs font-bold text-gray-700">{b.recordsCount} linhas</span>
    },
    {
      header: 'Valor Total',
      align: 'right',
      render: (b) => (
        <span className="font-mono font-bold text-slate-900">
          {b.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Data Upload',
      render: (b) => (
        <span className="text-gray-500 font-medium text-xs">
          {new Date(b.createdAt).toLocaleDateString('pt-BR')} às {new Date(b.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      )
    },
    {
      header: 'Ações',
      align: 'center',
      render: (b) => (
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => handleOpenPreview(b.id, b.originType)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer rounded-lg"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => openDeleteConfirmation(b.id, b.name, b.originType)}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // ─── CONFIGURAÇÕES DE COLUNAS DOS PREVIEWS ESPECÍFICOS ───
  const salesPreviewColumns: Column<any>[] = [
    { header: 'Nota Fiscal', render: (s) => <span className="font-mono text-xs font-bold">Nº {s.nf}</span> },
    { header: 'Data Emissão', render: (s) => <span className="text-gray-600">{s.date ? new Date(s.date).toLocaleDateString('pt-BR') : 'S/D'}</span> },
    { header: 'ID Loja', render: (s) => <span className="font-mono text-gray-500 text-xs">{s.storeId}</span> },
    { 
      header: 'Base ICMS (Bruto)', 
      align: 'right',
      render: (s) => <span className="font-mono font-bold text-emerald-700">{(s.baseIcms || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> 
    }
  ];

  const paymentsPreviewColumns: Column<any>[] = [
    { header: 'ID Pagamento', render: (p) => <span className="font-mono text-xs text-gray-400">{p.id}</span> },
    { header: 'Venda Relacionada (NF)', render: (p) => <span className="font-semibold text-gray-900">{p.sale?.nf ? `NF: ${p.sale.nf}` : 'Venda Não Localizada'}</span> },
    { 
      header: 'Custos/Taxas', 
      align: 'right',
      render: (p) => <span className="text-red-600 font-mono text-xs">-{Number(p.fretesTaxas || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
    },
    { 
      header: 'Repasse Líquido', 
      align: 'right',
      render: (p) => <span className="font-mono font-bold text-indigo-700">{Number(p.repasse || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> 
    }
  ];

  // Nova tabela de visualização para devoluções
  const devolutionsPreviewColumns: Column<any>[] = [
    { header: 'Cód. Devolução', render: (d) => <span className="font-mono text-xs font-bold">{d.id || d.devolutionCode}</span> },
    { header: 'NF Original', render: (d) => <span className="font-mono text-xs text-gray-600">{d.originalNf ? `NF: ${d.originalNf}` : 'Não Informada'}</span> },
    { header: 'Motivo', render: (d) => <span className="text-xs text-gray-600 truncate max-w-xs">{d.reason || 'Não Especificado'}</span> },
    { 
      header: 'Valor Estornado', 
      align: 'right',
      render: (d) => <span className="font-mono font-bold text-amber-700">{(d.value || d.totalValue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> 
    }
  ];

  // Auxiliar dinâmico para decidir qual coluna e array de dados usar no Modal de Preview
  const getPreviewConfig = () => {
    if (!selectedBatchDetails) return { columns: [], data: [] };
    
    switch (previewOrigin) {
      case 'payment':
        return { columns: paymentsPreviewColumns, data: selectedBatchDetails.payments || [] };
      case 'devolution':
        return { columns: devolutionsPreviewColumns, data: selectedBatchDetails.devolutions || selectedBatchDetails.items || [] };
      case 'sale':
      default:
        return { columns: salesPreviewColumns, data: selectedBatchDetails.sales || [] };
    }
  };

  const previewConfig = getPreviewConfig();

  // Texto amigável do título do modal baseado no tipo de origem
  const getModalTitle = () => {
    switch (previewOrigin) {
      case 'payment': return 'Repasses de Cartão/Marketplace';
      case 'devolution': return 'Devoluções e Estornos';
      case 'sale': return 'Notas Fiscais de Venda';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-slate-950 relative">
      
      {/* ─── BANNER DINÂMICO DE FEEDBACK ─── */}
      {alert.show && (
        <div className={`fixed top-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl border shadow-xl max-w-md animate-in slide-in-from-top-4 duration-300 ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 
          alert.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {alert.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {alert.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
          {alert.type === 'warning' && <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
          
          <div className="flex-1">
            <h4 className="text-sm font-bold">{alert.title}</h4>
            <p className="text-xs mt-1 text-slate-600 font-medium leading-relaxed">{alert.message}</p>
          </div>
          <button 
            onClick={() => setAlert(prev => ({ ...prev, show: false }))} 
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lotes Importados</h1>
        <p className="text-sm text-gray-500">Audite de forma centralizada os históricos unificados de arquivos de Vendas, Repasses Financeiros e Devoluções.</p>
      </header>

      {/* ─── BARRA DE FILTROS E AÇÃO DE ATUALIZAR (filtros aplicados via API) ─── */}
      <div className="p-4 bg-white border border-gray-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <SlidersHorizontal size={14} /> Filtros de Busca
          </h2>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Limpar filtros
              </button>
            )}
            <button
              onClick={() => loadAllBatches(page)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Busca textual por nome/ID do lote (debounced) */}
          <div className="relative lg:col-span-2">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Buscar por nome ou ID do lote..."
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-900 bg-white"
            />
          </div>

          {/* Filtro por tipo de lote */}
          <div className="relative">
            <ListFilter className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value as TypeFilterOption)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-900 bg-white appearance-none cursor-pointer"
            >
              <option value="all">Todos os tipos</option>
              <option value="sale">Vendas</option>
              <option value="payment">Pagamentos</option>
              <option value="devolution">Devoluções</option>
            </select>
          </div>

          {/* Filtro por intervalo de datas */}
          <div className="flex items-center gap-1.5">
            <CalendarRange className="w-3.5 h-3.5 text-gray-400 shrink-0 hidden sm:block" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 bg-white"
              title="Data inicial"
            />
            <span className="text-gray-300 text-xs">–</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 bg-white"
              title="Data final"
            />
          </div>

          {/* Filtro por faixa de valor total (com máscara de moeda, debounced) */}
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              value={valueMin}
              onChange={handleValueMinChange}
              placeholder="R$ mín."
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 bg-white"
            />
            <span className="text-gray-300 text-xs">–</span>
            <input
              type="text"
              inputMode="numeric"
              value={valueMax}
              onChange={handleValueMaxChange}
              placeholder="R$ máx."
              className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400 text-gray-700 bg-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">Aviso de Infraestrutura do Banco</h4>
            <p className="text-xs mt-0.5 text-amber-800 font-medium">{error}</p>
          </div>
          <button onClick={() => loadAllBatches(page)} className="p-1 hover:bg-amber-100 text-amber-700 shrink-0 rounded-lg cursor-pointer">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-slate-800 animate-spin" />
          <span className="text-xs font-bold text-gray-500 font-mono">Buscando dados nos bancos operacionais...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Layers size={16} /> Consolidação de Entradas
            </h2>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-200 font-mono">
              {totalRecords} Registros no Total
            </span>
          </div>
          
          <Table columns={mainColumns} data={unifiedBatches} />

          {totalPages > 1 && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 border border-gray-200 text-xs font-bold hover:bg-gray-50 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <div className="flex items-center px-4 text-xs font-mono font-bold text-gray-600">
                Página {page} de {totalPages}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 border border-gray-200 text-xs font-bold hover:bg-gray-50 bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── MODAL DE CONFIRMAÇÃO DE DELEÇÃO ─── */}
      <Modal
        isOpen={confirmModal.show}
        onClose={() => setConfirmModal(prev => ({ ...prev, show: false }))}
        title="⚠️ Confirmar Remoção Crítica"
      >
        <div className="space-y-4 p-1">
          <p className="text-sm text-slate-600 leading-relaxed">
            Você está prestes a remover o lote <strong className="text-slate-900">"{confirmModal.batchName}"</strong>. Esta ação apagará em cascata todas as linhas importadas deste arquivo e reverterá seus estados financeiros no banco.
          </p>
          <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs font-medium text-rose-800">
            Atenção: Esta operação é irreversível e impactará relatórios de auditoria ativos.
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setConfirmModal(prev => ({ ...prev, show: false }))}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={executeDeleteBatch}
              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 shadow-sm cursor-pointer"
            >
              Confirmar Exclusão
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── MODAL DE PREVIEW INTERNO ─── */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => { setIsPreviewOpen(false); setSelectedBatchDetails(null); }}
        title={`Detalhamento do Lote: ${getModalTitle()}`}
        footer={
          <button 
            onClick={() => { setIsPreviewOpen(false); setSelectedBatchDetails(null); }}
            className="bg-gray-900 text-white px-5 py-2 text-xs font-bold hover:bg-gray-800 rounded-xl cursor-pointer"
          >
            Fechar Auditoria
          </button>
        }
      >
        {loadingDetails ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            <span className="text-xs font-bold text-gray-400 font-mono">Buscando dados na partição...</span>
          </div>
        ) : selectedBatchDetails ? (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">ID do Lote</span>
                <span className="text-xs font-bold font-mono text-gray-800">{selectedBatchDetails.id}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Descrição</span>
                <span className="text-xs font-bold text-gray-900">{selectedBatchDetails.name}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Data de Entrada</span>
                <span className="text-xs font-medium text-gray-600">{new Date(selectedBatchDetails.createdAt).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Layers3 size={14} /> Registros Brutos Encontrados
              </h3>
              <div className="max-h-[350px] overflow-y-auto border border-gray-100 rounded-xl">
                <Table
                  columns={previewConfig.columns}
                  data={previewConfig.data}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-gray-400 italic">
            Nenhum registro extraído para este lote.
          </div>
        )}
      </Modal>

    </div>
  );
}