"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/AuthGuard";
import { useAuth } from "@/components/AuthProvider";
import { Header } from "@/components/Header";
import { modulesFor } from "@/lib/roles";

function Nav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const modules = modulesFor(user.role);

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
        {modules.map((m) => (
          <Link
            key={m.key}
            href={m.href}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium ${
              pathname.startsWith(m.href)
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {m.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard roles={["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"]}>
      <Header />
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </AuthGuard>
  );
}
