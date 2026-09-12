import api from "@/lib/api/client";
import { Earnings, Withdrawal } from "@/lib/types/api";

export interface CreateWithdrawalPayload {
  amountMinor: number;
  payoutReference: string;
}

/**
 * Fetches the instructor earnings from the Bema Learn API.
 * Endpoint: GET /me/earnings (Instructor only, Requires Bearer Token)
 *
 * Authorization header is attached automatically by the client interceptor.
 */
export async function fetchEarnings(): Promise<Earnings> {
  const response = await api.get<Earnings>("/me/earnings");
  return response.data;
}

/**
 * Requests a withdrawal for an instructor.
 * Endpoint: POST /me/withdrawals (Instructor only, Requires Bearer Token)
 *
 * Contract & Security requirements:
 * 1. `amountMinor` and `payoutReference` in request body.
 * 2. `payoutReference` ALSO attached as `Idempotency-Key` HTTP header.
 */
export async function createWithdrawal(
  payload: CreateWithdrawalPayload
): Promise<Withdrawal> {
  const response = await api.post<Withdrawal>("/me/withdrawals", payload, {
    headers: {
      "Idempotency-Key": payload.payoutReference,
    },
  });
  return response.data;
}
