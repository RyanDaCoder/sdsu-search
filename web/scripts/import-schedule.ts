#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { PrismaClient, Modality, SectionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { parseScheduleCsv } from "../lib/import/adapters/genericCsv";
import { normalizeScheduleRow } from "../lib/import/normalize";
import type { ScheduleMappingConfig } from "../lib/import/types";

config({ path: ".env" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL missing in web/.env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const args = process.argv.slice(2);
  let csvPath: string | null = null;
  let mappingPath: string | null = null;
  let dryRun = false;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--file" && i + 1 < args.length) {
      csvPath = args[i + 1];
      i++;
    } else if (args[i] === "--map" && i + 1 < args.length) {
      mappingPath = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  if (!csvPath || !mappingPath) {
    console.error("Usage: tsx scripts/import-schedule.ts --file <csv> --map <mapping.json> [--dry-run]");
    process.exit(1);
  }

  // Resolve paths
  const resolvedCsvPath = path.resolve(csvPath);
  const resolvedMappingPath = path.resolve(mappingPath);

  if (!fs.existsSync(resolvedMappingPath)) {
    console.error(`Mapping file not found: ${resolvedMappingPath}`);
    process.exit(1);
  }

  // Load mapping config
  const mapping: ScheduleMappingConfig = JSON.parse(fs.readFileSync(resolvedMappingPath, "utf-8"));

  console.log(`Parsing CSV: ${resolvedCsvPath}`);
  console.log(`Using mapping: ${resolvedMappingPath}`);
  if (dryRun) {
    console.log("DRY RUN MODE - No database changes will be made");
  }
  console.log("");

  // Parse CSV
  const { rows, errors } = parseScheduleCsv(resolvedCsvPath, mapping);

  if (errors.length > 0) {
    console.error("Errors during parsing:");
    errors.forEach((e) => console.error(`  - ${e}`));
  }

  if (rows.length === 0) {
    console.error("No valid rows found");
    process.exit(1);
  }

  console.log(`Parsed ${rows.length} rows`);
  console.log("");

  // Normalize and group by section
  const normalizedRows = rows.map((row) =>
    normalizeScheduleRow(row, mapping.valueMaps)
  );

  // Group by (termCode, subject, number, sectionKey) to handle perRow meeting mode
  const sectionMap = new Map<string, typeof normalizedRows>();
  for (const row of normalizedRows) {
    const key = `${row.termCode}|${row.subject}|${row.number}|${row.sectionKey}`;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, []);
    }
    sectionMap.get(key)!.push(row);
  }

  if (dryRun) {
    console.log("Would import:");
    console.log(`  ${sectionMap.size} sections`);
    console.log(`  ${normalizedRows.reduce((sum, r) => sum + r.meetings.length, 0)} meetings`);
    console.log("");
    console.log("Sample rows:");
    normalizedRows.slice(0, 3).forEach((row) => {
      console.log(`  ${row.subject} ${row.number} - ${row.sectionKey} (${row.meetings.length} meetings)`);
    });
    await prisma.$disconnect();
    return;
  }

  // Import to database
  let termsUpserted = 0;
  let coursesUpserted = 0;
  let sectionsUpserted = 0;
  let meetingsCreated = 0;

  for (const [key, sectionRows] of sectionMap.entries()) {
    const firstRow = sectionRows[0];
    
    // Upsert Term
    const term = await prisma.term.upsert({
      where: { code: firstRow.termCode },
      update: {},
      create: { code: firstRow.termCode, name: `Term ${firstRow.termCode}` },
    });
    if (term) termsUpserted++;

    // Upsert Course
    const course = await prisma.course.upsert({
      where: { subject_number: { subject: firstRow.subject, number: firstRow.number } },
      update: {
        ...(firstRow.title && { title: firstRow.title }),
        ...(firstRow.units && { units: firstRow.units }),
      },
      create: {
        subject: firstRow.subject,
        number: firstRow.number,
        title: firstRow.title,
        units: firstRow.units,
      },
    });
    if (course) coursesUpserted++;

    // Combine meetings from all rows for this section
    const allMeetings = sectionRows.flatMap((r) => r.meetings);

    // Find or create section
    let section = await prisma.section.findFirst({
      where: {
        termId: term.id,
        courseId: course.id,
        classNumber: firstRow.sectionKey,
      },
    });

    if (!section) {
      section = await prisma.section.create({
        data: {
          termId: term.id,
          courseId: course.id,
          classNumber: firstRow.sectionKey,
          sectionCode: "01",
          modality: firstRow.modality,
          status: firstRow.status,
          campus: firstRow.location,
        },
      });
    } else {
      section = await prisma.section.update({
        where: { id: section.id },
        data: {
          modality: firstRow.modality,
          status: firstRow.status,
          campus: firstRow.location,
        },
      });
    }
    sectionsUpserted++;

    // Delete existing meetings and recreate
    await prisma.meeting.deleteMany({
      where: { sectionId: section.id },
    });

    if (allMeetings.length > 0) {
      await prisma.meeting.createMany({
        data: allMeetings.map((m) => ({
          sectionId: section.id,
          days: m.days,
          startMin: m.startMin,
          endMin: m.endMin,
          location: m.location || null,
        })),
      });
      meetingsCreated += allMeetings.length;
    }

    // Handle instructor if provided
    if (firstRow.instructor) {
      const instructor = await prisma.instructor.upsert({
        where: { name: firstRow.instructor },
        update: {},
        create: { name: firstRow.instructor },
      });

      // Link instructor to section
      await prisma.sectionInstructor.upsert({
        where: {
          sectionId_instructorId: {
            sectionId: section.id,
            instructorId: instructor.id,
          },
        },
        update: {},
        create: {
          sectionId: section.id,
          instructorId: instructor.id,
        },
      });
    }
  }

  console.log("Import complete ✅");
  console.log(`  Terms upserted: ${termsUpserted}`);
  console.log(`  Courses upserted: ${coursesUpserted}`);
  console.log(`  Sections upserted: ${sectionsUpserted}`);
  console.log(`  Meetings created: ${meetingsCreated}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

