"use client";

import { Fragment, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { seekers, providers, formatKES, ESCROW_FEE_RATE } from "@localfind/shared";
import type { TransactionStatus } from "@localfind/shared";
import StatusBadge from "../../components/StatusBadge";
import { formatDate } from "../../lib/format";
import { useAppData } from "../../context/AppDataContext";

const STATUS_OPTIONS: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in_escrow", label: "In Escrow" },
  { value: "released", label: "Released" },
  { value: "disputed", label: "Disputed" },
];

export default function TransactionsPage() {
  const { transactions } = useAppData();
  const [status, setStatus] = useState<TransactionStatus | "all">("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesStatus = status === "all" || t.status === status;
      const createdAt = new Date(t.createdAt).getTime();
      const afterFrom = !fromDate || createdAt >= new Date(fromDate).getTime();
      const beforeTo =
        !toDate || createdAt <= new Date(toDate).getTime() + 86_400_000 - 1;
      return matchesStatus && afterFrom && beforeTo;
    });
  }, [transactions, status, fromDate, toDate]);

  const totalInEscrow = filtered
    .filter((t) => t.status === "in_escrow")
    .reduce((sum, t) => sum + t.amount, 0);

  const today = new Date().toDateString();
  const totalReleasedToday = filtered
    .filter(
      (t) =>
        t.status === "released" && new Date(t.createdAt).toDateString() === today
    )
    .reduce((sum, t) => sum + t.amount, 0);
  // Released-today is empty for static mock dates, so also surface all-time released as fallback context.
  const totalReleasedAllTime = filtered
    .filter((t) => t.status === "released")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDisputed = filtered
    .filter((t) => t.status === "disputed")
    .reduce((sum, t) => sum + t.amount, 0);

  function getSeekerName(seekerId: string) {
    return seekers.find((s) => s.id === seekerId)?.name ?? seekerId;
  }
  function getProviderName(providerId: string) {
    return providers.find((p) => p.id === providerId)?.name ?? providerId;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryStat label="Total in Escrow" value={formatKES(totalInEscrow)} />
        <SummaryStat
          label="Released Today"
          value={formatKES(totalReleasedToday)}
          hint={
            totalReleasedToday === 0
              ? `All-time released: ${formatKES(totalReleasedAllTime)}`
              : undefined
          }
        />
        <SummaryStat label="Disputed" value={formatKES(totalDisputed)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TransactionStatus | "all")}
          className="rounded-md border border-border bg-white py-2 px-3 text-sm outline-none focus:border-primary"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-mutedText">
          From
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-md border border-border bg-white py-2 px-3 text-sm outline-none focus:border-primary"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-mutedText">
          To
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-md border border-border bg-white py-2 px-3 text-sm outline-none focus:border-primary"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-background text-xs uppercase text-mutedText">
            <tr>
              <th className="px-4 py-3">Transaction ID</th>
              <th className="px-4 py-3">Seeker</th>
              <th className="px-4 py-3">Provider</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => {
              const expanded = expandedId === t.id;
              return (
                <Fragment key={t.id}>
                  <tr
                    onClick={() => setExpandedId(expanded ? null : t.id)}
                    className="cursor-pointer border-t border-border hover:bg-background"
                  >
                    <td className="px-4 py-3 font-medium text-darkText">{t.id}</td>
                    <td className="px-4 py-3 text-midText">
                      {getSeekerName(t.seekerId)}
                    </td>
                    <td className="px-4 py-3 text-midText">
                      {getProviderName(t.providerId)}
                    </td>
                    <td className="px-4 py-3 text-midText">{t.service}</td>
                    <td className="px-4 py-3 text-midText">{formatKES(t.amount)}</td>
                    <td className="px-4 py-3 text-midText">{formatKES(t.fee)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-midText">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-primary">
                      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="border-t border-border bg-background">
                      <td colSpan={9} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                          <div>
                            <p className="text-xs text-mutedText">Seeker ID</p>
                            <p className="text-darkText">{t.seekerId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-mutedText">Provider ID</p>
                            <p className="text-darkText">{t.providerId}</p>
                          </div>
                          <div>
                            <p className="text-xs text-mutedText">
                              Escrow Fee Rate
                            </p>
                            <p className="text-darkText">
                              {ESCROW_FEE_RATE * 100}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-mutedText">Net to Provider</p>
                            <p className="text-darkText">
                              {formatKES(t.amount - t.fee)}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-mutedText">
                  No transactions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <p className="text-sm text-mutedText">{label}</p>
      <p className="mt-1 text-xl font-semibold text-darkText">{value}</p>
      {hint && <p className="mt-1 text-xs text-mutedText">{hint}</p>}
    </div>
  );
}
