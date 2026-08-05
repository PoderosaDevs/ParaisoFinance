// src/components/Modals/ExportVendasModal.tsx
import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2, CalendarRange, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Marketplace } from '../../types/financeiro';
import { marketplaceService } from '../../api-routes/marketplace';
import { Store, storeService } from '../../api-routes/store';
import { exportSalesService, ExportSaleRow, ExportSalesFilters } from '../../api-routes/exportSales';

interface ExportVendasModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PeriodMode = 'range' | 'month';
type ExportFormat = 'xlsx' | 'csv' | 'pdf';

const STATUS_OPTIONS = ['LIQUIDADO', 'PARCIAL', 'PENDENTE'];

export function ExportVendasModal({ isOpen, onClose }: ExportVendasModalProps) {
  // ─── ESTADOS DE METADADOS (Lojas e Marketplaces, buscados pelo próprio modal ao abrir) ───
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(false);
  const [errorMeta, setErrorMeta] = useState<string | null>(null);

  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [marketplaceFilter, setMarketplaceFilter] = useState<string>('all');

  const [periodMode, setPeriodMode] = useState<PeriodMode>('range');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [format, setFormat] = useState<ExportFormat>('xlsx');

  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Busca lojas e marketplaces toda vez que o modal abre, igual o ImportVendasModal já faz com marketplaces.
  // Isso evita depender de um state carregado só uma vez lá em cima no Financeiro.tsx.
  useEffect(() => {
    if (!isOpen) return;

    async function loadMeta() {
      setIsLoadingMeta(true);
      setErrorMeta(null);
      try {
        const [marketplacesData, storesData] = await Promise.all([
          marketplaceService.list(),
          storeService.list()
        ]);
        setMarketplaces(marketplacesData || []);
        setStores(storesData || []);
      } catch (err) {
        console.error('Erro ao carregar lojas/marketplaces para exportação:', err);
        setErrorMeta('Não foi possível carregar as lojas e marketplaces cadastrados.');
      } finally {
        setIsLoadingMeta(false);
      }
    }

    loadMeta();
  }, [isOpen]);

  // Harmonia: a lista de lojas exibida reflete o marketplace escolhido (mesma regra do Financeiro.tsx)
  const availableStores = useMemo(() => {
    if (marketplaceFilter === 'all') return stores;
    return stores.filter((s) => s.marketplaceId === marketplaceFilter);
  }, [stores, marketplaceFilter]);

  const handleMarketplaceChange = (value: string) => {
    setExportSuccess(null);
    setMarketplaceFilter(value);
    if (value !== 'all' && storeFilter !== 'all') {
      const stillValid = stores.some((s) => s.id === storeFilter && s.marketplaceId === value);
      if (!stillValid) setStoreFilter('all');
    }
  };

  const toggleStatus = (status: string) => {
    setExportSuccess(null);
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const formatBRL = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Resolve o período efetivo (startDate/endDate) baseado no modo escolhido (intervalo livre ou mês fechado)
  const resolveDateRange = (): { startDate?: string; endDate?: string } => {
    if (periodMode === 'range') {
      return {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      };
    }

    if (!selectedMonth) return {};

    const [year, month] = selectedMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);

    const toIso = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    return { startDate: toIso(firstDay), endDate: toIso(lastDay) };
  };

  // ─── CSV NO PADRÃO BRASILEIRO ───
  // Bug corrigido: o Excel em pt-BR usa ";" como separador de colunas e "," como separador
  // decimal (porque "," já é o separador decimal). O arquivo antigo usava "," para tudo,
  // então o Excel abria os números fatiados em colunas erradas. Agora: delimitador ";" e
  // valores numéricos formatados com vírgula decimal, igual ao restante do sistema.
  const CSV_DELIMITER = ';';

  const escapeCsvValue = (value: any): string => {
    const str = String(value ?? '');
    if (str.includes(CSV_DELIMITER) || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const formatCsvNumber = (value: number): string =>
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const generateCsvContent = (rows: ExportSaleRow[]): string => {
    const headers = [
      'Nota Fiscal', 'Data', 'Loja', 'Marketplace',
      'Valor Bruto', 'Comissao Venda', 'Comissao Frete',
      'Frete e Taxas', 'Liquido Recebido', 'Status'
    ];
    const lines = [headers.join(CSV_DELIMITER)];

    rows.forEach(r => {
      lines.push([
        escapeCsvValue(r.nf),
        escapeCsvValue(r.data),
        escapeCsvValue(r.loja),
        escapeCsvValue(r.marketplace),
        escapeCsvValue(formatCsvNumber(r.valorBruto)),
        escapeCsvValue(formatCsvNumber(r.comissaoVenda)),
        escapeCsvValue(formatCsvNumber(r.comissaoFrete)),
        escapeCsvValue(formatCsvNumber(r.freteETaxas)),
        escapeCsvValue(formatCsvNumber(r.liquidoRecebido)),
        escapeCsvValue(r.status)
      ].join(CSV_DELIMITER));
    });

    return lines.join('\r\n');
  };

  const downloadBlob = (content: BlobPart, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsCsv = (rows: ExportSaleRow[], filename: string) => {
    // BOM no início garante que acentuação abra corretamente no Excel (pt-BR)
    const content = '\uFEFF' + generateCsvContent(rows);
    downloadBlob(content, 'text/csv;charset=utf-8;', filename);
  };

  const exportAsXlsx = (rows: ExportSaleRow[], filename: string) => {
    const sheetData = rows.map(r => ({
      'Nota Fiscal': r.nf,
      'Data': r.data,
      'Loja': r.loja,
      'Marketplace': r.marketplace,
      'Valor Bruto': r.valorBruto,
      'Comissão Venda': r.comissaoVenda,
      'Comissão Frete': r.comissaoFrete,
      'Frete e Taxas': r.freteETaxas,
      'Líquido Recebido': r.liquidoRecebido,
      'Status': r.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas');
    XLSX.writeFile(workbook, filename);
  };

  const exportAsPdf = (rows: ExportSaleRow[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rowsHtml = rows.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 5px; font-family: monospace;">${r.nf}</td>
        <td style="padding: 5px;">${r.data}</td>
        <td style="padding: 5px;">${r.loja}</td>
        <td style="padding: 5px;">${r.marketplace}</td>
        <td style="padding: 5px; text-align: right;">${formatBRL(r.valorBruto)}</td>
        <td style="padding: 5px; text-align: right; color: #047857;">${formatBRL(r.liquidoRecebido)}</td>
        <td style="padding: 5px;">${r.status}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Exportação de Vendas</title>
          <style>
            body { font-family: sans-serif; color: #334155; padding: 20px; font-size: 11px; }
            h2 { color: #0f172a; margin-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; }
            th { background: #f1f5f9; padding: 6px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Exportação de Vendas</h2>
          <p>Gerado em ${new Date().toLocaleString('pt-BR')} — ${rows.length} registro(s)</p>
          <table>
            <thead>
              <tr>
                <th>NF</th><th>Data</th><th>Loja</th><th>Marketplace</th>
                <th>Valor Bruto</th><th>Líquido Recebido</th><th>Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);

    try {
      const { startDate: effectiveStart, endDate: effectiveEnd } = resolveDateRange();

      const filters: ExportSalesFilters = {
        marketplaceId: marketplaceFilter !== 'all' ? marketplaceFilter : undefined,
        storeId: storeFilter !== 'all' ? storeFilter : undefined,
        startDate: effectiveStart,
        endDate: effectiveEnd,
        status: statusFilter.length > 0 ? statusFilter : undefined
      };

      // Chamada única ao endpoint dedicado de exportação — já vem achatado e sem paginação
      const { data: rows, truncated } = await exportSalesService.exportSales(filters);

      if (rows.length === 0) {
        setExportError('Nenhuma venda encontrada com os filtros selecionados.');
        return;
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      const baseFilename = `vendas_export_${timestamp}`;

      if (format === 'csv') {
        exportAsCsv(rows, `${baseFilename}.csv`);
      } else if (format === 'xlsx') {
        exportAsXlsx(rows, `${baseFilename}.xlsx`);
      } else {
        exportAsPdf(rows);
      }

      const truncatedWarning = truncated
        ? ' Atenção: o resultado bateu no limite máximo de exportação — restrinja os filtros para trazer tudo.'
        : '';
      setExportSuccess(`Exportação concluída: ${rows.length} venda(s) processada(s).${truncatedWarning}`);
    } catch (err: any) {
      console.error('Erro ao exportar vendas:', err);
      setExportError(err.message || 'Ocorreu um erro ao gerar o arquivo de exportação.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClose = () => {
    setStoreFilter('all');
    setMarketplaceFilter('all');
    setPeriodMode('range');
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
    setStatusFilter([]);
    setFormat('xlsx');
    setExportError(null);
    setExportSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white border border-gray-200 w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Exportar Vendas</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">Configure os filtros e o formato de saída do arquivo</p>
          </div>
          <button onClick={handleClose} disabled={isExporting} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">

          {errorMeta && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMeta}</span>
            </div>
          )}

          {exportError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          {exportSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Loja e Canal (Marketplace) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Loja</label>
              <div className="relative">
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  disabled={isExporting || isLoadingMeta || availableStores.length === 0}
                  className="w-full border border-gray-200 px-3 py-1.5 text-xs bg-gray-50/50 outline-none focus:border-gray-400 text-gray-700 cursor-pointer disabled:opacity-50"
                >
                  <option value="all">{isLoadingMeta ? 'Carregando...' : 'Todas as lojas'}</option>
                  {availableStores.map((store) => (
                    <option key={store.id} value={store.id}>{store.name || store.id}</option>
                  ))}
                </select>
                {isLoadingMeta && (
                  <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Canal / Marketplace</label>
              <div className="relative">
                <select
                  value={marketplaceFilter}
                  onChange={(e) => handleMarketplaceChange(e.target.value)}
                  disabled={isExporting || isLoadingMeta}
                  className="w-full border border-gray-200 px-3 py-1.5 text-xs bg-gray-50/50 outline-none focus:border-gray-400 text-gray-700 cursor-pointer disabled:opacity-50"
                >
                  <option value="all">{isLoadingMeta ? 'Carregando...' : 'Todos os canais'}</option>
                  {marketplaces.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {isLoadingMeta && (
                  <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-gray-400 pointer-events-none" />
                )}
              </div>
            </div>
          </div>

          {/* Período */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <CalendarRange className="w-3 h-3" /> Período
              </label>
              <div className="flex border border-gray-200 text-[10px] font-bold overflow-hidden">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setPeriodMode('range')}
                  className={`px-2.5 py-1 cursor-pointer transition-colors ${periodMode === 'range' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Intervalo
                </button>
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => setPeriodMode('month')}
                  className={`px-2.5 py-1 cursor-pointer transition-colors border-l border-gray-200 ${periodMode === 'month' ? 'bg-gray-900 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  Mês
                </button>
              </div>
            </div>

            {periodMode === 'range' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-medium text-gray-400 mb-1">De:</label>
                  <input
                    type="date"
                    value={startDate}
                    disabled={isExporting}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-gray-400 bg-gray-50/50 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-medium text-gray-400 mb-1">Até:</label>
                  <input
                    type="date"
                    value={endDate}
                    disabled={isExporting}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-gray-400 bg-gray-50/50 disabled:opacity-50"
                  />
                </div>
              </div>
            ) : (
              <input
                type="month"
                value={selectedMonth}
                disabled={isExporting}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full border border-gray-200 px-3 py-1.5 text-xs font-mono outline-none focus:border-gray-400 bg-gray-50/50 disabled:opacity-50"
              />
            )}
          </div>

          {/* Situação (Status) */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Situação</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => {
                const isActive = statusFilter.includes(status);
                return (
                  <button
                    type="button"
                    key={status}
                    disabled={isExporting}
                    onClick={() => toggleStatus(status)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border cursor-pointer transition-colors disabled:opacity-50 ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Nenhuma seleção = todas as situações.</p>
          </div>

          {/* Formato de saída */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Formato de Exportação</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('xlsx')}
                className={`flex flex-col items-center gap-1 border p-3 cursor-pointer transition-colors disabled:opacity-50 ${
                  format === 'xlsx' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span className="text-[10px] font-bold">XLSX</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('csv')}
                className={`flex flex-col items-center gap-1 border p-3 cursor-pointer transition-colors disabled:opacity-50 ${
                  format === 'csv' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span className="text-[10px] font-bold">CSV</span>
              </button>
              <button
                type="button"
                disabled={isExporting}
                onClick={() => setFormat('pdf')}
                className={`flex flex-col items-center gap-1 border p-3 cursor-pointer transition-colors disabled:opacity-50 ${
                  format === 'pdf' ? 'border-rose-600 bg-rose-50 text-rose-800' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Printer className="w-4 h-4" />
                <span className="text-[10px] font-bold">PDF</span>
              </button>
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs font-bold text-gray-500 cursor-pointer disabled:opacity-40"
          >
            Fechar
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || isLoadingMeta}
            className="bg-gray-900 text-white px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 min-w-[140px] justify-center"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...
              </>
            ) : (
              'Gerar Arquivo'
            )}
          </button>
        </div>

      </div>
    </div>
  );
}