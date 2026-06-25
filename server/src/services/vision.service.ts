import OpenAI from 'openai';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const VISION_MODEL = 'openai/gpt-oss-20b:free';

const EXTRACTION_PROMPT = `You are a receipt data extraction assistant.
Analyze the following receipt text and return ONLY a valid JSON object with these fields:
- amount: number (the total amount paid, no currency symbol)
- currency: string (3-letter ISO code, e.g. "USD", "ILS", "EUR")
- date: string (YYYY-MM-DD format)
- merchant: string (business name)
- category: string (exactly one of: TRAVEL, MEALS, OFFICE_SUPPLIES, ACCOMMODATION, SOFTWARE, ENTERTAINMENT, OTHER)
- notes: string (any relevant info, e.g. client name for meals, trip destination for travel)
- extra: object (any other relevant details: e.g. number_of_diners, tip_amount, payment_method, vat_number, vat_amount, address, phone, receipt_number, subtotal, discount — only include fields that appear in the receipt)

If a standard field cannot be determined, omit it. extra should be {} if nothing extra was found.
Return ONLY the JSON object, no markdown, no explanation.`;

export interface ExtractedReceiptData {
  amount?: number;
  currency?: string;
  date?: string;
  merchant?: string;
  category?: string;
  notes?: string;
}

export interface FullExtractionResult {
  standard: ExtractedReceiptData;
  receiptMetadata: Record<string, unknown>;
}

async function extractTextWithOcr(imageBuffer: Buffer, _mimeType: string): Promise<string> {
  const base64Image = imageBuffer.toString('base64');
  const apiKey = process.env.GOOGLE_VISION_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_VISION_API_KEY is not set');
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: 'TEXT_DETECTION' }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision request failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    responses?: { fullTextAnnotation?: { text: string }; error?: { message: string } }[];
  };

  const result = json.responses?.[0];
  if (result?.error) {
    throw new Error(`Google Vision error: ${result.error.message}`);
  }

  const text = result?.fullTextAnnotation?.text?.trim() ?? '';
  if (!text) {
    throw new Error('Google Vision returned empty text');
  }

  console.log('OCR raw text:', text);
  return text;
}

export async function extractReceiptData(
  imageBuffer: Buffer,
  mimeType: string
): Promise<FullExtractionResult> {
  const ocrText = await extractTextWithOcr(imageBuffer, mimeType);

  const response = await client.chat.completions.create({
    model: VISION_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `${EXTRACTION_PROMPT}\n\nReceipt text:\n${ocrText}`,
      },
    ],
  });

  const raw = response.choices[0]?.message?.content ?? '{}';
  console.log('LLM raw response:', raw);
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();

  try {
    const parsed = JSON.parse(cleaned) as ExtractedReceiptData & { extra?: Record<string, unknown> };
    const { extra, ...standard } = parsed;
    return { standard, receiptMetadata: extra ?? {} };
  } catch (e) {
    console.log('JSON parse failed:', e);
    return { standard: {}, receiptMetadata: {} };
  }
}
