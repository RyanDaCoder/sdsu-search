"use client";

import useSWR from "swr";
import { useEffect, useMemo, useState } from "react";
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_420px] gap-4 lg:gap-6">
      {/* Mobile filter button */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="w-full rounded-md border border-[#D4D4D4] bg-white px-4 py-3 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </button>
      </div>

      {/* Filter Sidebar - Desktop visible, Mobile as drawer */}
      <div className="hidden lg:block">
        <FilterSidebar filters={filters} setFilters={setFilters} />
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-[85vw] max-w-sm bg-white shadow-xl z-50 lg:hidden overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-[#E5E5E5] p-4 flex items-center justify-between z-10">
              <h2 className="font-semibold text-lg text-[#2C2C2C]">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="text-[#737373] hover:text-[#2C2C2C] transition-colors p-1"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setMobileFiltersOpen(false)} />
            </div>
          </div>
        </>
      )}

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="text-sm text-[#525252]">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#8B1538] border-t-transparent"></span>
                <span className="font-medium">Loading…</span>
              </span>
            ) : error ? (
              <span className="text-[#DC2626] font-medium">Error loading results</span>
            ) : (
              <>
                <span className="font-medium text-[#404040]">
                  Showing {data?.count ?? 0} of {data?.total ?? 0} result{data?.total !== 1 ? "s" : ""}
                </span>
                {data?.page && data.page > 1 && (
                  <span className="text-[#737373] ml-1">(page {data.page})</span>
                )}
              </>
            )}
          </div>

          <button
            className="text-sm text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors whitespace-nowrap py-2 sm:py-0"
            onClick={() => {
              setFilters({
                term: filters.term ?? "20251", // keep default term
              });
              setPage(1);
            }}
          >
            Clear all
          </button>
        </div>

        <div className="mt-3">
          {error && (
            <div className="rounded-lg border border-[#FCA5A5] bg-[#FEE2E2] p-4 text-sm text-[#991B1B]">
              <div className="font-semibold mb-1.5">Failed to load results</div>
              <div className="text-[#DC2626] mb-3">{String((error as Error).message)}</div>
              <button
                className="text-sm text-[#8B1538] hover:text-[#6B1029] underline font-medium transition-colors"
                onClick={() => {
                  // Retry by refetching
                  window.location.reload();
                }}
              >
                Retry
              </button>
            </div>
          )}

          {!error && (
            <>
              <ActiveFilters filters={filters} setFilters={setFilters} />
              <ResultsList isLoading={isLoading} results={data?.results ?? []} />

              {/* Pagination */}
              {data && data.total > PAGE_SIZE && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    className="w-full sm:w-auto rounded-md border border-[#D4D4D4] bg-white px-4 py-3 sm:py-2 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-[#525252] font-medium">
                    Page {data.page} of {Math.ceil(data.total / data.pageSize)}
                  </span>
                  <button
                    className="w-full sm:w-auto rounded-md border border-[#D4D4D4] bg-white px-4 py-3 sm:py-2 text-sm font-medium text-[#8B1538] hover:bg-[#8B1538] hover:text-white hover:border-[#8B1538] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#8B1538] transition-colors touch-manipulation"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data.hasMore || isLoading}
                  >
                    Next
                  </button>
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
