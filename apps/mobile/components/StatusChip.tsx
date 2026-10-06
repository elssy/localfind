import React from "react";
import { COLORS } from "@localfind/shared";
import type { TransactionStatus } from "@localfind/shared";
import Badge from "./Badge";

const STATUS_CONFIG: Record<TransactionStatus, { label: string; color: string; bg: string }> = {
  pending: { label: "Awaiting payment", color: COLORS.warningAmber, bg: "#FBF3E7" },
  in_escrow: { label: "In Escrow", color: COLORS.escrowPurple, bg: "#EFEDFB" },
  released: { label: "Completed", color: COLORS.successGreen, bg: "#E5F6EF" },
  disputed: { label: "Disputed", color: COLORS.dangerRed, bg: "#FBEAEA" },
  refunded: { label: "Refunded", color: COLORS.mutedText, bg: "#F1F1F1" },
};

export default function StatusChip({ status }: { status: TransactionStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge label={config.label} color={config.color} backgroundColor={config.bg} />;
}
