"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCourses } from "./api";
import { CourseListResponse } from "@/lib/types/api";

export const COURSES_QUERY_KEY = ["courses"] as const;

/**
 * Custom hook to fetch courses using TanStack React Query.
 *
 * Requirements addressed:
 * 1. Uses React Query (not useEffect + fetch).
 * 2. Respects `previewExpiresInSeconds`:
 *    - Data is kept fresh in cache for `previewExpiresInSeconds * 1000` (default 300s).
 *    - Once that interval elapses, React Query marks data as stale and automatically
 *      polls/refetches in the background using `refetchInterval`.
 */
export function useCourses() {
  return useQuery<CourseListResponse, Error>({
    queryKey: COURSES_QUERY_KEY,
    queryFn: fetchCourses,
    staleTime: (query) => {
      const ttl = query.state.data?.previewExpiresInSeconds;
      return ttl ? ttl * 1000 : 300 * 1000;
    },
    refetchInterval: (query) => {
      const ttl = query.state.data?.previewExpiresInSeconds;
      return ttl ? ttl * 1000 : false;
    },
  });
}
