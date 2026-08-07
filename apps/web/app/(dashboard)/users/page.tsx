"use client";

import { seekers, formatKES } from "@localfind/shared";
import { useAppData } from "../../../context/AppDataContext";

// Mock "Joined" dates since the shared Seeker type has no joinedAt field.
const MOCK_JOINED_DATES: Record<string, string> = {
  s1: "2024-03-10",
  s2: "2024-06-22",
};

export default function UsersPage() {
  const { transactions } = useAppData();

  function totalSpent(seekerId: string) {
    return transactions
      .filter((t) => t.seekerId === seekerId)
      .reduce((sum, t) => sum + t.amount, 0);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-background text-xs uppercase text-mutedText">
          <tr>
            <th className="px-4 py-3">Avatar</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Joined</th>
            <th className="px-4 py-3">Total Spent</th>
          </tr>
        </thead>
        <tbody>
          {seekers.map((s) => (
            <tr key={s.id} className="border-t border-border">
              <td className="px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primaryTint text-sm font-semibold text-primary">
                  {s.name.charAt(0)}
                </div>
              </td>
              <td className="px-4 py-3 font-medium text-darkText">{s.name}</td>
              <td className="px-4 py-3 text-midText">{s.phone}</td>
              <td className="px-4 py-3 text-midText">
                {MOCK_JOINED_DATES[s.id] ?? "—"}
              </td>
              <td className="px-4 py-3 text-midText">
                {formatKES(totalSpent(s.id))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
