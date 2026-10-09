"use client";

import { Fragment, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DataState, FilterTabs, ModuleShell, TableWrap, td, th } from "@/components/dashboard";
import { PaymentPanel } from "@/components/PaymentPanel";
import { StatusBadge, secondaryButtonClass } from "@/components/ui";
import { useLoans } from "@/components/useLoans";
import { inr } from "@/lib/format";

type Filter = "DISBURSED" | "CLOSED";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "DISBURSED", label: "Active loans" },
  { value: "CLOSED", label: "Closed" },
];

function CollectionModule() {
  const [filter, setFilter] = useState<Filter>("DISBURSED");
  const { loans, loading, error, reload } = useLoans(`/collection/loans?status=${filter}`);
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <ModuleShell
      title="Collection"
      description="Record borrower payments against disbursed loans. A loan closes automatically once it is fully repaid."
    >
      <FilterTabs
        options={FILTERS}
        value={filter}
        onChange={(f) => {
          setFilter(f);
          setOpenId(null);
        }}
      />
      <DataState loading={loading} error={error} empty={loans.length === 0} emptyText="Nothing here.">
        <TableWrap>
          <thead className="bg-slate-50">
            <tr>
              <th className={th}>Borrower</th>
              <th className={th}>Total repayment</th>
              <th className={th}>Paid</th>
              <th className={th}>Outstanding</th>
              <th className={th}>Status</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loans.map((l) => (
              <Fragment key={l._id}>
                <tr>
                  <td className={td}>
                    <div className="font-medium">{l.borrower.name}</div>
                    <div className="text-xs text-slate-500">{l.borrower.email}</div>
                  </td>
                  <td className={td}>{inr(l.totalRepayment)}</td>
                  <td className={td}>{inr(l.amountPaid)}</td>
                  <td className={`${td} font-medium`}>{inr(l.outstanding)}</td>
                  <td className={td}>
                    <StatusBadge status={l.status} />
                  </td>
                  <td className={td}>
                    <button className={secondaryButtonClass} onClick={() => setOpenId(openId === l._id ? null : l._id)}>
                      {openId === l._id ? "Hide" : l.status === "DISBURSED" ? "Payments" : "History"}
                    </button>
                  </td>
                </tr>
                {openId === l._id && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <PaymentPanel loan={l} onChanged={reload} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </TableWrap>
      </DataState>
    </ModuleShell>
  );
}

export default function CollectionPage() {
  return (
    <AuthGuard roles={["ADMIN", "COLLECTION"]}>
      <CollectionModule />
    </AuthGuard>
  );
}
