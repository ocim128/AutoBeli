
import { getSession, logoutAdmin } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function AdminDashboard() {
    const session = await getSession(); // Verify server-side for extra safety
    if (!session) redirect('/admin/login');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <form action={async () => {
                    'use server';
                    await logoutAdmin();
                    redirect('/admin/login');
                }}>
                    <button className="text-red-600 hover:underline">Logout</button>
                </form>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Link
                    href="/admin/products"
                    className="block rounded-lg border p-6 hover:bg-gray-50 transition"
                >
                    <h2 className="text-xl font-semibold">Manage Products</h2>
                    <p className="text-gray-500">Create, edit, and activate text products.</p>
                </Link>
                <Link
                    href="/admin/orders"
                    className="block rounded-lg border p-6 hover:bg-gray-50 transition"
                >
                    <h2 className="text-xl font-semibold">Manage Orders</h2>
                    <p className="text-gray-500">View customer orders and status.</p>
                </Link>
            </div>
        </div>
    );
}
