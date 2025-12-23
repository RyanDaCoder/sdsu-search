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
}: {
  filters: SearchFilters;
  setFilters: (next: SearchFilters) => void;
}) {
  return (
    <aside className="rounded-lg border p-4">
      <div className="font-medium">Filters</div>

      {/* Term */}
      <div className="mt-4">
        <label className="text-sm opacity-70">Term code</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="e.g. 20251"
          value={filters.term ?? "20251"}
          onChange={(e) => setFilters({ ...filters, term: e.target.value || "20251" })}
        />
        <div className="text-xs opacity-60 mt-1">Default: 20251 (your seeded Spring 2026)</div>
      </div>

      {/* Keyword (q) */}
      <div className="mt-4">
        <label className="text-sm opacity-70">Keyword</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder='e.g. "algorithms", "writing", "film"'
          value={filters.q ?? ""}
          onChange={(e) => setFilters({ ...filters, q: e.target.value || undefined })}
        />
      </div>

      {/* Subject */}
      <div className="mt-4">
        <label className="text-sm opacity-70">Subject</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="e.g. CS, MATH, ENS"
          value={filters.subject ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, subject: e.target.value.toUpperCase() || undefined })
          }
        />
      </div>

      {/* Course number */}
      <div className="mt-4">
        <label className="text-sm opacity-70">Course number</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder="e.g. 210, 250"
          value={filters.number ?? ""}
          onChange={(e) => setFilters({ ...filters, number: e.target.value || undefined })}
        />
      </div>

      {/* Days */}
      <div className="mt-4">
        <div className="text-sm opacity-70">Days</div>
        <div className="mt-2 flex gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(filters.days ?? []).includes("MWF")}
              onChange={() => setFilters({ ...filters, days: toggleDay(filters.days, "MWF") })}
            />
            MWF
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={(filters.days ?? []).includes("TR")}
              onChange={() => setFilters({ ...filters, days: toggleDay(filters.days, "TR") })}
            />
            TR
          </label>
        </div>
      </div>

      {/* Time range -> timeStart/timeEnd (minutes) */}
      <div className="mt-4">
        <div className="text-sm opacity-70">Time range</div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs opacity-60">Start</label>
            <input
              type="time"
              className="mt-1 w-full rounded border px-2 py-2 text-sm"
              value={minToTimeInput(filters.timeStart)}
              onChange={(e) =>
                setFilters({ ...filters, timeStart: timeInputToMin(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="text-xs opacity-60">End</label>
            <input
              type="time"
              className="mt-1 w-full rounded border px-2 py-2 text-sm"
              value={minToTimeInput(filters.timeEnd)}
              onChange={(e) =>
                setFilters({ ...filters, timeEnd: timeInputToMin(e.target.value) })
              }
            />
          </div>
        </div>
        <div className="text-xs opacity-60 mt-2">
          Set only start or end if you only care about “not before” / “not after”.
        </div>
      </div>

      {/* Modality */}
      <div className="mt-4">
        <label className="text-sm opacity-70">Modality</label>
        <select
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
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
      <div className="mt-4">
        <label className="text-sm opacity-70">Instructor</label>
        <input
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          placeholder='e.g. "Palacios", "Smith"'
          value={filters.instructor ?? ""}
          onChange={(e) => setFilters({ ...filters, instructor: e.target.value || undefined })}
        />
      </div>

      {/* GE / Requirements */}
      <div className="mt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">GE / Requirements</div>
          {(filters.ge ?? []).length > 0 && (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, ge: undefined })}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear
            </button>
          )}
        </div>
        <div className="mt-2 space-y-2 text-sm max-h-64 overflow-y-auto">
          {GE_CODES.map((geCode) => (
            <label key={geCode} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={(filters.ge ?? []).includes(geCode)}
                onChange={() =>
                  setFilters({ ...filters, ge: toggleGe(filters.ge, geCode) })
                }
              />
              {geCode}
            </label>
          ))}
        </div>
        <div className="text-xs opacity-60 mt-2">
          Select multiple to find courses matching ANY selected requirement.
        </div>
      </div>
    </aside>
  );
}
