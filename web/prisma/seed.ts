import { config } from "dotenv";
config({ path: ".env" });

// Import Grossmont import function
import { importGrossmontData } from "../scripts/import-grossmont-pdf";

async function main() {
  console.log("🌱 Seeding database with Grossmont Spring 2026 data...");
  console.log("");
  
  // Import Grossmont data (not a dry run)
  await importGrossmontData(false);
  
  console.log("✅ Database seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
