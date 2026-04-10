"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const userId = String(form.get("userId") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password }),
    });

    const result = await response.json().catch(() => ({ error: "Login failed" }));

    if (!response.ok) {
      setError(result.error ?? "Login failed");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-indigo-950 to-fuchsia-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-fuchsia-200/30 bg-white/95 p-6 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-fuchsia-600">Admin Access</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">System Administration Login</h1>
        <p className="mt-1 text-sm text-slate-600">Enter admin ID and password to open admin mode.</p>

        <form className="mt-6 grid gap-3" onSubmit={onSubmit}>
          <input name="userId" className="erp-input" placeholder="Admin ID" required />
          <input name="password" className="erp-input" type="password" placeholder="Password" required />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
