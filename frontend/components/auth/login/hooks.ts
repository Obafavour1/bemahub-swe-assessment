"use client";

import { useMutation } from "@tanstack/react-query";
import { login, LoginCredentials } from "./api";
import { LoginResponse } from "@/lib/types/api";
import { useAuthStore } from "@/lib/auth/authStore";
import { AxiosError } from "axios";

/**
 * Mutation hook for logging in.
 * Saves the returned token and user into useAuthStore on success.
 * Authorization header is NOT set manually; the axios request interceptor handles it.
 */
export function useLogin() {
  const signIn = useAuthStore((s) => s.signIn);

  return useMutation<LoginResponse, AxiosError<{ code?: string; message?: string }>, LoginCredentials>({
    mutationFn: login,
    onSuccess: (data) => {
      signIn(data.token, data.user);
    },
  });
}
