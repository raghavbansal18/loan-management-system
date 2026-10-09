"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { homeFor } from "@/lib/roles";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={user ? homeFor(user.role) : "/"} className="text-lg font-semibold text-indigo-600">
          LMS
        </Link>
        {user && (
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-right sm:block">
              <span className="block font-medium leading-tight">{user.name}</span>
              <span className="block text-xs text-slate-500">{user.role}</span>
            </span>
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
