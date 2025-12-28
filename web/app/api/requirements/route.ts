import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

/**
 * GET /api/requirements?term=<termCode>
 * 
 * Returns all requirements (GE codes) that are linked to courses with sections in the given term.
 * This allows the frontend to dynamically show only relevant requirements for the selected term.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const termCode = searchParams.get("term") ?? "GROSSMONT_2026SP";

  try {
    // Find the term
    const term = await prisma.term.findUnique({
      where: { code: termCode },
    });

    if (!term) {
      return NextResponse.json(
        { error: `Term not found: ${termCode}` },
        { status: 404 }
      );
    }

    // Get all requirements that are linked to courses with sections in this term
    const requirements = await prisma.requirement.findMany({
      where: {
        courses: {
          some: {
            course: {
              sections: {
                some: {
                  termId: term.id,
                },
              },
            },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      term: termCode,
      requirements: requirements.map((r) => ({
        code: r.code,
        name: r.name || r.code,
        description: r.description,
      })),
    });
  } catch (error: any) {
    console.error("Error fetching requirements:", error);
    return NextResponse.json(
      { error: "Failed to fetch requirements", message: error.message },
      { status: 500 }
    );
  }
}

