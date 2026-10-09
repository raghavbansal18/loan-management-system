"use client";

import { useState } from "react";
import { Alert, buttonClass, inputClass, secondaryButtonClass } from "../ui";
import { api, errorMessage } from "@/lib/api";
import { BorrowerProfile } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["application/pdf", "image/jpeg", "image/png"];

export function SlipStep({
  profile,
  onUploaded,
  onBack,
  onContinue,
}: {
  profile: BorrowerProfile;
  onUploaded: (profile: BorrowerProfile) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function pick(f: File | null) {
    setError("");
    if (f && !TYPES.includes(f.type)) {
      setError("Only PDF, JPG or PNG files are allowed.");
      setFile(null);
    } else if (f && f.size > MAX_BYTES) {
      setError("File must be 5 MB or smaller.");
      setFile(null);
    } else {
      setFile(f);
    }
  }

  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("salarySlip", file);
      const res = await api.upload<{ profile: BorrowerProfile }>("/borrower/salary-slip", form);
      onUploaded(res.profile);
      setFile(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      {profile.salarySlip && (
        <Alert kind="success">
          Uploaded: <span className="font-medium">{profile.salarySlip.originalName}</span> (
          {(profile.salarySlip.size / 1024).toFixed(0)} KB). You can replace it below.
        </Alert>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Salary slip (PDF, JPG or PNG, max 5 MB)</label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
          className={inputClass}
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={secondaryButtonClass} onClick={onBack}>
          Back
        </button>
        <button type="button" className={buttonClass} onClick={upload} disabled={!file || busy}>
          {busy ? "Uploading…" : profile.salarySlip ? "Replace file" : "Upload"}
        </button>
        {profile.salarySlip && (
          <button type="button" className={buttonClass} onClick={onContinue}>
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
