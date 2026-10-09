# Loan Management System

A small lending platform. Borrowers apply for a loan through a multi-step form, and internal
executives move that loan through its lifecycle from an operations dashboard.

**Stack:** Next.js (App Router) + TypeScript + Tailwind · Node.js + Express + TypeScript · MongoDB + Mongoose · JWT + bcrypt

## Running it locally

You need Node 20+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd backend
cp .env.example .env        # then edit MONGODB_URI / JWT_SECRET if needed
npm install
npm run seed                # creates one account per role
npm run dev                 # http://localhost:5001

# 2. Web app (new terminal)
cd frontend
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

Port 5001 is used for the API because macOS reserves 5000 for AirPlay.

### Test accounts

All accounts share the password `Password@123` (created by `npm run seed`).

| Role         | Email                  | Can access                  |
| ------------ | ---------------------- | --------------------------- |
| Admin        | admin@lms.com          | every dashboard module      |
| Sales        | sales@lms.com          | Sales                       |
| Sanction     | sanction@lms.com       | Sanction                    |
| Disbursement | disbursement@lms.com   | Disbursement                |
| Collection   | collection@lms.com     | Collection                  |
| Borrower     | borrower@lms.com       | Application portal only     |

You can also sign up from the UI; public signup always creates a borrower.

## How it works

### Loan lifecycle

```
APPLIED ──approve──▶ SANCTIONED ──disburse──▶ DISBURSED ──fully repaid──▶ CLOSED
   └────reject────▶ REJECTED
```

| Transition            | Who (besides admin) |
| --------------------- | ------------------- |
| APPLIED → SANCTIONED / REJECTED | Sanction     |
| SANCTIONED → DISBURSED | Disbursement        |
| DISBURSED → CLOSED     | automatic, when total paid equals total repayment (Collection records the payments) |

Transitions are done with a conditional update (`status` must be the expected value), so two
executives acting on the same loan can't both win; the second gets a `409`.

### Business rule engine

Runs on the server in `backend/src/utils/bre.ts` and is mirrored in `frontend/src/lib/bre.ts`.
The client copy is only for instant feedback while filling the form; the server is the source of
truth because client checks can be bypassed. A failing application is never saved.

| Rule       | Rejected when                                   |
| ---------- | ----------------------------------------------- |
| Age        | not between 23 and 50 (inclusive)               |
| Salary     | below ₹25,000 / month                           |
| PAN        | doesn't match `^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$` |
| Employment | unemployed                                      |

The fourth PAN character is the holder type (P = person, C = company, ...), which is why it's
restricted to the valid letters rather than any letter.

### Loan maths

Fixed 12% p.a. simple interest: `SI = P × R × T / (365 × 100)`, `T` in days, and
`total = P + SI`, rounded to 2 decimals. Amount is ₹50,000–₹5,00,000 and tenure 30–365 days; both
are validated on the server as well as by the sliders.

### Payments

- Each payment has a UTR, amount and date. The UTR has a unique index in MongoDB, so duplicates are
  rejected (`409`) even if two requests race.
- Outstanding balance = `totalRepayment − amountPaid`, returned with every loan.
- Validation: amount > 0, at most 2 decimals, not more than the outstanding balance, date not in the
  future and not before disbursement, and the loan must be `DISBURSED`.
- Money comparisons are done in paise to avoid floating point surprises. The paid total is
  recomputed from the payments collection rather than incremented.

### Access control

- JWT in the `Authorization: Bearer` header, passwords hashed with bcrypt.
- `authenticate` middleware → `401` when the token is missing/invalid.
- `requireRole(...)` middleware → `403` when the role isn't allowed. Admin always passes.
- Borrower endpoints are borrower-only; dashboard endpoints reject borrowers.
- The frontend also hides modules and redirects by role, but that's just UX; every route above is
  enforced by the API.

## API

All routes are under `/api`.

| Method | Route | Role |
| ------ | ----- | ---- |
| POST | `/auth/signup`, `/auth/login` | public |
| GET | `/auth/me` | any signed-in user |
| GET / PUT | `/borrower/profile` | borrower |
| POST | `/borrower/salary-slip` (multipart `salarySlip`, PDF/JPG/PNG, ≤ 5 MB) | borrower |
| POST / GET | `/borrower/loans` | borrower |
| GET | `/borrower/salary-slip/:userId` | sanction, admin |
| GET | `/sales/leads` | sales |
| GET | `/sanction/loans?status=` | sanction |
| POST | `/sanction/loans/:id/approve`, `/reject` (`{ reason }`) | sanction |
| GET | `/disbursement/loans?status=` | disbursement |
| POST | `/disbursement/loans/:id/disburse` | disbursement |
| GET | `/collection/loans?status=` | collection |
| GET / POST | `/collection/loans/:id/payments` (`{ utr, amount, paidOn }`) | collection |

## Data model

- **User** – name, email (unique), hashed password, role
- **BorrowerProfile** – one per borrower: PAN, DOB, salary, employment mode, salary slip metadata
- **Loan** – borrower, principal, tenure, rate, interest, total repayment, amount paid, status, and who/when for each transition
- **Payment** – loan, UTR (unique), amount, date, recorded by

Sales "leads" aren't stored separately: they're borrowers with no loan yet.

## Project layout

```
backend/
  src/
    config/        env + database connection
    models/        mongoose schemas
    middleware/    auth, role guard, upload, error handler
    controllers/   request handlers
    routes/        route definitions
    utils/         BRE, loan maths, tokens
    scripts/seed.ts
frontend/
  src/
    app/           pages (login, signup, apply, dashboard/*)
    components/    shared UI, auth provider/guard, apply steps
    lib/           api client, types, BRE + loan helpers
```

## Notes

- Uploaded salary slips are stored on local disk under `backend/uploads` (git-ignored). For a real
  deployment you'd swap this for object storage.
- The JWT lives in `localStorage` for simplicity.
