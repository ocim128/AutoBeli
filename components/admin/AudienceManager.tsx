"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Field } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type AudienceStatus = "ACTIVE" | "EXCLUDED" | "BOUNCED";

interface AudienceRow {
  _id: string;
  email: string;
  status: AudienceStatus;
  notes?: string;
  totalPaidOrders: number;
  firstPaidOrderAt: string | null;
  lastPaidOrderAt: string | null;
  updatedAt: string;
}

interface AudienceResponse {
  rows: AudienceRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function formatDate(value: string | null): string {
  if (!value) return "-";
  return new Date(value).toLocaleString("id-ID");
}

function statusToBadge(status: AudienceStatus) {
  switch (status) {
    case "ACTIVE":
      return <StatusBadge status="success">{status}</StatusBadge>;
    case "EXCLUDED":
      return <StatusBadge status="warning">{status}</StatusBadge>;
    case "BOUNCED":
      return <StatusBadge status="error">{status}</StatusBadge>;
    default:
      return <StatusBadge status="neutral">{status}</StatusBadge>;
  }
}

export default function AudienceManager() {
  const [data, setData] = useState<AudienceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusInput, setStatusInput] = useState("");
  const [status, setStatus] = useState("");
  const [editingRow, setEditingRow] = useState<AudienceRow | null>(null);
  const [formEmail, setFormEmail] = useState("");
  const [formStatus, setFormStatus] = useState<AudienceStatus>("ACTIVE");
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AudienceRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAudience() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          pageSize: "20",
        });

        if (search) params.set("search", search);
        if (status) params.set("status", status);

        const response = await fetch(`/api/admin/audience?${params.toString()}`, {
          cache: "no-store",
        });
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to load audience");
        }

        if (!cancelled) {
          setData(json);
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load audience");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAudience();

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey, search, status]);

  function refreshCurrentPage() {
    setReloadKey((current) => current + 1);
  }

  function openEdit(row: AudienceRow) {
    setEditingRow(row);
    setFormEmail(row.email);
    setFormStatus(row.status);
    setFormNotes(row.notes || "");
    setError("");
  }

  function closeEdit() {
    setEditingRow(null);
    setFormEmail("");
    setFormStatus("ACTIVE");
    setFormNotes("");
  }

  async function saveEdit() {
    if (!editingRow) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/audience/${editingRow._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          status: formStatus,
          notes: formNotes,
        }),
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to update audience contact");
      }

      closeEdit();
      toast.success("Audience contact updated");
      refreshCurrentPage();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to update audience contact"
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRow(row: AudienceRow) {
    setDeletingId(row._id);
    setError("");

    try {
      const response = await fetch(`/api/admin/audience/${row._id}`, {
        method: "DELETE",
      });
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to delete audience contact");
      }

      closeEdit();
      toast.success(`${row.email} removed from audience`);
      if (data && data.rows.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      } else {
        refreshCurrentPage();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : "Failed to delete audience contact"
      );
    } finally {
      setDeletingId("");
      setDeleteTarget(null);
    }
  }

  function applyFilters() {
    setPage(1);
    setSearch(searchInput.trim());
    setStatus(statusInput);
  }

  function resetFilters() {
    setPage(1);
    setSearchInput("");
    setSearch("");
    setStatusInput("");
    setStatus("");
  }

  function exportCsv() {
    window.location.assign("/api/admin/audience/export");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          eyebrow="AUDIENCE"
          title="Audience"
          description="Manage customer emails collected from paid orders, then use them for product broadcast."
        />

        <Button variant="outline" size="sm" onClick={exportCsv}>
          <span className="font-mono text-[0.7rem] uppercase tracking-wider">Export CSV</span>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <Panel padding="sm" variant="ghost" className="border border-[var(--line)] bg-[var(--panel)]">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-[1.5]">
            <Field label="Search Email" monoLabel>
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyFilters();
                }}
                placeholder="customer@example.com"
              />
            </Field>
          </div>

          <div className="w-36">
            <Field label="Status" monoLabel>
              <select
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                className="flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--line-strong)] focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="" className="bg-[var(--panel)]">
                  All
                </option>
                <option value="ACTIVE" className="bg-[var(--panel)]">
                  Active
                </option>
                <option value="EXCLUDED" className="bg-[var(--panel)]">
                  Excluded
                </option>
                <option value="BOUNCED" className="bg-[var(--panel)]">
                  Bounced
                </option>
              </select>
            </Field>
          </div>

          <div className="flex items-end gap-2 pb-0.5">
            <Button variant="outline" size="sm" onClick={applyFilters}>
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </div>

        {data && (
          <p className="mt-3 font-mono text-[0.65rem] tracking-wide text-[var(--text-muted)]">
            {data.rows.length} of {data.total} contacts
          </p>
        )}
      </Panel>

      {/* Edit Dialog */}
      <Dialog open={!!editingRow} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-[var(--foreground)]">
              Edit Contact
            </DialogTitle>
            <DialogDescription className="font-mono text-[0.7rem] tracking-wide text-[var(--text-muted)]">
              {editingRow?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" monoLabel>
                <Input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                />
              </Field>
              <Field label="Status" monoLabel>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as AudienceStatus)}
                  className="flex h-8 w-full rounded-[var(--radius-sm)] border border-[var(--line)] bg-[var(--panel)] px-2.5 py-1 text-sm text-[var(--foreground)] outline-none focus-visible:border-[var(--line-strong)] focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="ACTIVE" className="bg-[var(--panel)]">
                    Active
                  </option>
                  <option value="EXCLUDED" className="bg-[var(--panel)]">
                    Excluded
                  </option>
                  <option value="BOUNCED" className="bg-[var(--panel)]">
                    Bounced
                  </option>
                </select>
              </Field>
            </div>

            <Field label="Notes" monoLabel>
              <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={3} />
            </Field>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>Cancel</DialogClose>
            <Button size="sm" onClick={() => void saveEdit()} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            {editingRow && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteTarget(editingRow)}
                disabled={deletingId === editingRow._id}
              >
                {deletingId === editingRow._id ? "Deleting..." : "Delete"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-[var(--foreground)]">
              Remove from Audience
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-[var(--text-muted)]">
              Delete{" "}
              <span className="font-mono text-xs text-[var(--foreground)]">
                {deleteTarget?.email}
              </span>{" "}
              from the audience list. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                if (deleteTarget) void deleteRow(deleteTarget);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-3 font-mono text-xs text-[var(--danger)]">
          {error}
        </div>
      )}

      {/* Table */}
      <DataTableShell
        title="CONTACTS"
        loading={loading}
        empty={!data || data.rows.length === 0}
        emptyContent={
          <EmptyState
            title="No contacts yet"
            description="Customer emails from paid orders will appear here."
          />
        }
      >
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Email
              </TableHead>
              <TableHead className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Status
              </TableHead>
              <TableHead className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] text-center">
                Orders
              </TableHead>
              <TableHead className="hidden md:table-cell font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                First Paid
              </TableHead>
              <TableHead className="hidden md:table-cell font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Last Paid
              </TableHead>
              <TableHead className="hidden lg:table-cell font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                Updated
              </TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>
                  <div className="text-sm font-medium text-[var(--foreground)]">{row.email}</div>
                  {row.notes ? (
                    <div className="mt-0.5 text-[0.7rem] leading-snug text-[var(--text-muted)]">
                      {row.notes}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>{statusToBadge(row.status)}</TableCell>
                <TableCell className="font-mono text-xs text-center tabular-nums">
                  {row.totalPaidOrders}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-[0.65rem] text-[var(--text-muted)] tabular-nums">
                  {formatDate(row.firstPaidOrderAt)}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-[0.65rem] text-[var(--text-muted)] tabular-nums">
                  {formatDate(row.lastPaidOrderAt)}
                </TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-[0.65rem] text-[var(--text-muted)] tabular-nums">
                  {formatDate(row.updatedAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => openEdit(row)}
                    className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--accent)]"
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] px-4 py-2.5">
            <span className="font-mono text-[0.65rem] tabular-nums text-[var(--text-muted)]">
              Page {data.page} of {data.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                disabled={data.page <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setPage((c) => Math.min(data.totalPages, c + 1))}
                disabled={data.page >= data.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </DataTableShell>
    </div>
  );
}
