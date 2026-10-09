"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { homeFor } from "@/lib/roles";
import { Role } from "@/lib/types";

// Client-side route protection. This is only about UX - every API call is
// independently authorised on the server.
export function AuthGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const allowed = !!user && (user.role === "ADMIN" ? roles.includes("ADMIN") : roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(homeFor(user.role));
  }, [loading, user, allowed, router]);

  if (loading || !allowed) {
    return <div className="flex flex-1 items-center justify-center p-10 text-sm text-slate-500">Loading…</div>;
  }
  return <>{children}</>;
}
