import { useState } from 'react';
import { ChevronDown, FileDown, ShoppingCart, CreditCard, Undo2, RefreshCcw } from 'lucide-react';
import { ModalType } from '../../types/financeiro';
import { VisibilityToggle } from '../VisibilityToggle';

interface FinanceiroHeaderProps {
  setActiveModal: (type: ModalType) => void;
  openImportModal: (type: "venda" | "pagamento" | "reembolso" | "devolucao", label: string) => void;
}

export function FinanceiroHeader({ setActiveModal, openImportModal }: FinanceiroHeaderProps) {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-200 pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gerenciamento de Vendas</h1>
      </div>

      <div className="flex items-center gap-2">
      <VisibilityToggle />
      <div className="relative">
        <button
          onClick={() => setIsActionsOpen(!isActionsOpen)}
          className="bg-gray-900 hover:bg-gray-800 text-white gap-2 px-4 h-9 text-xs font-bold transition-all shadow-sm flex items-center cursor-pointer"
        >
          Ações <ChevronDown className="w-4 h-4 opacity-70" />
        </button>

        {isActionsOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsActionsOpen(false)} />
            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 shadow-xl z-20 p-1">
              <button
                onClick={() => { setActiveModal('export_vendas'); setIsActionsOpen(false); }}
                className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left"
              >
                <FileDown className="w-4 h-4 mr-2 text-blue-500" /> Exportar Vendas
              </button>
              <div className="border-t border-gray-100 my-1" />
              <div className="px-2 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider text-left bg-gray-50/50">
                Importação de Arquivos
              </div>
              <button onClick={() => openImportModal("venda", "Vendas")} className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left">
                <ShoppingCart className="w-4 h-4 mr-2 text-green-600" /> Planilha de Vendas
              </button>
              <button onClick={() => openImportModal("pagamento", "Pagamentos")} className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left">
                <CreditCard className="w-4 h-4 mr-2 text-indigo-600" /> Planilha de Pagamentos
              </button>
              <button onClick={() => openImportModal("reembolso", "Reembolsos")} className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left">
                <Undo2 className="w-4 h-4 mr-2 text-rose-500" /> Planilha de Reembolso
              </button>
              <button onClick={() => openImportModal("devolucao", "Devoluções")} className="w-full flex items-center px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left">
                <RefreshCcw className="w-4 h-4 mr-2 text-amber-600" /> Planilha de Devolução
              </button>
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}