
import { ObjectId } from 'mongodb';

export type Role = 'ADMIN' | 'USER';

export interface Product {
    _id?: ObjectId;
    title: string;
    slug: string; // Unique index
    description: string;
    priceIdr: number; // Integer
    contentEncrypted: string; // Encrypted text content
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface Order {
    _id?: ObjectId;
    productId: ObjectId;
    status: 'PENDING' | 'PAID' | 'EXPIRED';
    amountPaid: number;
    paymentGateway: string; // e.g., 'MOCK', 'DOKU' (future)
    paymentMetadata?: Record<string, any>;
    customerContact?: string; // Email or WhatsApp number
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
