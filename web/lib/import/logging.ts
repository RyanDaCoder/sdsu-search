import * as fs from "fs";
import * as path from "path";

export type ImportLog = {
  timestamp: string;
  type: "schedule" | "requirements";
  termCode?: string;
  rowsRead: number;
  rowsWritten: number;
  errors: Array<{ message: string; rowIndex?: number }>;
  warnings: Array<{ message: string; rowIndex?: number }>;
  created: {
    terms?: number;
    courses?: number;
    sections?: number;
    meetings?: number;
    requirements?: number;
    courseRequirements?: number;
  };
  updated: {
    terms?: number;
    courses?: number;
    sections?: number;
  };
  mappingFile?: string;
  csvFile?: string;
  cliFlags: string[];
  dryRun: boolean;
};

/**
 * Write import log to file.
 */
export function writeImportLog(log: ImportLog, baseDir = "."): string {
  const resolvedBaseDir = path.resolve(baseDir);
  const logsDir = path.join(resolvedBaseDir, "import-logs");
  
  // Ensure directory exists (recursive creates parent dirs if needed)
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (err: any) {
    // Ignore error if directory already exists
    if (err.code !== "EEXIST") {
      throw err;
    }
  }

  // Generate timestamp-safe filename (replace colons and dots with dashes)
  const timestamp = log.timestamp || new Date().toISOString();
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const filename = `${safeTimestamp}-${log.type}.json`;
  const filepath = path.join(logsDir, filename);

  // Cap errors/warnings at 50
  const cappedLog: ImportLog = {
    ...log,
    errors: log.errors.slice(0, 50),
    warnings: log.warnings.slice(0, 50),
  };

  fs.writeFileSync(filepath, JSON.stringify(cappedLog, null, 2), "utf-8");
  return filepath;
}

