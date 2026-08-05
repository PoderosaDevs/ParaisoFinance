// src/components/VisibilityToggle.tsx
// Botão global (para usar em headers de página) que revela/oculta TODOS os
// valores sensíveis (SensitiveValue) da tela de uma só vez.
import { Eye, EyeOff } from 'lucide-react';
import { useVisibility } from '../contexts/VisibilityContext';

export function VisibilityToggle({ className = '' }: { className?: string }) {
  const { globalReveal, toggleGlobalReveal } = useVisibility();

  return (
    <button
      type="button"
      onClick={toggleGlobalReveal}
      title={globalReveal ? 'Ocultar todos os valores' : 'Mostrar todos os valores'}
      className={`h-9 w-9 flex items-center justify-center border border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors cursor-pointer ${className}`}
    >
      {globalReveal ? <Eye className="w-4 h-4 text-brand-green" /> : <EyeOff className="w-4 h-4" />}
    </button>
  );
}
