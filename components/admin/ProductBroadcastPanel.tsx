"use client";

import { useMemo, useState } from "react";
import {
  buildProductBroadcastBody,
  buildProductBroadcastSubject,
  buildProductUrl,
} from "@/lib/broadcastTemplate";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

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
  const [confirmLive, setConfirmLive] = useState(false);

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

      toast.success(
        json.warning
          ? `Test email sent to ${testEmail}. ${json.warning}`
          : `Test email sent to ${testEmail}.`
      );
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : "Failed to send test email";
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingTest(false);
    }
  }

  async function sendLive() {
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
      toast.success(json.warning ? `${summary} ${json.warning}` : summary);
      setAdminPassword("");
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : "Failed to send broadcast";
      setError(msg);
      toast.error(msg);
    } finally {
      setSendingLive(false);
      setConfirmLive(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Info Cards */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel monoLabel="PRODUCT">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-mono text-[0.65rem] uppercase text-[var(--text-muted)]">
                Title
              </span>
              <p className="text-[var(--foreground)]">{product.title}</p>
            </div>
            <div>
              <span className="font-mono text-[0.65rem] uppercase text-[var(--text-muted)]">
                Slug
              </span>
              <p className="font-mono text-xs text-[var(--foreground)]">/{product.slug}</p>
            </div>
            <div>
              <span className="font-mono text-[0.65rem] uppercase text-[var(--text-muted)]">
                Status
              </span>
              <div className="mt-0.5">
                {product.isActive ? (
                  <StatusBadge status="success">ACTIVE</StatusBadge>
                ) : (
                  <StatusBadge status="pending">INACTIVE</StatusBadge>
                )}
              </div>
            </div>
            <div>
              <span className="font-mono text-[0.65rem] uppercase text-[var(--text-muted)]">
                Public URL
              </span>
              <a
                href={buildProductUrl(product.slug)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 block break-all font-mono text-xs text-[var(--accent)] hover:underline"
              >
                {buildProductUrl(product.slug)}
              </a>
            </div>
          </div>
        </Panel>

        <Panel monoLabel="RECIPIENTS">
          <p className="font-serif text-4xl text-[var(--foreground)]">{recipientCount}</p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Eligible audience contacts after excluding deleted, excluded, bounced, and prior buyers
            of this product.
          </p>
        </Panel>

        <Panel monoLabel="LIVE SEND RULES">
          <ul className="space-y-2 text-xs text-[var(--text-muted)]">
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Product must stay active.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Product must still have stock available.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Live send needs the admin password again.
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Test send uses the same template as live send.
            </li>
          </ul>
        </Panel>
      </div>

      {/* Blocker Warnings */}
      {!product.isActive && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-400">
          Live broadcast is blocked because this product is inactive.
        </div>
      )}

      {!hasAvailableStock && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 font-mono text-xs text-amber-400">
          Live broadcast is blocked because this product is sold out.
        </div>
      )}

      {/* Broadcast Copy */}
      <Panel monoLabel="BROADCAST COPY">
        <p className="-mt-2 mb-4 text-xs text-[var(--text-muted)]">
          Keep it short and direct. This feature uses a fixed template and your teaser line.
        </p>

        <Field label="Teaser" monoLabel helper={`${teaser.length}/160 characters`}>
          <Textarea
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            rows={4}
            maxLength={160}
            placeholder="Cocok buat yang cari akses cepat tanpa ribet."
          />
        </Field>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <span className="mb-1.5 block font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
              Subject Preview
            </span>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 text-sm text-[var(--foreground)]">
              {subjectPreview}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
              Body Preview
            </span>
            <pre className="min-h-48 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 font-mono text-xs text-[var(--text-muted)]">
              {bodyPreview}
            </pre>
          </div>
        </div>
      </Panel>

      {/* Send Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel monoLabel="TEST SEND">
          <p className="-mt-2 mb-4 text-xs text-[var(--text-muted)]">
            Send the exact broadcast template to one email first.
          </p>

          <Field label="Test Email" monoLabel>
            <Input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </Field>

          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => void sendTest()}
            disabled={sendingTest || teaser.trim().length < 10 || !testEmail.trim()}
          >
            {sendingTest ? "Sending..." : "Send Test Email"}
          </Button>
        </Panel>

        <Panel monoLabel="LIVE BROADCAST">
          <p className="-mt-2 mb-4 text-xs text-[var(--text-muted)]">
            This sends to all currently eligible audience contacts for this product.
          </p>

          <Field label="Admin Password" monoLabel>
            <Input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </Field>

          <Button
            size="sm"
            className="mt-4"
            onClick={() => setConfirmLive(true)}
            disabled={
              sendingLive ||
              teaser.trim().length < 10 ||
              !adminPassword.trim() ||
              recipientCount === 0 ||
              !canLiveSend
            }
          >
            {sendingLive ? "Sending..." : `Send to ${recipientCount} Contacts`}
          </Button>
        </Panel>
      </div>

      {/* Live Send Confirmation */}
      <AlertDialog open={confirmLive} onOpenChange={setConfirmLive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[var(--foreground)]">
              Confirm Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription>
              Send this broadcast to {recipientCount} eligible contacts for {product.title}? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void sendLive()}>Confirm Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Feedback */}
      {error && (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 font-mono text-xs text-red-400">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 font-mono text-xs text-emerald-400">
          {message}
        </div>
      )}
    </div>
  );
}
