"use client";

import type { ScheduleItem } from "@/lib/schedule/types";
import { minToTimeLabel } from "@/lib/search/time";

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
  // flatten meetings into blocks per-day
  const blocks = items.flatMap((it) =>
    (it.meetings ?? []).flatMap((m) => {
      const start = m.startMin ?? null;
      const end = m.endMin ?? null;
      if (start == null || end == null) return [];
      const days = splitDays(m.days);
      return days.map((d) => ({
        day: d,
        start,
        end,
        label: it.courseCode,
        sub: `${minToTimeLabel(start)}–${minToTimeLabel(end)}`,
        sectionId: it.sectionId,
      }));
    })
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="grid grid-cols-[70px_repeat(5,1fr)] border-b bg-muted/30">
        <div className="p-2 text-xs text-muted-foreground">Time</div>
        {DAYS.map((d) => (
          <div key={d.key} className="p-2 text-xs font-medium text-center">
            {d.label}
          </div>
        ))}
      </div>

      <div className="relative">
        {/* rows */}
        <div className="grid grid-cols-[70px_repeat(5,1fr)]">
          <div className="border-r">
            {Array.from({ length: (END_MIN - START_MIN) / 60 + 1 }).map((_, i) => {
              const t = START_MIN + i * 60;
              return (
                <div key={t} className="h-12 border-b px-2 flex items-start pt-1 text-xs text-muted-foreground">
                  {minToTimeLabel(t)}
                </div>
              );
            })}
          </div>

          {DAYS.map((d) => (
            <div key={d.key} className="relative border-r last:border-r-0">
              {Array.from({ length: (END_MIN - START_MIN) / 30 }).map((_, i) => (
                <div key={i} className="h-6 border-b" />
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
                      className="absolute left-1 right-1 rounded-md border bg-background/90 p-1 text-xs shadow-sm overflow-hidden"
                      style={{ top, height }}
                      title={`${b.label} ${b.sub}`}
                    >
                      <div className="font-medium truncate">{b.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{b.sub}</div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
