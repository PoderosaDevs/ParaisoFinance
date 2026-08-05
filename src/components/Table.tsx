import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// Definição de como cada coluna deve se comportar
export interface Column<T> {
  header: string;
  // Chave do objeto ou função personalizada para renderizar a célula
  render: (item: T) => ReactNode;
  // Alinhamento estrito para dados corporativos
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  subtitle?: string;
  /** true enquanto os dados estão sendo (re)carregados */
  loading?: boolean;
  /** quantidade de linhas fantasma exibidas no primeiro carregamento */
  skeletonRows?: number;
}

export default function Table<T>({ columns, data, title, subtitle, loading = false, skeletonRows = 6 }: TableProps<T>) {
  // Mapeia classes de alinhamento do Tailwind de forma segura
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="bg-white border border-gray-200 shadow-sm w-full">
      {/* Cabeçalho do Bloco da Tabela */}
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            {title && <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">{title}</h2>}
            {subtitle && <p className="text-xs text-gray-500 mt-0.5 font-mono">{subtitle}</p>}
          </div>
        </div>
      )}

      {/* Barra fina de progresso durante recarregamento (mantém a tabela anterior visível) */}
      {loading && data.length > 0 && (
        <div className="h-0.5 w-full bg-gray-100 overflow-hidden">
          <div className="h-full w-1/3 bg-brand-green animate-[loading-bar_1.1s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Tabela Responsiva */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              {columns.map((col, index) => (
                <th
                  key={index}
                  style={{ width: col.width }}
                  className={`px-6 py-3 font-medium ${alignClasses[col.align || 'left']}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 text-sm transition-opacity ${loading && data.length > 0 ? 'opacity-50' : ''}`}>
            {loading && data.length === 0 ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`}>
                  {columns.map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-3.5">
                      <div className="h-3.5 w-full max-w-[120px] bg-gray-100 animate-pulse rounded-sm" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-400 font-medium">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <td
                      key={colIndex}
                      className={`px-6 py-3.5 whitespace-nowrap text-gray-600 ${
                        alignClasses[col.align || 'left']
                      }`}
                    >
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {loading && data.length > 0 && (
        <div className="px-6 py-2 border-t border-gray-100 flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
          <Loader2 className="w-3 h-3 animate-spin" /> Atualizando resultados...
        </div>
      )}
    </div>
  );
}