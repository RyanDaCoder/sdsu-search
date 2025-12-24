"use client";

import type { ScheduleItem } from "@/lib/schedule/types";
import { minToTimeLabel } from "@/lib/search/time";
import { useScheduleStore } from "@/lib/schedule/store";

const DAYS: { key: string; label: string }[] = [
  { key: "M", label: "Mon" },
  { key: "T", label: "Tue" },
  { key: "W", label: "Wed" },
  { key: "R", label: "Thu" },
  { key: "F", label: "Fri" },
];

// 8:00–20:00
const START_MIN = 8 * 60;
const END_MIN = 20 * 60;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function splitDays(days: string | null | undefined) {
  return (days ?? "").split("").filter((d) => ["M", "T", "W", "R", "F"].includes(d));
}

export function WeeklyGrid({ items }: { items: ScheduleItem[] }) {
  const getConflicts = useScheduleStore((s) => s.getConflicts);

  // flatten meetings into blocks per-day
  const blocks = items.flatMap((it) =>
    (it.meetings ?? []).flatMap((m) => {
      const start = m.startMin ?? null;
      const end = m.endMin ?? null;
      if (start == null || end == null) return [];
      const days = splitDays(m.days);
      const conflicts = getConflicts(it.sectionId);
      const hasConflict = conflicts.length > 0;
      return days.map((d) => ({
        day: d,
        start,
        end,
        label: it.courseCode,
        sub: `${minToTimeLabel(start)}–${minToTimeLabel(end)}`,
        sectionId: it.sectionId,
        hasConflict,
      }));
    })
  );

  return (
    <div className="border border-[#E5E5E5] rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[70px_repeat(5,1fr)] border-b border-[#E5E5E5] bg-[#F9F9F9]">
            <div className="p-2.5 text-xs font-medium text-[#737373]">Time</div>
            {DAYS.map((d) => (
              <div key={d.key} className="p-2.5 text-xs font-semibold text-center text-[#2C2C2C]">
                {d.label}
              </div>
            ))}
          </div>

          <div className="relative">
            {/* rows */}
            <div className="grid grid-cols-[70px_repeat(5,1fr)]">
              <div className="border-r border-[#E5E5E5]">
                {Array.from({ length: (END_MIN - START_MIN) / 60 + 1 }).map((_, i) => {
                  const t = START_MIN + i * 60;
                  return (
                    <div key={t} className="h-12 border-b border-[#E5E5E5] px-2.5 flex items-start pt-1.5 text-xs text-[#737373] font-medium">
                      {minToTimeLabel(t)}
                    </div>
                  );
                })}
              </div>

              {DAYS.map((d) => (
                <div key={d.key} className="relative border-r border-[#E5E5E5] last:border-r-0">
                  {Array.from({ length: (END_MIN - START_MIN) / 30 }).map((_, i) => (
                    <div key={i} className="h-6 border-b border-[#F0F0F0]" />
                  ))}

                  {blocks
                    .filter((b) => b.day === d.key)
                    .map((b) => {
                      const top = ((clamp(b.start, START_MIN, END_MIN) - START_MIN) / 30) * 24; // 24px per 30 min (h-6)
                      const height =
                        ((clamp(b.end, START_MIN, END_MIN) - clamp(b.start, START_MIN, END_MIN)) / 30) * 24;

                      return (
                        <div
                          key={`${b.sectionId}-${b.day}-${b.start}`}
                          className={`absolute left-1.5 right-1.5 rounded-md border p-1.5 text-xs shadow-sm overflow-hidden ${
                            b.hasConflict
                              ? "bg-[#FEE2E2] border-[#FCA5A5] text-[#991B1B]"
                              : "bg-white border-[#D4D4D4]"
                          }`}
                          style={{ top, height }}
                          title={`${b.label} ${b.sub}${b.hasConflict ? " (CONFLICT)" : ""}`}
                        >
                          <div className={`font-semibold truncate ${b.hasConflict ? "text-[#991B1B]" : "text-[#2C2C2C]"}`}>{b.label}</div>
                          <div className={`text-[11px] truncate mt-0.5 ${b.hasConflict ? "text-[#DC2626]" : "text-[#737373]"}`}>
                            {b.sub}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
