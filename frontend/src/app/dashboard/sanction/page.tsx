"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DataState, FilterTabs, ModuleShell, TableWrap, td, th } from "@/components/dashboard";
import { Alert, StatusBadge, buttonClass, inputClass, secondaryButtonClass } from "@/components/ui";
import { useLoans } from "@/components/useLoans";
import { api, errorMessage } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import { calculateAge } from "@/lib/bre";
import { LoanStatus } from "@/lib/types";

type Filter = Extract<LoanStatus, "APPLIED" | "SANCTIONED" | "REJECTED">;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "APPLIED", label: "Pending review" },
  { value: "SANCTIONED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function SanctionModule() {
  const [filter, setFilter] = useState<Filter>("APPLIED");
  const { loans, loading, error, reload } = useLoans(`/sanction/loans?status=${filter}`);
  const [actionError, setActionError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  async function act(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setActionError("");
    try {
      await api.post(`/sanction/loans/${id}/${action}`, action === "reject" ? { reason } : undefined);
      setRejecting(null);
      setReason("");
      await reload();
    } catch (err) {
      setActionError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <ModuleShell
      title="Sanction"
      description="Review applied loans. Approve to send them to disbursement, or reject with a reason."
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
              <th className={th}>Profile</th>
              <th className={th}>Loan</th>
              <th className={th}>Applied</th>
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
                <td className={td}>
                  {l.profile ? (
                    <div className="space-y-0.5 text-xs text-slate-600">
                      <div>PAN {l.profile.pan}</div>
                      <div>
                        Age {calculateAge(l.profile.dob)} · {inr(l.profile.monthlySalary)}/mo
                      </div>
                      <div>{l.profile.employmentMode.replace("_", " ").toLowerCase()}</div>
                      {l.profile.salarySlip && (
                        <button
                          className="text-indigo-600 hover:underline"
                          onClick={() => api.openFile(`/borrower/salary-slip/${l.borrower._id}`).catch((e) => setActionError(errorMessage(e)))}
                        >
                          View salary slip
                        </button>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className={td}>
                  <div className="font-medium">{inr(l.principal)}</div>
                  <div className="text-xs text-slate-500">
                    {l.tenureDays} days · repay {inr(l.totalRepayment)}
                  </div>
                </td>
                <td className={td}>{formatDate(l.createdAt)}</td>
                <td className={td}>
                  <StatusBadge status={l.status} />
                  {l.rejectionReason && <div className="mt-1 max-w-48 text-xs text-slate-500">{l.rejectionReason}</div>}
                </td>
                <td className={td}>
                  {l.status === "APPLIED" &&
                    (rejecting === l._id ? (
                      <div className="w-56 space-y-2">
                        <input
                          className={inputClass}
                          placeholder="Reason for rejection"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            className={buttonClass}
                            disabled={busyId === l._id || reason.trim().length < 5}
                            onClick={() => act(l._id, "reject")}
                          >
                            Confirm
                          </button>
                          <button className={secondaryButtonClass} onClick={() => setRejecting(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button className={buttonClass} disabled={busyId === l._id} onClick={() => act(l._id, "approve")}>
                          Approve
                        </button>
                        <button
                          className={secondaryButtonClass}
                          onClick={() => {
                            setRejecting(l._id);
                            setReason("");
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    ))}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataState>
    </ModuleShell>
  );
}

export default function SanctionPage() {
  return (
    <AuthGuard roles={["ADMIN", "SANCTION"]}>
      <SanctionModule />
    </AuthGuard>
  );
}
