"use client";

import { useScheduleStore } from "@/lib/schedule/store";
import { WeeklyGrid } from "@/components/schedule/WeeklyGrid";

export function SchedulePanel() {
  const items = useScheduleStore((s) => s.items);
  const remove = useScheduleStore((s) => s.removeSection);
  const clear = useScheduleStore((s) => s.clear);
  const lastError = useScheduleStore((s) => s.lastError);

  return (
    <aside className="w-full lg:w-[420px] shrink-0 border rounded-lg p-3 space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Schedule</h2>
        <button className="text-sm underline" onClick={clear} disabled={items.length === 0}>
          Clear
        </button>
      </div>

      {lastError && (
        <div className="rounded border p-2 text-sm">
          {lastError}
        </div>
      )}

      <WeeklyGrid items={items} />

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Add a section to start building your schedule.
          </div>
        ) : (
          items.map((it) => (
            <div key={it.sectionId} className="flex items-start justify-between gap-2 border rounded-md p-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{it.courseCode}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {it.courseTitle ?? ""}
                </div>
                <div className="text-xs text-muted-foreground">
                  Section: {it.sectionId.slice(0, 8)}
                </div>
              </div>

              <button className="text-sm underline" onClick={() => remove(it.sectionId)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
