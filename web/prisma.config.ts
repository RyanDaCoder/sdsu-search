import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
    // directUrl is required for Prisma CLI commands (migrations, introspection)
    // when using a connection pooler like PgBouncer
    // TypeScript types don't include it, but it's supported at runtime
    ...(process.env.DIRECT_URL && { directUrl: process.env.DIRECT_URL }),
  } as { url: string; directUrl?: string },
});
