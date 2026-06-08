// src/services/batch.ts
import { getRequestHeaders } from '../api-routes/headers'; // Helper unificado importado

// ─── TIPAGENS DE MODELO ───
export interface Batch {
    id: string;
    name: string;
    type: 'SALES' | 'PAYMENTS'; // Identifica o tipo do lote vindo do back-end
    salesCount: number;         // Quantidade de registros dentro do lote
    totalBaseIcms: number;      // Soma financeira calculada pelo back-end
    createdAt: string;
    updatedAt: string;
}

export interface PaginationMeta {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

// Resposta unificada do endpoint paginado
export interface ListBatchesResponse {
    data: Batch[];
    meta: PaginationMeta;
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

export const batchService = {
    /**
     * Lista todos os lotes de forma unificada com paginação opcional
     * GET /batches?page=1&limit=10
     */
    list: async (page: number = 1, limit: number = 10): Promise<ListBatchesResponse> => {
        const res = await fetch(`${API_BASE_URL}/batches?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: getRequestHeaders(), // Substituído pelo helper unificado global
        });
        return handleResponse<ListBatchesResponse>(res);
    },

    /**
     * Obtém os detalhes completos e relacionamentos de um lote específico
     * GET /batches/:id
     */
    getDetails: async (id: string): Promise<any> => {
        const res = await fetch(`${API_BASE_URL}/batches/${id.trim()}`, {
            method: 'GET',
            headers: getRequestHeaders(), // Substituído pelo helper unificado global
        });
        return handleResponse<any>(res);
    },

    /**
     * Altera o nome de um lote específico
     * PATCH /batches/:id/rename
     */
    rename: async (id: string, newName: string): Promise<{ message: string; batch: Batch }> => {
        const res = await fetch(`${API_BASE_URL}/batches/${id.trim()}/rename`, {
            method: 'PATCH',
            headers: getRequestHeaders(), // Helper unificado de cabeçalhos (já inclui Content-Type e Auth)
            body: JSON.stringify({ name: newName }),
        });
        return handleResponse<{ message: string; batch: Batch }>(res);
    },

    /**
     * Remove um lote e desfaz em cascata as modificações e status de vendas
     * DELETE /batches/:id
     */
    delete: async (id: string): Promise<{ message: string; salesAffected?: number }> => {
        const res = await fetch(`${API_BASE_URL}/batches/${id.trim()}`, {
            method: 'DELETE',
            headers: getRequestHeaders(), // Substituído pelo helper unificado global
        });
        return handleResponse<{ message: string; salesAffected?: number }>(res);
    },
};