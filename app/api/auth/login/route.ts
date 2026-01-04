
import { loginAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json({ error: 'Password required' }, { status: 400 });
        }

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
