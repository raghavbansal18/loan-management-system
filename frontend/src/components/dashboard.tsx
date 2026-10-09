"use client";

import { Alert, Card } from "./ui";

export function ModuleShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mb-6 mt-1 text-sm text-slate-500">{description}</p>
      {children}
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="mb-4 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 ${value === o.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function DataState({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <Alert>{error}</Alert>;
  if (empty) return <Card className="text-center text-sm text-slate-500">{emptyText}</Card>;
  return <>{children}</>;
}

export const th = "px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
export const td = "px-4 py-3 align-top text-sm";

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">{children}</table>
    </div>
  );
}
