import { useState, useRef } from 'react';
import { X, CloudUpload, ArrowLeft, Check, Loader2, AlertTriangle, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { importDevolutionsService, ImportDevolutionsResponse, DevolutionRowPayload } from '../../api-routes/importDevolution';

interface ImportDevolutionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (result: { batchId: string; salesImported: number }) => void;
}

interface ImportResultData {
  batchId: string;
  salesImported: number; 
  duplicatedCount: number;
  missingInfoCount: number;
  duplicatedRows: ImportDevolutionsResponse['duplicatedRows'];
  missingRows: ImportDevolutionsResponse['missingRows'];
}

export function ImportDevolutionsModal({ isOpen, onClose, onFinish }: ImportDevolutionsModalProps) {
  if (!isOpen) return null;

  const [step, setStep] = useState<1 | 2>(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<DevolutionRowPayload[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorSaving, setErrorSaving] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResultData | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(previewRows.length / rowsPerPage);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── FUNÇÃO AUXILIAR DE CONVERSÃO BLINDADA COM LOGS ───
  const parseCurrencyValue = (value: any, columnName: string, rowNum: number): number => {
    if (typeof value === 'number') {
      if (isNaN(value)) return 0;
      return value;
    }

    if (value === undefined || value === null) return 0;

    const originalValue = String(value);

    if (originalValue.includes('-')) {
      const checkEmpty = originalValue.replace(/R\$\s?/g, '').replace(/\s/g, '').trim();
      if (checkEmpty === '-' || checkEmpty === '') {
        return 0;
      }
    }

    try {
      let cleanStr = originalValue
        .replace(/R\$\s?/g, '')
        .replace(/\u00a0/g, '')
        .replace(/\s/g, '')
        .trim();

      if (!cleanStr) return 0;

      if (cleanStr.includes(',') && cleanStr.includes('.')) {
        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
      } else if (cleanStr.includes(',')) {
        cleanStr = cleanStr.replace(',', '.');
      }

      const parsed = parseFloat(cleanStr);

      if (isNaN(parsed)) {
        console.warn(`⚠️ [Mapeamento de Moeda] Valor inválido na Linha ${rowNum}, Coluna [${columnName}]. Recebido: "${originalValue}" -> Convertido para 0`);
        return 0;
      }

      return parsed;
    } catch (err) {
      console.error(`🚨 [Erro Crítico na Conversão] Linha ${rowNum}, Coluna [${columnName}]:`, err);
      return 0;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);

      console.log(`\n=== 📥 INICIANDO LEITURA DO ARQUIVO DE DEVOLUÇÕES: ${file.name} ===`);

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary", cellDates: false });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        const rawData: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });
        
        console.log(`📊 Total de linhas brutas identificadas na planilha: ${rawData.length}`);

        if (rawData.length > 0) {
          console.log("🔍 Estrutura da primeira linha capturada do arquivo:", rawData[0]);

          // ─── DEFESA E VALIDAÇÃO AUTOMATIZADA DE ESPAÇOS ───
          const cleanData = rawData.map((row: any) => {
            const cleanRow: any = {};
            Object.keys(row).forEach((key) => {
              const cleanKey = key.trim().toUpperCase();
              let value = row[key];
              
              if (typeof value === 'string') {
                value = value.trim();
              }
              cleanRow[cleanKey] = value;
            });
            return cleanRow;
          });

          console.log("🧼 Estrutura da primeira linha após higienização:", cleanData[0]);

          // ✨ MAPEA OS NOMES CORRETOS BASEADO NOS NOVOS PARAMETROS
          const formattedRows: DevolutionRowPayload[] = cleanData.map((row: any, index: number) => {
            const rowNum = index + 2;
            
            return {
              nf: String(row["NOTA"] || row["NOTAS"] || row["NF"] || "S/N").trim(),
              idDevolucao: String(row["DEVOLUÇÃO"] || row["DEVOLUCAO"] || row["ID DEVOLUÇÃO"] || "").trim(),
              baseIcms: parseCurrencyValue(row["BASE"] || row["BASE ICMS"] || 0, "BASE", rowNum),
              valor: parseCurrencyValue(row["VALOR"] || row["VALOR DEVOLVIDO"] || 0, "VALOR", rowNum),
              motivoDevolucao: String(row["MOTIVO"] || row["MOTIVO DEVOLUÇÃO"] || "NÃO INFORMADO").trim(),
              tratativa: row["TRATATIVA"] ? String(row["TRATATIVA"]).trim() : undefined
            };
          });

          console.log("✨ Primeiras 3 linhas estruturadas prontas para envio:", formattedRows.slice(0, 3));
          console.log(`=== 🏁 FIM DO MAPEAMENTO: ${formattedRows.length} linhas de devolução preparadas ===\n`);

          setPreviewRows(formattedRows);
          setStep(2);
        }
      };
      reader.readAsBinaryString(file);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    setErrorSaving(null);

    console.log("🚀 Enviando lote de devoluções para auditoria e gravação no servidor...");

    try {
      const payload = {
        rows: previewRows
      };

      const response = await importDevolutionsService.importData(payload);
      
      console.log("✅ Resposta de Sucesso do Servidor:", response);

      setImportResult({
        batchId: response.batchId || 'N/A',
        salesImported: response.salesImported || 0,
        duplicatedCount: response.duplicatedCount || 0,
        missingInfoCount: response.missingInfoCount || 0,
        duplicatedRows: response.duplicatedRows || [],
        missingRows: response.missingRows || []
      });

    } catch (err: any) {
      console.error("❌ Erro retornado na auditoria de devoluções:", err);
      setErrorSaving(err.message || "Ocorreu um erro crítico na auditoria de devoluções no servidor.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!importResult) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const duplicatedHtml = importResult.duplicatedRows.map((r: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px; font-family: monospace; font-weight: bold;">${r.nf}</td>
        <td style="padding: 6px;">${r.loja}</td>
        <td style="padding: 6px; color: #b45309;">${r.motivo}</td>
      </tr>
    `).join('');

    const missingHtml = importResult.missingRows.map((r: any) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 6px; font-family: monospace; font-weight: bold;">${r.nf}</td>
        <td style="padding: 6px;">${r.loja}</td>
        <td style="padding: 6px; color: #b91c1c;">${r.motivo}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Relatório de Auditoria de Devoluções - Lote ${importResult.batchId}</title>
          <style>
            body { font-family: sans-serif; color: #334155; padding: 20px; font-size: 12px; }
            h2 { color: #1e1b4b; margin-bottom: 5px; }
            .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: left; }
            th { background: #f1f5f9; padding: 6px; font-weight: bold; }
            .section-title { font-weight: bold; text-transform: uppercase; margin-top: 25px; display: block; font-size: 11px; letter-spacing: 0.5px; }
          </style>
        </head>
        <body>
          <h2>Relatório de Consistência - Importação de Devoluções</h2>
          <p>Análise de Auditoria Gerada em ${new Date().toLocaleString('pt-BR')}</p>
          
          <div class="summary">
            <strong>ID do Lote de Devolução:</strong> ${importResult.batchId}<br/>
            <strong>Devoluções Processadas com Sucesso:</strong> ${importResult.salesImported} registros<br/>
            <strong>Duplicidades Rejeitadas:</strong> ${importResult.duplicatedCount}<br/>
            <strong>Inconsistências/Notas Não Encontradas:</strong> ${importResult.missingInfoCount}
          </div>

          ${importResult.duplicatedCount > 0 ? `
            <span class="section-title" style="color: #d97706;">⚠️ Tentativas de Duplicidade de Estorno</span>
            <table>
              <thead>
                <tr><th>NF</th><th>Loja Identificada</th><th>Motivo do Bloqueio</th></tr>
              </thead>
              <tbody>${duplicatedHtml}</tbody>
            </table>
          ` : ''}

          ${importResult.missingInfoCount > 0 ? `
            <span class="section-title" style="color: #dc2626;">❌ Devoluções Sem Venda Correspondente ou Dados Inválidos</span>
            <table>
              <thead>
                <tr><th>NF</th><th>Loja Identificada</th><th>Motivo da Rejeição</th></tr>
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
    setCurrentPage(1);
    setErrorSaving(null);
    setImportResult(null);
    onClose();
  };

  const currentRows = previewRows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-slate-900">
      <div className="bg-white border border-slate-200 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-5 py-4 border-b border-indigo-100 flex items-center justify-between bg-indigo-50/60">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-600 text-white rounded-xs">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Conciliação de Devoluções & Estornos</h3>
              <p className="text-[11px] text-indigo-700/80 font-mono mt-0.5">
                {importResult
                  ? "Resultado Final da Auditoria de Lote"
                  : `Etapa ${step} de 2: ${step === 1 ? "Upload de Planilha" : "Auditoria de Retornos"}`
                }
              </p>
            </div>
          </div>
          <button onClick={handleClose} disabled={isSaving} className="p-1 hover:bg-indigo-100/80 text-indigo-400 hover:text-indigo-900 cursor-pointer disabled:opacity-30">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 flex-1 overflow-y-auto">

          {/* TELA DE RELATÓRIO PÓS-AUDITORIA PROFUNDA */}
          {importResult ? (
            <div className="space-y-5">
              {importResult.duplicatedCount === 0 && importResult.missingInfoCount === 0 ? (
                <div className="p-4 bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-start gap-3">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-indigo-950">✓ Auditoria Concluída Sem Inconsistências!</strong>
                    <p className="mt-1">Todas as <strong>{importResult.salesImported}</strong> devoluções foram vinculadas e processadas com sucesso ao lote <span className="font-mono bg-indigo-100 px-1 font-bold">{importResult.batchId}</span>.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-amber-900">⚠ Lote Processado com Inconsistências Retidas!</strong>
                    <p className="mt-1">
                      O motor financeiro consolidou <strong>{importResult.salesImported}</strong> estornos limpos com sucesso no lote <span className="font-mono bg-amber-100 px-1 font-bold">{importResult.batchId}</span>.
                    </p>
                    <p className="mt-1 font-medium text-amber-950">
                      Contudo, a auditoria profunda **rejeitou {importResult.duplicatedCount + importResult.missingInfoCount} linhas** que possuíam duplicidades ou notas fiscais sem venda correspondente no sistema.
                    </p>
                  </div>
                </div>
              )}

              {/* Grid de Métricas Financeiras */}
              <div className="grid grid-cols-3 gap-3 text-center border border-slate-100 p-3 bg-slate-50 font-mono">
                <div>
                  <span className="block text-[10px] text-slate-500 font-sans uppercase font-bold">Processadas</span>
                  <span className="text-base font-bold text-indigo-700">{importResult.salesImported}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-sans uppercase font-bold">Duplicadas</span>
                  <span className="text-base font-bold text-amber-600">{importResult.duplicatedCount}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-sans uppercase font-bold">Invalidadas</span>
                  <span className="text-base font-bold text-red-600">{importResult.missingInfoCount}</span>
                </div>
              </div>

              {/* Log de Erros */}
              {(importResult.duplicatedCount > 0 || importResult.missingInfoCount > 0) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Log de Inconsistências de Devoluções</span>
                    <button
                      onClick={handleDownloadPDF}
                      className="text-xs bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2.5 py-1 flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Exportar Extrato de Erros (PDF)
                    </button>
                  </div>

                  <div className="border border-slate-200 text-xs max-h-48 overflow-y-auto font-mono divide-y divide-slate-100 bg-white">
                    {importResult.duplicatedRows.map((row: any, i: number) => (
                      <div key={`dup-${i}`} className="p-2 flex items-center justify-between hover:bg-amber-50/20 bg-amber-50/5">
                        <span className="text-slate-900 font-bold">
                          <span className="text-amber-600 font-sans font-normal mr-1">[Duplicado]</span> 
                          NF: {row.nf} — <span className="font-sans text-slate-500">{row.loja}</span>
                        </span>
                        <span className="text-[11px] text-amber-700 font-sans italic font-bold">{row.motivo}</span>
                      </div>
                    ))}
                    {importResult.missingRows.map((row: any, i: number) => (
                      <div key={`miss-${i}`} className="p-2 flex items-center justify-between hover:bg-red-50/20 bg-red-50/5">
                        <span className="text-slate-900 font-bold">
                          <span className="text-red-600 font-sans font-normal mr-1">[Rejeitado]</span> 
                          NF: {row.nf} — <span className="font-sans text-slate-500">{row.loja}</span>
                        </span>
                        <span className="text-[11px] text-red-700 font-sans italic font-bold">{row.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* PASSO 1: Upload do Arquivo */}
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-600">Envie a planilha contendo as devoluções com as colunas reais da sua operação: <strong className="font-mono">NF, DEVOLUÇÃO, BASE, VALOR, MOTIVO e TRATATIVA</strong>.</p>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border border-dashed border-indigo-200 p-12 flex flex-col items-center justify-center gap-2.5 bg-indigo-50/10 hover:bg-indigo-50/30 transition-colors cursor-pointer group"
                  >
                    <CloudUpload size={36} className="text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-xs font-semibold text-indigo-950">Selecionar arquivo de devoluções (.xlsx, .csv)</span>
                    <input ref={fileInputRef} type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileChange} />
                  </div>
                </div>
              )}

              {/* PASSO 2: Preview de Lançamentos */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 px-3 py-2">
                    <span className="text-slate-700 font-medium">Arquivo: <strong className="font-mono">{fileName}</strong></span>
                    <span className="font-bold text-indigo-950 font-mono">{previewRows.length} lançamentos mapeados</span>
                  </div>

                  {errorSaving && (
                    <div className="text-xs text-red-600 bg-red-50 p-2.5 border border-red-200 font-medium">{errorSaving}</div>
                  )}

                  <div className="border border-slate-200 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs min-w-[600px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                          <th className="p-2">NF</th>
                          <th className="p-2">ID DEVOLUÇÃO</th>
                          <th className="p-2">BASE ICMS</th>
                          <th className="p-2">VALOR</th>
                          <th className="p-2">MOTIVO</th>
                          <th className="p-2">TRATATIVA</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono divide-y divide-slate-100">
                        {currentRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2 text-slate-900 font-bold">{row.nf}</td>
                            <td className="p-2 text-slate-600 font-semibold">{row.idDevolucao || '-'}</td>
                            <td className="p-2 text-slate-600">
                              {row.baseIcms.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-2 text-red-600 font-bold">
                              {row.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                            <td className="p-2 text-slate-600 font-sans text-[11px] max-w-[150px] truncate" title={row.motivoDevolucao}>
                              {row.motivoDevolucao}
                            </td>
                            <td className="p-2 text-slate-500 font-sans text-[11px] max-w-[120px] truncate" title={row.tratativa}>
                              {row.tratativa || <span className="text-slate-300 italic">Nenhuma</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] font-medium text-slate-500">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-1">
                      <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-2 py-1 text-xs border border-slate-200 disabled:opacity-40 font-bold cursor-pointer hover:bg-slate-50">Anterior</button>
                      <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 text-xs border border-slate-200 disabled:opacity-40 font-bold cursor-pointer hover:bg-slate-50">Próximo</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            {step > 1 && !importResult && (
              <button
                disabled={isSaving}
                onClick={() => { setStep(1); setCurrentPage(1); }}
                className="text-xs font-bold text-slate-600 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Substituir Arquivo
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {importResult ? (
              <button
                onClick={handleClose}
                className="bg-indigo-950 text-white px-5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer hover:bg-indigo-900"
              >
                Fechar e Concluir Lote
              </button>
            ) : (
              <>
                <button onClick={handleClose} disabled={isSaving} className="px-4 py-1.5 text-xs font-bold text-slate-500 cursor-pointer disabled:opacity-40">Cancelar</button>
                {step === 2 && (
                  <button
                    onClick={handleComplete}
                    disabled={isSaving}
                    className="bg-indigo-600 text-white px-5 py-1.5 text-xs font-bold flex items-center gap-1 cursor-pointer min-w-[160px] justify-center hover:bg-indigo-700 shadow-sm"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando Estornos...
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" /> Processar Devoluções
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

