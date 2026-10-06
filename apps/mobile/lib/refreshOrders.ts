import { transactionFromOrder } from "@localfind/shared";
import type { OrderRow } from "@localfind/shared";
import { apiRequest } from "./api";
import { useAppStore } from "../store/useAppStore";

// Loads the signed-in person's real orders into the app.
export async function refreshOrders() {
  const data = await apiRequest("/api/orders");
  useAppStore.setState({
    transactions: (data.items as OrderRow[]).map(transactionFromOrder),
  });
}
