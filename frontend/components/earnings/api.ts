import api from "@/lib/api/client";
import { Earnings } from "@/lib/types/api";

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
