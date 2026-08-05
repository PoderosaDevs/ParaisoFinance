// src/components/Sidebar.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Landmark, Store, ShoppingBag, LogOut, Package2, Truck, Cloud, SquarePercent, FileBarChart2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; // Garanta que o caminho do seu contexto está correto

export default function Sidebar() {
  const { logout } = useAuth();

  const menuItems = [
    { icon: <LayoutDashboard size={20}/>, label: 'Dashboard', path: '/dashboard' },
    { icon: <Landmark size={20}/>, label: 'Financeiro', path: '/financeiro' },
    { icon: <ShoppingBag size={20}/>, label: 'Marketplaces', path: '/marketplaces' },
    { icon: <Store size={20}/>, label: 'Lojas', path: '/lojas' },
    { icon: <Package2 size={20}/>, label: 'Lotes', path: '/lotes' },
    { icon: <Truck size={20}/>, label: 'Fretes', path: '/fretes' },
    { icon: <SquarePercent size={20}/>, label: 'Difal', path: '/difal' },
    { icon: <FileBarChart2 size={20}/>, label: 'Apresentação & Relatórios', path: '/relatorios' },
  ];

  // ─── FUNÇÃO DE LOGOUT CONECTADA AO AUTH ───
  const handleLogout = () => {
    logout(); // Limpa o estado interno do React e as chaves do localStorage de uma vez só
    window.location.reload(); // Recarrega a aplicação para forçar o redirecionamento
  };

  return (
    <aside className="w-64 bg-brand-green h-screen sticky top-0 text-white flex flex-col p-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="bg-white/10 p-2 rounded-lg"><Cloud /></div>
        <h1 className="text-xl font-bold tracking-tight text-white">ParaisoFinaceiro</h1>
      </div>

      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${isActive ? 'bg-white/15 font-semibold text-white' : 'hover:bg-white/5 opacity-70 hover:opacity-100 text-emerald-50'}
            `}
          >
            {item.icon} {item.label}
          </NavLink>
        ))}
      </nav>

      <button 
        onClick={handleLogout}
        className="flex items-center w-full gap-3 px-4 py-3 opacity-70 hover:opacity-100 transition-all text-red-300 hover:bg-red-500/10 rounded-xl cursor-pointer"
      >
        <LogOut size={20}/> Sair
      </button>
    </aside>
  );
}