import { NextResponse } from "next/server";
import { PrismaClient, Modality } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function parseIntOrNull(v: string | null) {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// days filter helper: "MWF" should match meeting.days containing M/W/F
function buildDaysWhere(days: string) {
  // normalize like "mwf" -> "MWF"
  const letters = days.toUpperCase().replace(/[^MTWRFS]/g, "");
  if (!letters) return undefined;

  // require meeting.days contains every selected day
  return {
    AND: letters.split("").map((d) => ({
      days: { contains: d },
    })),
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

  const days = (searchParams.get("days") ?? "").trim(); // e.g. "MWF" or "TR"
  const timeStart = parseIntOrNull(searchParams.get("timeStart")); // minutes
  const timeEnd = parseIntOrNull(searchParams.get("timeEnd")); // minutes

  const instructor = (searchParams.get("instructor") ?? "").trim();

  // meeting filter
  const meetingWhere: any = {};
  const daysWhere = days ? buildDaysWhere(days) : undefined;
  if (daysWhere) Object.assign(meetingWhere, daysWhere);

  if (timeStart !== null) meetingWhere.startMin = { gte: timeStart };
  if (timeEnd !== null) meetingWhere.endMin = { lte: timeEnd };

  const sectionWhere: any = {
    term: { code: termCode },
  };

  if (modality) sectionWhere.modality = modality;

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
  if (subject) courseWhere.subject = subject;
  if (number) courseWhere.number = { startsWith: number };

  if (q) {
    courseWhere.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { subject: { contains: q.toUpperCase() } },
      { number: { contains: q } },
    ];
  }

  // Find courses that have at least one section that matches filters
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
    },
    orderBy: [{ subject: "asc" }, { number: "asc" }],
    take: 50,
  });

  return NextResponse.json({
    count: results.length,
    results,
  });
}
