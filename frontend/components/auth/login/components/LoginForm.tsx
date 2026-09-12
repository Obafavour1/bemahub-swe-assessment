"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "../hooks";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { mutate, isPending, error, isError } = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    mutate(
      { email, password },
      {
        onSuccess: () => {
          router.push("/earnings");
        },
      }
    );
  };

  const fillCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
  };

  // Compute error message distinguishing transport failure from API refusal
  const getErrorMessage = () => {
    if (!error) return null;
    if (!error.response) {
      return "Unable to reach the server. Please ensure the backend is running and reachable.";
    }
    return error.response.data?.message || "Email or password is incorrect.";
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-slate-900">Sign in to Bema Learn</h2>
          <p className="mt-1 text-sm text-slate-500">
            Enter your credentials to access your account and earnings.
          </p>
        </div>

        {/* Error Alert */}
        {isError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {getErrorMessage()}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.test"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 transition"
          >
            {isPending ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Test Accounts Quick-Fill Section */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-xs font-medium text-slate-500 mb-3 text-center">
            Seeded Test Accounts (click to autofill)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillCredentials("instructor@example.test", "assessment123")}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-900">Instructor</span>
              <span className="text-[11px] text-slate-500 truncate w-full text-center">
                instructor@example.test
              </span>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials("learner@example.test", "assessment123")}
              className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 hover:bg-slate-100 transition"
            >
              <span className="font-semibold text-slate-900">Learner</span>
              <span className="text-[11px] text-slate-500 truncate w-full text-center">
                learner@example.test
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
