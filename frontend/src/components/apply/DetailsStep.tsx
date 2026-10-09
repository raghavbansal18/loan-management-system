"use client";

import { useMemo, useState } from "react";
import { Alert, Field, buttonClass, inputClass } from "../ui";
import { ApiError, api, errorMessage } from "@/lib/api";
import { checkEligibility } from "@/lib/bre";
import { BorrowerProfile, EmploymentMode } from "@/lib/types";

const MODES: { value: EmploymentMode; label: string }[] = [
  { value: "SALARIED", label: "Salaried" },
  { value: "SELF_EMPLOYED", label: "Self-employed" },
  { value: "UNEMPLOYED", label: "Unemployed" },
];

export function DetailsStep({
  initial,
  onSaved,
}: {
  initial: BorrowerProfile | null;
  onSaved: (profile: BorrowerProfile) => void;
}) {
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [pan, setPan] = useState(initial?.pan ?? "");
  const [dob, setDob] = useState(initial?.dob?.slice(0, 10) ?? "");
  const [salary, setSalary] = useState(initial ? String(initial.monthlySalary) : "");
  const [mode, setMode] = useState<EmploymentMode>(initial?.employmentMode ?? "SALARIED");
  const [serverReasons, setServerReasons] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [touched, setTouched] = useState(false);

  // Instant feedback only; the server decides.
  const clientReasons = useMemo(
    () => (dob && salary !== "" && pan ? checkEligibility({ pan, dob, monthlySalary: Number(salary), employmentMode: mode }) : []),
    [pan, dob, salary, mode]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");
    setServerReasons([]);
    setBusy(true);
    try {
      const res = await api.put<{ profile: BorrowerProfile }>("/borrower/profile", {
        fullName,
        pan,
        dob,
        monthlySalary: Number(salary),
        employmentMode: mode,
      });
      onSaved(res.profile);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422 && Array.isArray(err.details)) {
        setServerReasons(err.details as string[]);
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  }

  const reasons = serverReasons.length ? serverReasons : touched ? clientReasons : [];

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {reasons.length > 0 && (
        <Alert>
          <p className="mb-1 font-medium">We can&apos;t take this application forward:</p>
          <ul className="list-disc space-y-0.5 pl-5">
            {reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Alert>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </Field>
        <Field label="PAN">
          <input
            className={`${inputClass} uppercase`}
            value={pan}
            maxLength={10}
            placeholder="ABCDE1234F"
            onChange={(e) => setPan(e.target.value.toUpperCase())}
            required
          />
        </Field>
        <Field label="Date of birth">
          <input
            type="date"
            className={inputClass}
            value={dob}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => setDob(e.target.value)}
            required
          />
        </Field>
        <Field label="Monthly salary (₹)">
          <input
            type="number"
            min={0}
            className={inputClass}
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            required
          />
        </Field>
        <Field label="Employment mode">
          <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value as EmploymentMode)}>
            {MODES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <button className={buttonClass} disabled={busy}>
        {busy ? "Checking eligibility…" : "Check eligibility & continue"}
      </button>
    </form>
  );
}
