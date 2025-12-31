import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.DATABASE_URL ?? "";
  return NextResponse.json({
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasDirectUrl: !!process.env.DIRECT_URL,
    host: url.split("@")[1]?.split("/")[0] ?? null,
    hasSslmode: url.includes("sslmode=require"),
    hasPgbouncer: url.includes("pgbouncer=true"),
    hasSslaccept: url.includes("sslaccept=accept_invalid_certs"),
    length: url.length,
  });
}

