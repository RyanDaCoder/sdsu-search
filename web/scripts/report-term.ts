#!/usr/bin/env node

import { PrismaClient, Modality, SectionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";

config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in web/.env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  let termCode: string | null = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--term" && i + 1 < args.length) {
      termCode = args[i + 1];
      i++;
    }
  }

  if (!termCode) {
    console.error("Usage: tsx scripts/report-term.ts --term <termCode>");
    process.exit(1);
  }

  // Find term
  const term = await prisma.term.findUnique({
    where: { code: termCode },
  });

  if (!term) {
    console.error(`Term not found: ${termCode}`);
    process.exit(1);
  }

  console.log(`\n📊 Data Quality Report for Term ${termCode} (${term.name})\n`);
  console.log("=" .repeat(60));

  // Get totals
  const courses = await prisma.course.count({
    where: { sections: { some: { termId: term.id } } },
  });

  const sections = await prisma.section.count({
    where: { termId: term.id },
  });

  const meetings = await prisma.meeting.count({
    where: { section: { termId: term.id } },
  });

  const requirements = await prisma.requirement.count();

  const courseRequirements = await prisma.courseRequirement.count({
    where: {
      course: {
        sections: { some: { termId: term.id } },
      },
    },
  });

  const instructors = await prisma.instructor.count({
    where: {
      sections: {
        some: {
          section: {
            termId: term.id,
          },
        },
      },
    },
  });

  console.log("\n📈 Totals:");
  console.log(`  Courses: ${courses}`);
  console.log(`  Sections: ${sections}`);
  console.log(`  Meetings: ${meetings}`);
  console.log(`  Requirements: ${requirements}`);
  console.log(`  Course-Requirement links: ${courseRequirements}`);
  console.log(`  Instructors: ${instructors}`);

  // Find issues
  const issues: Array<{ type: string; section: string; course: string; message: string }> = [];

  // Sections with zero meetings
  const sectionsWithNoMeetings = await prisma.section.findMany({
    where: {
      termId: term.id,
      meetings: { none: {} },
    },
    include: {
      course: true,
    },
  });

  sectionsWithNoMeetings.forEach((section) => {
    issues.push({
      type: "zero-meetings",
      section: section.classNumber || section.sectionCode || "unknown",
      course: `${section.course.subject} ${section.course.number}`,
      message: "Section has zero meetings",
    });
  });

  // Meetings with invalid times
  const allMeetings = await prisma.meeting.findMany({
    where: { section: { termId: term.id } },
    include: {
      section: {
        include: { course: true },
      },
    },
  });

  allMeetings.forEach((meeting) => {
    // TBA meetings with null times are valid (e.g., async courses)
    const isTBA = meeting.days === "TBA" || meeting.days === null;
    if ((meeting.startMin === null || meeting.endMin === null) && !isTBA) {
      issues.push({
        type: "null-time",
        section: meeting.section.classNumber || meeting.section.sectionCode || "unknown",
        course: `${meeting.section.course.subject} ${meeting.section.course.number}`,
        message: `Meeting has null time (days: ${meeting.days || "null"})`,
      });
    } else if (meeting.startMin !== null && meeting.endMin !== null && meeting.startMin >= meeting.endMin) {
      issues.push({
        type: "invalid-time-range",
        section: meeting.section.classNumber || meeting.section.sectionCode || "unknown",
        course: `${meeting.section.course.subject} ${meeting.section.course.number}`,
        message: `Invalid time range: ${meeting.startMin} >= ${meeting.endMin} (days: ${meeting.days || "null"})`,
      });
    }

    // Check for invalid day codes
    if (meeting.days && meeting.days !== "TBA") {
      const allowedDays = new Set(["M", "T", "W", "R", "F", "S", "U"]);
      const allowedCombos = new Set(["M", "T", "W", "R", "F", "S", "U", "MW", "TR", "MWF"]);
      const chars = meeting.days.split("");
      const hasInvalidChar = chars.some((char) => !allowedDays.has(char));
      const isInvalidCombo = !allowedCombos.has(meeting.days);

      if (hasInvalidChar || isInvalidCombo) {
        issues.push({
          type: "invalid-days",
          section: meeting.section.classNumber || meeting.section.sectionCode || "unknown",
          course: `${meeting.section.course.subject} ${meeting.section.course.number}`,
          message: `Invalid day code: "${meeting.days}"`,
        });
      }
    }
  });

  // Sections with UNKNOWN modality/status
  const sectionsWithUnknown = await prisma.section.findMany({
    where: {
      termId: term.id,
      OR: [{ modality: Modality.UNKNOWN }, { status: SectionStatus.UNKNOWN }],
    },
    include: { course: true },
  });

  sectionsWithUnknown.forEach((section) => {
    const problems: string[] = [];
    if (section.modality === Modality.UNKNOWN) problems.push("modality UNKNOWN");
    if (section.status === SectionStatus.UNKNOWN) problems.push("status UNKNOWN");

    issues.push({
      type: "unknown-enum",
      section: section.classNumber || section.sectionCode || "unknown",
      course: `${section.course.subject} ${section.course.number}`,
      message: problems.join(", "),
    });
  });

  // Check for duplicate sections (by termId + courseId + classNumber)
  const sectionGroups = await prisma.section.groupBy({
    by: ["termId", "courseId", "classNumber"],
    where: {
      termId: term.id,
      classNumber: { not: null },
    },
    _count: true,
  });

  sectionGroups
    .filter((g) => g._count > 1)
    .forEach((group) => {
      issues.push({
        type: "duplicate-section",
        section: group.classNumber || "unknown",
        course: "multiple",
        message: `Found ${group._count} sections with same classNumber`,
      });
    });

  // Print issues by category
  const issueTypes = [
    "zero-meetings",
    "null-time",
    "invalid-time-range",
    "invalid-days",
    "unknown-enum",
    "duplicate-section",
  ];

  let hasCriticalIssues = false;

  issueTypes.forEach((type) => {
    const typeIssues = issues.filter((i) => i.type === type);
    if (typeIssues.length > 0) {
      const isCritical = type !== "zero-meetings" && type !== "unknown-enum";
      if (isCritical) hasCriticalIssues = true;

      console.log(`\n${isCritical ? "❌" : "⚠️"} ${type.replace(/-/g, " ").toUpperCase()}: ${typeIssues.length}`);
      typeIssues.slice(0, 10).forEach((issue) => {
        console.log(`   ${issue.course} - Section ${issue.section}: ${issue.message}`);
      });
      if (typeIssues.length > 10) {
        console.log(`   ... and ${typeIssues.length - 10} more`);
      }
    }
  });

  if (issues.length === 0) {
    console.log("\n✅ No issues found!");
  }

  console.log("\n" + "=".repeat(60));
  console.log(`\nTotal issues: ${issues.length}`);
  console.log(`Critical issues: ${issues.filter((i) => i.type !== "zero-meetings" && i.type !== "unknown-enum").length}`);

  await prisma.$disconnect();

  // Exit with error code if critical issues found
  process.exit(hasCriticalIssues ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

