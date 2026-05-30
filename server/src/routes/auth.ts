import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserById } from '../services/auth.service';
import { requireAuth } from '../middleware/auth';

const router = Router();

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['EMPLOYEE', 'ADMIN']).optional(),
  department: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { user, token } = await registerUser(parsed.data);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    res.status(409).json({ error: message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  try {
    const { user, token } = await loginUser(parsed.data.email, parsed.data.password);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department },
    });
  } catch {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await getUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });
});

export default router;
