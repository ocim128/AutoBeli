import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { softDeleteAudienceContact, updateAudienceContact } from "@/lib/audience";
import { updateAudienceSchema, validate } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:audience:update:${ip}`, RATE_LIMITS.API_GENERAL);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const validationResult = validate(updateAudienceSchema, body);

  if (!validationResult.success) {
    return NextResponse.json({ error: validationResult.error }, { status: 400 });
  }

  try {
    const { id } = await params;
    const client = await getMongoClient();
    const db = client.db();
    const result = await updateAudienceContact(id, validationResult.data!, db);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Audience API] Failed to update audience contact:", error);
    return NextResponse.json({ error: "Failed to update audience contact" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:audience:delete:${ip}`, RATE_LIMITS.API_GENERAL);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const client = await getMongoClient();
    const db = client.db();
    const deleted = await softDeleteAudienceContact(id, db);

    if (!deleted) {
      return NextResponse.json({ error: "Audience contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Audience API] Failed to delete audience contact:", error);
    return NextResponse.json({ error: "Failed to delete audience contact" }, { status: 500 });
  }
}
