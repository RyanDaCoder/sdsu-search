#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";
import { prisma } from "../lib/prisma";
import { parseRequirementCsv } from "../lib/import/adapters/genericCsv";
import { normalizeRequirementRow } from "../lib/import/normalize";
import { validateRequirementRows } from "../lib/import/validate";
import { writeImportLog } from "../lib/import/logging";
import type { RequirementMappingConfig } from "../lib/import/types";

config({ path: ".env" });

async function main() {
  const args = process.argv.slice(2);
  let csvPath: string | null = null;
  let mappingPath: string | null = null;
  let dryRun = false;
  let strict = false;

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
    console.error("Usage: tsx scripts/import-requirements.ts --file <csv> --map <mapping.json> [--dry-run]");
    process.exit(1);
  }

  const resolvedCsvPath = path.resolve(csvPath);
  const resolvedMappingPath = path.resolve(mappingPath);

  if (!fs.existsSync(resolvedMappingPath)) {
    console.error(`Mapping file not found: ${resolvedMappingPath}`);
    process.exit(1);
  }

  const mapping: RequirementMappingConfig = JSON.parse(fs.readFileSync(resolvedMappingPath, "utf-8"));

  console.log(`Parsing CSV: ${resolvedCsvPath}`);
  console.log(`Using mapping: ${resolvedMappingPath}`);
  if (dryRun) {
    console.log("DRY RUN MODE - No database changes will be made");
  }
  console.log("");

  const { rows, errors } = parseRequirementCsv(resolvedCsvPath, mapping);

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

  const normalizedRows = rows.map(normalizeRequirementRow);

  // Validate
  console.log("Validating rows...");
  const validation = validateRequirementRows(normalizedRows);

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

  if (dryRun) {
    console.log("Would import:");
    console.log(`  ${new Set(normalizedRows.map((r) => r.requirementCode)).size} unique requirements`);
    console.log(`  ${normalizedRows.length} course-requirement links`);
    console.log("");
    console.log("Sample rows:");
    normalizedRows.slice(0, 5).forEach((row) => {
      console.log(`  ${row.subject} ${row.number} -> ${row.requirementCode}`);
    });

    // Write log even in dry-run
    const logPath = writeImportLog(
      {
        timestamp: new Date().toISOString(),
        type: "requirements",
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
    console.log(`\n📝 Log written to: ${logPath}`);

    await prisma.$disconnect();
    return;
  }

  let requirementsCreated = 0;
  let requirementsUpdated = 0;
  let linksCreated = 0;
  let coursesNotFound = 0;

  for (const row of normalizedRows) {
    // Upsert Requirement
    const existingReq = await prisma.requirement.findUnique({
      where: { code: row.requirementCode },
    });
    const requirement = existingReq
      ? await prisma.requirement.update({
          where: { code: row.requirementCode },
          data: {},
        })
      : await prisma.requirement.create({
          data: { code: row.requirementCode, name: row.requirementCode },
        });
    if (existingReq) {
      requirementsUpdated++;
    } else {
      requirementsCreated++;
    }

    // Find course
    const course = await prisma.course.findUnique({
      where: { subject_number: { subject: row.subject, number: row.number } },
    });

    if (!course) {
      coursesNotFound++;
      console.warn(`Course not found: ${row.subject} ${row.number} - skipping requirement link`);
      continue;
    }

    // Create course-requirement link
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
      if (!error.code || error.code !== "P2002") {
        throw error;
      }
    }
  }

  console.log("Import complete ✅");
  console.log(`  Requirements: ${requirementsCreated} created, ${requirementsUpdated} updated`);
  console.log(`  Course-Requirement links created: ${linksCreated}`);
  if (coursesNotFound > 0) {
    console.log(`  ⚠️  Courses not found: ${coursesNotFound}`);
  }

  // Write import log
  const logPath = writeImportLog(
    {
      timestamp: new Date().toISOString(),
      type: "requirements",
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
        requirements: requirementsCreated,
        courseRequirements: linksCreated,
      },
      updated: {
        requirements: requirementsUpdated,
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

