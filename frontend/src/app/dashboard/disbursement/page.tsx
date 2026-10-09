"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DataState, FilterTabs, ModuleShell, TableWrap, td, th } from "@/components/dashboard";
import { Alert, StatusBadge, buttonClass } from "@/components/ui";
import { useLoans } from "@/components/useLoans";
import { api, errorMessage } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";

type Filter = "SANCTIONED" | "DISBURSED,CLOSED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "SANCTIONED", label: "Ready to disburse" },
  { value: "DISBURSED,CLOSED", label: "Disbursed" },
];

function DisbursementModule() {
  const [filter, setFilter] = useState<Filter>("SANCTIONED");
  const { loans, loading, error, reload } = useLoans(`/disbursement/loans?status=${filter}`);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function disburse(id: string) {
    setBusyId(id);
    setActionError("");
    try {
      await api.post(`/disbursement/loans/${id}/disburse`);
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ModuleShell
      title="Disbursement"
      description="Sanctioned loans waiting for funds. Marking a loan as disbursed moves it to collection."
    >
      {actionError && (
        <div className="mb-4">
          <Alert>{actionError}</Alert>
        </div>
      )}
      <FilterTabs options={FILTERS} value={filter} onChange={setFilter} />
      <DataState loading={loading} error={error} empty={loans.length === 0} emptyText="Nothing here.">
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Borrower</th>
              <th className={th}>Amount</th>
              <th className={th}>Tenure</th>
              <th className={th}>Sanctioned</th>
              <th className={th}>Status</th>
              <th className={th}>Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((l) => (
              <tr key={l._id}>
                <td className={td}>
                  <div className="font-medium">{l.borrower.name}</div>
                  <div className="text-xs text-slate-500">{l.borrower.email}</div>
                </td>
                <td className={td}>{inr(l.principal)}</td>
                <td className={td}>{l.tenureDays} days</td>
                <td className={td}>{formatDate(l.sanctionedAt)}</td>
                <td className={td}>
                  <StatusBadge status={l.status} />
                  {l.disbursedAt && <div className="mt-1 text-xs text-slate-500">{formatDate(l.disbursedAt)}</div>}
                </td>
                <td className={td}>
                  {l.status === "SANCTIONED" && (
                    <button className={buttonClass} disabled={busyId === l._id} onClick={() => disburse(l._id)}>
                      {busyId === l._id ? "Working…" : "Mark disbursed"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataState>
    </ModuleShell>
  );
}

export default function DisbursementPage() {
  return (
    <AuthGuard roles={["ADMIN", "DISBURSEMENT"]}>
      <DisbursementModule />
    </AuthGuard>
  );
}
