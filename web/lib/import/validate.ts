import { Modality, SectionStatus } from "@prisma/client";
import type { NormalizedScheduleRow, NormalizedRequirementRow } from "./types";

export type Issue = {
  type: "error" | "warning";
  rowIndex?: number;
  field?: string;
  message: string;
  value?: string;
};

export type ValidationResult<T> = {
  errors: Issue[];
  warnings: Issue[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
};

// Allowed day codes (canonical format)
const ALLOWED_DAYS = new Set(["M", "T", "W", "R", "F", "S", "U"]);

/**
 * Validate a day string contains only allowed day codes.
 * Accepts any combination of valid day characters (e.g., "MTW", "WF", "MT", "MWF", etc.)
 */
function isValidDayString(days: string): boolean {
  if (days === "TBA") return true;
  const chars = days.split("");
  // Check that all characters are valid day codes and no duplicates
  const uniqueChars = new Set(chars);
  return chars.length > 0 && chars.every((char) => ALLOWED_DAYS.has(char)) && uniqueChars.size === chars.length;
}

/**
 * Validate normalized schedule rows.
 */
export function validateScheduleRows(
  rows: NormalizedScheduleRow[],
  strict = false
): ValidationResult<NormalizedScheduleRow> {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Required fields validation (errors)
    if (!row.termCode || row.termCode.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "termCode",
        message: "Missing required field: termCode",
      });
    }

    if (!row.subject || row.subject.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "subject",
        message: "Missing required field: subject",
      });
    }

    if (!row.number || row.number.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "number",
        message: "Missing required field: number",
      });
    }

    if (!row.sectionKey || row.sectionKey.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "sectionKey",
        message: "Missing required field: sectionKey",
      });
    }

    // Meeting validation
    for (let j = 0; j < row.meetings.length; j++) {
      const meeting = row.meetings[j];

      // Meeting has days but no time (error)
      if (meeting.days && meeting.days !== "TBA") {
        if (meeting.startMin === null || meeting.startMin === undefined) {
          errors.push({
            type: "error",
            rowIndex: i,
            field: `meetings[${j}].startMin`,
            message: "Meeting has days but missing startMin",
            value: meeting.days,
          });
        }

        if (meeting.endMin === null || meeting.endMin === undefined) {
          errors.push({
            type: "error",
            rowIndex: i,
            field: `meetings[${j}].endMin`,
            message: "Meeting has days but missing endMin",
            value: meeting.days,
          });
        }

        // Invalid day codes (error)
        if (!isValidDayString(meeting.days)) {
          errors.push({
            type: "error",
            rowIndex: i,
            field: `meetings[${j}].days`,
            message: `Invalid day code: ${meeting.days}. Must be a combination of: M, T, W, R, F, S, U, or TBA`,
            value: meeting.days,
          });
        }

        // Invalid time range (error)
        if (
          meeting.startMin !== null &&
          meeting.endMin !== null &&
          meeting.startMin >= meeting.endMin
        ) {
          errors.push({
            type: "error",
            rowIndex: i,
            field: `meetings[${j}]`,
            message: `Invalid time range: startMin (${meeting.startMin}) >= endMin (${meeting.endMin})`,
          });
        }
      }

      // TBA meeting with times (warning)
      if (meeting.days === "TBA" && (meeting.startMin !== null || meeting.endMin !== null)) {
        warnings.push({
          type: "warning",
          rowIndex: i,
          field: `meetings[${j}]`,
          message: "TBA meeting has time values (should be null)",
        });
      }
    }

    // Modality/Status UNKNOWN (warning, or error in strict mode)
    if (row.modality === Modality.UNKNOWN) {
      const issue: Issue = {
        type: "warning",
        rowIndex: i,
        field: "modality",
        message: "Modality is UNKNOWN",
      };
      if (strict) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }

    if (row.status === SectionStatus.UNKNOWN) {
      const issue: Issue = {
        type: "warning",
        rowIndex: i,
        field: "status",
        message: "Status is UNKNOWN",
      };
      if (strict) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }

    // Missing optional fields (warnings)
    if (!row.instructor) {
      warnings.push({
        type: "warning",
        rowIndex: i,
        field: "instructor",
        message: "Missing instructor",
      });
    }

    if (!row.location && row.meetings.length === 0) {
      warnings.push({
        type: "warning",
        rowIndex: i,
        field: "location",
        message: "Missing location and no meetings",
      });
    }

    // Section with zero meetings (warning)
    if (row.meetings.length === 0) {
      warnings.push({
        type: "warning",
        rowIndex: i,
        field: "meetings",
        message: "Section has zero meetings",
      });
    }
  }

  const validRows = rows.length - errors.length;
  const invalidRows = errors.length;

  return {
    errors,
    warnings,
    stats: {
      totalRows: rows.length,
      validRows,
      invalidRows,
    },
  };
}

/**
 * Validate normalized requirement rows.
 */
export function validateRequirementRows(
  rows: NormalizedRequirementRow[]
): ValidationResult<NormalizedRequirementRow> {
  const errors: Issue[] = [];
  const warnings: Issue[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Required fields validation (errors)
    if (!row.subject || row.subject.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "subject",
        message: "Missing required field: subject",
      });
    }

    if (!row.number || row.number.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "number",
        message: "Missing required field: number",
      });
    }

    if (!row.requirementCode || row.requirementCode.trim() === "") {
      errors.push({
        type: "error",
        rowIndex: i,
        field: "requirementCode",
        message: "Missing required field: requirementCode",
      });
    }

    // Validate requirement code format (warning if doesn't start with GE-)
    if (row.requirementCode && !row.requirementCode.startsWith("GE-")) {
      warnings.push({
        type: "warning",
        rowIndex: i,
        field: "requirementCode",
        message: `Requirement code doesn't start with 'GE-': ${row.requirementCode}`,
        value: row.requirementCode,
      });
    }
  }

  const validRows = rows.length - errors.length;
  const invalidRows = errors.length;

  return {
    errors,
    warnings,
    stats: {
      totalRows: rows.length,
      validRows,
      invalidRows,
    },
  };
}

