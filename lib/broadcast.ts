import { Db, ObjectId } from "mongodb";
import { AudienceContact, Product, ProductBroadcastLog } from "./definitions";
import { sendPlainTextEmail } from "./email";
import { getAudienceRecipientsForProductBroadcast } from "./audience";
import { buildProductBroadcastBody, buildProductBroadcastSubject } from "./broadcastTemplate";

const BROADCAST_COLLECTION = "broadcasts";

export interface BroadcastSendResult {
  success: boolean;
  status: "COMPLETED" | "PARTIAL" | "FAILED";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  error?: string;
  warning?: string;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getBroadcastMaxRecipients(): number {
  return parsePositiveInt(process.env.BROADCAST_MAX_RECIPIENTS, 100);
}

export function getBroadcastBatchSize(): number {
  return parsePositiveInt(process.env.BROADCAST_BATCH_SIZE, 10);
}

export function productHasAvailableStock(product: Product): boolean {
  if (product.stockItems && product.stockItems.length > 0) {
    return product.stockItems.some((item) => !item.isSold);
  }

  return !product.isSold;
}

export async function resolveBroadcastProduct(
  input: { productId?: string; slug?: string },
  db: Db
): Promise<Product | null> {
  if (input.productId) {
    if (!ObjectId.isValid(input.productId)) return null;
    return await db.collection<Product>("products").findOne({ _id: new ObjectId(input.productId) });
  }

  if (input.slug) {
    return await db.collection<Product>("products").findOne({ slug: input.slug });
  }

  return null;
}

export async function getBroadcastRecipientCount(productId: ObjectId, db: Db): Promise<number> {
  const recipients = await getAudienceRecipientsForProductBroadcast(productId, db);
  return recipients.length;
}

async function logBroadcast(log: Omit<ProductBroadcastLog, "_id">, db: Db): Promise<void> {
  await db.collection<ProductBroadcastLog>(BROADCAST_COLLECTION).insertOne(log);
}

export async function sendProductBroadcastTest(params: {
  product: Product;
  teaser: string;
  targetEmail: string;
  db: Db;
}): Promise<BroadcastSendResult> {
  if (!params.product._id) {
    return {
      success: false,
      status: "FAILED",
      recipientCount: 1,
      sentCount: 0,
      failedCount: 1,
      error: "Product is missing an ID",
    };
  }

  const subject = buildProductBroadcastSubject(params.product.title);
  const body = buildProductBroadcastBody({
    productTitle: params.product.title,
    teaser: params.teaser,
    productSlug: params.product.slug,
  });
  const emailResult = await sendPlainTextEmail(params.targetEmail, subject, body);
  const now = new Date();
  const status = emailResult.success ? "COMPLETED" : "FAILED";
  let warning: string | undefined;

  try {
    await logBroadcast(
      {
        mode: "TEST",
        productId: params.product._id,
        productSlug: params.product.slug,
        productTitle: params.product.title,
        subject,
        teaser: params.teaser,
        recipientCount: 1,
        sentCount: emailResult.success ? 1 : 0,
        failedCount: emailResult.success ? 0 : 1,
        recipientsSample: [params.targetEmail],
        status,
        requestedBy: "ADMIN",
        createdAt: now,
        completedAt: now,
      },
      params.db
    );
  } catch (loggingError) {
    warning = "Email sent, but broadcast logging failed";
    console.error("[Broadcast] Failed to log test broadcast:", loggingError);
  }

  return {
    success: emailResult.success,
    status,
    recipientCount: 1,
    sentCount: emailResult.success ? 1 : 0,
    failedCount: emailResult.success ? 0 : 1,
    error: emailResult.error,
    warning,
  };
}

export async function sendProductBroadcast(params: {
  product: Product;
  teaser: string;
  db: Db;
}): Promise<BroadcastSendResult> {
  if (!params.product._id) {
    return {
      success: false,
      status: "FAILED",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      error: "Product is missing an ID",
    };
  }

  const recipients = await getAudienceRecipientsForProductBroadcast(params.product._id, params.db);
  const recipientCount = recipients.length;
  const maxRecipients = getBroadcastMaxRecipients();

  if (recipientCount === 0) {
    return {
      success: false,
      status: "FAILED",
      recipientCount: 0,
      sentCount: 0,
      failedCount: 0,
      error: "No eligible recipients found for this product",
    };
  }

  if (recipientCount > maxRecipients) {
    return {
      success: false,
      status: "FAILED",
      recipientCount,
      sentCount: 0,
      failedCount: 0,
      error: `Recipient count ${recipientCount} exceeds the limit of ${maxRecipients}`,
    };
  }

  const batchSize = getBroadcastBatchSize();
  const subject = buildProductBroadcastSubject(params.product.title);
  const body = buildProductBroadcastBody({
    productTitle: params.product.title,
    teaser: params.teaser,
    productSlug: params.product.slug,
  });

  let sentCount = 0;
  let failedCount = 0;
  const sentAudienceIds: ObjectId[] = [];

  for (let index = 0; index < recipients.length; index += batchSize) {
    const batch = recipients.slice(index, index + batchSize);
    const results = await Promise.all(
      batch.map(async (recipient) => ({
        recipient,
        result: await sendPlainTextEmail(recipient.email, subject, body),
      }))
    );

    for (const entry of results) {
      if (entry.result.success) {
        sentCount += 1;
        if (entry.recipient._id) {
          sentAudienceIds.push(entry.recipient._id);
        }
      } else {
        failedCount += 1;
      }
    }
  }

  const completedAt = new Date();
  const status = failedCount === 0 ? "COMPLETED" : sentCount > 0 ? "PARTIAL" : "FAILED";
  let warning: string | undefined;

  if (sentAudienceIds.length > 0) {
    try {
      await params.db.collection<AudienceContact>("audiences").updateMany(
        { _id: { $in: sentAudienceIds } },
        {
          $set: {
            lastBroadcastAt: completedAt,
            updatedAt: completedAt,
          },
        }
      );
    } catch (updateError) {
      warning = "Broadcast sent, but audience timestamp updates failed";
      console.error("[Broadcast] Failed to update audience timestamps:", updateError);
    }
  }

  try {
    await logBroadcast(
      {
        mode: "LIVE",
        productId: params.product._id,
        productSlug: params.product.slug,
        productTitle: params.product.title,
        subject,
        teaser: params.teaser,
        recipientCount,
        sentCount,
        failedCount,
        recipientsSample: recipients.slice(0, 10).map((recipient) => recipient.email),
        status,
        requestedBy: "ADMIN",
        createdAt: completedAt,
        completedAt,
      },
      params.db
    );
  } catch (loggingError) {
    warning = warning
      ? `${warning}; broadcast logging failed`
      : "Broadcast sent, but logging failed";
    console.error("[Broadcast] Failed to log live broadcast:", loggingError);
  }

  return {
    success: sentCount > 0,
    status,
    recipientCount,
    sentCount,
    failedCount,
    error: sentCount > 0 ? undefined : "All broadcast sends failed",
    warning,
  };
}
