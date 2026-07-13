// src/api-routes/exportSales.ts
import { getRequestHeaders } from '../api-routes/headers'; // Ajuste o caminho relativo se necessário

// ─── TIPAGENS DE ENTRADA (FILTROS) ───
export interface ExportSalesFilters {
  storeId?: string;
  marketplaceId?: string;
  startDate?: string; // 'YYYY-MM-DD'
  endDate?: string;   // 'YYYY-MM-DD'
  status?: string[];  // ex: ['LIQUIDADO', 'PARCIAL']
}

// ─── TIPAGEM DA LINHA JÁ ACHATADA (o que o exportSales do controller devolve) ───
export interface ExportSaleRow {
  nf: string;
  data: string;         // já formatada em 'DD/MM/YYYY' pelo back-end
  loja: string;
  marketplace: string;
  valorBruto: number;
  comissaoVenda: number;
  comissaoFrete: number;
  freteETaxas: number;
  liquidoRecebido: number;
  status: string;
}

// ─── TIPAGEM DE RETORNO (RESPONSE) ───
export interface ExportSalesResponse {
  totalItems: number;
  truncated: boolean; // true se bateu no teto de segurança do back-end (EXPORT_MAX_ROWS)
  data: ExportSaleRow[];
}

// ─── API CLIENT INTERNO ───
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const exportSalesService = {
  /**
   * Busca as vendas já filtradas e achatadas, prontas para gerar o arquivo de exportação
   * GET /sales/export?storeId=&marketplaceId=&startDate=&endDate=&status=
   */
  exportSales: async (filters: ExportSalesFilters = {}): Promise<ExportSalesResponse> => {
    const params = new URLSearchParams();

    if (filters.storeId) params.set('storeId', filters.storeId);
    if (filters.marketplaceId) params.set('marketplaceId', filters.marketplaceId);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);

    // Status pode vir com múltiplos valores — cada um vira uma entrada própria "status=" na query string
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((s) => params.append('status', s));
    }

    const res = await fetch(`${API_BASE_URL}/sales/export?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(), // Importado do arquivo centralizado
    });
    return handleResponse<ExportSalesResponse>(res);
  },
};