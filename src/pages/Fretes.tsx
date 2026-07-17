// apps/web/src/pages/Frete.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  Upload,
  Loader2,
  AlertCircle,
  Download,
  XCircle,
  CheckCircle2,
  Clock,
  Receipt,
  SearchX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import Table, { Column } from "../components/Table.tsx";
import { freteService, VendaFrete, FreteError } from "../api-routes/frete.ts";
import { FretePreviewModal } from "../components/Modals/FreteModalPreview.tsx";

export default function Frete() {
  const [vendas, setVendas] = useState<VendaFrete[]>([]);
  const [loading, setLoading] = useState(false);
  const [importErrors, setImportErrors] = useState<FreteError[]>([]);
  const [errorStoreFilter, setErrorStoreFilter] = useState<string>("all");
  const [searchNf, setSearchNf] = useState("");
  const [searchFatura, setSearchFatura] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [totalItems, setTotalItems] = useState(0);

  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchVendas = useCallback(async () => {
    setLoading(true);
    try {
      const response = await freteService.getAllFrete(
        currentPage,
        itemsPerPage,
        searchNf.trim(),
        statusFilter,
        searchFatura.trim()
      );
      setVendas(response.vendas || []);
      setTotalItems(response.total || 0);
    } catch (error) {
      toast.error("Erro ao carregar vendas de frete.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchNf, statusFilter, searchFatura]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchVendas();
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchVendas]);

  const handleFilterChange = (val: string) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchNf(val);
    setCurrentPage(1);
  };

  const handleSearchFaturaChange = (val: string) => {
    setSearchFatura(val);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    for (let i = startPage; i <= endPage; i++) {
      if (i >= 1) pages.push(i);
    }
    return pages;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rawData.length) {
          toast.warning("Planilha vazia.");
          return;
        }

        const processed = rawData.map((row: any) => ({
          nf: String(row.NOTA || row.NF || row.nf || "").trim(),
          fatura: String(row.FATURA || row.fatura || "").trim(),
          loja: String(row.LOJA || row.loja || "DESCONHECIDA").trim(),
        }));

        setPreviewData(processed);
      } catch (err) {
        toast.error("Erro ao ler planilha de frete.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    setIsProcessing(true);
    setImportErrors([]);

    try {
      const response = await freteService.importFretes(previewData!);
      const { successCount, errors } = response;

      if (successCount > 0) {
        toast.success(`${successCount} faturas de frete processadas!`);
        setSearchNf("");
        setCurrentPage(1);
        await fetchVendas();
      }

      if (errors && errors.length > 0) {
        toast.error(`${errors.length} notas apresentaram problemas.`);
        setImportErrors(errors);
      }

      setPreviewData(null);
    } catch (error) {
      toast.error("Falha ao processar importação.");
    } finally {
      setIsProcessing(false);
    }
  };

  const exportErrorsToCSV = () => {
    const filteredErrors = importErrors.filter(
      (err) => errorStoreFilter === "all" || err.loja === errorStoreFilter
    );
    const ws = XLSX.utils.json_to_sheet(filteredErrors);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Erros de Frete");
    XLSX.writeFile(wb, `Erros_Frete_${new Date().getTime()}.xlsx`);
  };

  const handleClearFilters = () => {
    setSearchNf("");
    setSearchFatura("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchNf !== "" || searchFatura !== "" || statusFilter !== "all";

  const columns: Column<VendaFrete>[] = [
    {
      header: "Nota Fiscal",
      render: (v) => (
        <span className="font-mono text-xs font-bold text-gray-800">
          #{v.nf || "S/N"}
        </span>
      ),
    },
    {
      header: "Loja",
      render: (v) => (
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
          {v.loja}
        </span>
      ),
    },
    {
      header: "Fatura",
      render: (v) => {
        const fatura = v.NumeroFatura;
        return fatura ? (
          <div className="flex items-center gap-2">
            <div className="p-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-sm">
              <Receipt className="w-3.5 h-3.5" />
            </div>
            <span className="font-mono text-xs font-semibold text-gray-800">
              {fatura}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-sm">
            <SearchX className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Aguardando
            </span>
          </span>
        );
      },
    },
    {
      header: "Status do Frete",
      align: "center",
      render: (v) => {
        const isPago = v.fretePago;
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-sm uppercase ${
              isPago
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isPago ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <Clock className="w-3 h-3" />
            )}
            {isPago ? "Pago" : "Pendente"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-slate-950">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Gestão de Fretes</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Visualize faturas pendentes ou importe planilhas para dar baixa.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={loading || isProcessing}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Importar Faturas (Excel)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
        />
      </div>

      {/* Painel de erros */}
      {importErrors.length > 0 && (
        <div className="bg-white border border-red-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-4">
          <div className="p-4 bg-red-50 border-b border-red-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold">
                Atenção: {importErrors.length} notas não puderam ser processadas
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={errorStoreFilter}
                onChange={(e) => setErrorStoreFilter(e.target.value)}
                className="text-xs font-semibold border border-red-200 bg-white px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="all">Todas as Lojas</option>
                {Array.from(new Set(importErrors.map((e) => e.loja))).map((loja) => (
                  <option key={loja} value={loja}>
                    {loja}
                  </option>
                ))}
              </select>

              <button
                onClick={exportErrorsToCSV}
                className="inline-flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-3 py-1.5 text-xs font-bold hover:bg-red-50 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Erros
              </button>

              <button
                onClick={() => setImportErrors([])}
                className="text-red-600 hover:bg-red-100 p-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-auto max-h-[300px]">
            <table className="w-full text-xs text-left text-red-900">
              <thead className="text-[10px] uppercase font-bold bg-red-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Nota Fiscal</th>
                  <th className="px-4 py-2.5">Fatura</th>
                  <th className="px-4 py-2.5">Loja</th>
                  <th className="px-4 py-2.5">Motivo do Erro</th>
                </tr>
              </thead>
              <tbody>
                {importErrors
                  .filter((err) => errorStoreFilter === "all" || err.loja === errorStoreFilter)
                  .map((err, idx) => (
                    <tr key={idx} className="border-b border-red-100">
                      <td className="px-4 py-2.5 font-mono font-semibold">#{err.nf}</td>
                      <td className="px-4 py-2.5 font-mono">{err.fatura}</td>
                      <td className="px-4 py-2.5">{err.loja}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase bg-red-100 text-red-800 rounded-sm">
                          {err.motivo}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <input
          placeholder="Buscar por NF ou Fatura..."
          value={searchNf}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:max-w-xs text-xs bg-white border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <input
          placeholder="Filtrar por número da Fatura..."
          value={searchFatura}
          onChange={(e) => handleSearchFaturaChange(e.target.value)}
          className="w-full sm:max-w-xs text-xs bg-white border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <select
          value={statusFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="w-full sm:w-[200px] text-xs bg-white border border-gray-200 px-3 py-2 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
        >
          <option value="all">Todos os Status</option>
          <option value="pendente">Pagamento Pendente</option>
          <option value="pago">Frete Pago</option>
        </select>
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="text-xs font-bold text-gray-500 hover:text-gray-800 underline underline-offset-2 cursor-pointer whitespace-nowrap"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 shadow-sm p-1">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Faturas de Frete</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Listagem de vendas com status de conciliação de frete.
            </p>
          </div>
          <div className="bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 rounded-sm self-start sm:self-center">
            {totalItems} {totalItems === 1 ? "registro" : "registros"}
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center items-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <Table columns={columns} data={vendas} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <span className="text-xs text-gray-500 font-medium">
              Página {currentPage} de {totalPages}
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-7 w-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex gap-1 mx-1">
                {getPageNumbers().map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`h-7 w-7 text-xs font-bold cursor-pointer ${
                      currentPage === num
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                className="h-7 w-7 flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {previewData && (
        <FretePreviewModal
          data={previewData}
          onClose={() => setPreviewData(null)}
          onConfirm={handleConfirmImport}
          loading={isProcessing}
        />
      )}
    </div>
  );
}