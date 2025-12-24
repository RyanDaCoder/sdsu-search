#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { PrismaClient, Modality, SectionStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { parseScheduleCsv } from "../lib/import/adapters/genericCsv";
import { normalizeScheduleRow } from "../lib/import/normalize";
import { validateScheduleRows } from "../lib/import/validate";
import { writeImportLog } from "../lib/import/logging";
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
  let strict = false;

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
    } else if (args[i] === "--strict") {
      strict = true;
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

  // Normalize rows
  const normalizedRows = rows.map((row) => normalizeScheduleRow(row, mapping.valueMaps));

  // Validate
  console.log("Validating rows...");
  const validation = validateScheduleRows(normalizedRows, strict);

  // Print validation summary
  console.log("\nValidation Summary:");
  console.log(`  Total rows: ${validation.stats.totalRows}`);
  console.log(`  Valid rows: ${validation.stats.validRows}`);
  console.log(`  Invalid rows: ${validation.stats.invalidRows}`);
  console.log(`  Errors: ${validation.errors.length}`);
  console.log(`  Warnings: ${validation.warnings.length}`);

  if (validation.errors.length > 0) {
    console.log("\n❌ Errors (first 20):");
    validation.errors.slice(0, 20).forEach((error) => {
      const rowInfo = error.rowIndex !== undefined ? `Row ${error.rowIndex + 1}` : "";
      const fieldInfo = error.field ? ` [${error.field}]` : "";
      console.log(`  ${rowInfo}${fieldInfo}: ${error.message}${error.value ? ` (value: ${error.value})` : ""}`);
    });
    if (validation.errors.length > 20) {
      console.log(`  ... and ${validation.errors.length - 20} more errors`);
    }
  }

  if (validation.warnings.length > 0) {
    console.log("\n⚠️  Warnings (first 20):");
    validation.warnings.slice(0, 20).forEach((warning) => {
      const rowInfo = warning.rowIndex !== undefined ? `Row ${warning.rowIndex + 1}` : "";
      const fieldInfo = warning.field ? ` [${warning.field}]` : "";
      console.log(`  ${rowInfo}${fieldInfo}: ${warning.message}`);
    });
    if (validation.warnings.length > 20) {
      console.log(`  ... and ${validation.warnings.length - 20} more warnings`);
    }
  }

  // Abort if errors found
  if (validation.errors.length > 0) {
    console.error("\n❌ Import aborted due to validation errors");
    await prisma.$disconnect();
    process.exit(1);
  }

  // Abort if strict mode and warnings found
  if (strict && validation.warnings.length > 0) {
    console.error("\n❌ Import aborted due to warnings in strict mode");
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log("");

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

    // Write log even in dry-run
    const logPath = writeImportLog(
      {
        timestamp: new Date().toISOString(),
        type: "schedule",
        termCode: normalizedRows[0]?.termCode,
        rowsRead: rows.length,
        rowsWritten: 0,
        errors: validation.errors.map((e) => ({
          message: e.message,
          rowIndex: e.rowIndex,
        })),
        warnings: validation.warnings.map((w) => ({
          message: w.message,
          rowIndex: w.rowIndex,
        })),
        created: {},
        updated: {},
        mappingFile: resolvedMappingPath,
        csvFile: resolvedCsvPath,
        cliFlags: args,
        dryRun: true,
      },
      path.resolve(".")
    );
    console.log(`📝 Log written to: ${logPath}`);

    await prisma.$disconnect();
    return;
  }

  // Import to database
  let termsCreated = 0;
  let termsUpdated = 0;
  let coursesCreated = 0;
  let coursesUpdated = 0;
  let sectionsCreated = 0;
  let sectionsUpdated = 0;
  let meetingsCreated = 0;

  for (const [key, sectionRows] of sectionMap.entries()) {
    const firstRow = sectionRows[0];
    
    // Upsert Term
    const existingTerm = await prisma.term.findUnique({
      where: { code: firstRow.termCode },
    });
    const term = existingTerm
      ? await prisma.term.update({
          where: { code: firstRow.termCode },
          data: {},
        })
      : await prisma.term.create({
          data: { code: firstRow.termCode, name: `Term ${firstRow.termCode}` },
        });
    if (existingTerm) {
      termsUpdated++;
    } else {
      termsCreated++;
    }

    // Upsert Course
    const existingCourse = await prisma.course.findUnique({
      where: { subject_number: { subject: firstRow.subject, number: firstRow.number } },
    });
    const course = existingCourse
      ? await prisma.course.update({
          where: { subject_number: { subject: firstRow.subject, number: firstRow.number } },
          data: {
            ...(firstRow.title && { title: firstRow.title }),
            ...(firstRow.units && { units: firstRow.units }),
          },
        })
      : await prisma.course.create({
          data: {
            subject: firstRow.subject,
            number: firstRow.number,
            title: firstRow.title,
            units: firstRow.units,
          },
        });
    if (existingCourse) {
      coursesUpdated++;
    } else {
      coursesCreated++;
    }

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
      sectionsCreated++;
    } else {
      section = await prisma.section.update({
        where: { id: section.id },
        data: {
          modality: firstRow.modality,
          status: firstRow.status,
          campus: firstRow.location,
        },
      });
      sectionsUpdated++;
    }

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
  console.log(`  Terms: ${termsCreated} created, ${termsUpdated} updated`);
  console.log(`  Courses: ${coursesCreated} created, ${coursesUpdated} updated`);
  console.log(`  Sections: ${sectionsCreated} created, ${sectionsUpdated} updated`);
  console.log(`  Meetings: ${meetingsCreated} created`);

  // Write import log
  const logPath = writeImportLog(
    {
      timestamp: new Date().toISOString(),
      type: "schedule",
      termCode: normalizedRows[0]?.termCode,
      rowsRead: rows.length,
      rowsWritten: normalizedRows.length,
      errors: validation.errors.map((e) => ({
        message: e.message,
        rowIndex: e.rowIndex,
      })),
      warnings: validation.warnings.map((w) => ({
        message: w.message,
        rowIndex: w.rowIndex,
      })),
      created: {
        terms: termsCreated,
        courses: coursesCreated,
        sections: sectionsCreated,
        meetings: meetingsCreated,
      },
      updated: {
        terms: termsUpdated,
        courses: coursesUpdated,
        sections: sectionsUpdated,
      },
      mappingFile: resolvedMappingPath,
      csvFile: resolvedCsvPath,
      cliFlags: args,
      dryRun: false,
    },
    path.resolve(".")
  );
  console.log(`\n📝 Log written to: ${logPath}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

