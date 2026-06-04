import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout() {
  const { token, loading } = useAuth();

  // Enquanto verifica o localStorage, exibe uma tela de carregamento limpa
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login de forma segura
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar fixo na lateral esquerda */}
      <Sidebar />
      
      {/* Área de conteúdo dinâmico das páginas internas */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}