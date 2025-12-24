"use client";

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

// SDSU-like GE codes (matching seed data)
const GE_CODES = [
  "GE-I-ORAL",
  "GE-I-WRITTEN",
  "GE-I-CRIT",
  "GE-IIA-PHYS",
  "GE-IIA-LIFE",
  "GE-IIA-LAB",
  "GE-IIA-MATH",
  "GE-IIB",
  "GE-IIC-ARTS",
  "GE-IIC-HUM",
  "GE-III",
  "GE-IVA",
  "GE-IVB",
  "GE-IVC",
  "GE-IV-CULTDIV",
  "GE-V-ETHNIC",
];

export default function FilterSidebar({
  filters,
  setFilters,
  onClose,
}: {
  filters: SearchFilters;
  setFilters: (next: SearchFilters) => void;
  onClose?: () => void;
}) {
  return (
    <aside className="rounded-lg border border-[#E5E5E5] bg-white p-5 shadow-sm lg:shadow-sm">
      {onClose && (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E5E5E5]">
          <div className="font-semibold text-lg text-[#2C2C2C]">Filters</div>
          <button
            onClick={onClose}
            className="text-[#737373] hover:text-[#2C2C2C] transition-colors p-1 lg:hidden"
            aria-label="Close filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
      {!onClose && <div className="font-semibold text-lg text-[#2C2C2C] mb-6">Filters</div>}

      {/* Term */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Term code</label>
        <input
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. 20251"
          value={filters.term ?? "20251"}
          onChange={(e) => setFilters({ ...filters, term: e.target.value || "20251" })}
        />
        <div className="text-xs text-[#737373] mt-1.5">Default: 20251 (Spring 2026)</div>
      </div>

      {/* Keyword (q) */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Keyword</label>
        <input
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder='e.g. "algorithms", "writing", "film"'
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
        />
      </div>

      {/* Subject */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Subject</label>
        <input
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. CS, MATH, ENS"
          value={filters.subject ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, subject: e.target.value.toUpperCase() || undefined })
          }
        />
      </div>

      {/* Course number */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Course number</label>
        <input
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder="e.g. 210, 250"
          value={filters.number ?? ""}
          onChange={(e) => setFilters({ ...filters, number: e.target.value || undefined })}
        />
      </div>

      {/* Days */}
      <div className="mb-5">
        <div className="text-sm font-medium text-[#404040] mb-2">Days</div>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
              checked={(filters.days ?? []).includes("MWF")}
              onChange={() => setFilters({ ...filters, days: toggleDay(filters.days, "MWF") })}
            />
            <span className="text-[#171717] group-hover:text-[#8B1538] transition-colors">MWF</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
              checked={(filters.days ?? []).includes("TR")}
              onChange={() => setFilters({ ...filters, days: toggleDay(filters.days, "TR") })}
            />
            <span className="text-[#171717] group-hover:text-[#8B1538] transition-colors">TR</span>
          </label>
        </div>
      </div>

      {/* Time range -> timeStart/timeEnd (minutes) */}
      <div className="mb-5">
        <div className="text-sm font-medium text-[#404040] mb-2">Time range</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#737373] mb-1.5">Start</label>
            <input
              type="time"
              className="w-full rounded-md border border-[#D4D4D4] px-2 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
              value={minToTimeInput(filters.timeStart)}
              onChange={(e) =>
                setFilters({ ...filters, timeStart: timeInputToMin(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-xs text-[#737373] mb-1.5">End</label>
            <input
              type="time"
              className="w-full rounded-md border border-[#D4D4D4] px-2 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
              value={minToTimeInput(filters.timeEnd)}
              onChange={(e) =>
                setFilters({ ...filters, timeEnd: timeInputToMin(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="text-xs text-[#737373] mt-2">
          Set only start or end if you only care about "not before" / "not after".
        </div>
      </div>

      {/* Modality */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Modality</label>
        <select
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors cursor-pointer touch-manipulation"
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
        <label className="block text-sm font-medium text-[#404040] mb-1.5">Instructor</label>
        <input
          className="w-full rounded-md border border-[#D4D4D4] px-3 py-2.5 sm:py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
          placeholder='e.g. "Palacios", "Smith"'
          value={filters.instructor ?? ""}
          onChange={(e) => setFilters({ ...filters, instructor: e.target.value || undefined })}
        />
      </div>

      {/* GE / Requirements */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-[#404040]">GE / Requirements</div>
          {(filters.ge ?? []).length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, ge: undefined })}
              className="text-xs text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-2 text-sm max-h-64 overflow-y-auto pr-1">
          {GE_CODES.map((geCode) => (
            <label key={geCode} className="flex items-center gap-2 cursor-pointer group py-0.5">
              <input
                type="checkbox"
                className="w-5 h-5 sm:w-4 sm:h-4 rounded border-[#D4D4D4] text-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:ring-offset-0 cursor-pointer touch-manipulation"
                checked={(filters.ge ?? []).includes(geCode)}
                onChange={() =>
                  setFilters({ ...filters, ge: toggleGe(filters.ge, geCode) })
                }
              />
              <span className="text-[#171717] group-hover:text-[#8B1538] transition-colors">{geCode}</span>
            </label>
          ))}
        </div>
        <div className="text-xs text-[#737373] mt-2">
          Select multiple to find courses matching ANY selected requirement.
        </div>
      </div>
    </aside>
  );
}
