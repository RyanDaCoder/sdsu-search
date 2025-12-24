"use client";

export default function CourseCardSkeleton() {
  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            {/* Course code skeleton */}
            <div className="h-6 w-24 bg-[#E5E5E5] rounded"></div>
            {/* Details link skeleton */}
            <div className="h-4 w-12 bg-[#E5E5E5] rounded"></div>
          </div>
          {/* Title skeleton */}
          <div className="h-4 w-full max-w-md bg-[#E5E5E5] rounded mb-2"></div>
          {/* Units skeleton */}
          <div className="h-3 w-20 bg-[#E5E5E5] rounded mb-2"></div>
          {/* GE badges skeleton */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <div className="h-5 w-16 bg-[#E5E5E5] rounded-full"></div>
            <div className="h-5 w-20 bg-[#E5E5E5] rounded-full"></div>
          </div>
        </div>
        {/* Show sections button skeleton */}
        <div className="h-5 w-32 bg-[#E5E5E5] rounded"></div>
      </div>
    </div>
  );
}

