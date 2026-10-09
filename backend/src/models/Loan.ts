import { Schema, model, Types } from "mongoose";

// APPLIED -> SANCTIONED | REJECTED
// SANCTIONED -> DISBURSED
// DISBURSED -> CLOSED (automatically, once fully repaid)
export const LOAN_STATUSES = ["APPLIED", "SANCTIONED", "REJECTED", "DISBURSED", "CLOSED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export interface ILoan {
  user: Types.ObjectId;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedBy?: Types.ObjectId;
  sanctionedAt?: Date;
  rejectedBy?: Types.ObjectId;
  rejectedAt?: Date;
  disbursedBy?: Types.ObjectId;
  disbursedAt?: Date;
  closedAt?: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    principal: { type: Number, required: true },
    tenureDays: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    interest: { type: Number, required: true },
    totalRepayment: { type: Number, required: true },
    amountPaid: { type: Number, default: 0 },
    status: { type: String, enum: LOAN_STATUSES, default: "APPLIED", index: true },
    rejectionReason: String,
    sanctionedBy: { type: Schema.Types.ObjectId, ref: "User" },
    sanctionedAt: Date,
    rejectedBy: { type: Schema.Types.ObjectId, ref: "User" },
    rejectedAt: Date,
    disbursedBy: { type: Schema.Types.ObjectId, ref: "User" },
    disbursedAt: Date,
    closedAt: Date,
  },
  { timestamps: true }
);

export const Loan = model<ILoan>("Loan", loanSchema);
