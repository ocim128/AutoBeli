
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SECRET_KEY = process.env.JWT_SECRET || 'default_secret_key_change_me';
const key = new TextEncoder().encode(SECRET_KEY);

export async function signSession(payload: any) {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // Session lasts 24 hours
        .sign(key);
}

export async function verifySession(token: string) {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!session) return null;
    return await verifySession(session);
}

export async function loginAdmin(password: string) {
    if (password === process.env.ADMIN_PASSWORD) {
        // Create session
        const token = await signSession({ role: 'ADMIN' });

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 24 hours
        });

        return true;
    }
    return false;
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
}
