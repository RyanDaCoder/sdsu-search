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
    return <div className="rounded border p-4 text-sm">Loading courses…</div>;
  }

  if (!isLoading && results.length === 0) {
    return (
      <div className="rounded border p-4 text-sm">
        No matches. Try removing a filter or broadening your search.
      </div>
    );
  }
  console.log("DBG CourseCard:", CourseCard, typeof CourseCard);

  return (
    <div className="space-y-3">
      {results.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
