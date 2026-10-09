import { Schema, model, Types } from "mongoose";

export const EMPLOYMENT_MODES = ["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"] as const;
export type EmploymentMode = (typeof EMPLOYMENT_MODES)[number];

const salarySlipSchema = new Schema(
  {
    storedName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

export interface IBorrowerProfile {
  user: Types.ObjectId;
  fullName: string;
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
  salarySlip?: {
    storedName: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
  };
}

// One profile per borrower. Only profiles that passed the BRE are ever saved.
const borrowerProfileSchema = new Schema<IBorrowerProfile>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dob: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: { type: String, enum: EMPLOYMENT_MODES, required: true },
    salarySlip: { type: salarySlipSchema },
  },
  { timestamps: true }
);

export const BorrowerProfile = model<IBorrowerProfile>("BorrowerProfile", borrowerProfileSchema);
