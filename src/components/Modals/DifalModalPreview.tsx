// apps/web/src/components/Modals/DifalModalPreview.tsx
import { Loader2, X, FileSpreadsheet } from "lucide-react";
import type { VendaDifal } from "../../api-routes/difal.ts";

interface DifalPreviewModalProps {
  data: Partial<VendaDifal>[];
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

function formatValor(valor?: number) {
  if (valor === undefined || valor === null || isNaN(valor)) return "-";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatData(data?: string) {
  if (!data) return "-";
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString("pt-BR");
}

export function DifalPreviewModal({
  data,
  onClose,
  onConfirm,
  loading,
}: DifalPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-4xl max-h-[85vh] flex flex-col shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gray-900 text-white rounded-sm">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Confirmar importação de DIFAL
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {data.length} {data.length === 1 ? "linha encontrada" : "linhas encontradas"} na
                planilha. Revise antes de confirmar.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-700 disabled:opacity-40 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabela de preview */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-xs text-left">
            <thead className="text-[10px] uppercase font-bold bg-gray-50 sticky top-0 text-gray-600">
              <tr>
                <th className="px-4 py-2.5">NF</th>
                <th className="px-4 py-2.5">Valor</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Fatura</th>
                <th className="px-4 py-2.5">Data</th>
                <th className="px-4 py-2.5">Loja</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">
                    #{row.nf || "S/N"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{formatValor(row.valor)}</td>
                  <td className="px-4 py-2.5">
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase bg-gray-100 text-gray-700 rounded-sm">
                      {row.estado || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-700">
                    {row.NumeroFatura || "-"}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{formatData(row.data)}</td>
                  <td className="px-4 py-2.5 uppercase tracking-wide text-gray-700">
                    {row.loja || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-4 py-2 cursor-pointer disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 cursor-pointer disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Confirmar importação
          </button>
        </div>
      </div>
    </div>
  );
}