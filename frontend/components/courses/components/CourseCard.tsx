import { Course } from "@/lib/types/api";
import { formatMoney } from "@/lib/format";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  // Requirement 3: enrolmentCount is nullable.
  // null = not yet counted. Display as "—", NOT as 0.
  // 0 is a real measurement.
  const renderEnrolment = () => {
    if (course.enrolmentCount === null) {
      return (
        <span
          className="inline-flex items-center text-slate-400 font-medium"
          title="Enrolment not yet counted"
          aria-label="Enrolment count not yet counted"
        >
          —
        </span>
      );
    }
    return (
      <span className="font-semibold text-slate-700">
        {course.enrolmentCount} {course.enrolmentCount === 1 ? "learner" : "learners"}
      </span>
    );
  };

  // Requirement 3: averageRating is nullable.
  // null = no ratings yet. 0 would mean rated zero.
  const renderRating = () => {
    if (course.averageRating === null) {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500"
          title="No ratings yet"
          aria-label="No ratings yet"
        >
          No ratings yet
        </span>
      );
    }

    // Real measurement (including 0.0)
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/60"
        title={`Rated ${course.averageRating.toFixed(1)} out of 5`}
        aria-label={`Rating: ${course.averageRating.toFixed(1)} out of 5`}
      >
        <span aria-hidden="true" className="text-amber-500">★</span>
        {course.averageRating.toFixed(1)}
      </span>
    );
  };

  return (
    <article className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="space-y-3">
        {/* Badges / Header info */}
        <div className="flex items-center justify-between gap-2">
          {renderRating()}
          {!course.isPublished && (
            <span
              className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200"
              title="Contract note: Unpublished course (see Task 4)"
            >
              Unpublished
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {course.title}
        </h3>

        {/* Instructor */}
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-medium text-slate-600">
            {course.instructorName ? course.instructorName.charAt(0) : "I"}
          </div>
          <span className="truncate">{course.instructorName || "Unknown Instructor"}</span>
        </div>
      </div>

      {/* Footer: Metrics and Price */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-normal">Enrolment</span>
          <div className="text-sm text-slate-700">{renderEnrolment()}</div>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-xs text-slate-400 font-normal">Price</span>
          {/* Requirement 4: Money formatted strictly via lib/format.ts */}
          <span className="text-base font-bold text-slate-900">
            {formatMoney(course.priceMinor, course.currency)}
          </span>
        </div>
      </div>
    </article>
  );
}
