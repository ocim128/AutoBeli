"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Settings"
        description="Outbound email runs through your Cloudflare worker when configured."
      />

      {/* Notice */}
      <Panel padding="md" className="bg-[var(--panel-2,var(--panel))]">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-block size-1.5 shrink-0 rounded-full bg-[var(--warning)]"
            aria-hidden="true"
          />
          <div>
            <p className="eyebrow">Email Delivery</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--foreground)] opacity-80">
              Customer access is delivered on the order page directly. Email is a best-effort copy
              sent through Cloudflare when the worker endpoint and secret are configured.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Flow */}
        <Panel monoLabel="DELIVERY" title="Current Flow">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              After payment, customers should use their order page as the primary delivery path,
              with email acting as a backup copy.
            </p>
            <Separator />
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              The stored checkout email remains useful for order recovery, support, and admin order
              search.
            </p>
          </div>
        </Panel>

        {/* Recovery Path */}
        <Panel monoLabel="RECOVERY" title="Recovery Path">
          <div className="space-y-3">
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              Customers can recover access from{" "}
              <code className="inline-flex items-center rounded-md border border-[var(--line-strong)] bg-[var(--panel)] px-1.5 py-0.5 font-mono text-[0.7rem] text-[var(--accent)]">
                /recover
              </code>{" "}
              using their email address or order ID.
            </p>
            <Separator />
            <p className="text-sm leading-relaxed text-[var(--text-muted)]">
              AutoBeli calls the Cloudflare worker from{" "}
              <code className="inline-flex items-center rounded-md border border-[var(--line-strong)] bg-[var(--panel)] px-1.5 py-0.5 font-mono text-[0.7rem] text-[var(--accent)]">
                lib/email.ts
              </code>
              . Set the worker URL and API key in this app&apos;s environment variables.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
