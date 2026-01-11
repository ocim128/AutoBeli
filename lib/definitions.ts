import { ObjectId } from "mongodb";

export type Role = "ADMIN" | "USER";

/**
 * Stock item representing a single unique piece of content that can be sold.
 * Each stock item has its own encrypted content and sold status.
 */
export interface StockItem {
  id: string; // Unique identifier for this stock item
  contentEncrypted: string; // Encrypted text content
  isSold: boolean;
  soldAt?: Date;
  orderId?: ObjectId; // Reference to the order that purchased this item
}

export interface Product {
  _id?: ObjectId;
  title: string;
  slug: string; // Unique index
  description: string;
  priceIdr: number; // Integer

  // Legacy single content field (for backward compatibility)
  contentEncrypted?: string; // Encrypted text content

  // New stock system: array of stock items with unique content
  stockItems?: StockItem[];

  // Post-purchase template message (shown with all stock items after successful payment)
  // Example: "Thanks for ordering {productTitle}! Here's your unique content:"
  postPurchaseTemplate?: string;

  imageUrl?: string; // Optional product image URL
  isActive: boolean;
  isSold?: boolean; // True when product has been purchased (all stock sold for legacy, or no stock left)
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  _id?: ObjectId;
  productId: ObjectId;
  quantity?: number; // Number of items purchased (default 1)
  stockItemId?: string; // For legacy single stock purchase
  stockItemIds?: string[]; // For multi-item purchases
  status: "PENDING" | "PAID" | "EXPIRED";
  amountPaid: number;
  paymentGateway: "MOCK" | "VERIPAY" | "MIDTRANS" | "PAKASIR";
  paymentMetadata?: {
    provider: string;
    transaction_ref?: string;
    signature?: string;
    payment_method?: string;
    payment_time?: string;
  };
  customerContact?: string; // Email for order recovery
  paidAt?: Date; // When payment was confirmed
  emailSent?: boolean; // True when order confirmation email has been sent
  createdAt: Date;
  updatedAt: Date;
}

export interface AccessToken {
  _id?: ObjectId;
  orderId: ObjectId;
  token: string; // Unique access token
  usageCount: number;
  lastAccessedAt?: Date;
  createdAt: Date;
}

export interface Settings {
  _id?: ObjectId;
  emailEnabled: boolean;
  emailFromName: string;
  emailFromAddress: string;
  emailSubjectTemplate: string;
  emailBodyTemplate: string;
  mailgunDomain: string;
  createdAt?: Date;
  updatedAt?: Date;
}
