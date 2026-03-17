"use client";

import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:underline text-sm">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">Email Settings</h1>
          <p className="text-gray-500 mt-1">
            Outbound email runs through your Cloudflare worker when configured.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-xl">
        Customer access is still delivered on the order page directly. Email is a best-effort copy
        sent through Cloudflare when the worker endpoint and secret are configured.
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Current Flow</h2>
          <p className="text-sm text-gray-600">
            After payment, customers should use their order page as the primary delivery path, with
            email acting as a backup copy.
          </p>
          <p className="text-sm text-gray-600">
            The stored checkout email remains useful for order recovery, support, and admin order
            search.
          </p>
        </section>

        <section className="bg-white p-6 rounded-xl border shadow-sm space-y-3">
          <h2 className="text-lg font-semibold">Recovery Path</h2>
          <p className="text-sm text-gray-600">
            Customers can recover access from <span className="font-mono">/recover</span> using
            their email address or order ID.
          </p>
          <p className="text-sm text-gray-600">
            AutoBeli calls the Cloudflare worker from{" "}
            <span className="font-mono">lib/email.ts</span>. Set the worker URL and API key in this
            app&apos;s environment variables.
          </p>
        </section>
      </div>
    </div>
  );
}
