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

  // actions
  addSection: (item: ScheduleItem) => AddResult;
  removeSection: (sectionId: string) => void;
  clear: () => void;

  // derived helpers
  hasSection: (sectionId: string) => boolean;
};

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  items: [],
  lastError: null,

  hasSection: (sectionId) => get().items.some((x) => x.sectionId === sectionId),

  addSection: (item) => {
    const { items } = get();

    if (items.some((x) => x.sectionId === item.sectionId)) {
      return { ok: true }; // already added — treat as no-op
    }

    const conflicts = findConflicts(items, item);
    if (conflicts.length > 0) {
      const msg = "That section conflicts with something already in your schedule.";
      set({ lastError: msg });
      return { ok: false, conflicts, message: msg };
    }

    set({ items: [...items, item], lastError: null });
    return { ok: true };
  },

  removeSection: (sectionId) => {
    set((s) => ({ items: s.items.filter((x) => x.sectionId !== sectionId) }));
  },

  clear: () => set({ items: [], lastError: null }),
}));
