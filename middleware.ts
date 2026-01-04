
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './lib/auth';

export async function middleware(request: NextRequest) {
    // 1. Check if route is protected (starts with /admin)
    if (request.nextUrl.pathname.startsWith('/admin')) {

        // 2. Exclude login page from protection loop
        if (request.nextUrl.pathname === '/admin/login') {
            return NextResponse.next();
        }

        // 3. Check for session cookie
        const cookie = request.cookies.get('admin_session')?.value;
        const session = cookie ? await verifySession(cookie) : null;

        // 4. Redirect to login if no valid session
        if (!session || session.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};
