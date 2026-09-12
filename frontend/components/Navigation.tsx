"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth/authStore";
import { useSignOut } from "@/components/earnings/hooks";

export function Navigation() {
  const [mounted, setMounted] = useState(false);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const handleSignOut = useSignOut();
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-600 transition"
        >
          Bema Learn
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link
            href="/courses"
            className={`transition ${
              pathname === "/courses"
                ? "text-blue-600 font-semibold"
                : "text-slate-600 hover:text-blue-600"
            }`}
          >
            Courses
          </Link>

          {/* Only render auth-dependent nav items after client mounting to avoid hydration mismatch */}
          {mounted && (
            <>
              {token ? (
                <>
                  {/* When signed in: Show Earnings, hide Sign In */}
                  <Link
                    href="/earnings"
                    className={`transition ${
                      pathname === "/earnings"
                        ? "text-blue-600 font-semibold"
                        : "text-slate-600 hover:text-blue-600"
                    }`}
                  >
                    Earnings
                  </Link>

                  <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                    <span className="text-xs font-medium text-slate-700">
                      {user?.name || "Instructor"}
                    </span>
                    <button
                      onClick={handleSignOut}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                /* When signed out: Show Sign In */
                <Link
                  href="/login"
                  className={`transition ${
                    pathname === "/login"
                      ? "text-blue-600 font-semibold"
                      : "text-slate-600 hover:text-blue-600"
                  }`}
                >
                  Sign In
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
