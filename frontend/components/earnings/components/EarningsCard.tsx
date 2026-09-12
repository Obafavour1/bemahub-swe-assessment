"use client";

import { Earnings } from "@/lib/types/api";
import { formatMoney } from "@/lib/format";
import { useAuthStore } from "@/lib/auth/authStore";
import { useSignOut } from "../hooks";

interface EarningsCardProps {
  earnings: Earnings;
}

export function EarningsCard({ earnings }: EarningsCardProps) {
  const user = useAuthStore((s) => s.user);
  const handleSignOut = useSignOut();

  const formattedLastWithdrawal = earnings.lastWithdrawalAt
    ? new Date(earnings.lastWithdrawalAt).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Never withdrawn";

  return (
    <div className="space-y-6">
      {/* Top Banner / User bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {user?.name ? user.name.charAt(0) : "U"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900">{user?.name || "Instructor"}</span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 border border-blue-200/60">
                {user?.role || "instructor"}
              </span>
            </div>
            <p className="text-xs text-slate-500">Instructor Account</p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition"
        >
          Sign Out
        </button>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {/* Available Balance */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Available to Withdraw
          </span>
          <p className="mt-2 text-3xl font-extrabold text-emerald-950">
            {formatMoney(earnings.availableMinor, earnings.currency)}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            Cleared balance ready for instant payout
          </p>
        </div>

        {/* Pending Balance */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            Pending Balance
          </span>
          <p className="mt-2 text-3xl font-extrabold text-amber-950">
            {formatMoney(earnings.pendingMinor, earnings.currency)}
          </p>
          <p className="mt-1 text-xs text-amber-700">
            Held from recent enrolments (available in 5 days)
          </p>
        </div>
      </div>

      {/* Account Rules & Metadata */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
          Withdrawal Details
        </h4>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">Minimum Withdrawal Threshold</dt>
            {/* Must be read from API, never hardcoded */}
            <dd className="mt-1 font-semibold text-slate-800">
              {formatMoney(earnings.minimumWithdrawalMinor, earnings.currency)}
            </dd>
          </div>
          <div className="flex flex-col">
            <dt className="text-xs text-slate-500">Last Withdrawal</dt>
            <dd className="mt-1 font-semibold text-slate-800">
              {formattedLastWithdrawal}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
