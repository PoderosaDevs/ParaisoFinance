// src/pages/Marketplaces.tsx
import { useState, useEffect } from 'react';
import { 
  Plus, CheckCircle2, Trash2, Edit3, Store as StoreIcon, 
  Loader2, AlertTriangle, RefreshCw, ShoppingBag, Check 
} from 'lucide-react';

import Table, { Column } from '../components/Table';
import Modal from '../components/Modal';
import { Marketplace, marketplaceService } from '../api-routes/marketplace';

export default function Marketplaces() {
  // ─── ESTADOS DE DADOS E INFRAESTRUTURA ───
  const [marketplaces, setMarketplaces] = useState<Marketplace[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // ─── ESTADOS DE CONTROLE DE MODAL (CRUD) ───
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedId, setSelectedId] = useState<string>('');
  
  // Campos do Formulário
  const [formData, setFormData] = useState({ id: '', name: '' });

  // Auxiliar para gerar o ID limpo (Slug) a partir do Nome Comercial
  const generateSlug = (text: string): string => {
    return text
      .normalize('NFD')                     // Decompõe caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '')     // Remove os acentos
      .toLowerCase()                        // Transforma em minúsculo
      .replace(/[^a-z0-9]/g, '');           // Remove tudo que não for letra ou número
  };

  // Efeito para auto-gerar o ID enquanto digita o Nome (Apenas no modo de Criação)
  useEffect(() => {
    if (modalMode === 'create') {
      setFormData(prev => ({
        ...prev,
        id: generateSlug(prev.name)
      }));
    }
  }, [formData.name, modalMode]);

  // ─── CARREGAMENTO REAL DOS DADOS (READ) ───
  const loadMarketplaces = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await marketplaceService.list();
      
      // Mapeamento limpo utilizando apenas dados reais da API
      const sanitizedData = data.map(mp => ({
        ...mp,
        stores: mp.stores || [],
        vendasCount: mp.sales?.length || 0 // 🌟 Garante o fallback de segurança caso venha undefined
      }));

      setMarketplaces(sanitizedData);
    } catch (err: any) {
      setError(err.message || 'Falha ao sincronizar marketplaces externos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMarketplaces();
  }, []);

  // ─── HANDLERS DE PERSISTÊNCIA (CREATE / UPDATE / DELETE) ───
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({ id: '', name: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mp: Marketplace) => {
    setModalMode('edit');
    setSelectedId(mp.id);
    setFormData({ id: mp.id, name: mp.name });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || (modalMode === 'create' && !formData.id.trim())) return;

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        await marketplaceService.create({ 
          id: formData.id.trim(), 
          name: formData.name.trim() 
        });
      } else {
        await marketplaceService.update(selectedId, { 
          name: formData.name.trim() 
        });
      }
      setIsModalOpen(false);
      loadMarketplaces();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar alterações.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja desativar esta integração? Todas as lojas associadas perderão o vínculo ativo.')) return;
    
    try {
      await marketplaceService.delete(id);
      loadMarketplaces();
    } catch (err: any) {
      alert(err.message || 'Não foi possível deletar este marketplace.');
    }
  };

  // ─── MAPEAMENTO DE ÍCONES ───
  const getPlatformMeta = (id: string) => {
    const normalizeId = id.toLowerCase();
    if (normalizeId.includes('mercado')) return { icon: '📦' };
    if (normalizeId.includes('shopee')) return { icon: '🧡' };
    if (normalizeId.includes('amazon')) return { icon: '☁️' };
    return { icon: '🏪' };
  };

  // ─── CONFIGURAÇÃO DAS COLUNAS DA TABELA ───
  const columns: Column<Marketplace & { vendasCount?: number } /* Injeta a tipagem computada */>[] = [
    {
      header: 'ID',
      render: (mp) => <span className="font-mono text-xs text-gray-500 font-bold">{mp.id}</span>
    },
    {
      header: 'Nome do Canal',
      render: (mp) => {
        const meta = getPlatformMeta(mp.id);
        return (
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{meta.icon}</span>
            <span className="font-semibold text-gray-900">{mp.name}</span>
          </div>
        );
      }
    },
    {
      header: 'Lojas Vinculadas',
      render: (mp) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {mp.stores && mp.stores.length > 0 ? (
            mp.stores.map(store => (
              <span key={store.id} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 font-mono border border-gray-200">
                <StoreIcon className="w-2.5 h-2.5 opacity-60" /> {store.name || store.id /* Usa o ID caso name não venha da API */}
              </span>
            ))
          ) : (
            <span className="text-[10px] font-medium text-gray-400 italic">Nenhuma loja associada</span>
          )}
        </div>
      )
    },
    {
      header: 'Volume de Vendas',
      align: 'right',
      render: (mp) => (
        <div className="flex items-center justify-end gap-1.5 font-mono text-xs font-bold text-gray-900">
          <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
          <span>{mp.vendasCount ?? 0}</span> {/* 🌟 Ajustado aqui para ler o contador seguro */}
        </div>
      )
    },
    {
      header: 'Ações',
      align: 'center',
      render: (mp) => (
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => handleOpenEdit(mp)}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Editar Canal"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(mp.id)}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            title="Desconectar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200 text-slate-950">
      
      {/* HEADER DA TELA */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Marketplaces</h1>
          <p className="text-sm text-gray-500">Gerencie suas integrações e anúncios de forma unificada.</p>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-brand-green hover:bg-brand-green-hover text-white px-5 h-11 rounded-xl font-bold text-sm flex items-center gap-2 transition-all cursor-pointer shadow-xl shadow-brand-green/15"
        >
          <Plus size={18} /> Novo Marketplace
        </button>
      </header>

      {/* ERROS */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 flex items-start gap-3 text-red-800 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-xs font-bold uppercase tracking-wider">Falha operacional</h4>
            <p className="text-xs mt-0.5 text-red-700 font-medium">{error}</p>
          </div>
          <button onClick={loadMarketplaces} className="p-1 hover:bg-red-100 text-red-700 shrink-0 rounded-lg">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* LISTAGEM PRINCIPAL */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
          <span className="text-xs font-bold text-gray-500 font-mono">Buscando canais no banco...</span>
        </div>
      ) : (
        <>
          {/* CARDS REALISTAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {marketplaces.map((mp: any) => {
              const meta = getPlatformMeta(mp.id);
              return (
                <div key={mp.id} className="p-5 border border-gray-200 bg-white rounded-2xl shadow-xs flex flex-col justify-between group relative">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl">{meta.icon}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider font-mono uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-3 h-3" /> Ativo
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{mp.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 font-medium font-mono">
                      <span>{mp.stores?.length || 0} lojas</span>
                      <span>•</span>
                      <span className="text-gray-900 font-bold">{mp.vendasCount ?? 0} ordens</span> {/* 🌟 Ajustado aqui para ler o contador seguro */}
                    </div>
                  </div>
                  <div className="mt-5 pt-3 border-t border-gray-100 flex justify-end">
                    <button 
                      onClick={() => handleOpenEdit(mp)}
                      className="text-xs font-bold text-gray-600 hover:text-brand-green flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      Configurar <Edit3 className="w-3 h-3 opacity-60" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABELA COM HEADER E CONTADOR REAL */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700">Conexões Ativas</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-md border border-gray-200 font-mono">
                {marketplaces.length}
              </span>
            </div>
            
            <Table
              columns={columns}
              data={marketplaces}
            />
          </div>
        </>
      )}

      {/* ─── MODAL DE ESCRITA COMPLETO (CREATE / UPDATE) ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Configurar Novo Marketplace' : 'Editar Canal'}
        footer={
          <>
            <button 
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)} 
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim() || (modalMode === 'create' && !formData.id.trim())}
              className="bg-brand-green disabled:bg-brand-green/60 text-white px-4 py-2 text-xs font-bold hover:bg-brand-green-hover rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-brand-green/10"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Salvar Configuração
                </>
              )}
            </button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-slate-900">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              Nome de Exibição Comercial
            </label>
            <input 
              type="text" 
              placeholder="ex: Mercado Livre"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
              ID Identificador (Auto-gerado)
            </label>
            <input 
              type="text" 
              placeholder="id_gerado_no_banco"
              disabled={modalMode === 'edit'} 
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: generateSlug(e.target.value) }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-4 focus:ring-brand-green/10 focus:border-brand-green transition-all placeholder:text-gray-400 text-sm font-mono disabled:opacity-60 disabled:cursor-not-allowed bg-gray-50"
              required
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}