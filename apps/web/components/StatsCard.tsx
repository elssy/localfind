import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
}

export default function StatsCard({ label, value, subtext, icon: Icon }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-white p-5 flex items-start justify-between">
      <div>
        <p className="text-sm text-mutedText">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-darkText">{value}</p>
        {subtext && <p className="mt-1 text-xs text-success">{subtext}</p>}
      </div>
      <div className="rounded-md bg-primaryTint p-2 text-primary">
        <Icon size={20} />
      </div>
    </div>
  );
}
