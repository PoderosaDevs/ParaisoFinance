import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { VisibilityProvider } from './contexts/VisibilityContext';
import AuthLayout from './layouts/AuthLayout';
import AppLayout from './layouts/AppLayout';

// Páginas de Autenticação
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas Internas (Privadas)
import Dashboard from './pages/Dashboard';
import Financeiro from './pages/Financeiro';
import Marketplaces from './pages/Marketplaces';
import Lojas from './pages/Lojas';
import Lotes from './pages/Lotes';
import Fretes from './pages/Fretes';
import Difal from './pages/Difal';
import Relatorios from './pages/Relatorios';


// Página de Erro
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <AuthProvider>
      <VisibilityProvider>
      <BrowserRouter>
        <Routes>
          {/* Redireciona a raiz para o dashboard (que jogará para o login se não houver token) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Grupo de Rotas Públicas (Autenticação) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Register />} />
          </Route>

          {/* Grupo de Rotas Privadas (Internas com Sidebar automático) */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/marketplaces" element={<Marketplaces />} />
            <Route path="/lojas" element={<Lojas />} />
            <Route path="/lotes" element={<Lotes />} />
            <Route path="/fretes" element={<Fretes />} />
            <Route path="/difal" element={<Difal />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Route>

          {/* Rota de captura para caminhos inexistentes (404) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </VisibilityProvider>
    </AuthProvider>
  );
}