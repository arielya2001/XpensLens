import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant.
Analyze the receipt image and return ONLY a valid JSON object with these fields:
- amount: number (the total amount paid, no currency symbol)
- currency: string (3-letter ISO code, e.g. "USD", "ILS", "EUR")
- date: string (YYYY-MM-DD format)
- merchant: string (business name)
- category: string (exactly one of: TRAVEL, MEALS, OFFICE_SUPPLIES, ACCOMMODATION, SOFTWARE, ENTERTAINMENT, OTHER)
- notes: string (any relevant info, e.g. client name for meals, trip destination for travel)

If a field cannot be determined from the receipt, omit it.
Return ONLY the JSON object, no markdown, no explanation.`;

export interface ExtractedReceiptData {
  amount?: number;
  currency?: string;
  date?: string;
  merchant?: string;
  category?: string;
  notes?: string;
}

export async function extractReceiptData(
  imageBuffer: Buffer,
  mimeType: string
): Promise<ExtractedReceiptData> {
  const base64 = imageBuffer.toString('base64');

  const response = await client.chat.completions.create({
    model: 'moonshotai/kimi-k2.6:free',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: EXTRACTION_PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  console.log('Vision raw response:', raw);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    return JSON.parse(cleaned) as ExtractedReceiptData;
  } catch (e) {
    console.log('JSON parse failed:', e);
    return {};
  }
}
