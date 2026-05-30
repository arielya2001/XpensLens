export type ExpenseStatus = 'approved' | 'pending' | 'rejected' | 'flagged';
export type ExpenseCategory = 'Meals' | 'Travel' | 'Accommodation' | 'Office Supplies' | 'Software' | 'Entertainment' | 'Other';
export type FlagReason = 'Unreadable' | 'Blurry' | 'Torn';

export interface Expense {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  merchant: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  status: ExpenseStatus;
  notes?: string;
  clientName?: string;
  receiptUrl?: string;
  flagReason?: FlagReason;
  reviewNotes?: string;
  submittedAt: string;
}

export interface PolicyRule {
  id: string;
  category: ExpenseCategory | 'All';
  maxAmount: number;
  requireReceipt: boolean;
  enabled: boolean;
  description: string;
}

const receiptImages = [
  'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/5632399/pexels-photo-5632399.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg?auto=compress&cs=tinysrgb&w=400',
];

export const mockExpenses: Expense[] = [
  { id: 'exp1', employeeId: 'emp1', employeeName: 'Sarah Johnson', department: 'Marketing', date: '2025-04-08', merchant: 'The Capital Grille', amount: 142.50, currency: 'USD', category: 'Meals', status: 'approved', clientName: 'Acme Corp', submittedAt: '2025-04-08T14:32:00Z', receiptUrl: receiptImages[0] },
  { id: 'exp2', employeeId: 'emp1', employeeName: 'Sarah Johnson', department: 'Marketing', date: '2025-04-06', merchant: 'Delta Airlines', amount: 487.00, currency: 'USD', category: 'Travel', status: 'pending', submittedAt: '2025-04-06T09:15:00Z', receiptUrl: receiptImages[1] },
  { id: 'exp3', employeeId: 'emp1', employeeName: 'Sarah Johnson', department: 'Marketing', date: '2025-04-03', merchant: 'Marriott Hotels', amount: 210.00, currency: 'USD', category: 'Accommodation', status: 'approved', submittedAt: '2025-04-03T18:00:00Z', receiptUrl: receiptImages[2] },
  { id: 'exp4', employeeId: 'emp1', employeeName: 'Sarah Johnson', department: 'Marketing', date: '2025-03-28', merchant: "McDonald's", amount: 18.75, currency: 'USD', category: 'Meals', status: 'rejected', clientName: 'Internal', submittedAt: '2025-03-28T12:10:00Z' },
  { id: 'exp5', employeeId: 'emp2', employeeName: 'Michael Chen', department: 'Engineering', date: '2025-04-07', merchant: 'GitHub Enterprise', amount: 1200.00, currency: 'USD', category: 'Software', status: 'pending', submittedAt: '2025-04-07T11:00:00Z', receiptUrl: receiptImages[0] },
  { id: 'exp6', employeeId: 'emp2', employeeName: 'Michael Chen', department: 'Engineering', date: '2025-04-05', merchant: 'Staples', amount: 85.40, currency: 'USD', category: 'Office Supplies', status: 'approved', submittedAt: '2025-04-05T15:45:00Z' },
  { id: 'exp7', employeeId: 'emp2', employeeName: 'Michael Chen', department: 'Engineering', date: '2025-04-02', merchant: 'Nobu Restaurant', amount: 325.00, currency: 'USD', category: 'Entertainment', status: 'flagged', flagReason: 'Blurry', submittedAt: '2025-04-02T20:30:00Z', receiptUrl: receiptImages[1] },
  { id: 'exp8', employeeId: 'emp3', employeeName: 'Emma Davis', department: 'Sales', date: '2025-04-08', merchant: 'Uber', amount: 43.20, currency: 'USD', category: 'Travel', status: 'approved', submittedAt: '2025-04-08T08:20:00Z' },
  { id: 'exp9', employeeId: 'emp3', employeeName: 'Emma Davis', department: 'Sales', date: '2025-04-07', merchant: 'Shake Shack', amount: 67.80, currency: 'USD', category: 'Meals', status: 'pending', clientName: 'TechVentures LLC', submittedAt: '2025-04-07T13:00:00Z', receiptUrl: receiptImages[2] },
  { id: 'exp10', employeeId: 'emp3', employeeName: 'Emma Davis', department: 'Sales', date: '2025-04-04', merchant: 'Hilton Garden Inn', amount: 189.00, currency: 'USD', category: 'Accommodation', status: 'flagged', flagReason: 'Torn', submittedAt: '2025-04-04T22:15:00Z', receiptUrl: receiptImages[0] },
  { id: 'exp11', employeeId: 'emp4', employeeName: 'James Wilson', department: 'Operations', date: '2025-04-06', merchant: 'FedEx Office', amount: 127.60, currency: 'USD', category: 'Office Supplies', status: 'approved', submittedAt: '2025-04-06T10:30:00Z' },
  { id: 'exp12', employeeId: 'emp4', employeeName: 'James Wilson', department: 'Operations', date: '2025-04-05', merchant: 'American Airlines', amount: 612.00, currency: 'USD', category: 'Travel', status: 'pending', submittedAt: '2025-04-05T07:45:00Z', receiptUrl: receiptImages[1] },
  { id: 'exp13', employeeId: 'emp4', employeeName: 'James Wilson', department: 'Operations', date: '2025-04-01', merchant: 'Unknown Vendor', amount: 95.00, currency: 'USD', category: 'Other', status: 'flagged', flagReason: 'Unreadable', submittedAt: '2025-04-01T16:00:00Z', receiptUrl: receiptImages[2] },
];

export const mockPolicyRules: PolicyRule[] = [
  { id: 'rule1', category: 'Meals', maxAmount: 75, requireReceipt: true, enabled: true, description: 'Maximum daily meal allowance' },
  { id: 'rule2', category: 'Travel', maxAmount: 800, requireReceipt: true, enabled: true, description: 'Maximum per-trip travel expense' },
  { id: 'rule3', category: 'Accommodation', maxAmount: 250, requireReceipt: true, enabled: true, description: 'Maximum nightly hotel rate' },
  { id: 'rule4', category: 'Entertainment', maxAmount: 200, requireReceipt: true, enabled: true, description: 'Maximum entertainment expense' },
  { id: 'rule5', category: 'Office Supplies', maxAmount: 150, requireReceipt: false, enabled: true, description: 'Office supplies per purchase' },
  { id: 'rule6', category: 'Software', maxAmount: 500, requireReceipt: true, enabled: true, description: 'Software license per purchase' },
  { id: 'rule7', category: 'All', maxAmount: 50, requireReceipt: false, enabled: true, description: 'Receipt required for all expenses above $50' },
];

export function getExpensesForEmployee(employeeId: string): Expense[] {
  return mockExpenses.filter(e => e.employeeId === employeeId);
}

export function getFlaggedExpenses(): Expense[] {
  return mockExpenses.filter(e => e.status === 'flagged');
}

export function getPendingExpenses(): Expense[] {
  return mockExpenses.filter(e => e.status === 'pending');
}

export function getEmployeeSummary(employeeId: string) {
  const expenses = getExpensesForEmployee(employeeId);
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  return {
    totalApprovedMonth: thisMonth.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0),
    pendingCount: expenses.filter(e => e.status === 'pending').length,
    pendingAmount: expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0),
    rejectedCount: expenses.filter(e => e.status === 'rejected').length,
    total: expenses.length,
  };
}

export function getAdminSummary() {
  const total = mockExpenses.reduce((s, e) => s + e.amount, 0);
  const pending = mockExpenses.filter(e => e.status === 'pending');
  const flagged = mockExpenses.filter(e => e.status === 'flagged');
  const approved = mockExpenses.filter(e => e.status === 'approved');

  const byCategory = mockExpenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return {
    totalAmount: total,
    pendingCount: pending.length,
    pendingAmount: pending.reduce((s, e) => s + e.amount, 0),
    flaggedCount: flagged.length,
    approvedAmount: approved.reduce((s, e) => s + e.amount, 0),
    byCategory,
    employeeCount: 4,
  };
}
