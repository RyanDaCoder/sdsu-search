import * as fs from "fs";
import * as path from "path";
import Papa from "papaparse";
import type { ScheduleRow, RequirementRow, ScheduleMappingConfig, RequirementMappingConfig } from "../types";
import { parseTimeToMinutes, normalizeDays } from "../normalize";

/**
 * Find the first matching column header (case-insensitive).
 */
function findColumn(header: string, candidates: string[]): string | null {
  const lowerHeader = header.toLowerCase().trim();
  for (const candidate of candidates) {
    if (candidate.toLowerCase().trim() === lowerHeader) {
      return header; // Return original header for exact match
    }
  }
  return null;
}

/**
 * Find column index from mapping config.
 */
function findColumnIndex(headers: string[], candidates: string[] | undefined): number | null {
  if (!candidates || candidates.length === 0) return null;

  for (let i = 0; i < headers.length; i++) {
    if (findColumn(headers[i], candidates)) {
      return i;
    }
  }
  return null;
}

/**
 * Extract value from CSV row by column index.
 */
function getValue(row: string[], index: number | null): string | null {
  if (index === null || index < 0 || index >= row.length) return null;
  return row[index]?.trim() || null;
}

/**
 * Parse schedule CSV using mapping config.
 */
export function parseScheduleCsv(
  csvPath: string,
  mapping: ScheduleMappingConfig
): { rows: ScheduleRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: ScheduleRow[] = [];

  if (!fs.existsSync(csvPath)) {
    errors.push(`CSV file not found: ${csvPath}`);
    return { rows, errors };
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parseResult = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map((e) => `CSV parse error: ${e.message}`));
  }

  const dataRows = parseResult.data;
  if (dataRows.length === 0) {
    errors.push("CSV file is empty");
    return { rows, errors };
  }

  const headers = dataRows[0].map((h) => h.trim());
  const data = dataRows.slice(1);

  // Find column indices
  const colIndices = {
    termCode: findColumnIndex(headers, mapping.columns.termCode),
    subject: findColumnIndex(headers, mapping.columns.subject),
    number: findColumnIndex(headers, mapping.columns.number),
    sectionKey: findColumnIndex(headers, mapping.columns.sectionKey),
    title: findColumnIndex(headers, mapping.columns.title),
    units: findColumnIndex(headers, mapping.columns.units),
    status: findColumnIndex(headers, mapping.columns.status),
    modality: findColumnIndex(headers, mapping.columns.modality),
    instructor: findColumnIndex(headers, mapping.columns.instructor),
    location: findColumnIndex(headers, mapping.columns.location),
  };

  // Validate required columns
  const required = ["termCode", "subject", "number", "sectionKey"] as const;
  const missing = required.filter((key) => colIndices[key] === null);
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
    return { rows, errors };
  }

  // Log detected mapping
  console.log("Detected column mapping:");
  Object.entries(colIndices).forEach(([key, idx]) => {
    if (idx !== null) {
      console.log(`  ${key}: ${headers[idx]} (index ${idx})`);
    }
  });

  // Parse meetings based on mode
  let meetingIndices: {
    days?: number | null;
    startTime?: number | null;
    endTime?: number | null;
    meetingLocation?: number | null;
  } = {};

  let multiColumnMeetings: Array<{
    days: string;
    start?: number | null;
    end?: number | null;
  }> = [];

  if (mapping.meetingMode === "single" && mapping.singleMeeting) {
    meetingIndices = {
      days: findColumnIndex(headers, mapping.singleMeeting.days),
      startTime: findColumnIndex(headers, mapping.singleMeeting.startTime),
      endTime: findColumnIndex(headers, mapping.singleMeeting.endTime),
      meetingLocation: findColumnIndex(headers, mapping.singleMeeting.meetingLocation),
    };
  } else if (mapping.meetingMode === "multiColumn" && mapping.multiColumnMeetings) {
    multiColumnMeetings = mapping.multiColumnMeetings.map((mc) => ({
      days: mc.days,
      start: findColumnIndex(headers, mc.start),
      end: findColumnIndex(headers, mc.end),
    }));
  }

  // Parse each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    try {
      const termCode = getValue(row, colIndices.termCode!);
      const subject = getValue(row, colIndices.subject!);
      const number = getValue(row, colIndices.number!);
      const sectionKey = getValue(row, colIndices.sectionKey!);

      if (!termCode || !subject || !number || !sectionKey) {
        errors.push(`Row ${i + 2}: Missing required field`);
        continue;
      }

      const scheduleRow: ScheduleRow = {
        termCode,
        subject,
        number,
        sectionKey,
        title: getValue(row, colIndices.title) || undefined,
        units: getValue(row, colIndices.units) || undefined,
        status: getValue(row, colIndices.status) || undefined,
        modality: getValue(row, colIndices.modality) || undefined,
        instructor: getValue(row, colIndices.instructor) || undefined,
        location: getValue(row, colIndices.location) || undefined,
        meetings: [],
      };

      // Parse meetings
      if (mapping.meetingMode === "single") {
        const days = getValue(row, meetingIndices.days || null);
        const startTime = getValue(row, meetingIndices.startTime || null);
        const endTime = getValue(row, meetingIndices.endTime || null);
        const meetingLocation = getValue(row, meetingIndices.meetingLocation || null);

        if (days && startTime && endTime) {
          const normalizedDays = normalizeDays(days);
          const startMin = parseTimeToMinutes(startTime);
          const endMin = parseTimeToMinutes(endTime);

          if (normalizedDays && startMin !== null && endMin !== null) {
            scheduleRow.meetings = [
              {
                days: normalizedDays,
                startMin,
                endMin,
                location: meetingLocation || undefined,
              },
            ];
          }
        }
      } else if (mapping.meetingMode === "multiColumn") {
        const meetings: ScheduleRow["meetings"] = [];
        for (const mc of multiColumnMeetings) {
          const startTime = getValue(row, mc.start || null);
          const endTime = getValue(row, mc.end || null);
          if (startTime && endTime) {
            const startMin = parseTimeToMinutes(startTime);
            const endMin = parseTimeToMinutes(endTime);
            if (startMin !== null && endMin !== null) {
              meetings.push({
                days: mc.days,
                startMin,
                endMin,
              });
            }
          }
        }
        if (meetings.length > 0) {
          scheduleRow.meetings = meetings;
        }
      } else if (mapping.meetingMode === "perRow") {
        // Each row is a meeting; group by sectionKey
        // This is handled at a higher level
      }

      rows.push(scheduleRow);
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { rows, errors };
}

/**
 * Parse requirements CSV using mapping config.
 */
export function parseRequirementCsv(
  csvPath: string,
  mapping: RequirementMappingConfig
): { rows: RequirementRow[]; errors: string[] } {
  const errors: string[] = [];
  const rows: RequirementRow[] = [];

  if (!fs.existsSync(csvPath)) {
    errors.push(`CSV file not found: ${csvPath}`);
    return { rows, errors };
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parseResult = Papa.parse<string[]>(csvContent, {
    header: false,
    skipEmptyLines: true,
  });

  if (parseResult.errors.length > 0) {
    errors.push(...parseResult.errors.map((e) => `CSV parse error: ${e.message}`));
  }

  const dataRows = parseResult.data;
  if (dataRows.length === 0) {
    errors.push("CSV file is empty");
    return { rows, errors };
  }

  const headers = dataRows[0].map((h) => h.trim());
  const data = dataRows.slice(1);

  const colIndices = {
    subject: findColumnIndex(headers, mapping.columns.subject),
    number: findColumnIndex(headers, mapping.columns.number),
    requirementCode: findColumnIndex(headers, mapping.columns.requirementCode),
  };

  const required = ["subject", "number", "requirementCode"] as const;
  const missing = required.filter((key) => colIndices[key] === null);
  if (missing.length > 0) {
    errors.push(`Missing required columns: ${missing.join(", ")}`);
    return { rows, errors };
  }

  console.log("Detected column mapping:");
  Object.entries(colIndices).forEach(([key, idx]) => {
    if (idx !== null) {
      console.log(`  ${key}: ${headers[idx]} (index ${idx})`);
    }
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    try {
      const subject = getValue(row, colIndices.subject!);
      const number = getValue(row, colIndices.number!);
      const requirementCode = getValue(row, colIndices.requirementCode!);

      if (!subject || !number || !requirementCode) {
        errors.push(`Row ${i + 2}: Missing required field`);
        continue;
      }

      rows.push({ subject, number, requirementCode });
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { rows, errors };
}

