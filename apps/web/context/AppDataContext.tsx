"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import {
  providers as initialProviders,
  transactions as initialTransactions,
  disputes as initialDisputes,
  type Provider,
  type Transaction,
  type Dispute,
  type ProviderStatus,
} from "@localfind/shared";

export type Resolution = "release" | "refund" | "split";

interface AppDataContextValue {
  providers: Provider[];
  transactions: Transaction[];
  disputes: Dispute[];
  setProviderStatus: (providerId: string, status: ProviderStatus) => void;
  resolveDispute: (
    disputeId: string,
    resolution: Resolution,
    splitPercent?: number
  ) => void;
}

const AppDataContext = createContext<AppDataContextValue | undefined>(
  undefined
);

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [providers, setProviders] = useState<Provider[]>(initialProviders);
  const [transactions, setTransactions] =
    useState<Transaction[]>(initialTransactions);
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);

  const setProviderStatus = (providerId: string, status: ProviderStatus) => {
    setProviders((prev) =>
      prev.map((p) => (p.id === providerId ? { ...p, status } : p))
    );
  };

  const resolveDispute = (
    disputeId: string,
    resolution: Resolution,
    splitPercent?: number
  ) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: "resolved" } : d))
    );

    setDisputes((prevDisputes) => {
      const dispute = prevDisputes.find((d) => d.id === disputeId);
      if (dispute) {
        setTransactions((prevTx) =>
          prevTx.map((t) => {
            if (t.id !== dispute.transactionId) return t;
            if (resolution === "release") return { ...t, status: "released" as const };
            if (resolution === "refund") return { ...t, status: "released" as const, service: t.service + " (refunded to seeker)" };
            if (resolution === "split")
              return {
                ...t,
                status: "released" as const,
                service: t.service + ` (split ${splitPercent ?? 50}% provider)`,
              };
            return t;
          })
        );
      }
      return prevDisputes;
    });
  };

  const value = useMemo(
    () => ({
      providers,
      transactions,
      disputes,
      setProviderStatus,
      resolveDispute,
    }),
    [providers, transactions, disputes]
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
