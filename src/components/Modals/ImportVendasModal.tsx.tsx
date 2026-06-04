// src/components/Modals/ImportVendasModal.tsx
import { useState, useRef, useEffect } from 'react';
import { X, CloudUpload, Store, ArrowLeft, ArrowRight, Check, Loader2, FileText, AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Marketplace } from '../../types/financeiro';
import { marketplaceService } from '../../api-routes/marketplace';
import { ImportSalesPayload, importSalesService } from '../../api-routes/importSales';

interface ImportVendasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (result: { batchId: string; salesImported: number }) => void;
}

interface ImportResultData {
  batchId: string;
  salesImported: number;
  duplicatedCount: number;
  missingInfoCount: number;
  duplicatedRows: any[];
  missingRows: any[];
}

export function ImportVendasModal({ isOpen, onClose, onFinish }: ImportVendasModalProps) {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [detectedStores, setDetectedStores] = useState<string[]>([]);
  const [storeMapping, setStoreMapping] = useState<Record<string, string>>({});

  // Estados para a busca dos marketplaces
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isLoadingMarketplaces, setIsLoadingMarketplaces] = useState(false);
  const [errorMarketplaces, setErrorMarketplaces] = useState<string | null>(null);

  // Estados para o salvamento/envio final da conciliação
  const [isSaving, setIsSaving] = useState(false);
  const [errorSaving, setErrorSaving] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(previewRows.length / rowsPerPage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca os marketplaces da API quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      async function loadMarketplaces() {
        setIsLoadingMarketplaces(true);
        setErrorMarketplaces(null);
        try {
          const data = await marketplaceService.list();
          setMarketplaces(data || []);
        } catch (err: any) {
          console.error("Erro ao buscar marketplaces:", err);
          setErrorMarketplaces("Não foi possível carregar os marketplaces cadastrados.");
        } finally {
          setIsLoadingMarketplaces(false);
        }
      }

      loadMarketplaces();
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;

        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const data: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });

        if (data.length > 0) {
          const formattedRows = data.map((row: any) => {
            let rawData = row["DATA"] || row["Data"] || row["data"] || "S/D";
            let formattedDate = String(rawData).trim();

            if (!isNaN(Number(formattedDate)) && Number(formattedDate) > 30000) {
              const excelSerial = Number(formattedDate);
              const jsDate = new Date((excelSerial - 25569) * 86400 * 1000);

              const day = String(jsDate.getUTCDate()).padStart(2, '0');
              const month = String(jsDate.getUTCMonth() + 1).padStart(2, '0');
              const year = jsDate.getUTCFullYear();
              formattedDate = `${day}/${month}/${year}`;
            } 
            else if (formattedDate.includes('/')) {
              const parts = formattedDate.split('/');

              if (parts.length === 3) {
                const month = parts[0].padStart(2, '0');
                const day = parts[1].padStart(2, '0');
                let year = parts[2];

                if (year.length === 2) {
                  year = `20${year}`;
                }

                formattedDate = `${day}/${month}/${year}`;
              }
            }

            let rawValue = row["BASE ICMS"] || row["Base ICMS"] || row["base_icms"] || row["Valor Bruto"] || 0;
            let finalValue = 0;

            if (typeof rawValue === 'number') {
              finalValue = rawValue;
            } else if (typeof rawValue === 'string') {
              let cleanStr = rawValue.replace(/R\$\s?/g, '').trim();

              if (cleanStr.includes(',') && cleanStr.includes('.')) {
                cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
              } else if (cleanStr.includes(',')) {
                cleanStr = cleanStr.replace(',', '.');
              }

              finalValue = parseFloat(cleanStr) || 0;
            }

            return {
              nf: String(row["NF"] || String(row["NOTA"]) || row["nf"] || row["Nota Fiscal"] || row["Pedido ID"] || "S/N").trim(),
              data: formattedDate,
              baseIcms: finalValue,
              loja: String(row["LOJA"] || row["Loja"] || row["loja"] || "Não Informada").trim()
            };
          });

          const uniqueStores = Array.from(
            new Set(formattedRows.map(r => r.loja).filter(Boolean))
          );

          setPreviewRows(formattedRows);
          setDetectedStores(uniqueStores);
          setStep(2);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setErrorSaving(null);

    try {
      const payload: ImportSalesPayload = {
        rows: previewRows,
        storeMapping: storeMapping
      };

      const response = await importSalesService.importData(payload);
      
      // Armazena a resposta detalhada do servidor para montar o relatório final
      setImportResult({
        batchId: response.batchId || 'N/A',
        salesImported: response.salesImported || 0,
        duplicatedCount: response.duplicatedCount || 0,
        missingInfoCount: response.missingInfoCount || 0,
        duplicatedRows: response.duplicatedRows || [],
        missingRows: response.missingRows || []
      });

    } catch (err: any) {
      console.error("Erro ao importar vendas:", err);
      setErrorSaving(err.message || "Ocorreu um erro ao processar a importação no servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  // Função nativa e performática para exportar o relatório de erros em formato PDF
  const handleDownloadPDF = () => {
    if (!importResult) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const duplicatedHtml = importResult.duplicatedRows.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px; font-family: monospace;">${r.nf}</td>
        <td style="padding: 6px;">${r.loja}</td>
        <td style="padding: 6px; color: #b45309;">${r.motivo}</td>
      </tr>
    `).join('');

    const missingHtml = importResult.missingRows.map(r => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px; font-family: monospace;">${r.nf}</td>
        <td style="padding: 6px;">${r.data}</td>
        <td style="padding: 6px; color: #b91c1c;">${r.motivo}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Inconsistências - Lote ${importResult.batchId}</title>
          <style>
            body { font-family: sans-serif; color: #334155; padding: 20px; font-size: 12px; }
            h2 { color: #0f172a; margin-bottom: 5px; }
            .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 20px; }
            table { wIdth: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; }
            th { background: #f1f5f9; padding: 6px; font-weight: bold; }
            .section-title { font-weight: bold; text-transform: uppercase; margin-top: 25px; display: block; font-size: 11px; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <h2>Relatório de Auditoria de Importação</h2>
          <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
          
          <div class="summary">
            <strong>ID do Lote:</strong> ${importResult.batchId}<br/>
            <strong>Processadas com Sucesso:</strong> ${importResult.salesImported} registros<br/>
            <strong>Duplicadas Ignoradas:</strong> ${importResult.duplicatedCount}<br/>
            <strong>Dados Faltando Ignorados:</strong> ${importResult.missingInfoCount}
          </div>

          ${importResult.duplicatedCount > 0 ? `
            <span class="section-title" style="color: #d97706;">⚠️ Vendas Duplicadas</span>
            <table>
              <thead>
                <tr><th>NF</th><th>Loja Identificada</th><th>Motivo</th></tr>
              </thead>
              <tbody>${duplicatedHtml}</tbody>
            </table>
          ` : ''}

          ${importResult.missingInfoCount > 0 ? `
            <span class="section-title" style="color: #dc2626;">❌ Campos Inválidos ou Faltando</span>
            <table>
              <thead>
                <tr><th>NF</th><th>Data Encontrada</th><th>Motivo</th></tr>
              </thead>
              <tbody>${missingHtml}</tbody>
            </table>
          ` : ''}

          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleClose = () => {
    if (importResult) {
      onFinish({
        batchId: importResult.batchId,
        salesImported: importResult.salesImported
      });
    }
    setStep(1);
    setFileName(null);
    setPreviewRows([]);
    setDetectedStores([]);
    setStoreMapping({});
    setCurrentPage(1);
    setErrorSaving(null);
    setImportResult(null);
    onClose();
  };

  const currentRows = previewRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white border border-gray-200 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900">Importação de Planilha de Vendas</h3>
            <p className="text-[11px] text-gray-500 font-mono mt-0.5">
              {importResult 
                ? "Resumo Operacional da Importação" 
                : `Passo ${step} de 3: ${step === 1 ? "Upload" : step === 2 ? "Preview de Dados" : "Mapear Lojas"}`
              }
            </p>
          </div>
          <button onClick={handleClose} disabled={isSaving} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-700 cursor-pointer disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 flex-1 overflow-y-auto">
          
          {/* TELA DE RELATÓRIO PÓS-SALVAMENTO (Caso exista resultado) */}
          {importResult ? (
            <div className="space-y-5">
              
              {/* Mensagem Condicional Dinâmica Baseada nas Ocorrências */}
              {importResult.duplicatedCount === 0 && importResult.missingInfoCount === 0 ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-emerald-900">✓ Importação Concluída com Sucesso Total!</strong>
                    <p className="mt-1">Todos os <strong>{importResult.salesImported}</strong> registros mapeados da sua planilha foram integrados com sucesso ao lote <span className="font-mono bg-emerald-100 px-1 font-bold">{importResult.batchId}</span>.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-900">⚠ Importação Concluída com Sucesso Parcial!</strong>
                    <p className="mt-1">
                      O sistema salvou <strong>{importResult.salesImported}</strong> registros novos com sucesso no lote <span className="font-mono bg-amber-100 px-1 font-bold">{importResult.batchId}</span>.
                    </p>
                    <p className="mt-1 font-medium text-amber-950">
                      Contudo, um total de <strong>{importResult.duplicatedCount + importResult.missingInfoCount} registros foram rejeitados</strong> e descartados para evitar a poluição de duplicidades na sua base financeira.
                    </p>
                  </div>
                </div>
              )}

              {/* Box Informativo de Métricas Gerais */}
              <div className="grid grid-cols-3 gap-3 text-center border border-gray-100 p-3 bg-gray-50 font-mono">
                <div>
                  <span className="block text-[10px] text-gray-500 font-sans uppercase font-bold">Gravadas</span>
                  <span className="text-base font-bold text-emerald-700">{importResult.salesImported}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-sans uppercase font-bold">Duplicadas</span>
                  <span className="text-base font-bold text-amber-600">{importResult.duplicatedCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-sans uppercase font-bold">Campos Nulos</span>
                  <span className="text-base font-bold text-red-600">{importResult.missingInfoCount}</span>
                </div>
              </div>

              {/* Preview das Inconsistências Capturadas */}
              {(importResult.duplicatedCount > 0 || importResult.missingInfoCount > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Visualização de Linhas Descartadas</span>
                    <button 
                      onClick={handleDownloadPDF}
                      className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-1 flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Imprimir / Baixar PDF
                    </button>
                  </div>

                  <div className="border border-gray-200 text-xs max-h-48 overflow-y-auto font-mono divide-y divide-gray-100 bg-white">
                    {/* Linhas duplicadas */}
                    {importResult.duplicatedRows.map((row, i) => (
                      <div key={`dup-${i}`} className="p-2 flex items-center justify-between hover:bg-amber-50/20 bg-amber-50/5">
                        <span className="text-gray-900 font-bold"><span className="text-amber-600 font-sans font-normal mr-1">[Duplicada]</span> NF: {row.nf}</span>
                        <span className="text-[11px] text-amber-700 font-sans italic">{row.motivo}</span>
                      </div>
                    ))}
                    {/* Linhas vazias ou erradas */}
                    {importResult.missingRows.map((row, i) => (
                      <div key={`miss-${i}`} className="p-2 flex items-center justify-between hover:bg-red-50/20 bg-red-50/5">
                        <span className="text-gray-900 font-bold"><span className="text-red-600 font-sans font-normal mr-1">[Erro Dado]</span> NF: {row.nf}</span>
                        <span className="text-[11px] text-red-700 font-sans italic">{row.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : (
            /* FLUXO TRADICIONAL DE IMPORTAÇÃO (Passos 1, 2 e 3) */
            <>
              {/* PASSO 1: Upload do Arquivo */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-600">Envie o arquivo original contendo as colunas <strong className="font-mono">NF, DATA, BASE ICMS e LOJA</strong> para conciliação.</p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-gray-300 p-12 flex flex-col items-center justify-center gap-2.5 bg-gray-50 hover:bg-gray-100/50 transition-colors cursor-pointer group"
                  >
                    <CloudUpload size={36} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <span className="text-xs font-semibold text-gray-600">Clique para selecionar a planilha de vendas (.csv ou .xlsx)</span>
                    <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {/* PASSO 2: Preview da Tabela */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 px-3 py-2">
                    <span className="text-gray-700 font-medium">Arquivo: <strong className="font-mono">{fileName}</strong></span>
                    <span className="font-bold text-gray-900 font-mono">{previewRows.length} linhas</span>
                  </div>

                  <div className="border border-gray-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700">
                          <th className="p-2">NF</th>
                          <th className="p-2">DATA</th>
                          <th className="p-2">BASE ICMS</th>
                          <th className="p-2">LOJA</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-gray-100">
                        {currentRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-2 text-gray-900 font-bold">{row.nf}</td>
                            <td className="p-2 text-gray-600">{row.data}</td>
                            <td className="p-2 text-gray-900">
                              {typeof row.baseIcms === 'number'
                                ? row.baseIcms.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                                : row.baseIcms}
                            </td>
                            <td className="p-2 text-gray-700 font-sans">{row.loja}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-medium text-gray-500">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-1">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 text-xs border border-gray-200 disabled:opacity-40 font-bold cursor-pointer hover:bg-gray-50">Anterior</button>
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 text-xs border border-gray-200 disabled:opacity-40 font-bold cursor-pointer hover:bg-gray-50">Próximo</button>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSO 3: Mapeamento de Marketplaces */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="bg-gray-50 border border-gray-200 p-3 flex gap-2">
                    <Store className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-600">Diga ao sistema a qual <strong>Marketplace Oficial</strong> pertence cada uma das nomenclaturas de loja encontradas na sua planilha.</p>
                  </div>

                  {errorMarketplaces && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 border border-red-200">{errorMarketplaces}</div>
                  )}

                  {errorSaving && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 border border-red-200 font-medium">{errorSaving}</div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {detectedStores.map((storeName) => (
                      <div key={storeName} className="flex items-center justify-between p-2.5 border border-gray-200 bg-white gap-4">
                        <span className="text-xs font-bold text-gray-800 font-mono truncate">{storeName}</span>

                        <div className="relative w-56">
                          <select
                            disabled={isLoadingMarketplaces || isSaving}
                            value={storeMapping[storeName] || ""}
                            onChange={(e) => setStoreMapping(prev => ({ ...prev, [storeName]: e.target.value }))}
                            className="border border-gray-200 px-2 py-1 text-xs bg-gray-50 outline-none text-gray-700 w-full font-medium cursor-pointer disabled:opacity-50"
                          >
                            <option value="" disabled hidden>
                              {isLoadingMarketplaces ? "Carregando..." : "Vincular Marketplace..."}
                            </option>
                            {marketplaces.map((m) => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                          {isLoadingMarketplaces && (
                            <Loader2 className="w-3 h-3 animate-spin absolute right-2 top-2 text-gray-400" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé / Ações */}
        <div className="px-5 py-3.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            {step > 1 && !importResult && (
              <button
                disabled={isSaving}
                onClick={() => setStep(p => (p - 1) as any)}
                className="text-xs font-bold text-gray-600 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {importResult ? (
              <button 
                onClick={handleClose} 
                className="bg-slate-900 text-white px-5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                Concluir Operação
              </button>
            ) : (
              <>
                <button onClick={handleClose} disabled={isSaving} className="px-4 py-1.5 text-xs font-bold text-gray-500 cursor-pointer disabled:opacity-40">Cancelar</button>
                {step === 2 && (
                  <button onClick={() => setStep(3)} className="bg-gray-900 text-white px-4 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer">
                    Próximo Passo <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={handleComplete}
                    disabled={detectedStores.some(s => !storeMapping[s]) || isLoadingMarketplaces || isSaving}
                    className="bg-emerald-700 disabled:opacity-40 text-white px-4 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer min-w-[150px] justify-center"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando Lote...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Concluir Conciliação
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}