// src/services/store.ts
import { Marketplace } from './marketplace';
import { Sale } from './sale';
import { getRequestHeaders } from '../api-routes/headers'; // Helper unificado importado

// ─── TIPAGENS DE MODELO ───
export interface Store {
    id: string; // ex: "lojaprincipal", "melioficial"
    marketplaceId: string;
    name: string;
    marketplace?: Marketplace;
    sales?: Sale[];
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS) ───
export interface CreateStorePayload {
    id: string;
    marketplaceId: string;
}

export interface UpdateStorePayload {
    marketplaceId: string;
}

// ─── API CLIENT INTERNO ───
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export const storeService = {
    // GET /stores
    list: async (): Promise<Store[]> => {
        const res = await fetch(`${API_BASE_URL}/stores`, {
            method: 'GET',
            headers: getRequestHeaders(), // Autenticação unificada adicionada
        });
        return handleResponse<Store[]>(res);
    },

    // POST /stores
    create: async (payload: CreateStorePayload): Promise<Store> => {
        const res = await fetch(`${API_BASE_URL}/stores`, {
            method: 'POST',
            headers: getRequestHeaders(), // Substituído pelo helper (inclui Content-Type e Token)
            body: JSON.stringify(payload),
        });
        return handleResponse<Store>(res);
    },

    // PUT /stores/:id
    update: async (id: string, payload: UpdateStorePayload): Promise<Store> => {
        const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
            method: 'PUT',
            headers: getRequestHeaders(), // Substituído pelo helper (inclui Content-Type e Token)
            body: JSON.stringify(payload),
        });
        return handleResponse<Store>(res);
    },

    // DELETE /stores/:id
    delete: async (id: string): Promise<{ success: boolean }> => {
        const res = await fetch(`${API_BASE_URL}/stores/${id}`, {
            method: 'DELETE',
            headers: getRequestHeaders(), // Autenticação unificada adicionada
        });
        return handleResponse<{ success: boolean }>(res);
    },
};