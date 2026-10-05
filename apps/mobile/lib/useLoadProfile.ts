import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import { providerFromProfile, seekerFromUser } from "@localfind/shared";
import { apiRequest, clearToken } from "./api";
import { useAppStore } from "../store/useAppStore";

type Role = "provider" | "seeker";

type LoadState =
  | { status: "loading" }
  | { status: "ready" }
  | { status: "error"; message: string };

// Loads the signed-in user's real profile from the server and puts it where the
// screens read it, so nobody sees another person's demo data. The screens only
// render once this reports "ready".
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
          useAppStore.setState({ currentProvider: providerFromProfile(data.profile) });
        } else {
          useAppStore.setState({ currentSeeker: seekerFromUser(data.user) });
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
