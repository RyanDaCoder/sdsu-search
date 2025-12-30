export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * GET /api/terms
 * 
 * Returns all available terms, ordered by name (most recent first).
 */
export async function GET(req: Request) {
  try {
    const terms = await prisma.term.findMany({
      orderBy: { name: "desc" },
    });

    return NextResponse.json({
      terms: terms.map((t) => ({
        code: t.code,
        name: t.name,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching terms:", error);
    return NextResponse.json(
      { error: "Failed to fetch terms", message: error.message },
      { status: 500 }
    );
  }
}

