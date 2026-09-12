import api from "@/lib/api/client";
import { CourseListResponse } from "@/lib/types/api";

/**
 * Fetches the list of published courses from the Bema Learn API.
 * Endpoint: GET /courses (Public, no auth)
 */
export async function fetchCourses(): Promise<CourseListResponse> {
  const response = await api.get<CourseListResponse>("/courses");
  return response.data;
}
