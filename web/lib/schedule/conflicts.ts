import type { Conflict, ScheduleItem } from "./types";
import type { ApiMeeting } from "@/lib/search/types";

// Days strings in your data are likely like "MWF" or "TR".
// Normalize to set of chars: M T W R F
function daysSet(days: string | null | undefined): Set<string> {
  return new Set((days ?? "").split("").filter(Boolean));
}

function timeOverlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  // overlap if intervals intersect (strict)
  return aStart < bEnd && bStart < aEnd;
}

function meetingsConflict(a: ApiMeeting, b: ApiMeeting) {
  const aDays = daysSet(a.days);
  const bDays = daysSet(b.days);

  // any common day?
  let anyDay = false;
  for (const d of aDays) {
    if (bDays.has(d)) {
      anyDay = true;
      break;
    }
  }
  if (!anyDay) return false;

  // must have times
  if (a.startMin == null || a.endMin == null || b.startMin == null || b.endMin == null) {
    return false;
  }

  return timeOverlaps(a.startMin, a.endMin, b.startMin, b.endMin);
}

/**
 * Returns conflicts between `candidate` and existing schedule items.
 * Conflicts if ANY meeting in candidate conflicts with ANY meeting in an existing item.
 */
export function findConflicts(existing: ScheduleItem[], candidate: ScheduleItem): Conflict[] {
  const conflicts: Conflict[] = [];

  for (const item of existing) {
    // Don’t compare to itself
    if (item.sectionId === candidate.sectionId) continue;

    outer: for (const m1 of item.meetings ?? []) {
      for (const m2 of candidate.meetings ?? []) {
        if (meetingsConflict(m1, m2)) {
          conflicts.push({
            withSectionId: item.sectionId,
            reason: "Time conflict",
          });
          break outer;
        }
      }
    }
  }

  return conflicts;
}
