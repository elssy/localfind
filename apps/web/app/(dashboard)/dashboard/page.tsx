"use client";

import { useEffect, useState } from "react";
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
  formatKES,
  COLORS,
} from "@localfind/shared";
import StatsCard from "../../../components/StatsCard";
import StatusBadge from "../../../components/StatusBadge";
import { formatRelativeTime } from "../../../lib/format";
import { adminFetch, describeError, type AdminStats } from "../../../lib/adminClient";

export const dynamic = "force-dynamic";

const PIE_COLORS = [COLORS.primaryBlue, COLORS.escrowPurple];

function SampleTag() {
  return (
    <span className="ml-2 rounded bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
      Sample data
    </span>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    adminFetch<AdminStats>("/api/admin/stats", { signal: controller.signal })
      .then(setStats)
      .catch((e) => {
        if (!controller.signal.aborted) setError(describeError(e));
      });
    return () => controller.abort();
  }, []);

  const value = (n: number | undefined) => (stats ? String(n ?? 0) : "...");

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label="Total Providers"
          value={value(stats?.totalProviders)}
          subtext={stats ? `+${stats.newProvidersLast30Days} in the last 30 days` : undefined}
          icon={Users}
        />
        <StatsCard
          label="Registered Seekers"
          value={value(stats?.totalSeekers)}
          icon={UserCheck}
        />
        <StatsCard
          label="Total Escrow Volume"
          value={stats ? formatKES(stats.escrowVolumeKES) : "..."}
          icon={ShieldCheck}
        />
        <StatsCard
          label="Revenue"
          value={stats ? formatKES(stats.revenueKES) : "..."}
          icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap gap-4">
            <Link
              href="/providers"
              className="flex-1 rounded-lg border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm text-mutedText">Pending Verifications</p>
              <p className="mt-1 text-xl font-semibold text-darkText">
                {value(stats?.pendingVerifications)}
              </p>
              <p className="mt-1 text-xs text-primary">Review providers &rarr;</p>
            </Link>
            <Link
              href="/disputes"
              className="flex-1 rounded-lg border border-border bg-white p-4 hover:border-primary"
            >
              <p className="text-sm text-mutedText">Open Disputes</p>
              <p className="mt-1 text-xl font-semibold text-darkText">
                {value(stats?.openDisputes)}
              </p>
              <p className="mt-1 text-xs text-primary">Resolve disputes &rarr;</p>
            </Link>
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-darkText">
              Daily Searches (30 days)
              <SampleTag />
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
                <SampleTag />
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
                  <Bar dataKey="percent" fill={COLORS.primaryBlue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-lg border border-border bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-darkText">
                Revenue Breakdown
                <SampleTag />
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
                      <Cell key={entry.source} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    {entry.source} ({entry.percent}%)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-darkText">Recent Sign Ups</h2>
          <ul className="space-y-4">
            {(stats?.recentSignups ?? []).map((person) => (
              <li key={person.id} className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-darkText">{person.name}</p>
                  <p className="text-xs text-mutedText">{formatRelativeTime(person.createdAt)}</p>
                </div>
                <StatusBadge status={person.role} />
              </li>
            ))}
            {stats && stats.recentSignups.length === 0 && (
              <li className="text-sm text-mutedText">No one has registered yet.</li>
            )}
            {!stats && !error && <li className="text-sm text-mutedText">Loading...</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
