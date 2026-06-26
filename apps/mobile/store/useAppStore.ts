import { create } from "zustand";
import {
  providers as initialProviders,
  transactions as initialTransactions,
  searchAlerts as initialSearchAlerts,
  mockBids as initialBids,
  tokenPurchases as initialTokenPurchases,
  seekers,
  tokenBundles,
} from "@localfind/shared";
import type {
  Provider,
  Transaction,
  SearchAlert,
  Bid,
  TokenPurchase,
  Seeker,
} from "@localfind/shared";
import { ESCROW_FEE_RATE } from "@localfind/shared";

let txCounter = 1000;
let bidCounter = 1000;
let purchaseCounter = 1000;

interface AppState {
  providers: Provider[];
  transactions: Transaction[];
  searchAlerts: SearchAlert[];
  bids: Bid[];
  tokenPurchases: TokenPurchase[];
  currentSeeker: Seeker;
  currentProvider: Provider;

  // bids
  addBid: (bid: Bid) => void;
  acceptBid: (bid: Bid, service: string) => Transaction;

  // transactions
  createTransaction: (params: {
    seekerId: string;
    providerId: string;
    amount: number;
    service: string;
  }) => Transaction;
  confirmDelivery: (transactionId: string) => void;
  raiseDispute: (transactionId: string) => void;

  // tokens
  purchaseTokenBundle: (bundleId: string) => void;

  // alerts
  submitBid: (alertId: string, amount: number, note: string) => void;
  ignoreAlert: (alertId: string) => void;

  // provider profile edits
  updateCurrentProvider: (patch: Partial<Provider>) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  providers: initialProviders.map((p) => ({ ...p })),
  transactions: initialTransactions.map((t) => ({ ...t })),
  searchAlerts: initialSearchAlerts.map((a) => ({ ...a })),
  bids: initialBids.map((b) => ({ ...b })),
  tokenPurchases: initialTokenPurchases.map((tp) => ({ ...tp })),
  currentSeeker: seekers[0],
  currentProvider: { ...initialProviders[0] },

  addBid: (bid) => set((state) => ({ bids: [...state.bids, bid] })),

  acceptBid: (bid, service) => {
    const tx = get().createTransaction({
      seekerId: get().currentSeeker.id,
      providerId: bid.providerId,
      amount: bid.amount,
      service,
    });
    return tx;
  },

  createTransaction: ({ seekerId, providerId, amount, service }) => {
    txCounter += 1;
    const fee = Math.round(amount * ESCROW_FEE_RATE);
    const tx: Transaction = {
      id: `t-new-${txCounter}`,
      seekerId,
      providerId,
      amount,
      fee,
      status: "in_escrow",
      service,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ transactions: [...state.transactions, tx] }));
    return tx;
  },

  confirmDelivery: (transactionId) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId ? { ...t, status: "released" } : t
      ),
    })),

  raiseDispute: (transactionId) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId ? { ...t, status: "disputed" } : t
      ),
    })),

  purchaseTokenBundle: (bundleId) => {
    const bundle = tokenBundles.find((b) => b.id === bundleId);
    if (!bundle) return;
    purchaseCounter += 1;
    const purchase: TokenPurchase = {
      id: `tp-new-${purchaseCounter}`,
      providerId: get().currentProvider.id,
      bundleId: bundle.id,
      tokens: bundle.alerts,
      amountPaid: bundle.price,
      date: new Date().toISOString(),
    };
    set((state) => {
      const updatedProvider: Provider = {
        ...state.currentProvider,
        tokenBalance: state.currentProvider.tokenBalance + bundle.alerts,
      };
      return {
        currentProvider: updatedProvider,
        providers: state.providers.map((p) =>
          p.id === updatedProvider.id ? updatedProvider : p
        ),
        tokenPurchases: [...state.tokenPurchases, purchase],
      };
    });
  },

  submitBid: (alertId, amount, note) => {
    const alert = get().searchAlerts.find((a) => a.id === alertId);
    if (!alert) return;
    bidCounter += 1;
    const bid: Bid = {
      id: `bid-new-${bidCounter}`,
      providerId: get().currentProvider.id,
      requestId: alertId,
      amount,
      note,
      eta: "30 min",
      submittedAt: new Date().toISOString(),
    };
    set((state) => {
      const updatedProvider: Provider = {
        ...state.currentProvider,
        tokenBalance: Math.max(0, state.currentProvider.tokenBalance - 1),
      };
      return {
        bids: [...state.bids, bid],
        currentProvider: updatedProvider,
        providers: state.providers.map((p) =>
          p.id === updatedProvider.id ? updatedProvider : p
        ),
        searchAlerts: state.searchAlerts.map((a) =>
          a.id === alertId ? { ...a, status: "bid_sent" } : a
        ),
      };
    });
  },

  ignoreAlert: (alertId) =>
    set((state) => ({
      searchAlerts: state.searchAlerts.map((a) =>
        a.id === alertId ? { ...a, status: "ignored" } : a
      ),
    })),

  updateCurrentProvider: (patch) =>
    set((state) => {
      const updatedProvider = { ...state.currentProvider, ...patch };
      return {
        currentProvider: updatedProvider,
        providers: state.providers.map((p) =>
          p.id === updatedProvider.id ? updatedProvider : p
        ),
      };
    }),
}));
