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
              className="text-xs text-[#00685E] hover:text-[#004D45] underline font-medium transition-colors"
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
                  className="inline-block rounded-full bg-[#00685E]/10 text-[#00685E] px-2.5 py-1 text-xs font-medium border border-[#00685E]/20"
                >
                  {geCode}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          className="text-sm text-[#00685E] hover:text-[#004D45] underline font-medium transition-colors whitespace-nowrap"
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
                    className="rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 sm:px-3 sm:py-1.5 text-sm font-medium text-[#00685E] hover:bg-[#00685E] hover:text-white hover:border-[#00685E] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#00685E] transition-colors touch-manipulation"
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

// Helper function to compare sections deeply
function sectionsEqual(prev: SearchCourse["sections"], next: SearchCourse["sections"]): boolean {
  if (prev.length !== next.length) return false;
  
  // Create maps by section ID for efficient lookup (handles reordering)
  const prevMap = new Map(prev.map(s => [s.id, s]));
  const nextMap = new Map(next.map(s => [s.id, s]));
  
  // Check all sections exist in both
  if (prevMap.size !== nextMap.size) return false;
  
  for (const [sectionId, prevSection] of prevMap) {
    const nextSection = nextMap.get(sectionId);
    if (!nextSection) return false;
    
    // Compare section properties that are displayed or used in CourseCard/CourseDetailsModal
    if (
      prevSection.sectionCode !== nextSection.sectionCode ||
      prevSection.classNumber !== nextSection.classNumber ||
      prevSection.modality !== nextSection.modality ||
      prevSection.status !== nextSection.status ||
      prevSection.capacity !== nextSection.capacity ||
      prevSection.enrolled !== nextSection.enrolled ||
      prevSection.waitlist !== nextSection.waitlist ||
      prevSection.campus !== nextSection.campus ||
      prevSection.term?.code !== nextSection.term?.code ||
      prevSection.term?.name !== nextSection.term?.name
    ) {
      return false;
    }
    
    // Compare meetings (by ID, handles reordering)
    if (prevSection.meetings.length !== nextSection.meetings.length) return false;
    const prevMeetingsMap = new Map(prevSection.meetings.map(m => [m.id, m]));
    const nextMeetingsMap = new Map(nextSection.meetings.map(m => [m.id, m]));
    for (const [meetingId, prevMeeting] of prevMeetingsMap) {
      const nextMeeting = nextMeetingsMap.get(meetingId);
      if (!nextMeeting) return false;
      if (
        prevMeeting.days !== nextMeeting.days ||
        prevMeeting.startMin !== nextMeeting.startMin ||
        prevMeeting.endMin !== nextMeeting.endMin ||
        prevMeeting.location !== nextMeeting.location
      ) {
        return false;
      }
    }
    
    // Compare instructors (by ID, handles reordering)
    if (prevSection.instructors.length !== nextSection.instructors.length) return false;
    const prevInstMap = new Map(prevSection.instructors.map(i => [i.id, i]));
    const nextInstMap = new Map(nextSection.instructors.map(i => [i.id, i]));
    for (const [instId, prevInst] of prevInstMap) {
      const nextInst = nextInstMap.get(instId);
      if (!nextInst) return false;
      if (
        prevInst.instructor.id !== nextInst.instructor.id ||
        prevInst.instructor.name !== nextInst.instructor.name
      ) {
        return false;
      }
    }
  }
  
  return true;
}

// Memoize to prevent unnecessary re-renders when parent updates
export default memo(CourseCard, (prevProps, nextProps) => {
  // Only re-render if course data actually changed
  const courseEqual =
    prevProps.course.id === nextProps.course.id &&
    prevProps.course.subject === nextProps.course.subject &&
    prevProps.course.number === nextProps.course.number &&
    prevProps.course.title === nextProps.course.title &&
    prevProps.course.units === nextProps.course.units &&
    JSON.stringify(prevProps.course.geCodes) === JSON.stringify(nextProps.course.geCodes);
  
  // Deep compare sections to catch changes in section properties
  const sectionsEqualResult = sectionsEqual(prevProps.course.sections, nextProps.course.sections);
  
  // Return true if props are equal (skip re-render), false if different (re-render)
  return courseEqual && sectionsEqualResult;
});
