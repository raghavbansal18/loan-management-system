"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DataState, ModuleShell, TableWrap, td, th } from "@/components/dashboard";
import { api, errorMessage } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import { Lead } from "@/lib/types";

const STAGES: Record<Lead["stage"], { label: string; style: string }> = {
  REGISTERED: { label: "Registered", style: "bg-slate-100 text-slate-700" },
  DETAILS_DONE: { label: "Details submitted", style: "bg-amber-100 text-amber-800" },
  SLIP_UPLOADED: { label: "Slip uploaded", style: "bg-blue-100 text-blue-800" },
};

function SalesModule() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<{ leads: Lead[] }>("/sales/leads")
      .then((res) => setLeads(res.leads))
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ModuleShell
      title="Sales"
      description="Borrowers who have registered but not applied for a loan yet. Follow up with the ones who got partway."
    >
      <DataState loading={loading} error={error} empty={leads.length === 0} emptyText="No open leads right now.">
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Email</th>
              <th className={th}>Signed up</th>
              <th className={th}>Progress</th>
              <th className={th}>Monthly salary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((l) => (
              <tr key={l.id}>
                <td className={`${td} font-medium`}>{l.name}</td>
                <td className={td}>{l.email}</td>
                <td className={td}>{formatDate(l.signedUpAt)}</td>
                <td className={td}>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGES[l.stage].style}`}>
                    {STAGES[l.stage].label}
                  </span>
                </td>
                <td className={td}>{l.monthlySalary != null ? inr(l.monthlySalary) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </DataState>
    </ModuleShell>
  );
}

export default function SalesPage() {
  return (
    <AuthGuard roles={["ADMIN", "SALES"]}>
      <SalesModule />
    </AuthGuard>
  );
}
