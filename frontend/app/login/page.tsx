"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth/authStore";
import { LoginForm } from "@/components/auth/login/components/LoginForm";

export default function LoginPage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // If already signed in, redirect to earnings
    if (token) {
      router.replace("/earnings");
    }
  }, [token, router]);

  // If signed in, block access to the form and show redirection message
  if (token) {
    return (
      <div className="py-16 text-center space-y-3">
        <p className="text-sm font-medium text-slate-700">
          You are already signed in. Redirecting to your earnings…
        </p>
        <div>
          <Link
            href="/earnings"
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Click here if you are not redirected
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-4">
      <div className="text-center">
        <Link
          href="/courses"
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
        >
          ← Back to Courses
        </Link>
      </div>
      <LoginForm />
    </div>
  );
}
