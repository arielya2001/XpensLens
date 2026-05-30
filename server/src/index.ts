import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import expensesRouter from './routes/expenses';
import policyRouter from './routes/policy';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/expenses', expensesRouter);
app.use('/api/v1/policy', policyRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`XpensLens server running on http://localhost:${PORT}`);
});
