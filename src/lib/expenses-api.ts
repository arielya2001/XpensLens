import { apiRequest } from '@/lib/api-client';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'MEALS'
  | 'OFFICE_SUPPLIES'
  | 'ACCOMMODATION'
  | 'SOFTWARE'
  | 'ENTERTAINMENT'
  | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'FLAGGED';

export interface ExpenseUser {
  id: string;
  name: string;
  email: string;
  department: string | null;
}

export interface Expense {
  id: string;
  userId: string;
  user: ExpenseUser;
  amount: number;
  currency: string;
  date: string;
  time: string | null;
  merchant: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  notes: string | null;
  receiptUrl: string | null;
  flagReason: string | null;
  receiptMetadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseRequest {
  amount: number;
  currency: string;
  date: string;
  time?: string;
  merchant: string;
  category: ExpenseCategory;
  notes?: string;
  receiptMetadata?: Record<string, unknown>;
}

export interface ScannedReceiptData {
  amount?: number;
  currency?: string;
  date?: string;
  time?: string;
  merchant?: string;
  category?: ExpenseCategory;
  notes?: string;
  receiptMetadata?: Record<string, unknown>;
}

export function scanReceipt(file: File): Promise<ScannedReceiptData> {
  const formData = new FormData();
  formData.append('receipt', file);
  return apiRequest<ScannedReceiptData>('/expenses/scan', {
    method: 'POST',
    body: formData,
  });
}

export function createExpense(payload: CreateExpenseRequest, file?: File): Promise<Expense> {
  const formData = new FormData();
  formData.append('amount', payload.amount.toString());
  formData.append('currency', payload.currency);
  formData.append('date', payload.date);
  formData.append('merchant', payload.merchant);
  formData.append('category', payload.category);
  if (payload.time) formData.append('time', payload.time);
  if (payload.notes) formData.append('notes', payload.notes);
  if (payload.receiptMetadata) formData.append('receiptMetadata', JSON.stringify(payload.receiptMetadata));
  if (file) formData.append('receipt', file);
  return apiRequest<Expense>('/expenses', { method: 'POST', body: formData });
}

export function getExpense(expenseId: string): Promise<Expense> {
  return apiRequest<Expense>(`/expenses/${expenseId}`);
}

export function listExpenses(filters?: { status?: ExpenseStatus; category?: ExpenseCategory }): Promise<Expense[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.category) params.set('category', filters.category);
  const qs = params.toString();
  return apiRequest<Expense[]>(`/expenses${qs ? `?${qs}` : ''}`);
}

export function updateExpenseStatus(
  expenseId: string,
  status: 'APPROVED' | 'REJECTED',
  notes?: string
): Promise<Expense> {
  return apiRequest<Expense>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}
