#!/usr/bin/env node

import { execSync } from "child_process";
import * as path from "path";

async function main() {
  const args = process.argv.slice(2);
  let schedulePath: string | null = null;
  let scheduleMapPath: string | null = null;
  let reqPath: string | null = null;
  let reqMapPath: string | null = null;
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--schedule" && i + 1 < args.length) {
      schedulePath = args[i + 1];
      i++;
    } else if (args[i] === "--scheduleMap" && i + 1 < args.length) {
      scheduleMapPath = args[i + 1];
      i++;
    } else if (args[i] === "--req" && i + 1 < args.length) {
      reqPath = args[i + 1];
      i++;
    } else if (args[i] === "--reqMap" && i + 1 < args.length) {
      reqMapPath = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      dryRun = true;
    }
  }

  if (!schedulePath || !scheduleMapPath || !reqPath || !reqMapPath) {
    console.error(
      "Usage: tsx scripts/import-all.ts --schedule <csv> --scheduleMap <json> --req <csv> --reqMap <json> [--dry-run]"
    );
    process.exit(1);
  }

  const dryRunFlag = dryRun ? " --dry-run" : "";

  console.log("Importing schedule...");
  try {
    execSync(
      `tsx scripts/import-schedule.ts --file "${schedulePath}" --map "${scheduleMapPath}"${dryRunFlag}`,
      { stdio: "inherit", cwd: path.resolve(__dirname, "..") }
    );
  } catch (error) {
    console.error("Schedule import failed");
    process.exit(1);
  }

  console.log("\nImporting requirements...");
  try {
    execSync(
      `tsx scripts/import-requirements.ts --file "${reqPath}" --map "${reqMapPath}"${dryRunFlag}`,
      { stdio: "inherit", cwd: path.resolve(__dirname, "..") }
    );
  } catch (error) {
    console.error("Requirements import failed");
    process.exit(1);
  }

  console.log("\nAll imports complete ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

