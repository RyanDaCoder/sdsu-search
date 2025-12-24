"use client";

import { memo } from "react";
import type { SearchCourse } from "@/lib/search/types";
import CourseCard from "./CourseCard";
import CourseCardSkeleton from "./CourseCardSkeleton";

function ResultsList({
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

// Helper function to compare courses deeply
function coursesEqual(prev: SearchCourse[], next: SearchCourse[]): boolean {
  if (prev.length !== next.length) return false;
  
  // Create maps by course ID for efficient lookup (handles reordering)
  const prevMap = new Map(prev.map(c => [c.id, c]));
  const nextMap = new Map(next.map(c => [c.id, c]));
  
  // Check all courses exist in both
  if (prevMap.size !== nextMap.size) return false;
  
  for (const [courseId, prevCourse] of prevMap) {
    const nextCourse = nextMap.get(courseId);
    if (!nextCourse) return false;
    
    // Compare all course properties that could change
    if (
      prevCourse.subject !== nextCourse.subject ||
      prevCourse.number !== nextCourse.number ||
      prevCourse.title !== nextCourse.title ||
      prevCourse.units !== nextCourse.units ||
      JSON.stringify(prevCourse.geCodes) !== JSON.stringify(nextCourse.geCodes) ||
      prevCourse.sections.length !== nextCourse.sections.length
    ) {
      return false;
    }
    
    // Compare section IDs (sections could be reordered, so compare as sets)
    const prevSectionIds = new Set(prevCourse.sections.map(s => s.id));
    const nextSectionIds = new Set(nextCourse.sections.map(s => s.id));
    if (prevSectionIds.size !== nextSectionIds.size) return false;
    for (const id of prevSectionIds) {
      if (!nextSectionIds.has(id)) return false;
    }
  }
  
  return true;
}

// Memoize to prevent re-renders when parent state changes but results are the same
export default memo(ResultsList, (prevProps, nextProps) => {
  // Only re-render if loading state or results actually changed
  if (prevProps.isLoading !== nextProps.isLoading) return false;
  
  // Deep compare course data, not just IDs
  const coursesEqualResult = coursesEqual(prevProps.results, nextProps.results);
  
  // Return true if props are equal (skip re-render), false if different (re-render)
  return coursesEqualResult;
});
