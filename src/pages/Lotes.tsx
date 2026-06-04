import { useState, useEffect } from 'react';
import { 
  Layers, Loader2, AlertTriangle, RefreshCw, Eye, Trash2, 
  Layers3, ShoppingBag, CreditCard, X, CheckCircle2, Info
} from 'lucide-react';

import Table, { Column } from '../components/Table';
import Modal from '../components/Modal';

// Alterado para consumir o serviço unificado criado no passo anterior
import { batchService, Batch as ApiBatch } from '../api-routes/batch';

interface UnifiedBatch {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  recordsCount: number;
  totalValue: number;
  originType: 'sale' | 'payment';
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
  originType: 'sale' | 'payment';
}

export default function Lotes() {
  // ─── ESTADOS DE INFRAESTRUTURA ───
  const [unifiedBatches, setUnifiedBatches] = useState<UnifiedBatch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

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
  const [previewOrigin, setPreviewOrigin] = useState<'sale' | 'payment'>('sale');
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Auxiliar para disparar feedbacks bonitos na tela
  const triggerAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setAlert({ show: true, type, title, message });
    if (type === 'success') {
      setTimeout(() => setAlert(prev => ({ ...prev, show: false })), 4000);
    }
  };

  // ─── CARREGAMENTO INTEGRADO E UNIFICADO ATRAVÉS DO BATCH_SERVICE ───
  const loadAllBatches = async (currentPage: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      // Consome a rota limpa e centralizada do Back-end
      const response = await batchService.list(currentPage, 10);

      const consolidated = (response.data || []).map((b: ApiBatch) => ({
        id: b.id,
        name: b.name,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        recordsCount: Number(b.salesCount || 0),
        totalValue: Number(b.totalBaseIcms || 0),
        originType: b.type === 'PAYMENTS' ? 'payment' as const : 'sale' as const
      }));

      setUnifiedBatches(consolidated);
      setTotalRecords(response.meta?.totalRecords || 0);
      setTotalPages(response.meta?.totalPages || 1);
      
    } catch (err: any) {
      setError(err.message || 'Falha ao buscar os lotes operacionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBatches(page);
  }, [page]);

  // ─── REMOÇÃO INTELIGENTE VIA CONFIRMAÇÃO CUSTOMIZADA ───
  const openDeleteConfirmation = (id: string, name: string, originType: 'sale' | 'payment') => {
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
  const handleOpenPreview = async (id: string, originType: 'sale' | 'payment') => {
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

  // ─── CONFIGURAÇÃO DE COLUNAS ───
  const mainColumns: Column<UnifiedBatch>[] = [
    {
      header: 'Identificador do Lote',
      render: (b) => <span className="font-mono text-xs text-gray-400 font-bold">{b.id}</span>
    },
    {
      header: 'Nome do Arquivo / Descrição',
      render: (b) => <span className="font-semibold text-gray-900 text-xs">{b.name}</span>
    },
    {
      header: 'Tipo de Lote',
      render: (b) => {
        const isPayment = b.originType === 'payment';
        return (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold tracking-wider font-mono uppercase px-2 py-0.5 border ${
            isPayment ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-green-50 text-green-700 border-green-100'
          }`}>
            {isPayment ? <CreditCard className="w-3 h-3" /> : <ShoppingBag className="w-3 h-3" />}
            {isPayment ? 'Pagamentos' : 'Vendas'}
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-slate-950 relative">
      
      {/* ─── BANNER DINÂMICO DE FEEDBACK (SUBSTITUTOR DO ALERT GOOGLE) ─── */}
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
        <p className="text-sm text-gray-500">Audite de forma centralizada os históricos unificados de arquivos de Vendas e Repasses Financeiros.</p>
      </header>

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

      {/* ─── MODAL DE CONFIRMAÇÃO DE DELEÇÃO LINDO ─── */}
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
        title={`Detalhamento do Lote: ${previewOrigin === 'payment' ? 'Repasses de Cartão/Marketplace' : 'Notas Fiscais de Venda'}`}
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
                  columns={previewOrigin === 'payment' ? paymentsPreviewColumns : salesPreviewColumns}
                  data={previewOrigin === 'payment' ? (selectedBatchDetails.payments || []) : (selectedBatchDetails.sales || [])}
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