"use client";

import type { SearchCourse } from "@/lib/search/types";
import CourseCard from "./CourseCard";

export default function ResultsList({
  isLoading,
  results,
}: {
  isLoading: boolean;
  results: SearchCourse[];
}) {
  if (isLoading && results.length === 0) {
    return (
      <div className="rounded border p-4 text-sm">
        <div className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
          Loading courses…
        </div>
      </div>
    );
  }

  if (!isLoading && results.length === 0) {
    return (
      <div className="rounded border p-4 text-sm">
        No matches. Try removing a filter or broadening your search.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {results.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
