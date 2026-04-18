import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { exportAudienceCsv } from "@/lib/audience";
import { exportAudienceSchema, validate } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(
    `admin:audience:export:${ip}`,
    RATE_LIMITS.AUDIENCE_EXPORT
  );

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const validationResult = validate(
    exportAudienceSchema,
    Object.fromEntries(searchParams.entries())
  );

  if (!validationResult.success) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const csv = await exportAudienceCsv(db, validationResult.data?.includeDeleted === "1");
    const dateLabel = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audience-export-${dateLabel}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[Audience API] Failed to export CSV:", error);
    return NextResponse.json({ error: "Failed to export audience CSV" }, { status: 500 });
  }
}
