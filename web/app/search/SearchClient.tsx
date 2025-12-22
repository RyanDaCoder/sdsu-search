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

  // Sync state when user navigates back/forward
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Debounce only the "q" (keyword) field for fast UX
  const debouncedQ = useDebouncedValue(filters.q ?? "", 250);

  const debouncedFilters = useMemo<SearchFilters>(() => {
    return { ...filters, q: debouncedQ || undefined };
  }, [filters, debouncedQ]);

  // Push filters into the URL (query params)
  useEffect(() => {
    const next = buildSearchParamsFromFilters(filters).toString();
    const curr = sp.toString();
    if (next !== curr) {
      router.replace(`/search?${next}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const apiUrl = useMemo(() => buildApiQuery(debouncedFilters), [debouncedFilters]);

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
            {isLoading ? "Loading…" : error ? "Error" : `${data?.count ?? 0} result(s)`}
          </div>

          <button
            className="text-sm underline opacity-80 hover:opacity-100"
            onClick={() =>
              setFilters({
                term: filters.term ?? "20251", // keep default term
              })
            }
          >
            Clear all
          </button>
        </div>

        <div className="mt-3">
          {error && (
            <div className="rounded border p-3 text-sm">
              Failed to load results. ({String((error as Error).message)})
            </div>
          )}

          {!error && (
            <ResultsList isLoading={isLoading} results={data?.results ?? []} />
          )}
        </div>
      </div>

      <SchedulePanel />
    </div>
  );
}
