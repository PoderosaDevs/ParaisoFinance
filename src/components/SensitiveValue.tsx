// src/components/SensitiveValue.tsx
// Valor financeiro "sensível": fica borrado por padrão e revela sob demanda.
import { useState, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useVisibility } from '../contexts/VisibilityContext';

interface SensitiveValueProps {
  children: ReactNode;
  className?: string;
  /** mostra o botão de olho individual fixando a exibição deste card */
  showToggle?: boolean;
  as?: 'span' | 'div' | 'h3';
}

export function SensitiveValue({ children, className = '', showToggle = true, as = 'span' }: SensitiveValueProps) {
  const { globalReveal } = useVisibility();
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);

  const visible = globalReveal || pinned || hovering;
  const Tag = as as any;

  return (
    <span
      className="inline-flex items-center gap-1.5"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Tag
        className={`${className} transition-[filter] duration-150 select-none ${!visible ? 'blur-[6px]' : 'blur-0'}`}
      >
        {children}
      </Tag>
      {showToggle && (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            setPinned((p) => !p);
          }}
          title={pinned ? 'Ocultar valor' : 'Mostrar valor sempre'}
          className="text-gray-300 hover:text-gray-600 transition-colors cursor-pointer shrink-0"
        >
          {pinned ? <Eye className="w-3.5 h-3.5 text-brand-green" /> : <EyeOff className="w-3.5 h-3.5" />}
        </button>
      )}
    </span>
  );
}
