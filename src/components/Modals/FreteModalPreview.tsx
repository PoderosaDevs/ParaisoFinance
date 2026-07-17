// apps/web/src/components/Modals/FreteModalPreview.tsx
import { Loader2, Truck } from "lucide-react";
import Modal from "../Modal.tsx";

interface PreviewProps {
  data: any[];
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function FretePreviewModal({ data, onClose, onConfirm, loading }: PreviewProps) {
  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Prévia da Importação de Faturas"
      footer={
        <div className="flex items-center justify-between w-full gap-4">
          <span className="text-xs font-semibold text-gray-500">
            {data.length} {data.length === 1 ? "fatura pronta" : "faturas prontas"} para processamento
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || data.length === 0}
              className="inline-flex items-center bg-gray-900 text-white px-4 py-2 text-xs font-bold hover:bg-gray-800 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />}
              Confirmar Importação
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-sm">
            <Truck className="w-4 h-4" />
          </div>
          <p className="text-xs text-gray-500">
            Revise as notas lidas na planilha antes de enviar para o processamento.
          </p>
        </div>

        <div className="border border-gray-200 max-h-[50vh] overflow-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Nota Fiscal
                </th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Fatura
                </th>
                <th className="px-4 py-2.5 font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Loja
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-mono font-semibold text-gray-800">
                    #{item.nf}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-gray-600">
                    {item.fatura || "---"}
                  </td>
                  <td className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    {item.loja}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}