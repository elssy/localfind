import * as SecureStore from "expo-secure-store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "session_token";

// Carries the HTTP status so callers can tell "not signed in" (401) apart from
// a network problem or a server error.
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiRequest(path: string, options: RequestInit = {}) {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error ?? "Request failed", res.status);
  return data;
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Signing out ends the session on the server as well as on this phone, so a copy
// of the token is useless afterwards. If the phone is offline the server step is
// skipped, but the token is still removed from the phone.
export async function signOut() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch {
    // Offline or already signed out. Nothing more to do on the server.
  }
  await clearToken();
}
