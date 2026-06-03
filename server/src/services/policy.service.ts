import OpenAI from 'openai';
import { VISION_MODEL } from './vision.service';
import prisma from '../lib/prisma';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

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

export interface PolicyResult {
  status: 'PENDING' | 'FLAGGED';
  flagReason?: string;
}

export async function getCurrentPolicy(): Promise<PolicyData> {
  const policy = await prisma.policy.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!policy) return { rules: [], softRules: [] };
  const data = policy.rules as { rules: PolicyRule[]; softRules: string[] };
  return {
    rules: data.rules ?? [],
    softRules: data.softRules ?? [],
    sourceText: policy.sourceText,
  };
}

export async function parseNaturalLanguagePolicy(text: string, createdBy: string): Promise<PolicyData> {
  const PARSE_PROMPT = `You are a company expense policy parser.
Convert the following free-text policy into a structured JSON object.

Available categories: TRAVEL, MEALS, OFFICE_SUPPLIES, ACCOMMODATION, SOFTWARE, ENTERTAINMENT, OTHER

Return ONLY this JSON structure:
{
  "hard_rules": [
    {
      "id": "unique_id",
      "category": "CATEGORY",
      "maxAmount": 0,
      "blocked": false,
      "requireReceipt": true,
      "enabled": true,
      "description": "human readable"
    }
  ],
  "soft_rules": [
    "Rule that cannot be expressed as a simple limit, e.g. 'Expenses must be business-related'"
  ]
}

hard_rules: clear spending limits (maxAmount > 0, blocked: false) or blocked categories (blocked: true, maxAmount: 0).
soft_rules: subjective rules requiring judgment, e.g. "flag suspicious amounts", "receipts must match category".

Policy text:
${text}`;

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 1024,
    messages: [{ role: 'user', content: PARSE_PROMPT }],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  console.log('Policy parse raw:', raw);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed: { hard_rules?: PolicyRule[]; soft_rules?: string[] } = {};
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.log('Policy parse JSON failed, using empty rules');
  }

  const rules: PolicyRule[] = (parsed.hard_rules ?? []).map((r, i) => ({
    ...r,
    id: r.id || `rule_${Date.now()}_${i}`,
  }));
  const softRules: string[] = parsed.soft_rules ?? [];

  await prisma.policy.create({
    data: { sourceText: text, rules: { rules, softRules }, createdBy },
  });

  return { rules, softRules, sourceText: text };
}

export async function saveManualPolicy(rules: PolicyRule[], userId: string): Promise<PolicyRule[]> {
  const existing = await prisma.policy.findFirst({ orderBy: { createdAt: 'desc' } });
  const softRules = existing ? ((existing.rules as { softRules?: string[] }).softRules ?? []) : [];

  if (existing) {
    await prisma.policy.update({
      where: { id: existing.id },
      data: { rules: { rules, softRules } },
    });
  } else {
    await prisma.policy.create({
      data: { sourceText: 'manual', rules: { rules, softRules }, createdBy: userId },
    });
  }
  return rules;
}

export async function evaluateExpensePolicy(
  expense: { amount: number; category: string; merchant?: string; notes?: string },
  receiptMetadata: Record<string, unknown>,
  policyData: PolicyData
): Promise<PolicyResult> {
  const { rules, softRules } = policyData;

  // Hard rules — deterministic
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.category !== expense.category) continue;
    if (rule.blocked) {
      return { status: 'FLAGGED', flagReason: rule.description };
    }
    if (expense.amount > rule.maxAmount) {
      return { status: 'FLAGGED', flagReason: `Exceeds ₪${rule.maxAmount} limit: ${rule.description}` };
    }
  }

  // Soft rules — LLM judgment
  if (softRules.length > 0) {
    const expenseContext = JSON.stringify({ ...expense, ...receiptMetadata }, null, 2);
    const softPrompt = `You are an expense compliance officer. Evaluate this expense against soft policy rules.
Return ONLY a JSON object: {"compliant": true/false, "uncertain": true/false, "reason": "..."}

- If clearly compliant: {"compliant": true, "uncertain": false, "reason": ""}
- If violation found: {"compliant": false, "uncertain": false, "reason": "specific reason"}
- If cannot determine: {"compliant": false, "uncertain": true, "reason": "what is unclear"}

Expense:
${expenseContext}

Soft policy rules:
${softRules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;

    try {
      const response = await client.chat.completions.create({
        model: VISION_MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: softPrompt }],
      });
      const raw = response.choices[0]?.message?.content ?? '{}';
      const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
      const result = JSON.parse(cleaned) as { compliant: boolean; uncertain: boolean; reason: string };

      if (result.uncertain) {
        return { status: 'FLAGGED', flagReason: `Manual review required: ${result.reason}` };
      }
      if (!result.compliant) {
        return { status: 'FLAGGED', flagReason: `Policy violation: ${result.reason}` };
      }
    } catch {
      return { status: 'FLAGGED', flagReason: 'Manual review required: could not evaluate policy compliance' };
    }
  }

  return { status: 'PENDING' };
}
