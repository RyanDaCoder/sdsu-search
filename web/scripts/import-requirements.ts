#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { config } from "dotenv";
import { parseRequirementCsv } from "../lib/import/adapters/genericCsv";
import { normalizeRequirementRow } from "../lib/import/normalize";
import type { RequirementMappingConfig } from "../lib/import/types";

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

  if (dryRun) {
    console.log("Would import:");
    console.log(`  ${new Set(normalizedRows.map((r) => r.requirementCode)).size} unique requirements`);
    console.log(`  ${normalizedRows.length} course-requirement links`);
    console.log("");
    console.log("Sample rows:");
    normalizedRows.slice(0, 5).forEach((row) => {
      console.log(`  ${row.subject} ${row.number} -> ${row.requirementCode}`);
    });
    await prisma.$disconnect();
    return;
  }

  let requirementsUpserted = 0;
  let linksCreated = 0;

  for (const row of normalizedRows) {
    // Upsert Requirement
    const requirement = await prisma.requirement.upsert({
      where: { code: row.requirementCode },
      update: {},
      create: { code: row.requirementCode, name: row.requirementCode },
    });
    if (requirement) requirementsUpserted++;

    // Find course
    const course = await prisma.course.findUnique({
      where: { subject_number: { subject: row.subject, number: row.number } },
    });

    if (!course) {
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
  console.log(`  Requirements upserted: ${requirementsUpserted}`);
  console.log(`  Course-Requirement links created: ${linksCreated}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

