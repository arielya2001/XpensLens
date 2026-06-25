import { apiRequest } from '@/lib/api-client';

export interface PolicyRule {
  id: string;
  category: string;
  maxAmount: number;
  blocked: boolean;
  requireReceipt: boolean;
  enabled: boolean;
  description: string;
  timeRange?: { from: string; to: string };
  blockedDays?: number[];
}

export interface PolicyData {
  rules: PolicyRule[];
  softRules: string[];
  sourceText?: string;
  allowedCurrencies?: string[];
}

export function getPolicyRules(): Promise<PolicyData> {
  return apiRequest<PolicyData>('/policy');
}

export function savePolicyRules(rules: PolicyRule[], allowedCurrencies?: string[]): Promise<PolicyRule[]> {
  return apiRequest<PolicyRule[]>('/policy', {
    method: 'PUT',
    body: JSON.stringify({ rules, allowedCurrencies }),
  });
}

export function parsePolicy(text: string): Promise<PolicyData> {
  return apiRequest<PolicyData>('/policy/parse', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export function getPolicyCurrencies(): Promise<{ allowedCurrencies: string[] }> {
  return apiRequest<{ allowedCurrencies: string[] }>('/policy/currencies');
}

export function extractPolicyDocument(file: File): Promise<{ text: string }> {
  const form = new FormData();
  form.append('file', file);
  return apiRequest<{ text: string }>('/policy/extract-text', {
    method: 'POST',
    body: form,
  });
}
