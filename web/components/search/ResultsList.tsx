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
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
        <div className="inline-flex items-center gap-3 text-[#404040]">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-[#8B1538] border-t-transparent"></span>
          <span className="text-sm font-medium">Loading courses…</span>
        </div>
      </div>
    );
  }

  if (!isLoading && results.length === 0) {
    return (
      <div className="rounded-lg border border-[#E5E5E5] bg-white p-8 text-center shadow-sm">
        <div className="text-[#404040] mb-1 font-medium">No matches found</div>
        <div className="text-sm text-[#737373]">
          Try removing a filter or broadening your search criteria.
        </div>
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
