import { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { BorrowerProfile } from "../models/BorrowerProfile";
import { Loan, LoanStatus } from "../models/Loan";
import { Payment } from "../models/Payment";
import { User } from "../models/User";
import { HttpError } from "../utils/httpError";
import { toPaise } from "../utils/loanMath";
import { withOutstanding } from "../utils/serializers";

// ---------- shared ----------

async function listLoans(statuses: LoanStatus[]) {
  const loans = await Loan.find({ status: { $in: statuses } })
    .sort({ createdAt: -1 })
    .populate("user", "name email");
  const userIds = loans.map((l) => (l.user as any)._id);
  const profiles = await BorrowerProfile.find({ user: { $in: userIds } });
  const byUser = new Map(profiles.map((p) => [String(p.user), p]));

  return loans.map((loan) => ({
    ...withOutstanding(loan),
    borrower: loan.user,
    profile: byUser.get(String((loan.user as any)._id)) ?? null,
  }));
}

function parseStatuses(raw: unknown, allowed: LoanStatus[]): LoanStatus[] {
  if (typeof raw !== "string" || !raw) return allowed;
  const picked = raw.split(",").filter((s): s is LoanStatus => allowed.includes(s as LoanStatus));
  return picked.length ? picked : allowed;
}

function loanId(req: Request): string {
  const id = String(req.params.id);
  if (!Types.ObjectId.isValid(id)) throw new HttpError(400, "Invalid loan id");
  return id;
}

// Moves a loan between statuses only if it is currently in `from`, so two
// executives acting on the same loan can't both succeed.
async function transition(id: string, from: LoanStatus, set: Record<string, unknown>) {
  const loan = await Loan.findOneAndUpdate({ _id: id, status: from }, { $set: set }, { new: true });
  if (loan) return loan;
  const existing = await Loan.findById(id);
  if (!existing) throw new HttpError(404, "Loan not found");
  throw new HttpError(409, `Loan is ${existing.status}, expected ${from}`);
}

// ---------- sales ----------

// Leads: borrowers who have signed up but have not applied for a loan yet.
export async function salesLeads(_req: Request, res: Response) {
  const applied = await Loan.distinct("user");
  const users = await User.find({ role: "BORROWER", _id: { $nin: applied } }).sort({ createdAt: -1 });
  const profiles = await BorrowerProfile.find({ user: { $in: users.map((u) => u._id) } });
  const byUser = new Map(profiles.map((p) => [String(p.user), p]));

  const leads = users.map((u) => {
    const profile = byUser.get(String(u._id));
    const stage = !profile ? "REGISTERED" : !profile.salarySlip ? "DETAILS_DONE" : "SLIP_UPLOADED";
    return {
      id: String(u._id),
      name: u.name,
      email: u.email,
      signedUpAt: (u as any).createdAt,
      stage,
      monthlySalary: profile?.monthlySalary ?? null,
    };
  });
  res.json({ leads });
}

// ---------- sanction ----------

export async function sanctionList(req: Request, res: Response) {
  const statuses = parseStatuses(req.query.status, ["APPLIED", "SANCTIONED", "REJECTED"]);
  res.json({ loans: await listLoans(statuses) });
}

export async function approveLoan(req: Request, res: Response) {
  const loan = await transition(loanId(req), "APPLIED", {
    status: "SANCTIONED",
    sanctionedBy: req.auth!.userId,
    sanctionedAt: new Date(),
  });
  res.json({ loan: withOutstanding(loan) });
}

const rejectSchema = z.object({
  reason: z.string().trim().min(5, "Give a reason of at least 5 characters"),
});

export async function rejectLoan(req: Request, res: Response) {
  const { reason } = rejectSchema.parse(req.body);
  const loan = await transition(loanId(req), "APPLIED", {
    status: "REJECTED",
    rejectionReason: reason,
    rejectedBy: req.auth!.userId,
    rejectedAt: new Date(),
  });
  res.json({ loan: withOutstanding(loan) });
}

// ---------- disbursement ----------

export async function disbursementList(req: Request, res: Response) {
  const statuses = parseStatuses(req.query.status, ["SANCTIONED", "DISBURSED", "CLOSED"]);
  res.json({ loans: await listLoans(statuses) });
}

export async function disburseLoan(req: Request, res: Response) {
  const loan = await transition(loanId(req), "SANCTIONED", {
    status: "DISBURSED",
    disbursedBy: req.auth!.userId,
    disbursedAt: new Date(),
  });
  res.json({ loan: withOutstanding(loan) });
}

// ---------- collection ----------

export async function collectionList(req: Request, res: Response) {
  const statuses = parseStatuses(req.query.status, ["DISBURSED", "CLOSED"]);
  res.json({ loans: await listLoans(statuses) });
}

export async function loanPayments(req: Request, res: Response) {
  const id = loanId(req);
  const payments = await Payment.find({ loan: id }).sort({ paidOn: -1, createdAt: -1 });
  res.json({ payments });
}

const paymentSchema = z.object({
  utr: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{6,30}$/, "UTR must be 6-30 letters or digits"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paidOn: z.coerce.date({ message: "Enter a valid payment date" }),
});

export async function recordPayment(req: Request, res: Response) {
  const id = loanId(req);
  const body = paymentSchema.parse(req.body);

  const loan = await Loan.findById(id);
  if (!loan) throw new HttpError(404, "Loan not found");
  if (loan.status !== "DISBURSED") {
    throw new HttpError(409, `Payments can only be recorded on disbursed loans (loan is ${loan.status})`);
  }

  const amountPaise = toPaise(body.amount);
  if (Math.abs(body.amount * 100 - amountPaise) > 1e-6) {
    throw new HttpError(400, "Amount can have at most 2 decimal places");
  }
  const outstandingPaise = toPaise(loan.totalRepayment) - toPaise(loan.amountPaid);
  if (amountPaise > outstandingPaise) {
    throw new HttpError(400, `Amount exceeds the outstanding balance of ₹${outstandingPaise / 100}`);
  }
  if (body.paidOn.getTime() > Date.now()) {
    throw new HttpError(400, "Payment date cannot be in the future");
  }
  if (loan.disbursedAt && body.paidOn < startOfDay(loan.disbursedAt)) {
    throw new HttpError(400, "Payment date cannot be before the loan was disbursed");
  }

  let payment;
  try {
    payment = await Payment.create({
      loan: loan._id,
      utr: body.utr,
      amount: amountPaise / 100,
      paidOn: body.paidOn,
      recordedBy: req.auth!.userId,
    });
  } catch (err: any) {
    if (err?.code === 11000) throw new HttpError(409, "A payment with this UTR number already exists");
    throw err;
  }

  // Derive the paid total from the payments themselves rather than incrementing,
  // so the loan can't drift out of sync with the ledger.
  const [{ total } = { total: 0 }] = await Payment.aggregate([
    { $match: { loan: loan._id } },
    { $group: { _id: null, total: { $sum: { $round: [{ $multiply: ["$amount", 100] }, 0] } } } },
  ]);
  const totalPaise: number = total;

  if (totalPaise > toPaise(loan.totalRepayment)) {
    // Lost a race with another payment; undo this one.
    await Payment.deleteOne({ _id: payment._id });
    throw new HttpError(409, "Balance changed while recording this payment. Please refresh and retry.");
  }

  loan.amountPaid = totalPaise / 100;
  if (totalPaise === toPaise(loan.totalRepayment)) {
    loan.status = "CLOSED";
    loan.closedAt = new Date();
  }
  await loan.save();

  res.status(201).json({ payment, loan: withOutstanding(loan) });
}

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}
