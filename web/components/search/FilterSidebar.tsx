"use client";

import { useEffect, useMemo } from "react";
import type { RefObject } from "react";
import useSWR from "swr";
import type { SearchFilters, DaysKey } from "@/lib/search/types";
import { minToTimeInput, timeInputToMin } from "@/lib/search/time";

function toggleDay(days: DaysKey[] | undefined, day: DaysKey): DaysKey[] {
  const set = new Set(days ?? []);
  if (set.has(day)) set.delete(day);
  else set.add(day);
  return Array.from(set);
}

function toggleGe(geCodes: string[] | undefined, geCode: string): string[] {
  const set = new Set(geCodes ?? []);
  if (set.has(geCode)) set.delete(geCode);
  else set.add(geCode);
  return Array.from(set);
}

type RequirementsResponse = {
  term: string;
  requirements: Array<{
    code: string;
    name: string;
    description?: string | null;
  }>;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FilterSidebar({
  filters,
  setFilters,
  onClose,
  keywordInputRef,
}: {
  filters: SearchFilters;
  setFilters: (next: SearchFilters) => void;
  onClose?: () => void;
  keywordInputRef?: RefObject<HTMLInputElement | null>;
}) {
  // Fetch requirements for the current term
  const termCode = filters.term ?? "20251";
  const { data: requirementsData, error: requirementsError, isLoading: requirementsLoading } = useSWR<RequirementsResponse>(
    `/api/requirements?term=${encodeURIComponent(termCode)}`,
    fetcher,
    {
      keepPreviousData: true,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  // Extract requirement codes from the API response
  const availableRequirements = useMemo(() => {
    if (!requirementsData?.requirements) return [];
    return requirementsData.requirements.map((r) => r.code);
  }, [requirementsData]);

  // Handle Esc key to close drawer
  useEffect(() => {
    if (!onClose) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <aside className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm lg:shadow-sm" aria-label="Search filters">
      {onClose && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E5E5]">
          <div className="font-semibold text-lg text-[#2C2C2C]">Filters</div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#2C2C2C] transition-colors p-1 lg:hidden touch-manipulation"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {!onClose && <h2 className="font-semibold text-lg text-[#2C2C2C] mb-6">Filters</h2>}

      {/* Term */}
      <div className="mb-5">
        <label htmlFor="filter-term" className="block text-sm font-medium text-[#404040] mb-1.5">
          Term code
        </label>
        <input
          id="filter-term"
          type="text"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. GROSSMONT_2026SP"
          value={filters.term ?? "GROSSMONT_2026SP"}
          onChange={(e) => setFilters({ ...filters, term: e.target.value || "GROSSMONT_2026SP" })}
          aria-describedby="term-help"
        />
        <div id="term-help" className="text-xs text-[#737373] mt-1.5">Default: GROSSMONT_2026SP (Spring 2026)</div>
      </div>

      {/* Keyword (q) */}
      <div className="mb-5">
        <label htmlFor="filter-keyword" className="block text-sm font-medium text-[#404040] mb-1.5">
          Keyword
        </label>
        <input
          id="filter-keyword"
          ref={keywordInputRef}
          type="search"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder='e.g. "algorithms", "writing", "film"'
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
          aria-describedby="keyword-hint"
        />
        <div id="keyword-hint" className="sr-only">Press "/" to focus this field</div>
      </div>

      {/* Subject */}
      <div className="mb-5">
        <label htmlFor="filter-subject" className="block text-sm font-medium text-[#404040] mb-1.5">
          Subject
        </label>
        <input
          id="filter-subject"
          type="text"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. CS, MATH, ENS"
          value={filters.subject ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, subject: e.target.value.toUpperCase() || undefined })
          }
        />
      </div>

      {/* Course number */}
      <div className="mb-5">
        <label htmlFor="filter-number" className="block text-sm font-medium text-[#404040] mb-1.5">
          Course number
        </label>
        <input
          id="filter-number"
          type="text"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. 210, 250"
          value={filters.number ?? ""}
          onChange={(e) => setFilters({ ...filters, number: e.target.value || undefined })}
        />
      </div>

      {/* Days */}
      <div className="mb-5">
        <fieldset>
          <legend className="text-sm font-medium text-[#404040] mb-2">Days</legend>
          <div className="flex flex-wrap gap-3 text-sm" role="group" aria-label="Select day combinations">
            {[
              { key: "MWF" as DaysKey, label: "Mon/Wed/Fri" },
              { key: "TR" as DaysKey, label: "Tue/Thu" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                  checked={(filters.days ?? []).includes(key)}
                  onChange={() => setFilters({ ...filters, days: toggleDay(filters.days, key) })}
                  aria-label={label}
                />
                <span className="text-[#171717] group-hover:text-[#00685E] transition-colors whitespace-nowrap">
                  {label}
                </span>
              </label>
            ))}
          </div>
          <div className="text-xs text-[#737373] mt-2" role="note">
            Select one or both options. Multiple selections will find courses matching any selected option.
          </div>
        </fieldset>
      </div>

      {/* Time range -> timeStart/timeEnd (minutes) */}
      <div className="mb-5">
        <fieldset>
          <legend className="text-sm font-medium text-[#404040] mb-2">Time range</legend>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-time-start" className="block text-xs text-[#737373] mb-1.5">
                Start
              </label>
              <input
                id="filter-time-start"
                type="time"
                className="w-full rounded-md border border-[#D4D4D4] px-2 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
                value={minToTimeInput(filters.timeStart)}
                onChange={(e) =>
                  setFilters({ ...filters, timeStart: timeInputToMin(e.target.value) })
                }
                aria-label="Start time"
              />
            </div>
            <div>
              <label htmlFor="filter-time-end" className="block text-xs text-[#737373] mb-1.5">
                End
              </label>
              <input
                id="filter-time-end"
                type="time"
                className="w-full rounded-md border border-[#D4D4D4] px-2 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
                value={minToTimeInput(filters.timeEnd)}
                onChange={(e) =>
                  setFilters({ ...filters, timeEnd: timeInputToMin(e.target.value) })
                }
                aria-label="End time"
              />
            </div>
          </div>
          <div className="text-xs text-[#737373] mt-2" role="note">
            Set only start or end if you only care about "not before" / "not after".
          </div>
        </fieldset>
      </div>

      {/* Modality */}
      <div className="mb-5">
        <label htmlFor="filter-modality" className="block text-sm font-medium text-[#404040] mb-1.5">
          Modality
        </label>
        <select
          id="filter-modality"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors cursor-pointer touch-manipulation"
          value={filters.modality ?? ""}
          onChange={(e) => setFilters({ ...filters, modality: e.target.value || undefined })}
        >
          <option value="">Any</option>
          <option value="IN_PERSON">In-person</option>
          <option value="ONLINE_SYNC">Online (sync)</option>
          <option value="ONLINE_ASYNC">Online (async)</option>
          <option value="HYBRID">Hybrid</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
      </div>

      {/* Instructor */}
      <div className="mb-5">
        <label htmlFor="filter-instructor" className="block text-sm font-medium text-[#404040] mb-1.5">
          Instructor
        </label>
        <input
          id="filter-instructor"
          type="text"
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder='e.g. "Palacios", "Smith"'
          value={filters.instructor ?? ""}
          onChange={(e) => setFilters({ ...filters, instructor: e.target.value || undefined })}
        />
      </div>

      {/* Open Seats Only */}
      <div className="mb-5">
        <fieldset>
          <legend className="text-sm font-medium text-[#404040] mb-2">Availability</legend>
          <label className="flex items-center gap-2 cursor-pointer group text-sm">
            <input
              type="checkbox"
              className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
              checked={filters.openSeatsOnly ?? false}
              onChange={(e) => setFilters({ ...filters, openSeatsOnly: e.target.checked || undefined })}
              aria-label="Show only sections with open seats"
            />
            <span className="text-[#171717] group-hover:text-[#00685E] transition-colors">
              Show only sections with open seats
            </span>
          </label>
          <div className="text-xs text-[#737373] mt-2" role="note">
            Only show sections where capacity - enrolled &gt; 0
          </div>
        </fieldset>
      </div>

      {/* GE / Requirements */}
      <div className="mb-5">
        <fieldset>
          <div className="flex items-center justify-between mb-2">
            <legend className="text-sm font-medium text-[#404040]">GE / Requirements</legend>
            {(filters.ge ?? []).length > 0 && (
              <button
                type="button"
                onClick={() => setFilters({ ...filters, ge: undefined })}
                className="text-xs text-[#00685E] hover:text-[#004D45] underline font-medium transition-colors touch-manipulation"
                aria-label="Clear all GE requirements"
              >
                Clear
              </button>
            )}
          </div>
          {requirementsLoading && (
            <div className="text-xs text-[#737373] py-2">Loading requirements...</div>
          )}
          {requirementsError && (
            <div className="text-xs text-red-600 py-2">
              Failed to load requirements. Showing empty list.
            </div>
          )}
          {!requirementsLoading && !requirementsError && availableRequirements.length === 0 && (
            <div className="text-xs text-[#737373] py-2">
              No requirements available for this term.
            </div>
          )}
          {!requirementsLoading && availableRequirements.length > 0 && (
            <>
              <div className="space-y-2 text-sm max-h-64 overflow-y-auto pr-1" role="group" aria-label="GE requirements">
                {availableRequirements.map((geCode) => {
                  const requirement = requirementsData?.requirements.find((r) => r.code === geCode);
                  const displayName = requirement?.name || geCode;
                  return (
                    <label key={geCode} className="flex items-center gap-2 cursor-pointer group py-0.5">
                      <input
                        type="checkbox"
                        className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#00685E] focus:ring-2 focus:ring-[#00685E]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                        checked={(filters.ge ?? []).includes(geCode)}
                        onChange={() =>
                          setFilters({ ...filters, ge: toggleGe(filters.ge, geCode) })
                        }
                        aria-label={`Select ${displayName}`}
                      />
                      <span className="text-[#171717] group-hover:text-[#00685E] transition-colors" title={requirement?.description || undefined}>
                        {displayName}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="text-xs text-[#737373] mt-2" role="note">
                Select multiple to find courses matching ANY selected requirement.
              </div>
            </>
          )}
        </fieldset>
      </div>
    </aside>
  );
}
