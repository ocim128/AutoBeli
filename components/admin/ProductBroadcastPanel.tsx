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
        teaser: teaser || "Your teaser preview will appear here once you write it.",
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
      const msg = sendError instanceof Error ? sendError.message : "Failed to send test email";
      setError(msg);
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
      setMessage(json.warning ? `${summary} ${json.warning}` : summary);
      setAdminPassword("");
    } catch (sendError) {
      const msg = sendError instanceof Error ? sendError.message : "Failed to send broadcast";
      setError(msg);
    } finally {
      setSendingLive(false);
      setConfirmLive(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* ── Info row ── */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel monoLabel="PRODUCT" padding="sm">
          <div className="space-y-1.5 text-sm">
            <div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Title
              </span>
              <p className="leading-snug text-[var(--foreground)]">{product.title}</p>
            </div>
            <div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Slug
              </span>
              <p className="font-mono text-xs text-[var(--foreground)]">/{product.slug}</p>
            </div>
            <div>
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
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
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
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

        <Panel monoLabel="RECIPIENTS" padding="sm">
          <p className="font-serif text-3xl tracking-tight text-[var(--foreground)]">
            {recipientCount.toLocaleString()}
          </p>
          <p className="mt-1.5 font-mono text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
            Eligible contacts — excludes deleted, bounced, and prior buyers.
          </p>
        </Panel>

        <Panel monoLabel="LIVE SEND RULES" padding="sm">
          <ul className="space-y-1 font-mono text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Product must be active.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Stock must be available.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Admin password re-entry required.
            </li>
            <li className="flex items-start gap-1.5">
              <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-[var(--text-muted)]" />
              Test send uses same template.
            </li>
          </ul>
        </Panel>
      </div>

      {/* ── Blocker warnings — calm muted style ── */}
      {!product.isActive && (
        <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--panel-2)] px-4 py-2.5 font-mono text-[0.7rem] tracking-wide text-[var(--text-muted)]">
          Broadcast blocked — product is inactive.
        </div>
      )}

      {!hasAvailableStock && (
        <div className="rounded-lg border border-[var(--line-strong)] bg-[var(--panel-2)] px-4 py-2.5 font-mono text-[0.7rem] tracking-wide text-[var(--text-muted)]">
          Broadcast blocked — product is sold out.
        </div>
      )}

      {/* ── Broadcast copy ── */}
      <Panel monoLabel="BROADCAST COPY">
        <p className="mb-4 font-mono text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
          Fixed template with your teaser line. Keep it short.
        </p>

        <Field label="Teaser" monoLabel helper={`${teaser.length}/160 characters`}>
          <Textarea
            value={teaser}
            onChange={(e) => setTeaser(e.target.value)}
            rows={3}
            maxLength={160}
            placeholder="Ideal for customers who want quick access without extra steps."
          />
        </Field>

        {/* ── Email preview ── */}
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div>
            <span className="mb-1 block font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Subject
            </span>
            <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3.5 py-2.5 text-sm leading-snug text-[var(--foreground)]">
              {subjectPreview}
            </div>
          </div>
          <div>
            <span className="mb-1 block font-mono text-[0.6rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
              Body
            </span>
            <pre className="min-h-44 whitespace-pre-wrap rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-3.5 py-2.5 font-mono text-[0.7rem] leading-[1.65] text-[var(--text-muted)]">
              {bodyPreview}
            </pre>
          </div>
        </div>
      </Panel>

      {/* ── Send actions — flat row, no nested panels ── */}
      <div className="grid gap-3 lg:grid-cols-2">
        {/* Test Send */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--panel)] p-4">
          <span className="mb-3 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            TEST SEND
          </span>
          <p className="mb-3 font-mono text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
            Send the broadcast template to a single email.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Email" monoLabel>
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </Field>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void sendTest()}
              disabled={sendingTest || teaser.trim().length < 10 || !testEmail.trim()}
              className="shrink-0"
            >
              {sendingTest ? "Sending..." : "Send Test"}
            </Button>
          </div>
        </div>

        {/* Live Broadcast */}
        <div className="rounded-[var(--radius-xl)] border border-[var(--line)] bg-[var(--panel)] p-4">
          <span className="mb-3 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
            LIVE BROADCAST
          </span>
          <p className="mb-3 font-mono text-[0.65rem] leading-relaxed text-[var(--text-muted)]">
            Sends to all {recipientCount.toLocaleString()} eligible contacts.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Field label="Admin Password" monoLabel>
                <Input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </Field>
            </div>
            <Button
              size="sm"
              onClick={() => setConfirmLive(true)}
              disabled={
                sendingLive ||
                teaser.trim().length < 10 ||
                !adminPassword.trim() ||
                recipientCount === 0 ||
                !canLiveSend
              }
              className="shrink-0"
            >
              {sendingLive ? "Sending..." : `Send to ${recipientCount.toLocaleString()}`}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Confirmation dialog ── */}
      <AlertDialog open={confirmLive} onOpenChange={setConfirmLive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[var(--foreground)]">
              Confirm Broadcast
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono text-[0.8rem] leading-relaxed">
              Send to{" "}
              <span className="text-[var(--foreground)]">{recipientCount.toLocaleString()}</span>{" "}
              eligible contacts for{" "}
              <span className="text-[var(--foreground)]">{product.title}</span>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void sendLive()}>Confirm Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Inline feedback ── */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-2.5 font-mono text-[0.7rem] tracking-wide text-[var(--danger)]">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-[var(--radius-md)] border border-[var(--success)]/30 bg-[var(--success-soft)] px-4 py-2.5 font-mono text-[0.7rem] tracking-wide text-[var(--success)]">
          {message}
        </div>
      )}
    </div>
  );
}
