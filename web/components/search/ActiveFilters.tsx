"use client";

import type { SearchFilters } from "@/lib/search/types";
import { minToTimeLabel } from "@/lib/search/time";

type ActiveFilter = {
  id: string;
  label: string;
  onRemove: () => void;
};

type ActiveFiltersProps = {
  filters: SearchFilters;
  setFilters: (next: SearchFilters) => void;
};

export default function ActiveFilters({ filters, setFilters }: ActiveFiltersProps) {
  const activeFilters: ActiveFilter[] = [];

  // Keyword
  if (filters.q) {
    activeFilters.push({
      id: "q",
      label: `Keyword: "${filters.q}"`,
      onRemove: () => setFilters({ ...filters, q: undefined }),
    });
  }

  // Subject
  if (filters.subject) {
    activeFilters.push({
      id: "subject",
      label: `Subject: ${filters.subject}`,
      onRemove: () => setFilters({ ...filters, subject: undefined }),
    });
  }

  // Course number
  if (filters.number) {
    activeFilters.push({
      id: "number",
      label: `Course: ${filters.number}`,
      onRemove: () => setFilters({ ...filters, number: undefined }),
    });
  }

  // Days
  if (filters.days && filters.days.length > 0) {
    const dayLabels: Record<string, string> = {
      MWF: "Mon/Wed/Fri",
      TR: "Tue/Thu",
    };
    
    filters.days.forEach((day) => {
      activeFilters.push({
        id: `days-${day}`,
        label: `Days: ${dayLabels[day] || day}`,
        onRemove: () => {
          const newDays = filters.days?.filter((d) => d !== day);
          setFilters({ ...filters, days: newDays && newDays.length > 0 ? newDays : undefined });
        },
      });
    });
  }

  // Time range
  if (filters.timeStart !== undefined && filters.timeStart !== null) {
    activeFilters.push({
      id: "timeStart",
      label: `After: ${minToTimeLabel(filters.timeStart)}`,
      onRemove: () => setFilters({ ...filters, timeStart: undefined }),
    });
  }

  if (filters.timeEnd !== undefined && filters.timeEnd !== null) {
    activeFilters.push({
      id: "timeEnd",
      label: `Before: ${minToTimeLabel(filters.timeEnd)}`,
      onRemove: () => setFilters({ ...filters, timeEnd: undefined }),
    });
  }

  // Modality
  if (filters.modality) {
    const modalityLabels: Record<string, string> = {
      IN_PERSON: "In-person",
      ONLINE_SYNC: "Online (sync)",
      ONLINE_ASYNC: "Online (async)",
      HYBRID: "Hybrid",
      UNKNOWN: "Unknown",
    };
    activeFilters.push({
      id: "modality",
      label: `Modality: ${modalityLabels[filters.modality] || filters.modality}`,
      onRemove: () => setFilters({ ...filters, modality: undefined }),
    });
  }

  // Instructor
  if (filters.instructor) {
    activeFilters.push({
      id: "instructor",
      label: `Instructor: ${filters.instructor}`,
      onRemove: () => setFilters({ ...filters, instructor: undefined }),
    });
  }

  // GE Requirements
  if (filters.ge && filters.ge.length > 0) {
    filters.ge.forEach((geCode) => {
      activeFilters.push({
        id: `ge-${geCode}`,
        label: `GE: ${geCode}`,
        onRemove: () => {
          const newGe = filters.ge?.filter((g) => g !== geCode);
          setFilters({ ...filters, ge: newGe && newGe.length > 0 ? newGe : undefined });
        },
      });
    });
  }

  // Don't show term filter if it's the default
  if (filters.term && filters.term !== "20251") {
    activeFilters.push({
      id: "term",
      label: `Term: ${filters.term}`,
      onRemove: () => setFilters({ ...filters, term: "20251" }),
    });
  }

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-[#404040]">
          Active filters ({activeFilters.length})
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {activeFilters.map((filter) => (
          <button
            key={filter.id}
            onClick={filter.onRemove}
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#8B1538]/10 text-[#8B1538] px-3 py-1.5 text-xs font-medium border border-[#8B1538]/20 hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors touch-manipulation"
            aria-label={`Remove filter: ${filter.label}`}
          >
            <span>{filter.label}</span>
            <svg
              className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}

