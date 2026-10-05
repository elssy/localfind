"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, ShieldCheck, ShieldOff, ShieldX } from "lucide-react";
import { formatKES } from "@localfind/shared";
import StatusBadge from "../../../../components/StatusBadge";
import { formatDate } from "../../../../lib/format";
import {
  AdminApiError,
  adminFetch,
  describeError,
  type ProviderActionName,
  type ProviderDetail,
} from "../../../../lib/adminClient";

export const dynamic = "force-dynamic";

export default function ProviderDetailPage({ params }: { params: { id: string } }) {
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);

    adminFetch<ProviderDetail>(`/api/admin/providers/${params.id}`, { signal: controller.signal })
      .then((detail) => {
        setProvider(detail);
        setNotFound(false);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof AdminApiError && e.status === 404) setNotFound(true);
        else setError(describeError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [params.id, refreshKey]);

  async function runAction(action: ProviderActionName) {
    if (
      action === "suspend" &&
      !window.confirm("Suspend this provider? They will be signed out of the app straight away.")
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminFetch(`/api/admin/providers/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({ action }),
      });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p className="text-sm text-mutedText">Loading...</p>;

  if (notFound) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-darkText">This provider could not be found.</p>
        <Link href="/providers" className="text-sm text-primary hover:underline">
          Back to providers
        </Link>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="space-y-3">
        {error && (
          <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        )}
        <Link href="/providers" className="text-sm text-primary hover:underline">
          Back to providers
        </Link>
      </div>
    );
  }

  const { stats } = provider;
  const winRate =
    stats.bidsSubmitted > 0
      ? Math.min(100, Math.round((stats.jobsWon / stats.bidsSubmitted) * 100))
      : 0;
  const canApprove = provider.status === "pending" || provider.status === "rejected";

  return (
    <div className="space-y-6">
      <Link
        href="/providers"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <ArrowLeft size={14} />
        All providers
      </Link>

      {error && (
        <p role="alert" className="rounded-md bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="rounded-lg border border-border bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-darkText">{provider.businessName}</h2>
              {provider.verificationStatus === "verified" && (
                <BadgeCheck size={18} className="text-primary" aria-label="Verified" />
              )}
            </div>
            <p className="mt-1 text-sm text-mutedText">
              {provider.category}
              {provider.city ? ` · ${provider.city}` : ""}
            </p>
            <p className="mt-1 text-xs text-mutedText">Joined {formatDate(provider.createdAt)}</p>
          </div>
          <StatusBadge status={provider.status} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatBlock label="Bids Submitted" value={String(stats.bidsSubmitted)} />
          <StatBlock label="Jobs Won" value={String(stats.jobsWon)} />
          <StatBlock label="Win Rate" value={`${winRate}%`} />
          <StatBlock label="Fees Generated" value={formatKES(stats.feesGeneratedKES)} />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {canApprove && (
            <button
              disabled={busy}
              onClick={() => runAction("approve")}
              className="flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              <ShieldCheck size={16} />
              Approve Verification
            </button>
          )}
          {provider.status === "pending" && (
            <button
              disabled={busy}
              onClick={() => runAction("reject")}
              className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-midText hover:bg-background disabled:opacity-40"
            >
              <ShieldX size={16} />
              Reject
            </button>
          )}
          {provider.status === "suspended" ? (
            <button
              disabled={busy}
              onClick={() => runAction("reinstate")}
              className="flex items-center gap-2 rounded-md border border-success px-4 py-2 text-sm font-medium text-success hover:bg-success/10 disabled:opacity-40"
            >
              <ShieldCheck size={16} />
              Reinstate Account
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={() => runAction("suspend")}
              className="flex items-center gap-2 rounded-md border border-danger px-4 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-40"
            >
              <ShieldOff size={16} />
              Suspend Account
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-darkText">Owner</h3>
          <dl className="space-y-2 text-sm">
            <Row label="Name" value={provider.owner.name} />
            <Row
              label="Email"
              value={`${provider.owner.email}${provider.owner.emailVerified ? "" : " (not verified)"}`}
            />
            <Row label="Phone" value={provider.owner.phone} />
            <Row label="Account created" value={formatDate(provider.owner.createdAt)} />
          </dl>
        </div>

        <div className="rounded-lg border border-border bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold text-darkText">About the business</h3>
          <p className="whitespace-pre-line text-sm text-midText">
            {provider.bio?.trim() ? provider.bio : "No description added."}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-darkText">Token Purchase History</h3>
          <span className="text-sm text-mutedText">Balance: {provider.tokenBalance} tokens</span>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-mutedText">
            <tr>
              <th className="py-2">Bundle</th>
              <th className="py-2">Tokens</th>
              <th className="py-2">Amount Paid</th>
              <th className="py-2">Status</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {provider.tokenPurchases.map((tp) => (
              <tr key={tp.id} className="border-t border-border">
                <td className="py-2 text-midText">{tp.bundleName}</td>
                <td className="py-2 text-midText">{tp.tokensGranted}</td>
                <td className="py-2 text-midText">{formatKES(tp.amountPaidKES)}</td>
                <td className="py-2">
                  <StatusBadge status={tp.status} />
                </td>
                <td className="py-2 text-midText">{formatDate(tp.createdAt)}</td>
              </tr>
            ))}
            {provider.tokenPurchases.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-mutedText">
                  No token purchases yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">Reviews Received</h3>
        <ul className="space-y-3">
          {provider.reviews.map((r) => (
            <li key={r.id} className="border-b border-border pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-darkText">{r.authorName}</span>
                <span className="text-xs text-mutedText">{r.rating} / 5</span>
              </div>
              {r.comment && <p className="mt-1 text-sm text-midText">{r.comment}</p>}
              <p className="mt-1 text-xs text-mutedText">{formatDate(r.createdAt)}</p>
            </li>
          ))}
          {provider.reviews.length === 0 && (
            <p className="text-sm text-mutedText">No reviews yet.</p>
          )}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h3 className="mb-4 text-sm font-semibold text-darkText">Escrow Transaction History</h3>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-mutedText">
            <tr>
              <th className="py-2">Amount</th>
              <th className="py-2">Fee</th>
              <th className="py-2">Status</th>
              <th className="py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {provider.transactions.map((t) => (
              <tr key={t.id} className="border-t border-border">
                <td className="py-2 text-midText">{formatKES(t.amountKES)}</td>
                <td className="py-2 text-midText">{formatKES(t.feeKES)}</td>
                <td className="py-2">
                  <StatusBadge status={t.status} />
                </td>
                <td className="py-2 text-midText">{formatDate(t.createdAt)}</td>
              </tr>
            ))}
            {provider.transactions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-mutedText">
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-mutedText">{label}</dt>
      <dd className="text-right text-darkText">{value}</dd>
    </div>
  );
}
