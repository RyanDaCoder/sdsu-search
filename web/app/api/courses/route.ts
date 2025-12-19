import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export const runtime = "nodejs"; // Prisma must run on Node runtime

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const subject = searchParams.get("subject")?.trim() || undefined;
    const number = searchParams.get("number")?.trim() || undefined;
    const q = searchParams.get("q")?.trim() || undefined;

    const limitRaw = searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitRaw ?? 50), 1), 200);

    const courses = await prisma.course.findMany({
      where: {
        ...(subject ? { subject: { equals: subject, mode: "insensitive" } } : {}),
        ...(number ? { number: { equals: number, mode: "insensitive" } } : {}),
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { subject: { contains: q, mode: "insensitive" } },
                { number: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: [{ subject: "asc" }, { number: "asc" }],
      take: limit,
      select: { id: true, subject: true, number: true, title: true, units: true },
    });

    return NextResponse.json({ count: courses.length, courses });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
