import type { DaysKey, SearchFilters } from "./types";

const toInt = (v: string | null) => {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export function parseFiltersFromSearchParams(sp: URLSearchParams): SearchFilters {
  const daysAll = sp.getAll("days").filter(Boolean);
  const daysOne = sp.get("days");

  const days: DaysKey[] = [];
  const pushIfValid = (d: string) => {
    if (d === "MWF" || d === "TR") days.push(d);
  };

  if (daysAll.length) daysAll.forEach(pushIfValid);
  else if (daysOne) pushIfValid(daysOne);

  // Parse multiple GE params
  const ge = sp.getAll("ge").filter(Boolean);

  return {
    term: sp.get("term") ?? "20251",
    q: sp.get("q") ?? undefined,
    subject: sp.get("subject") ?? undefined,
    number: sp.get("number") ?? undefined,
    modality: sp.get("modality") ?? undefined,
    instructor: sp.get("instructor") ?? undefined,
    days: days.length ? days : undefined,
    timeStart: toInt(sp.get("timeStart")),
    timeEnd: toInt(sp.get("timeEnd")),
    ge: ge.length > 0 ? ge : undefined,
  };
}

export function buildSearchParamsFromFilters(
  filters: SearchFilters,
  page?: number,
  pageSize?: number
): URLSearchParams {
  const sp = new URLSearchParams();

  sp.set("term", filters.term ?? "20251");

  if (filters.q) sp.set("q", filters.q);
  if (filters.subject) sp.set("subject", filters.subject);
  if (filters.number) sp.set("number", filters.number);
  if (filters.modality) sp.set("modality", filters.modality);
  if (filters.instructor) sp.set("instructor", filters.instructor);

  // backend expects ONE days string. If both selected, omit it = "Any"
  if (filters.days?.length === 1) sp.set("days", filters.days[0]);

  if (typeof filters.timeStart === "number") sp.set("timeStart", String(filters.timeStart));
  if (typeof filters.timeEnd === "number") sp.set("timeEnd", String(filters.timeEnd));

  // Add multiple GE params
  if (filters.ge && filters.ge.length > 0) {
    filters.ge.forEach((geCode) => {
      sp.append("ge", geCode);
    });
  }

  // Pagination
  if (page !== undefined) sp.set("page", String(page));
  if (pageSize !== undefined) sp.set("pageSize", String(pageSize));

  return sp;
}

export function buildApiQuery(filters: SearchFilters, page?: number, pageSize?: number): string {
  const sp = buildSearchParamsFromFilters(filters, page, pageSize);
  return `/api/search?${sp.toString()}`;
}
