import { useState, useEffect, useRef } from 'react';
import { CloudUpload } from 'lucide-react';

import Table, { Column } from '../components/Table';
import Modal from '../components/Modal';

import { FinanceiroSummary } from '../components/Financeiro/FinanceiroSummary';
import { FinanceiroFilters } from '../components/Financeiro/FinanceiroFilters';
import { FinanceiroHeader } from '../components/Financeiro/FinanceiroHeader';
import { FinanceiroPagination } from '../components/Financeiro/FinanceiroPagination';

import { ImportVendasModal } from '../components/Modals/ImportVendasModal.tsx';
import { ImportPaymentsModal } from '../components/Modals/ImportPagamentosModal.tsx';

import { ModalType } from '../types/financeiro';
import { Marketplace, marketplaceService } from '../api-routes/marketplace';
import { Sale, saleService, SalesSummaryResponse } from '../api-routes/sale';
import { storeService } from '../api-routes/store';
import { ImportDevolutionsModal } from '../components/Modals/ImportDevolucaoModal.tsx';

export default function Financeiro() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [marketplaceFilter, setMarketplaceFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  // Inicialize preferencialmente com o mês vigente ou deixe vazio se o picker injetar depois
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalImportTitle, setModalImportTitle] = useState("Importação de Arquivo");

  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [stores, setStores] = useState<string[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [summaryData, setSummaryData] = useState<SalesSummaryResponse>({
    vendasPeriodo: 0,
    receitaBrutaPrevista: 0,
    saldoAReceber: 0,
    receitaConciliadaRecebida: 0,
    comissoesMarketplace: 0,
    custosLogisticaFrete: 0,
  });

  // Flag para evitar a primeira busca fantasma enquanto as datas padrão não carregam
  const isInitialMount = useRef(true);

  // 1. Debounce para o campo de texto (Evita travar a digitação)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(handler);
  }, [search]);

  // 2. Carga inicial de Metadados (Marketplaces e Lojas)
  useEffect(() => {
    async function loadInitialMetadata() {
      try {
        const [marketplacesData, storesData] = await Promise.all([
          marketplaceService.list(),
          storeService.list()
        ]);
        setMarketplaces(marketplacesData || []);
        if (storesData) {
          setStores(storesData.map((store: any) => store.id || store.name || store));
        }
      } catch (err) {
        console.error("Erro ao carregar metadados:", err);
      }
    }
    loadInitialMetadata();
  }, []);

  // 3. Função Única de carregamento do Dashboard (Modificada)
  const loadDashboardData = async () => {
    try {
      const hasSearch = debouncedSearch.trim() !== "";

      // 1. Filtros da Tabela: Se houver busca, ignora os outros filtros
      const apiFilters = {
        page,
        limit: ITEMS_PER_PAGE,
        search: hasSearch ? debouncedSearch.trim() : undefined,
        marketplaceId: !hasSearch && marketplaceFilter !== "all" ? marketplaceFilter : undefined,
        storeId: !hasSearch && storeFilter !== "all" ? storeFilter : undefined,
        startDate: !hasSearch && startDate ? startDate : undefined,
        endDate: !hasSearch && endDate ? endDate : undefined,
        status: !hasSearch && statusFilter.length > 0 ? statusFilter : undefined,
      };

      // 2. Execução Condicional
      if (hasSearch) {
        // Se o usuário está buscando algo, fazemos APENAS a requisição da tabela
        const salesResponse = await saleService.list(apiFilters);

        setSales(salesResponse.data || []);
        setTotalItems(salesResponse.totalItems || 0);

        // Zera o resumo financeiro explicitamente
        setSummaryData({
          vendasPeriodo: 0,
          receitaBrutaPrevista: 0,
          saldoAReceber: 0,
          receitaConciliadaRecebida: 0,
          comissoesMarketplace: 0,
          custosLogisticaFrete: 0,
        });
      } else {
        // Se NÃO há busca por texto, o comportamento volta ao normal (tabela + sumário integrados)
        const [salesResponse, summaryResponse] = await Promise.all([
          saleService.list(apiFilters),
          saleService.summary({
            marketplaceId: apiFilters.marketplaceId,
            storeId: apiFilters.storeId,
            startDate: apiFilters.startDate,
            endDate: apiFilters.endDate,
            status: apiFilters.status,
          }),
        ]);

        setSales(salesResponse.data || []);
        setTotalItems(salesResponse.totalItems || 0);
        setSummaryData(summaryResponse);
      }
    } catch (err) {
      console.error("Erro ao sincronizar dados do painel:", err);
    }
  };

  // 4. Efeito unificado que monitora as mudanças de filtros e paginação de forma limpa
  useEffect(() => {
    // Se o seu componente de filtro injeta datas automáticas no primeiro segundo,
    // nós seguramos o disparo aqui até que as datas estejam devidamente preenchidas se necessário.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Se possui datas padrão vindo do picker, aguarda o próximo ciclo para não duplicar
      if (!startDate && !endDate) {
        loadDashboardData();
      }
      return;
    }

    // Timer pequeno para agrupar startDate e endDate quando mudam quase juntos
    const groupFiltersTimeout = setTimeout(() => {
      loadDashboardData();
    }, 50);

    return () => clearTimeout(groupFiltersTimeout);

  }, [page, debouncedSearch, marketplaceFilter, storeFilter, statusFilter, startDate, endDate]);

  // 5. Reseta para a página 1 apenas quando os filtros mudarem
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, marketplaceFilter, storeFilter, statusFilter, startDate, endDate]);

  const handleClearFilters = () => {
    setSearch("");
    setMarketplaceFilter("all");
    setStoreFilter("all");
    setStatusFilter([]);
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const openImportModal = (type: "venda" | "pagamento" | "reembolso" | "devolucao", label: string) => {
    setModalImportTitle(`Importar Planilha de ${label}`);
    setActiveModal(`import_${type}`);
  };

  const closeModals = () => setActiveModal(null);

  const handleImportVendasFinish = (result: { batchId: string; salesImported: number }) => {
    alert(`Sucesso! Lote de Vendas ${result.batchId} criado com ${result.salesImported} registros processados.`);
    closeModals();
    setPage(1);
    loadDashboardData();
  };

  const handleImportPagamentosFinish = (result: { batchId: string; salesImported: number }) => {
    alert(`Sucesso! Lote de Pagamentos ${result.batchId} processado. ${result.salesImported} parcelas foram conciliadas.`);
    closeModals();
    setPage(1);
    loadDashboardData();
  };

    const handleImportDevolucaoFinish = (result: { batchId: string; salesImported: number }) => {
    alert(`Sucesso! Lote de Pagamentos ${result.batchId} processado. ${result.salesImported} parcelas foram conciliadas.`);
    closeModals();
    setPage(1);
    loadDashboardData();
  };

  const hasActiveFilters = statusFilter.length > 0 || marketplaceFilter !== "all" || storeFilter !== "all" || search !== "" || startDate !== "" || endDate !== "";

  const stats = {
    count: summaryData.vendasPeriodo,
    totalLiquido: summaryData.receitaBrutaPrevista,
    totalRecebido: summaryData.receitaConciliadaRecebida,
    totalTaxas: summaryData.comissoesMarketplace,
    freteETaxas: summaryData.custosLogisticaFrete,
    faltaReceber: summaryData.saldoAReceber
  };

  const columns: Column<Sale>[] = [
    {
      header: 'Nota Fiscal',
      render: (sale) => (
        <div className="flex flex-col">
          <span className="font-mono text-xs font-bold text-gray-800">Nº {sale.nf}</span>
          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{sale.id.split('-')[0]}...</span>
        </div>
      )
    },
    {
      header: 'Data Emissão',
      render: (sale) => {
        if (!sale.date) return 'S/D';
        const parts = sale.date.split('-');
        return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : sale.date;
      }
    },
    {
      header: 'Canal / Loja',
      render: (sale) => (
        <div className="flex flex-col gap-1">
          <span className="w-max inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider rounded-sm">
            {sale.store?.marketplace?.name || sale.store?.marketplaceId || 'Não Mapeado'}
          </span>
          <span className="text-xs text-gray-500 font-medium">{sale.storeId}</span>
        </div>
      )
    },
    {
      header: 'Tipo Faturamento',
      render: (sale) => {
        const hasPayments = sale.payments && sale.payments.length > 0;
        if (!hasPayments) return <span className="text-xs font-semibold text-slate-400 italic">Sem Pagamento</span>;
        const firstPayment = sale.payments?.[0];
        const isParcelado = Number(firstPayment?.parcelas) > 1;

        return (
          <div className="flex flex-col">
            <span className={`text-xs font-semibold ${isParcelado ? 'text-indigo-600' : 'text-emerald-600'}`}>
              {isParcelado ? 'Parcelado' : 'Unitário'}
            </span>
            {isParcelado && (
              <span className="text-[10px] font-mono text-gray-400 mt-0.5">
                Progresso: {sale.payments.length}/{firstPayment.parcelas}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Valor Bruto',
      align: 'right',
      render: (sale) => (
        <span className="font-mono font-medium text-gray-900">
          {sale.baseIcms.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      header: 'Comissão Venda',
      align: 'right',
      render: (sale) => {
        const value = (sale.payments || []).reduce((acc, pay) => acc + (Number(pay.comissaoVenda) || 0), 0);
        return (
          <span className={`font-mono text-xs ${value > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
            {value > 0 ? '-' : ''}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}
          </span>
        );
      }
    },
    {
      header: 'Comissão Frete',
      align: 'right',
      render: (sale) => {
        const value = (sale.payments || []).reduce((acc, pay) => acc + (Number(pay.comissaoFrete) || 0), 0);
        return (
          <span className={`font-mono text-xs ${value > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
            {value > 0 ? '-' : ''}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}
          </span>
        );
      }
    },
    {
      header: 'Logística / Taxas',
      align: 'right',
      render: (sale) => {
        const value = (sale.payments || []).reduce((acc, pay) => acc + (Number(pay.fretesTaxas) || 0), 0);
        return (
          <span className={`font-mono text-xs ${value > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
            {value > 0 ? '-' : ''}{value.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}
          </span>
        );
      }
    },
    {
      header: 'Líquido Recebido',
      align: 'right',
      render: (sale) => {
        const totalRepasse = (sale.payments || []).reduce((acc, pay) => acc + (Number(pay.repasse) || 0), 0);
        return (
          <span className={`font-mono font-semibold ${totalRepasse > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
            {totalRepasse.toLocaleString('pt-BR', { minimumFractionDigits: 2, style: 'currency', currency: 'BRL' })}
          </span>
        );
      }
    },
    {
      header: 'Status',
      align: 'center',
      render: (sale) => {
        const status = sale.status || 'PENDENTE';
        const colorMap: Record<string, string> = {
          'LIQUIDADO': 'bg-emerald-100 text-emerald-700',
          'PARCIAL': 'bg-blue-100 text-blue-700',
          'PENDENTE': 'bg-amber-100 text-amber-700',
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>
            {status}
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-950">
      <FinanceiroHeader setActiveModal={setActiveModal} openImportModal={openImportModal} />

      <FinanceiroFilters
        search={search}
        setSearch={setSearch}
        marketplaceFilter={marketplaceFilter}
        setMarketplaceFilter={setMarketplaceFilter}
        storeFilter={storeFilter}
        setStoreFilter={setStoreFilter}
        stores={stores}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        marketplaces={marketplaces}
        handleClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <FinanceiroSummary stats={stats} />

      <div className="bg-white border border-gray-200 shadow-sm p-1">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Histórico de Vendas Cadastradas</h3>
            <p className="text-xs text-gray-500 mt-0.5">Listagem consolidada cruzando dados de Notas Fiscais e parcelas de auditoria.</p>
          </div>
          <div className="bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 rounded-sm self-start sm:self-center">
            {totalItems} {totalItems === 1 ? 'venda encontrada' : 'vendas encontradas'}
          </div>
        </div>

        <Table columns={columns} data={sales} />

        <FinanceiroPagination page={page} setPage={setPage} totalItems={totalItems} itemsPerPage={ITEMS_PER_PAGE} />
      </div>

      <ImportVendasModal isOpen={activeModal === 'import_venda'} onClose={closeModals} onFinish={handleImportVendasFinish} />
      <ImportPaymentsModal isOpen={activeModal === 'import_pagamento'} onClose={closeModals} onFinish={handleImportPagamentosFinish} />
      <ImportDevolutionsModal isOpen={activeModal === 'import_devolucao'} onClose={closeModals} onFinish={handleImportDevolucaoFinish} />


      <Modal
        isOpen={activeModal !== null && activeModal !== 'import_venda' && activeModal !== 'import_pagamento' && activeModal !== 'import_devolucao' && activeModal !== 'export_vendas'}
        onClose={closeModals}
        title={modalImportTitle}
        footer={
          <>
            <button onClick={closeModals} className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer">Cancelar</button>
            <button className="bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 cursor-pointer">Processar Conciliação</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-600">Envie o arquivo original no formato correspondente exportado do canal para bater as informações internas.</p>
          <div className="border border-dashed border-gray-300 p-8 flex flex-col items-center justify-center gap-2.5 bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer group">
            <CloudUpload size={32} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
            <span className="text-xs font-semibold text-gray-600">Arraste ou selecione a planilha de auditoria</span>
          </div>
          <p className="text-[10px] text-gray-400 font-mono text-center">Extensões: .csv ou .xlsx (Capacidade máxima: 10MB)</p>
        </div>
      </Modal>

      <Modal
        isOpen={activeModal === 'export_vendas'}
        onClose={closeModals}
        title="Configurar Exportação de Dados"
        footer={<button className="bg-gray-900 text-white px-5 py-2 text-xs font-bold hover:bg-gray-800 cursor-pointer shadow-sm">Gerar Arquivo</button>}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Período de:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-gray-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-gray-400 bg-gray-50/50" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Até:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-gray-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-gray-400 bg-gray-50/50" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Formato de Saída</label>
            <select className="w-full border border-gray-200 px-3 py-1.5 text-xs bg-gray-50/50 outline-none focus:border-gray-400 text-gray-700">
              <option>Layout de Auditoria Direta (.csv)</option>
              <option>Planilha Consolidada (.xlsx)</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}