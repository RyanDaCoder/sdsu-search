import { Modality, SectionStatus } from "@prisma/client";

/**
 * Canonical internal format for a schedule row.
 * This is what we normalize external CSV data into.
 */
export type ScheduleRow = {
  // Required fields
  termCode: string; // e.g., "20261"
  subject: string; // e.g., "CS"
  number: string; // e.g., "250"
  sectionKey: string; // External unique section identifier; can be "01" or "12345"

  // Optional fields
  title?: string;
  units?: string;
  status?: string; // Will be normalized to SectionStatus enum
  modality?: string; // Will be normalized to Modality enum
  instructor?: string;
  location?: string;

  // Meetings array (can be empty)
  meetings?: Array<{
    days: string; // Use same format as DB/seed: "MWF", "TR", etc.
    startMin: number; // minutes from midnight
    endMin: number;
    location?: string;
  }>;
};

/**
 * Canonical internal format for a requirement row.
 */
export type RequirementRow = {
  subject: string;
  number: string;
  requirementCode: string; // e.g., "GE-IIB"
};

/**
 * Mapping configuration for schedule CSV import.
 */
export type ScheduleMappingConfig = {
  columns: {
    termCode?: string[];
    subject?: string[];
    number?: string[];
    sectionKey?: string[];
    title?: string[];
    units?: string[];
    status?: string[];
    modality?: string[];
    instructor?: string[];
    location?: string[];
  };
  meetingMode: "single" | "perRow" | "multiColumn";
  singleMeeting?: {
    days?: string[];
    startTime?: string[];
    endTime?: string[];
    meetingLocation?: string[];
  };
  multiColumnMeetings?: Array<{
    days: string;
    start?: string[];
    end?: string[];
  }>;
  valueMaps?: {
    modality?: Record<string, string>;
    status?: Record<string, string>;
  };
};

/**
 * Mapping configuration for requirements CSV import.
 */
export type RequirementMappingConfig = {
  columns: {
    subject?: string[];
    number?: string[];
    requirementCode?: string[];
  };
};

/**
 * Normalized values ready for Prisma.
 */
export type NormalizedScheduleRow = {
  termCode: string;
  subject: string;
  number: string;
  sectionKey: string;
  title?: string;
  units?: string;
  status: SectionStatus;
  modality: Modality;
  instructor?: string;
  location?: string;
  meetings: Array<{
    days: string;
    startMin: number;
    endMin: number;
    location?: string;
  }>;
};

export type NormalizedRequirementRow = {
  subject: string;
  number: string;
  requirementCode: string;
};

