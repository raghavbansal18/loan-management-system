import { Schema, model, InferSchemaType } from "mongoose";

export const ROLES = [
  "ADMIN",
  "SALES",
  "SANCTION",
  "DISBURSEMENT",
  "COLLECTION",
  "BORROWER",
] as const;

export type Role = (typeof ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "BORROWER", index: true },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
