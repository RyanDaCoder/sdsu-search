import { create } from "zustand";
import type { ScheduleItem, Conflict } from "./types";
import { findConflicts } from "./conflicts";

type AddResult =
  | { ok: true }
  | { ok: false; conflicts: Conflict[]; message: string };

type ScheduleState = {
  items: ScheduleItem[];

  // UI helpers
  lastError: string | null;
  conflictMap: Map<string, Conflict[]>; // sectionId -> conflicts

  // actions
  addSection: (item: ScheduleItem) => AddResult;
  removeSection: (sectionId: string) => void;
  clear: () => void;

  // derived helpers
  hasSection: (sectionId: string) => boolean;
  getConflicts: (sectionId: string) => Conflict[];
};

function computeConflictMap(items: ScheduleItem[]): Map<string, Conflict[]> {
  const map = new Map<string, Conflict[]>();
  for (let i = 0; i < items.length; i++) {
    const conflicts = findConflicts(items, items[i]);
    if (conflicts.length > 0) {
      map.set(items[i].sectionId, conflicts);
    }
  }
  return map;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  items: [],
  lastError: null,
  conflictMap: new Map(),

  hasSection: (sectionId) => get().items.some((x) => x.sectionId === sectionId),

  getConflicts: (sectionId) => {
    return get().conflictMap.get(sectionId) ?? [];
  },

  addSection: (item) => {
    const { items } = get();

    if (items.some((x) => x.sectionId === item.sectionId)) {
      return { ok: true }; // already added — treat as no-op
    }

    const conflicts = findConflicts(items, item);
    if (conflicts.length > 0) {
      const msg = "That section conflicts with something already in your schedule.";
      // Don't add the conflicting item - only update error and conflict map for existing items
      set({
        lastError: msg,
        conflictMap: computeConflictMap(items),
      });
      return { ok: false, conflicts, message: msg };
    }

    const newItems = [...items, item];
    set({
      items: newItems,
      lastError: null,
      conflictMap: computeConflictMap(newItems),
    });
    return { ok: true };
  },

  removeSection: (sectionId) => {
    set((s) => {
      const newItems = s.items.filter((x) => x.sectionId !== sectionId);
      return {
        items: newItems,
        conflictMap: computeConflictMap(newItems),
      };
    });
  },

  clear: () => set({ items: [], lastError: null, conflictMap: new Map() }),
}));
