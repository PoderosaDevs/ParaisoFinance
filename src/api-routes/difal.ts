// src/api-routes/difal.ts
import { getRequestHeaders } from './headers';

// ─── TIPAGENS DE DIFAL ───
export interface VendaDifal {
  id: string;
  nf: string | number;
  valor: number;
  estado: string; // UF, ex: "BA", "SP"
  loja: string;
  data: string; // ISO (yyyy-MM-dd)
  difalRecolhido: boolean;
  NumeroFatura?: string | null;
}

export interface DifalError {
  nf: string;
  loja: string;
  fatura: string;
  estado?: string;
  motivo: "JÁ IMPORTADO" | "ESTADO INVÁLIDO" | "VALOR INVÁLIDO" | "ERRO DESCONHECIDO";
}

export interface ImportDifalResponse {
  successCount: number;
  errors: DifalError[];
}

export interface GetAllDifalResponse {
  vendas: VendaDifal[];
  total: number;
}

export interface GetLojasDifalResponse {
  lojas: string[];
}

export interface DifalMetricaEstado {
  estado: string;
  totalNotas: number;
  valorTotal: number;
  valorRecolhido: number;
  valorPendente: number;
}

export interface GetMetricasDifalResponse {
  porEstado: DifalMetricaEstado[];
  valorTotalGeral: number;
  valorRecolhidoGeral: number;
  valorPendenteGeral: number;
  totalNotas: number;
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

export const difalService = {
  // GET /vendas/difal
  getAllDifal: async (
    page: number = 1,
    limit: number = 50,
    searchNf?: string,
    status?: string,
    fatura?: string,
    estado?: string,
  ): Promise<GetAllDifalResponse> => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (searchNf) params.append('search', searchNf);
    if (status && status !== 'all') params.append('status', status);
    if (fatura) params.append('fatura', fatura);
    if (estado && estado !== 'all') params.append('estado', estado);

    const res = await fetch(`${API_BASE_URL}/vendas/difal?${params.toString()}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<GetAllDifalResponse>(res);
  },

  // GET /vendas/difal/lojas
  getLojasDifal: async (): Promise<GetLojasDifalResponse> => {
    const res = await fetch(`${API_BASE_URL}/vendas/difal/lojas`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<GetLojasDifalResponse>(res);
  },

  // GET /vendas/difal/metricas
  getMetricasDifal: async (): Promise<GetMetricasDifalResponse> => {
    const res = await fetch(`${API_BASE_URL}/vendas/difal/metricas`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<GetMetricasDifalResponse>(res);
  },

  // POST /vendas/difal/import
  importDifais: async (dados: any[]): Promise<ImportDifalResponse> => {
    const res = await fetch(`${API_BASE_URL}/vendas/difal/import`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(dados),
    });
    return handleResponse<ImportDifalResponse>(res);
  },

  // PATCH /vendas/difal/recolher
  marcarRecolhido: async (ids: string[]): Promise<{ updated: number }> => {
    const res = await fetch(`${API_BASE_URL}/vendas/difal/recolher`, {
      method: 'PATCH',
      headers: getRequestHeaders(),
      body: JSON.stringify({ ids }),
    });
    return handleResponse<{ updated: number }>(res);
  },
};

// Lista fixa de UFs para popular o filtro por Estado na tela.
export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;