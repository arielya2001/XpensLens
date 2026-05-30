import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { JwtPayload } from '../middleware/auth';

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  role?: 'EMPLOYEE' | 'ADMIN';
  department?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new Error('Email already in use');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role ?? 'EMPLOYEE',
      department: data.department,
    },
  });

  return { user, token: signToken(user) };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  return { user, token: signToken(user) };
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

function signToken(user: { id: string; email: string; role: 'EMPLOYEE' | 'ADMIN' }): string {
  const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' });
}
