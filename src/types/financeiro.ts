// src/types/financeiro.ts
export type ModalType = 'import_venda' | 'import_pagamento' | 'import_reembolso' | 'import_devolucao' | 'export_vendas' | null;

export interface Transaction {
  id: string;
  data: string;
  desc: string;
  cat: string;
  met: string;
  val: number;
  status: string;
}

export interface Marketplace {
  id: string;
  name: string;
}

export const STATUS_OPTIONS = [
  { value: "PENDENTE", label: "Pendente", icon: "🕒" },
  { value: "PARCIALMENTE_PAGO", label: "Parcialmente Pago", icon: "🟠" },
  { value: "PARCIALMENTE_REEMBOLSADO", label: "Parcial. Reembolsado", icon: "💸" },
  { value: "PARCIALMENTE_CONTESTACAO", label: "Parcial. Contestação", icon: "⚠️" },
  { value: "PARCIALMENTE_DEVOLVIDO", label: "Parcial. Devolvido", icon: "📦" },
  { value: "REEMBOLSADO", label: "Reembolsado", icon: "💰" },
  { value: "CONTESTACAO", label: "Contestação", icon: "🚫" },
  { value: "DEVOLVIDO", label: "Devolvido", icon: "↩️" },
  { value: "PAGO", label: "Pago", icon: "✅" },
  { value: "CANCELADO", label: "Cancelado", icon: "❌" },
  { value: "FINALIZADO", label: "Finalizado", icon: "🏁" },
];