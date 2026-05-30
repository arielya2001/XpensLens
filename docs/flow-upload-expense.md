# Flow: Upload Expense — End to End

---

## Step 1 — Button click (`App.tsx` — frontend)

User clicks "Add Expense" →
```ts
onClick={() => setUploadOpen(true)}
```
`uploadOpen` becomes `true` →
```tsx
<UploadExpenseModal open={true} onClose={...} onSuccess={handleExpenseCreated} />
```
Modal renders as visible.

---

## Step 2 — User drags or selects a file (`UploadExpenseModal.tsx` — frontend)

```ts
onDrop={handleDrop}

handleDrop(e) {
  const file = e.dataTransfer.files[0];
  handleFile(file);
}

handleFile(file) {
  currentFileRef.current = file;         // save file for later submission
  setPreviewUrl(URL.createObjectURL(file));
  setStep('scanning');
  const extracted = await scanReceipt(file);  // → Step 3
  setForm({
    amount: extracted.amount,
    merchant: extracted.merchant,
    date: extracted.date,
    category: REVERSE_CATEGORY_MAP[extracted.category],
    notes: extracted.notes,
  });
  setStep('form');
}
```

---

## Step 3 — Send image to backend (`expenses-api.ts` — frontend)

```ts
scanReceipt(file) {
  const formData = new FormData();
  formData.append('receipt', file);
  return apiRequest<ScannedReceiptData>('/expenses/scan', {
    method: 'POST',
    body: formData,
  });  // → Step 4
}
```

---

## Step 4 — HTTP request (`api-client.ts` — frontend)

```ts
apiRequest('/expenses/scan', options) {
  const response = await fetch('http://localhost:3001/api/v1/expenses/scan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return response.json();  // waits for backend response
}
```

---

## Step 5 — Request arrives at backend (`expenses.ts` router — backend)

```ts
router.post('/scan', requireAuth, uploadMemory.single('receipt'), async (req, res) => {
  // requireAuth    → validates JWT token, sets req.user
  // uploadMemory   → reads file from request, sets req.file
  const data = await extractReceiptData(req.file.buffer, req.file.mimetype);  // → Step 6
  res.json(data);  // ← sends response back to Step 4
});
```

---

## Step 6 — AI vision extraction (`vision.service.ts` — backend)

```ts
extractReceiptData(buffer, mimetype) {
  const base64 = buffer.toString('base64');
  const response = await openai.chat.completions.create({
    model: 'moonshotai/kimi-k2',
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimetype};base64,${base64}` } },
        { type: 'text', text: 'Extract: amount, merchant, date, category. Return JSON.' }
      ]
    }]
  });
  return JSON.parse(response.choices[0].message.content);  // ← returns to Step 5
}
```

---

## Back to Step 2 — Form fills in, user clicks Submit

```ts
handleSubmit(e) {
  e.preventDefault();
  const expense = await createExpense({
    amount: parseFloat(form.amount),
    merchant: form.merchant,
    category: CATEGORY_MAP[form.category],
    currency: form.currency,
    date: form.date,
    notes: form.notes,
  }, currentFileRef.current);  // → Step 7
}
```

---

## Step 7 — Build FormData and send (`expenses-api.ts` — frontend)

```ts
createExpense(payload, file) {
  const formData = new FormData();
  formData.append('amount', payload.amount.toString());
  formData.append('merchant', payload.merchant);
  formData.append('category', payload.category);
  // ... all fields
  if (file) formData.append('receipt', file);
  return apiRequest<Expense>('/expenses', {
    method: 'POST',
    body: formData,
  });  // → Step 4 again, different path
}
```

---

## Step 4 again — HTTP request (`api-client.ts` — frontend)

```ts
fetch('http://localhost:3001/api/v1/expenses', {
  method: 'POST',
  body: formData,
})
```

---

## Step 8 — Request arrives at backend (`expenses.ts` router — backend)

```ts
router.post('/', requireAuth, uploadMemory.single('receipt'), async (req, res) => {
  const parsed = CreateExpenseSchema.safeParse(req.body);  // Zod validates fields

  const { status, flagReason } = evaluatePolicy({          // → Step 9
    amount: parsed.data.amount,
    category: parsed.data.category,
  });

  let receiptUrl = null;
  if (req.file) {
    receiptUrl = await uploadReceipt(                      // → Step 10
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
  }

  const expense = await prisma.expense.create({            // → Step 11
    data: {
      ...parsed.data,
      userId: req.user!.id,
      status,
      flagReason,
      receiptUrl,
    },
    include: { user: { select: { id, name, email, department } } },
  });

  res.status(201).json(expense);  // ← sends back to frontend
});
```

---

## Step 9 — Policy Engine (`policy.service.ts` — backend)

```ts
evaluatePolicy({ amount, category }) {
  const rules = JSON.parse(fs.readFileSync('policy.json'));
  const rule = rules.find(r => r.category === category && r.enabled);

  if (rule?.blocked)
    return { status: 'FLAGGED', flagReason: 'Category is blocked' };

  if (rule && amount > rule.maxAmount)
    return { status: 'FLAGGED', flagReason: `Exceeds ₪${rule.maxAmount} maximum` };

  return { status: 'PENDING', flagReason: null };  // ← returns to Step 8
}
```

---

## Step 10 — Upload image to Supabase Storage (`storage.service.ts` — backend)

```ts
uploadReceipt(buffer, originalname, mimetype) {
  const filename = `${crypto.randomUUID()}${path.extname(originalname)}`;

  await supabase.storage
    .from('receipts')
    .upload(filename, buffer, { contentType: mimetype });

  const { data } = supabase.storage
    .from('receipts')
    .getPublicUrl(filename);

  return data.publicUrl;  // ← returns to Step 8
}
```

---

## Step 11 — Save to database (`prisma` — backend)

```ts
prisma.expense.create({ data: { amount, merchant, status, receiptUrl, userId, ... } })

// Prisma translates to SQL:
// INSERT INTO expenses (amount, merchant, status, receipt_url, user_id, ...)
// VALUES (50, 'Cafe', 'PENDING', 'https://supabase.co/...', 'uuid-123', ...)
// Sends to Supabase PostgreSQL → returns new row
// ← returns to Step 8
```

---

## Final — Back to `handleSubmit` (`UploadExpenseModal.tsx` — frontend)

```ts
const expense = await createExpense(...);  // expense received from backend

if (expense.status === 'FLAGGED') {
  setFlagReason(expense.flagReason);
  setStep('rejected');   // red screen shown to user
} else {
  setStep('success');    // green screen shown to user
  onSuccess();           // → handleExpenseCreated in App.tsx
}
```

---

## Final — `handleExpenseCreated` (`App.tsx` — frontend)

```ts
handleExpenseCreated() {
  setUploadOpen(false);       // close modal
  setRefreshKey(k => k + 1); // increment refreshKey
}
```

`refreshKey` change triggers `useEffect` in `EmployeeDashboard` / `ExpensesList` →
```ts
useEffect(() => {
  listExpenses().then(setAllExpenses);
}, [refreshKey]);
```
→ `listExpenses()` → `apiRequest('/expenses')` → backend returns updated list → UI re-renders with new expense.
