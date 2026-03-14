export type WalletEntryType =
  | "topup"
  | "topup_bonus"
  | "payment"
  | "refund"
  | "adjustment"
  | "expiry";

export type PaymentMethod = "wallet" | "card" | "cash" | "mixed";

export interface Wallet {
  id: string;
  customer_id: string;
  currency: "MYR" | "SGD";
  created_at: string;
  // balance is CALCULATED from ledger, never stored
}

export interface WalletLedgerEntry {
  id: string;
  wallet_id: string;
  entry_type: WalletEntryType;
  amount_cents: number; // positive = credit, negative = debit
  currency: "MYR" | "SGD";
  reference_type: string | null; // "booking", "topup", etc.
  reference_id: string | null;
  description: string;
  stripe_payment_intent_id: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  booking_id: string | null;
  outlet_id: string;
  payment_method: PaymentMethod;
  subtotal_cents: number;
  discount_cents: number;
  total_cents: number;
  currency: "MYR" | "SGD";
  status: "pending" | "completed" | "refunded" | "failed";
  receipt_url: string | null;
  created_at: string;
}
