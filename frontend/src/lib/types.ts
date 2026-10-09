export type Role = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";

export type EmploymentMode = "SALARIED" | "SELF_EMPLOYED" | "UNEMPLOYED";

export type LoanStatus = "APPLIED" | "SANCTIONED" | "REJECTED" | "DISBURSED" | "CLOSED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface SalarySlip {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface BorrowerProfile {
  _id: string;
  user: string;
  fullName: string;
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlip?: SalarySlip;
}

export interface Loan {
  _id: string;
  user: string;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  amountPaid: number;
  outstanding: number;
  status: LoanStatus;
  rejectionReason?: string;
  createdAt: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
}

export interface StaffLoan extends Loan {
  borrower: { _id: string; name: string; email: string };
  profile: BorrowerProfile | null;
}

export interface Payment {
  _id: string;
  utr: string;
  amount: number;
  paidOn: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  signedUpAt: string;
  stage: "REGISTERED" | "DETAILS_DONE" | "SLIP_UPLOADED";
  monthlySalary: number | null;
}
