"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CONFIGURATION"
        title="Settings"
        description="Outbound email runs through your Cloudflare worker when configured."
      />

      {/* Warning */}
      <Panel variant="accent" padding="md">
        <div className="flex items-start gap-3">
          <StatusBadge status="warning">Notice</StatusBadge>
          <p className="text-sm text-[var(--foreground)] opacity-90">
            Customer access is still delivered on the order page directly. Email is a best-effort
            copy sent through Cloudflare when the worker endpoint and secret are configured.
          </p>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Flow */}
        <Panel monoLabel="DELIVERY" title="Current Flow">
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              After payment, customers should use their order page as the primary delivery path,
              with email acting as a backup copy.
            </p>
            <Separator />
            <p className="text-sm text-[var(--text-muted)]">
              The stored checkout email remains useful for order recovery, support, and admin order
              search.
            </p>
          </div>
        </Panel>

        {/* Recovery Path */}
        <Panel monoLabel="RECOVERY" title="Recovery Path">
          <div className="space-y-3">
            <p className="text-sm text-[var(--text-muted)]">
              Customers can recover access from{" "}
              <span className="font-mono text-xs text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded">
                /recover
              </span>{" "}
              using their email address or order ID.
            </p>
            <Separator />
            <p className="text-sm text-[var(--text-muted)]">
              AutoBeli calls the Cloudflare worker from{" "}
              <span className="font-mono text-xs text-[var(--accent)] bg-[var(--accent-soft)] px-1.5 py-0.5 rounded">
                lib/email.ts
              </span>
              . Set the worker URL and API key in this app&apos;s environment variables.
            </p>
          </div>
        </Panel>
      </div>
    </div>
  );
}
