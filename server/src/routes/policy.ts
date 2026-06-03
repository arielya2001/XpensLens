import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { getCurrentPolicy, parseNaturalLanguagePolicy, saveManualPolicy } from '../services/policy.service';

const router = Router();

router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  const policy = await getCurrentPolicy();
  res.json(policy);
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
  const rules = req.body;
  if (!Array.isArray(rules)) {
    res.status(400).json({ error: 'Expected array of rules' });
    return;
  }
  const saved = await saveManualPolicy(rules, req.user!.id);
  res.json(saved);
});

export default router;
