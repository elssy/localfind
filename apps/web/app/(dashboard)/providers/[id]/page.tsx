"use client";

import { useState } from "react";
import { notFound } from "next/navigation";
import { BadgeCheck, MessageSquare, ShieldOff, ShieldCheck } from "lucide-react";
import {
  mockBids,
  tokenPurchases,
  reviews,
  tokenBundles,
  formatKES,
  ESCROW_FEE_RATE,
} from "@localfind/shared";
import StatusBadge from "../../../../components/StatusBadge";
import { formatDate } from "../../../../lib/format";
import { useAppData } from "../../../../context/AppDataContext";

export const dynamic = "force-dynamic";

export default function ProviderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { providers, transactions, setProviderStatus } = useAppData();
  const [messageSent, setMessageSent] = useState(false);

  const provider = providers.find((p) => p.id === params.id);
  if (!provider) notFound();

  const providerBids = mockBids.filter((b) => b.providerId === provider.id);
  const providerTransactions = transactions.filter(
    (t) => t.providerId === provider.id
  );
  const providerPurchases = tokenPurchases.filter(
    (tp) => tp.providerId === provider.id
  );
  const providerReviews = reviews.filter((r) => r.providerId === provider.id);

  const totalBids = providerBids.length;
  const jobsWon = providerTransactions.length;
  // Win rate: jobs won (transactions) as a share of bids submitted. When no bids exist
  // for this mock provider, fall back to a reasonable illustrative rate based on jobs won.
  const winRate =
    totalBids > 0
      ? Math.min(100, Math.round((jobsWon / totalBids) * 100))
      : jobsWon > 0
      ? 100
      : 0;
  const revenueGenerated = providerTransactions.reduce(
    (sum, t) => sum + t.fee,
    0
  );

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-darkText">
                {provider.name}
              </h2>
              {provider.verified && (
                <BadgeCheck size={18} className="text-primary" />
              )}
            </div>
            <p className="mt-1 text-sm text-mutedText">
              {provider.category} &middot; {provider.subcategory}
            </p>
            <p className="mt-1 text-xs text-mutedText">
              Joined {formatDate(provider.joinedAt)}
            </p>
          </div>
          <StatusBadge status={provider.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Bids Submitted" value={String(totalBids)} />
          <StatBlock label="Jobs Won" value={String(jobsWon)} />
          <StatBlock label="Win Rate" value={`${winRate}%`} />
          <StatBlock
            label="Revenue Generated"
            value={formatKES(revenueGenerated)}
          />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {provider.status === "pending" && (
            <button
              onClick={() => setProviderStatus(provider.id, "active")}
              className="flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              <ShieldCheck size={16} />
              Approve Verification
            </button>
          )}
          {provider.status !== "suspended" ? (
            <button
              onClick={() => setProviderStatus(provider.id, "suspended")}
              className="flex items-center gap-2 rounded-md border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10"
            >
              <ShieldOff size={16} />
              Suspend Account
            </button>
          ) : (
            <button
              onClick={() => setProviderStatus(provider.id, "active")}
              className="flex items-center gap-2 rounded-md border border-success px-4 py-2 text-sm font-medium text-success hover:bg-success/10"
            >
              <ShieldCheck size={16} />
              Reinstate Account
            </button>
          )}
          <button
            onClick={() => setMessageSent(true)}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-midText hover:border-primary hover:text-primary"
          >
            <MessageSquare size={16} />
            {messageSent ? "Message Sent" : "Send Message"}
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">Services</h3>
        <ul className="divide-y divide-border">
          {provider.services.map((s) => (
            <li key={s.name} className="flex justify-between py-2 text-sm">
              <span className="text-midText">{s.name}</span>
              <span className="font-medium text-darkText">
                {formatKES(s.price)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">
          Token Purchase History
        </h3>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-mutedText">
            <tr>
              <th className="py-2">Bundle</th>
              <th className="py-2">Tokens</th>
              <th className="py-2">Amount Paid</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {providerPurchases.map((tp) => {
              const bundle = tokenBundles.find((b) => b.id === tp.bundleId);
              return (
                <tr key={tp.id} className="border-t border-border">
                  <td className="py-2 text-midText">{bundle?.name ?? tp.bundleId}</td>
                  <td className="py-2 text-midText">{tp.tokens}</td>
                  <td className="py-2 text-midText">{formatKES(tp.amountPaid)}</td>
                  <td className="py-2 text-midText">{formatDate(tp.date)}</td>
                </tr>
              );
            })}
            {providerPurchases.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-mutedText">
                  No token purchases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">
          Reviews Received
        </h3>
        <ul className="space-y-3">
          {providerReviews.map((r) => (
            <li key={r.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-darkText">
                  {r.authorName}
                </span>
                <span className="text-xs text-mutedText">{r.rating} / 5</span>
              </div>
              <p className="mt-1 text-sm text-midText">{r.text}</p>
              <p className="mt-1 text-xs text-mutedText">{formatDate(r.date)}</p>
            </li>
          ))}
          {providerReviews.length === 0 && (
            <p className="text-sm text-mutedText">No reviews yet.</p>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">
          Escrow Transaction History
        </h3>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-mutedText">
            <tr>
              <th className="py-2">Service</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Fee ({ESCROW_FEE_RATE * 100}%)</th>
              <th className="py-2">Status</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {providerTransactions.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="py-2 text-midText">{t.service}</td>
                <td className="py-2 text-midText">{formatKES(t.amount)}</td>
                <td className="py-2 text-midText">{formatKES(t.fee)}</td>
                <td className="py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-2 text-midText">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
            {providerTransactions.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-mutedText">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs text-mutedText">{label}</p>
      <p className="mt-1 text-lg font-semibold text-darkText">{value}</p>
    </div>
  );
}
