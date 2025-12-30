export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { Modality } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function parseIntOrNull(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// days filter helper: 
// - All day filters use contains logic for consistency
// - Single day (M, T, W, R, F): contains the day (e.g., "M" matches "M", "MWF", "MW", etc.)
// - Combinations (MW, TR, MWF, etc.): contains all selected days (e.g., "MWF" matches "MWF" or "MWFR")
function buildDaysWhere(days: string) {
  // normalize like "mwf" -> "MWF"
  const normalized = days.toUpperCase().replace(/[^MTWRFS]/g, "");
  if (!normalized) return undefined;

  // Single letter = contains match (e.g., "M" matches "M", "MWF", "MW", etc.)
  if (normalized.length === 1) {
    return {
      days: { 
        not: null,
        contains: normalized 
      },
    };
  }

  // Multiple letters = contains all selected days (e.g., "MWF" matches meetings with M AND W AND F)
  const letters = normalized.split("");
  return {
    AND: [
      { days: { not: null } },
      ...letters.map((d) => ({
        days: { contains: d },
      })),
    ],
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const termCode = searchParams.get("term") ?? "GROSSMONT_2026SP";

  const q = (searchParams.get("q") ?? "").trim();
  const subject = (searchParams.get("subject") ?? "").trim().toUpperCase();
  const number = (searchParams.get("number") ?? "").trim();

  const modalityRaw = (searchParams.get("modality") ?? "").trim().toUpperCase();
  const modality =
    modalityRaw && Object.keys(Modality).includes(modalityRaw)
      ? (modalityRaw as Modality)
      : null;

  // Support multiple day filters: ?days=M&days=W or ?days=MWF
  const daysParams = searchParams.getAll("days").filter(Boolean);
  const days = daysParams.length > 0 ? daysParams : (searchParams.get("days") ? [searchParams.get("days")!] : []);
  const timeStart = parseIntOrNull(searchParams.get("timeStart")); // minutes
  const timeEnd = parseIntOrNull(searchParams.get("timeEnd")); // minutes

  const instructorRaw = searchParams.get("instructor");
  const instructor = instructorRaw ? instructorRaw.trim() : null;

  // GE filter: parse multiple ?ge=GE-IIB&ge=GE-IVC params
  const geCodes = searchParams.getAll("ge").filter(Boolean).map((g) => g.trim());

  // Open seats only filter
  const openSeatsOnly = searchParams.get("openSeatsOnly") === "true";

  // Pagination
  const page = Math.max(1, parseIntOrNull(searchParams.get("page")) ?? 1);
  const pageSize = Math.min(100, Math.max(1, parseIntOrNull(searchParams.get("pageSize")) ?? 20));
  const skip = (page - 1) * pageSize;

  // meeting filter
  const meetingWhere: any = {};
  
  // Handle multiple day filters with OR logic
  // Time constraints must be included within each OR branch
  if (days.length > 0) {
    const daysWheres = days
      .map((d) => {
        const dayWhere = buildDaysWhere(d);
        if (!dayWhere) return null;
        
        // Include time constraints within each day filter branch
        const combinedWhere: any = { ...dayWhere };
        if (timeStart !== null) combinedWhere.startMin = { gte: timeStart };
        if (timeEnd !== null) combinedWhere.endMin = { lte: timeEnd };
        
        return combinedWhere;
      })
      .filter((dw): dw is NonNullable<typeof dw> => dw !== undefined);
    
    if (daysWheres.length > 0) {
      // If multiple day filters, use OR logic (match if meeting matches ANY selected day filter)
      if (daysWheres.length === 1) {
        Object.assign(meetingWhere, daysWheres[0]);
      } else {
        meetingWhere.OR = daysWheres;
      }
    }
  } else {
    // No day filters, but we might have time filters
    if (timeStart !== null) meetingWhere.startMin = { gte: timeStart };
    if (timeEnd !== null) meetingWhere.endMin = { lte: timeEnd };
  }

  const sectionWhere: any = {
    term: { code: termCode },
  };

  if (modality) sectionWhere.modality = modality;

  // Note: openSeatsOnly filter will be applied in post-processing since Prisma
  // doesn't easily support computed fields (capacity - enrolled) in where clauses

  // Only apply meetingWhere if user actually provided meeting filters
  if (Object.keys(meetingWhere).length > 0) {
    sectionWhere.meetings = { some: meetingWhere };
  }

  if (instructor) {
    sectionWhere.instructors = {
      some: {
        instructor: {
          name: { contains: instructor, mode: "insensitive" },
        },
      },
    };
  }

  const courseWhere: any = {};
  
  // Subject and number filters (AND)
  if (subject) courseWhere.subject = subject;
  if (number) courseWhere.number = { startsWith: number };

  // GE filter: course matches if ANY selected GE code matches (OR logic via 'in')
  if (geCodes.length > 0) {
    courseWhere.requirements = {
      some: {
        requirement: {
          code: { in: geCodes },
        },
      },
    };
  }

  // Q filter: title OR subject OR number (OR internally, ANDed with other filters)
  if (q) {
    const qConditions = [
      { title: { contains: q, mode: "insensitive" } },
      { subject: { contains: q.toUpperCase() } },
      { number: { contains: q } },
    ];
    
    // If we have other filters, combine with AND
    if (subject || number || geCodes.length > 0) {
      const otherConditions: any = {};
      if (subject) otherConditions.subject = subject;
      if (number) otherConditions.number = { startsWith: number };
      if (geCodes.length > 0) {
        otherConditions.requirements = courseWhere.requirements;
      }
      courseWhere.AND = [{ OR: qConditions }, otherConditions];
      // Clear individual fields
      delete courseWhere.subject;
      delete courseWhere.number;
      delete courseWhere.requirements;
    } else {
      // Only q filter
      courseWhere.OR = qConditions;
    }
  }

  // When openSeatsOnly is enabled, we must fetch all results, filter them, then paginate
  // because pagination must be applied AFTER filtering to be accurate
  let total: number;
  let transformedResults: any[];
  
  if (openSeatsOnly) {
    // Fetch ALL matching courses (no pagination yet)
    const allResults = await prisma.course.findMany({
      where: {
        ...courseWhere,
        sections: { some: sectionWhere },
      },
      include: {
        sections: {
          where: sectionWhere,
          include: {
            meetings: true,
            instructors: { include: { instructor: true } },
            term: true,
          },
          orderBy: [{ sectionCode: "asc" }],
        },
        requirements: {
          include: {
            requirement: true,
          },
        },
      },
      orderBy: [{ subject: "asc" }, { number: "asc" }],
    });

    // Transform and filter by open seats
    const filteredResults = allResults
      .map((course) => {
        const { requirements, ...courseData } = course;
        
        // Filter sections by open seats
        const filteredSections = courseData.sections.filter((section) => {
          // Only include sections where we have both capacity and enrolled data
          // and there are open seats (capacity > enrolled)
          if (section.capacity != null && section.enrolled != null) {
            return section.capacity > section.enrolled;
          }
          // If capacity or enrolled is null, we can't determine if there are open seats
          // So exclude the section when openSeatsOnly is true
          // This is correct behavior - we only want sections we KNOW have open seats
          return false;
        });
        
        return {
          ...courseData,
          sections: filteredSections,
          geCodes: requirements.map((cr) => cr.requirement.code),
        };
      })
      .filter((course) => course.sections.length > 0); // Remove courses with no open sections

    total = filteredResults.length;
    
    // Apply pagination AFTER filtering
    transformedResults = filteredResults.slice(skip, skip + pageSize);
  } else {
    // For non-openSeatsOnly, we can use efficient database pagination
    const results = await prisma.course.findMany({
      where: {
        ...courseWhere,
        sections: { some: sectionWhere },
      },
      include: {
        sections: {
          where: sectionWhere,
          include: {
            meetings: true,
            instructors: { include: { instructor: true } },
            term: true,
          },
          orderBy: [{ sectionCode: "asc" }],
        },
        requirements: {
          include: {
            requirement: true,
          },
        },
      },
      orderBy: [{ subject: "asc" }, { number: "asc" }],
      skip,
      take: pageSize,
    });

    // Transform results to include geCodes from requirements
    transformedResults = results.map((course) => {
      const { requirements, ...courseData } = course;
      return {
        ...courseData,
        sections: courseData.sections,
        geCodes: requirements.map((cr) => cr.requirement.code),
      };
    });

    // Count total matching courses
    total = await prisma.course.count({
      where: {
        ...courseWhere,
        sections: { some: sectionWhere },
      },
    });
  }

  return NextResponse.json({
    count: transformedResults.length,
    total,
    page,
    pageSize,
    hasMore: skip + transformedResults.length < total,
    results: transformedResults,
  });
}
