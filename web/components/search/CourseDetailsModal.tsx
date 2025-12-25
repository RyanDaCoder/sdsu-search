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
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.units && (
                  <div className="text-[#404040]">
                    <span className="font-medium text-[#525252]">Units:</span> {course.units}
                  </div>
                )}
                <div className="text-[#404040]">
                  <span className="font-medium text-[#525252]">Course Code:</span> {course.subject} {course.number}
                </div>
              </div>
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
              {course.sections.map((section) => {
                // Calculate enrollment status
                const hasEnrollmentData = section.capacity != null && section.enrolled != null;
                const available = hasEnrollmentData ? section.capacity - section.enrolled : null;
                const isFull = hasEnrollmentData && available !== null && available <= 0;
                const isWaitlist = section.status === "WAITLIST" || (hasEnrollmentData && available !== null && available <= 0 && (section.waitlist ?? 0) > 0);
                const enrollmentPercent = hasEnrollmentData && section.capacity > 0 
                  ? Math.round((section.enrolled! / section.capacity) * 100) 
                  : null;

                // Status badge color
                const getStatusColor = () => {
                  if (section.status === "OPEN" && !isFull) return "bg-green-50 border-green-200 text-green-800";
                  if (section.status === "WAITLIST" || isWaitlist) return "bg-yellow-50 border-yellow-200 text-yellow-800";
                  if (section.status === "CLOSED" || isFull) return "bg-red-50 border-red-200 text-red-800";
                  return "bg-gray-50 border-gray-200 text-gray-800";
                };

                return (
                  <div key={section.id} className="border border-[#E5E5E5] rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-[#2C2C2C]">
                            Section {section.sectionCode ?? "?"}
                          </span>
                          {section.classNumber && (
                            <span className="text-xs text-[#737373] bg-[#F0F0F0] px-2 py-0.5 rounded">
                              Class #{section.classNumber}
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getStatusColor()}`}>
                            {section.status ?? "UNKNOWN"}
                          </span>
                          <span className="text-xs text-[#737373] bg-[#F0F0F0] px-2 py-0.5 rounded">
                            {section.modality ?? "UNKNOWN"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm space-y-2.5">
                      {/* Enrollment Information */}
                      {hasEnrollmentData && (
                        <div className="bg-[#F9F9F9] rounded-md p-3 border border-[#E5E5E5]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-[#525252]">Enrollment</span>
                            {enrollmentPercent !== null && (
                              <span className="text-xs font-medium text-[#737373]">
                                {enrollmentPercent}% full
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-[#404040]">
                            <div>
                              <span className="text-xs text-[#737373]">Enrolled:</span>{" "}
                              <span className="font-medium">{section.enrolled}</span>
                              {section.capacity != null && (
                                <span className="text-[#737373]"> / {section.capacity}</span>
                              )}
                            </div>
                            {available !== null && (
                              <div>
                                <span className="text-xs text-[#737373]">Available:</span>{" "}
                                <span className={`font-medium ${available > 0 ? "text-green-700" : "text-red-700"}`}>
                                  {available}
                                </span>
                              </div>
                            )}
                            {(section.waitlist ?? 0) > 0 && (
                              <div>
                                <span className="text-xs text-[#737373]">Waitlist:</span>{" "}
                                <span className="font-medium text-yellow-700">{section.waitlist}</span>
                              </div>
                            )}
                          </div>
                          {/* Enrollment progress bar */}
                          {enrollmentPercent !== null && (
                            <div className="mt-2 w-full bg-[#E5E5E5] rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  enrollmentPercent >= 100
                                    ? "bg-red-500"
                                    : enrollmentPercent >= 80
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{ width: `${Math.min(100, enrollmentPercent)}%` }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[#404040]">
                        <span className="font-medium text-[#525252]">Term:</span> {section.term.name} ({section.term.code})
                      </div>

                      {section.campus && (
                        <div className="text-[#404040]">
                          <span className="font-medium text-[#525252]">Campus:</span> {section.campus}
                        </div>
                      )}

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
                );
              })}
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

