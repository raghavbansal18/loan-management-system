import { toPaise } from "./loanMath";

// Adds the derived outstanding balance to a loan document for API responses.
export function withOutstanding<T extends { toObject: () => any; totalRepayment: number; amountPaid: number }>(loan: T) {
  const outstanding = (toPaise(loan.totalRepayment) - toPaise(loan.amountPaid)) / 100;
  return { ...loan.toObject(), outstanding };
}
