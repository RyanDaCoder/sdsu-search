#!/usr/bin/env node

/**
 * Grossmont College Spring 2026 Schedule Import
 * 
 * This script imports course schedule data from a PDF text file into the database.
 * 
 * Prerequisites:
 * 1. Download PDF: The PDF should be at data/grossmont/2026sp.pdf
 * 2. Convert to text: Run pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt
 *    (or use an online converter if pdftotext is not available)
 * 
 * Usage:
 *   npm run import:grossmont
 *   npm run import:grossmont -- --dry-run
 */

import * as fs from "fs";
import * as path from "path";
import { PrismaClient, Modality } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { normalizeDays, parseTimeToMinutes, normalizeModality } from "../lib/import/normalize";
import type { ScheduleRow } from "../lib/import/types";

config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in web/.env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const TERM_CODE = "GROSSMONT_2026SP";
const TERM_NAME = "Grossmont Spring 2026";
const TERM_STARTS_AT = new Date("2026-02-02");
const TERM_ENDS_AT = new Date("2026-06-01");

/**
 * Check if a line is a subject header (all caps, no numbers, < 40 chars)
 * Examples: "ANTHROPOLOGY", "BIOLOGICAL SCIENCES"
 */
function isSubjectHeader(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length >= 40) return false;
  
  // Must be all uppercase letters and spaces
  if (!/^[A-Z\s]+$/.test(trimmed)) return false;
  
  // No numbers
  if (/\d/.test(trimmed)) return false;
  
  // Must have at least 3 characters
  if (trimmed.length < 3) return false;
  
  // Exclude common non-subject headers
  const exclude = ["SPRING", "CLASS", "SCHEDULE", "CATALOG", "DISCLAIMER", "FREQUENTLY", "STEPS"];
  if (exclude.some(e => trimmed.includes(e))) return false;
  
  return true;
}

/**
 * Parse a course definition line (e.g., "+#   ANTH-120        Cultural Anthropology                               3.00")
 * Returns subject, course number, title, units, and requirement flags, or null
 * + = CSU GE, # = Grossmont College GE
 */
function parseCourseDefinition(line: string): { 
  subject: string; 
  number: string; 
  title?: string; 
  units?: string;
  hasCsuGe: boolean;
  hasGrossmontGe: boolean;
} | null {
  const trimmed = line.trim();
  // Pattern: +#   SUBJ-NUMBER   Title    Units
  const match = trimmed.match(/^([+\#\s]*)([A-Z]+)-(\d+[A-Z]?)\s+(.+?)\s+(\d+\.\d+)$/);
  if (match) {
    const [, flags, subject, number, title, units] = match;
    const hasCsuGe = flags.includes("+");
    const hasGrossmontGe = flags.includes("#");
    return {
      subject: subject.trim(),
      number: number.trim(),
      title: title.trim() || undefined,
      units: units.trim() || undefined,
      hasCsuGe,
      hasGrossmontGe,
    };
  }
  return null;
}

/**
 * Parse a section row from the text file
 * Grossmont format examples:
 * - "6164 09:30AM-10:50AM   MW         36-150       L.Braff" (in-person)
 * - "6852 TBA                          WEB-WEB      L.Braff" (online)
 * - "S   6370 TBA                          WEB-WEB      L.Braff      Jan 05-Jan 31" (short-term online)
 */
function parseSectionRow(line: string, currentSubject: string, currentCourseNumber: string): ScheduleRow | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 5) return null;
  
  // Remove optional "S" prefix for short-term classes
  const cleaned = trimmed.replace(/^S\s+/, "");
  
  // Pattern 1: In-person with time: "6164 09:30AM-10:50AM   MW         36-150       L.Braff"
  const inPersonPattern = /^(\d{4})\s+(\d{1,2}:\d{2}(?:AM|PM))-(\d{1,2}:\d{2}(?:AM|PM))\s+([MTWRFSU]+)\s+([A-Z0-9\-]+)\s+(.+)$/i;
  const inPersonMatch = cleaned.match(inPersonPattern);
  
  if (inPersonMatch) {
    const [, section, startTime, endTime, days, location, instructor] = inPersonMatch;
    
    const normalizedDays = normalizeDays(days);
    const startMin = parseTimeToMinutes(startTime);
    const endMin = parseTimeToMinutes(endTime);
    
    if (!normalizedDays || startMin === null || endMin === null) return null;
    
    return {
      termCode: TERM_CODE,
      subject: currentSubject,
      number: currentCourseNumber,
      sectionKey: section.trim(),
      instructor: instructor.trim() || undefined,
      location: location.trim() || undefined,
      modality: "IN_PERSON",
      meetings: [{
        days: normalizedDays,
        startMin,
        endMin,
        location: location.trim() || undefined,
      }],
    };
  }
  
  // Pattern 2: Online (TBA): "6852 TBA                          WEB-WEB      L.Braff"
  const onlinePattern = /^(\d{4})\s+TBA\s+WEB-WEB\s+(.+?)(?:\s+[A-Z][a-z]{2}\s+\d{2}-[A-Z][a-z]{2}\s+\d{2})?$/i;
  const onlineMatch = cleaned.match(onlinePattern);
  
  if (onlineMatch) {
    const [, section, instructor] = onlineMatch;
    
    return {
      termCode: TERM_CODE,
      subject: currentSubject,
      number: currentCourseNumber,
      sectionKey: section.trim(),
      instructor: instructor.trim() || undefined,
      location: "ONLINE",
      modality: "ONLINE_ASYNC",
      meetings: [], // Online async has no scheduled meetings
    };
  }
  
  return null;
}

export async function importGrossmontData(dryRun: boolean = false) {
  
  const textFilePath = path.resolve("data/grossmont/2026sp.txt");
  
  if (!fs.existsSync(textFilePath)) {
    console.error(`❌ Text file not found: ${textFilePath}`);
    console.error("");
    console.error("Please convert the PDF to text first:");
    console.error("  pdftotext -layout data/grossmont/2026sp.pdf data/grossmont/2026sp.txt");
    console.error("");
    console.error("Or use an online PDF to text converter and save as data/grossmont/2026sp.txt");
    process.exit(1);
  }
  
  console.log(`📄 Reading text file: ${textFilePath}`);
  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No database changes will be made");
  }
  console.log("");
  
  // Read and parse text file
  const textContent = fs.readFileSync(textFilePath, "utf-8");
  const lines = textContent.split(/\r?\n/);
  
  let currentSubject = "";
  let currentCourseNumber = "";
  let currentCourseTitle: string | undefined = undefined;
  let currentCourseUnits: string | undefined = undefined;
  const rows: ScheduleRow[] = [];
  // Track requirements: courseKey -> requirement codes
  const courseRequirements = new Map<string, string[]>();
  let lineNumber = 0;
  
  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    
    // Check if this is a subject header
    if (isSubjectHeader(line)) {
      currentSubject = trimmed;
      currentCourseNumber = "";
      currentCourseTitle = undefined;
      currentCourseUnits = undefined;
      continue;
    }
    
    // Skip empty lines
    if (!trimmed) continue;
    
    // Check if this is a course definition line (e.g., "+#   ANTH-120        Cultural Anthropology                               3.00")
    const courseDef = parseCourseDefinition(line);
    if (courseDef) {
      // Course definition includes subject, so update it
      currentSubject = courseDef.subject;
      currentCourseNumber = courseDef.number;
      currentCourseTitle = courseDef.title;
      currentCourseUnits = courseDef.units;
      
      // Track requirements for this course
      const courseKey = `${courseDef.subject}|${courseDef.number}`;
      const requirements: string[] = [];
      if (courseDef.hasCsuGe) {
        requirements.push("CSU-GE");
      }
      if (courseDef.hasGrossmontGe) {
        requirements.push("GROSSMONT-GE");
      }
      if (requirements.length > 0) {
        courseRequirements.set(courseKey, requirements);
      }
      continue;
    }
    
    // Try to parse as section row
    if (currentSubject && currentCourseNumber) {
      const row = parseSectionRow(line, currentSubject, currentCourseNumber);
      if (row) {
        // Add course title and units if available
        if (currentCourseTitle) row.title = currentCourseTitle;
        if (currentCourseUnits) row.units = currentCourseUnits;
        rows.push(row);
      }
    }
  }
  
  console.log(`✅ Parsed ${rows.length} course sections`);
  console.log(`📚 Found ${new Set(rows.map(r => `${r.subject} ${r.number}`)).size} unique courses`);
  console.log("");
  
  if (rows.length === 0) {
    console.error("❌ No course rows found. Please check the text file format.");
    process.exit(1);
  }
  
  if (dryRun) {
    console.log("Would import:");
    console.log(`  Term: ${TERM_CODE} (${TERM_NAME})`);
    console.log(`  ${new Set(rows.map(r => `${r.subject} ${r.number}`)).size} courses`);
    console.log(`  ${rows.length} sections`);
    console.log(`  ${rows.reduce((sum, r) => sum + (r.meetings?.length || 0), 0)} meetings`);
    console.log("");
    await prisma.$disconnect();
    return;
  }
  
  // Upsert Term first
  console.log("📅 Upserting term...");
  const term = await prisma.term.upsert({
    where: { code: TERM_CODE },
    update: {
      name: TERM_NAME,
      startsAt: TERM_STARTS_AT,
      endsAt: TERM_ENDS_AT,
    },
    create: {
      code: TERM_CODE,
      name: TERM_NAME,
      startsAt: TERM_STARTS_AT,
      endsAt: TERM_ENDS_AT,
    },
  });
  console.log(`✅ Term: ${term.code} (${term.name})`);
  console.log("");
  
  // Group rows by course for efficient processing
  const courseMap = new Map<string, ScheduleRow[]>();
  for (const row of rows) {
    const key = `${row.subject}|${row.number}`;
    if (!courseMap.has(key)) {
      courseMap.set(key, []);
    }
    courseMap.get(key)!.push(row);
  }
  
  let coursesCreated = 0;
  let coursesUpdated = 0;
  let sectionsCreated = 0;
  let sectionsUpdated = 0;
  let meetingsCreated = 0;
  let instructorsCreated = 0;
  
  console.log("📦 Importing courses, sections, and meetings...");
  
  for (const [courseKey, sectionRows] of courseMap.entries()) {
    const firstRow = sectionRows[0];
    
    // Upsert Course
    const course = await prisma.course.upsert({
      where: {
        subject_number: {
          subject: firstRow.subject,
          number: firstRow.number,
        },
      },
      update: {
        title: firstRow.title,
        units: firstRow.units,
      },
      create: {
        subject: firstRow.subject,
        number: firstRow.number,
        title: firstRow.title,
        units: firstRow.units,
      },
    });
    
    if (course.createdAt.getTime() === course.updatedAt.getTime()) {
      coursesCreated++;
    } else {
      coursesUpdated++;
    }
    
    // Process each section
    for (const row of sectionRows) {
      // Upsert Instructor if provided
      let instructorId: string | null = null;
      if (row.instructor && row.instructor.trim()) {
        const instructor = await prisma.instructor.upsert({
          where: { name: row.instructor.trim() },
          update: {},
          create: { name: row.instructor.trim() },
        });
        if (instructor.createdAt.getTime() === instructor.updatedAt.getTime()) {
          instructorsCreated++;
        }
        instructorId = instructor.id;
      }
      
      // Upsert Section
      // Use sectionKey as classNumber for Grossmont
      // Note: Unique constraint is on (termId, classNumber), so we search by that
      let section = await prisma.section.findFirst({
        where: {
          termId: term.id,
          classNumber: row.sectionKey,
        },
      });
      
      if (!section) {
        section = await prisma.section.create({
          data: {
            termId: term.id,
            courseId: course.id,
            classNumber: row.sectionKey,
            sectionCode: row.sectionKey,
            modality: normalizeModality(row.modality),
            campus: row.location,
          },
        });
        sectionsCreated++;
      } else {
        section = await prisma.section.update({
          where: { id: section.id },
          data: {
            modality: normalizeModality(row.modality),
            campus: row.location,
          },
        });
        sectionsUpdated++;
      }
      
      // Link instructor to section
      if (instructorId) {
        await prisma.sectionInstructor.upsert({
          where: {
            sectionId_instructorId: {
              sectionId: section.id,
              instructorId: instructorId,
            },
          },
          update: {},
          create: {
            sectionId: section.id,
            instructorId: instructorId,
          },
        });
      }
      
      // Delete existing meetings and recreate
      await prisma.meeting.deleteMany({
        where: { sectionId: section.id },
      });
      
      // Create meetings
      if (row.meetings && row.meetings.length > 0) {
        await prisma.meeting.createMany({
          data: row.meetings.map((m) => ({
            sectionId: section.id,
            days: m.days,
            startMin: m.startMin,
            endMin: m.endMin,
            location: m.location,
          })),
        });
        meetingsCreated += row.meetings.length;
      }
    }
  }
  
  console.log("");
  console.log("✅ Import complete!");
  console.log("");
  console.log("Summary:");
  console.log(`  Courses: ${coursesCreated} created, ${coursesUpdated} updated`);
  console.log(`  Sections: ${sectionsCreated} created, ${sectionsUpdated} updated`);
  console.log(`  Meetings: ${meetingsCreated} created`);
  console.log(`  Instructors: ${instructorsCreated} created`);
  console.log("");
  
  // Import requirements
  if (courseRequirements.size > 0) {
    console.log("📋 Importing requirements...");
    let requirementsCreated = 0;
    let requirementsUpdated = 0;
    let linksCreated = 0;
    let linksSkipped = 0;
    
    for (const [courseKey, requirementCodes] of courseRequirements.entries()) {
      const [subject, number] = courseKey.split("|");
      
      // Find the course
      const course = await prisma.course.findUnique({
        where: {
          subject_number: {
            subject,
            number,
          },
        },
      });
      
      if (!course) {
        console.warn(`⚠️  Course not found for requirements: ${subject} ${number}`);
        continue;
      }
      
      // Create/update requirements and link to course
      for (const reqCode of requirementCodes) {
        // Upsert requirement
        const existingReq = await prisma.requirement.findUnique({
          where: { code: reqCode },
        });
        
        let requirement;
        if (existingReq) {
          requirement = existingReq;
          requirementsUpdated++;
        } else {
          // Create requirement with a friendly name
          const reqName = reqCode === "CSU-GE" 
            ? "CSU General Education" 
            : reqCode === "GROSSMONT-GE"
            ? "Grossmont College General Education"
            : reqCode;
          
          requirement = await prisma.requirement.create({
            data: {
              code: reqCode,
              name: reqName,
            },
          });
          requirementsCreated++;
        }
        
        // Link course to requirement (ignore duplicates)
        try {
          await prisma.courseRequirement.create({
            data: {
              courseId: course.id,
              requirementId: requirement.id,
            },
          });
          linksCreated++;
        } catch (error: any) {
          // Ignore duplicate key errors (idempotent)
          if (error.code === "P2002") {
            linksSkipped++;
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log("");
    console.log("✅ Requirements import complete!");
    console.log(`  Requirements: ${requirementsCreated} created, ${requirementsUpdated} updated`);
    console.log(`  Course-Requirement links: ${linksCreated} created, ${linksSkipped} skipped (already existed)`);
    console.log("");
  }
  
  await prisma.$disconnect();
}

// CLI entry point (only runs when script is executed directly via npm run import:grossmont)
// Check if this file is being run as a script (has CLI args) vs imported
if (process.argv[1] && process.argv[1].includes("import-grossmont-pdf")) {
  async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    await importGrossmontData(dryRun);
  }

  main().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

