// src/services/sale.ts (ou ajuste para o nome do seu arquivo de vendas)
import { getRequestHeaders } from '../api-routes/headers';

// ─── TIPAGENS DE SUPORTE (MARKETPLACE E STORE) ───
export interface Marketplace {
  id: string;
  name: string;
}

export interface Store {
  id: string;
  name: string;
  marketplaceId: string;
  marketplace: Marketplace;
}

// ─── TIPAGENS DE MODELO CORRIGIDAS ───
export interface Payment {
  id: string;
  saleId: string;
  batchId: string;
  storeId: string;
  rawStoreName: string;   // ex: "RAIA PBLZ"
  nf: string;
  baseIcms: number;       // É o valor bruto associado a este pagamento
  repasse: number;        // Valor líquido real recebido
  comissaoVenda: number;  // Taxa de comissão retida sobre a venda
  comissaoFrete: number;  // Taxa de comissão sobre frete
  fretesTaxas: number;    // Custos logísticos extras
  parcelas: number;       // Quantidade TOTAL de parcelas (ex: 1)
  parcelaPaga: number;    // Qual número da parcela este registro representa (ex: 1)
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string; // UUIDv4
  nf: string;
  date: string; // YYYY-MM-DD
  baseIcms: number;
  status: string; // ex: "PENDENTE"
  storeId: string;
  batchId: string;
  store?: Store;
  payments: Payment[]; // Garantido como array para evitar quebras no .reduce()
  totalRepasse: number;
  totalComissoes: number;
  totalTaxas: number;
  createdAt: string;
  updatedAt: string;
}

// ─── TIPAGENS DE PAGINAÇÃO E FILTROS ───
export interface SaleFilters {
  page?: number;
  limit?: number;
  search?: string;
  storeId?: string;
  marketplaceId?: string;
  startDate?: string;
  endDate?: string;
  status?: string[];
}

export interface PaginatedSalesResponse {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  data: Sale[];
}

export interface SalesSummaryResponse {
  vendasPeriodo: number;
  receitaBrutaPrevista: number;
  saldoAReceber: number;
  receitaConciliadaRecebida: number;
  comissoesMarketplace: number;
  custosLogisticaFrete: number;
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS) ───
export interface CreateSalePayload {
  nf: string;
  date: string;
  baseIcms: number;
  storeId: string;
  batchId: string;
}

export interface UpdateSalePayload {
  nf?: string;
  date?: string;
  baseIcms?: number;
  storeId?: string;
  batchId?: string;
}

// ─── API CLIENT INTERNO ───
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const saleService = {
  // POST /sales
  create: async (payload: CreateSalePayload): Promise<Sale> => {
    const res = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: getRequestHeaders(), // Helper unificado injetado (inclui token e Content-Type)
      body: JSON.stringify(payload),
    });
    return handleResponse<Sale>(res);
  },

  // GET /sales
  list: async (filters: SaleFilters = {}, signal?: AbortSignal): Promise<PaginatedSalesResponse> => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE_URL}/sales?${queryString}` : `${API_BASE_URL}/sales`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getRequestHeaders(), // Helper unificado injetado
      signal,
    });
    return handleResponse<PaginatedSalesResponse>(res);
  },

  // GET /sales/summary
  summary: async (filters: Omit<SaleFilters, 'page' | 'limit' | 'search'> = {}, signal?: AbortSignal): Promise<SalesSummaryResponse> => {
    const searchParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const url = queryString ? `${API_BASE_URL}/sales/summary?${queryString}` : `${API_BASE_URL}/sales/summary`;

    const res = await fetch(url, {
      method: 'GET',
      headers: getRequestHeaders(), // Helper unificado injetado
      signal,
    });
    return handleResponse<SalesSummaryResponse>(res);
  },

  // GET /sales/:id
  show: async (id: string): Promise<Sale> => {
    const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'GET',
      headers: getRequestHeaders(), // Helper unificado injetado
    });
    return handleResponse<Sale>(res);
  },

  // PUT /sales/:id
  update: async (id: string, payload: UpdateSalePayload): Promise<Sale> => {
    const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'PUT',
      headers: getRequestHeaders(), // Helper unificado injetado
      body: JSON.stringify(payload),
    });
    return handleResponse<Sale>(res);
  },

  // DELETE /sales/:id
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'DELETE',
      headers: getRequestHeaders(), // Helper unificado injetado
    });
    return handleResponse<{ success: boolean }>(res);
  },
};