"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Login failed");
      return;
    }

    // Seekers and providers use the mobile app. If one signs in here, end that
    // session straight away so the admin area is never left open to them.
    const data = await res.json().catch(() => ({}));
    if (data?.user?.role !== "admin") {
      await fetch("/api/auth/logout", { method: "POST" });
      setLoading(false);
      setError("This area is for administrators only. Please use the Local Find app.");
      return;
    }

    setLoading(false);
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold">Admin sign in</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-gray-300 px-3 py-2"
        />
        <label className="mb-1 block text-sm font-medium">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-blue-600 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <div className="mb-4 text-right">
          <a href="/reset-password-request" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
      </form>
    </div>
  );
}