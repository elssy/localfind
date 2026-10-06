import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import {
  providerFromProfile,
  providerFromPublic,
  seekerFromUser,
  transactionFromOrder,
} from "@localfind/shared";
import type { OrderRow, PublicProviderRow } from "@localfind/shared";
import { apiRequest, clearToken } from "./api";
import { useAppStore } from "../store/useAppStore";

type Role = "provider" | "seeker";

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

// Loads the signed-in user's real data from the server and puts it where the
// screens read it, so nobody sees demo data or another person's details. The
// screens only render once this reports "ready".
export function useLoadProfile(expectedRole: Role) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    (async () => {
      try {
        const data = await apiRequest("/api/profile/me");
        if (cancelled) return;

        if (data.role !== expectedRole) {
          if (data.role === "provider") {
            router.replace("/(provider)/dashboard");
          } else if (data.role === "seeker") {
            router.replace("/(seeker)");
          } else {
            await clearToken();
            router.replace("/(auth)/login");
          }
          return;
        }

        if (!data.hasProfile) {
          router.replace(
            expectedRole === "provider" ? "/(onboarding)/provider" : "/(onboarding)/seeker"
          );
          return;
        }

        if (expectedRole === "provider") {
          const orders = await apiRequest("/api/orders");
          if (cancelled) return;
          const me = providerFromProfile(data.profile);
          useAppStore.setState({
            currentProvider: me,
            providers: [me],
            transactions: (orders.items as OrderRow[]).map(transactionFromOrder),
            // Everything below used to be demo data. It is now empty until real activity exists.
            bids: [],
            searchAlerts: [],
            tokenPurchases: [],
          });
        } else {
          const [directory, orders] = await Promise.all([
            apiRequest("/api/providers?pageSize=100"),
            apiRequest("/api/orders"),
          ]);
          if (cancelled) return;
          useAppStore.setState({
            currentSeeker: seekerFromUser(data.user),
            providers: (directory.items as PublicProviderRow[]).map(providerFromPublic),
            transactions: (orders.items as OrderRow[]).map(transactionFromOrder),
            bids: [],
            searchAlerts: [],
            tokenPurchases: [],
          });
        }
        setState({ status: "ready" });
      } catch (e: any) {
        if (cancelled) return;
        if (e?.status === 401) {
          await clearToken();
          router.replace("/(auth)/login");
          return;
        }
        setState({ status: "error", message: e?.message ?? "Something went wrong" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expectedRole, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { state, retry };
}
