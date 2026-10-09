"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Alert, Card, StatusBadge, buttonClass } from "@/components/ui";
import { DetailsStep } from "@/components/apply/DetailsStep";
import { SlipStep } from "@/components/apply/SlipStep";
import { LoanStep } from "@/components/apply/LoanStep";
import { LoanSummary } from "@/components/LoanSummary";
import { api, errorMessage } from "@/lib/api";
import { formatDate, inr } from "@/lib/format";
import { BorrowerProfile, Loan } from "@/lib/types";

const STEPS = ["Personal details", "Salary slip", "Loan & apply"];

function StatusMessage({ loan }: { loan: Loan }) {
  switch (loan.status) {
    case "APPLIED":
      return <p className="text-sm text-slate-600">Your application is with our sanction team. We&apos;ll update it here.</p>;
    case "SANCTIONED":
      return <p className="text-sm text-slate-600">Approved on {formatDate(loan.sanctionedAt)}. Disbursement is next.</p>;
    case "REJECTED":
      return <Alert>Your application was rejected. Reason: {loan.rejectionReason}</Alert>;
    case "DISBURSED":
      return (
        <p className="text-sm text-slate-600">
          Disbursed on {formatDate(loan.disbursedAt)}. Paid {inr(loan.amountPaid)}, outstanding{" "}
          <span className="font-medium">{inr(loan.outstanding)}</span>.
        </p>
      );
    case "CLOSED":
      return <Alert kind="success">This loan is fully repaid and closed on {formatDate(loan.closedAt)}.</Alert>;
  }
}

function ApplyFlow() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [step, setStep] = useState(0);
  const [applying, setApplying] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<{ profile: BorrowerProfile | null }>("/borrower/profile"),
      api.get<{ loans: Loan[] }>("/borrower/loans"),
    ])
      .then(([p, l]) => {
        setProfile(p.profile);
        setLoans(l.loans);
      })
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;

  const latest = loans[0];
  const inProgress = latest && ["APPLIED", "SANCTIONED", "DISBURSED"].includes(latest.status);
  const showFlow = !latest || (!inProgress && applying);

  if (!showFlow) {
    return (
      <div className="space-y-4">
        {loans.map((loan) => (
          <Card key={loan._id}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">Loan application · {formatDate(loan.createdAt)}</h2>
              <StatusBadge status={loan.status} />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <LoanSummary
                principal={loan.principal}
                tenureDays={loan.tenureDays}
                interest={loan.interest}
                totalRepayment={loan.totalRepayment}
                rate={loan.interestRate}
              />
              <div className="self-center">
                <StatusMessage loan={loan} />
              </div>
            </div>
          </Card>
        ))}
        {!inProgress && (
          <button
            className={buttonClass}
            onClick={() => {
              setApplying(true);
              setStep(0);
            }}
          >
            Apply for a new loan
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-2 text-sm">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 rounded-full px-3 py-1 ${
              i === step
                ? "bg-indigo-600 text-white"
                : i < step
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-100 text-slate-500"
            }`}
          >
            <span className="font-semibold">{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <Card>
        {step === 0 && (
          <DetailsStep
            initial={profile}
            onSaved={(p) => {
              setProfile(p);
              setStep(1);
            }}
          />
        )}
        {step === 1 && profile && (
          <SlipStep
            profile={profile}
            onUploaded={setProfile}
            onBack={() => setStep(0)}
            onContinue={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <LoanStep
            onBack={() => setStep(1)}
            onApplied={(loan) => {
              setLoans([loan, ...loans]);
              setApplying(false);
            }}
          />
        )}
      </Card>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <AuthGuard roles={["BORROWER"]}>
      <Header />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Loan application</h1>
        <ApplyFlow />
      </main>
    </AuthGuard>
  );
}
