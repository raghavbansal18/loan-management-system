"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { homeFor } from "@/lib/roles";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? homeFor(user.role) : "/login");
  }, [loading, user, router]);

  return <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Loading…</div>;
}
