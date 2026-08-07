"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { ESCROW_FEE_RATE, ALERT_COST_PER_TOKEN_KES, CATEGORIES } from "@localfind/shared";

export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const [escrowFeePercent, setEscrowFeePercent] = useState(
    ESCROW_FEE_RATE * 100
  );
  const [alertCost, setAlertCost] = useState(ALERT_COST_PER_TOKEN_KES);
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(CATEGORIES.map((c) => [c.name, true])) as Record<
        string,
        boolean
      >
  );
  const [smsAlertsEnabled, setSmsAlertsEnabled] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  function toggleCategory(name: string) {
    setActiveCategories((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function handleSave() {
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-6">
      {showSaved && (
        <div className="flex items-center gap-2 rounded-md border border-success bg-success/10 px-4 py-3 text-sm text-success">
          <Check size={16} />
          Settings saved successfully.
        </div>
      )}

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-darkText">Escrow & Fees</h2>
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="text-mutedText">Escrow Fee Rate (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={escrowFeePercent}
              onChange={(e) => setEscrowFeePercent(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
          <label className="block text-sm">
            <span className="text-mutedText">Alert Cost per Token (KES)</span>
            <input
              type="number"
              min={0}
              value={alertCost}
              onChange={(e) => setAlertCost(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-darkText">
          Active Categories
        </h2>
        <ul className="space-y-3">
          {CATEGORIES.map((c) => (
            <li key={c.name} className="flex items-center justify-between">
              <span className="text-sm text-midText">{c.name}</span>
              <button
                onClick={() => toggleCategory(c.name)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  activeCategories[c.name] ? "bg-primary" : "bg-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                    activeCategories[c.name] ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg border border-border bg-white p-6">
        <h2 className="mb-4 text-sm font-semibold text-darkText">
          Notification Settings
        </h2>
        <div className="flex items-center justify-between">
          <span className="text-sm text-midText">SMS Alerts</span>
          <button
            onClick={() => setSmsAlertsEnabled((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              smsAlertsEnabled ? "bg-primary" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                smsAlertsEnabled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
      >
        Save Settings
      </button>
    </div>
  );
}
