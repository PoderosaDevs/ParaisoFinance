// src/api-routes/reports.ts
import { getRequestHeaders } from './headers';

export type ReportType = 'store' | 'marketplace' | 'status' | 'monthly' | 'weekly';

export interface ReportFilters {
  type: ReportType;
  startDate?: string;
  endDate?: string;
  marketplaceId?: string;
  storeId?: string;
}

export interface ReportRow {
  key: string;
  label: string;
  vendas: number;
  receitaBruta: number;
  comissoes: number;
  frete: number;
  receitaLiquida: number;
  ticketMedio: number;
  margemPercent: number;
}

export interface ReportResponse {
  type: ReportType;
  filtros: { startDate: string | null; endDate: string | null; marketplaceId: string | null; storeId: string | null };
  rows: ReportRow[];
  totals: {
    vendas: number;
    receitaBruta: number;
    comissoes: number;
    frete: number;
    receitaLiquida: number;
    margemPercent: number;
  };
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const reportService = {
  generate: async (filters: ReportFilters): Promise<ReportResponse> => {
    const params = new URLSearchParams();
    params.set('type', filters.type);
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.marketplaceId) params.set('marketplaceId', filters.marketplaceId);
    if (filters.storeId) params.set('storeId', filters.storeId);

    const res = await fetch(`${API_BASE_URL}/reports/generate?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<ReportResponse>(res);
  },
};
