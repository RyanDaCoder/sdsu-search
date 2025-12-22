import type { Meeting, SearchSection } from "@/lib/search/types";

export type Weekday = "M" | "T" | "W" | "R" | "F";

export type ScheduleItem = {
  // unique stable key for what user added
  sectionId: string;

  // display
  courseCode: string; // "CS 250"
  courseTitle?: string | null;

  // useful metadata
  termCode?: string | null;

  // the data we need for conflicts + calendar rendering
  meetings: Meeting[];

  // keep the original section shape if you want later
  section: SearchSection;
};

export type Conflict = {
  withSectionId: string;
  reason: string;
};
