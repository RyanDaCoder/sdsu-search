import { Modality, SectionStatus } from "@prisma/client";
import type { ScheduleRow, RequirementRow, NormalizedScheduleRow, NormalizedRequirementRow } from "./types";

/**
 * Parse time string into minutes from midnight.
 * Supports: "9:00 AM", "09:00", "900", "14:30", "2:30 PM", etc.
 */
export function parseTimeToMinutes(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;

  const trimmed = timeStr.trim().toUpperCase();
  if (!trimmed) return null;

  // Remove common suffixes
  let cleaned = trimmed.replace(/[AP]M/gi, "").trim();

  // Handle formats like "900" (no colon)
  if (!cleaned.includes(":")) {
    if (cleaned.length === 3) {
      // "900" -> 9:00
      cleaned = `${cleaned[0]}:${cleaned.slice(1)}`;
    } else if (cleaned.length === 4) {
      // "1430" -> 14:30
      cleaned = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
  }

  // Parse HH:MM
  const parts = cleaned.split(":");
  if (parts.length !== 2) return null;

  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) return null;

  // Handle AM/PM
  if (trimmed.includes("PM") && hours !== 12) {
    hours += 12;
  } else if (trimmed.includes("AM") && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Normalize day strings to canonical format.
 * Supports: "TuTh", "TTh", "TR", "Tue/Thu", "MWF", "M/W/F", etc.
 * Returns format used in DB: "MWF", "TR", "MW", etc.
 */
export function normalizeDays(daysStr: string | null | undefined): string | null {
  if (!daysStr) return null;

  const trimmed = daysStr.trim().toUpperCase();
  if (!trimmed) return null;

  // Remove separators and normalize
  let cleaned = trimmed.replace(/[\/\s\-_]/g, "");

  // Map common variations
  const dayMap: Record<string, string> = {
    M: "M",
    MON: "M",
    MONDAY: "M",
    T: "T",
    TU: "T",
    TUE: "T",
    TUES: "T",
    TUESDAY: "T",
    W: "W",
    WED: "W",
    WEDNESDAY: "W",
    R: "R",
    TH: "R",
    THU: "R",
    THUR: "R",
    THURS: "R",
    THURSDAY: "R",
    F: "F",
    FRI: "F",
    FRIDAY: "F",
    S: "S",
    SAT: "S",
    SATURDAY: "S",
    SU: "U",
    SUN: "U",
    SUNDAY: "U",
  };

  // Extract day letters
  const foundDays = new Set<string>();
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (dayMap[char]) {
      foundDays.add(dayMap[char]);
    } else {
      // Try multi-char matches
      for (const [key, value] of Object.entries(dayMap)) {
        if (cleaned.substring(i).startsWith(key)) {
          foundDays.add(value);
          i += key.length - 1;
          break;
        }
      }
    }
  }

  if (foundDays.size === 0) return null;

  // Return in canonical order: M T W R F S U
  const order = ["M", "T", "W", "R", "F", "S", "U"];
  const sorted = Array.from(foundDays)
    .filter((d) => order.includes(d))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));

  return sorted.join("");
}

/**
 * Normalize modality string to Modality enum.
 */
export function normalizeModality(
  modalityStr: string | null | undefined,
  valueMap?: Record<string, string>
): Modality {
  if (!modalityStr) return Modality.UNKNOWN;

  const trimmed = modalityStr.trim().toUpperCase();

  // Try value map first
  if (valueMap) {
    const mapped = valueMap[trimmed] || valueMap[modalityStr];
    if (mapped) {
      const enumValue = mapped.toUpperCase() as Modality;
      if (Object.values(Modality).includes(enumValue)) {
        return enumValue;
      }
    }
  }

  // Heuristics
  if (trimmed.includes("PERSON") || trimmed.includes("FACE") || trimmed.includes("IN-PERSON")) {
    return Modality.IN_PERSON;
  }
  if (trimmed.includes("ONLINE") && (trimmed.includes("SYNC") || trimmed.includes("LIVE"))) {
    return Modality.ONLINE_SYNC;
  }
  if (trimmed.includes("ONLINE") && (trimmed.includes("ASYNC") || trimmed.includes("SELF"))) {
    return Modality.ONLINE_ASYNC;
  }
  if (trimmed.includes("HYBRID") || trimmed.includes("BLENDED")) {
    return Modality.HYBRID;
  }

  return Modality.UNKNOWN;
}

/**
 * Normalize status string to SectionStatus enum.
 */
export function normalizeStatus(
  statusStr: string | null | undefined,
  valueMap?: Record<string, string>
): SectionStatus {
  if (!statusStr) return SectionStatus.UNKNOWN;

  const trimmed = statusStr.trim().toUpperCase();

  // Try value map first
  if (valueMap) {
    const mapped = valueMap[trimmed] || valueMap[statusStr];
    if (mapped) {
      const enumValue = mapped.toUpperCase() as SectionStatus;
      if (Object.values(SectionStatus).includes(enumValue)) {
        return enumValue;
      }
    }
  }

  // Heuristics
  if (trimmed.includes("OPEN") || trimmed.includes("AVAILABLE")) {
    return SectionStatus.OPEN;
  }
  if (trimmed.includes("CLOSED") || trimmed.includes("FULL")) {
    return SectionStatus.CLOSED;
  }
  if (trimmed.includes("WAIT") || trimmed.includes("WAITLIST")) {
    return SectionStatus.WAITLIST;
  }

  return SectionStatus.UNKNOWN;
}

/**
 * Normalize a ScheduleRow into a NormalizedScheduleRow ready for Prisma.
 */
export function normalizeScheduleRow(
  row: ScheduleRow,
  valueMaps?: { modality?: Record<string, string>; status?: Record<string, string> }
): NormalizedScheduleRow {
  return {
    termCode: row.termCode.trim(),
    subject: row.subject.trim().toUpperCase(),
    number: row.number.trim(),
    sectionKey: row.sectionKey.trim(),
    title: row.title?.trim(),
    units: row.units?.trim(),
    status: normalizeStatus(row.status, valueMaps?.status),
    modality: normalizeModality(row.modality, valueMaps?.modality),
    instructor: row.instructor?.trim(),
    location: row.location?.trim(),
    meetings:
      row.meetings?.map((m) => ({
        days: m.days,
        startMin: m.startMin,
        endMin: m.endMin,
        location: m.location?.trim(),
      })) || [],
  };
}

/**
 * Normalize a RequirementRow into a NormalizedRequirementRow ready for Prisma.
 */
export function normalizeRequirementRow(row: RequirementRow): NormalizedRequirementRow {
  return {
    subject: row.subject.trim().toUpperCase(),
    number: row.number.trim(),
    requirementCode: row.requirementCode.trim(),
  };
}

