import { getRequestHeaders } from './headers'; // Mantendo o padrão do seu projeto

// ─── TIPAGENS DE MODELO (BATCH DE PAGAMENTOS) ───
export interface PaymentBatch {
  id: string; // UUID vindo do banco
  name: string;
  createdAt: string;
  updatedAt: string;
  payments?: any[]; // Injetado quando consultado via checkBatch se necessário
  salesCount: number; // Total de parcelas importadas no lote
  totalBaseIcms: number; // Soma financeira repassada no lote
}

// ─── TIPAGENS DE ENTRADA (PAYLOADS) ───
export interface PaymentRowPayload {
  nf: string;
  parcelaPaga: number;
  parcelas: number;
  baseIcms: number;
  repasse: number;
  comissaoVenda: number;
  comissaoFrete: number;
  fretesTaxas: number;
  loja: string;
}

// Payload agora contém apenas as linhas processadas
export interface ImportPaymentsPayload {
  rows: PaymentRowPayload[];
}

// ─── RETORNO DA AUDITORIA PROFUNDA (RESPONSES) ───
export interface ImportPaymentsResponse {
  message: string;
  batchId: string;
  salesImported: number;      // Total de parcelas salvas com sucesso
  duplicatedCount: number;    // Total de registros retidos por duplicidade
  missingInfoCount: number;   // Total de registros bloqueados pelas regras cronológicas/teto
  duplicatedRows: Array<{
    nf: string;
    data?: string;            // Opcional caso queira renderizar na tabela de log
    loja: string;
    motivo: string;           // Motivo exato mapeado pelo backend
  }>;
  missingRows: Array<{
    nf: string;
    data?: string;            // Opcional para compor a estrutura visual de erro
    loja: string;
    motivo: string;           // Motivo exato da quebra de cronologia ou estouro
  }>;
}

export interface DeletePaymentBatchResponse {
  message: string;
}

export interface ListPaymentBatchesResponse {
  data: PaymentBatch[];
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
    // Garante que o erro lançado seja a mensagem exata de quebra de validação vinda do backend
    throw new Error(errorData.message || errorData.error || `Erro na requisição: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const importPaymentsService = {
  // POST /payments/import - Dispara a planilha diretamente para a auditoria do backend
  importData: async (payload: ImportPaymentsPayload): Promise<ImportPaymentsResponse> => {
    const res = await fetch(`${API_BASE_URL}/payments/import`, {
      method: 'POST',
      headers: getRequestHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<ImportPaymentsResponse>(res);
  },

  // GET /payments/batches - Lista os lotes de pagamentos de forma paginada
  listBatches: async (page: number = 1, limit: number = 10): Promise<ListPaymentBatchesResponse> => {
    const res = await fetch(`${API_BASE_URL}/payments/batches?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    
    const result = await handleResponse<ListPaymentBatchesResponse>(res);

    // 👇 Sanitização crucial: Garante que os retornos agregados do SQL (COUNT/SUM) cheguem como Number puro para o front
    const sanitizedData = result.data.map((batch) => ({
      ...batch,
      salesCount: Number(batch.salesCount || 0),
      totalBaseIcms: Number(batch.totalBaseIcms || 0),
    }));

    return {
      ...result,
      data: sanitizedData,
    };
  },

  
  // GET /payments/batch/:id - Detalha o conteúdo e auditoria de um lote específico
  checkBatch: async (id: string): Promise<PaymentBatch> => {
    const res = await fetch(`${API_BASE_URL}/payments/batch/${id}`, {
      method: 'GET',
      headers: getRequestHeaders(),
    });
    return handleResponse<PaymentBatch>(res);
  },

  // DELETE /payments/batch/:id - Remove o lote e estorna os status (Cascading e sequencial)
  removeBatch: async (id: string): Promise<DeletePaymentBatchResponse> => {
    const res = await fetch(`${API_BASE_URL}/payments/batch/${id}`, {
      method: 'DELETE',
      headers: getRequestHeaders(),
    });
    return handleResponse<DeletePaymentBatchResponse>(res);
  },
};