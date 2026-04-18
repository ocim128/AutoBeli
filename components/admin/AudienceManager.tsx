"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Spinner from "@/components/ui/Spinner";

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

function statusClassName(status: AudienceStatus): string {
  if (status === "ACTIVE") return "bg-green-100 text-green-800";
  if (status === "EXCLUDED") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
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
    const confirmed = window.confirm(`Delete ${row.email} from the audience list?`);
    if (!confirmed) return;

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
        <div>
          <Link href="/admin/dashboard" className="text-indigo-600 hover:underline text-sm">
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mt-2">Audience</h1>
          <p className="text-gray-500 mt-1">
            Manage customer emails collected from paid orders, then use them for product broadcast.
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 transition"
        >
          Export CSV
        </button>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm space-y-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px_auto_auto] md:items-end">
          <div>
            <label className="block text-sm font-medium mb-2">Search Email</label>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters();
              }}
              placeholder="customer@example.com"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusInput}
              onChange={(event) => setStatusInput(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="EXCLUDED">Excluded</option>
              <option value="BOUNCED">Bounced</option>
            </select>
          </div>

          <button
            onClick={applyFilters}
            className="px-4 py-2 rounded-lg border border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition"
          >
            Apply
          </button>

          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>

        {data && (
          <p className="text-sm text-gray-500">
            Showing {data.rows.length} of {data.total} audience contacts
          </p>
        )}
      </div>

      {editingRow && (
        <div className="bg-white border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Edit Audience Contact</h2>
              <p className="text-sm text-gray-500">{editingRow.email}</p>
            </div>
            <button onClick={closeEdit} className="text-sm text-gray-500 hover:text-gray-700">
              Cancel
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={(event) => setFormEmail(event.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={formStatus}
                onChange={(event) => setFormStatus(event.target.value as AudienceStatus)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="ACTIVE">Active</option>
                <option value="EXCLUDED">Excluded</option>
                <option value="BOUNCED">Bounced</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Notes</label>
            <textarea
              value={formNotes}
              onChange={(event) => setFormNotes(event.target.value)}
              rows={4}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              onClick={() => void deleteRow(editingRow)}
              disabled={deletingId === editingRow._id}
              className="px-4 py-2 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50 transition"
            >
              {deletingId === editingRow._id ? "Deleting..." : "Delete from List"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Spinner size={32} />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audience contacts found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="p-4">Email</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">First Paid</th>
                    <th className="p-4">Last Paid</th>
                    <th className="p-4">Updated</th>
                    <th className="p-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-gray-900">{row.email}</div>
                        {row.notes ? (
                          <div className="text-xs text-gray-500 mt-1">{row.notes}</div>
                        ) : null}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusClassName(row.status)}`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="p-4 font-medium">{row.totalPaidOrders}</td>
                      <td className="p-4 text-gray-500">{formatDate(row.firstPaidOrderAt)}</td>
                      <td className="p-4 text-gray-500">{formatDate(row.lastPaidOrderAt)}</td>
                      <td className="p-4 text-gray-500">{formatDate(row.updatedAt)}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openEdit(row)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-4 border-t px-4 py-3">
              <p className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={data.page <= 1}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                  disabled={data.page >= data.totalPages}
                  className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
