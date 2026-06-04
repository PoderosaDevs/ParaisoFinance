import { ReactNode } from 'react';

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
}

export default function Table<T>({ columns, data, title, subtitle }: TableProps<T>) {
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
          <tbody className="divide-y divide-gray-200 text-sm">
            {data.length === 0 ? (
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
    </div>
  );
}