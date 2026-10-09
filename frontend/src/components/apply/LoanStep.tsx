"use client";

import { useMemo, useState } from "react";
import { Alert, Card, buttonClass, secondaryButtonClass } from "../ui";
import { LoanSummary } from "../LoanSummary";
import { api, errorMessage } from "@/lib/api";
import { INTEREST_RATE, LIMITS, calculateLoan } from "@/lib/loan";
import { inr } from "@/lib/format";
import { Loan } from "@/lib/types";

export function LoanStep({ onBack, onApplied }: { onBack: () => void; onApplied: (loan: Loan) => void }) {
  const [principal, setPrincipal] = useState(100000);
  const [tenure, setTenure] = useState(90);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const calc = useMemo(() => calculateLoan(principal, tenure), [principal, tenure]);

  async function apply() {
    setBusy(true);
    setError("");
    try {
      const res = await api.post<{ loan: Loan }>("/borrower/loans", { principal, tenureDays: tenure });
      onApplied(res.loan);
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        {error && <Alert>{error}</Alert>}
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="amount" className="text-sm font-medium text-slate-700">
              Loan amount
            </label>
            <span className="text-lg font-semibold">{inr(principal)}</span>
          </div>
          <input
            id="amount"
            type="range"
            className="w-full accent-indigo-600"
            min={LIMITS.minAmount}
            max={LIMITS.maxAmount}
            step={5000}
            value={principal}
            onChange={(e) => setPrincipal(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{inr(LIMITS.minAmount)}</span>
            <span>{inr(LIMITS.maxAmount)}</span>
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-baseline justify-between">
            <label htmlFor="tenure" className="text-sm font-medium text-slate-700">
              Tenure
            </label>
            <span className="text-lg font-semibold">{tenure} days</span>
          </div>
          <input
            id="tenure"
            type="range"
            className="w-full accent-indigo-600"
            min={LIMITS.minTenure}
            max={LIMITS.maxTenure}
            step={1}
            value={tenure}
            onChange={(e) => setTenure(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{LIMITS.minTenure} days</span>
            <span>{LIMITS.maxTenure} days</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button className={secondaryButtonClass} onClick={onBack} disabled={busy}>
            Back
          </button>
          <button className={buttonClass} onClick={apply} disabled={busy}>
            {busy ? "Applying…" : "Apply"}
          </button>
        </div>
      </div>
      <Card className="bg-slate-50">
        <h3 className="mb-4 font-semibold">Repayment summary</h3>
        <LoanSummary
          principal={principal}
          tenureDays={tenure}
          interest={calc.interest}
          totalRepayment={calc.totalRepayment}
          rate={INTEREST_RATE}
        />
      </Card>
    </div>
  );
}
