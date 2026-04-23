import { apiRequest } from '@/lib/api-client';

export type BackendExpenseCategory = 'travel' | 'meals' | 'office_supplies';
export type BackendExpenseStatus = 'approved' | 'rejected' | 'flagged' | 'pending';

export interface CreateExpenseRequest {
  total_amount: number;
  currency: string;
  purchase_date: string;
  merchant_name: string;
  category: BackendExpenseCategory;
}

export interface ExpenseResponse {
  id: string;
  total_amount: number;
  currency: string;
  purchase_date: string;
  merchant_name: string;
  category: BackendExpenseCategory;
  status: BackendExpenseStatus;
  created_at: string;
  updated_at: string;
}

export function createExpense(payload: CreateExpenseRequest): Promise<ExpenseResponse> {
  return apiRequest<ExpenseResponse>('/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getExpense(expenseId: string): Promise<ExpenseResponse> {
  return apiRequest<ExpenseResponse>(`/expenses/${expenseId}`);
}
