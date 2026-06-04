import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function AuthLayout() {
  const { token } = useAuth();

  // Se o usuário já estiver logado, redireciona para o app privado
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen w-full flex bg-white font-sans antialiased">
      
      {/* ─── PAINEL ESQUERDO: FORMULÁRIO (60% em telas grandes) ─── */}
      <div className="flex-1 flex flex-col justify-between p-8 sm:p-12 md:p-20 lg:max-w-2xl xl:max-w-3xl">
        
        {/* Logo / Branding Superior */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-green rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-brand-green/20">
            🍃
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900">GreenFinance</span>
        </div>

        {/* Container Centralizado para as Páginas (Login/Registro) */}
        <div className="w-full max-w-md mx-auto my-auto py-12">
          <Outlet />
        </div>

        {/* Rodapé do Painel de Autenticação */}
        <div className="text-xs text-gray-400 flex justify-between items-center border-t border-gray-100 pt-6">
          <p>© 2026 GreenFinance Inc.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-600 transition-colors">Termos</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Privacidade</a>
          </div>
        </div>
      </div>

      {/* ─── PAINEL DIREITO: VISUAL E MARKETING (40% - Oculto no Mobile) ─── */}
      <div className="hidden lg:flex flex-1 bg-brand-green relative overflow-hidden flex-col justify-between p-16 text-white m-4 rounded-3xl shadow-2xl shadow-brand-green/30">
        
        {/* Efeito de Luz / Gradiente de Fundo */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] pointer-events-none -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[80px] pointer-events-none -ml-16 -mb-16" />

        {/* Tag Superior */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full w-fit text-xs font-semibold tracking-wide border border-white/10">
          <ShieldCheck size={14} className="text-emerald-400" />
          Plataforma Segura e Auditada
        </div>

        {/* Texto de Impacto Principal */}
        <div className="max-w-lg space-y-6 z-10">
          <h2 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
            A maneira mais inteligente de gerir o seu capital.
          </h2>
          <p className="text-emerald-100/70 text-base xl:text-lg font-medium leading-relaxed">
            Controle fluxos de caixa, automatize conciliações e tome decisões baseadas em dados em tempo real com uma interface que respeita seu tempo.
          </p>

          {/* Widget Gráfico Minimalista Decorativo */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm mt-8 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <ArrowUpRight size={20} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-emerald-200/50 uppercase tracking-wider font-bold">Rendimento MédioAnual</p>
                <p className="text-xl font-bold text-white mt-0.5">+ 14.8% aa</p>
              </div>
            </div>
            <div className="flex gap-1 items-end h-8">
              <div className="w-1 bg-white/20 h-3 rounded-full" />
              <div className="w-1 bg-white/20 h-5 rounded-full" />
              <div className="w-1 bg-white/40 h-4 rounded-full" />
              <div className="w-1 bg-emerald-400 h-8 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
            </div>
          </div>
        </div>

        {/* Citação / Prova Social Inferior */}
        <div className="border-t border-white/10 pt-8 z-10">
          <blockquote className="text-sm italic text-emerald-100/80 leading-relaxed">
            "A GreenFinance mudou completamente a velocidade com que nossa startup analisa a queima de caixa mensal. O layout limpo elimina o ruído."
          </blockquote>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-800 border border-white/20 flex items-center justify-center font-bold text-xs text-emerald-200">
              MC
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Mateus Cavalcante</p>
              <p className="text-xs text-emerald-200/60">CFO, TechFlow Studio</p>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}