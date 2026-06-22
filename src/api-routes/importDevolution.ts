import { getRequestHeaders } from './headers';

// ─── TIPAGENS DE MODELO (BATCH DE DEVOLUÇÕES) ───
export interface DevolutionBatch {
  id: string; // UUID vindo do banco
  name: string;
  createdAt: string;
  updatedAt: string;
  devolutions?: any[]; // Injetado quando consultado via checkBatch se necessário
  salesImported: number; // Total de devoluções importadas com sucesso no lote
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS ATUALIZADOS COM A PLANILHA REAL) ───
export interface DevolutionRowPayload {
  nf: string;
  idDevolucao: string;     // 🌟 Alinhado: Coluna 'DEVOLUCAO'
  baseIcms: number;        // 🌟 Alinhado: Coluna 'BASE'
  valor: number;           // 🌟 Alinhado: Coluna 'VALOR'
  motivoDevolucao: string; // 🌟 Alinhado: Coluna 'MOTIVO'
  tratativa?: string;      // 🌟 Alinhado: Coluna 'TRATATIVA' (Opcional)
  // 💡 Note que 'loja' foi removido daqui pois o backend herda automaticamente da NF cadastrada.
}

// Payload contém o array de linhas mapeadas no modal do front
export interface ImportDevolutionsPayload {
  rows: DevolutionRowPayload[];
}

// ─── RETORNO DA AUDITORIA PROFUNDA (RESPONSES) ───
export interface ImportDevolutionsResponse {
  message: string;
  batchId: string;
  salesImported: number;      // Total de devoluções salvas com sucesso
  duplicatedCount: number;    // Total de registros retidos por duplicidade de estorno
  missingInfoCount: number;   // Total de registros sem venda correspondente ou dados inválidos
  duplicatedRows: Array<{
    nf: string;
    data?: string;            // Detalhes extras do log de erro
    loja: string;             // O backend resolve o nome para o log se achar a Sale
    motivo: string;           
  }>;
  missingRows: Array<{
    nf: string;
    data?: string;            
    loja: string;             
    motivo: string;           
  }>;
}

export interface DeleteDevolutionBatchResponse {
  message: string;
}

export interface ListDevolutionBatchesResponse {
  data: DevolutionBatch[];
  meta: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
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

export const importDevolutionsService = {
  // POST /devolutions/import - Dispara as linhas tratadas da planilha para gravação e auditoria
  importData: async (payload: ImportDevolutionsPayload): Promise<ImportDevolutionsResponse> => {
    const res = await fetch(`${API_BASE_URL}/devolutions/import`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ImportDevolutionsResponse>(res);
  },

  // GET /devolutions/batches - Lista os lotes de devoluções de forma paginada
  listBatches: async (page: number = 1, limit: number = 10): Promise<ListDevolutionBatchesResponse> => {
    const res = await fetch(`${API_BASE_URL}/devolutions/batches?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    
    const result = await handleResponse<ListDevolutionBatchesResponse>(res);

    // Sanitização crucial para garantir tipos primitivos corretos vindos do SQL
    const sanitizedData = result.data.map((batch) => ({
      ...batch,
      salesImported: Number(batch.salesImported || 0),
    }));

    return {
      ...result,
      data: sanitizedData,
    };
  },

  // GET /devolutions/batches/:id - Detalha o conteúdo e auditoria de um lote específico de devoluções
  checkBatch: async (id: string): Promise<DevolutionBatch> => {
    const res = await fetch(`${API_BASE_URL}/devolutions/batches/${id}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<DevolutionBatch>(res);
  },

  // DELETE /devolutions/batches/:id - Remove o lote de devoluções e reverte as marcas financeiras
  removeBatch: async (id: string): Promise<DeleteDevolutionBatchResponse> => {
    const res = await fetch(`${API_BASE_URL}/devolutions/batches/${id}`, {
      method: 'DELETE',
      headers: getRequestHeaders(),
    });
    return handleResponse<DeleteDevolutionBatchResponse>(res);
  },
};