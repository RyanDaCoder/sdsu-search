"use client";

import { useMemo, useState, memo } from "react";
import type { SearchCourse } from "@/lib/search/types";
import { minToTimeLabel } from "@/lib/search/time";
import { useScheduleStore } from "@/lib/schedule/store";
import { useToastStore } from "@/lib/toast/store";
import CourseDetailsModal from "./CourseDetailsModal";

function CourseCard({ course }: { course: SearchCourse }) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const addSection = useScheduleStore((s) => s.addSection);
  const hasSection = useScheduleStore((s) => s.hasSection);
  const addToast = useToastStore((s) => s.addToast);

  const header = useMemo(() => {
    const code = `${course.subject} ${course.number}`;
    const title = course.title ?? "(Untitled)";
    const units = course.units ? `${course.units} unit(s)` : "";
    return { code, title, units };
  }, [course]);

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="font-semibold text-lg text-[#2C2C2C]">{header.code}</div>
            <button
              className="text-xs text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors"
              onClick={() => setShowDetails(true)}
            >
              Details
            </button>
          </div>
          <div className="text-sm text-[#404040] mb-2">{header.title}</div>
          {header.units && (
            <div className="text-xs text-[#737373] mb-2">{header.units}</div>
          )}
          {course.geCodes && course.geCodes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {course.geCodes.map((geCode) => (
                <span
                  key={geCode}
                  className="inline-block rounded-full bg-[#8B1538]/10 text-[#8B1538] px-2.5 py-1 text-xs font-medium border border-[#8B1538]/20"
                >
                  {geCode}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          className="text-sm text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors whitespace-nowrap"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Hide sections" : `Show sections (${course.sections.length})`}
        </button>
      </div>

      <CourseDetailsModal
        course={course}
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
      />

      {open && (
        <div className="mt-5 space-y-3 border-t border-[#E5E5E5] pt-4">
          {course.sections.map((s) => {
            const added = hasSection(s.id);

            return (
              <div key={s.id} className="rounded-md border border-[#E5E5E5] bg-[#F9F9F9] p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="text-sm font-semibold text-[#2C2C2C]">
                    Section {s.sectionCode ?? "?"}
                    <span className="text-[#737373] font-normal ml-1.5">
                      · {s.modality ?? "UNKNOWN"} · {s.status ?? "UNKNOWN"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation"
                    disabled={added}
                    onClick={() => {
                      const courseCode = `${course.subject} ${course.number}`;

                      const result = addSection({
                        sectionId: s.id,
                        courseCode,
                        courseTitle: course.title,
                        termCode: s.term?.code ?? null,
                        meetings: s.meetings ?? [],
                        section: s,
                      });

                      if (!result.ok) {
                        addToast(result.message, "error");
                        return;
                      }

                      addToast(`${courseCode} added to schedule`, "success");

                    }}
                  >
                    {added ? "Added" : "Add to Schedule"}
                  </button>
                </div>

                <div className="text-sm space-y-2.5">
                  <div className="text-[#525252]">
                    <span className="font-medium text-[#404040]">Term:</span> {s.term.name} ({s.term.code})
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[#737373] mb-1.5">Meetings</div>
                    <div className="space-y-1.5">
                      {s.meetings.map((m) => (
                        <div key={m.id} className="text-sm text-[#404040]">
                          {m.days} {minToTimeLabel(m.startMin)}–{minToTimeLabel(m.endMin)}
                          {m.location ? <span className="text-[#737373]"> · {m.location}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-[#737373] mb-1.5">Instructors</div>
                    <div className="text-sm text-[#404040]">
                      {s.instructors.length
                        ? s.instructors.map((x) => x.instructor.name).join(", ")
                        : "TBA"}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(CourseCard, (prevProps, nextProps) => {
  // Only re-render if course data actually changed
  return (
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.subject === nextProps.course.subject &&
    prevProps.course.number === nextProps.course.number &&
    prevProps.course.title === nextProps.course.title &&
    prevProps.course.units === nextProps.course.units &&
    prevProps.course.sections.length === nextProps.course.sections.length &&
    JSON.stringify(prevProps.course.geCodes) === JSON.stringify(nextProps.course.geCodes)
  );
});
