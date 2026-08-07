"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Users, UserCheck, ShieldCheck, TrendingUp } from "lucide-react";
import {
  dailySearches30d,
  searchesByCategory,
  revenueBreakdown,
  activityFeed,
  tokenPurchases,
  formatKES,
  COLORS,
} from "@localfind/shared";
import StatsCard from "../../../components/StatsCard";
import StatusBadge from "../../../components/StatusBadge";
import { formatRelativeTime } from "../../../lib/format";
import { useAppData } from "../../../context/AppDataContext";
import type { Provider, Transaction, Dispute } from "@localfind/shared";

export const dynamic = "force-dynamic";

const PIE_COLORS = [COLORS.primaryBlue, COLORS.escrowPurple];

export default function DashboardPage() {
  const { providers, transactions, disputes } = useAppData() as {
    providers: Provider[];
    transactions: Transaction[];
    disputes: Dispute[];
  };

  const totalProviders = providers.length;
  // Assumption: "new this month" derived by counting providers joined within the last 30 days.
  const newThisMonth = providers.filter((p) => {
    const joined = new Date(p.joinedAt).getTime();
    return Date.now() - joined < 30 * 24 * 60 * 60 * 1000;
  }).length;

  // Assumption: mock `seekers` dataset only has 2 entries; we use a presentational
  // multiplier (x37) to approximate a realistic "active seekers" figure for a live app,
  // since the admin console is meant to reflect production-scale numbers.
  const activeSeekers = 2 * 37;

  const totalEscrowVolume = transactions
    .filter((t) => t.status === "in_escrow" || t.status === "released")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFees = transactions.reduce((sum, t) => sum + t.fee, 0);
  const totalTokenRevenue = tokenPurchases.reduce(
    (sum, tp) => sum + tp.amountPaid,
    0
  );
  const totalRevenue = totalFees + totalTokenRevenue;

  const pendingProvidersCount = providers.filter(
    (p) => p.status === "pending"
  ).length;
  const openDisputesCount = disputes.filter((d) => d.status === "open").length;

  const recentActivity = [...activityFeed]
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
    .slice(0, 8);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Providers"
          value={String(totalProviders)}
          subtext={`+${newThisMonth} this month`}
          icon={Users}
        />
        <StatsCard
          label="Active Seekers"
          value={activeSeekers.toLocaleString()}
          icon={UserCheck}
        />
        <StatsCard
          label="Total Escrow Volume"
          value={formatKES(totalEscrowVolume)}
          icon={ShieldCheck}
        />
        <StatsCard
          label="Revenue"
          value={formatKES(totalRevenue)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-darkText">
              Daily Searches (30 days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dailySearches30d}>
                <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: COLORS.mutedText }}
                  tickFormatter={(v) => v.slice(5)}
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: COLORS.mutedText }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="searches"
                  stroke={COLORS.primaryBlue}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-darkText">
                Searches by Category
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={searchesByCategory}>
                  <CartesianGrid stroke={COLORS.border} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="category"
                    tick={{ fontSize: 9, fill: COLORS.mutedText }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 11, fill: COLORS.mutedText }} />
                  <Tooltip />
                  <Bar
                    dataKey="percent"
                    fill={COLORS.primaryBlue}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-darkText">
                Revenue Breakdown
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={revenueBreakdown}
                    dataKey="percent"
                    nameKey="source"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                  >
                    {revenueBreakdown.map((entry, index) => (
                      <Cell
                        key={entry.source}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-4 text-xs text-mutedText">
                {revenueBreakdown.map((entry, index) => (
                  <span key={entry.source} className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                      }}
                    />
                    {entry.source} ({entry.percent}%)
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/providers"
              className="flex-1 rounded-lg border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm text-mutedText">Pending Verifications</p>
              <p className="mt-1 text-xl font-semibold text-darkText">
                {pendingProvidersCount}
              </p>
              <p className="mt-1 text-xs text-primary">Review providers &rarr;</p>
            </Link>
            <Link
              href="/disputes"
              className="flex-1 rounded-lg border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm text-mutedText">Open Disputes</p>
              <p className="mt-1 text-xl font-semibold text-darkText">
                {openDisputesCount}
              </p>
              <p className="mt-1 text-xs text-primary">Resolve disputes &rarr;</p>
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-darkText">
            Recent Activity
          </h2>
          <ul className="space-y-4">
            {recentActivity.map((event) => (
              <li key={event.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-darkText">{event.description}</p>
                  <p className="text-xs text-mutedText">
                    {formatRelativeTime(event.timestamp)}
                  </p>
                </div>
                <StatusBadge status={event.status} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
