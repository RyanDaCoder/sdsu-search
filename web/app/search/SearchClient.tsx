"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SchedulePanel } from "@/components/schedule/SchedulePanel";

import type { SearchFilters, SearchResponse } from "@/lib/search/types";
import {
  buildApiQuery,
  buildSearchParamsFromFilters,
  parseFiltersFromSearchParams,
} from "@/lib/search/query";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";

import FilterSidebar from "../../components/search/FilterSidebar";
import ResultsList from "../../components/search/ResultsList";
import ActiveFilters from "../../components/search/ActiveFilters";

const PAGE_SIZE = 20;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
};

export default function SearchClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const keywordInputRef = useRef<HTMLInputElement | null>(null);

  const initialFilters = useMemo<SearchFilters>(() => {
    const usp = new URLSearchParams(sp.toString());
    return parseFiltersFromSearchParams(usp);
  }, [sp]);

  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Track if we're syncing from URL (to prevent filter-change effect from resetting page)
  const [isSyncingFromUrl, setIsSyncingFromUrl] = useState(false);

  // Sync state when user navigates back/forward
  useEffect(() => {
    setIsSyncingFromUrl(true);
    setFilters(initialFilters);
    const pageParam = sp.get("page");
    // Validate page number (must be >= 1, matching server validation)
    const parsedPage = pageParam ? parseInt(pageParam, 10) : null;
    const validPage = parsedPage && parsedPage >= 1 ? parsedPage : 1;
    setPage(validPage);
    // Reset flag after sync completes
    setTimeout(() => setIsSyncingFromUrl(false), 0);
  }, [initialFilters, sp]);

  // Debounce only the "q" (keyword) field for fast UX
  const debouncedQ = useDebouncedValue(filters.q ?? "", 250);

  const debouncedFilters = useMemo<SearchFilters>(() => {
    return { ...filters, q: debouncedQ || undefined };
  }, [filters, debouncedQ]);

  // Reset to page 1 when filters change (compare values, not references)
  // But skip if we're syncing from URL to preserve page number from history
  useEffect(() => {
    if (!isSyncingFromUrl) {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Don't include isSyncingFromUrl in deps - we only check it, not react to its changes
    filters.q,
    filters.subject,
    filters.number,
    filters.modality,
    filters.instructor,
    filters.days?.join(","), // Compare array values, not reference
    filters.timeStart,
    filters.timeEnd,
    filters.ge?.join(","), // Compare array values, not reference
  ]);

  // Push filters into the URL (query params)
  useEffect(() => {
    const next = buildSearchParamsFromFilters(filters, page, PAGE_SIZE).toString();
    const curr = sp.toString();
    if (next !== curr) {
      router.replace(`/search?${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page]);

  const apiUrl = useMemo(() => buildApiQuery(debouncedFilters, page, PAGE_SIZE), [debouncedFilters, page]);

  const { data, error, isLoading } = useSWR<SearchResponse>(apiUrl, fetcher, {
    keepPreviousData: true,
    dedupingInterval: 1500,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or when modifier keys are pressed
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey
      ) {
        return;
      }

      // "/" to focus keyword search
      if (e.key === "/") {
        e.preventDefault();
        keywordInputRef.current?.focus();
      }

      // "?" to show keyboard shortcuts help (future enhancement)
      // Esc to close mobile filters
      if (e.key === "Escape" && mobileFiltersOpen) {
        setMobileFiltersOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileFiltersOpen]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_420px] gap-4 lg:gap-6">
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full rounded-md border border-[#D4D4D4] bg-white px-4 py-3 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors flex items-center justify-center gap-2 touch-manipulation"
          aria-label="Open filters"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filter Sidebar - Desktop visible, Mobile as drawer */}
      <div className="hidden lg:block">
        <FilterSidebar filters={filters} setFilters={setFilters} keywordInputRef={keywordInputRef} />
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white shadow-xl z-50 lg:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-drawer-title"
          >
            <div className="sticky top-0 bg-white border-b border-[#E5E5E5] p-4 flex items-center justify-between z-10">
              <h2 id="filter-drawer-title" className="font-semibold text-lg text-[#2C2C2C]">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#737373] hover:text-[#2C2C2C] transition-colors p-1 touch-manipulation"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setMobileFiltersOpen(false)} keywordInputRef={keywordInputRef} />
            </div>
          </div>
        </>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="text-sm">
            {isLoading ? (
              <span className="inline-flex items-center gap-2 text-[#525252]">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#8B1538] border-t-transparent"></span>
                <span className="font-medium">Loading results…</span>
              </span>
            ) : error ? (
              <span className="inline-flex items-center gap-2 text-[#DC2626] font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error loading results
              </span>
            ) : data ? (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-[#404040]">
                  {data.total === 0 ? (
                    "No results found"
                  ) : (
                    <>
                      Showing <span className="text-[#8B1538] font-semibold">{data.count}</span> of{" "}
                      <span className="text-[#8B1538] font-semibold">{data.total}</span> result{data.total !== 1 ? "s" : ""}
                    </>
                  )}
                </span>
                {data.page && data.page > 1 && (
                  <span className="text-xs text-[#737373] bg-[#F0F0F0] px-2 py-0.5 rounded">
                    Page {data.page}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          <button
            className="inline-flex items-center gap-1.5 text-sm text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors whitespace-nowrap py-2 sm:py-0 touch-manipulation"
            onClick={() => {
              setFilters({
                term: filters.term ?? "20251", // keep default term
              });
              setPage(1);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear all filters
          </button>
        </div>

        <div className="mt-3">
          {error && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-sm text-[#991B1B]">
              <div className="flex items-start gap-2 mb-2">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold mb-1.5">Failed to load results</div>
                  <div className="text-[#DC2626] mb-3">{String((error as Error).message)}</div>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-md border border-[#8B1538] bg-white px-3 py-1.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white transition-colors touch-manipulation"
                    onClick={() => {
                      // Retry by refetching
                      window.location.reload();
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Retry
                  </button>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <>
              <ActiveFilters filters={filters} setFilters={setFilters} />
              <ResultsList isLoading={isLoading} results={data?.results ?? []} />

              {/* Pagination */}
              {data && data.total > PAGE_SIZE && (
                <div className="mt-6">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      className="inline-flex items-center gap-1.5 w-full sm:w-auto rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1 || isLoading}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const totalPages = Math.ceil(data.total / data.pageSize);
                        const currentPage = data.page;
                        const pages: (number | string)[] = [];
                        
                        // Show page numbers with ellipsis for large page counts
                        if (totalPages <= 7) {
                          // Show all pages if 7 or fewer
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Show first page, ellipsis, current-1, current, current+1, ellipsis, last page
                          pages.push(1);
                          if (currentPage > 3) pages.push("...");
                          for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                            pages.push(i);
                          }
                          if (currentPage < totalPages - 2) pages.push("...");
                          pages.push(totalPages);
                        }

                        return pages.map((p, idx) => {
                          if (p === "...") {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-[#737373]">
                                ...
                              </span>
                            );
                          }
                          const pageNum = p as number;
                          const isActive = pageNum === currentPage;
                          return (
                            <button
                              key={pageNum}
                              className={`min-w-[36px] px-3 py-1.5 text-sm font-medium rounded-md transition-colors touch-manipulation ${
                                isActive
                                  ? "bg-[#8B1538] text-white"
                                  : "text-[#404040] hover:bg-[#F0F0F0] border border-[#E5E5E5]"
                              }`}
                              onClick={() => setPage(pageNum)}
                              disabled={isLoading}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      className="inline-flex items-center gap-1.5 w-full sm:w-auto rounded-md border border-[#D4D4D4] bg-white px-4 py-2.5 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!data.hasMore || isLoading}
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-center mt-2 text-xs text-[#737373]">
                    Page {data.page} of {Math.ceil(data.total / data.pageSize)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Schedule Panel - Stacked on mobile, sidebar on desktop */}
      <div className="order-last lg:order-none">
        <SchedulePanel />
      </div>
    </div>
  );
}
