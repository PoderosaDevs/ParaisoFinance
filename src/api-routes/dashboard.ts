// src/api-routes/dashboard.ts
import { getRequestHeaders } from './headers';

export interface DashboardKpis {
  vendasPeriodo: number;
  receitaBruta: number;
  receitaLiquida: number;
  saldoAReceber: number;
  comissoes: number;
  frete: number;
  ticketMedio: number;
  vendasMesAtual: number;
  receitaMesAtual: number;
  variacaoReceitaPercent: number;
  variacaoVendasPercent: number;
}

export interface DashboardMonthPoint {
  month: string;
  label: string;
  vendas: number;
  receitaBruta: number;
  receitaLiquida: number;
}

export interface DashboardMarketplaceRow {
  id: string;
  name: string;
  vendas: number;
  receitaBruta: number;
  receitaLiquida: number;
}

export interface DashboardStoreRow {
  id: string;
  name: string;
  marketplace: string;
  vendas: number;
  receitaBruta: number;
  receitaLiquida: number;
}

export interface DashboardRecentSale {
  id: string;
  nf: string;
  date: string;
  storeId: string;
  storeName: string;
  marketplaceName: string;
  valorBruto: number;
  liquidoRecebido: number;
  status: string;
}

export interface DashboardSummaryResponse {
  range: { start: string; end: string; months: number };
  kpis: DashboardKpis;
  monthlySeries: DashboardMonthPoint[];
  byMarketplace: DashboardMarketplaceRow[];
  topStores: DashboardStoreRow[];
  recentSales: DashboardRecentSale[];
}

export interface DashboardFilters {
  months?: number;
  marketplaceId?: string;
  storeId?: string;
}

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const dashboardService = {
  summary: async (filters: DashboardFilters = {}, signal?: AbortSignal): Promise<DashboardSummaryResponse> => {
    const params = new URLSearchParams();
    if (filters.months) params.set('months', String(filters.months));
    if (filters.marketplaceId) params.set('marketplaceId', filters.marketplaceId);
    if (filters.storeId) params.set('storeId', filters.storeId);

    const res = await fetch(`${API_BASE_URL}/dashboard/summary?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(),
      signal,
    });
    return handleResponse<DashboardSummaryResponse>(res);
  },
};
