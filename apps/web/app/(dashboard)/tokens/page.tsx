"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { Coins, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import {
  tokenPurchases,
  tokenBundles,
  tokenRevenueByWeek,
  formatKES,
  COLORS,
} from "@localfind/shared";
import { useAppData } from "../../../context/AppDataContext";
import StatsCard from "../../../components/StatsCard";
import { formatDate } from "../../../lib/format";

type Tab = "all" | "low-balance";

export default function TokensPage() {
  const { providers } = useAppData();
  const [tab, setTab] = useState<Tab>("all");
  const [notified, setNotified] = useState<Record<string, boolean>>({});

  const totalTokensSold = tokenPurchases.reduce((sum, tp) => sum + tp.tokens, 0);
  const revenueFromTokens = tokenPurchases.reduce(
    (sum, tp) => sum + tp.amountPaid,
    0
  );
  const distinctProviders = new Set(tokenPurchases.map((tp) => tp.providerId))
    .size;
  const avgTokensPerProvider =
    distinctProviders > 0
      ? Math.round(totalTokensSold / distinctProviders)
      : 0;

  const lowBalanceProviders = useMemo(
    () => providers.filter((p) => p.tokenBalance < 5),
    [providers]
  );

  function getProviderName(providerId: string) {
    return providers.find((p) => p.id === providerId)?.name ?? providerId;
  }

  function handleNotify(providerId: string) {
    setNotified((prev) => ({ ...prev, [providerId]: true }));
    window.alert(`Low-balance notification sent to ${getProviderName(providerId)}.`);
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Tokens Sold"
          value={totalTokensSold.toLocaleString()}
          icon={Coins}
        />
        <StatsCard
          label="Revenue from Tokens"
          value={formatKES(revenueFromTokens)}
          icon={TrendingUp}
        />
        <StatsCard
          label="Avg Tokens / Provider"
          value={String(avgTokensPerProvider)}
          icon={BarChart3}
        />
        <StatsCard
          label="Low Balance Alerts"
          value={String(lowBalanceProviders.length)}
          icon={AlertTriangle}
        />
      </div>

      <div className="rounded-lg border border-border bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold text-darkText">
          Token Revenue by Week
        </h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={tokenRevenueByWeek}>
            <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: COLORS.mutedText }} />
            <YAxis tick={{ fontSize: 11, fill: COLORS.mutedText }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={COLORS.primaryBlue}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-border bg-white">
        <div className="flex border-b border-border">
          <button
            onClick={() => setTab("all")}
            className={`px-5 py-3 text-sm font-medium ${
              tab === "all"
                ? "border-b-2 border-primary text-primary"
                : "text-mutedText"
            }`}
          >
            All Purchases
          </button>
          <button
            onClick={() => setTab("low-balance")}
            className={`px-5 py-3 text-sm font-medium ${
              tab === "low-balance"
                ? "border-b-2 border-primary text-primary"
                : "text-mutedText"
            }`}
          >
            Low Balance ({lowBalanceProviders.length})
          </button>
        </div>

        {tab === "all" ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-mutedText">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Bundle</th>
                <th className="px-4 py-3">Tokens</th>
                <th className="px-4 py-3">Amount Paid</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {tokenPurchases.map((tp) => {
                const bundle = tokenBundles.find((b) => b.id === tp.bundleId);
                return (
                  <tr key={tp.id} className="border-t border-border">
                    <td className="px-4 py-3 text-midText">
                      {getProviderName(tp.providerId)}
                    </td>
                    <td className="px-4 py-3 text-midText">
                      {bundle?.name ?? tp.bundleId}
                    </td>
                    <td className="px-4 py-3 text-midText">{tp.tokens}</td>
                    <td className="px-4 py-3 text-midText">
                      {formatKES(tp.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-midText">{formatDate(tp.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-background text-xs uppercase text-mutedText">
              <tr>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Token Balance</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lowBalanceProviders.map((p) => (
                <tr key={p.id} className="border-t border-border bg-warning/10">
                  <td className="px-4 py-3 font-medium text-darkText">{p.name}</td>
                  <td className="px-4 py-3 text-midText">{p.category}</td>
                  <td className="px-4 py-3 text-warning">{p.tokenBalance}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleNotify(p.id)}
                      className="rounded-md border border-warning px-3 py-1 text-xs font-medium text-warning hover:bg-warning/20"
                    >
                      {notified[p.id] ? "Notified" : "Notify"}
                    </button>
                  </td>
                </tr>
              ))}
              {lowBalanceProviders.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-mutedText">
                    No providers with low token balance.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
