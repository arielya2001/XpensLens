import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import { VISION_MODEL } from './vision.service';
import prisma from '../lib/prisma';
import { cacheGet, cacheSet, cacheDelete } from '../lib/cache';

const POLICY_CACHE_KEY = 'policy:current';
const POLICY_TTL = 60_000;

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
  timeRange?: { from: string; to: string };
  blockedDays?: number[];
}

export interface PolicyData {
  rules: PolicyRule[];
  softRules: string[];
  sourceText?: string;
  allowedCurrencies?: string[];
}

export interface PolicyResult {
  status: 'PENDING' | 'FLAGGED';
  flagReason?: string;
}

export async function getCurrentPolicy(): Promise<PolicyData> {
  const cached = cacheGet<PolicyData>(POLICY_CACHE_KEY);
  if (cached) return cached;

  const policy = await prisma.policy.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!policy) return { rules: [], softRules: [] };
  const data = policy.rules as unknown as { rules: PolicyRule[]; softRules: string[] };
  const result: PolicyData = {
    rules: data.rules ?? [],
    softRules: data.softRules ?? [],
    sourceText: policy.sourceText,
    allowedCurrencies: (data as { allowedCurrencies?: string[] }).allowedCurrencies,
  };
  cacheSet(POLICY_CACHE_KEY, result, POLICY_TTL);
  return result;
}

export async function parseNaturalLanguagePolicy(text: string, createdBy: string): Promise<PolicyData> {
  const PARSE_PROMPT = `You are a company expense policy parser.
Convert the following free-text policy into a structured JSON object.

Available categories: ALL, TRAVEL, MEALS, OFFICE_SUPPLIES, ACCOMMODATION, SOFTWARE, ENTERTAINMENT, OTHER
Use ALL when the rule applies to every category.

Return ONLY this JSON structure:
{
  "allowedCurrencies": ["EUR"],
  "hard_rules": [
    {
      "id": "unique_id",
      "category": "CATEGORY",
      "maxAmount": 0,
      "blocked": false,
      "requireReceipt": true,
      "enabled": true,
      "description": "human readable",
      "timeRange": { "from": "HH:MM", "to": "HH:MM" },
      "blockedDays": [1]
    }
  ],
  "soft_rules": ["Subjective rule requiring judgment"]
}

Rules:
- allowedCurrencies: 3-letter ISO codes. Include ONLY if the policy explicitly restricts accepted currencies (e.g. "only EUR", "accept only dollars"). Leave as [] if no currency restriction.
- hard_rules: deterministic rules — spending limits (maxAmount > 0) or blocked categories (blocked: true).
- timeRange: BLOCKED time window (24h HH:MM). Expenses submitted during this window are FLAGGED. Example: "no expenses between 14:00 and 15:00" → timeRange: {"from":"14:00","to":"15:00"}. Omit if no time restriction.
- blockedDays: days when submissions are BLOCKED. 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat. Example: "no receipts on Mondays" → blockedDays:[1]. Omit if no day restriction.
- Time/day rules MUST go in hard_rules (NOT soft_rules). Set maxAmount:0 and blocked:false for pure time/day rules.
- soft_rules: ONLY for subjective/judgment rules that cannot be expressed as hard limits.

Policy text:
${text}`;

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 4096,
    messages: [{ role: 'user', content: PARSE_PROMPT }],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  console.log('Policy parse raw:', raw);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  let parsed: { hard_rules?: PolicyRule[]; soft_rules?: string[]; allowedCurrencies?: string[] } = {};
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
  const parsedCurrencies: string[] = parsed.allowedCurrencies ?? [];

  const rulesPayload: Record<string, unknown> = { rules, softRules };
  if (parsedCurrencies.length > 0) rulesPayload.allowedCurrencies = parsedCurrencies;

  await prisma.policy.create({
    data: { sourceText: text, rules: rulesPayload as unknown as Prisma.JsonObject, createdBy },
  });
  cacheDelete(POLICY_CACHE_KEY);

  return {
    rules,
    softRules,
    sourceText: text,
    allowedCurrencies: parsedCurrencies.length > 0 ? parsedCurrencies : undefined,
  };
}

export async function saveManualPolicy(rules: PolicyRule[], userId: string, allowedCurrencies?: string[]): Promise<PolicyRule[]> {
  const existing = await prisma.policy.findFirst({ orderBy: { createdAt: 'desc' } });
  const existingData = existing?.rules as { softRules?: string[]; allowedCurrencies?: string[] } | undefined;
  const softRules = existingData?.softRules ?? [];
  const currencies = allowedCurrencies ?? existingData?.allowedCurrencies;

  if (existing) {
    await prisma.policy.update({
      where: { id: existing.id },
      data: { rules: { rules, softRules, ...(currencies ? { allowedCurrencies: currencies } : {}) } as unknown as Prisma.JsonObject },
    });
  } else {
    await prisma.policy.create({
      data: { sourceText: 'manual', rules: { rules, softRules, ...(currencies ? { allowedCurrencies: currencies } : {}) } as unknown as Prisma.JsonObject, createdBy: userId },
    });
  }
  cacheDelete(POLICY_CACHE_KEY);
  return rules;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export async function evaluateExpensePolicy(
  expense: { amount: number; category: string; merchant?: string; notes?: string; time?: string; date?: string },
  receiptMetadata: Record<string, unknown>,
  policyData: PolicyData
): Promise<PolicyResult> {
  const { rules, softRules } = policyData;

  // Hard rules — deterministic
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.category !== 'ALL' && rule.category !== expense.category) continue;
    if (rule.blocked) {
      return { status: 'FLAGGED', flagReason: rule.description };
    }
    if (rule.maxAmount > 0 && expense.amount > rule.maxAmount) {
      return { status: 'FLAGGED', flagReason: `Exceeds limit of ${rule.maxAmount} ${expense.category}: ${rule.description}` };
    }
    const hasTimeRange = !!(rule.timeRange?.from && rule.timeRange?.to);
    const hasBlockedDays = !!(rule.blockedDays && rule.blockedDays.length > 0);

    if (hasTimeRange || hasBlockedDays) {
      const dateStr = expense.date ?? new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date(`${dateStr}T12:00:00`).getDay();
      const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      const dayBlocked = hasBlockedDays ? rule.blockedDays!.includes(dayOfWeek) : true;

      let timeBlocked = true;
      if (hasTimeRange && expense.time) {
        const expMin = parseTimeToMinutes(expense.time);
        const fromMin = parseTimeToMinutes(rule.timeRange!.from);
        const toMin = parseTimeToMinutes(rule.timeRange!.to);
        timeBlocked = fromMin <= toMin
          ? expMin >= fromMin && expMin <= toMin
          : expMin >= fromMin || expMin <= toMin;
      } else if (hasTimeRange && !expense.time) {
        timeBlocked = false;
      }

      if (dayBlocked && timeBlocked) {
        const parts: string[] = [];
        if (hasBlockedDays) parts.push(`on ${DAY_NAMES[dayOfWeek]}`);
        if (hasTimeRange) parts.push(`between ${rule.timeRange!.from}–${rule.timeRange!.to}`);
        return { status: 'FLAGGED', flagReason: `Expenses not allowed ${parts.join(' ')}: ${rule.description}` };
      }
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
