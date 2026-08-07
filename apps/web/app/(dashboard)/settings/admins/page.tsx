"use client";

import { useEffect, useState } from "react";
import { UserPlus, Clock, Ban, CheckCircle2, Trash2 } from "lucide-react";

type Admin = { id: string; name: string; email: string; createdAt: string; disabled: boolean };
type Invite = { id: string; email: string; createdAt: string; expiresAt: string };

export default function AdminsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/invites");
    if (res.ok) {
      const data = await res.json();
      setAdmins(data.admins);
      setInvites(data.pendingInvites);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    const res = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send invite");
      return;
    }

    setMessage(`Invite sent to ${email}`);
    setEmail("");
    load();
  }

  async function handleToggleSuspend(admin: Admin) {
    setError(null);
    setActioningId(admin.id);
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "PATCH" });
    const data = await res.json().catch(() => ({}));
    setActioningId(null);

    if (!res.ok) {
      setError(data.error ?? "Could not update admin");
      return;
    }
    load();
  }

  async function handleDelete(admin: Admin) {
    if (!confirm(`Remove ${admin.name} (${admin.email}) as an admin? This can't be undone.`)) return;

    setError(null);
    setActioningId(admin.id);
    const res = await fetch(`/api/admin/admins/${admin.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    setActioningId(null);

    if (!res.ok) {
      setError(data.error ?? "Could not remove admin");
      return;
    }
    load();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-darkText">Invite a new admin</h2>
        <form onSubmit={handleInvite} className="flex gap-2">
          <input
            type="email"
            required
            placeholder="colleague@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            <UserPlus size={16} />
            Invite
          </button>
        </form>
        {message && <p className="mt-3 text-sm text-success">{message}</p>}
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {invites.length > 0 && (
        <div className="rounded-lg border border-border bg-white p-6">
          <h2 className="mb-4 text-sm font-semibold text-darkText">Pending invites</h2>
          <ul className="space-y-2">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center gap-2 text-sm text-mutedText">
                <Clock size={14} />
                {invite.email} — expires {new Date(invite.expiresAt).toLocaleDateString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-darkText">Current admins</h2>
        <ul className="space-y-3">
          {admins.map((admin) => (
            <li key={admin.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-darkText">{admin.name}</span>{" "}
                <span className="text-mutedText">— {admin.email}</span>
                {admin.disabled && (
                  <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                    Suspended
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleSuspend(admin)}
                  disabled={actioningId === admin.id}
                  className="flex items-center gap-1 text-xs text-mutedText hover:text-darkText disabled:opacity-50"
                >
                  {admin.disabled ? <CheckCircle2 size={14} /> : <Ban size={14} />}
                  {admin.disabled ? "Reactivate" : "Suspend"}
                </button>
                <button
                  onClick={() => handleDelete(admin)}
                  disabled={actioningId === admin.id}
                  className="flex items-center gap-1 text-xs text-mutedText hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}