"use client";

import { Fragment } from "react";
import type { SearchCourse } from "@/lib/search/types";
import { minToTimeLabel } from "@/lib/search/time";

type CourseDetailsModalProps = {
  course: SearchCourse | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function CourseDetailsModal({ course, isOpen, onClose }: CourseDetailsModalProps) {
  if (!isOpen || !course) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl m-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              {course.subject} {course.number}
            </h2>
            <p className="text-sm opacity-70 mt-1">{course.title ?? "(Untitled)"}</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none opacity-60 hover:opacity-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Basic Info */}
          <div>
            <h3 className="font-medium mb-2">Course Information</h3>
            <div className="space-y-1 text-sm">
              {course.units && (
                <div>
                  <span className="opacity-60">Units:</span> {course.units}
                </div>
              )}
              {course.geCodes && course.geCodes.length > 0 && (
                <div>
                  <span className="opacity-60">GE Requirements:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {course.geCodes.map((geCode) => (
                      <span
                        key={geCode}
                        className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                      >
                        {geCode}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-medium mb-2">Sections ({course.sections.length})</h3>
            <div className="space-y-3">
              {course.sections.map((section) => (
                <div key={section.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-medium">Section {section.sectionCode ?? "?"}</span>
                      <span className="text-sm opacity-60 ml-2">
                        · {section.modality ?? "UNKNOWN"} · {section.status ?? "UNKNOWN"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm space-y-2">
                    <div>
                      <span className="opacity-60">Term:</span> {section.term.name} ({section.term.code})
                    </div>

                    {section.meetings && section.meetings.length > 0 ? (
                      <div>
                        <span className="opacity-60">Meetings:</span>
                        <div className="mt-1 space-y-1">
                          {section.meetings.map((m) => (
                            <div key={m.id} className="pl-2">
                              {m.days || "TBA"} {m.startMin != null && m.endMin != null
                                ? `${minToTimeLabel(m.startMin)}–${minToTimeLabel(m.endMin)}`
                                : ""}
                              {m.location && <span className="opacity-60"> · {m.location}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="opacity-60">No scheduled meetings</div>
                    )}

                    {section.instructors && section.instructors.length > 0 && (
                      <div>
                        <span className="opacity-60">Instructors:</span>{" "}
                        {section.instructors.map((x) => x.instructor.name).join(", ")}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={onClose}
            className="w-full rounded border px-4 py-2 text-sm hover:bg-black/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

