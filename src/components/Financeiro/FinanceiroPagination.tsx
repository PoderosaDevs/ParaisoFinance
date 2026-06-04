interface FinanceiroPaginationProps {
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  totalItems: number;
  itemsPerPage: number;
}

export function FinanceiroPagination({ page, setPage, totalItems, itemsPerPage }: FinanceiroPaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(page * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-gray-100 bg-gray-50/50">
      <div className="text-xs text-gray-500 font-medium">
        Exibindo <span className="font-semibold text-gray-700">{startItem}</span> até <span className="font-semibold text-gray-700">{endItem}</span> de <span className="font-semibold text-gray-700">{totalItems}</span> registros
      </div>

      <div className="flex items-center gap-1">
        <button
          disabled={page === 1}
          onClick={() => setPage(1)}
          className="px-2 py-1 text-[11px] font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
        >
          Primeira
        </button>
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-2 py-1 text-[11px] font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
        >
          Anterior
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .map((p, index, array) => {
            const showEllipsis = index > 0 && p - array[index - 1] > 1;
            return (
              <div key={p} className="flex items-center gap-1">
                {showEllipsis && <span className="text-xs text-gray-400 px-1">...</span>}
                <button
                  onClick={() => setPage(p)}
                  className={`px-2.5 py-1 text-xs font-bold transition-colors select-none cursor-pointer ${
                    page === p
                      ? 'bg-gray-900 text-white border border-gray-900'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              </div>
            );
          })}

        <button
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-2 py-1 text-[11px] font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
        >
          Próxima
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className="px-2 py-1 text-[11px] font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-white cursor-pointer select-none"
        >
          Última
        </button>
      </div>
    </div>
  );
}