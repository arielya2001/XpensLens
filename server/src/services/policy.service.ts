import fs from 'fs';
import path from 'path';
import { ExpenseCategory } from '@prisma/client';

const POLICY_PATH = path.join(process.cwd(), 'policy.json');

export interface PolicyRuleConfig {
  id: string;
  category: string;
  maxAmount: number;
  blocked: boolean;
  requireReceipt: boolean;
  enabled: boolean;
  description: string;
}

export function readPolicyRules(): PolicyRuleConfig[] {
  try {
    return JSON.parse(fs.readFileSync(POLICY_PATH, 'utf-8')) as PolicyRuleConfig[];
  } catch {
    return [];
  }
}

export function writePolicyRules(rules: PolicyRuleConfig[]): void {
  fs.writeFileSync(POLICY_PATH, JSON.stringify(rules, null, 2));
}

interface PolicyResult {
  status: 'PENDING' | 'FLAGGED';
  flagReason?: string;
}

export function evaluatePolicy(input: { amount: number; category: ExpenseCategory }): PolicyResult {
  const rules = readPolicyRules();

  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.category !== input.category) continue;

    if (rule.blocked) {
      return { status: 'FLAGGED', flagReason: `${rule.description}` };
    }

    if (input.amount > rule.maxAmount) {
      return { status: 'FLAGGED', flagReason: `Exceeds ₪${rule.maxAmount} ${rule.description.toLowerCase()}` };
    }
  }

  return { status: 'PENDING' };
}
