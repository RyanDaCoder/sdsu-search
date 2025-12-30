"use client";

import { useState, useEffect } from "react";
import { useScheduleStore } from "@/lib/schedule/store";
import { usePlansStore } from "@/lib/schedule/plans-store";
import { useToastStore } from "@/lib/toast/store";
import { WeeklyGrid } from "@/components/schedule/WeeklyGrid";
import {
  exportScheduleAsText,
  exportScheduleAsJson,
  exportScheduleAsIcal,
  downloadFile,
} from "@/lib/schedule/export";
import { minToTimeLabel } from "@/lib/search/time";

export function SchedulePanel() {
  const items = useScheduleStore((s) => s.items);
  const remove = useScheduleStore((s) => s.removeSection);
  const clear = useScheduleStore((s) => s.clear);
  const lastError = useScheduleStore((s) => s.lastError);
  const syncWithCurrentPlan = useScheduleStore((s) => s.syncWithCurrentPlan);
  const addToast = useToastStore((s) => s.addToast);
  
  const plans = usePlansStore((s) => s.plans);
  const currentPlanId = usePlansStore((s) => s.currentPlanId);
  const currentPlan = usePlansStore((s) => s.getCurrentPlan());
  const createPlan = usePlansStore((s) => s.createPlan);
  const switchPlan = usePlansStore((s) => s.switchPlan);
  const renamePlan = usePlansStore((s) => s.renamePlan);
  const deletePlan = usePlansStore((s) => s.deletePlan);
  const duplicatePlan = usePlansStore((s) => s.duplicatePlan);
  
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPlanMenu, setShowPlanMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  // Sync schedule store with current plan when plan changes
  useEffect(() => {
    syncWithCurrentPlan();
  }, [currentPlanId, syncWithCurrentPlan]);

  // Ensure we have at least one plan
  useEffect(() => {
    if (plans.length === 0) {
      createPlan("Plan A");
    } else if (!currentPlanId) {
      switchPlan(plans[0].id);
    }
  }, [plans.length, currentPlanId, createPlan, switchPlan]);

  const handleRename = () => {
    if (currentPlan && renameValue.trim()) {
      renamePlan(currentPlan.id, renameValue.trim());
      setIsRenaming(false);
      setRenameValue("");
      addToast("Plan renamed", "success");
    }
  };

  return (
    <aside className="w-full lg:w-[420px] shrink-0 border border-[#E5E5E5] rounded-lg bg-white p-5 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-auto shadow-sm">
      {/* Plan Selector */}
      <div className="border-b border-[#E5E5E5] pb-3">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-[#525252]">Schedule Plan</label>
          <div className="flex items-center gap-1.5">
            <button
              className="inline-flex items-center gap-1.5 rounded-md border border-[#8B1538] bg-[#8B1538] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#6B1029] transition-colors touch-manipulation"
              onClick={() => {
                const newId = createPlan(`Plan ${plans.length + 1}`);
                addToast("New plan created", "success");
              }}
              aria-label="Create new schedule plan"
              title="Create new plan"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
            <div className="relative">
              <button
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D4D4D4] bg-white px-2.5 py-1 text-xs font-medium text-[#404040] hover:bg-[#F9F9F9] transition-colors touch-manipulation"
                onClick={() => setShowPlanMenu(!showPlanMenu)}
                aria-label="Manage plans"
                title="Plan options"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
                <span className="hidden sm:inline">Options</span>
              </button>
            {showPlanMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPlanMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-8 z-50 bg-white border border-[#E5E5E5] rounded-lg shadow-lg p-1.5 min-w-[200px]">
                  <button
                    className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                    onClick={() => {
                      const newId = createPlan(`Plan ${plans.length + 1}`);
                      addToast("New plan created", "success");
                      setShowPlanMenu(false);
                    }}
                  >
                    <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Plan
                  </button>
                  {currentPlan && (
                    <>
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                        onClick={() => {
                          setIsRenaming(true);
                          setRenameValue(currentPlan.name);
                          setShowPlanMenu(false);
                        }}
                      >
                        <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Rename Plan
                      </button>
                      <button
                        className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                        onClick={() => {
                          duplicatePlan(currentPlan.id);
                          addToast("Plan duplicated", "success");
                          setShowPlanMenu(false);
                        }}
                      >
                        <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Duplicate Plan
                      </button>
                      {plans.length > 1 && (
                        <button
                          className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors touch-manipulation"
                          onClick={() => {
                            if (confirm(`Delete "${currentPlan.name}"? This cannot be undone.`)) {
                              deletePlan(currentPlan.id);
                              addToast("Plan deleted", "info");
                            }
                            setShowPlanMenu(false);
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete Plan
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        </div>
        {isRenaming && currentPlan ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setIsRenaming(false);
                  setRenameValue("");
                }
              }}
              className="flex-1 rounded-md border border-[#D4D4D4] px-2 py-1 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-1 focus:ring-[#8B1538]/20 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleRename}
              className="rounded-md bg-[#8B1538] text-white px-2 py-1 text-xs font-medium hover:bg-[#6B1029] transition-colors touch-manipulation"
            >
              Save
            </button>
            <button
              onClick={() => {
                setIsRenaming(false);
                setRenameValue("");
              }}
              className="rounded-md border border-[#D4D4D4] bg-white px-2 py-1 text-xs font-medium text-[#404040] hover:bg-[#F9F9F9] transition-colors touch-manipulation"
            >
              Cancel
            </button>
          </div>
        ) : (
          <select
            value={currentPlanId || ""}
            onChange={(e) => {
              switchPlan(e.target.value);
              addToast(`Switched to ${plans.find((p) => p.id === e.target.value)?.name || "plan"}`, "info");
            }}
            className="w-full rounded-md border border-[#D4D4D4] px-3 py-2 text-sm text-[#171717] bg-white focus:border-[#8B1538] focus:ring-2 focus:ring-[#8B1538]/20 focus:outline-none transition-colors touch-manipulation"
            aria-label="Select schedule plan"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.items.length} sections)
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#8B1538]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="font-semibold text-lg text-[#2C2C2C]">Schedule</h2>
        </div>
        <button 
          className="inline-flex items-center gap-1.5 rounded-md border border-[#D4D4D4] bg-white px-3 py-1.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation" 
          onClick={() => {
            clear();
            addToast("Schedule cleared", "info");
          }} 
          disabled={items.length === 0}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear
        </button>
      </div>

      {lastError && (
        <div className="rounded-md border border-[#FCA5A5] bg-[#FEE2E2] p-3 text-sm text-[#991B1B]">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{lastError}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-[#737373] font-medium">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {items.length} section{items.length !== 1 ? "s" : ""} in schedule
        </div>
      )}

      <WeeklyGrid items={items} />

      {/* Export button - shown under calendar */}
      {items.length > 0 && (
        <div className="relative mt-4">
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors touch-manipulation"
            onClick={() => setShowExportMenu(!showExportMenu)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Schedule
          </button>
          {showExportMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute left-0 top-full mt-2 z-50 bg-white border border-[#E5E5E5] rounded-lg shadow-lg p-1.5 min-w-[180px]">
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                  onClick={() => {
                    downloadFile(exportScheduleAsText(items), "schedule.txt", "text/plain");
                    addToast("Schedule exported as text file", "success");
                    setShowExportMenu(false);
                  }}
                >
                  <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export as Text
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                  onClick={() => {
                    downloadFile(exportScheduleAsJson(items), "schedule.json", "application/json");
                    addToast("Schedule exported as JSON file", "success");
                    setShowExportMenu(false);
                  }}
                >
                  <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  Export as JSON
                </button>
                <button
                  className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm text-[#404040] hover:bg-[#F9F9F9] rounded-md transition-colors touch-manipulation"
                  onClick={() => {
                    downloadFile(exportScheduleAsIcal(items), "schedule.ics", "text/calendar");
                    addToast("Schedule exported as iCal file", "success");
                    setShowExportMenu(false);
                  }}
                >
                  <svg className="w-4 h-4 text-[#737373]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Export as iCal
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="text-center py-8 border border-[#E5E5E5] rounded-lg bg-[#F9F9F9]">
            <svg className="w-12 h-12 text-[#D4D4D4] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="text-sm font-medium text-[#404040] mb-1">No sections yet</div>
            <div className="text-xs text-[#737373]">
              Add a section from search results to start building your schedule.
            </div>
          </div>
        ) : (
          items.map((it) => {
            const meetings = it.meetings ?? [];
            const firstMeeting = meetings[0];
            const meetingTime = firstMeeting && firstMeeting.startMin != null && firstMeeting.endMin != null
              ? `${minToTimeLabel(firstMeeting.startMin)}–${minToTimeLabel(firstMeeting.endMin)}`
              : null;

            return (
              <div key={it.sectionId} className="flex items-start justify-between gap-3 border border-[#E5E5E5] rounded-md bg-white p-4 hover:bg-[#F9F9F9] hover:border-[#D4D4D4] transition-all shadow-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-semibold text-[#2C2C2C] truncate">{it.courseCode}</div>
                    {meetingTime && (
                      <span className="text-xs text-[#737373] font-medium bg-[#F0F0F0] px-2 py-0.5 rounded">
                        {firstMeeting?.days} {meetingTime}
                      </span>
                    )}
                  </div>
                  {it.courseTitle && (
                    <div className="text-sm text-[#525252] truncate mb-1.5">
                      {it.courseTitle}
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[#737373]">
                    <span>Section: {it.sectionId.slice(0, 8)}</span>
                    {meetings.length > 1 && (
                      <span>· {meetings.length} meeting{meetings.length !== 1 ? "s" : ""}</span>
                    )}
                  </div>
                </div>

                <button 
                  className="text-sm text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors whitespace-nowrap touch-manipulation" 
                  onClick={() => {
                    remove(it.sectionId);
                    addToast(`${it.courseCode} removed from schedule`, "info");
                  }}
                  aria-label={`Remove ${it.courseCode}`}
                >
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
