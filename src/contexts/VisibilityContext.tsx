// src/contexts/VisibilityContext.tsx
// Controla a exibição/ocultação global dos valores sensíveis (financeiros)
// exibidos nos cards de resumo do Dashboard e do Financeiro.
// Por padrão os valores ficam borrados (blur) e só aparecem:
//  1. Ao passar o mouse em cima do card (peek temporário), ou
//  2. Clicando no "olhinho" individual do card (fixa a exibição), ou
//  3. Clicando no "olhinho" global no cabeçalho (revela tudo de uma vez).
import { createContext, useContext, useState, ReactNode } from 'react';

interface VisibilityContextType {
  globalReveal: boolean;
  toggleGlobalReveal: () => void;
}

const VisibilityContext = createContext<VisibilityContextType | undefined>(undefined);

export function VisibilityProvider({ children }: { children: ReactNode }) {
  const [globalReveal, setGlobalReveal] = useState(false);

  const toggleGlobalReveal = () => setGlobalReveal((prev) => !prev);

  return (
    <VisibilityContext.Provider value={{ globalReveal, toggleGlobalReveal }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error('useVisibility deve ser usado dentro de um VisibilityProvider');
  }
  return context;
}
