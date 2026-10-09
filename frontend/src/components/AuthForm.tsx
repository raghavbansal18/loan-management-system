"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Alert, Card, Field, buttonClass, inputClass } from "./ui";
import { errorMessage } from "@/lib/api";
import { homeFor } from "@/lib/roles";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const user = isLogin ? await login(email, password) : await signup(name, email, password);
      router.replace(homeFor(user.role));
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {isLogin ? "Sign in to continue" : "Sign up to apply for a loan"}
        </p>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && <Alert>{error}</Alert>}
            {!isLogin && (
              <Field label="Full name">
                <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={isLogin ? undefined : 8}
                required
              />
            </Field>
            <button className={`${buttonClass} w-full`} disabled={busy}>
              {busy ? "Please wait…" : isLogin ? "Sign in" : "Sign up"}
            </button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-medium text-indigo-600 hover:underline">
            {isLogin ? "Create an account" : "Sign in"}
          </Link>
        </p>
      </div>
    </main>
  );
}
