import { Db, ObjectId } from "mongodb";
import { AudienceContact } from "./definitions";

const AUDIENCE_COLLECTION = "audiences";
const ORDER_COLLECTION = "orders";
const TEST_EMAIL = "customer@example.com";

export interface AudienceOrderStats {
  totalPaidOrders: number;
  firstPaidOrderAt: Date | null;
  lastPaidOrderAt: Date | null;
}

export interface AudienceListRow extends AudienceContact, AudienceOrderStats {}

function buildNotDeletedFilter(): Record<string, unknown> {
  return {
    $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
  };
}

function buildAudienceFilter(params: {
  search?: string;
  status?: string;
  includeDeleted?: boolean;
}): Record<string, unknown> {
  const filters: Record<string, unknown>[] = [];

  if (!params.includeDeleted) {
    filters.push(buildNotDeletedFilter());
  }

  if (params.status) {
    filters.push({ status: params.status });
  }

  if (params.search) {
    const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filters.push({
      allEmails: { $regex: escaped, $options: "i" },
    });
  }

  if (filters.length === 0) return {};
  if (filters.length === 1) return filters[0];
  return { $and: filters };
}

async function getOrderStatsForEmails(emails: string[], db: Db): Promise<AudienceOrderStats> {
  if (emails.length === 0) {
    return {
      totalPaidOrders: 0,
      firstPaidOrderAt: null,
      lastPaidOrderAt: null,
    };
  }

  const stats = await db
    .collection(ORDER_COLLECTION)
    .aggregate<AudienceOrderStats>([
      {
        $match: {
          status: "PAID",
          customerContact: { $in: emails },
        },
      },
      {
        $project: {
          paidAtOrCreatedAt: { $ifNull: ["$paidAt", "$createdAt"] },
        },
      },
      {
        $group: {
          _id: null,
          totalPaidOrders: { $sum: 1 },
          firstPaidOrderAt: { $min: "$paidAtOrCreatedAt" },
          lastPaidOrderAt: { $max: "$paidAtOrCreatedAt" },
        },
      },
      {
        $project: {
          _id: 0,
          totalPaidOrders: 1,
          firstPaidOrderAt: 1,
          lastPaidOrderAt: 1,
        },
      },
    ])
    .toArray();

  return (
    stats[0] || {
      totalPaidOrders: 0,
      firstPaidOrderAt: null,
      lastPaidOrderAt: null,
    }
  );
}

export async function seedAudienceFromPaidOrdersIfEmpty(db: Db): Promise<number> {
  const collection = db.collection<AudienceContact>(AUDIENCE_COLLECTION);
  const existingCount = await collection.estimatedDocumentCount();

  if (existingCount > 0) {
    return 0;
  }

  const rawContacts = await db.collection(ORDER_COLLECTION).distinct("customerContact", {
    status: "PAID",
    customerContact: { $exists: true, $nin: [null, ""] },
  });

  const normalizedContacts = Array.from(
    new Set(
      rawContacts
        .map((value) => normalizeEmail(typeof value === "string" ? value : ""))
        .filter((value) => value && isValidEmail(value) && !isTestEmail(value))
    )
  );

  let inserted = 0;
  for (const email of normalizedContacts) {
    const result = await upsertAudienceFromPaidOrder(email, db);
    if (result) inserted += 1;
  }

  return inserted;
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number }).code === 11000
  );
}

export function normalizeEmail(email: string): string {
  if (!email) return "";
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isTestEmail(email: string): boolean {
  return normalizeEmail(email) === TEST_EMAIL;
}

export function buildAllEmails(email: string, aliases: string[]): string[] {
  const normalized = [normalizeEmail(email), ...aliases.map(normalizeEmail)];
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of normalized) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }

  return result;
}

export async function upsertAudienceFromPaidOrder(
  rawEmail: string,
  db: Db
): Promise<AudienceContact | null> {
  const email = normalizeEmail(rawEmail);
  if (!email || !isValidEmail(email) || isTestEmail(email)) return null;

  const collection = db.collection<AudienceContact>(AUDIENCE_COLLECTION);
  const now = new Date();

  try {
    const existing = await collection.findOne({ allEmails: email });

    if (!existing) {
      const doc: AudienceContact = {
        email,
        aliases: [],
        allEmails: [email],
        source: "ORDER",
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      };

      const result = await collection.insertOne(doc);
      return { ...doc, _id: result.insertedId };
    }

    const updateSet: Partial<AudienceContact> = { updatedAt: now };
    const updateOperation: {
      $set: Partial<AudienceContact>;
      $unset?: Record<string, "" | 1 | true>;
    } = { $set: updateSet };

    if (existing.deletedAt) {
      updateSet.restoredAt = now;
      updateOperation.$unset = { deletedAt: "" };
    }

    await collection.updateOne({ _id: existing._id }, updateOperation);

    return {
      ...existing,
      ...updateSet,
      deletedAt: undefined,
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return await collection.findOne({ allEmails: email });
    }

    console.error("[Audience] upsertAudienceFromPaidOrder error:", error);
    return null;
  }
}

export async function reconcileAudienceForPaidOrderContactChange(
  oldRawEmail: string,
  newRawEmail: string,
  db: Db
): Promise<void> {
  const oldEmail = normalizeEmail(oldRawEmail);
  const newEmail = normalizeEmail(newRawEmail);

  if (!newEmail || !isValidEmail(newEmail) || isTestEmail(newEmail)) {
    return;
  }

  if (!oldEmail || oldEmail === newEmail || isTestEmail(oldEmail)) {
    await upsertAudienceFromPaidOrder(newEmail, db);
    return;
  }

  const collection = db.collection<AudienceContact>(AUDIENCE_COLLECTION);
  const matched = await collection.findOne({ allEmails: oldEmail });

  if (!matched) {
    await upsertAudienceFromPaidOrder(newEmail, db);
    return;
  }

  const conflict = await collection.findOne({
    allEmails: newEmail,
    _id: { $ne: matched._id },
  });

  if (conflict) {
    console.warn(
      `[Audience] Contact correction conflict: "${newEmail}" already exists in row ${conflict._id?.toString()}`
    );
    return;
  }

  const aliases = buildAllEmails(matched.email, [...matched.aliases, oldEmail]).filter(
    (value) => value !== newEmail
  );
  const allEmails = buildAllEmails(newEmail, aliases);
  const now = new Date();

  const updateOperation: {
    $set: Partial<AudienceContact>;
    $unset?: Record<string, "" | 1 | true>;
  } = {
    $set: {
      email: newEmail,
      aliases,
      allEmails,
      updatedAt: now,
    },
  };

  if (matched.deletedAt) {
    updateOperation.$set.restoredAt = now;
    updateOperation.$unset = { deletedAt: "" };
  }

  await collection.updateOne({ _id: matched._id }, updateOperation);
}

export async function getAudienceRecipientsForProductBroadcast(
  productId: ObjectId,
  db: Db
): Promise<AudienceContact[]> {
  await seedAudienceFromPaidOrdersIfEmpty(db);

  const buyerOrders = await db
    .collection(ORDER_COLLECTION)
    .find({
      productId,
      status: "PAID",
      customerContact: { $exists: true, $nin: [null, ""] },
    })
    .project<{ customerContact?: string }>({ customerContact: 1 })
    .toArray();

  const buyerEmails = new Set<string>();
  for (const order of buyerOrders) {
    const email = normalizeEmail(order.customerContact || "");
    if (email) buyerEmails.add(email);
  }

  const audienceRows = await db
    .collection<AudienceContact>(AUDIENCE_COLLECTION)
    .find({
      status: "ACTIVE",
      ...buildNotDeletedFilter(),
    })
    .toArray();

  return audienceRows.filter((row) => row.allEmails.every((email) => !buyerEmails.has(email)));
}

export async function softDeleteAudienceContact(id: string, db: Db): Promise<boolean> {
  if (!ObjectId.isValid(id)) return false;

  const result = await db.collection(AUDIENCE_COLLECTION).updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  return result.matchedCount > 0;
}

export async function updateAudienceContact(
  id: string,
  updates: {
    email?: string;
    status?: "ACTIVE" | "EXCLUDED" | "BOUNCED";
    notes?: string;
  },
  db: Db
): Promise<{ success: boolean; error?: string }> {
  if (!ObjectId.isValid(id)) {
    return { success: false, error: "Invalid audience ID" };
  }

  const collection = db.collection<AudienceContact>(AUDIENCE_COLLECTION);
  const current = await collection.findOne({ _id: new ObjectId(id) });

  if (!current) {
    return { success: false, error: "Audience contact not found" };
  }

  const setObject: Partial<AudienceContact> = { updatedAt: new Date() };

  if (updates.email !== undefined) {
    const nextEmail = normalizeEmail(updates.email);

    if (!isValidEmail(nextEmail)) {
      return { success: false, error: "Invalid email format" };
    }

    const collision = await collection.findOne({
      allEmails: nextEmail,
      _id: { $ne: current._id },
    });

    if (collision) {
      return { success: false, error: "Email already exists in another audience row" };
    }

    const aliases = buildAllEmails(current.email, current.aliases).filter(
      (value) => value !== nextEmail
    );
    const nextAliases = aliases.filter((value) => value !== nextEmail);
    const allEmails = buildAllEmails(nextEmail, nextAliases);

    setObject.email = nextEmail;
    setObject.aliases = nextAliases;
    setObject.allEmails = allEmails;
  }

  if (updates.status !== undefined) {
    setObject.status = updates.status;
  }

  if (updates.notes !== undefined) {
    setObject.notes = updates.notes;
  }

  try {
    await collection.updateOne({ _id: current._id }, { $set: setObject });
    return { success: true };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { success: false, error: "Email already exists in another audience row" };
    }

    console.error("[Audience] updateAudienceContact error:", error);
    return { success: false, error: "Failed to update audience contact" };
  }
}

export async function getAudienceList(
  params: {
    search?: string;
    status?: string;
    page: number;
    pageSize: number;
    includeDeleted?: boolean;
  },
  db: Db
): Promise<{ rows: AudienceListRow[]; total: number }> {
  await seedAudienceFromPaidOrdersIfEmpty(db);

  const filter = buildAudienceFilter(params);
  const collection = db.collection<AudienceContact>(AUDIENCE_COLLECTION);

  const total = await collection.countDocuments(filter);
  const rows = await collection
    .find(filter)
    .sort({ updatedAt: -1 })
    .skip((params.page - 1) * params.pageSize)
    .limit(params.pageSize)
    .toArray();

  const rowsWithStats = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      ...(await getOrderStatsForEmails(row.allEmails, db)),
    }))
  );

  return { rows: rowsWithStats, total };
}

export async function exportAudienceCsv(db: Db, includeDeleted?: boolean): Promise<string> {
  await seedAudienceFromPaidOrdersIfEmpty(db);

  const filter = buildAudienceFilter({ includeDeleted });
  const rows = await db
    .collection<AudienceContact>(AUDIENCE_COLLECTION)
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();

  const lines = [
    "email,status,totalPaidOrders,firstPaidOrderAt,lastPaidOrderAt,createdAt,updatedAt",
  ];

  const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;

  for (const row of rows) {
    const stats = await getOrderStatsForEmails(row.allEmails, db);
    lines.push(
      [
        escapeCsv(row.email),
        row.status,
        stats.totalPaidOrders,
        stats.firstPaidOrderAt ? stats.firstPaidOrderAt.toISOString() : "",
        stats.lastPaidOrderAt ? stats.lastPaidOrderAt.toISOString() : "",
        row.createdAt.toISOString(),
        row.updatedAt.toISOString(),
      ].join(",")
    );
  }

  return lines.join("\n");
}
