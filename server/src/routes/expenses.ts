import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { ExpenseCategory, ExpenseStatus } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { extractReceiptData } from '../services/vision.service';
import { evaluatePolicy } from '../services/policy.service';
import { uploadReceipt } from '../services/storage.service';
import prisma from '../lib/prisma';

const router = Router();

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const CreateExpenseSchema = z.object({
  amount: z.coerce.number().positive(),
  currency: z.string().length(3),
  date: z.string(),
  merchant: z.string().min(1),
  category: z.nativeEnum(ExpenseCategory),
  notes: z.string().optional(),
});

const UpdateExpenseSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

router.post('/scan', requireAuth, uploadMemory.single('receipt'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No receipt file uploaded' });
    return;
  }

  try {
    const data = await extractReceiptData(req.file.buffer, req.file.mimetype);
    res.json(data);
  } catch (err) {
    console.error('Vision extraction failed:', err);
    res.status(502).json({ error: 'Failed to extract receipt data' });
  }
});

router.post('/', requireAuth, uploadMemory.single('receipt'), async (req: Request, res: Response) => {
  const parsed = CreateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const { status, flagReason } = evaluatePolicy({
    amount: parsed.data.amount,
    category: parsed.data.category,
  });

  let receiptUrl: string | null = null;
  if (req.file) {
    receiptUrl = await uploadReceipt(req.file.buffer, req.file.originalname, req.file.mimetype);
  }

  const expense = await prisma.expense.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      userId: req.user!.id,
      status,
      flagReason,
      receiptUrl,
    },
    include: { user: { select: { id: true, name: true, email: true, department: true } } },
  });

  res.status(201).json(expense);
});

router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { status, category } = req.query;

  const where: Record<string, unknown> = {};
  if (req.user!.role === 'EMPLOYEE') where.userId = req.user!.id;
  if (status) where.status = status as ExpenseStatus;
  if (category) where.category = category as ExpenseCategory;

  const expenses = await prisma.expense.findMany({
    where,
    include: { user: { select: { id: true, name: true, email: true, department: true } } },
    orderBy: { createdAt: 'desc' },
  });

  res.json(expenses);
});

router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const expense = await prisma.expense.findUnique({
    where: { id: req.params.id },
    include: { user: { select: { id: true, name: true, email: true, department: true } } },
  });

  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  if (req.user!.role === 'EMPLOYEE' && expense.userId !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  res.json(expense);
});

router.patch('/:id', requireAdmin, async (req: Request, res: Response) => {
  const parsed = UpdateExpenseSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const expense = await prisma.expense.findUnique({ where: { id: req.params.id } });
  if (!expense) {
    res.status(404).json({ error: 'Expense not found' });
    return;
  }

  const updated = await prisma.expense.update({
    where: { id: req.params.id },
    data: {
      status: parsed.data.status,
      notes: parsed.data.notes ?? expense.notes,
    },
    include: { user: { select: { id: true, name: true, email: true, department: true } } },
  });

  res.json(updated);
});

export default router;
