# XpensLens

> **Smart expense management powered by AI — built for modern teams.**

XpensLens is a full-stack expense management platform that lets employees upload receipts, automatically extracts data using AI vision, and gives finance admins real-time control over approvals, policy enforcement, and spending analytics.

---

## What it does

- **AI Receipt Scanning** — Upload a photo of any receipt. XpensLens reads it with a vision model and auto-fills the amount, merchant, date, and category.
- **Policy Engine** — Finance admins define per-category spending limits (in ₪). Expenses that exceed limits, or fall into blocked categories, are automatically flagged.
- **Manual Review Inbox** — Flagged expenses land in a dedicated inbox for admin review. One click to approve or reject, with optional notes.
- **Real-time Analytics** — Admins see spending breakdowns by category and by employee, with live progress bars and month-by-month navigation.
- **Receipt Storage** — Receipt images are stored in the cloud (Supabase Storage) and can be previewed or downloaded at any time.
- **Role-based Access** — Two roles: `employee` (submit & track own expenses) and `admin` (full visibility, approvals, policy management).
- **Dark Mode + RTL** — Full dark mode support and language toggle (EN/HE) with settings persisted across sessions.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** + TypeScript | UI framework |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** + shadcn/ui | Styling & component library |
| **Radix UI** | Accessible headless components |
| **Lucide React** | Icons |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express** | REST API server (port 3001) |
| **TypeScript** | Type safety |
| **Prisma ORM** | Database access layer |
| **Zod** | Request validation |
| **JWT** + **bcryptjs** | Authentication |
| **Multer** | Multipart file handling |

### Database & Storage
| Technology | Purpose |
|---|---|
| **Supabase (PostgreSQL)** | Primary database — users, expenses, metadata |
| **Supabase Storage** | Receipt image storage (cloud, public CDN) |

### AI
| Technology | Purpose |
|---|---|
| **OpenRouter** (moonshotai/kimi-k2) | Vision model for receipt data extraction |

---

## Project Structure

```
XpensLens/
├── src/                        # Frontend (React)
│   ├── components/
│   │   ├── admin/              # AdminDashboard, AllExpensesView, PolicyEngine, ManualReviewInbox
│   │   ├── employee/           # EmployeeDashboard, ExpensesList, UploadExpenseModal
│   │   ├── layout/             # Navbar, Sidebar, AppLayout
│   │   └── shared/             # StatusBadge, MonthPicker, SettingsPage
│   ├── contexts/               # AppContext (auth, theme, language, routing)
│   ├── hooks/                  # useMonthFilter
│   └── lib/                    # API clients (expenses-api, policy-api)
│
└── server/                     # Backend (Node.js + Express)
    ├── src/
    │   ├── routes/             # auth.ts, expenses.ts, policy.ts
    │   ├── services/           # vision.service.ts, policy.service.ts, storage.service.ts
    │   ├── middleware/         # auth.ts (JWT verification)
    │   └── lib/                # prisma.ts, supabase.ts
    ├── prisma/
    │   └── schema.prisma       # DB schema (User, Expense)
    └── policy.json             # Live policy rules (editable via UI, no restart needed)
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [OpenRouter](https://openrouter.ai) API key

---

### 1. Clone the repo

```bash
git clone <repo-url>
cd XpensLens
```

### 2. Install dependencies

```bash
# Frontend
npm install

# Backend
cd server
npm install
```

### 3. Set up environment variables

The `.env` file is **not committed to Git** for security reasons. You need to create it manually inside the `server/` directory.

Create `server/.env` with the following fields:

```env
PORT=3001

# Supabase → Project Settings → Database → Connection string → Transaction pooler
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>:6543/postgres?pgbouncer=true

# Supabase → Project Settings → Database → Connection string → Session pooler
DIRECT_URL=postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres

# Any long random string — used to sign JWT tokens
# Generate one with: openssl rand -hex 32
JWT_SECRET=your-secret-key-here

# OpenRouter → Keys → Create key
OPENROUTER_API_KEY=sk-or-v1-...

# Supabase → Project Settings → API → Project URL
SUPABASE_URL=https://<project-ref>.supabase.co

# Supabase → Project Settings → API → service_role key (keep this secret)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Set up Supabase Storage

In your Supabase dashboard:
- Go to **Storage** → **New bucket**
- Name: `receipts`
- Enable **Public bucket** ✓

### 5. Push the database schema

```bash
cd server
npm run db:push
```

### 6. Run the app

Open two terminals:

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend (from project root)
npm run dev
```

Frontend → `http://localhost:5173`  
Backend → `http://localhost:3001`

---

## Key Features In Detail

### Policy Engine
Admins configure per-category spending limits directly from the UI. Rules are saved to `server/policy.json` and evaluated on every expense submission — no server restart required. Expenses that violate a rule are automatically set to `FLAGGED` and routed to the Manual Review Inbox.

### Receipt Pipeline
1. Employee uploads a JPG or PNG receipt
2. The image is sent to the AI vision model (via OpenRouter)
3. Extracted fields (amount, merchant, date, category) are pre-filled in the form
4. On submission, the image is uploaded to Supabase Storage and the public URL is stored in the database
5. Admins can view and download any receipt from the expense detail dialog or the Manual Review Inbox

### Role-based Routing
- **Employees** see only their own expenses — dashboard, list view, and upload modal
- **Admins** see all employees' expenses — full analytics, approval queue, and policy management

---

## Available Scripts

| Command | Location | Description |
|---|---|---|
| `npm run dev` | root | Start frontend dev server |
| `npm run build` | root | Build frontend for production |
| `npm run dev` | server/ | Start backend dev server |
| `npm run db:push` | server/ | Push Prisma schema to Supabase |
| `npm run db:studio` | server/ | Open Prisma Studio (DB browser) |
| `npm run db:generate` | server/ | Regenerate Prisma client after schema changes |

---

## License

MIT
