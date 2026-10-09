import fs from "fs";
import path from "path";
import { Request, Response } from "express";
import { z } from "zod";
import { BorrowerProfile, EMPLOYMENT_MODES } from "../models/BorrowerProfile";
import { Types } from "mongoose";
import { Loan, LoanStatus } from "../models/Loan";
import { HttpError } from "../utils/httpError";
import { runBre } from "../utils/bre";
import { INTEREST_RATE, LOAN_LIMITS, calculateLoan } from "../utils/loanMath";
import { uploadRoot } from "../middleware/upload";

const ACTIVE_STATUSES: LoanStatus[] = ["APPLIED", "SANCTIONED", "DISBURSED"];

const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required"),
  pan: z.string().trim().toUpperCase().min(1, "PAN is required"),
  dob: z.coerce.date({ message: "Enter a valid date of birth" }),
  monthlySalary: z.coerce.number().min(0, "Salary cannot be negative"),
  employmentMode: z.enum(EMPLOYMENT_MODES),
});

const applySchema = z.object({
  principal: z.coerce
    .number()
    .min(LOAN_LIMITS.minAmount, `Minimum loan amount is ₹${LOAN_LIMITS.minAmount}`)
    .max(LOAN_LIMITS.maxAmount, `Maximum loan amount is ₹${LOAN_LIMITS.maxAmount}`),
  tenureDays: z.coerce
    .number()
    .int()
    .min(LOAN_LIMITS.minTenure, `Minimum tenure is ${LOAN_LIMITS.minTenure} days`)
    .max(LOAN_LIMITS.maxTenure, `Maximum tenure is ${LOAN_LIMITS.maxTenure} days`),
});

async function hasActiveLoan(userId: string) {
  return Loan.exists({ user: new Types.ObjectId(userId), status: { $in: ACTIVE_STATUSES } });
}

export async function getProfile(req: Request, res: Response) {
  const profile = await BorrowerProfile.findOne({ user: req.auth!.userId });
  res.json({ profile });
}

// Personal details + eligibility check. The BRE runs here on the server and a
// failing application is never saved.
export async function saveProfile(req: Request, res: Response) {
  const body = profileSchema.parse(req.body);

  const result = runBre(body);
  if (!result.passed) {
    throw new HttpError(422, "You are not eligible for a loan", result.reasons);
  }

  if (await hasActiveLoan(req.auth!.userId)) {
    throw new HttpError(409, "You already have a loan in progress");
  }

  const profile = await BorrowerProfile.findOneAndUpdate(
    { user: req.auth!.userId },
    { $set: body, $setOnInsert: { user: req.auth!.userId } },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ profile });
}

export async function uploadSalarySlip(req: Request, res: Response) {
  if (!req.file) throw new HttpError(400, "Attach a file in the 'salarySlip' field");

  const profile = await BorrowerProfile.findOne({ user: req.auth!.userId });
  if (!profile) {
    fs.unlink(req.file.path, () => {});
    throw new HttpError(400, "Complete your personal details before uploading the salary slip");
  }

  const previous = profile.salarySlip?.storedName;
  profile.salarySlip = {
    storedName: req.file.filename,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    uploadedAt: new Date(),
  };
  await profile.save();
  if (previous) fs.unlink(path.join(uploadRoot, previous), () => {});

  res.status(201).json({ profile });
}

export async function applyForLoan(req: Request, res: Response) {
  const body = applySchema.parse(req.body);
  const userId = req.auth!.userId;

  const profile = await BorrowerProfile.findOne({ user: userId });
  if (!profile) throw new HttpError(400, "Complete your personal details first");
  if (!profile.salarySlip) throw new HttpError(400, "Upload your salary slip first");
  if (await hasActiveLoan(userId)) throw new HttpError(409, "You already have a loan in progress");

  // Re-run the BRE at apply time, in case the profile has aged out of range since it was saved.
  const result = runBre(profile);
  if (!result.passed) throw new HttpError(422, "You are not eligible for a loan", result.reasons);

  const { interest, totalRepayment } = calculateLoan(body.principal, body.tenureDays);
  const loan = await Loan.create({
    user: userId,
    principal: body.principal,
    tenureDays: body.tenureDays,
    interestRate: INTEREST_RATE,
    interest,
    totalRepayment,
    status: "APPLIED",
  });
  res.status(201).json({ loan });
}

export async function myLoans(req: Request, res: Response) {
  const loans = await Loan.find({ user: req.auth!.userId }).sort({ createdAt: -1 });
  res.json({ loans });
}

// Owner, or staff who need to verify income (sanction / admin).
export async function downloadSalarySlip(req: Request, res: Response) {
  const { userId } = req.params;
  const { userId: callerId, role } = req.auth!;
  const allowed = callerId === userId || role === "ADMIN" || role === "SANCTION";
  if (!allowed) throw new HttpError(403, "You do not have permission to view this file");

  const profile = await BorrowerProfile.findOne({ user: userId });
  if (!profile?.salarySlip) throw new HttpError(404, "No salary slip on file");

  res.type(profile.salarySlip.mimeType);
  res.setHeader("Content-Disposition", `inline; filename="${profile.salarySlip.originalName}"`);
  res.sendFile(path.join(uploadRoot, profile.salarySlip.storedName));
}
