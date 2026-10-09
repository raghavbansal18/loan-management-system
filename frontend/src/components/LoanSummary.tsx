import { inr } from "@/lib/format";

export function LoanSummary({
  principal,
  tenureDays,
  interest,
  totalRepayment,
  rate,
}: {
  principal: number;
  tenureDays: number;
  interest: number;
  totalRepayment: number;
  rate: number;
}) {
  const rows: [string, string][] = [
    ["Principal", inr(principal)],
    ["Tenure", `${tenureDays} days`],
    ["Interest rate", `${rate}% p.a. (simple)`],
    ["Interest", inr(interest)],
  ];
  return (
    <dl className="space-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between">
          <dt className="text-slate-500">{k}</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base">
        <dt className="font-semibold">Total repayment</dt>
        <dd className="font-semibold text-indigo-600">{inr(totalRepayment)}</dd>
      </div>
    </dl>
  );
}
