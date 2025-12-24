"use client";

import { useEffect, useRef } from "react";
import type { SearchCourse } from "@/lib/search/types";
import { minToTimeLabel } from "@/lib/search/time";

type CourseDetailsModalProps = {
  course: SearchCourse | null;
  isOpen: boolean;
  onClose: () => void;
};

export default function CourseDetailsModal({ course, isOpen, onClose }: CourseDetailsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen || !course) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus the close button when modal opens
    closeButtonRef.current?.focus();

    // Handle Esc key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }

      // Trap focus within modal
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Restore focus when modal closes
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement.current?.focus();
    };
  }, [isOpen, course, onClose]);

  if (!isOpen || !course) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-details-title"
      aria-describedby="course-details-description"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-2xl m-4 border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#E5E5E5] p-5 flex items-start justify-between z-10">
          <div>
            <h2 id="course-details-title" className="text-2xl font-semibold text-[#2C2C2C]">
              {course.subject} {course.number}
            </h2>
            <p id="course-details-description" className="text-sm text-[#525252] mt-1.5">
              {course.title ?? "(Untitled)"}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="text-2xl leading-none text-[#737373] hover:text-[#2C2C2C] transition-colors p-1 touch-manipulation"
            aria-label="Close course details"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-[#2C2C2C] mb-3">Course Information</h3>
            <div className="space-y-2 text-sm">
              {course.units && (
                <div className="text-[#404040]">
                  <span className="font-medium text-[#525252]">Units:</span> {course.units}
                </div>
              )}
              {course.geCodes && course.geCodes.length > 0 && (
                <div>
                  <span className="font-medium text-[#525252]">GE Requirements:</span>
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
                </div>
              )}
            </div>
          </div>

          {/* Sections */}
          <div>
            <h3 className="font-semibold text-[#2C2C2C] mb-3">Sections ({course.sections.length})</h3>
            <div className="space-y-3">
              {course.sections.map((section) => (
                <div key={section.id} className="border border-[#E5E5E5] rounded-lg bg-[#F9F9F9] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="font-semibold text-[#2C2C2C]">Section {section.sectionCode ?? "?"}</span>
                      <span className="text-sm text-[#737373] ml-2">
                        · {section.modality ?? "UNKNOWN"} · {section.status ?? "UNKNOWN"}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm space-y-2.5">
                    <div className="text-[#404040]">
                      <span className="font-medium text-[#525252]">Term:</span> {section.term.name} ({section.term.code})
                    </div>

                    {section.meetings && section.meetings.length > 0 ? (
                      <div>
                        <span className="font-medium text-[#525252]">Meetings:</span>
                        <div className="mt-1.5 space-y-1.5">
                          {section.meetings.map((m) => (
                            <div key={m.id} className="pl-2 text-[#404040]">
                              {m.days || "TBA"} {m.startMin != null && m.endMin != null
                                ? `${minToTimeLabel(m.startMin)}–${minToTimeLabel(m.endMin)}`
                                : ""}
                              {m.location && <span className="text-[#737373]"> · {m.location}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[#737373]">No scheduled meetings</div>
                    )}

                    {section.instructors && section.instructors.length > 0 && (
                      <div className="text-[#404040]">
                        <span className="font-medium text-[#525252]">Instructors:</span>{" "}
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
        <div className="sticky bottom-0 bg-white border-t border-[#E5E5E5] p-4">
          <button
            onClick={onClose}
            className="w-full rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

