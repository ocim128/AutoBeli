"use client";

import { useMemo, useState } from "react";
import {
  buildProductBroadcastBody,
  buildProductBroadcastSubject,
  buildProductUrl,
} from "@/lib/broadcastTemplate";

interface ProductBroadcastPanelProps {
  product: {
    title: string;
    slug: string;
    isActive: boolean;
  };
  recipientCount: number;
  canLiveSend: boolean;
  hasAvailableStock: boolean;
}

export default function ProductBroadcastPanel({
  product,
  recipientCount,
  canLiveSend,
  hasAvailableStock,
}: ProductBroadcastPanelProps) {
  const [teaser, setTeaser] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [sendingLive, setSendingLive] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const subjectPreview = useMemo(
    () => buildProductBroadcastSubject(product.title),
    [product.title]
  );
  const bodyPreview = useMemo(
    () =>
      buildProductBroadcastBody({
        productTitle: product.title,
        teaser: teaser || "Teaser singkat akan muncul di sini setelah kamu isi.",
        productSlug: product.slug,
      }),
    [product.slug, product.title, teaser]
  );

  async function sendTest() {
    setSendingTest(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/broadcast/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          teaser,
          targetEmail: testEmail,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to send test email");
      }

      setMessage(
        json.warning
          ? `Test email sent to ${testEmail}. ${json.warning}`
          : `Test email sent to ${testEmail}.`
      );
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send test email");
    } finally {
      setSendingTest(false);
    }
  }

  async function sendLive() {
    const confirmed = window.confirm(
      `Send this broadcast to ${recipientCount} eligible contacts for ${product.title}?`
    );
    if (!confirmed) return;

    setSendingLive(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/broadcast/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          teaser,
          adminPassword,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to send broadcast");
      }

      const summary =
        json.status === "PARTIAL"
          ? `Broadcast partially sent: ${json.sentCount} sent, ${json.failedCount} failed.`
          : `Broadcast sent to ${json.sentCount} contacts.`;
      setMessage(json.warning ? `${summary} ${json.warning}` : summary);
      setAdminPassword("");
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : "Failed to send broadcast");
    } finally {
      setSendingLive(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Product</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Title:</span> {product.title}
            </p>
            <p>
              <span className="font-medium text-gray-900">Slug:</span> /{product.slug}
            </p>
            <p>
              <span className="font-medium text-gray-900">Status:</span>{" "}
              {product.isActive ? "Active" : "Inactive"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Public URL:</span>{" "}
              <a
                href={buildProductUrl(product.slug)}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline break-all"
              >
                {buildProductUrl(product.slug)}
              </a>
            </p>
          </div>
        </section>

        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Recipients</h2>
          <p className="text-4xl font-black">{recipientCount}</p>
          <p className="text-sm text-gray-500">
            Eligible audience contacts after excluding deleted, excluded, bounced, and prior buyers
            of this product.
          </p>
        </section>

        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">Live Send Rules</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>Product must stay active.</li>
            <li>Product must still have stock available.</li>
            <li>Live send needs the admin password again.</li>
            <li>Test send uses the same template as live send.</li>
          </ul>
        </section>
      </div>

      {!product.isActive && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl">
          Live broadcast is blocked because this product is inactive.
        </div>
      )}

      {!hasAvailableStock && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl">
          Live broadcast is blocked because this product is sold out.
        </div>
      )}

      <div className="bg-white border rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Broadcast Copy</h2>
          <p className="text-sm text-gray-500 mt-1">
            Keep it short and direct. This feature uses a fixed template and your teaser line.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Teaser</label>
          <textarea
            value={teaser}
            onChange={(event) => setTeaser(event.target.value)}
            rows={4}
            maxLength={160}
            placeholder="Cocok buat yang cari akses cepat tanpa ribet."
            className="w-full rounded-xl border px-4 py-3"
          />
          <p className="text-xs text-gray-500 mt-2">{teaser.length}/160 characters</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Subject Preview</label>
            <div className="rounded-xl border bg-gray-50 px-4 py-3 font-medium">
              {subjectPreview}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium">Body Preview</label>
            <pre className="rounded-xl border bg-gray-50 px-4 py-3 whitespace-pre-wrap text-sm text-gray-700 min-h-48">
              {bodyPreview}
            </pre>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Test Send</h2>
            <p className="text-sm text-gray-500 mt-1">
              Send the exact broadcast template to one email first.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Test Email</label>
            <input
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="admin@example.com"
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            onClick={() => void sendTest()}
            disabled={sendingTest || teaser.trim().length < 10 || !testEmail.trim()}
            className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 transition"
          >
            {sendingTest ? "Sending Test..." : "Send Test Email"}
          </button>
        </section>

        <section className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Live Broadcast</h2>
            <p className="text-sm text-gray-500 mt-1">
              This sends to all currently eligible audience contacts for this product.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Admin Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) => setAdminPassword(event.target.value)}
              className="w-full rounded-xl border px-4 py-3"
            />
          </div>

          <button
            onClick={() => void sendLive()}
            disabled={
              sendingLive ||
              teaser.trim().length < 10 ||
              !adminPassword.trim() ||
              recipientCount === 0 ||
              !canLiveSend
            }
            className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {sendingLive ? "Sending Broadcast..." : `Send to ${recipientCount} Contacts`}
          </button>
        </section>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl">{error}</div>
      )}

      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl">
          {message}
        </div>
      )}
    </div>
  );
}
