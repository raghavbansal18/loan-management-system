"use client";

import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { StaffLoan } from "@/lib/types";

interface State {
  key: string;
  loans: StaffLoan[];
  error: string;
}

export function useLoans(path: string) {
  const [state, setState] = useState<State>({ key: "", loans: [], error: "" });
  const [version, setVersion] = useState(0);
  const key = `${path}#${version}`;

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ loans: StaffLoan[] }>(path)
      .then((res) => !cancelled && setState({ key, loans: res.loans, error: "" }))
      .catch((err) => !cancelled && setState({ key, loans: [], error: errorMessage(err) }));
    return () => {
      cancelled = true;
    };
  }, [path, key]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  // Keep showing the previous rows while a refresh is in flight; only show the
  // loading state when switching to a different path.
  const loading = !state.key.startsWith(`${path}#`);
  return { loans: state.loans, error: state.error, loading, reload };
}
