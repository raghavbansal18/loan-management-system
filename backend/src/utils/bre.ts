import { EmploymentMode } from "../models/BorrowerProfile";

// Business Rule Engine. The same rules are mirrored on the client for instant
// feedback, but this copy is the one that decides - the client can be bypassed.

export const BRE_RULES = {
  minAge: 23,
  maxAge: 50,
  minSalary: 25000,
};

// 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F. The 4th letter is the holder
// type (P = individual, C = company, ...); we only accept the valid ones.
export const PAN_REGEX = /^[A-Z]{3}[ABCFGHLJPT][A-Z][0-9]{4}[A-Z]$/;

export interface BreInput {
  pan: string;
  dob: Date;
  monthlySalary: number;
  employmentMode: EmploymentMode;
}

export interface BreResult {
  passed: boolean;
  reasons: string[];
}

export function calculateAge(dob: Date, today: Date = new Date()): number {
  let age = today.getFullYear() - dob.getFullYear();
  const hadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}

export function runBre(input: BreInput): BreResult {
  const reasons: string[] = [];

  const age = calculateAge(input.dob);
  if (age < BRE_RULES.minAge || age > BRE_RULES.maxAge) {
    reasons.push(`Age must be between ${BRE_RULES.minAge} and ${BRE_RULES.maxAge} years (you are ${age}).`);
  }

  if (input.monthlySalary < BRE_RULES.minSalary) {
    reasons.push(`Monthly salary must be at least ₹${BRE_RULES.minSalary.toLocaleString("en-IN")}.`);
  }

  if (!PAN_REGEX.test(input.pan)) {
    reasons.push("PAN is not in a valid format (expected something like ABCDE1234F).");
  }

  if (input.employmentMode === "UNEMPLOYED") {
    reasons.push("Unemployed applicants are not eligible for a loan.");
  }

  return { passed: reasons.length === 0, reasons };
}
