/**
 * Shared axios instance.
 *
 * The request interceptor is wired for you: it attaches the stored bearer
 * token. You should not need to set the Authorization header by hand anywhere
 * else in the app.
 *
 * The RESPONSE interceptor handles 401s by clearing stored auth, and
 * distinguishes transport/network failures from business/authorization refusals.
 */
import axios from "axios";
import { getStoredToken, useAuthStore } from "@/lib/auth/authStore";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.API_URL ??
  "http://localhost:8080/wp-json/bemalearn/v1";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor:
// 1. Distinguishes transport failure (error.response is undefined) from HTTP response.
// 2. Automatically handles 401 Unauthorized by wiping invalid/expired session from auth store.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Transport failure: server unreachable, network offline, DNS or CORS failure.
    // error.response is undefined here.
    if (!error.response) {
      return Promise.reject(error);
    }

    // Business / HTTP refusal
    const status = error.response.status;

    // Handle 401 Unauthorized: token expired or invalid
    if (status === 401) {
      if (typeof window !== "undefined") {
        // Clear stored token and user state so stale credentials are not retained
        useAuthStore.getState().signOut();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
