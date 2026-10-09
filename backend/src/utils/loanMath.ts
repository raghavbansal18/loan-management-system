export const INTEREST_RATE = 12; // % per annum, fixed
export const LOAN_LIMITS = {
  minAmount: 50000,
  maxAmount: 500000,
  minTenure: 30,
  maxTenure: 365,
};

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Money comparisons are done in paise so floating point noise never decides
// whether a loan is "fully paid".
export const toPaise = (rupees: number) => Math.round(rupees * 100);

// Simple interest: SI = (P * R * T) / (365 * 100), T in days.
export function calculateLoan(principal: number, tenureDays: number) {
  const interest = round2((principal * INTEREST_RATE * tenureDays) / (365 * 100));
  const totalRepayment = round2(principal + interest);
  return { interest, totalRepayment };
}
