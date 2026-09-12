import api from "@/lib/api/client";
import { LoginResponse } from "@/lib/types/api";

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Signs in a user against the Bema Learn API.
 * Endpoint: POST /auth/login (Public)
 */
export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>("/auth/login", credentials);
  return response.data;
}
