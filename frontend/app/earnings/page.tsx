"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth/authStore";
import { useEarnings } from "@/components/earnings/hooks";
import { EarningsCard } from "@/components/earnings/components/EarningsCard";
import { WithdrawalForm } from "@/components/earnings/WithdrawalForm";
import { StatusMessage } from "@/components/StatusMessage";

export default function EarningsPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, error, refetch } = useEarnings();

  // Case 1: Signed out or 401 Unauthenticated
  // Requirement: Displays an explicit error state rather than empty success or false zero.
  if (!token || (isError && error?.response?.status === 401)) {
    const errorMsg =
      error?.response?.data?.message ||
      "Sign in required: You must be signed in to access earnings.";

    return (
      <div className="py-8 space-y-4 max-w-xl mx-auto">
        <StatusMessage state="error" message={errorMsg} />
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: Loading
  if (isLoading) {
    return (
      <div className="py-12">
        <StatusMessage state="loading" message="Loading your earnings overview…" />
      </div>
    );
  }

  // Case 3: Error handling with distinct cases
  if (isError) {
    // 3a. Transport failure (server unreachable, error.response is undefined)
    if (!error.response) {
      return (
        <div className="py-8 space-y-4">
          <StatusMessage
            state="error"
            message="Unable to reach the server. Please verify that your network connection and backend container are active."
          />
          <div className="text-center">
            <button
              onClick={() => refetch()}
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    const status = error.response.status;

    // 3b. 401 Unauthorized (invalid/expired session)
    if (status === 401) {
      return (
        <div className="py-8 space-y-4 max-w-xl mx-auto">
          <StatusMessage
            state="error"
            message="Your session has expired or your token is invalid. Please sign in again."
          />
          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      );
    }

    // 3c. 403 Forbidden (authenticated, but not an instructor - e.g. learner)
    if (status === 403) {
      return (
        <div className="py-8 space-y-4 max-w-xl mx-auto">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center space-y-3">
            <h3 className="text-base font-bold text-amber-900">Access Restricted</h3>
            <p className="text-sm text-amber-800">
              Only instructor accounts are permitted to view earnings. You are currently signed in as a learner.
            </p>
            <div className="pt-2">
              <Link
                href="/courses"
                className="inline-flex items-center rounded-lg bg-amber-700 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800"
              >
                Browse Courses Instead
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // 3d. Other API errors
    return (
      <div className="py-8 space-y-4">
        <StatusMessage
          state="error"
          message={error.response.data?.message || "Failed to load earnings. Please try again."}
        />
        <div className="text-center">
          <button
            onClick={() => refetch()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Case 4: Success
  return (
    <div className="space-y-8">
      {/* Main Earnings Card */}
      {data && <EarningsCard earnings={data} />}

      {/* Withdrawal Form */}
      {data && (
        <WithdrawalForm
          availableMinor={data.availableMinor}
          minimumWithdrawalMinor={data.minimumWithdrawalMinor}
          currency={data.currency}
        />
      )}
    </div>
  );
}
