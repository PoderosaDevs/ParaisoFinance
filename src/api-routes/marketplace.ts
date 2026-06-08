import { Store } from './store';
import { Sale } from './sale';
import { getRequestHeaders } from '../api-routes/headers'; // Ajuste o caminho se necessário

// ─── TIPAGENS DE MODELO ───
export interface Marketplace {
  id: string; // ex: "mercadolivre", "shopee"
  name: string;
  stores: Store[];
  sales?: Sale[]; // Vinculado sob demanda para o painel analítico do front
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS) ───
export interface CreateMarketplacePayload {
  id: string;
  name: string;
}

export interface UpdateMarketplacePayload {
  name: string;
}

// ─── API CLIENT INTERNO ───
const API_BASE_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const marketplaceService = {
  // GET /marketplaces
  list: async (): Promise<Marketplace[]> => {
    const res = await fetch(`${API_BASE_URL}/marketplaces`, {
      method: 'GET',
      headers: getRequestHeaders(), // Adicionado Auth
    });
    return handleResponse<Marketplace[]>(res);
  },

  // POST /marketplaces
  create: async (payload: CreateMarketplacePayload): Promise<Marketplace> => {
    const res = await fetch(`${API_BASE_URL}/marketplaces`, {
      method: 'POST',
      headers: getRequestHeaders(), // Substituído pelo helper unificado (já inclui Content-Type)
      body: JSON.stringify(payload),
    });
    return handleResponse<Marketplace>(res);
  },

  // PUT /marketplaces/:id
  update: async (id: string, payload: UpdateMarketplacePayload): Promise<Marketplace> => {
    const res = await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
      method: 'PUT',
      headers: getRequestHeaders(), // Substituído pelo helper unificado
      body: JSON.stringify(payload),
    });
    return handleResponse<Marketplace>(res);
  },

  // DELETE /marketplaces/:id
  delete: async (id: string): Promise<{ success: boolean }> => {
    const res = await fetch(`${API_BASE_URL}/marketplaces/${id}`, {
      method: 'DELETE',
      headers: getRequestHeaders(), // Adicionado Auth
    });
    return handleResponse<{ success: boolean }>(res);
  },
};