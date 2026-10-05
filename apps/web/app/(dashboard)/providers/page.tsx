"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { CATEGORIES } from "@localfind/shared";
import StatusBadge from "../../../components/StatusBadge";
import { formatDate } from "../../../lib/format";
import { toCsv } from "../../../lib/csv";
import {
  adminFetch,
  describeError,
  type Paged,
  type ProviderActionName,
  type ProviderRow,
} from "../../../lib/adminClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const EXPORT_PAGE_SIZE = 100;
const EXPORT_MAX_PAGES = 50;

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Verification" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

export default function ProvidersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState<Paged<ProviderRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  function filterParams(pageNumber: number, pageSize: number) {
    const params = new URLSearchParams({ page: String(pageNumber), pageSize: String(pageSize) });
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    return params;
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    adminFetch<Paged<ProviderRow>>(`/api/admin/providers?${filterParams(page, PAGE_SIZE)}`, {
      signal: controller.signal,
    })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(describeError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
    // filterParams reads q, category and status, which are listed here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, category, status, page, refreshKey]);

  async function runAction(id: string, action: ProviderActionName) {
    if (
      action === "suspend" &&
      !window.confirm("Suspend this provider? They will be signed out of the app straight away.")
    ) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      await adminFetch(`/api/admin/providers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusyId(null);
    }
  }

  // Exports every provider that matches the current filters, not just this page.
  async function handleExportCsv() {
    setExporting(true);
    setError(null);
    try {
      const rows: ProviderRow[] = [];
      for (let p = 1; p <= EXPORT_MAX_PAGES; p++) {
        const result = await adminFetch<Paged<ProviderRow>>(
          `/api/admin/providers?${filterParams(p, EXPORT_PAGE_SIZE)}`
        );
        rows.push(...result.items);
        if (rows.length >= result.total || result.items.length === 0) break;
      }

      const csv = toCsv([
        ["Business", "Owner", "Email", "Phone", "Category", "City", "Status", "Joined"],
        ...rows.map((r) => [
          r.businessName,
          r.owner.name,
          r.owner.email,
          r.owner.phone,
          r.category,
          r.city,
          r.status,
          r.createdAt.slice(0, 10),
        ]),
      ]);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "providers-export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setExporting(false);
    }
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const items = data?.items ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mutedText"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business, owner or email..."
            aria-label="Search providers"
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleExportCsv}
          disabled={exporting || total === 0}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-midText hover:border-primary hover:text-primary disabled:opacity-40"
        >
          <Download size={16} />
          {exporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-mutedText">
            <tr>
              <th className="px-4 py-3">Business</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-darkText">{p.businessName}</td>
                <td className="px-4 py-3 text-midText">
                  <div>{p.owner.name}</div>
                  <div className="text-xs text-mutedText">{p.owner.email}</div>
                </td>
                <td className="px-4 py-3 text-midText">{p.category}</td>
                <td className="px-4 py-3 text-midText">{p.city ?? ""}</td>
                <td className="px-4 py-3 text-midText">{formatDate(p.createdAt)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/providers/${p.id}`} className="text-primary hover:underline">
                      View
                    </Link>
                    {(p.status === "pending" || p.status === "rejected") && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "approve")}
                        className="rounded-md border border-success px-2 py-1 text-xs font-medium text-success hover:bg-success/10 disabled:opacity-40"
                      >
                        Approve
                      </button>
                    )}
                    {p.status === "pending" && (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "reject")}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-midText hover:bg-background disabled:opacity-40"
                      >
                        Reject
                      </button>
                    )}
                    {p.status === "suspended" ? (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "reinstate")}
                        className="rounded-md border border-success px-2 py-1 text-xs font-medium text-success hover:bg-success/10 disabled:opacity-40"
                      >
                        Reinstate
                      </button>
                    ) : (
                      <button
                        disabled={busyId === p.id}
                        onClick={() => runAction(p.id, "suspend")}
                        className="rounded-md border border-danger px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-mutedText">
                  {q || category || status
                    ? "No providers match these filters."
                    : "No providers have registered yet."}
                </td>
              </tr>
            )}
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-mutedText">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-mutedText">
        <span>
          Showing {items.length} of {total} providers
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {Math.min(page, totalPages)} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
