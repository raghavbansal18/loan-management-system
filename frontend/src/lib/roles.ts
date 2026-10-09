import { Role } from "./types";

export interface Module {
  key: "sales" | "sanction" | "disbursement" | "collection";
  label: string;
  href: string;
  role: Role;
}

export const MODULES: Module[] = [
  { key: "sales", label: "Sales", href: "/dashboard/sales", role: "SALES" },
  { key: "sanction", label: "Sanction", href: "/dashboard/sanction", role: "SANCTION" },
  { key: "disbursement", label: "Disbursement", href: "/dashboard/disbursement", role: "DISBURSEMENT" },
  { key: "collection", label: "Collection", href: "/dashboard/collection", role: "COLLECTION" },
];

// Admin sees every module, everyone else sees only the one matching their role.
export const modulesFor = (role: Role) =>
  role === "ADMIN" ? MODULES : MODULES.filter((m) => m.role === role);

export const homeFor = (role: Role) =>
  role === "BORROWER" ? "/apply" : modulesFor(role)[0]?.href ?? "/login";
