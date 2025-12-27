import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ScheduleItem } from "./types";

export type SchedulePlan = {
  id: string;
  name: string;
  items: ScheduleItem[];
  createdAt: number;
  updatedAt: number;
};

type PlansState = {
  plans: SchedulePlan[];
  currentPlanId: string | null;

  // Actions
  createPlan: (name: string) => string; // Returns plan ID
  switchPlan: (planId: string) => void;
  updatePlan: (planId: string, items: ScheduleItem[]) => void;
  renamePlan: (planId: string, newName: string) => void;
  deletePlan: (planId: string) => void;
  duplicatePlan: (planId: string, newName?: string) => string; // Returns new plan ID

  // Getters
  getCurrentPlan: () => SchedulePlan | null;
  getPlan: (planId: string) => SchedulePlan | null;
};

const generatePlanId = () => `plan_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

export const usePlansStore = create<PlansState>()(
  persist(
    (set, get) => ({
      plans: [],
      currentPlanId: null,

      createPlan: (name: string) => {
        const id = generatePlanId();
        const now = Date.now();
        const newPlan: SchedulePlan = {
          id,
          name,
          items: [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          plans: [...state.plans, newPlan],
          currentPlanId: id,
        }));

        return id;
      },

      switchPlan: (planId: string) => {
        const plan = get().getPlan(planId);
        if (plan) {
          set({ currentPlanId: planId });
        }
      },

      updatePlan: (planId: string, items: ScheduleItem[]) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === planId
              ? { ...plan, items, updatedAt: Date.now() }
              : plan
          ),
        }));
      },

      renamePlan: (planId: string, newName: string) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === planId ? { ...plan, name: newName, updatedAt: Date.now() } : plan
          ),
        }));
      },

      deletePlan: (planId: string) => {
        set((state) => {
          const remainingPlans = state.plans.filter((p) => p.id !== planId);
          let newCurrentPlanId = state.currentPlanId;

          // If we deleted the current plan, switch to another one or null
          if (state.currentPlanId === planId) {
            newCurrentPlanId = remainingPlans.length > 0 ? remainingPlans[0].id : null;
          }

          return {
            plans: remainingPlans,
            currentPlanId: newCurrentPlanId,
          };
        });
      },

      duplicatePlan: (planId: string, newName?: string) => {
        const plan = get().getPlan(planId);
        if (!plan) return "";

        const id = generatePlanId();
        const now = Date.now();
        const duplicated: SchedulePlan = {
          id,
          name: newName || `${plan.name} (Copy)`,
          items: JSON.parse(JSON.stringify(plan.items)), // Deep clone
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          plans: [...state.plans, duplicated],
          currentPlanId: id,
        }));

        return id;
      },

      getCurrentPlan: () => {
        const { plans, currentPlanId } = get();
        if (!currentPlanId) {
          // If no current plan, create a default one
          const defaultId = get().createPlan("Plan A");
          return get().getPlan(defaultId);
        }
        return plans.find((p) => p.id === currentPlanId) || null;
      },

      getPlan: (planId: string) => {
        return get().plans.find((p) => p.id === planId) || null;
      },
    }),
    {
      name: "sdsu-schedule-plans",
      version: 1,
    }
  )
);

