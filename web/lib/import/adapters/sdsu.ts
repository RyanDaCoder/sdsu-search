/**
 * SDSU-specific adapter (placeholder).
 * This is the same as genericCsv but with an example SDSU mapping config.
 * When real SDSU CSV format is known, update the mapping configs.
 */

import { parseScheduleCsv, parseRequirementCsv } from "./genericCsv";
import type { ScheduleMappingConfig, RequirementMappingConfig } from "../types";

/**
 * Example SDSU schedule mapping config.
 * Update this when real SDSU CSV format is known.
 */
export const sdsuScheduleMapping: ScheduleMappingConfig = {
  columns: {
    termCode: ["TERM", "Term", "term_code", "TERM_CODE"],
    subject: ["SUBJ", "Subject", "subject", "SUBJECT"],
    number: ["CATALOG_NBR", "Course", "course_number", "NUMBER"],
    sectionKey: ["CLASS_NBR", "CRN", "Section", "section", "SECTION"],
    title: ["TITLE", "Course Title", "title"],
    units: ["UNITS", "Units", "units"],
    status: ["STATUS", "Enrollment Status", "status"],
    modality: ["MODALITY", "Instruction Mode", "modality", "MODE"],
    instructor: ["INSTRUCTOR", "Instructor", "instructor"],
    location: ["ROOM", "Location", "location"],
  },
  meetingMode: "single",
  singleMeeting: {
    days: ["DAYS", "Days", "days"],
    startTime: ["START", "Start Time", "start_time", "START_TIME"],
    endTime: ["END", "End Time", "end_time", "END_TIME"],
    meetingLocation: ["ROOM", "Meeting Location", "meeting_location"],
  },
  valueMaps: {
    modality: {
      "Face-to-Face": "IN_PERSON",
      "In Person": "IN_PERSON",
      "Online": "ONLINE_ASYNC",
      "Online Synchronous": "ONLINE_SYNC",
      "Hybrid": "HYBRID",
    },
    status: {
      Open: "OPEN",
      Closed: "CLOSED",
      Waitlist: "WAITLIST",
    },
  },
};

/**
 * Example SDSU requirements mapping config.
 */
export const sdsuRequirementMapping: RequirementMappingConfig = {
  columns: {
    subject: ["SUBJECT", "Subject", "subj", "SUBJ"],
    number: ["COURSE", "Course", "catalog_nbr", "CATALOG_NBR"],
    requirementCode: ["REQUIREMENT", "Requirement", "ge", "GE"],
  },
};

/**
 * Parse SDSU schedule CSV.
 */
export function parseSdsuScheduleCsv(csvPath: string) {
  return parseScheduleCsv(csvPath, sdsuScheduleMapping);
}

/**
 * Parse SDSU requirements CSV.
 */
export function parseSdsuRequirementCsv(csvPath: string) {
  return parseRequirementCsv(csvPath, sdsuRequirementMapping);
}

