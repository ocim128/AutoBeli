
import { loginAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit';
import { validate, loginSchema } from '@/lib/validation';

export async function POST(request: Request) {
    try {
        // Rate limiting - stricter for login attempts
        const ip = getClientIP(request);
        const rateLimitResult = checkRateLimit(`auth:login:${ip}`, RATE_LIMITS.LOGIN);

        if (!rateLimitResult.success) {
            const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
            return NextResponse.json(
                { error: `Too many login attempts. Please try again in ${Math.ceil(retryAfter / 60)} minutes.` },
                {
                    status: 429,
                    headers: {
                        'Retry-After': retryAfter.toString(),
                    }
                }
            );
        }

        // Validate input
        const body = await request.json();
        const validation = validate(loginSchema, body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const { password } = validation.data!;
        const success = await loginAdmin(password);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (e) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
