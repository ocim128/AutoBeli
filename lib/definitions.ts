import { ObjectId } from "mongodb";

export type Role = "ADMIN" | "USER";

export interface Product {
  _id?: ObjectId;
  title: string;
  slug: string; // Unique index
  description: string;
  priceIdr: number; // Integer
  contentEncrypted: string; // Encrypted text content
  isActive: boolean;
  isSold?: boolean; // True when product has been purchased (unique products)
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  _id?: ObjectId;
  productId: ObjectId;
  status: "PENDING" | "PAID" | "EXPIRED";
  amountPaid: number;
  paymentGateway: "MOCK" | "VERIPAY";
  paymentMetadata?: {
    provider: string;
    transaction_ref?: string;
    signature?: string;
    payment_method?: string;
    payment_time?: string;
  };
  customerContact?: string; // Email for order recovery
  paidAt?: Date; // When payment was confirmed
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
