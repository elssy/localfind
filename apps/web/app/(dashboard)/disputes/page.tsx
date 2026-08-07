"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  seekers,
  formatKES,
  mockChatMessages,
  type Dispute,
} from "@localfind/shared";
import StatusBadge from "../../../components/StatusBadge";
import { formatDate, formatRelativeTime } from "../../../lib/format";
import { useAppData, type Resolution } from "../../../context/AppDataContext";

export default function DisputesPage() {
  const { disputes, providers, transactions, resolveDispute } = useAppData();
  const [activeDispute, setActiveDispute] = useState<Dispute | null>(null);
  const [splitPercent, setSplitPercent] = useState(50);

  function getSeekerName(seekerId: string) {
    return seekers.find((s) => s.id === seekerId)?.name ?? seekerId;
  }
  function getProviderName(providerId: string) {
    return providers.find((p) => p.id === providerId)?.name ?? providerId;
  }

  function handleResolve(resolution: Resolution) {
    if (!activeDispute) return;
    resolveDispute(
      activeDispute.id,
      resolution,
      resolution === "split" ? splitPercent : undefined
    );
    setActiveDispute(null);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {disputes.map((d) => {
          const transaction = transactions.find((t) => t.id === d.transactionId);
          return (
            <div
              key={d.id}
              className="rounded-lg border border-border bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-darkText">
                  {d.transactionId}
                </span>
                <StatusBadge status={transaction?.status === "disputed" ? d.status : "resolved"} />
              </div>
              <p className="mt-3 text-xs text-mutedText">Seeker</p>
              <p className="text-sm text-darkText">{getSeekerName(d.seekerId)}</p>
              <p className="mt-2 text-xs text-mutedText">Provider</p>
              <p className="text-sm text-darkText">{getProviderName(d.providerId)}</p>
              <p className="mt-2 text-xs text-mutedText">Disputed Amount</p>
              <p className="text-sm font-semibold text-darkText">
                {formatKES(d.amount)}
              </p>
              <p className="mt-2 text-xs text-mutedText">Reason</p>
              <p className="text-sm text-midText">{d.reason}</p>
              <p className="mt-2 text-xs text-mutedText">
                Raised {formatRelativeTime(d.createdAt)}
              </p>

              <button
                onClick={() => setActiveDispute(d)}
                disabled={d.status === "resolved"}
                className="mt-4 w-full rounded-md border border-primary py-2 text-sm font-medium text-primary hover:bg-primaryTint disabled:cursor-not-allowed disabled:opacity-40"
              >
                {d.status === "resolved" ? "Resolved" : "Review"}
              </button>
            </div>
          );
        })}
        {disputes.length === 0 && (
          <p className="text-sm text-mutedText">No disputes recorded.</p>
        )}
      </div>

      {activeDispute && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-darkText">
                Dispute {activeDispute.id}
              </h3>
              <button
                onClick={() => setActiveDispute(null)}
                className="text-mutedText hover:text-darkText"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <p className="text-midText">
                <span className="text-mutedText">Seeker:</span>{" "}
                {getSeekerName(activeDispute.seekerId)}
              </p>
              <p className="text-midText">
                <span className="text-mutedText">Provider:</span>{" "}
                {getProviderName(activeDispute.providerId)}
              </p>
              <p className="text-midText">
                <span className="text-mutedText">Amount:</span>{" "}
                {formatKES(activeDispute.amount)}
              </p>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 text-sm font-semibold text-darkText">
                Chat Transcript
              </h4>
              <div className="space-y-2 rounded-md bg-background p-3">
                {mockChatMessages(activeDispute.transactionId).map((m) => (
                  <div
                    key={m.id}
                    className={`max-w-[80%] rounded-md p-2 text-xs ${
                      m.sender === "provider"
                        ? "bg-primaryTint text-darkText"
                        : "ml-auto bg-white text-darkText border border-border"
                    }`}
                  >
                    <p>{m.text}</p>
                    <p className="mt-1 text-[10px] text-mutedText">
                      {formatRelativeTime(m.timestamp)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 text-sm font-semibold text-darkText">Timeline</h4>
              <ul className="space-y-2 text-xs text-midText">
                <li>
                  <span className="font-medium text-darkText">Created:</span>{" "}
                  {formatDate(activeDispute.createdAt)}
                </li>
                <li>
                  <span className="font-medium text-darkText">Under review:</span>{" "}
                  {activeDispute.status === "open" ? "Pending" : formatDate(activeDispute.createdAt)}
                </li>
                <li>
                  <span className="font-medium text-darkText">Resolved:</span>{" "}
                  {activeDispute.status === "resolved" ? formatDate(activeDispute.createdAt) : "Pending"}
                </li>
              </ul>
            </div>

            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-semibold text-darkText">Resolution</h4>
              <button
                onClick={() => handleResolve("release")}
                className="w-full rounded-md bg-success py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Release to Provider
              </button>
              <button
                onClick={() => handleResolve("refund")}
                className="w-full rounded-md bg-danger py-2 text-sm font-medium text-white hover:opacity-90"
              >
                Refund Seeker
              </button>
              <div className="flex items-center gap-2 rounded-md border border-border p-2">
                <span className="text-xs text-mutedText">Split (provider %)</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={splitPercent}
                  onChange={(e) => setSplitPercent(Number(e.target.value))}
                  className="w-16 rounded-md border border-border px-2 py-1 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={() => handleResolve("split")}
                  className="ml-auto rounded-md bg-escrow px-3 py-1 text-xs font-medium text-white hover:opacity-90"
                >
                  Apply Split
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
