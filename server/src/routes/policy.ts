import { Router, Request, Response } from 'express';
import { requireAdmin } from '../middleware/auth';
import { readPolicyRules, writePolicyRules } from '../services/policy.service';

const router = Router();

router.get('/', requireAdmin, (_req: Request, res: Response) => {
  res.json(readPolicyRules());
});

router.put('/', requireAdmin, (req: Request, res: Response) => {
  const rules = req.body;
  if (!Array.isArray(rules)) {
    res.status(400).json({ error: 'Expected array of rules' });
    return;
  }
  writePolicyRules(rules);
  res.json(rules);
});

export default router;
