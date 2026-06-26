"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Download } from "lucide-react";
import { CATEGORIES, formatKES, type ProviderStatus } from "@localfind/shared";
import StatusBadge from "../../components/StatusBadge";
import { useAppData } from "../../context/AppDataContext";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: ProviderStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Verification" },
  { value: "suspended", label: "Suspended" },
];

function toCsvValue(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function ProvidersPage() {
  const { providers, setProviderStatus } = useAppData();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<ProviderStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCategory = category === "all" || p.category === category;
      const matchesStatus = status === "all" || p.status === status;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [providers, search, category, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function handleExportCsv() {
    const header = [
      "Name",
      "Category",
      "Location",
      "Token Balance",
      "Rating",
      "Status",
    ];
    const rows = filtered.map((p) => [
      p.name,
      p.category,
      p.address,
      p.tokenBalance,
      p.rating,
      p.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(toCsvValue).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "providers-export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-mutedText"
          />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search providers by name..."
            className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>

        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="rounded-md border border-border bg-white py-2 px-3 text-sm outline-none focus:border-primary"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as ProviderStatus | "all");
            setPage(1);
          }}
          className="rounded-md border border-border bg-white py-2 px-3 text-sm outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-midText hover:border-primary hover:text-primary"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-mutedText">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Token Balance</th>
              <th className="px-4 py-3">Rating</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium text-darkText">{p.name}</td>
                <td className="px-4 py-3 text-midText">{p.category}</td>
                <td className="px-4 py-3 text-midText">{p.address}</td>
                <td className="px-4 py-3 text-midText">{p.tokenBalance}</td>
                <td className="px-4 py-3 text-midText">{p.rating.toFixed(1)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/providers/${p.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                    {p.status === "pending" && (
                      <button
                        onClick={() => setProviderStatus(p.id, "active")}
                        className="rounded-md border border-success px-2 py-1 text-xs font-medium text-success hover:bg-success/10"
                      >
                        Approve
                      </button>
                    )}
                    {p.status !== "suspended" && (
                      <button
                        onClick={() => setProviderStatus(p.id, "suspended")}
                        className="rounded-md border border-danger px-2 py-1 text-xs font-medium text-danger hover:bg-danger/10"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-mutedText">
                  No providers match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-mutedText">
        <span>
          Showing {pageRows.length} of {filtered.length} providers
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage >= totalPages}
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
