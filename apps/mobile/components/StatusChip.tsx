import React from "react";
import { COLORS } from "@localfind/shared";
import type { TransactionStatus } from "@localfind/shared";
import Badge from "./Badge";

const STATUS_CONFIG: Record<TransactionStatus, { label: string; color: string; bg: string }> = {
  in_escrow: { label: "In Escrow", color: COLORS.escrowPurple, bg: "#EFEDFB" },
  released: { label: "Completed", color: COLORS.successGreen, bg: "#E5F6EF" },
  disputed: { label: "Disputed", color: COLORS.dangerRed, bg: "#FBEAEA" },
};

export default function StatusChip({ status }: { status: TransactionStatus }) {
  const config = STATUS_CONFIG[status];
  return <Badge label={config.label} color={config.color} backgroundColor={config.bg} />;
}
