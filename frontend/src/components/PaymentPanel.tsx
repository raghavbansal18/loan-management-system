"use client";

import { useEffect, useState } from "react";
import { Alert, buttonClass, Field, inputClass } from "./ui";
import { api, errorMessage } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import { Payment, StaffLoan } from "@/lib/types";

export function PaymentPanel({ loan, onChanged }: { loan: StaffLoan; onChanged: () => void }) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [utr, setUtr] = useState("");
  const [amount, setAmount] = useState("");
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ payments: Payment[] }>(`/collection/loans/${loan._id}/payments`)
      .then((res) => !cancelled && setPayments(res.payments))
      .catch((err) => !cancelled && setError(errorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [loan._id, version]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post(`/collection/loans/${loan._id}/payments`, { utr, amount: Number(amount), paidOn });
      setUtr("");
      setAmount("");
      setVersion((v) => v + 1);
      onChanged();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const open = loan.status === "DISBURSED";

  return (
    <div className="grid gap-6 bg-slate-50 p-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 text-sm font-semibold">Payment history</h4>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">No payments recorded yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white text-sm">
            {payments.map((p) => (
              <li key={p._id} className="flex items-center justify-between gap-2 px-3 py-2">
                <div>
                  <div className="font-mono text-xs">{p.utr}</div>
                  <div className="text-xs text-slate-500">{formatDate(p.paidOn)}</div>
                </div>
                <div className="font-medium">{inr(p.amount)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold">Record a payment</h4>
        {open ? (
          <form onSubmit={submit} className="space-y-3">
            {error && <Alert>{error}</Alert>}
            <Field label="UTR number">
              <input
                className={`${inputClass} font-mono uppercase`}
                value={utr}
                onChange={(e) => setUtr(e.target.value.toUpperCase())}
                minLength={6}
                maxLength={30}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={`Amount (max ${inr(loan.outstanding)})`}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={loan.outstanding}
                  className={inputClass}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </Field>
              <Field label="Payment date">
                <input
                  type="date"
                  className={inputClass}
                  value={paidOn}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => setPaidOn(e.target.value)}
                  required
                />
              </Field>
            </div>
            <button className={buttonClass} disabled={busy}>
              {busy ? "Saving…" : "Record payment"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-500">This loan is closed. No further payments can be recorded.</p>
        )}
      </div>
    </div>
  );
}
