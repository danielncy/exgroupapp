"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { adminSignIn } from "@ex-group/db";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setError("Please enter your email address");
        return;
      }

      if (!password) {
        setError("Please enter your password");
        return;
      }

      try {
        setLoading(true);
        await adminSignIn(trimmedEmail, password);
        router.push("/admin");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Invalid credentials";
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [email, password, router]
  );

  return (
    <main className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-slate-900 p-12 text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">EX Group</h1>
          <p className="mt-1 text-sm text-slate-400">Admin Portal</p>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">
            Manage your outlets,
            <br />
            bookings, and customers
            <br />
            from one place.
          </h2>
          <p className="text-sm text-slate-400">
            Customer OS Dashboard — EX Style, EX Beauty, UHair, Coulisse
          </p>
        </div>

        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} EX Group Pte. Ltd. All rights
          reserved.
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile-only branding */}
          <div className="lg:hidden text-center">
            <h1 className="text-2xl font-bold text-slate-900">EX Group</h1>
            <p className="mt-1 text-sm text-slate-500">Admin Portal</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-slate-900">
              Sign in to your account
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="admin@exgroup.com"
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 sm:text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="Enter your password"
                className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-slate-900 placeholder-slate-400 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 disabled:opacity-50 sm:text-sm"
              />
            </div>

            {error && (
              <div
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400">
            This portal is for authorized EX Group staff only.
            <br />
            Contact HQ if you need access.
          </p>
        </div>
      </div>
    </main>
  );
}
