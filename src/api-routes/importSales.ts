// src/api-routes/importSales.ts
import { Sale } from './sale';
import { getRequestHeaders } from '../api-routes/headers'; // Ajuste o caminho relativo se necessário

// ─── TIPAGENS DE MODELO (BATCH) ───
export interface Batch {
  id: string; // UUID vindo do banco
  name: string;
  createdAt: string;
  updatedAt: string;
  sales?: Sale[]; // Injetado quando consultado via checkBatch
  salesCount?: number; // Injetado dinamicamente na listagem geral do banco
  totalBaseIcms?: number; // Injetado dinamicamente na listagem geral do banco
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS) ───
export interface SaleRowPayload {
  nf: string;
  data: string; // formato "DD/MM/YYYY"
  baseIcms: number;
  loja: string;
}

export interface ImportSalesPayload {
  rows: SaleRowPayload[];
  storeMapping: Record<string, string>; // Ex: { "loja_a": "mercadolivre" }
}

// ─── NOVA TIPAGEM DE RETORNO ENRIQUECIDA (RESPONSES) ───
export interface ImportSalesResponse {
  message: string;
  batchId: string;
  salesImported: number;
  duplicatedCount: number;    // 👈 Adicionado para bater com o Backend
  missingInfoCount: number;   // 👈 Adicionado para bater com o Backend
  duplicatedRows: Array<{    // 👈 Adicionado para gerar o relatório/PDF
    nf: string;
    data: string;
    loja: string;
    motivo: string;
  }>;
  missingRows: Array<{       // 👈 Adicionado para gerar o relatório/PDF
    nf: string;
    data: string;
    loja: string;
    motivo: string;
  }>;
}

export interface DeleteBatchResponse {
  message: string;
}

export interface ListBatchesResponse {
  data: Batch[];
  meta: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

// ─── API CLIENT INTERNO ───
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const importSalesService = {
  // POST /sales/import
  importData: async (payload: ImportSalesPayload): Promise<ImportSalesResponse> => {
    const res = await fetch(`${API_BASE_URL}/sales/import`, {
      method: 'POST',
      headers: getRequestHeaders(), // Importado do arquivo centralizado
      body: JSON.stringify(payload),
    });
    return handleResponse<ImportSalesResponse>(res);
  },

  // GET /sales/batches (Com suporte a paginação via query params)
  listBatches: async (page: number = 1, limit: number = 10): Promise<ListBatchesResponse> => {
    const res = await fetch(`${API_BASE_URL}/sales/batches?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getRequestHeaders(), // Importado do arquivo centralizado
    });
    return handleResponse<ListBatchesResponse>(res);
  },

  // GET /sales/batch/:id
  checkBatch: async (id: string): Promise<Batch> => {
    const res = await fetch(`${API_BASE_URL}/sales/batch/${id}`, {
      method: 'GET',
      headers: getRequestHeaders(), // Importado do arquivo centralizado
    });
    return handleResponse<Batch>(res);
  },

  // DELETE /sales/batch/:id
  removeBatch: async (id: string): Promise<DeleteBatchResponse> => {
    const res = await fetch(`${API_BASE_URL}/sales/batch/${id}`, {
      method: 'DELETE',
      headers: getRequestHeaders(), // Importado do arquivo centralizado
    });
    return handleResponse<DeleteBatchResponse>(res);
  },
};