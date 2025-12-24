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
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_420px] gap-6">
      <FilterSidebar filters={filters} setFilters={setFilters} />

      <div>
        <div className="flex items-center justify-between">
          <div className="text-sm opacity-70">
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                Loading…
              </span>
            ) : error ? (
              <span className="text-red-600">Error loading results</span>
            ) : (
              <>
                Showing {data?.count ?? 0} of {data?.total ?? 0} result{data?.total !== 1 ? "s" : ""}
                {data?.page && data.page > 1 && ` (page ${data.page})`}
              </>
            )}
          </div>

          <button
            className="text-sm underline opacity-80 hover:opacity-100"
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
            <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <div className="font-medium mb-1">Failed to load results</div>
              <div className="opacity-80">{String((error as Error).message)}</div>
              <button
                className="mt-2 text-sm underline"
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
              <ResultsList isLoading={isLoading} results={data?.results ?? []} />

              {/* Pagination */}
              {data && data.total > PAGE_SIZE && (
                <div className="mt-6 flex items-center justify-center gap-2">
                  <button
                    className="rounded border px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Previous
                  </button>
                  <span className="text-sm opacity-70">
                    Page {data.page} of {Math.ceil(data.total / data.pageSize)}
                  </span>
                  <button
                    className="rounded border px-3 py-1.5 text-sm hover:bg-black/5 disabled:opacity-50 disabled:cursor-not-allowed"
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

      <SchedulePanel />
    </div>
  );
}
