// Day filter options - only MWF and TR (R = Thursday)
export type DaysKey = "MWF" | "TR";

export type SearchFilters = {
  term?: string;
  q?: string;
  subject?: string;
  number?: string;
  days?: DaysKey[];
  timeStart?: number;
  timeEnd?: number;
  modality?: string;
  instructor?: string;
  ge?: string[];
};

export type ApiMeeting = {
  id: string;
  days: string; // "MWF", "TR", etc
  startMin: number;
  endMin: number;
  location?: string | null;
};

export type ApiInstructor = {
  id: string;
  name: string;
};

export type ApiSectionInstructor = {
  id: string;
  instructor: ApiInstructor;
};

export type ApiTerm = {
  id: string;
  code: string;
  name: string;
};

export type ApiSection = {
  id: string;
  sectionCode?: string | null;
  classNumber?: string | null;
  status?: string | null;
  modality?: string | null;
  capacity?: number | null;
  enrolled?: number | null;
  waitlist?: number | null;
  campus?: string | null;
  term: ApiTerm;
  meetings: ApiMeeting[];
  instructors: ApiSectionInstructor[];
};

export type SearchCourse = {
  id: string;
  subject: string;
  number: string;
  title?: string | null;
  units?: string | null;
  geCodes: string[];
  sections: ApiSection[];
};

export type SearchResponse = {
  count: number;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  results: SearchCourse[];
};
