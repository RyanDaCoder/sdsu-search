"use client";

import { useMemo, useState } from "react";
import type { SearchCourse } from "@/lib/search/types";
import { minToTimeLabel } from "@/lib/search/time";
import { useScheduleStore } from "@/lib/schedule/store";
import CourseDetailsModal from "./CourseDetailsModal";

export default function CourseCard({ course }: { course: SearchCourse }) {
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const addSection = useScheduleStore((s) => s.addSection);
  const hasSection = useScheduleStore((s) => s.hasSection);

  const header = useMemo(() => {
    const code = `${course.subject} ${course.number}`;
    const title = course.title ?? "(Untitled)";
    const units = course.units ? `${course.units} unit(s)` : "";
    return { code, title, units };
  }, [course]);

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="font-semibold">{header.code}</div>
            <button
              className="text-xs underline opacity-60 hover:opacity-100"
              onClick={() => setShowDetails(true)}
            >
              Details
            </button>
          </div>
          <div className="text-sm opacity-80">{header.title}</div>
          {header.units && <div className="text-xs opacity-60 mt-1">{header.units}</div>}
          {course.geCodes && course.geCodes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {course.geCodes.map((geCode) => (
                <span
                  key={geCode}
                  className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  {geCode}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          className="text-sm underline opacity-80 hover:opacity-100"
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
        <div className="mt-4 space-y-3">
          {course.sections.map((s) => {
            const added = hasSection(s.id);

            return (
              <div key={s.id} className="rounded border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">
                    Section {s.sectionCode ?? "?"}
                    <span className="opacity-60 font-normal">
                      {" "}
                      · {s.modality ?? "UNKNOWN"} · {s.status ?? "UNKNOWN"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="rounded border px-3 py-1 text-sm hover:bg-black/5 disabled:opacity-50 disabled:hover:bg-transparent"
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

                      if (!result.ok) return;

                    }}
                  >
                    {added ? "Added" : "Add to Schedule"}
                  </button>
                </div>

                <div className="mt-2 text-sm">
                  <div className="opacity-70">
                    Term: {s.term.name} ({s.term.code})
                  </div>

                  <div className="mt-2">
                    <div className="text-xs opacity-60">Meetings</div>
                    <div className="mt-1 space-y-1">
                      {s.meetings.map((m) => (
                        <div key={m.id} className="text-sm">
                          {m.days} {minToTimeLabel(m.startMin)}–{minToTimeLabel(m.endMin)}
                          {m.location ? <span className="opacity-60"> · {m.location}</span> : null}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-xs opacity-60">Instructors</div>
                    <div className="mt-1 text-sm">
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
