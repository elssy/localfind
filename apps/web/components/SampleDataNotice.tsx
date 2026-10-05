"use client";

import { usePathname } from "next/navigation";
import { Info } from "lucide-react";

// These pages are not connected to real data yet. The notice stops anyone from
// mistaking the sample figures for real activity.
const SAMPLE_PATHS = ["/transactions", "/disputes", "/tokens"];

export default function SampleDataNotice() {
  const pathname = usePathname() ?? "";
  if (!SAMPLE_PATHS.some((path) => pathname.startsWith(path))) return null;

  return (
    <div
      role="status"
      className="flex items-start gap-2 border-b border-warning/30 bg-warning/10 px-8 py-3 text-sm text-warning"
    >
      <Info size={16} className="mt-0.5 shrink-0" />
      <span>
        Sample data. This page is not connected to real activity yet. Real transactions, disputes
        and token sales will appear here once bidding and payments are connected in the app.
      </span>
    </div>
  );
}
