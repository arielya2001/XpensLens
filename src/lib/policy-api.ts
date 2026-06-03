import { apiRequest } from '@/lib/api-client';

export interface PolicyRule {
  id: string;
  category: string;
  maxAmount: number;
  blocked: boolean;
  requireReceipt: boolean;
  enabled: boolean;
  description: string;
}

export interface PolicyData {
  rules: PolicyRule[];
  softRules: string[];
  sourceText?: string;
}

export function getPolicyRules(): Promise<PolicyData> {
  return apiRequest<PolicyData>('/policy');
}

export function savePolicyRules(rules: PolicyRule[]): Promise<PolicyRule[]> {
  return apiRequest<PolicyRule[]>('/policy', {
    method: 'PUT',
    body: JSON.stringify(rules),
  });
}

export function parsePolicy(text: string): Promise<PolicyData> {
  return apiRequest<PolicyData>('/policy/parse', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}
