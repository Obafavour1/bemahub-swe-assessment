"use client";

import { useCourses } from "@/components/courses/hook";
import { CourseGrid } from "@/components/courses/components/CourseGrid";
import { StatusMessage } from "@/components/StatusMessage";

export default function CoursesPage() {
  const { data, isLoading, isError, error, refetch, isFetching } = useCourses();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Available Courses
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Browse our curated baking and pastry courses taught by experienced instructors.
          </p>
        </div>

        {/* Refresh button / Cache indicator */}
        <div className="flex items-center gap-3">
          {data?.previewExpiresInSeconds && (
            <span
              className="text-xs text-slate-400"
              title={`Cache refreshes every ${data.previewExpiresInSeconds}s`}
            >
              TTL: {data.previewExpiresInSeconds}s
            </span>
          )}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            aria-label="Refresh course listings"
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Distinct States */}
      {/* 1. Loading State */}
      {isLoading && (
        <div className="py-8">
          <StatusMessage state="loading" message="Loading available courses…" />
        </div>
      )}

      {/* 2. Error State */}
      {isError && !isLoading && (
        <div className="py-8 space-y-4">
          <StatusMessage
            state="error"
            message={error?.message || "Failed to load courses. Please check your connection."}
          />
          <div className="text-center">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Retry Request
            </button>
          </div>
        </div>
      )}

      {/* 3. Empty State */}
      {!isLoading && !isError && (!data?.courses || data.courses.length === 0) && (
        <div className="py-8">
          <StatusMessage
            state="empty"
            message="No courses are currently available. Please check back later."
          />
        </div>
      )}

      {/* 4. Populated State */}
      {!isLoading && !isError && data?.courses && data.courses.length > 0 && (
        <CourseGrid courses={data.courses} />
      )}
    </div>
  );
}
