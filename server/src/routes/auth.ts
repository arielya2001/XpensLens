import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { registerUser, loginUser, getUserById, updateUser, updatePassword } from '../services/auth.service';
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

const UpdateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
});

router.put('/me', requireAuth, async (req: Request, res: Response) => {
  const parsed = UpdateProfileSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    const user = await updateUser(req.user!.id, parsed.data);
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, department: user.department });
  } catch (err: unknown) {
    res.status(409).json({ error: err instanceof Error ? err.message : 'Update failed' });
  }
});

const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

router.put('/me/password', requireAuth, async (req: Request, res: Response) => {
  const parsed = UpdatePasswordSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return; }
  try {
    await updatePassword(req.user!.id, parsed.data.currentPassword, parsed.data.newPassword);
    res.json({ success: true });
  } catch (err: unknown) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Password update failed' });
  }
});

export default router;
