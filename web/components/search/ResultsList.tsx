"use client";

import type { SearchCourse } from "@/lib/search/types";
import CourseCard from "./CourseCard";
import CourseCardSkeleton from "./CourseCardSkeleton";

export default function ResultsList({
  isLoading,
  results,
}: {
  isLoading: boolean;
  results: SearchCourse[];
}) {
  // Show skeleton loaders when loading and no previous results
  if (isLoading && results.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CourseCardSkeleton key={`skeleton-${i}`} />
        ))}
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
      {/* Show skeleton loaders at the end when loading with existing results (pagination) */}
      {isLoading && (
        <>
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </>
      )}
    </div>
  );
}
