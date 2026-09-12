"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatMoney } from "@/lib/format";
import { Withdrawal } from "@/lib/types/api";
import { createWithdrawalSchema, WithdrawalFormValues } from "./schema";
import { useWithdrawalMutation } from "./hooks";

interface WithdrawalFormProps {
  availableMinor: number;
  minimumWithdrawalMinor: number;
  currency: string;
}

export function WithdrawalForm({
  availableMinor,
  minimumWithdrawalMinor,
  currency,
}: WithdrawalFormProps) {
  const [lastSuccess, setLastSuccess] = useState<Withdrawal | null>(null);
  const mutation = useWithdrawalMutation();

  // Requirement 2: minimumWithdrawalMinor is passed dynamically into the schema.
  const schema = createWithdrawalSchema(
    minimumWithdrawalMinor,
    availableMinor,
    currency
  );

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    formState: { errors },
  } = useForm<WithdrawalFormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
  });

  const onSubmit = (values: WithdrawalFormValues) => {
    setLastSuccess(null);

    // Convert standard Naira input (major units) to minor units for the API
    const amountMinor = Math.round(values.amount * 100);

    // Requirement 6: Generate payoutReference ONCE per submit attempt.
    const payoutReference = `wd_${crypto.randomUUID()}`;

    mutation.mutate(
      {
        amountMinor,
        payoutReference,
      },
      {
        onSuccess: (withdrawal) => {
          setLastSuccess(withdrawal);
          reset();
        },
        onError: (error) => {
          // Requirement 4: Server refusals must attach to the field, not a generic banner.
          const serverCode = error.response?.data?.code;
          const serverMessage = error.response?.data?.message;

          if (serverCode === "below_minimum") {
            setError("amount", {
              type: "server",
              message:
                serverMessage ||
                `Amount is below the minimum withdrawal (${formatMoney(minimumWithdrawalMinor, currency)}).`,
            });
            return;
          }

          if (serverCode === "insufficient_balance") {
            setError("amount", {
              type: "server",
              message:
                serverMessage ||
                `Amount exceeds your available balance (${formatMoney(availableMinor, currency)}).`,
            });
            return;
          }

          if (serverCode === "withdrawal_in_progress") {
            setError("amount", {
              type: "server",
              message:
                serverMessage ||
                "You already have a withdrawal in progress.",
            });
            return;
          }

          setError("amount", {
            type: "server",
            message:
              serverMessage ||
              "Withdrawal request could not be processed. Please try again.",
          });
        },
      }
    );
  };

  const handleWithdrawAll = () => {
    setValue("amount", availableMinor / 100, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Request Withdrawal
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter an amount between{" "}
            <strong className="text-slate-700">
              {formatMoney(minimumWithdrawalMinor, currency)}
            </strong>{" "}
            and{" "}
            <strong className="text-slate-700">
              {formatMoney(availableMinor, currency)}
            </strong>
            .
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            onClick={handleWithdrawAll}
            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            Max: {formatMoney(availableMinor, currency)}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {lastSuccess && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-900 space-y-1"
        >
          <div className="flex items-center gap-2 font-bold text-emerald-800">
            <svg
              className="h-4 w-4 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Withdrawal Request Submitted Successfully
          </div>
          <p>
            Reference:{" "}
            <code className="rounded bg-emerald-100 px-1 py-0.5 font-mono text-emerald-950">
              {lastSuccess.payoutReference}
            </code>{" "}
            — Amount:{" "}
            <strong>
              {formatMoney(lastSuccess.amountMinor, currency)}
            </strong>{" "}
            (Status: <em>{lastSuccess.status}</em>)
          </p>
        </div>
      )}

      {/* General Transport Error if server is unreachable */}
      {mutation.isError && !mutation.error.response && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700"
        >
          Server is unreachable. Please verify your connection or backend container status.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label
            htmlFor="amount"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Withdrawal Amount
          </label>

          <div className="relative rounded-lg shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
              <span className="text-slate-500 font-semibold text-sm">₦</span>
            </div>
            <input
              id="amount"
              type="number"
              step="0.01"
              disabled={mutation.isPending}
              placeholder="500.00"
              aria-invalid={errors.amount ? "true" : "false"}
              aria-describedby={errors.amount ? "amount-error" : undefined}
              className={`w-full rounded-lg border pl-8 pr-3.5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 ${
                errors.amount
                  ? "border-red-300 bg-red-50/20 text-red-900 focus:border-red-500 focus:ring-red-500/20"
                  : "border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500/20"
              }`}
              {...register("amount", {
                valueAsNumber: true,
              })}
            />
          </div>

          {/* Requirement 4: Server & Client errors attached directly to field */}
          {errors.amount && (
            <p
              id="amount-error"
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600"
            >
              {errors.amount.message}
            </p>
          )}

          <p className="mt-1.5 text-[11px] text-slate-400">
            Enter an amount between {formatMoney(minimumWithdrawalMinor, currency)} and {formatMoney(availableMinor, currency)}.
          </p>
        </div>

        {/* Submit Button with Double-Submit Prevention */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 transition"
          >
            {mutation.isPending ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Processing Withdrawal…
              </span>
            ) : (
              "Request Withdrawal"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
