import { Router, Request, Response } from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getCurrentPolicy, parseNaturalLanguagePolicy, saveManualPolicy } from '../services/policy.service';
import { extractTextFromDocument } from '../services/document.service';

const router = Router();
const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  const policy = await getCurrentPolicy();
  res.json(policy);
});

router.get('/currencies', requireAuth, async (_req: Request, res: Response) => {
  const policy = await getCurrentPolicy();
  res.json({ allowedCurrencies: policy.allowedCurrencies ?? [] });
});

router.post('/extract-text', requireAdmin, uploadMemory.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  try {
    const text = await extractTextFromDocument(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ text });
  } catch (err) {
    console.error('Document extraction failed:', err);
    res.status(400).json({ error: (err as Error).message ?? 'Failed to extract text' });
  }
});

router.post('/parse', requireAdmin, async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string };
  if (!text?.trim()) {
    res.status(400).json({ error: 'text is required' });
    return;
  }
  try {
    const data = await parseNaturalLanguagePolicy(text, req.user!.id);
    res.json(data);
  } catch (err) {
    console.error('Policy parse failed:', err);
    res.status(502).json({ error: 'Failed to parse policy' });
  }
});

router.put('/', requireAdmin, async (req: Request, res: Response) => {
  const { rules, allowedCurrencies } = req.body as { rules?: unknown; allowedCurrencies?: string[] };
  const rulesArr = Array.isArray(rules) ? rules : Array.isArray(req.body) ? req.body : null;
  if (!rulesArr) {
    res.status(400).json({ error: 'Expected rules array' });
    return;
  }
  const saved = await saveManualPolicy(rulesArr, req.user!.id, allowedCurrencies);
  res.json(saved);
});

export default router;
