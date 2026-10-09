import { EmploymentMode } from "./types";

// Client-side copy of the server's Business Rule Engine. It only exists to give
// instant feedback while typing - the server re-checks everything and is the
// source of truth.
export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/;

export function calculateAge(dob: string, today = new Date()): number {
  const d = new Date(dob);
  let age = today.getFullYear() - d.getFullYear();
  const hadBirthday =
    today.getMonth() > d.getMonth() || (today.getMonth() === d.getMonth() && today.getDate() >= d.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

export interface BreFields {
  pan: string;
  dob: string;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export function checkEligibility(f: BreFields): string[] {
  const reasons: string[] = [];
  if (f.dob) {
    const age = calculateAge(f.dob);
    if (age < 23 || age > 50) reasons.push(`Age must be between 23 and 50 years (you are ${age}).`);
  }
  if (f.monthlySalary < 25000) reasons.push("Monthly salary must be at least ₹25,000.");
  if (!PAN_REGEX.test(f.pan.toUpperCase())) reasons.push("PAN is not in a valid format (e.g. ABCDE1234F).");
  if (f.employmentMode === "UNEMPLOYED") reasons.push("Unemployed applicants are not eligible for a loan.");
  return reasons;
}
