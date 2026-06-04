import { useState, useEffect } from 'react';
import { Store as StoreIcon, MoreVertical, MapPin, Plus, Trash2, Edit2, X, Layers } from 'lucide-react';
import { storeService, Store, CreateStorePayload } from '../api-routes/store';
import { marketplaceService, Marketplace } from '../api-routes/marketplace';
import Modal from '../components/Modal';

export default function Lojas() {
  // ─── ESTADOS PRINCIPAIS ───
  const [lojas, setLojas] = useState<Store[]>([]);
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // ─── ESTADOS DOS MODAIS & FORMULÁRIOS ───
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState<Store | null>(null);

  // Campos do Formulário
  const [storeId, setStoreId] = useState('');
  const [storeName, setStoreName] = useState('');
  const [marketplaceId, setMarketplaceId] = useState('');

  // ─── CARGA DE DADOS DO BANCO ───
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      const [listaLojas, listaMarketplaces] = await Promise.all([
        storeService.list(),
        marketplaceService.list(),
      ]);
      setLojas(listaLojas || []);
      setMarketplaces(listaMarketplaces || []);
    } catch (err) {
      console.error('Erro ao carregar dados de lojas:', err);
      alert('Não foi possível sincronizar as lojas com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  // ─── OPERAÇÕES DO CRUD ───
  
  // 1. Criar Loja
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !marketplaceId) return alert('ID da Loja e Canal são obrigatórios!');

    try {
      const payload: CreateStorePayload = {
        id: storeId.trim(),
        marketplaceId: marketplaceId,
        // Caso sua API aceite o Name opcional no corpo:
        ...(storeName.trim() && { name: storeName.trim() })
      };

      await storeService.create(payload);
      alert('Loja cadastrada com sucesso!');
      setIsCreateOpen(false);
      limparFormulario();
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar a loja no banco.');
    }
  };

  // 2. Abrir Edição
  const abrirEdicao = (loja: Store) => {
    setSelectedLoja(loja);
    setStoreName(loja.name || loja.id);
    setMarketplaceId(loja.marketplaceId);
    setIsEditOpen(true);
    setActiveMenuId(null);
  };

  // 3. Salvar Edição
  const handleUpdateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoja) return;

    try {
      await storeService.update(selectedLoja.id, {
        marketplaceId: marketplaceId,
        // Se a sua API aceitar alteração de nome, passa aqui:
        name: storeName.trim()
      } as any);

      alert('Dados da loja atualizados!');
      setIsEditOpen(false);
      limparFormulario();
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar dados da loja.');
    }
  };

  // 4. Deletar Loja
  const handleDeleteStore = async (id: string) => {
    if (!confirm(`Deseja realmente remover a identificação de loja "${id}" do sistema?`)) return;

    try {
      await storeService.delete(id);
      alert('Loja removida com sucesso!');
      setActiveMenuId(null);
      carregarDados();
    } catch (err: any) {
      alert(err.message || 'Não foi possível deletar. Verifique se existem dependências vinculadas no banco.');
    }
  };

  const limparFormulario = () => {
    setStoreId('');
    setStoreName('');
    setMarketplaceId('');
    setSelectedLoja(null);
  };

  return (
    <div className="animate-in fade-in duration-500 text-slate-950 space-y-6">
      
      {/* Cabeçalho Superior com Ação Global */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Minhas Lojas</h1>
          <p className="text-xs text-gray-500 mt-0.5">Identificadores mapeados diretamente com os arquivos de conciliação.</p>
        </div>
        <button
          onClick={() => { limparFormulario(); setIsCreateOpen(true); }}
          className="bg-gray-900 hover:bg-gray-800 text-white gap-2 px-4 h-9 text-xs font-bold transition-all shadow-sm flex items-center cursor-pointer"
        >
          <Plus size={16} /> Nova Loja
        </button>
      </div>

      {/* Estado de Carregamento */}
      {isLoading ? (
        <div className="text-center py-12 text-xs font-medium text-gray-400 font-mono">
          Sincronizando lojas com o banco de dados...
        </div>
      ) : lojas.length === 0 ? (
        <div className="border border-dashed border-gray-200 bg-gray-50/50 p-12 text-center text-xs text-gray-400 font-medium">
          Nenhuma loja cadastrada no sistema. Clique em "Nova Loja" para começar.
        </div>
      ) : (
        /* Listagem de Lojas Dinâmica */
        <div className="grid grid-cols-1 gap-4">
          {lojas.map((loja) => (
            <div key={loja.id} className="relative flex items-center justify-between p-6 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-100 text-gray-800 flex items-center justify-center shrink-0">
                  <StoreIcon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">{loja.name || loja.id}</h3>
                  <div className="flex items-center gap-3 text-gray-400 text-xs mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Layers size={12} /> ID: <span className="text-gray-600 font-bold">{loja.id}</span>
                    </span>
                    <span>•</span>
                    <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                      {loja.marketplaceId || 'Sem Canal'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-right">
                <div>
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-0.5 tracking-wider">Mapeamento</p>
                  <p className="text-xs font-semibold font-mono text-emerald-700">Validado pela API</p>
                </div>
                
                {/* Menu de Ações em Dropdown Individual */}
                <div className="relative">
                  <button 
                    onClick={() => setActiveMenuId(activeMenuId === loja.id ? null : loja.id)}
                    className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {activeMenuId === loja.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                      <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 shadow-xl z-20 p-1 animate-in fade-in slide-in-from-top-1 duration-150">
                        <button
                          onClick={() => abrirEdicao(loja)}
                          className="w-full flex items-center px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 text-left cursor-pointer gap-2"
                        >
                          <Edit2 size={13} className="text-blue-500" /> Editar Canal
                        </button>
                        <div className="border-t border-gray-100 my-1" />
                        <button
                          onClick={() => handleDeleteStore(loja.id)}
                          className="w-full flex items-center px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer gap-2"
                        >
                          <Trash2 size={13} /> Excluir Loja
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── MODAL 1: CRIAÇÃO DE LOJA ─── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Cadastrar Nova Loja no Sistema"
      >
        <form onSubmit={handleCreateStore} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Identificador Exato (ID na Planilha) *
            </label>
            <input 
              type="text" 
              required
              placeholder="Ex: Amazon - PBLZ" 
              value={storeId} 
              onChange={(e) => setStoreId(e.target.value)} 
              className="w-full border border-gray-200 px-3 py-2 h-9 text-xs outline-none focus:border-gray-400 bg-gray-50/50"
            />
            <p className="text-[10px] text-gray-400 mt-1">
              💡 Digite exatamente como vem na coluna "LOJA" do seu arquivo Excel/CSV.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Nome Amigável / Descrição (Opcional)
            </label>
            <input 
              type="text" 
              placeholder="Ex: Loja Principal da Amazon" 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
              className="w-full border border-gray-200 px-3 py-2 h-9 text-xs outline-none focus:border-gray-400 bg-gray-50/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Canal de Venda Vinculado (Marketplace) *
            </label>
            <select
              required
              value={marketplaceId}
              onChange={(e) => setMarketplaceId(e.target.value)}
              className="w-full border border-gray-200 px-2 h-9 text-xs bg-gray-50/50 outline-none focus:border-gray-400 text-gray-700 cursor-pointer"
            >
              <option value="">Selecione um canal...</option>
              {marketplaces.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setIsCreateOpen(false)} 
              className="px-4 h-9 text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-gray-900 text-white px-5 h-9 text-xs font-bold hover:bg-gray-800 cursor-pointer shadow-sm"
            >
              Salvar Identificação
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL 2: EDIÇÃO DE LOJA ─── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Editar Mapeamento: ${selectedLoja?.id}`}
      >
        <form onSubmit={handleUpdateStore} className="space-y-4">
          <div className="bg-gray-50 p-2.5 border border-gray-200 text-xs font-mono text-gray-500">
            O identificador principal <b className="text-gray-900">"{selectedLoja?.id}"</b> não pode ser alterado pois serve de âncora com as planilhas.
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Nome de Exibição
            </label>
            <input 
              type="text" 
              placeholder="Nome amigável" 
              value={storeName} 
              onChange={(e) => setStoreName(e.target.value)} 
              className="w-full border border-gray-200 px-3 py-2 h-9 text-xs outline-none focus:border-gray-400 bg-gray-50/50"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Vincular a outro Marketplace / Canal
            </label>
            <select
              required
              value={marketplaceId}
              onChange={(e) => setMarketplaceId(e.target.value)}
              className="w-full border border-gray-200 px-2 h-9 text-xs bg-gray-50/50 outline-none focus:border-gray-400 text-gray-700 cursor-pointer"
            >
              {marketplaces.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button 
              type="button" 
              onClick={() => setIsEditOpen(false)} 
              className="px-4 h-9 text-xs font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-gray-900 text-white px-5 h-9 text-xs font-bold hover:bg-gray-800 cursor-pointer shadow-sm"
            >
              Atualizar Dados
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}