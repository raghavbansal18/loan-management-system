export const INTEREST_RATE = 12;
export const LIMITS = { minAmount: 50000, maxAmount: 500000, minTenure: 30, maxTenure: 365 };

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

// Simple interest: SI = (P * R * T) / (365 * 100)
export function calculateLoan(principal: number, tenureDays: number) {
  const interest = round2((principal * INTEREST_RATE * tenureDays) / (365 * 100));
  return { interest, totalRepayment: round2(principal + interest) };
}
