import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getAudienceList } from "@/lib/audience";
import { audienceQuerySchema, validate } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:audience:list:${ip}`, RATE_LIMITS.API_GENERAL);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const queryValidation = validate(audienceQuerySchema, Object.fromEntries(searchParams.entries()));

  if (!queryValidation.success) {
    return NextResponse.json({ error: queryValidation.error }, { status: 400 });
  }

  try {
    const client = await getMongoClient();
    const db = client.db();
    const { search, status, page, pageSize } = queryValidation.data!;
    const { rows, total } = await getAudienceList({ search, status, page, pageSize }, db);

    return NextResponse.json({
      rows,
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    });
  } catch (error) {
    console.error("[Audience API] Failed to fetch audience list:", error);
    return NextResponse.json({ error: "Failed to fetch audience list" }, { status: 500 });
  }
}
