# Flow: Upload Expense — End to End

## High-level Architecture (for interview)

האפליקציה מחולקת לשני חלקים נפרדים: **Frontend** ו-**Backend**.

**Frontend (React 18 + TypeScript, Vite, Tailwind + shadcn/ui)**
- האפליקציה בנויה כ-SPA ב-React, כשה-"ניווט" הפנימי מנוהל באמצעות `activeView` ולא באמצעות React Router (כלומר בחירה של view/מסך לפי state). זה מרוכז ב-[XpensLens/src/App.tsx](../src/App.tsx).
- יש `AppContext` מרכזי שמנהל:
  - Authentication (token + `user`)
  - Theme (Light/Dark)
  - Language + RTL/LTR (i18n)
  - `activeView` (איזה מסך מוצג כרגע)
  כל זה נמצא ב-[XpensLens/src/contexts/AppContext.tsx](../src/contexts/AppContext.tsx).
- שכבת UI מורכבת מ:
  - קומפוננטות Layout כלליות: Navbar/Sidebar/AppLayout.
  - קומפוננטות “דומיין”: EmployeeDashboard, ExpensesList, UploadExpenseModal לעובד; ו-AdminDashboard, AllExpensesView, ManualReviewInbox, PolicyEngine לאדמין.
  - קומפוננטות UI בסיסיות (Button/Input/Dialog וכו') שמבוססות shadcn/ui + Radix ומעוצבות עם Tailwind (בדרך כלל תחת `src/components/ui`).
- שכבת תקשורת לשרת מרוכזת ב-API client:
  - `apiRequest` מוסיף Authorization header לפי token, ויודע לעבוד גם עם JSON וגם עם `FormData`.
  - wrappers ייעודיים כמו `expenses-api.ts` ו-`policy-api.ts` מגדירים פונקציות typed לקריאות `/expenses` ו-`/policy`.

**Backend (Node.js + Express + TypeScript, Prisma, Supabase)**
- שרת Express שמאזין כברירת מחדל על `3001`, ומגדיר API תחת `/api/v1/*`.
- חלוקה ל-**routes** לפי תחומים:
  - `/api/v1/auth` (register/login/me)
  - `/api/v1/expenses` (scan receipt, create, list, get by id)
  - `/api/v1/policy` (get/update policy rules)
- שכבת **middleware** לאבטחה והרשאות:
  - `requireAuth` מאמת JWT וממלא `req.user`
  - `requireAdmin` מוסיף בדיקת role לפני גישה לפעולות אדמין
- שכבת **services** שמרכזת לוגיקה עסקית וחיבורים חיצוניים:
  - `auth.service.ts`: hashing עם bcrypt + יצירת JWT
  - `vision.service.ts`: שליחת תמונת קבלה למודל Vision דרך OpenRouter והחזרת JSON
  - `policy.service.ts`: טעינה/שמירה של `policy.json` והחלטה אם הוצאה `PENDING` או `FLAGGED`
  - `storage.service.ts`: העלאה ל-Supabase Storage והחזרת public URL
- מסד הנתונים הוא PostgreSQL דרך Supabase, עם Prisma כ-ORM שמספק type-safe queries וסכימה מוגדרת (User/Expense) ב-`schema.prisma`.

המטרה של המסמך הזה היא להראות **Flow אחד מקצה לקצה** (Upload + Scan + Submit), אבל ההפרדה ל-routes/services/middleware בפרויקט מאפשרת להרחיב flows נוספים בצורה נקייה.

---

## Interview script (Hebrew) — what to say end-to-end

### 10 seconds — opener

"בניתי אפליקציית ניהול הוצאות Full‑Stack בשם XpensLens. עובדים יכולים להגיש הוצאות עבודה ע"י העלאת תמונה של קבלה, והמערכת מחלצת מהקבלה את הנתונים אוטומטית באמצעות Vision AI — כדי לצמצם הקלדה ידנית ולהפוך את ההגשה למהירה ומסודרת."

### 30 seconds — architecture (High-level)

"האפליקציה מחולקת לשני חלקים: Frontend ו‑Backend.

ב‑Frontend אני משתמש ב‑React 18 עם TypeScript, ומריץ פיתוח ובנייה עם Vite. ה‑UI בנוי עם TailwindCSS, ובנוסף אני משתמש ב‑shadcn/ui לקומפוננטות בסיס כמו Button/Input/Dialog שמבוססות על רכיבי UI נגישים ומעוצבות דרך Tailwind.

ברמת מבנה, יש קומפוננטות layout כלליות (Navbar/Sidebar/AppLayout), ויש קומפוננטות דומיין שמחולקות לשני roles: עובד ואדמין. בנוסף יש Context מרכזי שמנהל את ה‑global state: המשתמש המחובר, התצוגה הפעילה, theme, ושפה/כיווניות RTL/LTR.

לדוגמה: בצד employee יש קומפוננטות כמו EmployeeDashboard / ExpensesList / UploadExpenseModal, ובצד admin יש קומפוננטות כמו AdminDashboard / AllExpensesView / ManualReviewInbox / PolicyEngine.

ה-Backend שלי הוא שרת Node.js עם Express, שכתוב כולו ב-TypeScript לטובת Type-Safety. הוא חושף REST API תחת הקידומת api/v1/ כהכנה ל-Versioning עתידי. המערכת בנויה בארכיטקטורה מודולרית ומחולקת ל-Routers לפי Domains עסקיים, כמו Auth, Expenses ו-Policy. מבחינת בקרת גישה, בניתי שכבת Middlewares שקודם כל מאמתת את חתימת ה-JWT, ולאחר מכן מיישמת מודל הרשאות מבוסס תפקידים (RBAC) לפני כל גישה ללוגיקה.

מסד הנתונים הוא PostgreSQL דרך Supabase, ואני ניגש אליו עם Prisma כ‑ORM בשביל type‑safe queries וסכימה ברורה. את תמונות הקבלות אני שומר ב‑Supabase Storage — Object storage בסגנון S3 — ושומר ב‑DB את ה‑URL לתמונה." 

### 45–60 seconds — features + main flow (the core)

"מבחינת פיצ’רים יש שני roles: employee ו‑admin.

ה‑flow המרכזי של העובד הוא Upload Expense:

שלב ראשון הוא סריקה (Scan): העובד בוחר קובץ תמונה של קבלה. ה‑Frontend שולח את התמונה ל‑endpoint ייעודי של סריקה. ב‑Backend אני מעביר את התמונה למודל Vision דרך OpenRouter, והמטרה היא לקבל חזרה JSON מובנה — סכום, מטבע, תאריך, שם בית העסק, קטגוריה, והערות אם קיימות. ה‑Frontend משתמש בנתונים כדי לעשות pre‑fill לטופס, כך שהעובד רק עובר על הערכים ומתקן אם צריך.

שלב שני הוא Submit: כשהעובד מגיש את ההוצאה, ה‑Frontend שולח את כל השדות ל‑Backend (ובמידת הצורך גם את קובץ הקבלה עצמו). ב‑Backend אני עושה ולידציה לשדות, מעלה את תמונת הקבלה ל‑Supabase Storage, ושומר את ה‑public URL.

אחרי זה ההוצאה עוברת Policy Engine בצד השרת — סט חוקים לפי קטגוריה וסכום, למשל ‘ארוחות מעל סף מסוים מסומנות לבדיקה’. לפי החוקים ההוצאה נשמרת כ‑PENDING או כ‑FLAGGED עם flag reason.

בצד אדמין יש Manual Review Inbox שמציג את ההוצאות המסומנות (FLAGGED) יחד עם הקבלה והסיבה, והאדמין יכול להחליט ידנית לאשר או לדחות ולהוסיף הערה. בנוסף יש לאדמין מסך Policy Engine שבו אפשר לערוך את הכללים, ודשבורד שמרכז נתונים כמו סה"כ הוצאות, כמה ממתינות, וכמה מסומנות לבדיקה." 

### 20 seconds — authentication + security

"האותנטיקציה מבוססת JWT. אחרי Login אני שומר token בצד לקוח ושולח אותו בכל בקשה ב‑Authorization: Bearer. בצד שרת יש לי middleware בשם requireAuth שמוודא שהטוקן תקין וממלא את המשתמש, ו‑requireAdmin שמוסיף בדיקת role לפני פעולות אדמיניות.

חשוב לי לציין: אני מודע לזה ששמירת JWT ב‑localStorage היא tradeoff שחשוף יותר ל‑XSS. בסביבת פרודקשן הייתי מעדיף HttpOnly cookies כדי של‑JavaScript לא תהיה גישה לטוקן, ובנוסף להקשיח בהתאם (למשל CSP/CSRF לפי מודל האיום)." 

### 15 seconds — state management

"לניהול state בחרתי ב‑React Context ולא ב‑Redux כי ה‑global state יחסית קטן: user, activeView, theme, ושפה. Redux היה מוסיף יותר מדי boilerplate לסדר הגודל הזה. State מקומי נשאר עם useState, ואני משתמש ב‑useEffect לדברים כמו שחזור session כשנטען עמוד ויש token שמור." 

### 1 sentence — closing

"בסך הכל זה פרויקט Full‑Stack מקצה לקצה — העלאת קבצים, אינטגרציית Vision AI, REST API, הרשאות לפי תפקידים, Policy Engine ו‑Manual Review — והוא נתן לי ניסיון אמיתי בהחלטות פרודקשן כולל שיקולי אבטחה ו‑tradeoffs." 

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

**מה להגיד (במילים):** כאן אני פותח את מודאל העלאת ההוצאה. בלחיצה על "Add Expense" אני משנה state (`uploadOpen=true`), ואז React מרנדר את `UploadExpenseModal`.

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

**מה להגיד (במילים):** המשתמש בוחר/גורר תמונה. אני שומר את הקובץ ב‑ref כדי להשתמש בו גם בשלב ה‑submit, מציג preview, עובר ל-step של "scanning", שולח את התמונה לסריקה, מקבל נתונים וממלא את הטופס מראש ואז מעביר את המשתמש למסך הטופס.

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

**מה להגיד (במילים):** זה ה-client של ה‑frontend: אני שולח את התמונה כ‑`multipart/form-data` לשירות סריקה ייעודי (`/expenses/scan`) ומצפה לקבל בחזרה JSON עם שדות שחולצו.

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

**מה להגיד (במילים):** זו שכבת ה‑API המשותפת: היא מצרפת אוטומטית JWT ב‑Authorization header, יודעת לעבוד עם FormData, ומבצעת בפועל את ה‑fetch לשרת.

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

**מה להגיד (במילים):** הבקשה מגיעה ל‑Express route. לפני הלוגיקה העסקית יש middleware: `requireAuth` מאמת טוקן ומזהה משתמש, ו‑Multer קורא את הקובץ מתוך הבקשה. אחר כך אני מפעיל שירות vision שמחזיר נתונים מהקבלה.

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

**מה להגיד (במילים):** זה השירות שמדבר עם מודל Vision דרך OpenRouter: אני שולח את התמונה (base64) עם prompt שמבקש JSON, מקבל תשובה ומנסה לפרסר אותה לאובייקט כדי להחזיר ל‑frontend.

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

**מה להגיד (במילים):** אחרי שהסריקה חזרה, המשתמש רואה טופס שכבר מלא. בלחיצה על Submit אני אוסף את הערכים הסופיים ושולח אותם ל‑backend כדי ליצור Expense אמיתי במערכת.

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

**מה להגיד (במילים):** עכשיו זו יצירת ההוצאה: אני שולח את כל השדות כ‑FormData, ואם יש קובץ — מצרף אותו שוב כדי שהשרת יוכל לשמור אותו ב‑Storage.

---

## Step 4 again — HTTP request (`api-client.ts` — frontend)

```ts
fetch('http://localhost:3001/api/v1/expenses', {
  method: 'POST',
  body: formData,
})
```

**מה להגיד (במילים):** זו שוב אותה שכבת API, רק עם endpoint אחר (`/expenses`). אותו מנגנון auth headers והעברת FormData.

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

**מה להגיד (במילים):** בצד שרת אני עושה 3 דברים עיקריים: (1) ולידציה של השדות (Zod), (2) החלטת policy שמחזירה סטטוס וסיבת flag אם צריך, (3) העלאת הקבלה ל‑Storage ושמירת הרשומה ב‑DB דרך Prisma. בסוף אני מחזיר ל‑frontend את ההוצאה שנוצרה.

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

**מה להגיד (במילים):** זה מנוע החוקים: אני טוען rules מ‑`policy.json` ובודק האם הוצאה חורגת/חסומה. אם כן אני מחזיר `FLAGGED` עם סיבה, אחרת `PENDING`. זה מאפשר לנתב הוצאות ל‑Manual Review.

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

**מה להגיד (במילים):** את הקובץ עצמו אני לא שם ב‑DB אלא ב‑Object Storage. אני מייצר שם קובץ ייחודי, מעלה ל‑bucket, ומחזיר URL ציבורי. את ה‑URL הזה אני שומר בתוך רשומת ההוצאה.

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

**מה להגיד (במילים):** כאן אני שומר את כל המטא‑דאטה של ההוצאה ב‑PostgreSQL דרך Prisma (כולל userId, סטטוס, ו‑receiptUrl). Prisma נותן לי queries type‑safe ועוזר לשמור על סכימה ברורה.

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

**מה להגיד (במילים):** אחרי שהשרת מחזיר את ה‑expense, אני מציג למשתמש הצלחה או מסך "נפסל/סומן" לפי הסטטוס. אם זה `FLAGGED` אני גם מציג את הסיבה (`flagReason`).

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

**מה להגיד (במילים):** אחרי יצירה מוצלחת אני סוגר את המודאל ומרענן את הרשימות/דשבורד ע"י שינוי `refreshKey`, שמפעיל `useEffect` ומביא שוב את רשימת ההוצאות מהשרת.
