"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import { formatDate } from "../../../lib/format";
import { adminFetch, describeError, type Paged, type UserRow } from "../../../lib/adminClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

const ROLE_OPTIONS = [
  { value: "", label: "All users" },
  { value: "seeker", label: "Seekers" },
  { value: "provider", label: "Providers" },
];

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<UserRow> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wait for a short pause in typing before searching.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (q) params.set("q", q);
    if (role) params.set("role", role);

    adminFetch<Paged<UserRow>>(`/api/admin/users?${params}`, { signal: controller.signal })
      .then(setData)
      .catch((e) => {
        if (!controller.signal.aborted) setError(describeError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [q, role, page]);

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
            placeholder="Search by name, email or phone..."
            aria-label="Search users"
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by type"
          className="rounded-md border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {ROLE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaryTint text-sm font-semibold text-primary">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-darkText">{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-midText">
                  {u.email}
                  {!u.emailVerified && (
                    <span className="ml-2 text-xs text-mutedText">(not verified)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-midText">{u.phone}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.role} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.disabled ? "suspended" : "active"} />
                </td>
                <td className="px-4 py-3 text-midText">{formatDate(u.createdAt)}</td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mutedText">
                  {q || role ? "No users match these filters." : "No one has registered yet."}
                </td>
              </tr>
            )}
            {loading && items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-mutedText">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-mutedText">
        <span>
          Showing {items.length} of {total} users
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
