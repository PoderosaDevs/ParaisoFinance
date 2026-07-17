// src/api-routes/frete.ts
import { getRequestHeaders } from './headers';

// ─── TIPAGENS DE FRETE ───
export interface VendaFrete {
  id: string;
  nf: string | number;
  loja: string;
  fretePago: boolean;
  NumeroFatura?: string | null;
}

export interface FreteError {
  nf: string;
  loja: string;
  fatura: string;
  motivo: "JÁ PAGO" | "ERRO DESCONHECIDO";
}

export interface ImportFreteResponse {
  successCount: number;
  errors: FreteError[];
}

export interface GetAllFreteResponse {
  vendas: VendaFrete[];
  total: number;
}

export interface GetLojasFreteResponse {
  lojas: string[];
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

export const freteService = {
  // GET /vendas/frete
  getAllFrete: async (
    page: number = 1,
    limit: number = 50,
    searchNf?: string,
    status?: string,
    fatura?: string,
  ): Promise<GetAllFreteResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (searchNf) params.append('search', searchNf);
    if (status && status !== 'all') params.append('status', status);
    if (fatura) params.append('fatura', fatura);

    const res = await fetch(`${API_BASE_URL}/vendas/frete?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<GetAllFreteResponse>(res);
  },

  // GET /vendas/frete/lojas
  getLojasFrete: async (): Promise<GetLojasFreteResponse> => {
    const res = await fetch(`${API_BASE_URL}/vendas/frete/lojas`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<GetLojasFreteResponse>(res);
  },

  // POST /vendas/frete/import
  importFretes: async (dados: any[]): Promise<ImportFreteResponse> => {
    const res = await fetch(`${API_BASE_URL}/vendas/frete/import`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(dados),
    });
    return handleResponse<ImportFreteResponse>(res);
  },
};