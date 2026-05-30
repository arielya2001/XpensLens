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

export function getPolicyRules(): Promise<PolicyRule[]> {
  return apiRequest<PolicyRule[]>('/policy');
}

export function savePolicyRules(rules: PolicyRule[]): Promise<PolicyRule[]> {
  return apiRequest<PolicyRule[]>('/policy', {
    method: 'PUT',
    body: JSON.stringify(rules),
  });
}
