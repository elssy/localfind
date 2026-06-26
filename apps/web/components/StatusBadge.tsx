type BadgeTone = "success" | "warning" | "danger" | "primary" | "escrow" | "neutral";

const STATUS_TONE_MAP: Record<string, BadgeTone> = {
  active: "success",
  released: "success",
  resolved: "success",
  pending: "warning",
  pending_verification: "warning",
  under_review: "warning",
  open: "warning",
  in_escrow: "primary",
  new: "primary",
  suspended: "danger",
  disputed: "escrow",
  bid_sent: "primary",
  ignored: "neutral",
};

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success border border-success/30",
  warning: "bg-warning/10 text-warning border border-warning/30",
  danger: "bg-danger/10 text-danger border border-danger/30",
  primary: "bg-primary/10 text-primary border border-primary/30",
  escrow: "bg-escrow/10 text-escrow border border-escrow/30",
  neutral: "bg-mutedText/10 text-mutedText border border-mutedText/30",
};

const STATUS_LABEL_MAP: Record<string, string> = {
  active: "Active",
  pending: "Pending Verification",
  suspended: "Suspended",
  in_escrow: "In Escrow",
  released: "Released",
  disputed: "Disputed",
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  new: "New",
  bid_sent: "Bid Sent",
  ignored: "Ignored",
};

export default function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE_MAP[status] ?? "neutral";
  const label =
    STATUS_LABEL_MAP[status] ??
    status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  );
}
